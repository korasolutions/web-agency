export async function onRequestPost(context) {
    try {
        const { request, env } = context;

        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return json({ error: "Content-Type must be application/json" }, 400);
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
            return json({ error: "Falta configurar OPENROUTER_API_KEY." }, 500);
        }

        const normalizedLang = lang.startsWith("en") ? "en" : "es";

        const directPriceReply = getDirectPriceReply(userMessage, normalizedLang);
        if (directPriceReply) {
            return json({ reply: cleanReply(directPriceReply) }, 200);
        }

        const systemPrompt = buildSystemPrompt(normalizedLang);

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://koradigitalsolutions.com",
                "X-Title": "KORA Chatbot"
            },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                max_tokens: 120,
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

        const rawReply =
            data?.choices?.[0]?.message?.content?.trim() ||
            fallbackReply(normalizedLang);

        const reply = cleanReply(rawReply);

        return json({ reply }, 200);

    } catch (error) {
        return json(
            {
                error: "Error interno.",
                details: error?.message || "Unknown error"
            },
            500
        );
    }
}

function buildSystemPrompt(lang = "es") {
    if (lang === "en") {
        return `
You are KORA Digital Solutions' virtual assistant.

Your job is to answer like the real website, in a natural chat style, with very short plain text replies.

About KORA:
KORA is a digital agency in Lanzarote that creates custom websites and AI automation systems.
KORA does not sell generic websites. KORA builds tailored digital solutions designed to improve brand presence, conversions and efficiency.
KORA works as a strategic partner, not just a supplier.

Main positioning:
Custom web design and AI automations for businesses.
More than an agency, KORA acts as a strategic partner in digital transformation.
The goal is to help businesses convert more and work less.

Ideal clients:
Local businesses and SMEs ready to invest in professional digital solutions.
Businesses with outdated websites, weak online presence or manual processes that waste time and opportunities.

Main services:
Custom web development.
Landing pages.
Corporate websites.
Online stores.
Website maintenance.
AI automations for customer support, social media, administration and internal processes.

Typical extras for web:
Advanced SEO.
Blog.
Multilanguage.
Booking system.
CRM or customer management.
Payment gateway.

Typical extras for AI:
WhatsApp integration.
Email integration.
Sheets integration.
Calendar integration.
Automatic alerts.
Document generation.

How KORA works:
Strategy.
Visual demo.
Development.
Launch.
Projects are custom made.
No generic templates.
No unlimited changes.
Communication is clear and structured.

Business style:
KORA values authenticity, commitment and results.
KORA aims to create digital assets that reflect the brand and generate real growth.

Pricing guidance:
A simple web project usually starts around 1000€.
A web plus AI project usually starts around 1500€ to 3000€ depending on scope.
Monthly maintenance or support can start from 100€ to 300€ per month.
If asked for a rough estimate, be helpful but always say it is approximate and depends on scope.
Never invent features that KORA does not mention.
Never promise impossible deadlines or unlimited revisions.

Chat behavior rules:
Reply only in plain text.
No markdown.
No bullet points.
No numbered lists.
No emojis.
No headings.
Maximum 3 short sentences.
Maximum about 260 characters when possible.
Sound natural, direct and professional, like a WhatsApp chat with a real potential client.
If the user asks for price, guide them briefly and mention that KORA can prepare a custom proposal.
If the user asks about legal, privacy or cookies, answer briefly and clearly.
If the user asks something unrelated to KORA, redirect politely to KORA's services.
When relevant, invite the user to contact KORA through the website form or email.
`;
    }

    return `
Eres el asistente virtual de KORA Digital Solutions.

Tu función es responder como la web real de KORA, con un tono natural de chat y respuestas muy cortas en texto plano.

Sobre KORA:
KORA es una agencia digital en Lanzarote que crea webs a medida y sistemas de automatización con inteligencia artificial.
KORA no vende webs genéricas. KORA construye soluciones digitales personalizadas para mejorar presencia, conversión y eficiencia.
KORA actúa como socio estratégico, no solo como proveedor.

Posicionamiento principal:
Desarrollo web a medida y automatizaciones IA para negocios.
Más que una agencia, KORA acompaña la transformación digital del cliente.
El objetivo es ayudar a las empresas a convertir más y trabajar menos.

Cliente ideal:
Negocios locales y pymes dispuestos a invertir en soluciones profesionales.
Empresas con webs obsoletas, presencia digital débil o procesos manuales que hacen perder tiempo y clientes.

Servicios principales:
Desarrollo web a medida.
Landing pages.
Webs corporativas.
Tiendas online.
Mantenimiento web.
Automatizaciones IA para atención al cliente, redes sociales, administración y procesos internos.

Extras habituales para web:
SEO avanzado.
Blog.
Multidioma.
Sistema de reservas.
CRM o gestión de clientes.
Pasarela de pagos.

Extras habituales para IA:
Integración con WhatsApp.
Integración con email.
Integración con Sheets.
Integración con calendario.
Alertas automáticas.
Generación de documentos.

Cómo trabaja KORA:
Estrategia.
Demo visual.
Desarrollo.
Lanzamiento.
Los proyectos se hacen a medida.
No se usan plantillas genéricas.
No hay cambios ilimitados.
La comunicación es clara y estructurada.

Estilo de negocio:
KORA valora autenticidad, compromiso y resultados.
Busca crear activos digitales que reflejen la marca y generen crecimiento real.

Orientación de precios:
Una web profesional sencilla suele empezar alrededor de 1000€.
Una web con IA suele moverse desde 1500€ hasta 3000€ según alcance.
El mantenimiento o soporte mensual puede empezar desde 100€ a 300€ al mes.
Si el usuario pregunta por precio, ayuda de forma breve y deja claro que es orientativo y depende del alcance.
Nunca inventes servicios que KORA no mencione.
Nunca prometas plazos imposibles ni cambios ilimitados.

Normas del chat:
Responde solo en texto plano.
Sin markdown.
Sin listas.
Sin emojis.
Sin encabezados.
Máximo 3 frases cortas.
Máximo unos 260 caracteres cuando sea posible.
Habla natural, directo y profesional, como un chat de WhatsApp con un cliente real.
Si preguntan por precios, guía de forma breve y menciona que KORA puede preparar una propuesta personalizada.
Si preguntan por temas legales, privacidad o cookies, responde de forma breve y clara.
Si preguntan algo no relacionado con KORA, redirígelos amablemente a los servicios de KORA.
Cuando tenga sentido, invita a contactar por el formulario de la web o por email.
`;
}

