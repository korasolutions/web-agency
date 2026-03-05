// Esta función es solo para verivicar que el entorno de Cloudflare Functions está funcionando correctamente.
// Para probarla accedan a https://koradigitalsolutions.com/api/ping
// Si les aparece {"ok":true,"pong":true} entonces todo está bien.

export function onRequestGet() {
    return new Response(JSON.stringify({ ok: true, pong: true }), {
        headers: { "content-type": "application/json" },
    });
}