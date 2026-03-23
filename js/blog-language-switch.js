(function () {
    function getStoredLang() {
        const keys = ['lang', 'language', 'site-lang', 'i18n-lang', 'locale'];
        for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value === 'es' || value === 'en') return value;
        }
        return null;
    }

    function getCurrentLang() {
        const bodyLang = document.body?.dataset?.pageLang;
        if (bodyLang === 'es' || bodyLang === 'en') return bodyLang;

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

        document.querySelectorAll('a[href="/blog"], a[href="/blog/"]').forEach((link) => {
            link.setAttribute('href', blogHref);
        });
    }

    function redirectIfBlogLanguageSwitch(event) {
        const button = event.target.closest('.lang-btn');
        if (!button) return;

        const targetLang = button.dataset.lang;
        if (targetLang !== 'es' && targetLang !== 'en') return;

        const currentLang = getCurrentLang();
        const altUrl = getAlternateUrl(targetLang);

        if (!altUrl) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();

        if (targetLang === currentLang) return;

        try {
            localStorage.setItem('lang', targetLang);
        } catch (_) { }

        window.location.href = altUrl;
    }

    document.addEventListener('click', redirectIfBlogLanguageSwitch, true);

    const observer = new MutationObserver(() => {
        updateBlogNavLinks();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateBlogNavLinks);
    } else {
        updateBlogNavLinks();
    }
})();