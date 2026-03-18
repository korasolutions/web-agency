/** @type {any} */
window.Lenis;
document.addEventListener('DOMContentLoaded', function () {

    function initLenis() {
        const isDesktop = window.innerWidth > 1024;

        if (!isDesktop || typeof window.Lenis === 'undefined') {
            return null;
        }

        const lenis = new window.Lenis({
            duration: 1.05,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 0.80,
            touchMultiplier: 1,
            autoRaf: true
        });

        return lenis;
    }

    const lenis = initLenis();

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

                if (lenis) {
                    lenis.scrollTo(targetPosition, { duration: 1.1 });
                } else {
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }

                if (nav && nav.classList.contains('active')) closeMenu();
            });
        });
    }

    Promise.all([
        loadComponent("header-placeholder", "/tpl/header.html"),
        loadComponent("footer-placeholder", "/tpl/footer.html"),
        loadComponent("cookies-placeholder", "/tpl/cookies.html")
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

        // cargar cookie-consent.js después de que exista #cookie-consent
        const s = document.createElement("script");
        s.src = "/js/cookie-consent.js";
        s.defer = true;
        document.body.appendChild(s);
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

        const layers = document.querySelectorAll('.parallax-layer');

        const updateParallax = (scrolled) => {
            layers.forEach((layer, index) => {
                const speed = 0.3 + (index * 0.1);
                const yPos = -(scrolled * speed);
                layer.style.transform = `translateY(${yPos}px)`;
            });
        };

        if (lenis) {
            lenis.on('scroll', ({ scroll }) => {
                updateParallax(scroll);
            });
        } else {
            window.addEventListener('scroll', () => {
                updateParallax(window.pageYOffset);
            }, { passive: true });
        }
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

    // ========== TOGGLE DE TARJETAS DE EQUIPO CON CLIC ==========
    const teamCards = document.querySelectorAll('.team-card');

    teamCards.forEach(card => {
        // Buscar el botón de cierre
        const closeBtn = card.querySelector('.team-image-close');

        if (closeBtn) {
            // Evitar que el clic en el botón de cierre propague al card
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.remove('active');
            });
        }

        // Toggle al hacer clic en la tarjeta
        card.addEventListener('click', function (e) {
            const clickedElement = e.target.closest('a');
            const isInstagramLink = clickedElement && clickedElement.classList.contains('a-ig');

            if (isInstagramLink) {
                e.stopPropagation();
                return;
            }

            // Si la tarjeta ya está activa, la desactivamos
            if (this.classList.contains('active')) {
                this.classList.remove('active');
            } else {
                // Opcional: cerrar otras tarjetas abiertas
                teamCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});