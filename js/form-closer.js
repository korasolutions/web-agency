document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) {
        console.error("Formulario closer o statusBox no encontrado");
        return;
    }

    const API_URL = "/api/contact-closer"; // Siempre usar ruta relativa

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
        statusBox.classList.remove("show", "success", "error");

        try {
            const payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                experience: form.experience.value.trim(),
                message: form.message.value.trim(),
                website: form.website.value
            };

            if (!payload.name || !payload.email || !payload.phone || !payload.experience || !payload.message) {
                throw new Error("Por favor, completa todos los campos.");
            }

            console.log("Enviando a:", API_URL);
            console.log("Payload:", payload);

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            let data;
            const responseText = await res.text();
            
            try {
                data = JSON.parse(responseText);
            } catch {
                data = { ok: false, detail: responseText };
            }

            console.log("Respuesta:", res.status, data);

            if (!res.ok || !data.ok) {
                throw new Error(data.detail || data.error || `Error ${res.status}: ${responseText.substring(0, 100)}`);
            }

            statusBox.textContent = "✅ Candidatura enviada correctamente. Te responderemos pronto.";
            statusBox.classList.add("show", "success");
            form.reset();
            
        } catch (error) {
            console.error("Error:", error);
            statusBox.textContent = `❌ ${error.message || "Ha ocurrido un error al enviar la candidatura."}`;
            statusBox.classList.add("show", "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});