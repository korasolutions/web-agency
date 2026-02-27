document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const statusBox = document.getElementById("form-status");

    if (!form || !statusBox) {
        console.error("Formulario o statusBox no encontrado");
        return;
    }

    // Detectar entorno
    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact"
            : "/api/contact";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Honeypot
        if (this.website && this.website.value !== "") return;

        const btn = form.querySelector("button");
        const originalHTML = btn ? btn.innerHTML : "";

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Enviando...";
        }

        statusBox.className = "form-status";
        statusBox.textContent = "";

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                subject: form.subject.value.trim() || "Nuevo mensaje desde la web",
                message: form.message.value.trim(),
                website: form.website.value,
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
                    data.detail || data.error || "Error desconocido en el envío"
                );
            }

            // Éxito
            statusBox.textContent =
                "Mensaje enviado correctamente. Te responderemos lo antes posible.";
            statusBox.classList.add("show", "success");

            form.reset();
        } catch (error) {
            console.error("Error real:", error.message);

            statusBox.textContent =
                "Error: " + (error.message || "Hubo un problema al enviar el mensaje.");
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});