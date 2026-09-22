/**
 * PromptHub Public Site Controller
 * Handles prompt retrieval, filtering, search, modal detail viewer, and WhatsApp unlock.
 * Compatible with both file:// protocol and HTTP servers.
 */

(function () {
  // Safe global references
  function getConfig() {
    return window.CONFIG || {
      SITE_NAME: 'PromptHub',
      WHATSAPP_LINK: 'https://wa.me/15551234567',
      SEED_PROMPTS: []
    };
  }

  function getDB() {
    return window.PromptHubDB || {
      isSupabaseConfigured: () => false,
      getPrompts: async () => getConfig().SEED_PROMPTS || []
    };
  }

  // Application State
  const state = {
    prompts: [],
    filteredPrompts: [],
    selectedCategory: 'all',
    selectedTier: 'all', // 'all' | 'free' | 'pro'
    searchQuery: '',
    activePrompt: null,
  };

  // DOM Elements
  const promptsGrid = document.getElementById('promptsGrid');
  const emptyState = document.getElementById('emptyState');
  const categoryChips = document.getElementById('categoryChips');
  const resultsMeta = document.getElementById('resultsMeta');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const heroSearchInput = document.getElementById('heroSearchInput');
  const tierTabs = document.querySelectorAll('.tier-tab-btn');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // Stats Elements
  const statTotalPrompts = document.getElementById('statTotalPrompts');
  const statFreePrompts = document.getElementById('statFreePrompts');
  const statPaidPrompts = document.getElementById('statPaidPrompts');

  // Modal Elements
  const detailModal = document.getElementById('detailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTierBadge = document.getElementById('modalTierBadge');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalDateBadge = document.getElementById('modalDateBadge');
  const modalTitle = document.getElementById('modalTitle');
  const galleryMainImg = document.getElementById('galleryMainImg');
  const galleryThumbs = document.getElementById('galleryThumbs');
  const freePromptView = document.getElementById('freePromptView');
  const proLockedView = document.getElementById('proLockedView');
  const promptTextContent = document.getElementById('promptTextContent');
  const promptWordCount = document.getElementById('promptWordCount');
  const btnCopyPrompt = document.getElementById('btnCopyPrompt');
  const copyBtnText = document.getElementById('copyBtnText');
  const btnWhatsappUnlock = document.getElementById('btnWhatsappUnlock');
  const previewBanner = document.getElementById('previewBanner');
  const toastContainer = document.getElementById('toastContainer');
  const currentYearSpan = document.getElementById('currentYear');

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  async function initApp() {
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
    }

    const cfg = getConfig();
    const db = getDB();

    // Show setup banner if using default placeholders
    if (!db.isSupabaseConfigured() && previewBanner) {
      previewBanner.style.display = 'flex';
    }

    initTheme();
    setupEventListeners();

    // First immediately render seed prompts so user sees content with ZERO delay
    if (Array.isArray(cfg.SEED_PROMPTS) && cfg.SEED_PROMPTS.length > 0) {
      state.prompts = [...cfg.SEED_PROMPTS];
      updateStats();
      applyFilters();
    }

    // Then fetch any live updates from DB/localStorage
    await loadPrompts();

    // ⚡ Realtime live update listener: updates site instantly when prompts are added/edited in admin
    if (typeof db.subscribeToPrompts === 'function') {
      db.subscribeToPrompts(async (payload) => {
        console.log('⚡ Realtime sync received:', payload);
        await loadPrompts();
        showToast('Vault updated with latest master prompts!', 'info');
      });
    }

    // Handle URL hash deep-linking (e.g. #prompt-<id>)
    handleDeepLink();
    window.addEventListener('hashchange', handleDeepLink);
  }

  // ==============================================================================
  // DATA FETCHING & UI RENDER
  // ==============================================================================

  async function loadPrompts() {
    try {
      const db = getDB();
      const data = await db.getPrompts();
      if (Array.isArray(data) && data.length > 0) {
        state.prompts = data;
      } else {
        state.prompts = getConfig().SEED_PROMPTS || [];
      }
      updateStats();
      applyFilters();
    } catch (err) {
      console.error('Failed to load prompts from database, using seed data:', err);
      state.prompts = getConfig().SEED_PROMPTS || [];
      updateStats();
      applyFilters();
    }
  }

  function updateStats() {
    const total = state.prompts.length;
    const free = state.prompts.filter((p) => !p.is_paid).length;
    const paid = state.prompts.filter((p) => p.is_paid).length;

    if (statTotalPrompts) statTotalPrompts.textContent = total;
    if (statFreePrompts) statFreePrompts.textContent = free;
    if (statPaidPrompts) statPaidPrompts.textContent = paid;
  }

  function applyFilters() {
    const query = state.searchQuery.toLowerCase().trim();

    state.filteredPrompts = state.prompts.filter((item) => {
      // Tier filter
      if (state.selectedTier === 'free' && item.is_paid) return false;
      if (state.selectedTier === 'pro' && !item.is_paid) return false;

      // Search query filter
      if (query) {
        const matchTitle = (item.title || '').toLowerCase().includes(query);
        const matchText = (item.prompt_text || '').toLowerCase().includes(query);
        if (!matchTitle && !matchText) return false;
      }

      return true;
    });

    renderPromptsGrid();
  }

  function renderPromptsGrid() {
    if (!promptsGrid) return;

    const count = state.filteredPrompts.length;
    if (resultsMeta) {
      if (count === 0) {
        resultsMeta.textContent = 'No prompts match the criteria';
      } else if (count === 1) {
        resultsMeta.textContent = 'Showing 1 prompt';
      } else {
        resultsMeta.textContent = `Showing ${count} prompts`;
      }
    }

    if (count === 0) {
      promptsGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    promptsGrid.style.display = 'grid';

    promptsGrid.innerHTML = state.filteredPrompts.map((prompt) => createCardHtml(prompt)).join('');

    // Attach card click handlers
    promptsGrid.querySelectorAll('.prompt-card').forEach((card) => {
      card.addEventListener('click', () => {
        const promptId = card.dataset.id;
        const found = state.prompts.find((p) => String(p.id) === String(promptId));
        if (found) {
          openModal(found);
        }
      });
    });
  }

  function createCardHtml(prompt) {
    const isPro = Boolean(prompt.is_paid);
    const coverImage = (prompt.images && prompt.images.length > 0) ? prompt.images[0] : DEFAULT_IMAGE;
    const snippet = prompt.prompt_text ? prompt.prompt_text.replace(/\n+/g, ' ').substring(0, 140) + '...' : '';
    const dateFormatted = prompt.created_at ? new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently added';

    return `
      <article class="prompt-card ${isPro ? 'card-pro' : ''}" data-id="${escapeHtml(String(prompt.id))}">
        <!-- Media / Cover -->
        <div class="card-media">
          <img src="${escapeHtml(coverImage)}" alt="${escapeHtml(prompt.title)}" loading="lazy" onerror="this.src='${DEFAULT_IMAGE}'">
          
          <div class="card-badges">
            <span class="badge-tier ${isPro ? 'tier-pro' : 'tier-free'}">
              ${isPro ? `
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg> PAID
              ` : 'FREE'}
            </span>
          </div>

          ${isPro ? `
            <div class="card-lock-overlay">
              <span class="lock-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                PRO Access Required
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Body -->
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(prompt.title)}</h3>
          <p class="card-snippet">${escapeHtml(snippet)}</p>

          <div class="card-footer">
            <span class="card-date">${dateFormatted}</span>
            <span class="card-cta-label ${isPro ? 'pro-label' : ''}">
              ${isPro ? 'Unlock PRO' : 'View Prompt'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  // ==============================================================================
  // MODAL & DETAIL VIEWER
  // ==============================================================================

  function openModal(prompt) {
    state.activePrompt = prompt;

    const isPro = Boolean(prompt.is_paid);
    const images = (prompt.images && prompt.images.length > 0) ? prompt.images : [DEFAULT_IMAGE];

    // Set Title & Meta
    if (modalTitle) modalTitle.textContent = prompt.title;
    if (modalCategoryBadge) modalCategoryBadge.textContent = prompt.category || 'General';

    if (modalTierBadge) {
      if (isPro) {
        modalTierBadge.className = 'badge-tier tier-pro';
        modalTierBadge.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg> PRO VAULT
        `;
      } else {
        modalTierBadge.className = 'badge-tier tier-free';
        modalTierBadge.textContent = 'FREE PROMPT';
      }
    }

    if (modalDateBadge) {
      modalDateBadge.textContent = prompt.created_at
        ? new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently added';
    }

    // Setup Gallery
    if (galleryMainImg) {
      galleryMainImg.src = images[0];
      galleryMainImg.alt = prompt.title;
    }

    if (galleryThumbs) {
      if (images.length > 1) {
        galleryThumbs.style.display = 'flex';
        galleryThumbs.innerHTML = images.map((imgUrl, index) => `
          <div class="thumb-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${escapeHtml(imgUrl)}" alt="Thumbnail ${index + 1}" onerror="this.src='${DEFAULT_IMAGE}'">
          </div>
        `).join('');

        galleryThumbs.querySelectorAll('.thumb-item').forEach((thumb) => {
          thumb.addEventListener('click', () => {
            galleryThumbs.querySelectorAll('.thumb-item').forEach((t) => t.classList.remove('active'));
            thumb.classList.add('active');
            const idx = parseInt(thumb.dataset.index, 10);
            if (galleryMainImg && images[idx]) {
              galleryMainImg.src = images[idx];
            }
          });
        });
      } else {
        galleryThumbs.style.display = 'none';
        galleryThumbs.innerHTML = '';
      }
    }

    // Display Content based on Tier
    if (isPro) {
      if (freePromptView) freePromptView.style.display = 'none';
      if (proLockedView) proLockedView.style.display = 'block';

      // WhatsApp unlock link configuration
      if (btnWhatsappUnlock) {
        const cfg = getConfig();
        const whatsappBase = (cfg.WHATSAPP_LINK || 'https://wa.me/15551234567').replace(/\/+$/, '');
        const encodedMsg = encodeURIComponent(`Hi! I would like to unlock the PRO prompt: "${prompt.title}" on ${cfg.SITE_NAME || 'PromptHub'}.`);
        
        const finalUrl = whatsappBase.includes('?') 
          ? `${whatsappBase}&text=${encodedMsg}`
          : `${whatsappBase}?text=${encodedMsg}`;
          
        btnWhatsappUnlock.href = finalUrl;
      }
    } else {
      if (proLockedView) proLockedView.style.display = 'none';
      if (freePromptView) freePromptView.style.display = 'block';

      if (promptTextContent) {
        promptTextContent.textContent = prompt.prompt_text || '';
      }

      // Calculate word count
      if (promptWordCount) {
        const words = (prompt.prompt_text || '').trim().split(/\s+/).filter(Boolean).length;
        promptWordCount.textContent = `(${words} words)`;
      }

      // Reset copy button state
      resetCopyButtonState();
    }

    // Update URL hash for sharing
    if (history.replaceState) {
      history.replaceState(null, null, `#prompt-${prompt.id}`);
    }

    // Open Modal
    if (detailModal) {
      detailModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (detailModal) {
      detailModal.classList.remove('open');
      document.body.style.overflow = '';
    }
    state.activePrompt = null;
    resetCopyButtonState();

    // Remove hash
    if (window.location.hash.startsWith('#prompt-') && history.replaceState) {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }

  function resetCopyButtonState() {
    if (btnCopyPrompt) {
      btnCopyPrompt.classList.remove('copied');
    }
    if (copyBtnText) {
      copyBtnText.textContent = 'Copy Prompt';
    }
  }

  // Copy prompt text to clipboard
  async function copyActivePrompt() {
    if (!state.activePrompt || !state.activePrompt.prompt_text) return;

    try {
      await navigator.clipboard.writeText(state.activePrompt.prompt_text);
      if (btnCopyPrompt) btnCopyPrompt.classList.add('copied');
      if (copyBtnText) copyBtnText.textContent = 'Copied to Clipboard!';
      showToast('Prompt copied to clipboard successfully!', 'success');

      setTimeout(() => {
        resetCopyButtonState();
      }, 2800);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      fallbackCopyText(state.activePrompt.prompt_text);
    }
  }

  function fallbackCopyText(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (btnCopyPrompt) btnCopyPrompt.classList.add('copied');
      if (copyBtnText) copyBtnText.textContent = 'Copied!';
      showToast('Prompt copied to clipboard!', 'success');
    } catch (e) {
      showToast('Unable to copy automatically. Please copy manually.', 'info');
    }
    document.body.removeChild(tempInput);
  }

  // ==============================================================================
  // EVENT LISTENERS & HELPERS
  // ==============================================================================

  function setupEventListeners() {
    const handleSearchInput = (e) => {
      const val = e.target.value;
      state.searchQuery = val;
      if (headerSearchInput && headerSearchInput !== e.target) headerSearchInput.value = val;
      if (heroSearchInput && heroSearchInput !== e.target) heroSearchInput.value = val;
      applyFilters();
    };

    if (headerSearchInput) headerSearchInput.addEventListener('input', handleSearchInput);
    if (heroSearchInput) heroSearchInput.addEventListener('input', handleSearchInput);

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (headerSearchInput && window.innerWidth >= 768) {
          headerSearchInput.focus();
        } else if (heroSearchInput) {
          heroSearchInput.focus();
        }
      }
      if (e.key === 'Escape' && detailModal && detailModal.classList.contains('open')) {
        closeModal();
      }
    });

    tierTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tierTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.selectedTier = tab.dataset.tier;
        applyFilters();
      });
    });

    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        state.searchQuery = '';
        state.selectedCategory = 'all';
        state.selectedTier = 'all';

        if (headerSearchInput) headerSearchInput.value = '';
        if (heroSearchInput) heroSearchInput.value = '';

        tierTabs.forEach((t, i) => {
          if (i === 0) {
            t.classList.add('active');
            t.setAttribute('aria-selected', 'true');
          } else {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          }
        });

        applyFilters();
      });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModal();
      });
    }

    if (btnCopyPrompt) {
      btnCopyPrompt.addEventListener('click', copyActivePrompt);
    }

    window.addEventListener('scroll', () => {
      const header = document.getElementById('siteHeader');
      if (header) {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });
  }

  function handleDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#prompt-')) {
      const id = hash.replace('#prompt-', '');
      const prompt = state.prompts.find((p) => String(p.id) === String(id));
      if (prompt) {
        openModal(prompt);
      }
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

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  // ==============================================================================
  // THEME SWITCHER (Light / Dark)
  // ==============================================================================
  function initTheme() {
    // Default to 'light' as requested, with localStorage persistence
    const savedTheme = localStorage.getItem('prompthub_theme') || 'light';
    setTheme(savedTheme);

    const toggleBtn = document.getElementById('btnThemeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
        showToast(`Switched to ${next.toUpperCase()} mode`, 'info');
      });
    }
  }

  function setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('prompthub_theme', theme);
    } catch (e) {}
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

  // Self-execute immediately or on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
