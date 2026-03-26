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

    // Honeypot
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

    const templateParams = {
        name,
        email,
        phone,
        experience,
        message,
        subject,
    };

    // 1) Correo interno
    const internalPayload = {
        service_id: env.EMAILJS_CLOSER_SERVICE_ID,
        template_id: env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
        user_id: env.EMAILJS_CLOSER_PUBLIC_KEY,
        accessToken: env.EMAILJS_CLOSER_PRIVATE_KEY,
        template_params: templateParams,
    };

    const internalRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(internalPayload),
    });

    if (!internalRes.ok) {
        const detail = await internalRes.text().catch(() => "");
        return json(
            {
                ok: false,
                error: "Internal email send failed",
                detail,
            },
            502
        );
    }

    // 2) Auto-reply
    const autoReplyPayload = {
        service_id: env.EMAILJS_CLOSER_SERVICE_ID,
        template_id: env.EMAILJS_CLOSER_TEMPLATE_AUTOREPLY_ID,
        user_id: env.EMAILJS_CLOSER_PUBLIC_KEY,
        accessToken: env.EMAILJS_CLOSER_PRIVATE_KEY,
        template_params: templateParams,
    };

    const autoReplyRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(autoReplyPayload),
    });

    if (!autoReplyRes.ok) {
        const detail = await autoReplyRes.text().catch(() => "");
        return json(
            {
                ok: false,
                error: "Autoreply email send failed",
                detail,
            },
            502
        );
    }

    return json({ ok: true }, 200);
}

function clean(value, maxLength) {
    return String(value || "")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, maxLength);
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
        },
    });
}