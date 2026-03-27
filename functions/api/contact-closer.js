export async function onRequestPost({ request, env }) {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return json({ ok: false, step: "content-type", error: "Unsupported Media Type" }, 415);
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
        }, 400);
    }

    if (body.website && String(body.website).trim() !== "") {
        return json({ ok: true, step: "honeypot" }, 200);
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const phone = clean(body.phone, 40);
    const experience = clean(body.experience, 180);
    const message = clean(body.message, 4000);
    const subject = "Candidatura Closer KORA";

    if (!name || !email || !phone || !experience || !message) {
        return json({ ok: false, step: "field-validation", error: "Missing fields" }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json({ ok: false, step: "email-validation", error: "Invalid email" }, 400);
    }

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
        return json({
            ok: false,
            step: "env-check",
            error: "Missing Cloudflare env vars",
            detail: missingEnv.join(", "),
            envCheck
        }, 500);
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

        const detail = await res.text().catch(() => "");

        return json({
            ok: res.ok,
            step: res.ok ? "done" : "emailjs-response-not-ok",
            status: res.status,
            detail: detail || "Sin detalle",
            payloadPreview: {
                service_id: payload.service_id,
                template_id: payload.template_id,
                has_user_id: !!payload.user_id,
                has_accessToken: !!payload.accessToken,
                template_param_keys: Object.keys(payload.template_params)
            }
        }, res.ok ? 200 : 502);
    } catch (error) {
        return json({
            ok: false,
            step: "emailjs-fetch",
            error: "Fetch to EmailJS failed",
            detail: error instanceof Error ? error.message : String(error)
        }, 500);
    }
}

function clean(v, max) {
    return String(v || "")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
        }
    });
}