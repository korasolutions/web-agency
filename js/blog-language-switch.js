(function () {
    const STORAGE_KEY = 'kora_lang';
    const SUPPORTED = ['es', 'en'];

    function isSupported(lang) {
        return SUPPORTED.includes(lang);
    }

    function getStoredLang() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return isSupported(value) ? value : null;
        } catch (_) {
            return null;
        }
    }

    function getCurrentLang() {
        const bodyLang = document.body?.dataset?.pageLang;
        if (isSupported(bodyLang)) return bodyLang;

        const htmlLang = document.documentElement.lang?.toLowerCase();
        if (htmlLang?.startsWith('en')) return 'en';
        if (htmlLang?.startsWith('es')) return 'es';

        const stored = getStoredLang();
        if (stored) return stored;

        return 'es';
    }

    function getAlternateUrl(targetLang) {
        if (!document.body) return null;

        if (targetLang === 'es') return document.body.dataset.altEsUrl || null;
        if (targetLang === 'en') return document.body.dataset.altEnUrl || null;

        return null;
    }

    function updateBlogNavLinks() {
        const currentLang = getCurrentLang();
        const blogHref = currentLang === 'en' ? '/en/blog/' : '/blog/';

        document.querySelectorAll('a[href="/blog"], a[href="/blog/"], a[href="/en/blog"], a[href="/en/blog/"]').forEach((link) => {
            link.setAttribute('href', blogHref);
        });
    }

    function updateLangButtonsUI() {
        const currentLang = getCurrentLang();
        const buttons = document.querySelectorAll('.lang-btn');

        buttons.forEach((button) => {
            const isActive = button.dataset.lang === currentLang;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    async function syncI18nWithCurrentPage() {
        const currentLang = getCurrentLang();

        try {
            localStorage.setItem(STORAGE_KEY, currentLang);
        } catch (_) {}

        if (window.I18N?.lang !== currentLang) {
            try {
                await window.I18N.setLang(currentLang);
            } catch (error) {
                console.error('[blog-language-switch] Error sincronizando i18n:', error);
            }
        }

        updateLangButtonsUI();
        updateBlogNavLinks();
    }

    async function handleLanguageSwitch(event) {
        const button = event.target.closest('.lang-btn');
        if (!button) return;

        const targetLang = button.dataset.lang;
        if (!isSupported(targetLang)) return;

        const currentLang = getCurrentLang();
        const altUrl = getAlternateUrl(targetLang);

        try {
            localStorage.setItem(STORAGE_KEY, targetLang);
        } catch (_) {}

        updateLangButtonsUI();

        if (altUrl && targetLang !== currentLang) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            window.location.href = altUrl;
            return;
        }

        if (window.I18N && targetLang !== window.I18N.lang) {
            try {
                await window.I18N.setLang(targetLang);
            } catch (error) {
                console.error('[blog-language-switch] Error cambiando idioma:', error);
            }
        }

        updateLangButtonsUI();
        updateBlogNavLinks();
    }

    function observeDomChanges() {
        const observer = new MutationObserver(() => {
            updateLangButtonsUI();
            updateBlogNavLinks();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    document.addEventListener('click', handleLanguageSwitch, true);
    document.addEventListener('i18n:changed', updateLangButtonsUI);
    document.addEventListener('i18n:applied', () => {
        updateLangButtonsUI();
        updateBlogNavLinks();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await syncI18nWithCurrentPage();
            observeDomChanges();
        });
    } else {
        syncI18nWithCurrentPage();
        observeDomChanges();
    }
})();