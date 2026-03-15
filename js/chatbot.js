document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("kora-chatbot-root")) return;

    const lang = document.documentElement.lang || "es";

    const t = {
        es: {
            title: "Asistente KORA",
            subtitle: "Pregúntame sobre nuestros servicios",
            welcome:
                "Hola, soy el asistente de KORA. Puedo ayudarte con dudas sobre desarrollo web, automatizaciones IA, precios orientativos, packs y cómo trabajamos.",
            placeholder: "Escribe tu pregunta...",
            send: "Enviar",
            thinking: "Escribiendo...",
            error:
                "Ha ocurrido un error. Inténtalo de nuevo en unos segundos.",
            openLabel: "Abrir chat",
            closeLabel: "Cerrar chat"
        },
        en: {
            title: "KORA Assistant",
            subtitle: "Ask me about our services",
            welcome:
                "Hi, I’m KORA’s assistant. I can help you with questions about web development, AI automations, pricing ranges, packages, and how we work.",
            placeholder: "Type your question...",
            send: "Send",
            thinking: "Typing...",
            error:
                "Something went wrong. Please try again in a few seconds.",
            openLabel: "Open chat",
            closeLabel: "Close chat"
        }
    };

    const copy = lang.startsWith("en") ? t.en : t.es;

    const root = document.createElement("div");
    root.id = "kora-chatbot-root";
    root.innerHTML = `
    <button class="kora-chatbot-toggle" aria-label="${copy.openLabel}" type="button">
      <i class="fas fa-comment-dots"></i>
    </button>

    <section class="kora-chatbot-panel" aria-hidden="true">
      <div class="kora-chatbot-header">
        <div>
          <h3>${copy.title}</h3>
          <p>${copy.subtitle}</p>
        </div>
        <button class="kora-chatbot-close" aria-label="${copy.closeLabel}" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="kora-chatbot-messages">
        <div class="kora-chatbot-message bot">
          <div class="bubble">${escapeHtml(copy.welcome)}</div>
        </div>
      </div>

      <form class="kora-chatbot-form">
        <input
          type="text"
          class="kora-chatbot-input"
          placeholder="${copy.placeholder}"
          maxlength="500"
          autocomplete="off"
          required
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

    let isOpen = false;
    let isSending = false;

    function openChat() {
        isOpen = true;
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        toggleBtn.setAttribute("aria-label", copy.closeLabel);
        setTimeout(() => input.focus(), 150);
    }

    function closeChat() {
        isOpen = false;
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
        toggleBtn.setAttribute("aria-label", copy.openLabel);
    }

    function toggleChat() {
        if (isOpen) closeChat();
        else openChat();
    }

    function appendMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.className = `kora-chatbot-message ${role}`;

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");

        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;

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
        messages.scrollTop = messages.scrollHeight;

        return wrapper;
    }

    async function sendMessage(message) {
        if (isSending) return;
        isSending = true;

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

            const data = await response.json();

            typingNode.remove();

            if (!response.ok) {
                appendMessage("bot", data?.error || copy.error);
                return;
            }

            appendMessage("bot", data?.reply || copy.error);
        } catch (error) {
            typingNode.remove();
            appendMessage("bot", copy.error);
        } finally {
            isSending = false;
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const message = input.value.trim();
        if (!message) return;

        if (!isOpen) openChat();
        await sendMessage(message);
    });

    toggleBtn.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", closeChat);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            closeChat();
        }
    });

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (char) => {
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
});