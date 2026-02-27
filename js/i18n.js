/* =========================
   i18n.js — motor i18n “pro” para web estática multipágina
   - JSON por idioma: /i18n/es.json, /i18n/en.json
   - Traduce:
     • [data-i18n]           -> textContent (por defecto)
     • [data-i18n-html]      -> innerHTML (solo si lo marcas explícitamente)
     • [data-i18n-attr]      -> atributos (placeholder, aria-label, title, etc.)
   - Funciona con contenido cargado por fetch (header/footer) si lo llamas después.
   - Fallbacks:
     • key no encontrada -> usa data-text si existe, si no deja el texto actual.
   - Persiste idioma en localStorage + actualiza <html lang="">
========================= */

(function () {
  const DEFAULT_LANG = "es";
  const SUPPORTED = ["es", "en"]; // añade más cuando quieras
  const STORAGE_KEY = "kora_lang";
  const DICT_CACHE = new Map(); // lang -> dict
  let currentLang = DEFAULT_LANG;
  let currentDict = {};

  // --- helpers ---
  const isSupported = (lang) => SUPPORTED.includes(lang);

  const detectLang = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;

    const nav = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
    if (isSupported(nav)) return nav;

    return DEFAULT_LANG;
  };

  const setDocumentLang = (lang) => {
    document.documentElement.setAttribute("lang", lang);
  };

  const deepGet = (obj, path) => {
    if (!path) return null;
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return null;
    }
    return cur;
  };

  const parseAttrMap = (raw) => {
    // formato:  'placeholder:form.name;aria-label:header.menu;title:nav.home'
    // devuelve: [{attr, key}, ...]
    if (!raw) return [];
    return raw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf(":");
        if (idx === -1) return null;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        if (!attr || !key) return null;
        return { attr, key };
      })
      .filter(Boolean);
  };

  const fetchDict = async (lang) => {
    if (DICT_CACHE.has(lang)) return DICT_CACHE.get(lang);

    const res = await fetch(`i18n/${lang}.json`, {
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      throw new Error(`i18n: no se pudo cargar i18n/${lang}.json (HTTP ${res.status})`);
    }

    const json = await res.json();
    DICT_CACHE.set(lang, json);
    return json;
  };

  const translateElement = (el) => {
    // 1) Texto
    if (el.hasAttribute("data-i18n")) {
      const key = el.getAttribute("data-i18n");
      const value = deepGet(currentDict, key);

      if (value != null) {
        if (el.hasAttribute("data-i18n-html")) el.innerHTML = String(value);
        else el.textContent = String(value);
      } else {
        // fallback: data-text si existe
        const fallback = el.getAttribute("data-text");
        if (fallback != null) el.textContent = fallback;
      }
    }

    // 2) Atributos
    if (el.hasAttribute("data-i18n-attr")) {
      const raw = el.getAttribute("data-i18n-attr");
      const mappings = parseAttrMap(raw);
      for (const { attr, key } of mappings) {
        const value = deepGet(currentDict, key);
        if (value != null) el.setAttribute(attr, String(value));
      }
    }
  };

  const apply = (root = document) => {
    // Traduce el root si aplica
    if (root instanceof Element) translateElement(root);

    // Traduce descendientes
    const selector = "[data-i18n], [data-i18n-attr]";
    root.querySelectorAll?.(selector).forEach(translateElement);

    // Notifica al resto de scripts (por si quieres reaccionar)
    document.dispatchEvent(
      new CustomEvent("i18n:applied", { detail: { lang: currentLang } })
    );
  };

  // Observa nuevos nodos (por si insertas cosas después)
  let observer = null;
  const startObserver = () => {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            // Element
            apply(node);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  // --- API pública ---
  const I18N = {
    get lang() {
      return currentLang;
    },
    get supported() {
      return [...SUPPORTED];
    },

    async init(options = {}) {
      const { observe = true, lang } = options;
      const startLang = isSupported(lang) ? lang : detectLang();
      await this.setLang(startLang, { persist: false });
      localStorage.setItem(STORAGE_KEY, startLang);
      if (observe) startObserver();
      return startLang;
    },

    async setLang(lang, options = {}) {
      const { persist = true } = options;

      if (!isSupported(lang)) {
        throw new Error(`i18n: idioma no soportado: "${lang}"`);
      }

      currentLang = lang;
      currentDict = await fetchDict(lang);

      if (persist) localStorage.setItem(STORAGE_KEY, lang);
      setDocumentLang(lang);

      apply(document);

      document.dispatchEvent(
        new CustomEvent("i18n:changed", { detail: { lang: currentLang } })
      );
    },

    t(key, fallback = "") {
      const v = deepGet(currentDict, key);
      return v != null ? String(v) : fallback;
    },

    apply(root) {
      apply(root);
    }
  };

  // Exponer global
  window.I18N = I18N;
})();