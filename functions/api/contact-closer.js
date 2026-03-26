export async function onRequestGet() {
    return new Response(
        JSON.stringify({ ok: true, method: "GET", route: "contact-closer" }),
        {
            status: 200,
            headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
            },
        }
    );
}

export async function onRequestPost() {
    return new Response(
        JSON.stringify({ ok: true, method: "POST", route: "contact-closer" }),
        {
            status: 200,
            headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
            },
        }
    );
}