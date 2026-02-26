export async function onRequestPost({ request, env }) {
    // 1) Solo JSON
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return json({ ok: false, error: "Unsupported Media Type" }, 415);
    }

    // 2) Origin check (capa extra)
    // OJO: no es “infalible”, pero bloquea mucha automatización básica.
    if (env.ALLOWED_ORIGIN) {
        const origin = request.headers.get("Origin") || "";
        if (origin && origin !== env.ALLOWED_ORIGIN) {
            return json({ ok: false, error: "Forbidden origin" }, 403);
        }
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "Bad JSON" }, 400);
    }

    // 3) Honeypot: respuesta neutra (no dar pistas)
    if (body.website && String(body.website).trim() !== "") {
        return json({ ok: true }, 200);
    }

    // 4) Turnstile (si existe secret, lo exigimos)
    if (env.TURNSTILE_SECRET) {
        const token = String(body.turnstileToken || "");
        if (!token) return json({ ok: false, error: "Captcha required" }, 403);

        const ip = request.headers.get("CF-Connecting-IP") || "";
        const formData = new FormData();
        formData.append("secret", env.TURNSTILE_SECRET);
        formData.append("response", token);
        if (ip) formData.append("remoteip", ip);

        const tsResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
        });

        const ts = await tsResp.json().catch(() => null);
        if (!ts || !ts.success) {
            return json({ ok: false, error: "Captcha failed" }, 403);
        }
    }

    // 5) Validación / saneado (anti abuso + anti payload gigante)
    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const subject = clean(body.subject || "Nuevo mensaje desde la web", 120);
    const message = clean(body.message, 4000);

    if (!name || !email || !message) {
        return json({ ok: false, error: "Missing fields" }, 400);
    }

    // Validación simple email (suficiente para formulario)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json({ ok: false, error: "Invalid email" }, 400);
    }

    // 6) Enviar con EmailJS REST (Private Key SOLO server-side)
    const payload = {
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: { name, email, subject, message },
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!r.ok) {
        const t = await r.text().catch(() => "");
        return json({ ok: false, error: "Email send failed", detail: t }, 502);
    }

    return json({ ok: true }, 200);
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
            "content-type": "application/json",
            "cache-control": "no-store",
        },
    });
}