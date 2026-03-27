document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("closer-form");
    const statusBox = document.getElementById("closer-form-status");

    if (!form || !statusBox) return;

    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const API_URL = isLocal
        ? "https://koradigitalsolutions.com/api/contact-closer2"
        : "/api/contact-closer2";

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
            phone: clean(formEl.phone?.value, 20),
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

    async function sendForm(data) {
    const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        experience: data.experience,
        message: data.message,
        website: data.website
    };

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "accept": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    console.log("STATUS:", res.status);
    console.log("CONTENT-TYPE:", contentType);
    console.log("RAW RESPONSE:", raw);

    let jsonData = null;

    if (contentType.includes("application/json")) {
        try {
            jsonData = JSON.parse(raw);
        } catch (e) {
            throw new Error("El servidor dijo que era JSON, pero devolvió un JSON inválido.");
        }
    } else {
        throw new Error(raw || "El servidor no devolvió JSON.");
    }

    if (!res.ok || !jsonData?.ok) {
        throw new Error(jsonData?.error || jsonData?.detail || "Error desconocido");
    }

    return jsonData;
}

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const btn = form.querySelector("button");
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
            btn.innerHTML = "Enviando...";
        }

        setStatus("sending", "");

        try {
            await sendForm(data);
            setStatus("success", "Mensaje enviado correctamente.");
            form.reset();
        } catch (error) {
            console.error("Error real:", error);

            const msg = error?.message || "Fallo en el envío";
            const cleanMsg = msg.includes("<!DOCTYPE html>")
                ? "El backend devolvió HTML en vez de JSON. Revisa la ruta /api/contact-closer."
                : msg;

            setStatus("error", "Error: " + cleanMsg);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    });
});