document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("kora-chatbot-root")) return;

    const lang = document.documentElement.lang || "es";
    const STORAGE_KEY = "cookieConsent_v1";

    const t = {
        es: {
            title: "Asistente KORA",
            subtitle: "Pregúntame sobre nuestros servicios",
            welcome:
                "Hola, soy el asistente de KORA. Puedo ayudarte con dudas sobre desarrollo web, automatizaciones IA, precios orientativos, packs y cómo trabajamos.",
            placeholder: "Escribe tu pregunta...",
            send: "Enviar",
            thinking: "Escribiendo...",
            error: "Ha ocurrido un error. Inténtalo de nuevo en unos segundos.",
            openLabel: "Abrir chat",
            closeLabel: "Cerrar chat",
            consentTitle: "Activa las cookies para continuar",
            consentText:
                "Para usar el chatbot de IA necesitas aceptar las",
            consentHref: "cookies opcionales.",
            consentButton: "Aceptar cookies opcionales",
            consentNote: "Al aceptar, se activará el chat automáticamente."
        },
        en: {
            title: "KORA Assistant",
            subtitle: "Ask me about our services",
            welcome:
                "Hi, I’m KORA’s assistant. I can help you with questions about web development, AI automations, pricing ranges, packages, and how we work.",
            placeholder: "Type your question...",
            send: "Send",
            thinking: "Typing...",
            error: "Something went wrong. Please try again in a few seconds.",
            openLabel: "Open chat",
            closeLabel: "Close chat",
            consentTitle: "Enable cookies to continue",
            consentText:
                "To chat with the chatbot you need to accept",
            consentHref: "optional cookies.",
            consentButton: "Accept optional cookies",
            consentNote: "Once accepted, the chat will start automatically."
        }
    };

    const copy = lang.startsWith("en") ? t.en : t.es;

    function getConsent() {
        try {
            if (window.KoraCookieConsent?.getConsent) {
                return window.KoraCookieConsent.getConsent();
            }

            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch {
            return null;
        }
    }

    function hasOptionalConsent() {
        if (window.KoraCookieConsent?.hasOptionalConsent) {
            return window.KoraCookieConsent.hasOptionalConsent();
        }

        return !!getConsent()?.analytics;
    }

    function acceptOptionalCookies() {
        if (window.KoraCookieConsent?.acceptOptionalCookies) {
            return window.KoraCookieConsent.acceptOptionalCookies();
        }

        const consent = {
            necessary: true,
            analytics: true,
            ts: Date.now()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

        window.dispatchEvent(
            new CustomEvent("kora:cookie-consent-updated", {
                detail: consent
            })
        );

        return consent;
    }

    const root = document.createElement("div");
    root.id = "kora-chatbot-root";
    root.innerHTML = `
        <button class="kora-chatbot-toggle" aria-label="${copy.openLabel}" type="button">
            <i class="fas fa-comment-dots" aria-hidden="true"></i>
        </button>

        <section class="kora-chatbot-panel" aria-hidden="true">
            <div class="kora-chatbot-header">
                <div>
                    <h3>${copy.title}</h3>
                    <p>${copy.subtitle}</p>
                </div>
                <button class="kora-chatbot-close" aria-label="${copy.closeLabel}" type="button">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <div class="kora-chatbot-messages"></div>

            <div class="kora-chatbot-cookie-gate">
                <div class="kora-chatbot-cookie-card">
                    <div class="kora-chatbot-cookie-icon">
                        <i class="fas fa-cookie-bite" aria-hidden="true"></i>
                    </div>

                    <h4 class="kora-chatbot-cookie-title">${copy.consentTitle}</h4>

                    <p class="kora-chatbot-cookie-text">
                        ${copy.consentText}
                        <a href="legal.html#legal-ia" class="legal-href">${copy.consentHref}</a>
                    </p>

                    <div class="kora-chatbot-cookie-actions">
                        <button type="button" class="kora-chatbot-cookie-accept">
                            ${copy.consentButton}
                        </button>

                        <p class="kora-chatbot-cookie-note">${copy.consentNote}</p>
                    </div>
                </div>
            </div>

            <form class="kora-chatbot-form" novalidate>
                <input
                    type="text"
                    class="kora-chatbot-input"
                    placeholder="${copy.placeholder}"
                    maxlength="500"
                    autocomplete="off"
                />
                <button type="submit" class="kora-chatbot-send">
                    ${copy.send}
                </button>
            </form>
        </section>
    `;

    document.body.appendChild(root);

    const toggleBtn = root.querySelector(".kora-chatbot-toggle");
    const panel = root.querySelector(".kora-chatbot-panel");
    const closeBtn = root.querySelector(".kora-chatbot-close");
    const form = root.querySelector(".kora-chatbot-form");
    const input = root.querySelector(".kora-chatbot-input");
    const messages = root.querySelector(".kora-chatbot-messages");
    const sendBtn = root.querySelector(".kora-chatbot-send");
    const cookieAcceptBtn = root.querySelector(".kora-chatbot-cookie-accept");

    let isOpen = false;
    let isSending = false;
    let welcomeRendered = false;

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (char) => {
            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return map[char] || char;
        });
    }

    function scrollMessagesToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    function appendMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.className = `kora-chatbot-message ${role}`;

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        scrollMessagesToBottom();

        return wrapper;
    }

    function appendTyping() {
        const wrapper = document.createElement("div");
        wrapper.className = "kora-chatbot-message bot typing";

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = copy.thinking;

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        scrollMessagesToBottom();

        return wrapper;
    }

    function ensureWelcomeMessage() {
        if (welcomeRendered) return;
        messages.innerHTML = "";
        appendMessage("bot", copy.welcome);
        welcomeRendered = true;
    }

    function updateConsentUI() {
        const unlocked = hasOptionalConsent();

        panel.classList.toggle("is-locked", !unlocked);
        input.disabled = !unlocked;
        sendBtn.disabled = !unlocked;

        if (unlocked) {
            input.placeholder = copy.placeholder;
            ensureWelcomeMessage();
        } else {
            input.placeholder = copy.consentButton;
        }
    }

    function openChat() {
        if (isOpen) return;

        isOpen = true;
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        toggleBtn.classList.add("is-hidden");

        updateConsentUI();

        window.setTimeout(() => {
            if (hasOptionalConsent()) {
                input.focus();
            } else {
                cookieAcceptBtn?.focus();
            }
        }, 180);
    }

    function closeChat() {
        if (!isOpen) return;

        isOpen = false;
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");

        window.setTimeout(() => {
            toggleBtn.classList.remove("is-hidden");
        }, 180);
    }

    async function sendMessage(message) {
        if (isSending || !hasOptionalConsent()) return;

        isSending = true;
        input.disabled = true;
        sendBtn.disabled = true;

        appendMessage("user", message);
        input.value = "";

        const typingNode = appendTyping();

        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    lang
                })
            });

            const data = await response.json().catch(() => ({}));

            typingNode.remove();

            if (!response.ok) {
                appendMessage("bot", data?.error || copy.error);
                return;
            }

            appendMessage("bot", data?.reply || copy.error);
        } catch {
            typingNode.remove();
            appendMessage("bot", copy.error);
        } finally {
            isSending = false;
            updateConsentUI();

            if (hasOptionalConsent()) {
                input.focus();
            }
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!hasOptionalConsent()) {
            updateConsentUI();
            cookieAcceptBtn?.focus();
            return;
        }

        const message = input.value.trim();
        if (!message || isSending) return;

        await sendMessage(message);
    });

    cookieAcceptBtn?.addEventListener("click", () => {
        acceptOptionalCookies();
        updateConsentUI();

        window.setTimeout(() => {
            input.focus();
        }, 120);
    });

    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openChat();
    });

    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeChat();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            closeChat();
        }
    });

    window.addEventListener("kora:cookie-consent-updated", () => {
        updateConsentUI();
    });

    updateConsentUI();
});