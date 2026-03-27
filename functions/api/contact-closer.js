export async function onRequestGet() {
    return new Response("OK GET CLOSER", {
        status: 200,
        headers: {
            "content-type": "text/plain; charset=utf-8"
        }
    });
}

export async function onRequestPost({ request, env }) {
    try {
        const contentType = request.headers.get("content-type") || "";
        const raw = await request.text();

        return new Response(
            JSON.stringify({
                ok: true,
                contentType,
                hasCloserServiceId: !!env.EMAILJS_CLOSER_SERVICE_ID,
                hasCloserTemplateId: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
                hasCloserPublicKey: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
                hasCloserPrivateKey: !!env.EMAILJS_CLOSER_PRIVATE_KEY,
                raw
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                    "cache-control": "no-store"
                }
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : String(error)
            }),
            {
                status: 500,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                    "cache-control": "no-store"
                }
            }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}