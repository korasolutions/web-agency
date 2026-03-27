export async function onRequestPost({ request, env }) {
    return new Response(
        JSON.stringify({
            ok: true,
            marker: "VERSION_TEST_12345",
            method: request.method,
            hasService: !!env.EMAILJS_CLOSER_SERVICE_ID,
            hasTemplate: !!env.EMAILJS_CLOSER_TEMPLATE_INTERNAL_ID,
            hasPublic: !!env.EMAILJS_CLOSER_PUBLIC_KEY,
            hasPrivate: !!env.EMAILJS_CLOSER_PRIVATE_KEY
        }),
        {
            status: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": "no-store"
            }
        }
    );
}