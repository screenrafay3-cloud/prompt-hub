/**
 * PromptHub Admin Panel Controller
 * Handles Supabase Authentication, Dashboard Metrics, Multi-file Image Uploads to Supabase Storage, and Prompt CRUD.
 * Compatible with both file:// and HTTP servers.
 */

(function () {
  function getConfig() {
    return window.CONFIG || {
      SITE_NAME: 'PromptHub',
      SEED_PROMPTS: []
    };
  }

  function getDB() {
    return window.PromptHubDB || {
      isSupabaseConfigured: () => false,
      getPrompts: async () => getConfig().SEED_PROMPTS || [],
      createPrompt: async (p) => p,
      updatePrompt: async (id, p) => p,
      deletePrompt: async (id) => true,
      uploadPromptImage: async (file) => URL.createObjectURL(file),
      loginAdmin: async (email, pass) => ({ user: { email } }),
      logoutAdmin: async () => {},
      getCurrentAdmin: async () => null,
      seedSupabasePrompts: async () => ({ seeded: false, message: 'DB client ready' })
    };
  }

  // Application State
  const state = {
    adminUser: null,
    prompts: [],
    filteredPrompts: [],
    searchQuery: '',
    editingPromptId: null,
    deletePromptId: null,
    formImages: []
  };

  // DOM Elements - Auth & Nav
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const adminUserEmail = document.getElementById('adminUserEmail');
  const btnLogout = document.getElementById('btnLogout');
  const loginHelperNotice = document.getElementById('loginHelperNotice');

  // DOM Elements - Dashboard Stats
  const dashTotalPrompts = document.getElementById('dashTotalPrompts');
  const dashFreePrompts = document.getElementById('dashFreePrompts');
  const dashProPrompts = document.getElementById('dashProPrompts');
  const dashCategoriesCount = document.getElementById('dashCategoriesCount');

  // DOM Elements - Table & Actions
  const adminSearchInput = document.getElementById('adminSearchInput');
  const btnSeedDatabase = document.getElementById('btnSeedDatabase');
  const btnOpenNewPrompt = document.getElementById('btnOpenNewPrompt');
  const adminTableBody = document.getElementById('adminTableBody');

  // DOM Elements - Prompt Form Modal
  const promptFormModal = document.getElementById('promptFormModal');
  const modalFormTitle = document.getElementById('modalFormTitle');
  const btnClosePromptModal = document.getElementById('btnClosePromptModal');
  const btnCancelPrompt = document.getElementById('btnCancelPrompt');
  const promptForm = document.getElementById('promptForm');
  const promptEditId = document.getElementById('promptEditId');
  const promptTitle = document.getElementById('promptTitle');
  const promptCategory = document.getElementById('promptCategory');
  const promptIsPaid = document.getElementById('promptIsPaid');
  const promptText = document.getElementById('promptText');
  const promptCharCount = document.getElementById('promptCharCount');
  const btnSavePrompt = document.getElementById('btnSavePrompt');
  const savePromptBtnText = document.getElementById('savePromptBtnText');

  // Image Uploader Elements
  const uploadDropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('fileInput');
  const uploadThumbsGrid = document.getElementById('uploadThumbsGrid');
  const externalImageUrl = document.getElementById('externalImageUrl');
  const btnAddExternalUrl = document.getElementById('btnAddExternalUrl');

  // Delete Modal Elements
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  const btnCancelDelete = document.getElementById('btnCancelDelete');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  const toastContainer = document.getElementById('toastContainer');

  const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  async function initAdmin() {
    setupEventListeners();

    const db = getDB();
    const cfg = getConfig();

    if (db.isSupabaseConfigured() && loginHelperNotice) {
      loginHelperNotice.innerHTML = `<span>🔒 Connected to Supabase (<code>${cfg.SUPABASE_URL}</code>). Log in with your registered admin credentials.</span>`;
    }

    // Check auth status
    try {
      const user = await db.getCurrentAdmin();
      if (user) {
        showDashboard(user);
      } else {
        showLogin();
      }
    } catch (err) {
      console.warn('Auth check error:', err);
      showLogin();
    }
  }

  // ==============================================================================
  // AUTHENTICATION LOGIC
  // ==============================================================================

  function showLogin() {
    state.adminUser = null;
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }

  function showDashboard(user) {
    state.adminUser = user;
    if (adminUserEmail) adminUserEmail.textContent = user.email || 'Admin User';
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';

    loadDashboardData();

    // ⚡ Realtime live update in admin
    const db = getDB();
    if (typeof db.subscribeToPrompts === 'function' && !state.hasSubscribed) {
      state.hasSubscribed = true;
      db.subscribeToPrompts(async () => {
        await loadDashboardData();
      });
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showToast('Please enter both email and password.', 'info');
      return;
    }

    try {
      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = true;
        btnLoginSubmit.innerHTML = `<span>Signing In...</span>`;
      }

      const db = getDB();
      const { user } = await db.loginAdmin(email, password);
      showToast('Signed in successfully!', 'success');
      showDashboard(user);
    } catch (err) {
      console.error('Login error:', err);
      showToast(err.message || 'Invalid credentials. Please check your Supabase Auth settings.', 'info');
    } finally {
      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerHTML = `<span>Sign In to Admin</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    }
  }

  async function handleLogout() {
    try {
      const db = getDB();
      await db.logoutAdmin();
      showToast('Logged out successfully.', 'info');
      showLogin();
    } catch (err) {
      console.error('Logout error:', err);
      showLogin();
    }
  }

  // ==============================================================================
  // DASHBOARD DATA & CRUD
  // ==============================================================================

  async function loadDashboardData() {
    renderTableLoading();
    try {
      const db = getDB();
      state.prompts = await db.getPrompts();
      updateDashboardMetrics();
      applyAdminFilter();
    } catch (err) {
      console.error('Failed to load prompts for admin:', err);
      showToast('Could not load prompts list.', 'info');
    }
  }

  function updateDashboardMetrics() {
    const total = state.prompts.length;
    const free = state.prompts.filter((p) => !p.is_paid).length;
    const pro = state.prompts.filter((p) => p.is_paid).length;
    const cats = new Set(state.prompts.map((p) => (p.category || '').trim()).filter(Boolean));

    if (dashTotalPrompts) dashTotalPrompts.textContent = total;
    if (dashFreePrompts) dashFreePrompts.textContent = free;
    if (dashProPrompts) dashProPrompts.textContent = pro;
    if (dashCategoriesCount) dashCategoriesCount.textContent = cats.size;
  }

  function applyAdminFilter() {
    const query = state.searchQuery.toLowerCase().trim();
    if (!query) {
      state.filteredPrompts = [...state.prompts];
    } else {
      state.filteredPrompts = state.prompts.filter((p) => {
        return (
          (p.title || '').toLowerCase().includes(query) ||
          (p.category || '').toLowerCase().includes(query) ||
          (p.prompt_text || '').toLowerCase().includes(query)
        );
      });
    }
    renderAdminTable();
  }

  function renderAdminTable() {
    if (!adminTableBody) return;

    if (state.filteredPrompts.length === 0) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            No prompts found. Click "+ Add New Prompt" or "Seed Sample Data" above to create one.
          </td>
        </tr>
      `;
      return;
    }

    adminTableBody.innerHTML = state.filteredPrompts.map((p) => {
      const isPro = Boolean(p.is_paid);
      const thumbUrl = (p.images && p.images.length > 0) ? p.images[0] : DEFAULT_THUMB;
      const dateFormatted = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

      return `
        <tr data-id="${escapeHtml(String(p.id))}">
          <td>
            <img src="${escapeHtml(thumbUrl)}" alt="Thumb" class="table-thumb" onerror="this.src='${DEFAULT_THUMB}'">
          </td>
          <td>
            <div class="table-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">
              ${(p.prompt_text || '').substring(0, 45)}...
            </div>
          </td>
          <td>
            <span class="table-cat-badge">${escapeHtml(p.category || 'General')}</span>
          </td>
          <td>
            <span class="table-tier-badge ${isPro ? 'tier-pro' : 'tier-free'}">
              ${isPro ? 'PRO' : 'FREE'}
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 0.82rem;">${dateFormatted}</td>
          <td>
            <div class="table-actions" style="justify-content: flex-end;">
              <button class="btn-action-icon btn-edit-prompt" title="Edit Prompt" data-id="${escapeHtml(String(p.id))}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action-icon delete btn-delete-prompt" title="Delete Prompt" data-id="${escapeHtml(String(p.id))}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row action handlers
    adminTableBody.querySelectorAll('.btn-edit-prompt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const found = state.prompts.find((p) => String(p.id) === String(id));
        if (found) openPromptModal(found);
      });
    });

    adminTableBody.querySelectorAll('.btn-delete-prompt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const found = state.prompts.find((p) => String(p.id) === String(id));
        if (found) openDeleteModal(found);
      });
    });
  }

  function renderTableLoading() {
    if (!adminTableBody) return;
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Loading prompts data...
        </td>
      </tr>
    `;
  }

  // ==============================================================================
  // ADD / EDIT MODAL & IMAGE UPLOADER
  // ==============================================================================

  function openPromptModal(prompt = null) {
    state.editingPromptId = prompt ? prompt.id : null;
    state.formImages = [];

    if (modalFormTitle) {
      modalFormTitle.textContent = prompt ? 'Edit Master Prompt' : 'Add New Master Prompt';
    }

    if (savePromptBtnText) {
      savePromptBtnText.textContent = prompt ? 'Save Changes' : 'Publish Instantly';
    }

    if (prompt) {
      promptEditId.value = prompt.id;
      promptTitle.value = prompt.title || '';
      promptCategory.value = prompt.category || '';
      promptIsPaid.checked = Boolean(prompt.is_paid);
      promptText.value = prompt.prompt_text || '';

      // Load existing image URLs
      if (Array.isArray(prompt.images)) {
        prompt.images.forEach((url) => {
          state.formImages.push({ isNewFile: false, url });
        });
      }
    } else {
      promptForm.reset();
      promptEditId.value = '';
      promptIsPaid.checked = false;
    }

    updateCharCount();
    renderFormImagesGrid();

    if (promptFormModal) {
      promptFormModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePromptModal() {
    if (promptFormModal) {
      promptFormModal.classList.remove('open');
      document.body.style.overflow = '';
    }
    state.editingPromptId = null;
    state.formImages = [];
  }

  function updateCharCount() {
    if (promptCharCount && promptText) {
      const chars = promptText.value.length;
      const words = promptText.value.trim().split(/\s+/).filter(Boolean).length;
      promptCharCount.textContent = `${chars} chars • ${words} words`;
    }
  }

  function addImageFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} is not an image file.`, 'info');
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      state.formImages.push({
        isNewFile: true,
        url: previewUrl,
        file: file
      });
    }
    renderFormImagesGrid();
  }

  function renderFormImagesGrid() {
    if (!uploadThumbsGrid) return;

    if (state.formImages.length === 0) {
      uploadThumbsGrid.innerHTML = ``;
      return;
    }

    uploadThumbsGrid.innerHTML = state.formImages.map((imgItem, index) => {
      return `
        <div class="upload-thumb-card" data-index="${index}">
          <img src="${escapeHtml(imgItem.url)}" alt="Upload preview">
          <button type="button" class="upload-thumb-remove" data-index="${index}" title="Remove image">&times;</button>
        </div>
      `;
    }).join('');

    uploadThumbsGrid.querySelectorAll('.upload-thumb-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        state.formImages.splice(idx, 1);
        renderFormImagesGrid();
      });
    });
  }

  async function handlePromptFormSubmit(e) {
    e.preventDefault();

    const title = promptTitle.value.trim();
    const category = promptCategory.value.trim();
    const prompt_text = promptText.value.trim();
    const is_paid = promptIsPaid.checked;

    if (!title || !category || !prompt_text) {
      showToast('Please fill in all required fields.', 'info');
      return;
    }

    try {
      if (btnSavePrompt) {
        btnSavePrompt.disabled = true;
        if (savePromptBtnText) savePromptBtnText.textContent = 'Uploading & Saving...';
      }

      const db = getDB();

      const finalImageUrls = [];
      for (const item of state.formImages) {
        if (item.isNewFile && item.file) {
          showToast(`Uploading image ${item.file.name}...`, 'info');
          const uploadedUrl = await db.uploadPromptImage(item.file);
          finalImageUrls.push(uploadedUrl);
        } else if (item.url) {
          finalImageUrls.push(item.url);
        }
      }

      const payload = {
        title,
        category,
        prompt_text,
        images: finalImageUrls,
        is_paid
      };

      if (state.editingPromptId) {
        await db.updatePrompt(state.editingPromptId, payload);
        showToast('Prompt updated successfully! Published live.', 'success');
      } else {
        await db.createPrompt(payload);
        showToast('Prompt published live to the public site!', 'success');
      }

      closePromptModal();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to save prompt:', err);
      showToast(`Error saving prompt: ${err.message || err}`, 'info');
    } finally {
      if (btnSavePrompt) {
        btnSavePrompt.disabled = false;
        if (savePromptBtnText) {
          savePromptBtnText.textContent = state.editingPromptId ? 'Save Changes' : 'Publish Instantly';
        }
      }
    }
  }

  // ==============================================
  // DELETE PROMPT MODAL
  // ==============================================

  function openDeleteModal(prompt) {
    state.deletePromptId = prompt.id;
    if (deleteConfirmText) {
      deleteConfirmText.innerHTML = `Are you sure you want to delete <strong>"${escapeHtml(prompt.title)}"</strong>? This will remove it from the live catalog immediately.`;
    }
    if (deleteConfirmModal) {
      deleteConfirmModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDeleteModal() {
    if (deleteConfirmModal) {
      deleteConfirmModal.classList.remove('open');
      document.body.style.overflow = '';
    }
    state.deletePromptId = null;
  }

  async function handleConfirmDelete() {
    if (!state.deletePromptId) return;

    try {
      if (btnConfirmDelete) {
        btnConfirmDelete.disabled = true;
        btnConfirmDelete.textContent = 'Deleting...';
      }

      const db = getDB();
      await db.deletePrompt(state.deletePromptId);
      showToast('Prompt deleted successfully.', 'success');
      closeDeleteModal();
      await loadDashboardData();
    } catch (err) {
      console.error('Delete error:', err);
      showToast(`Delete failed: ${err.message || err}`, 'info');
    } finally {
      if (btnConfirmDelete) {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.textContent = 'Delete Prompt';
      }
    }
  }

  async function handleSeedDatabase() {
    if (!confirm('Would you like to seed initial sample master prompts into your database?')) {
      return;
    }

    try {
      if (btnSeedDatabase) {
        btnSeedDatabase.disabled = true;
        btnSeedDatabase.innerHTML = `<span>Seeding...</span>`;
      }

      const db = getDB();
      const res = await db.seedSupabasePrompts();
      if (res.seeded) {
        showToast(`Successfully seeded ${res.count} sample prompts!`, 'success');
      } else {
        showToast(res.message, 'info');
      }
      await loadDashboardData();
    } catch (err) {
      console.error('Seed error:', err);
      showToast(`Seed failed: ${err.message || err}`, 'info');
    } finally {
      if (btnSeedDatabase) {
        btnSeedDatabase.disabled = false;
        btnSeedDatabase.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Seed Sample Data</span>
        `;
      }
    }
  }

  // ==============================================
  // EVENT LISTENERS SETUP
  // ==============================================

  function setupEventListeners() {
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    if (adminSearchInput) {
      adminSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        applyAdminFilter();
      });
    }

    if (btnSeedDatabase) btnSeedDatabase.addEventListener('click', handleSeedDatabase);
    if (btnOpenNewPrompt) btnOpenNewPrompt.addEventListener('click', () => openPromptModal());

    if (btnClosePromptModal) btnClosePromptModal.addEventListener('click', closePromptModal);
    if (btnCancelPrompt) btnCancelPrompt.addEventListener('click', closePromptModal);

    if (promptForm) promptForm.addEventListener('submit', handlePromptFormSubmit);
    if (promptText) promptText.addEventListener('input', updateCharCount);

    if (uploadDropzone && fileInput) {
      uploadDropzone.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          addImageFiles(e.target.files);
          fileInput.value = '';
        }
      });

      ['dragenter', 'dragover'].forEach((eventName) => {
        uploadDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          uploadDropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        uploadDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          uploadDropzone.classList.remove('dragover');
        });
      });

      uploadDropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files) {
          addImageFiles(e.dataTransfer.files);
        }
      });
    }

    if (btnAddExternalUrl && externalImageUrl) {
      btnAddExternalUrl.addEventListener('click', () => {
        const url = externalImageUrl.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          showToast('Please enter a valid HTTP or HTTPS image URL.', 'info');
          return;
        }
        state.formImages.push({ isNewFile: false, url });
        renderFormImagesGrid();
        externalImageUrl.value = '';
      });
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    if (promptFormModal) {
      promptFormModal.addEventListener('click', (e) => {
        if (e.target === promptFormModal) closePromptModal();
      });
    }
    if (deleteConfirmModal) {
      deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) closeDeleteModal();
      });
    }
  }

  function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconSvg = type === 'success'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
