document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) {
        console.error("Formulario o statusBox no encontrado");
        return;
    }

    // Detectar entorno
    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact-closer"
            : "/api/contact-closer";

    // Re-render del status cuando cambie el idioma
    document.addEventListener("i18n:changed", () => {
        const state = statusBox.dataset.state;
        if (!state) return;

        if (state === "success") {
            statusBox.textContent = I18N.t("home.contact.form.status.success");
        } else if (state === "error") {
            statusBox.textContent = I18N.t("home.contact.form.status.errorGeneric");
        } else if (state === "sending") {
            const btn = form.querySelector("button");
            if (btn && btn.disabled) btn.innerHTML = I18N.t("home.contact.form.status.sending");
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Honeypot
        if (this.website && this.website.value !== "") return;

        const btn = form.querySelector("button");
        const originalHTML = btn ? btn.innerHTML : "";

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = I18N.t("home.contact.form.status.sending");
        }
        statusBox.dataset.state = "sending";

        statusBox.className = "closer-form-status";
        statusBox.textContent = "";
        delete statusBox.dataset.state;

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                experience: form.experience.value.trim(),
                message: form.message.value.trim()
            };

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                throw new Error(
                    data.detail || data.error
                );
            }

            // Éxito
            statusBox.dataset.state = "success";
            statusBox.textContent =
                I18N.t("home.contact.form.status.success");
            statusBox.classList.add("show", "success");

            form.reset();
        } catch (error) {
            console.error("Error real:", error.message);
            const fallback = I18N.t("home.contact.form.status.errorGeneric");

            statusBox.dataset.state = "error";
            statusBox.textContent =
                "Error: " + (error.message || fallback);
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});