function getDirectPriceReply(message, lang = "es") {
    const text = normalizeText(message);

    if (!looksLikePriceQuestion(text)) {
        return null;
    }

    const webData = detectWebQuote(text);
    const aiData = detectAiQuote(text);

    if (webData && aiData) {
        const total = webData.finalPrice + aiData.finalPrice;
        const finalCombined = toMarketingPrice(total);

        if (lang === "en") {
            return `A rough estimate for both would be around ${finalCombined}€. It is an approximate calculation based on the website options and may vary depending on the final scope.`;
        }

        return `Una estimación orientativa para ambas cosas sería de unos ${finalCombined}€. Es un cálculo aproximado según las opciones de la web y puede variar según el alcance final.`;
    }

    if (webData) {
        if (lang === "en") {
            return `Your estimated web budget would be around ${webData.finalPrice}€. It is an approximate calculation and if you want, KORA can prepare a more precise proposal for your project.`;
        }

        return `Tu presupuesto web orientativo sería de unos ${webData.finalPrice}€. Es un cálculo aproximado y, si quieres, KORA puede prepararte una propuesta más precisa para tu proyecto.`;
    }

    if (aiData) {
        if (lang === "en") {
            return `Your estimated AI automation budget would be around ${aiData.finalPrice}€. It is an approximate calculation and KORA can refine it based on your business workflow.`;
        }

        return `Tu inversión orientativa en automatización IA sería de unos ${aiData.finalPrice}€. Es un cálculo aproximado y KORA puede ajustarlo mejor según el flujo real de tu negocio.`;
    }

    if (lang === "en") {
        return "KORA handles custom quotes for websites and AI automations. Tell me if you need web, AI, or both, and I will give you a rough estimate.";
    }

    return "KORA trabaja presupuestos a medida para web y automatizaciones IA. Dime si necesitas web, IA o ambas y te doy una estimación orientativa.";
}

function detectWebQuote(text) {
    const mentionsWeb =
        hasAny(text, ["web", "pagina", "página", "sitio", "landing", "corporativa", "corporativo", "ecommerce", "tienda online", "tienda", "store"]);

    if (!mentionsWeb) return null;

    const basePrices = {
        landing: 600,
        corporate: 700,
        ecommerce: 800
    };

    const extraPrices = {
        seo: 250,
        blog: 180,
        multilang: 350,
        booking: 400,
        crm: 600,
        payments: 300
    };

    let projectType = "corporate";

    if (hasAny(text, ["landing", "landing page"])) {
        projectType = "landing";
    } else if (hasAny(text, ["ecommerce", "tienda online", "tienda", "store", "shop"])) {
        projectType = "ecommerce";
    } else if (hasAny(text, ["corporativa", "corporativo", "empresa", "negocio", "corporate"])) {
        projectType = "corporate";
    }

    let extrasTotal = 0;

    if (hasAny(text, ["seo"])) extrasTotal += extraPrices.seo;
    if (hasAny(text, ["blog"])) extrasTotal += extraPrices.blog;
    if (hasAny(text, ["multidioma", "multilenguaje", "varios idiomas", "idiomas", "multilanguage", "multilang"])) extrasTotal += extraPrices.multilang;
    if (hasAny(text, ["reserva", "reservas", "booking", "citas"])) extrasTotal += extraPrices.booking;
    if (hasAny(text, ["crm", "clientes", "gestion de clientes", "gestión de clientes"])) extrasTotal += extraPrices.crm;
    if (hasAny(text, ["pago", "pagos", "pasarela", "stripe", "checkout", "payment", "payments"])) extrasTotal += extraPrices.payments;

    const multiplier = detectUrgencyMultiplier(text);
    const total = (basePrices[projectType] + extrasTotal) * multiplier;
    const finalPrice = toMarketingPrice(total);

    return { projectType, finalPrice };
}

