(() => {
    const STORAGE_KEY = "cookieConsent_v1";
    const GTM_ID = "GTM-T8RSJ7GH";

    const el = document.getElementById("cookie-consent");
    if (!el) return;

    const btnAccept = document.getElementById("cookie-accept");
    const btnReject = document.getElementById("cookie-reject");
    const btnSettings = document.getElementById("cookie-settings");
    const prefs = document.getElementById("cookie-prefs");
    const chkAnalytics = document.getElementById("cookie-analytics");
    const btnSave = document.getElementById("cookie-save");
    const btnCancel = document.getElementById("cookie-cancel");

    const getConsent = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch {
            return null;
        }
    };

    const setConsent = (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    };

    const hasOptionalConsent = () => {
        const consent = getConsent();
        return !!consent?.analytics;
    };

    const hideBanner = () => {
        el.classList.remove("is-visible");
    };

    const showBanner = () => {
        el.classList.add("is-visible");
    };

    const loadGTM = () => {
        if (window.__gtmLoaded) return;
        window.__gtmLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            "gtm.start": new Date().getTime(),
            event: "gtm.js"
        });

        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
        document.head.appendChild(s);
    };

    const dispatchConsentUpdate = (consent) => {
        window.dispatchEvent(
            new CustomEvent("kora:cookie-consent-updated", {
                detail: consent
            })
        );
    };

    const applyConsent = (consent) => {
        if (consent?.analytics) {
            loadGTM();
        }

        dispatchConsentUpdate(consent);
    };

    const saveConsent = (consent) => {
        setConsent(consent);
        applyConsent(consent);
        hideBanner();
    };

    const acceptOptionalCookies = () => {
        const consent = {
            necessary: true,
            analytics: true,
            ts: Date.now()
        };

        saveConsent(consent);
        return consent;
    };

    const rejectOptionalCookies = () => {
        const consent = {
            necessary: true,
            analytics: false,
            ts: Date.now()
        };

        saveConsent(consent);
        return consent;
    };

    const openPrefs = () => {
        if (!prefs) return;
        prefs.hidden = false;
        if (chkAnalytics) chkAnalytics.focus();
    };

    const closePrefs = () => {
        if (!prefs) return;
        prefs.hidden = true;
    };

    window.KoraCookieConsent = {
        getConsent,
        hasOptionalConsent,
        acceptOptionalCookies,
        rejectOptionalCookies
    };

    const existing = getConsent();

    if (!existing) {
        showBanner();
    } else {
        applyConsent(existing);
    }

    btnAccept?.addEventListener("click", () => {
        acceptOptionalCookies();
    });

    btnReject?.addEventListener("click", () => {
        rejectOptionalCookies();
    });

    btnSettings?.addEventListener("click", () => {
        if (!prefs) return;

        if (prefs.hidden) {
            openPrefs();
        } else {
            closePrefs();
        }
    });

    btnCancel?.addEventListener("click", () => {
        closePrefs();
    });

    btnSave?.addEventListener("click", () => {
        const consent = {
            necessary: true,
            analytics: !!chkAnalytics?.checked,
            ts: Date.now()
        };

        saveConsent(consent);
    });
})();