export async function onRequestPost({ request, env }) {
    try {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return json({ ok: false, error: "Unsupported Media Type" }, 415);
        }

        const body = await request.json();

        return json({
            ok: true,
            received: {
                name: body.name || "",
                email: body.email || "",
                phone: body.phone || "",
                experience: body.experience || "",
                message: body.message || ""
            },
            envCheck: {
                service: !!env.EMAILJS_CLOSER_SERVICE_ID,
                template: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
                publicKey: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
                privateKey: !!env.EMAILJS_CLOSER_PRIVATE_KEY
            }
        });
    } catch (error) {
        return json(
            {
                ok: false,
                error: "Unhandled function error",
                detail: error instanceof Error ? error.message : String(error)
            },
            500
        );
    }
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