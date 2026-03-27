document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) return;

    const API_URL =
        location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact-closer"
            : "/api/contact-closer";

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

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Honeypot
        if (this.website && this.website.value !== "") return;

        const btn = form.querySelector("button");
        const originalHTML = btn ? btn.innerHTML : "";

        const name = form.name?.value.trim() || "";
        const email = form.email?.value.trim() || "";
        const phone = form.phone?.value.trim() || "";
        const experience = form.experience?.value.trim() || "";
        const message = form.message?.value.trim() || "";
        const privacyChecked = form.privacy?.checked;

        if (!name || !email || !phone || !experience || !message) {
            setStatus("error", "Error: Completa todos los campos.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            setStatus("error", "Error: Email inválido.");
            return;
        }

        if (!privacyChecked) {
            setStatus("error", "Error: Acepta la política de privacidad.");
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "Enviando...";
        }

        setStatus("sending", "");

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    experience,
                    message,
                }),
            });

            const text = await res.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(text || "Respuesta inválida del servidor");
            }

            if (!res.ok || !data.ok) {
                throw new Error(data.error || data.detail || "Error desconocido");
            }

            setStatus("success", "Mensaje enviado correctamente.");
            form.reset();

        } catch (error) {
            console.error("Error real:", error);
            setStatus("error", "Error: " + (error.message || "Fallo en el envío"));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});