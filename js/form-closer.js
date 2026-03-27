document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) return;

    const WHATSAPP_NUMBER = "34689074945";

    function setStatus(state, message) {
        statusBox.dataset.state = state;
        statusBox.className = "form-status";
        statusBox.textContent = message || "";

        if (state === "success") {
            statusBox.classList.add("show", "success");
        } else if (state === "error") {
            statusBox.classList.add("show", "error");
        } else if (state === "sending") {
            statusBox.classList.add("show");
        }
    }

    function clean(value, max) {
        return String(value || "")
            .replace(/\u0000/g, "")
            .trim()
            .slice(0, max);
    }

    function getFormData(formEl) {
        return {
            name: clean(formEl.name?.value, 80),
            email: clean(formEl.email?.value, 120),
            phone: clean(formEl.phone?.value, 30),
            experience: clean(formEl.experience?.value, 200),
            message: clean(formEl.message?.value, 4000),
            website: clean(formEl.website?.value, 200),
            privacyChecked: !!formEl.privacy?.checked
        };
    }

    function validateForm(data) {
        if (data.website !== "") {
            return { ok: false, honeypot: true };
        }

        if (!data.name || !data.email || !data.phone || !data.experience || !data.message) {
            return { ok: false, message: "Error: Completa todos los campos." };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
            return { ok: false, message: "Error: Email inválido." };
        }

        if (!data.privacyChecked) {
            return { ok: false, message: "Error: Acepta la política de privacidad." };
        }

        return { ok: true };
    }

    function buildWhatsAppMessage(data) {
        return [
            "*Nueva candidatura de closer*",
            "",
            `*Nombre:* ${data.name}`,
            `*Email:* ${data.email}`,
            `*Teléfono:* ${data.phone}`,
            `*Tiempo experiencia en ventas/closing:* ${data.experience}`,
            "",
            "*Experiencia:*",
            data.message
        ].join("\n");
    }

    function buildWhatsAppUrl(data) {
        const message = buildWhatsAppMessage(data);
        return `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    }

    function openWhatsAppInNewTab(data) {
        const url = buildWhatsAppUrl(data);

        const newWindow = window.open("", "_blank");

        if (!newWindow) {
            throw new Error("Popup bloqueado por el navegador");
        }

        try {
            newWindow.opener = null;
        } catch (e) {
            // Algunos navegadores pueden ignorarlo
        }

        newWindow.location.href = url;
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const btn = form.querySelector("button[type='submit']");
        const originalHTML = btn ? btn.innerHTML : "";

        const data = getFormData(form);
        const validation = validateForm(data);

        if (validation.honeypot) return;

        if (!validation.ok) {
            setStatus("error", validation.message);
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Abriendo WhatsApp...";
        }

        setStatus("sending", "Abriendo WhatsApp...");

        try {
            openWhatsAppInNewTab(data);
            setStatus("success", "Se abrió una nueva pestaña con WhatsApp preparado.");
            form.reset();
        } catch (error) {
            console.error("Error al abrir WhatsApp:", error);
            setStatus(
                "error",
                "Error: El navegador bloqueó la nueva pestaña. Permite pop-ups para esta web e inténtalo otra vez."
            );
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});