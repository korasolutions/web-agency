document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) {
        console.error("Formulario closer o statusBox no encontrado");
        return;
    }

    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact-closer"
            : "/api/contact-closer";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (this.website && this.website.value !== "") return;

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn ? btn.innerHTML : "";

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando candidatura...';
        }

        statusBox.className = "form-status";
        statusBox.textContent = "";
        delete statusBox.dataset.state;

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                experience: form.experience.value.trim(),
                message: form.message.value.trim(),
                website: form.website.value
            };

            if (
                !payload.name ||
                !payload.email ||
                !payload.phone ||
                !payload.experience ||
                !payload.message
            ) {
                throw new Error("Por favor, completa todos los campos.");
            }

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const rawText = await res.text();
            let data = {};

            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                data = {};
            }

            if (!res.ok || !data.ok) {
                const trimmed = rawText.trim();
                const isHtml =
                    trimmed.startsWith("<!DOCTYPE html") ||
                    trimmed.startsWith("<html");

                throw new Error(
                    data.detail ||
                    data.error ||
                    (isHtml
                        ? `Error del servidor (${res.status}). Inténtalo de nuevo en unos minutos.`
                        : rawText) ||
                    `HTTP ${res.status}`
                );
            }

            statusBox.dataset.state = "success";
            statusBox.textContent =
                "Candidatura enviada correctamente. Te responderemos pronto.";
            statusBox.classList.add("show", "success");

            form.reset();
        } catch (error) {
            console.error("Error real en closer:", error);

            statusBox.dataset.state = "error";
            statusBox.textContent =
                "Error: " +
                (error.message || "Ha ocurrido un error al enviar la candidatura.");
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});