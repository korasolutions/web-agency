document.addEventListener('DOMContentLoaded', function () {

    // ========== CARGA DE COMPONENTES REUTILIZABLES ==========
    function loadComponent(id, file) {
        return fetch(file)
            .then(response => response.text())
            .then(html => {
                const mount = document.getElementById(id);
                if (mount) mount.innerHTML = html;
            })
            .catch(error => console.error('Error cargando componente:', error));
    }

    // ========== INIT DESPUÉS DE CARGAR HEADER/FOOTER ==========
    function initCurrentYear() {
        const el = document.getElementById('currentYear');
        if (el) el.textContent = new Date().getFullYear();
    }

    function initHeaderAndMenu() {
        const header = document.querySelector('.header');
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.nav');

        const closeMenu = () => {
            if (!nav || !menuToggle) return;
            nav.classList.remove('active');

            const spans = menuToggle.querySelectorAll('span');
            if (spans[0]) spans[0].style.transform = 'none';
            if (spans[1]) spans[1].style.transform = 'none';

            document.body.style.overflow = '';
            document.querySelectorAll('.nav .dropdown').forEach(drop => drop.classList.remove('active'));
        };

        // Header dinámico: compacto + aparece al subir / se oculta al bajar
        if (header) {
            let lastY = window.scrollY;
            let ticking = false;
            const onScrollHeader = () => {
                const currentY = window.scrollY;

                header.classList.toggle('scrolled', currentY > 50);
                if (nav && nav.classList.contains('active')) {
                    header.classList.remove('is-hidden');
                    lastY = currentY;
                    return;
                }
                if (currentY <= 10) {
                    header.classList.remove('is-hidden');
                    lastY = currentY;
                    return;
                }
                const delta = currentY - lastY;

                if (delta < 0) {
                    header.classList.remove('is-hidden');
                }
                else if (delta > 0) {
                    header.classList.add('is-hidden');
                }
                lastY = currentY;
            };

            window.addEventListener(
                'scroll',
                () => {
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            onScrollHeader();
                            ticking = false;
                        });
                        ticking = true;
                    }
                },
                { passive: true }
            );
            onScrollHeader();
        }

        // Menú hamburguesa (solo si existe)
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                nav.classList.toggle('active');

                const spans = menuToggle.querySelectorAll('span');
                if (nav.classList.contains('active')) {
                    if (spans[0]) spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
                    if (spans[1]) spans[1].style.transform = 'rotate(-45deg) translate(4px, -4px)';
                    document.body.style.overflow = 'hidden';
                } else {
                    closeMenu();
                }
            });

            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', function (event) {
                if (nav.classList.contains('active') && !nav.contains(event.target) && !menuToggle.contains(event.target)) {
                    closeMenu();
                }
            });

            // Dropdown en móvil
            nav.querySelectorAll('.dropdown > .nav-link').forEach(item => {
                item.addEventListener('click', function (e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        const parent = this.parentElement;
                        parent.classList.toggle('active');
                    }
                });
            });

            // Cerrar menú al hacer scroll (opcional)
            window.addEventListener('scroll', function () {
                if (nav.classList.contains('active') && window.scrollY > 100) closeMenu();
            }, { passive: true });

            // Si haces clic en un enlace del menú, ciérralo (evita "scroll congelado" por overflow hidden)
            nav.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    if (nav.classList.contains('active')) closeMenu();
                });
            });
        }

        // Scroll suave (si hay anchors tipo #... en la página)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (!href || href === '#' || !href.startsWith('#')) return;

                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (!targetElement) return;

                e.preventDefault();

                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({ top: targetPosition, behavior: 'smooth' });

                // Cierra menú móvil si estaba abierto
                if (nav && nav.classList.contains('active')) closeMenu();
            });
        });
    }

    Promise.all([
        loadComponent("header-placeholder", "tpl/header.html"),
        loadComponent("footer-placeholder", "tpl/footer.html")
    ]).then(() => {
        initHeaderAndMenu();
        initCurrentYear();
    });

    // ========== SISTEMA DE PARTÍCULAS FLOTANTES ==========
    function createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'floating-particles';
        document.body.appendChild(particlesContainer);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Posición aleatoria
            const size = Math.random() * 10 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;

            // Color aleatorio entre azul y rojo
            const colors = [
                'rgba(58, 90, 120, 0.3)',
                'rgba(255, 107, 107, 0.3)',
                'rgba(90, 120, 150, 0.3)'
            ];
            particle.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]} 0%, transparent 70%)`;

            // Animación personalizada
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            particle.style.animation = `floatParticle ${duration}s infinite linear ${delay}s`;

            particlesContainer.appendChild(particle);
        }
    }

    createParticles();

    // ========== EFECTO PARALLAX 3D ==========
    function createParallaxLayers() {
        const layersContainer = document.createElement('div');
        layersContainer.className = 'parallax-layers';
        document.body.appendChild(layersContainer);

        // Crear varias capas de parallax
        for (let i = 1; i <= 3; i++) {
            const layer = document.createElement('div');
            layer.className = `parallax-layer layer-${i}`;
            layersContainer.appendChild(layer);
        }

        // Aplicar efecto parallax al hacer scroll
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const layers = document.querySelectorAll('.parallax-layer');

            layers.forEach((layer, index) => {
                const speed = 0.3 + (index * 0.1);
                const yPos = -(scrolled * speed);
                layer.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    createParallaxLayers();

    // ========== ANIMACIONES AL SCROLL ==========
    const fadeElements = document.querySelectorAll('.fade-in');

    const checkFade = () => {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight * 0.85 && elementBottom > 0) {
                const delay = element.getAttribute('data-delay') || 0;

                setTimeout(() => {
                    element.classList.add('visible');
                }, delay * 1000);
            }
        });
    };

    window.addEventListener('scroll', checkFade);
    window.addEventListener('load', checkFade);
    checkFade();

    // ========== EFECTO DE MOUSE TRACKING 3D ==========
    // document.addEventListener('mousemove', (e) => {
    //     const mouseX = e.clientX / window.innerWidth;
    //     const mouseY = e.clientY / window.innerHeight;

    //     // Efecto en tarjetas de servicios
    //     document.querySelectorAll('.service-card').forEach(card => {
    //         const cardRect = card.getBoundingClientRect();
    //         const cardCenterX = cardRect.left + cardRect.width / 2;
    //         const cardCenterY = cardRect.top + cardRect.height / 2;

    //         const deltaX = e.clientX - cardCenterX;
    //         const deltaY = e.clientY - cardCenterY;

    //         const rotateY = deltaX * 0.01;
    //         const rotateX = -deltaY * 0.01;

    //         if (!card.classList.contains('hovering')) {
    //             card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
    //         }
    //     });

    //     // Efecto en logo
    //     const logo = document.querySelector('.logo');
    //     if (logo) {
    //         const rotateY = (mouseX - 0.5) * 5;
    //         const rotateX = (0.5 - mouseY) * 5;
    //         logo.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    //     }
    // });

    // ========== FORMULARIO DE CONTACTO ==========
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        const formInputs = contactForm.querySelectorAll('input:not([type="checkbox"]), textarea');

        // Efecto al enfocar inputs
        formInputs.forEach(input => {
            input.addEventListener('focus', function () {
                this.style.boxShadow = '0 0 20px rgba(58, 90, 120, 0.3)';
            });

            input.addEventListener('blur', function () {
                this.style.boxShadow = '';
            });
        });

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            if (!name || !email || !message) {
                alert('Por favor, completa los campos obligatorios.');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Efecto de carga
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            setTimeout(() => {
                // Simulación de envío exitoso
                alert('¡Mensaje enviado! Te contactaremos pronto.');

                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Limpiar formulario
                contactForm.reset();
            }, 1500);
        });
    }

    // ========== EFECTO DE CONTADOR ==========
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statNumbers.length > 0) {
        const animateCounter = (element, target) => {
            let current = 0;
            const increment = target / 50;
            const stepTime = 1500 / 50;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);

                    // Efecto final
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 300);
                }

                // Formatear número manteniendo el "+"
                let displayNumber;
                if (element.textContent.includes('+')) {
                    displayNumber = `+${Math.floor(current)}`;
                } else {
                    displayNumber = Math.floor(current);
                }

                element.textContent = displayNumber;
            }, stepTime);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target;
                    const text = statNumber.textContent.trim();
                    let target;

                    if (text.includes('+')) {
                        target = parseInt(text.replace('+', '').split(' ')[0]);
                        if (isNaN(target)) target = 20;
                    } else {
                        target = parseInt(text);
                    }

                    if (!isNaN(target) && target > 0) {
                        statNumber.textContent = text.includes('+') ? '+0' : '0';
                        animateCounter(statNumber, target);
                    }

                    observer.unobserve(statNumber);
                }
            });
        }, { threshold: 0.5, rootMargin: '50px' });

        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
    }

    // ========== EFECTO DE HOVER EN TARJETAS ==========
    const cards = document.querySelectorAll('.value-item, .legal-card, .story-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovering');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovering');
            card.style.transform = '';
        });
    });

    // ========== LÓGICA DE CARRITO DEMO PARA KIOSKO (en servicios.html) ==========
    const cart = [];
    const cartContainer = document.querySelector('.cart-items-urban'); // Corregido selector
    const totalAmountSpan = document.querySelector('.total-amount-urban'); // Corregido selector
    const checkoutBtn = document.querySelector('.cart-checkout-urban'); // Corregido selector

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

    // ========== CALCULADORA DE PRESUPUESTO ==========
    const projectTypeSelect = document.getElementById('project-type');
    const urgencySelect = document.getElementById('urgency');
    const checkboxesCalc = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const resultSpan = document.getElementById('result-value');

    if (projectTypeSelect && resultSpan) {
        // Precios base por tipo de proyecto
        const basePrices = {
            landing: 1000,
            corporate: 1600,
            ecommerce: 1800,
            custom: 2000
        };

        // Precios de funcionalidades extra
        const featurePrices = {
            seo: 250,
            blog: 300,
            multilang: 800,
            booking: 500,
            crm: 1500,
            premium: 2000,
            pagos: 450,
            app: 3500
        };

        function calculatePrice() {
            // Precio base
            const projectType = projectTypeSelect.value;
            let base = basePrices[projectType] || 2500;

            // Sumar funcionalidades seleccionadas
            let featuresTotal = 0;
            checkboxesCalc.forEach(cb => {
                if (cb.checked) {
                    featuresTotal += featurePrices[cb.value] || 0;
                }
            });

            // Subtotal
            let subtotal = base + featuresTotal;

            // Aplicar urgencia
            const urgencyMultiplier = parseFloat(urgencySelect.value);

            // Calcular rango con variabilidad
            const min = Math.round(subtotal * urgencyMultiplier * 0.9 / 100) * 100;
            const max = Math.round(subtotal * urgencyMultiplier * 1.2 / 100) * 100;

            // Formatear como moneda
            const formatter = new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

            resultSpan.textContent = `${formatter.format(min)} – ${formatter.format(max)}`;
        }

        // Listeners
        projectTypeSelect.addEventListener('change', calculatePrice);
        urgencySelect.addEventListener('change', calculatePrice);
        checkboxesCalc.forEach(cb => cb.addEventListener('change', calculatePrice));

        // Calcular inicial
        calculatePrice();
    }
});