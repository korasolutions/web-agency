export async function onRequestPost({ request, env }) {
    try {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return json({
                ok: false,
                step: "content-type-check",
                error: "Unsupported Media Type"
            }, 415);
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
            return json({
                ok: true,
                step: "honeypot"
            }, 200);
        }

        const envCheck = {
            EMAILJS_CLOSER_SERVICE_ID: !!env.EMAILJS_CLOSER_SERVICE_ID,
            EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
            EMAILJS_CLOSER_PUBLIC_KEY: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
            EMAILJS_CLOSER_PRIVATE_KEY: !!env.EMAILJS_CLOSER_PRIVATE_KEY,
        };

        const missingEnv = Object.entries(envCheck)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missingEnv.length) {
            return json({
                ok: false,
                step: "env-check",
                error: "Missing Cloudflare env vars",
                detail: `Faltan variables: ${missingEnv.join(", ")}`,
                envCheck
            }, 500);
        }

        const name = clean(body.name, 80);
        const email = clean(body.email, 120);
        const phone = clean(body.phone, 40);
        const experience = clean(body.experience, 180);
        const message = clean(body.message, 4000);
        const subject = "Candidatura Closer KORA";

        if (!name || !email || !phone || !experience || !message) {
            return json({
                ok: false,
                step: "field-validation",
                error: "Missing fields"
            }, 400);
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            return json({
                ok: false,
                step: "email-validation",
                error: "Invalid email"
            }, 400);
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
                subject,
            },
        };

        let res;
        try {
            res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            return json({
                ok: false,
                step: "emailjs-fetch",
                error: "Fetch to EmailJS failed",
                detail: error instanceof Error ? error.message : String(error)
            }, 500);
        }

        let detail = "";
        try {
            detail = await res.text();
        } catch (error) {
            return json({
                ok: false,
                step: "emailjs-read-response",
                error: "Could not read EmailJS response",
                detail: error instanceof Error ? error.message : String(error)
            }, 500);
        }

        if (!res.ok) {
            return json({
                ok: false,
                step: "emailjs-response-not-ok",
                error: "EmailJS send failed",
                status: res.status,
                detail: detail || "EmailJS no devolvió detalle"
            }, 502);
        }

        return json({
            ok: true,
            step: "done",
            emailjsStatus: res.status,
            emailjsDetail: detail || "OK"
        }, 200);
    } catch (error) {
        return json({
            ok: false,
            step: "outer-catch",
            error: "Unhandled function error",
            detail: error instanceof Error ? error.message : String(error)
        }, 500);
    }
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
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}