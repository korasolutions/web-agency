(() => {
    "use strict";

    const DEBUG = true;
    const FORM_ID = "contact-form";
    const STATUS_ID = "form-status";
    const RETRY_DELAY = 300;
    const MAX_RETRIES = 20;

    function log(...args) {
        if (DEBUG) console.log("[contact-form]", ...args);
    }

    function warn(...args) {
        if (DEBUG) console.warn("[contact-form]", ...args);
    }

    function errorLog(...args) {
        console.error("[contact-form]", ...args);
    }

    function getApiUrl() {
        return location.hostname === "localhost"
            ? "https://koradigitalsolutions.com/api/contact"
            : "/api/contact";
    }

    function getI18nText(key, fallback = "") {
        try {
            if (window.I18N && typeof window.I18N.t === "function") {
                return window.I18N.t(key) || fallback;
            }
        } catch (err) {
            warn("Fallo leyendo I18N:", err);
        }
        return fallback;
    }

    function pushGenerateLeadEvent() {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: "generate_lead",
                form_name: "formulario_principal",
                lead_type: "contacto_web",
                page_path: window.location.pathname
            });
            log("Evento generate_lead enviado a dataLayer", window.dataLayer);
        } catch (err) {
            errorLog("No se pudo enviar generate_lead a dataLayer:", err);
        }
    }

    function updateStatusMessage(statusBox, form, state) {
        if (!statusBox) return;

        const btn = form ? form.querySelector("button[type='submit'], button") : null;

        if (state === "success") {
            statusBox.textContent = getI18nText(
                "home.contact.form.status.success",
                "Mensaje enviado correctamente."
            );
        } else if (state === "error") {
            statusBox.textContent = getI18nText(
                "home.contact.form.status.errorGeneric",
                "Ha ocurrido un error al enviar el formulario."
            );
        } else if (state === "sending" && btn && btn.disabled) {
            btn.innerHTML = getI18nText(
                "home.contact.form.status.sending",
                "Enviando..."
            );
        }
    }

    function bindI18nListener(form, statusBox) {
        document.addEventListener("i18n:changed", () => {
            const state = statusBox?.dataset?.state;
            if (!state) return;
            updateStatusMessage(statusBox, form, state);
        });
    }

    function setSendingState(form, statusBox, btn) {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = getI18nText(
                "home.contact.form.status.sending",
                "Enviando..."
            );
        }

        statusBox.className = "form-status";
        statusBox.textContent = "";
        statusBox.dataset.state = "sending";
    }

    function setSuccessState(statusBox) {
        statusBox.dataset.state = "success";
        statusBox.textContent = getI18nText(
            "home.contact.form.status.success",
            "Mensaje enviado correctamente. Te responderemos lo antes posible."
        );
        statusBox.className = "form-status show success";
    }

    function setErrorState(statusBox, message) {
        const fallback = getI18nText(
            "home.contact.form.status.errorGeneric",
            "Ha ocurrido un error al enviar el formulario."
        );

        statusBox.dataset.state = "error";
        statusBox.textContent = message || fallback;
        statusBox.className = "form-status show error";
    }

    function getPayload(form) {
        return {
            name: form.name?.value?.trim() || "",
            email: form.email?.value?.trim() || "",
            subject: form.subject?.value?.trim() || "Nuevo mensaje desde la web",
            message: form.message?.value?.trim() || "",
            website: form.website?.value || ""
        };
    }

    async function submitForm(form, statusBox) {
        const btn = form.querySelector("button[type='submit'], button");
        const originalHTML = btn ? btn.innerHTML : "";
        const API_URL = getApiUrl();

        try {
            setSendingState(form, statusBox, btn);

            const payload = getPayload(form);
            log("Payload preparado:", payload);

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            log("Respuesta API:", { status: res.status, ok: res.ok, data });

            if (!res.ok || !data.ok) {
                throw new Error(data.detail || data.error || "Error al enviar el formulario");
            }

            setSuccessState(statusBox);
            pushGenerateLeadEvent();
            form.reset();
            log("Formulario enviado correctamente");
        } catch (err) {
            errorLog("Error real:", err);
            setErrorState(statusBox, "Error: " + (err?.message || "Error desconocido"));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    }

    function bindForm(form, statusBox) {
        if (!form || !statusBox) return;
        if (form.dataset.koraBound === "true") {
            log("El formulario ya estaba enlazado, no se vuelve a registrar.");
            return;
        }

        form.dataset.koraBound = "true";
        bindI18nListener(form, statusBox);

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            log("Submit interceptado");

            if (this.website && this.website.value !== "") {
                warn("Honeypot activado. Envío cancelado.");
                return;
            }

            await submitForm(form, statusBox);
        });

        log("Formulario enlazado correctamente");
    }

    function init(attempt = 1) {
        const form = document.getElementById(FORM_ID);
        const statusBox = document.getElementById(STATUS_ID);

        if (!form || !statusBox) {
            if (attempt <= MAX_RETRIES) {
                warn(
                    `Formulario o statusBox no encontrados. Reintento ${attempt}/${MAX_RETRIES}...`
                );
                setTimeout(() => init(attempt + 1), RETRY_DELAY);
            } else {
                errorLog("No se encontró el formulario o el statusBox tras varios intentos.");
            }
            return;
        }

        log("Script cargado y elementos encontrados");
        bindForm(form, statusBox);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    window.addEventListener("load", () => {
        log("Window load completado");
        init();
    });
})();