function detectAiQuote(text) {
    const mentionsAi =
        hasAny(text, [
            "ia",
            "inteligencia artificial",
            "automatizacion",
            "automatización",
            "automatizar",
            "chatbot",
            "whatsapp",
            "email",
            "social media",
            "redes",
            "administracion",
            "administración",
            "procesos internos",
            "internal processes",
            "customer support"
        ]);

    if (!mentionsAi) return null;

    const basePrices = {
        "customer-support": 600,
        "social-media": 800,
        administration: 900,
        "internal-processes": 700
    };

    const extraPrices = {
        whatsapp: 300,
        email: 200,
        tools: 400,
        calendar: 250,
        alerts: 200,
        documents: 350
    };

    let projectType = "customer-support";

    if (hasAny(text, ["atencion al cliente", "atención al cliente", "customer support", "chatbot", "faq"])) {
        projectType = "customer-support";
    } else if (hasAny(text, ["redes", "instagram", "social media", "comentarios", "publicaciones"])) {
        projectType = "social-media";
    } else if (hasAny(text, ["administracion", "administración", "facturas", "facturacion", "facturación", "agenda", "citas"])) {
        projectType = "administration";
    } else if (hasAny(text, ["procesos internos", "internal processes", "notion", "sheets", "sincronizacion", "sincronización", "erp", "crm"])) {
        projectType = "internal-processes";
    }

    let extrasTotal = 0;

    if (hasAny(text, ["whatsapp"])) extrasTotal += extraPrices.whatsapp;
    if (hasAny(text, ["email", "correo"])) extrasTotal += extraPrices.email;
    if (hasAny(text, ["sheets", "google sheets", "herramientas", "tools", "notion", "crm", "erp"])) extrasTotal += extraPrices.tools;
    if (hasAny(text, ["calendar", "calendario", "agenda", "citas"])) extrasTotal += extraPrices.calendar;
    if (hasAny(text, ["alerta", "alertas", "notificaciones", "alerts"])) extrasTotal += extraPrices.alerts;
    if (hasAny(text, ["documentos", "documents", "pdf", "informes", "reportes", "report"])) extrasTotal += extraPrices.documents;

    const multiplier = detectUrgencyMultiplier(text);
    const total = (basePrices[projectType] + extrasTotal) * multiplier;
    const finalPrice = toMarketingPrice(total);

    return { projectType, finalPrice };
}

function looksLikePriceQuestion(text) {
    return hasAny(text, [
        "precio",
        "precios",
        "presupuesto",
        "coste",
        "costo",
        "cuanto cuesta",
        "cuánto cuesta",
        "cuanto costaria",
        "cuánto costaría",
        "calcular",
        "estimacion",
        "estimación",
        "quote",
        "budget",
        "price",
        "pricing",
        "how much"
    ]);
}

function detectUrgencyMultiplier(text) {
    if (hasAny(text, ["urgente", "urgent", "2-5 dias", "2-5 días"])) return 1.5;
    if (hasAny(text, ["prioritario", "priority", "1-2 semanas", "1-2 weeks"])) return 1.25;
    return 1;
}

function toMarketingPrice(value) {
    const rounded = Math.round(value / 100) * 100;
    return rounded - 1;
}

function hasAny(text, terms) {
    return terms.some(term => text.includes(normalizeText(term)));
}

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanReply(text) {
    if (!text) return "";

    let cleaned = String(text);

    cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
    cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
    cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
    cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
    cleaned = cleaned.replace(/^\s*[-*•]\s+/gm, "");
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "");
    cleaned = cleaned.replace(/^\s*>\s+/gm, "");
    cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    cleaned = cleaned.replace(/[`~]/g, "");
    cleaned = cleaned.replace(/\r?\n+/g, " ");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    cleaned = sentences.slice(0, 3).join(" ").trim();

    if (cleaned.length > 260) {
        cleaned = cleaned.slice(0, 257).trim() + "...";
    }

    return cleaned;
}

function fallbackReply(lang = "es") {
    if (lang === "en") {
        return "I can help you with KORA's website development and AI automation services. Tell me what you need and I will guide you briefly.";
    }

    return "Puedo ayudarte con los servicios de desarrollo web y automatización IA de KORA. Cuéntame qué necesitas y te guío de forma breve.";
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