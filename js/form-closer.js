document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) return;

    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact-closer"
            : "/api/contact-closer";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Honeypot anti-spam
        if (this.website && this.website.value !== "") return;

        const btn = form.querySelector("button");
        const originalHTML = btn ? btn.innerHTML : "";

        // Estado: enviando
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = I18N.t("home.contact.form.status.sending");
        }

        statusBox.dataset.state = "sending";
        statusBox.className = "form-status";
        statusBox.textContent = "";
        statusBox.classList.remove("show", "success", "error");

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                experience: form.experience.value.trim(),
                message: form.message.value.trim(),
            };

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            // 🔥 CLAVE: capturamos respuesta REAL (JSON o HTML o lo que sea)
            const rawText = await res.text();
            let data = null;

            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                data = null;
            }

            if (!res.ok || !data?.ok) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    rawText ||
                    `HTTP ${res.status} ${res.statusText}` ||
                    "Error desconocido"
                );
            }

            // Éxito
            statusBox.dataset.state = "success";
            statusBox.textContent = I18N.t("home.contact.form.status.success");
            statusBox.classList.add("show", "success");

            form.reset();
        } catch (error) {
            console.error("Error real completo:", error);

            const fallback = I18N.t("home.contact.form.status.errorGeneric");

            const realMessage =
                error?.message && error.message !== "undefined"
                    ? error.message
                    : fallback;

            statusBox.dataset.state = "error";
            statusBox.textContent = "Error: " + realMessage;
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});