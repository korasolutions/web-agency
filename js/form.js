/* ======================================================
   ENVIAR/RECIBIR CORREOS DE CONTACTO
   ====================================================== */
emailjs.init("xzdJEFvCR4WJdUhUf");

document.getElementById("contact-form").addEventListener("submit", function (e) {
    e.preventDefault();

    // anti-spam honeypot
    if (this.website.value !== "") return;

    const form = this;
    const btn = form.querySelector("button");
    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = "Enviando...";

    emailjs.send("service_uxc2s4t", "template_86mlqgg", {
        name: form.name.value,
        email: form.email.value,
        subject: form.subject.value || "Nuevo mensaje desde la web",
        message: form.message.value,
    })
        .then(() => {
            alert("Mensaje enviado correctamente");
            form.reset();
        })
        .catch((error) => {
            alert("Error al enviar");
            console.error("EmailJS error:", error);
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        });
});