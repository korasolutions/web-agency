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
            error: "Ha ocurrido un error. Inténtalo de nuevo en unos segundos.",
            openLabel: "Abrir chat",
            closeLabel: "Cerrar chat",
            consentTitle: "Activa las cookies para continuar",
            consentText: "Para usar el chatbot de IA necesitas aceptar las",
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
            error: "Something went wrong. Please try again in a few seconds.",
            openLabel: "Open chat",
            closeLabel: "Close chat",
            consentTitle: "Enable cookies to continue",
            consentText: "To chat with the chatbot you need to accept",
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
    let lockedScrollY = 0;

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

    function cleanMarkdown(text) {
        return String(text)
            .replace(/\r\n/g, "\n")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/__(.*?)__/g, "$1")
            .replace(/^\s*[-*]\s+/gm, "• ")
            .replace(/^\s*\d+\.\s+/gm, "• ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/^#{1,6}\s*/gm, "")
            .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function scrollMessagesToBottom(force = false) {
        requestAnimationFrame(() => {
            const distanceFromBottom =
                messages.scrollHeight - messages.scrollTop - messages.clientHeight;

            if (force || distanceFromBottom < 120) {
                messages.scrollTop = messages.scrollHeight;
            }
        });
    }

    function appendMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.className = `kora-chatbot-message ${role}`;

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const cleanText = cleanMarkdown(text);
        bubble.innerHTML = escapeHtml(cleanText).replace(/\n/g, "<br>");

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        scrollMessagesToBottom(true);

        return wrapper;
    }

    function appendTyping() {
        const wrapper = document.createElement("div");
        wrapper.className = "kora-chatbot-message bot typing";

        const bubble = document.createElement("div");
        bubble.className = "bubble typing-bubble";
        bubble.innerHTML = `
            <span class="typing-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        scrollMessagesToBottom(true);

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

    function isCoarsePointerDevice() {
        return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    }

    function lockPageScroll() {
        if (document.body.classList.contains("kora-chatbot-scroll-lock")) return;

        lockedScrollY = window.scrollY || window.pageYOffset || 0;

        document.documentElement.classList.add("kora-chatbot-scroll-lock");
        document.body.classList.add("kora-chatbot-scroll-lock");

        document.body.style.position = "fixed";
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
    }

    function unlockPageScroll() {
        if (!document.body.classList.contains("kora-chatbot-scroll-lock")) return;

        document.documentElement.classList.remove("kora-chatbot-scroll-lock");
        document.body.classList.remove("kora-chatbot-scroll-lock");

        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";

        window.scrollTo(0, lockedScrollY);
    }

    function openChat() {
        if (isOpen) return;

        isOpen = true;
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        toggleBtn.classList.add("is-hidden");

        updateConsentUI();

        if (isCoarsePointerDevice()) {
            lockPageScroll();
        }

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

        unlockPageScroll();

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
        const typingStartedAt = Date.now();

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

            const elapsed = Date.now() - typingStartedAt;
            const minTypingTime = 700;

            if (elapsed < minTypingTime) {
                await new Promise((resolve) => setTimeout(resolve, minTypingTime - elapsed));
            }

            typingNode.remove();

            if (!response.ok) {
                appendMessage("bot", data?.error || copy.error);
                return;
            }

            appendMessage("bot", data?.reply || copy.error);
        } catch {
            const elapsed = Date.now() - typingStartedAt;
            const minTypingTime = 700;

            if (elapsed < minTypingTime) {
                await new Promise((resolve) => setTimeout(resolve, minTypingTime - elapsed));
            }

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

    function redirectPanelWheelToMessages(e) {
        if (!isOpen) return;
        if (!panel.contains(e.target)) return;

        const insideMessages = !!e.target.closest(".kora-chatbot-messages");
        if (insideMessages) {
            return;
        }

        const isInputArea =
            e.target.closest(".kora-chatbot-input") ||
            e.target.closest(".kora-chatbot-send") ||
            e.target.closest(".kora-chatbot-cookie-accept");

        if (isInputArea) {
            return;
        }

        const isScrollable = messages.scrollHeight > messages.clientHeight;

        e.stopPropagation();

        if (!isScrollable) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        messages.scrollTop += e.deltaY;
    }

    function handlePanelMouseEnter() {
        if (!isOpen) return;
        if (isCoarsePointerDevice()) return;
        lockPageScroll();
    }

    function handlePanelMouseLeave() {
        if (isCoarsePointerDevice()) return;
        unlockPageScroll();
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

    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            if (!hasOptionalConsent()) {
                updateConsentUI();
                cookieAcceptBtn?.focus();
                return;
            }

            const message = input.value.trim();
            if (!message || isSending) return;

            await sendMessage(message);
        }
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

    panel.addEventListener("wheel", redirectPanelWheelToMessages, { passive: false });
    panel.addEventListener("mouseenter", handlePanelMouseEnter);
    panel.addEventListener("mouseleave", handlePanelMouseLeave);

    panel.addEventListener("focusin", () => {
        if (isOpen) lockPageScroll();
    });

    panel.addEventListener("focusout", (e) => {
        if (!panel.contains(e.relatedTarget) && !isCoarsePointerDevice()) {
            unlockPageScroll();
        }
    });

    window.addEventListener("kora:cookie-consent-updated", () => {
        updateConsentUI();
    });

    updateConsentUI();
});