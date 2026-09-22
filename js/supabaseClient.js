/**
 * Supabase Client & Storage Service for PromptHub
 * Works seamlessly in both HTTP environments and local file:// previews.
 */

(function (root) {
  const CONFIG = root.CONFIG || {};

  // Detect if user has provided real Supabase credentials
  function isSupabaseConfigured() {
    return Boolean(
      CONFIG.SUPABASE_URL &&
      CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
      !CONFIG.SUPABASE_URL.includes('example.com') &&
      CONFIG.SUPABASE_ANON_KEY &&
      CONFIG.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
      CONFIG.SUPABASE_ANON_KEY.length > 20
    );
  }

  // Local storage key for offline/demo admin edits
  const LOCAL_STORAGE_KEY = 'prompthub_local_prompts';

  function getLocalPrompts() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p) => String(p.id)));
          let hasNew = false;
          if (Array.isArray(CONFIG.SEED_PROMPTS)) {
            CONFIG.SEED_PROMPTS.forEach((seed) => {
              if (!existingIds.has(String(seed.id))) {
                parsed.push(seed);
                hasNew = true;
              }
            });
          }
          if (hasNew) {
            saveLocalPrompts(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read from localStorage:', err);
    }
    // Initialize with seed prompts
    const initial = Array.isArray(CONFIG.SEED_PROMPTS) ? [...CONFIG.SEED_PROMPTS] : [];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  }

  function saveLocalPrompts(prompts) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }

  // Global Supabase client holder
  let supabaseClientInstance = null;

  function getSupabaseClient() {
    if (supabaseClientInstance) {
      return supabaseClientInstance;
    }

    if (isSupabaseConfigured() && root.supabase && root.supabase.createClient) {
      try {
        supabaseClientInstance = root.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
        return supabaseClientInstance;
      } catch (err) {
        console.error('Error creating Supabase client:', err);
      }
    }

    return null;
  }

  // ==========================================
  // DATA OPERATIONS (Public & Admin)
  // ==========================================

  async function getPrompts() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase getPrompts query failed, using local/seed fallback:', error.message);
          return getLocalPrompts();
        }

        if (data && data.length > 0) {
          return data;
        }
        // If table is empty on real Supabase, return seed prompts
        return CONFIG.SEED_PROMPTS || [];
      } catch (err) {
        console.warn('Supabase connection failed, falling back to local/seed data:', err);
        return getLocalPrompts();
      }
    }

    // Fallback to local storage or seed
    return getLocalPrompts();
  }

  async function getPromptById(id) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('prompts')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Error fetching prompt from Supabase:', err);
      }
    }

    const list = getLocalPrompts();
    return list.find((p) => String(p.id) === String(id)) || null;
  }

  async function createPrompt(promptData) {
    const newPrompt = {
      title: promptData.title.trim(),
      category: promptData.category.trim(),
      prompt_text: promptData.prompt_text.trim(),
      images: Array.isArray(promptData.images) ? promptData.images : [],
      is_paid: Boolean(promptData.is_paid),
      created_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('prompts')
        .insert([newPrompt])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback preview mode
    newPrompt.id = 'demo-' + Date.now();
    const list = getLocalPrompts();
    list.unshift(newPrompt);
    saveLocalPrompts(list);
    return newPrompt;
  }

  async function updatePrompt(id, updates) {
    const cleanUpdates = {
      title: updates.title?.trim(),
      category: updates.category?.trim(),
      prompt_text: updates.prompt_text?.trim(),
      images: Array.isArray(updates.images) ? updates.images : [],
      is_paid: Boolean(updates.is_paid),
    };

    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('prompts')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback preview mode
    const list = getLocalPrompts();
    const idx = list.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cleanUpdates };
      saveLocalPrompts(list);
      return list[idx];
    }
    throw new Error('Prompt not found');
  }

  async function deletePrompt(id) {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('prompts').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    // Fallback preview mode
    const list = getLocalPrompts();
    const filtered = list.filter((p) => String(p.id) !== String(id));
    saveLocalPrompts(filtered);
    return true;
  }

  async function uploadPromptImage(file) {
    const client = getSupabaseClient();
    if (client) {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${cleanFileName}`;

      const { error: uploadError } = await client.storage
        .from('prompt-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data } = client.storage.from('prompt-images').getPublicUrl(filePath);
      return data.publicUrl;
    }

    // Fallback preview mode: convert to object URL or base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function seedSupabasePrompts() {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client is not configured.');
    }

    const { data: existing, error: checkErr } = await client
      .from('prompts')
      .select('id')
      .limit(1);

    if (checkErr) throw checkErr;

    if (existing && existing.length > 0) {
      return { seeded: false, message: 'Database already has prompts. Seed skipped.' };
    }

    const { data, error } = await client
      .from('prompts')
      .insert(CONFIG.SEED_PROMPTS)
      .select();

    if (error) throw error;
    return { seeded: true, count: data.length };
  }

  // ==========================================
  // AUTHENTICATION (Admin Panel)
  // ==========================================

  async function loginAdmin(email, password) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    }

    // Demo preview auth mode
    if (email && password) {
      const demoUser = {
        id: 'demo-admin-id',
        email: email,
        role: 'authenticated',
        user_metadata: { name: 'Demo Administrator' }
      };
      sessionStorage.setItem('prompthub_demo_session', JSON.stringify(demoUser));
      return { user: demoUser, session: { user: demoUser } };
    }
    throw new Error('Please enter valid admin credentials.');
  }

  async function logoutAdmin() {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
    sessionStorage.removeItem('prompthub_demo_session');
  }

  async function getCurrentAdmin() {
    const client = getSupabaseClient();
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      return session ? session.user : null;
    }

    // Fallback demo session
    const demoSession = sessionStorage.getItem('prompthub_demo_session');
    if (demoSession) {
      try {
        return JSON.parse(demoSession);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Realtime Live Subscription (Supabase WebSockets + Cross-tab local sync)
  function subscribeToPrompts(callback) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const channel = client
          .channel('public:prompts')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'prompts' },
            (payload) => {
              console.log('⚡ Realtime prompt change received:', payload);
              if (typeof callback === 'function') {
                callback(payload);
              }
            }
          )
          .subscribe();
        return channel;
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    // Cross-tab fallback for preview mode / local edits
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_STORAGE_KEY && typeof callback === 'function') {
        callback({ eventType: 'LOCAL_SYNC' });
      }
    });

    return null;
  }

  // Expose API
  root.PromptHubDB = {
    isSupabaseConfigured,
    getPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    uploadPromptImage,
    seedSupabasePrompts,
    loginAdmin,
    logoutAdmin,
    getCurrentAdmin,
    subscribeToPrompts
  };
})(typeof window !== 'undefined' ? window : this);
