document.addEventListener("DOMContentLoaded", () => {
    const projectTypeSelect = document.getElementById("web-project-type");
    const urgencySelect = document.getElementById("web-urgency");
    const checkboxes = document.querySelectorAll('input[name="web-extras"]');
    const resultSpan = document.getElementById("web-result-value");

    if (!projectTypeSelect || !urgencySelect || !resultSpan) return;

    const basePrices = {
        landing: 1000,
        corporate: 1200,
        ecommerce: 1800
    };

    const extraPrices = {
        seo: 250,
        blog: 180,
        multilang: 350,
        booking: 400,
        crm: 600,
        payments: 300
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
        const base = basePrices[projectType] || 1000;

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