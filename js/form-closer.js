document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) {
        console.error("Formulario o statusBox no encontrado");
        return;
    }

    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact-closer"
            : "/api/contact-closer";

    const getText = (key, fallback) => {
        try {
            if (typeof I18N !== "undefined" && typeof I18N.t === "function") {
                return I18N.t(key) || fallback;
            }
            return fallback;
        } catch {
            return fallback;
        }
    };

    const renderStatusByState = () => {
        const state = statusBox.dataset.state;
        if (!state) return;

        if (state === "success") {
            statusBox.textContent = getText(
                "home.contact.form.status.success",
                "Tu candidatura se ha enviado correctamente."
            );
        } else if (state === "error") {
            statusBox.textContent = getText(
                "home.contact.form.status.errorGeneric",
                "Ha ocurrido un error. Inténtalo de nuevo en unos segundos."
            );
        }
    };

    document.addEventListener("i18n:changed", () => {
        renderStatusByState();

        const btn = form.querySelector('button[type="submit"]');
        if (statusBox.dataset.state === "sending" && btn && btn.disabled) {
            btn.innerHTML = getText(
                "home.contact.form.status.sending",
                "Enviando..."
            );
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (this.website && this.website.value.trim() !== "") return;

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn ? btn.innerHTML : "";

        statusBox.className = "form-status";
        statusBox.textContent = "";
        statusBox.dataset.state = "sending";

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = getText(
                "home.contact.form.status.sending",
                "Enviando..."
            );
        }

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                experience: form.experience.value.trim(),
                message: form.message.value.trim(),
                website: form.website ? form.website.value.trim() : ""
            };

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                throw new Error(data.detail || data.error || "Request failed");
            }

            statusBox.dataset.state = "success";
            statusBox.textContent = getText(
                "home.contact.form.status.success",
                "Tu candidatura se ha enviado correctamente."
            );
            statusBox.classList.add("show", "success");

            form.reset();
        } catch (error) {
            console.error("Error real:", error);

            statusBox.dataset.state = "error";
            statusBox.textContent = getText(
                "home.contact.form.status.errorGeneric",
                "Ha ocurrido un error. Inténtalo de nuevo en unos segundos."
            );
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});