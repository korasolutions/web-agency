// functions/api/contact-closer.js
export async function onRequestPost({ request, env }) {
    // Manejar CORS para desarrollo local
    const headers = {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Manejar preflight OPTIONS request
    if (request.method === "OPTIONS") {
        return new Response(null, { headers, status: 204 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return json({ ok: false, step: "content-type", error: "Unsupported Media Type" }, 415, headers);
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({
            ok: false,
            step: "json-parse",
            error: "Bad JSON",
            detail: error instanceof Error ? error.message : String(error)
        }, 400, headers);
    }

    // Honeypot anti-spam
    if (body.website && String(body.website).trim() !== "") {
        return json({ ok: true, step: "honeypot" }, 200, headers);
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const phone = clean(body.phone, 40);
    const experience = clean(body.experience, 180);
    const message = clean(body.message, 4000);
    const subject = "Candidatura Closer KORA";

    // Validación de campos requeridos
    if (!name || !email || !phone || !experience || !message) {
        return json({ 
            ok: false, 
            step: "field-validation", 
            error: "Missing fields",
            fields: {
                name: !!name,
                email: !!email,
                phone: !!phone,
                experience: !!experience,
                message: !!message
            }
        }, 400, headers);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json({ ok: false, step: "email-validation", error: "Invalid email" }, 400, headers);
    }

    // Verificar variables de entorno
    const envCheck = {
        EMAILJS_CLOSER_SERVICE_ID: !!env.EMAILJS_CLOSER_SERVICE_ID,
        EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
        EMAILJS_CLOSER_PUBLIC_KEY: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
        EMAILJS_CLOSER_PRIVATE_KEY: !!env.EMAILJS_CLOSER_PRIVATE_KEY
    };

    const missingEnv = Object.entries(envCheck)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missingEnv.length) {
        console.error("Missing env vars:", missingEnv);
        return json({
            ok: false,
            step: "env-check",
            error: "Missing Cloudflare env vars",
            detail: missingEnv.join(", ")
        }, 500, headers);
    }

    const payload = {
        service_id: env.EMAILJS_CLOSER_SERVICE_ID,
        template_id: env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
        user_id: env.EMAILJS_CLOSER_PUBLIC_KEY,
        accessToken: env.EMAILJS_CLOSER_PRIVATE_KEY,
        template_params: {
            name,
            email,
            phone,
            experience,
            message,
            subject
        }
    };

    try {
        const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload)
        });

        let detail = "";
        try {
            detail = await res.text();
        } catch {
            detail = "No response body";
        }

        if (!res.ok) {
            console.error("EmailJS error:", res.status, detail);
            return json({
                ok: false,
                step: "emailjs-response-not-ok",
                status: res.status,
                detail: detail || "Sin detalle"
            }, 502, headers);
        }

        return json({
            ok: true,
            step: "done",
            message: "Candidatura enviada correctamente"
        }, 200, headers);
        
    } catch (error) {
        console.error("EmailJS fetch error:", error);
        return json({
            ok: false,
            step: "emailjs-fetch",
            error: "Fetch to EmailJS failed",
            detail: error instanceof Error ? error.message : String(error)
        }, 500, headers);
    }
}

function clean(v, max) {
    if (!v) return "";
    return String(v)
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);
}

function json(obj, status = 200, headers = {}) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...headers
        }
    });
}