document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const statusBox = document.getElementById("form-status");

    if (!form || !statusBox) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Honeypot anti-spam
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
            // Obtener token de Turnstile
            const turnstileToken =
                window.turnstile && window.turnstile.getResponse
                    ? window.turnstile.getResponse()
                    : "";

            const payload = {
                name: form.name.value,
                email: form.email.value,
                subject: form.subject.value || "Nuevo mensaje desde la web",
                message: form.message.value,
                website: form.website.value,
                turnstileToken,
            };

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                throw new Error(data.error || "Error en el envío");
            }

            // Mostrar éxito
            statusBox.textContent =
                "Mensaje enviado correctamente. Te responderemos lo antes posible.";
            statusBox.classList.add("show", "success");

            form.reset();

            // Reset Turnstile para próximos envíos
            if (window.turnstile && window.turnstile.reset) {
                window.turnstile.reset();
            }
        } catch (error) {
            console.error(error);

            // Mostrar error
            statusBox.textContent =
                "Hubo un error al enviar el mensaje. Inténtalo de nuevo.";
            statusBox.classList.add("show", "error");

            // Reset Turnstile también en error
            if (window.turnstile && window.turnstile.reset) {
                window.turnstile.reset();
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});