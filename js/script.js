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
            menuToggle.classList.remove('is-open');

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

                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                if (currentY <= 0 || currentY >= maxScroll) {
                    lastY = currentY;
                    return;
                }

                const delta = currentY - lastY;
                const THRESHOLD = 130;

                if (Math.abs(delta) < THRESHOLD) return;

                if (delta < 0) header.classList.remove('is-hidden');
                else header.classList.add('is-hidden');

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
                menuToggle.classList.toggle('is-open');
                document.body.style.overflow =
                    nav.classList.contains('active') ? 'hidden' : '';
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

        I18N.init({ observe: true });

        const langButtons = document.querySelectorAll(".lang-btn");

        langButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const lang = btn.dataset.lang;
                I18N.setLang(lang);
            });
        });

        function paintLangActive(lang) {
            langButtons.forEach(btn => {
                btn.classList.toggle("is-active", btn.dataset.lang === lang);
            });
        }

        document.addEventListener("i18n:changed", (e) => {
            paintLangActive(e.detail.lang);
        });
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