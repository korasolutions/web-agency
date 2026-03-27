export async function onRequestPost({ request, env }) {
    try {
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
        const phone = clean(body.phone, 20);
        const experience = clean(body.experience, 200);
        const message = clean(body.message, 4000);

        if (!name || !email || !message || !phone || !experience) {
            return json({ ok: false, error: "Missing fields" }, 400);
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            return json({ ok: false, error: "Invalid email" }, 400);
        }

        // Validación ENV
        if (
            !env.EMAILJS_CLOSER_SERVICE_ID ||
            !env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID ||
            !env.EMAILJS_CLOSER_PUBLIC_KEY ||
            !env.EMAILJS_CLOSER_PRIVATE_KEY
        ) {
            return json(
                {
                    ok: false,
                    error: "Faltan variables de entorno EmailJS",
                    detail: {
                        service: !!env.EMAILJS_CLOSER_SERVICE_ID,
                        template: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
                        public: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
                        private: !!env.EMAILJS_CLOSER_PRIVATE_KEY,
                    },
                },
                500
            );
        }

        const payload = {
            service_id: env.EMAILJS_CLOSER_SERVICE_ID,
            template_id: env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
            user_id: env.EMAILJS_CLOSER_PUBLIC_KEY,
            accessToken: env.EMAILJS_CLOSER_PRIVATE_KEY,
            template_params: { name, email, phone, experience, message },
        };

        let r;
        try {
            r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch (fetchError) {
            return json(
                {
                    ok: false,
                    error: "Fallo al conectar con EmailJS",
                    detail: fetchError.message,
                },
                502
            );
        }

        const text = await r.text().catch(() => "");

        if (!r.ok) {
            return json(
                {
                    ok: false,
                    error: "EmailJS respondió error",
                    detail: text,
                },
                502
            );
        }

        return json({ ok: true }, 200);
    } catch (error) {
        return json(
            {
                ok: false,
                error: "Excepción en backend",
                detail: error?.message || String(error),
            },
            500
        );
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
            "content-type": "application/json",
            "cache-control": "no-store",
        },
    });
}