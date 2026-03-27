export async function onRequestGet() {
    return new Response("OK GET CLOSER", {
        status: 200,
        headers: {
            "content-type": "text/plain; charset=utf-8"
        }
    });
}

export async function onRequestPost({ request }) {
    let raw = "";

    try {
        raw = await request.text();

        return new Response(
            JSON.stringify({
                ok: true,
                method: "POST",
                received: raw
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