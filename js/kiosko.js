// ========== LÓGICA DE CARRITO DEMO PARA KIOSKO (en servicios.html) ==========
const cart = [];
const cartContainer = document.querySelector('.cart-items-urban');
const totalAmountSpan = document.querySelector('.total-amount-urban');
const checkoutBtn = document.querySelector('.cart-checkout-urban');

function updateCartDisplay() {
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">Carrito vacío</div>';
        if (totalAmountSpan) totalAmountSpan.textContent = '0,00 €';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        html += `
                <div class="cart-item-urban">
                    <span>${item.name}</span>
                    <span class="cart-item-price">${item.price.toFixed(2)} €</span>
                    <button class="cart-item-remove" data-index="${index}" aria-label="Eliminar item" style="background: none; border: none; color: #ff6b6b; font-size: 1.2rem; cursor: pointer;">×</button>
                </div>
            `;
    });
    cartContainer.innerHTML = html;
    if (totalAmountSpan) totalAmountSpan.textContent = total.toFixed(2) + ' €';

    // Habilitar/deshabilitar botón de pago
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    // Añadir listeners a los botones de eliminar
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            cart.splice(index, 1);
            updateCartDisplay();
        });
    });
}

// Añadir items al carrito (para .kiosk-item-urban)
document.querySelectorAll('.item-add-urban').forEach(btn => {
    btn.addEventListener('click', function () {
        const itemDiv = this.closest('.kiosk-item-urban');
        const itemName = itemDiv.dataset.item || itemDiv.querySelector('.item-name-urban').textContent;
        const priceText = itemDiv.dataset.price || itemDiv.querySelector('.item-price-urban').textContent;
        // Extraer número del precio (formato "8,50 €" o "8.50")
        let price = parseFloat(priceText.replace(',', '.').replace('€', '').trim());
        if (isNaN(price)) price = 0;

        cart.push({ name: itemName, price: price });
        updateCartDisplay();

        // Efecto de feedback
        this.style.transform = 'scale(0.9)';
        setTimeout(() => this.style.transform = '', 200);
    });
});

// Botón checkout demo
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
        if (cart.length === 0) return;
        alert('¡Gracias por tu pedido demo! En un entorno real se procesaría el pago.');
        // Vaciar carrito
        cart.length = 0;
        updateCartDisplay();
    });
}

// Inicializar carrito vacío
updateCartDisplay();