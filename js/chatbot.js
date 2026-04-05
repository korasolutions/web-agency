document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("kora-chatbot-root")) return;

    const lang = document.documentElement.lang || "es";
    const CONSENT_STORAGE_KEY = "cookieConsent_v1";
    const SESSION_STORAGE_KEY = "koraChatbotSession_v2";

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

    let copy = lang.startsWith("en") ? t.en : t.es;

    clearSessionIfPageWasReloaded();

    function clearSessionIfPageWasReloaded() {
        try {
            const navEntry = performance.getEntriesByType("navigation")[0];
            const isReload =
                navEntry?.type === "reload" ||
                performance?.navigation?.type === 1;

            if (isReload) {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } catch {
            // no-op
        }
    }

    function getConsent() {
        try {
            if (window.KoraCookieConsent?.getConsent) {
                return window.KoraCookieConsent.getConsent();
            }

            return JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
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

        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

        window.dispatchEvent(
            new CustomEvent("kora:cookie-consent-updated", {
                detail: consent
            })
        );

        return consent;
    }

    function getInitialState() {
        return {
            isOpen: false,
            messages: [],
            draft: "",
            welcomeRendered: false,
            scrollTop: 0
        };
    }

    function getSessionState() {
        try {
            const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) return getInitialState();

            const parsed = JSON.parse(raw);

            return {
                isOpen: !!parsed?.isOpen,
                messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
                draft: typeof parsed?.draft === "string" ? parsed.draft : "",
                welcomeRendered: !!parsed?.welcomeRendered,
                scrollTop: Number.isFinite(parsed?.scrollTop) ? parsed.scrollTop : 0
            };
        } catch {
            return getInitialState();
        }
    }

    function saveSessionState() {
        try {
            sessionStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify({
                    isOpen,
                    messages: conversationHistory,
                    draft: input?.value || "",
                    welcomeRendered,
                    scrollTop: messages ? messages.scrollTop : 0
                })
            );
        } catch {
            // no-op
        }
    }

    const root = document.createElement("div");
    root.id = "kora-chatbot-root";
    root.classList.add("kora-chatbot-no-animate", "kora-chatbot-preload");

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
                        <a href="/legal#legal-ia" class="legal-href">${copy.consentHref}</a>
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

    const storedState = getSessionState();

    let isOpen = storedState.isOpen;
    let isSending = false;
    let welcomeRendered = storedState.welcomeRendered;
    let conversationHistory = Array.isArray(storedState.messages) ? [...storedState.messages] : [];
    let restoredScrollTop = Number.isFinite(storedState.scrollTop) ? storedState.scrollTop : 0;
    let isRestoringScroll = conversationHistory.length > 0;
    let isRestoringOpenState = storedState.isOpen;

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
        if (isRestoringScroll && !force) return;

        requestAnimationFrame(() => {
            const distanceFromBottom =
                messages.scrollHeight - messages.scrollTop - messages.clientHeight;

            if (force || distanceFromBottom < 120) {
                messages.scrollTop = messages.scrollHeight;
            }
        });
    }

    function restoreScrollPosition() {
        if (!messages) {
            isRestoringScroll = false;
            return;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const maxScrollTop = Math.max(0, messages.scrollHeight - messages.clientHeight);
                messages.scrollTop = Math.min(restoredScrollTop, maxScrollTop);
                isRestoringScroll = false;
            });
        });
    }

    function saveScrollPosition() {
        if (isRestoringScroll) return;
        saveSessionState();
    }

    function renderMessage(role, text, animate = true) {
        const wrapper = document.createElement("div");
        wrapper.className = `kora-chatbot-message ${role}`;

        if (!animate) {
            wrapper.style.animation = "none";
        }

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const cleanText = cleanMarkdown(text);
        bubble.innerHTML = escapeHtml(cleanText).replace(/\n/g, "<br>");

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);

        return wrapper;
    }

    function appendMessage(role, text, persist = true) {
        renderMessage(role, text, true);

        if (!isRestoringScroll) {
            scrollMessagesToBottom(true);
        }

        if (persist) {
            conversationHistory.push({ role, text: String(text) });
            if (role === "bot" && String(text).trim() === copy.welcome.trim()) {
                welcomeRendered = true;
            }
            saveSessionState();
        }
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

    function restoreMessagesFromSession() {
        messages.innerHTML = "";

        if (!conversationHistory.length) return;

        conversationHistory.forEach((item) => {
            if (!item || !item.role || typeof item.text !== "string") return;
            renderMessage(item.role, item.text, false);
        });
    }

    function ensureWelcomeMessage() {
        if (welcomeRendered) return;

        if (conversationHistory.some((msg) => msg?.role === "bot")) {
            welcomeRendered = true;
            return;
        }

        appendMessage("bot", copy.welcome, true);
        welcomeRendered = true;
        saveSessionState();
    }

    function updateConsentUI() {
        const unlocked = hasOptionalConsent();

        panel.classList.toggle("is-locked", !unlocked);
        input.disabled = !unlocked || isSending;
        sendBtn.disabled = !unlocked || isSending;

        if (unlocked) {
            input.placeholder = copy.placeholder;
            if (!conversationHistory.length) {
                ensureWelcomeMessage();
            }
        } else {
            input.placeholder = copy.consentButton;
        }
    }

    function applyOpenState() {
        if (isOpen) {
            panel.classList.add("open");
            panel.setAttribute("aria-hidden", "false");
            toggleBtn.classList.add("is-hidden");
        } else {
            panel.classList.remove("open");
            panel.setAttribute("aria-hidden", "true");
            toggleBtn.classList.remove("is-hidden");
        }
    }

    function finishInitialRender() {
        const reveal = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    root.classList.remove("kora-chatbot-preload");
                    root.classList.add("kora-chatbot-ready");

                    requestAnimationFrame(() => {
                        root.classList.remove("kora-chatbot-no-animate");
                        isRestoringOpenState = false;
                    });
                });
            });
        };

        if (document.readyState === "complete") {
            reveal();
        } else {
            window.addEventListener("load", reveal, { once: true });
        }
    }

    function openChat() {
        if (isOpen) return;

        isRestoringOpenState = false;
        isOpen = true;
        applyOpenState();
        updateConsentUI();
        saveSessionState();

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
        applyOpenState();
        saveSessionState();
    }

    async function sendMessage(message) {
        if (isSending || !hasOptionalConsent()) return;

        isRestoringScroll = false;
        isSending = true;
        input.disabled = true;
        sendBtn.disabled = true;

        appendMessage("user", message, true);
        input.value = "";
        saveSessionState();

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
                appendMessage("bot", data?.error || copy.error, true);
                return;
            }

            appendMessage("bot", data?.reply || copy.error, true);
        } catch {
            const elapsed = Date.now() - typingStartedAt;
            const minTypingTime = 700;

            if (elapsed < minTypingTime) {
                await new Promise((resolve) => setTimeout(resolve, minTypingTime - elapsed));
            }

            typingNode.remove();
            appendMessage("bot", copy.error, true);
        } finally {
            isSending = false;
            updateConsentUI();
            saveSessionState();

            if (hasOptionalConsent()) {
                input.focus();
            }
        }
    }

    function getMaxScrollTop(el) {
        return Math.max(0, el.scrollHeight - el.clientHeight);
    }

    function handleMessagesWheel(e) {
        if (!isOpen) return;

        const maxScrollTop = getMaxScrollTop(messages);
        if (maxScrollTop <= 0) return;

        const deltaY = e.deltaY;
        const currentScrollTop = messages.scrollTop;
        const isScrollingDown = deltaY > 0;
        const isScrollingUp = deltaY < 0;

        const canScrollDown = currentScrollTop < maxScrollTop;
        const canScrollUp = currentScrollTop > 0;

        if (
            (isScrollingDown && canScrollDown) ||
            (isScrollingUp && canScrollUp)
        ) {
            e.preventDefault();
            e.stopPropagation();
            messages.scrollTop += deltaY;
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

    input.addEventListener("input", () => {
        saveSessionState();
    });

    messages.addEventListener("scroll", saveScrollPosition, { passive: true });
    messages.addEventListener("wheel", handleMessagesWheel, { passive: false });

    cookieAcceptBtn?.addEventListener("click", () => {
        acceptOptionalCookies();
        updateConsentUI();
        saveSessionState();

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
        saveSessionState();
    });

    window.addEventListener("pagehide", () => {
        saveSessionState();
    });

    document.addEventListener("i18n:applied", () => {
        const newLang = document.documentElement.lang || "es";
        const newCopy = newLang.startsWith("en") ? t.en : t.es;
        if (newCopy === copy) return;

        const prevWelcome = copy.welcome;
        copy = newCopy;

        root.querySelector(".kora-chatbot-header h3").textContent = newCopy.title;
        root.querySelector(".kora-chatbot-header p").textContent = newCopy.subtitle;
        root.querySelector(".kora-chatbot-close").setAttribute("aria-label", newCopy.closeLabel);
        toggleBtn.setAttribute("aria-label", isOpen ? newCopy.closeLabel : newCopy.openLabel);
        input.placeholder = hasOptionalConsent() ? newCopy.placeholder : newCopy.consentButton;
        sendBtn.textContent = newCopy.send;
        root.querySelector(".kora-chatbot-cookie-title").textContent = newCopy.consentTitle;
        root.querySelector(".kora-chatbot-cookie-text").childNodes[0].textContent = newCopy.consentText + " ";
        root.querySelector(".kora-chatbot-cookie-text .legal-href").textContent = newCopy.consentHref;
        root.querySelector(".kora-chatbot-cookie-accept").textContent = newCopy.consentButton;
        root.querySelector(".kora-chatbot-cookie-note").textContent = newCopy.consentNote;

        // Traducir el mensaje de bienvenida si está en el historial
        const welcomeIndex = conversationHistory.findIndex(
            (msg) => msg.role === "bot" && msg.text.trim() === prevWelcome.trim()
        );
        if (welcomeIndex !== -1) {
            conversationHistory[welcomeIndex].text = newCopy.welcome;
            const botBubbles = messages.querySelectorAll(".kora-chatbot-message.bot:not(.typing)");
            // El mensaje de bienvenida es siempre el primero del bot
            if (botBubbles.length > 0) {
                const bubble = botBubbles[0].querySelector(".bubble");
                if (bubble) {
                    bubble.innerHTML = escapeHtml(cleanMarkdown(newCopy.welcome)).replace(/\n/g, "<br>");
                }
            }
            saveSessionState();
        }
    });

    restoreMessagesFromSession();
    input.value = storedState.draft || "";
    updateConsentUI();
    applyOpenState();
    restoreScrollPosition();
    finishInitialRender();

    if (isOpen && !isRestoringOpenState) {
        window.setTimeout(() => {
            if (hasOptionalConsent()) {
                input.focus();
            }
        }, 180);
    }
});