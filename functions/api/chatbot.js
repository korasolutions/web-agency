export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return json(
                { error: "Content-Type must be application/json" },
                400
            );
        }

        const body = await request.json();
        const userMessage = String(body?.message || "").trim();
        const lang = String(body?.lang || "es").toLowerCase();

        if (!userMessage) {
            return json({ error: "Falta el mensaje del usuario." }, 400);
        }

        const apiKey = env.OPENROUTER_API_KEY;
        const model = env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

        if (!apiKey) {
            return json(
                { error: "Falta configurar OPENROUTER_API_KEY en las variables de entorno." },
                500
            );
        }

        const systemPromptEs = `
Eres el asistente virtual de KORA Digital Solutions.

Tu misión:
- Responder solo preguntas relacionadas con KORA, su web, sus servicios y su forma de trabajo.
- Ayudar a posibles clientes a entender qué ofrece KORA.
- Guiar al usuario hacia contacto o solicitud de propuesta cuando tenga sentido.

Información oficial de KORA:
- KORA es una agencia digital que crea webs de alto impacto y sistemas de IA para que los negocios conviertan más y trabajen menos.
- Problema que resuelve: empresas con webs obsoletas y procesos manuales que pierden clientes y tiempo.
- Cliente ideal: negocios locales y pymes que quieren digitalizarse rápido y están dispuestos a invertir en soluciones profesionales.

Servicios principales:
1) Desarrollo web a medida
- Landing pages
- Webs corporativas
- Tiendas online
- Mantenimiento web
- Webs rápidas, seguras y orientadas a conversión

2) Automatizaciones con IA
- Chatbots 24/7 para atención al cliente
- Respuestas automáticas por email
- Automatización de WhatsApp
- Automatización de redes sociales
- Administración y agendas
- Automatización de procesos internos
- Integraciones con herramientas como CRM, ERP, Sheets, Notion
- Alertas automáticas
- Generación de documentos

Modelo de trabajo:
- Proyectos cerrados y servicios recurrentes opcionales
- 20% al inicio
- 80% a la entrega
- No se empieza sin adelanto
- 1–2 rondas de cambios máximo dentro del alcance
- Si el cambio se sale del pack, se presupuesta aparte

Packs orientativos:
- Starter Web: 1.000€ – 1.300€
- Web + IA: 1.800€ – 2.500€
- Pro / Automatización: desde 3.000€
- Mantenimiento / soporte: 200€ – 400€/mes
- Soporte IA / mejoras: 200€ – 400€/mes

Precios base internos orientativos:
- Web profesional: estándar 1.200€, mínimo 1.000€
- Web + IA: estándar 2.000€, mínimo 1.500€
- Automatizaciones / IA avanzada: desde 3.000€

Tecnologías:
- Frontend: HTML, CSS, JS
- Backend: Node.js / Python (Flask / FastAPI)
- IA: APIs de IA, prompts controlados, chatbots, FAQs inteligentes, automatización básica
- Herramientas: Notion, Slack, WhatsApp, Email, Git, GitHub

Contacto:
- Email: info@koradigitalsolutions.com
- Ubicación: Lanzarote, España
- Redes: Instagram, LinkedIn, X/Twitter
- Si el usuario quiere un presupuesto exacto, indícale que contacte desde el formulario web.

Normas de respuesta:
- Responde siempre de forma clara, breve y útil.
- No inventes servicios que KORA no ofrece.
- No prometas funcionalidades no confirmadas.
- Si preguntan precio exacto, aclara que solo puedes dar una orientación.
- Si preguntan algo fuera del ámbito de KORA, responde amablemente que solo puedes ayudar con información sobre KORA y sus servicios.
- Si detectas intención comercial, termina invitando a contactar.
- No uses markdown complejo.
- Responde en español.
`;

        const systemPromptEn = `
You are the virtual assistant of KORA Digital Solutions.

Your mission:
- Answer only questions related to KORA, its website, services, and workflow.
- Help potential clients understand what KORA offers.
- Guide users toward contact or requesting a proposal when relevant.

Official KORA information:
- KORA is a digital agency that creates high-impact websites and AI systems so businesses can convert more and work less.
- Problem solved: companies with outdated websites and manual processes that lose clients and time.
- Ideal clients: local businesses and SMEs that want to digitize quickly and are willing to invest in professional solutions.

Main services:
1) Custom web development
- Landing pages
- Corporate websites
- Online stores
- Website maintenance
- Fast, secure, conversion-oriented websites

2) AI automations
- 24/7 customer support chatbots
- Automatic email replies
- WhatsApp automation
- Social media automation
- Administration and scheduling
- Internal process automation
- Integrations with tools like CRM, ERP, Sheets, Notion
- Automatic alerts
- Document generation

Workflow:
- Fixed-scope projects and optional recurring services
- 20% upfront
- 80% on delivery
- Work does not start without deposit
- 1–2 review rounds max within scope
- Out-of-scope changes are quoted separately

Indicative packages:
- Starter Web: €1,000 – €1,300
- Web + AI: €1,800 – €2,500
- Pro / Automation: from €3,000
- Maintenance / support: €200 – €400/month
- AI support / improvements: €200 – €400/month

Indicative internal pricing:
- Professional website: standard €1,200, minimum €1,000
- Website + AI: standard €2,000, minimum €1,500
- Advanced automations / AI: from €3,000

Tech stack:
- Frontend: HTML, CSS, JS
- Backend: Node.js / Python (Flask / FastAPI)
- AI: AI APIs, controlled prompts, chatbots, smart FAQs, basic automation
- Internal tools: Notion, Slack, WhatsApp, Email, Git, GitHub

Contact:
- Email: info@koradigitalsolutions.com
- Location: Lanzarote, Spain
- Socials: Instagram, LinkedIn, X/Twitter
- If the user wants an exact quote, tell them to use the contact form.

Response rules:
- Be clear, brief, and useful.
- Do not invent services KORA does not offer.
- Do not promise unconfirmed features.
- If asked for exact pricing, clarify you can only provide an estimate.
- If asked something outside KORA’s scope, politely say you can only help with KORA-related information.
- If there is commercial intent, end by inviting the user to contact KORA.
- Reply in English.
`;

        const systemPrompt = lang.startsWith("en") ? systemPromptEn : systemPromptEs;

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://koradigitalsolutions.com",
                "X-Title": "KORA Website Chatbot"
            },
            body: JSON.stringify({
                model,
                temperature: 0.4,
                max_tokens: 500,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ]
            })
        });

        const data = await openRouterResponse.json();

        if (!openRouterResponse.ok) {
            return json(
                {
                    error: "Error al consultar OpenRouter.",
                    details: data
                },
                openRouterResponse.status
            );
        }

        const reply =
            data?.choices?.[0]?.message?.content?.trim() ||
            (lang.startsWith("en")
                ? "Sorry, I couldn't generate a response right now."
                : "Lo siento, no pude generar una respuesta ahora mismo.");

        return json({ reply }, 200);
    } catch (error) {
        return json(
            {
                error: "Error interno del chatbot.",
                details: error?.message || "Unknown error"
            },
            500
        );
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}