export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept"
        }
    });
}

export async function onRequestPost({ request, env }) {
    const vars = getEnvVars(env);

    try {
        if (!vars.serviceId || !vars.templateId || !vars.publicKey || !vars.privateKey) {
            return json(
                {
                    ok: false,
                    error: "Faltan variables de entorno en Cloudflare"
                },
                500
            );
        }

        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return json({ ok: false, error: "Unsupported Media Type" }, 415);
        }

        const body = await request.json().catch(() => null);
        if (!body) {
            return json({ ok: false, error: "Bad JSON" }, 400);
        }

        if (body.website && String(body.website).trim() !== "") {
            return json({ ok: true }, 200);
        }

        const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                service_id: vars.serviceId,
                template_id: vars.templateId,
                user_id: vars.publicKey,
                accessToken: vars.privateKey,
                template_params: {
                    name: String(body.name || ""),
                    email: String(body.email || ""),
                    phone: String(body.phone || ""),
                    experience: String(body.experience || ""),
                    message: String(body.message || "")
                }
            })
        });

        const text = await res.text().catch(() => "");

        if (!res.ok) {
            return json(
                {
                    ok: false,
                    error: "EmailJS respondió error",
                    detail: text || `HTTP ${res.status}`
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
                detail: error?.message || String(error)
            },
            500
        );
    }
}

function getEnvVars(env) {
    return {
        serviceId: env.EMAILJS_CLOSER_SERVICE_ID,
        templateId: env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
        publicKey: env.EMAILJS_CLOSER_PUBLIC_KEY,
        privateKey: env.EMAILJS_CLOSER_PRIVATE_KEY
    };
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "Access-Control-Allow-Origin": "*"
        }
    });
}