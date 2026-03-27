export async function onRequestGet() {
    return json({
        ok: true,
        route: "/api/contact-closer",
        method: "GET"
    }, 200);
}

export async function onRequestPost({ request, env }) {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return json({ ok: false, error: "Unsupported Media Type" }, 415);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "Bad JSON" }, 400);
    }

    if (body.website && String(body.website).trim() !== "") {
        return json({ ok: true }, 200);
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const phone = clean(body.phone, 40);
    const experience = clean(body.experience, 180);
    const message = clean(body.message, 4000);
    const subject = "Candidatura Closer KORA";

    if (!name || !email || !phone || !experience || !message) {
        return json({ ok: false, error: "Missing fields" }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json({ ok: false, error: "Invalid email" }, 400);
    }

    if (
        !env.EMAILJS_CLOSER_SERVICE_ID ||
        !env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID ||
        !env.EMAILJS_CLOSER_PUBLIC_KEY ||
        !env.EMAILJS_CLOSER_PRIVATE_KEY
    ) {
        return json({ ok: false, error: "Missing Cloudflare env vars" }, 500);
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
        const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!r.ok) {
            const t = await r.text().catch(() => "");
            return json({
                ok: false,
                error: "Email send failed",
                detail: t || `HTTP ${r.status}`
            }, 502);
        }

        return json({ ok: true }, 200);
    } catch (error) {
        return json({
            ok: false,
            error: "Unhandled function error",
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