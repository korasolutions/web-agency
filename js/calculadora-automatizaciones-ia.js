document.addEventListener("DOMContentLoaded", () => {
    const projectTypeSelect = document.getElementById("ia-project-type");
    const urgencySelect = document.getElementById("ia-urgency");
    const checkboxes = document.querySelectorAll('input[name="ia-extras"]');
    const resultSpan = document.getElementById("ia-result-value");

    if (!projectTypeSelect || !urgencySelect || !resultSpan) return;

    const basePrices = {
        "customer-support": 1800,
        "social-media": 1500,
        "administration": 2000,
        "internal-processes": 2500
    };

    const extraPrices = {
        whatsapp: 300,
        email: 200,
        tools: 400,
        calendar: 250,
        alerts: 200,
        documents: 350
    };

    function toMarketingPrice(value) {
        const rounded = Math.round(value / 100) * 100;
        return rounded - 1;
    }

    function renderPrice(finalPrice) {
        const before = toMarketingPrice(finalPrice * 1.18);

        resultSpan.innerHTML = `
            <div class="price-before">
                <span class="price-old">${before}€</span>
            </div>
            <div class="price-now">${finalPrice}€</div>
        `;
    }

    function calculatePrice() {
        const projectType = projectTypeSelect.value;
        const base = basePrices[projectType] || 1800;

        let extrasTotal = 0;

        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                extrasTotal += extraPrices[checkbox.value] || 0;
            }
        });

        const urgencyMultiplier = parseFloat(urgencySelect.value) || 1;
        const total = (base + extrasTotal) * urgencyMultiplier;

        const finalPrice = toMarketingPrice(total);

        renderPrice(finalPrice);
    }

    projectTypeSelect.addEventListener("change", calculatePrice);
    urgencySelect.addEventListener("change", calculatePrice);

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", calculatePrice);
    });

    calculatePrice();
});