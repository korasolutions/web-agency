// script.js - Efectos 3D y Animaciones Avanzadas

document.addEventListener('DOMContentLoaded', function() {
    
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
                const speed = 0.5 + (index * 0.2);
                const yPos = -(scrolled * speed);
                layer.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
    
    createParallaxLayers();
    
    // ========== MENÚ HAMBURGUESA 3D ==========
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        // Animar las líneas del menú hamburguesa en 3D
        const spans = menuToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            spans[0].style.background = 'linear-gradient(90deg, var(--accent-color), var(--primary-color))';
            spans[1].style.opacity = '0';
            spans[1].style.transform = 'scaleX(0)';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            spans[2].style.background = 'linear-gradient(90deg, var(--accent-color), var(--primary-color))';
            
            // Rotar el botón completo
            menuToggle.style.transform = 'rotate(180deg)';
        } else {
            spans[0].style.transform = 'none';
            spans[0].style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
            spans[1].style.opacity = '1';
            spans[1].style.transform = 'none';
            spans[2].style.transform = 'none';
            spans[2].style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
            
            // Restaurar rotación
            menuToggle.style.transform = 'rotate(0deg)';
        }
    });
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[0].style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
            spans[1].style.opacity = '1';
            spans[1].style.transform = 'none';
            spans[2].style.transform = 'none';
            spans[2].style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
            menuToggle.style.transform = 'rotate(0deg)';
        });
    });
    
    // ========== ANIMACIONES AL SCROLL CON PERSPECTIVA 3D ==========
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
                    
                    // Efecto adicional para elementos específicos
                    if (element.classList.contains('service-card') || 
                        element.classList.contains('value-item') ||
                        element.classList.contains('legal-card')) {
                        
                        element.style.transform = 'perspective(1000px) rotateX(0deg) translateZ(0)';
                        setTimeout(() => {
                            element.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        }, 100);
                    }
                }, delay * 1000);
            }
        });
    };
    
    window.addEventListener('scroll', checkFade);
    window.addEventListener('load', checkFade);
    checkFade();
    
    // ========== EFECTO DE MOUSE TRACKING 3D ==========
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Efecto en tarjetas de servicios
        document.querySelectorAll('.service-card').forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const cardCenterY = cardRect.top + cardRect.height / 2;
            
            const deltaX = e.clientX - cardCenterX;
            const deltaY = e.clientY - cardCenterY;
            
            const rotateY = deltaX * 0.01;
            const rotateX = -deltaY * 0.01;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        // Efecto en logo
        const logo = document.querySelector('.logo');
        const rotateY = (mouseX - 0.5) * 10;
        const rotateX = (0.5 - mouseY) * 10;
        logo.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        // Efecto en botones
        document.querySelectorAll('.btn').forEach(btn => {
            const rotateY = (mouseX - 0.5) * 5;
            const rotateX = (0.5 - mouseY) * 5;
            btn.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    });
    
    // ========== FORMULARIO CON EFECTOS ESPECTACULARES ==========
    const contactForm = document.getElementById('contactForm');
    const formInputs = contactForm.querySelectorAll('input, textarea');
    
    // Efecto al enfocar inputs
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateZ(20px)';
            this.style.boxShadow = '0 0 30px rgba(58, 90, 120, 0.5)';
            
            // Crear partículas alrededor del input
            createInputParticles(this);
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateZ(0)';
            this.style.boxShadow = '';
        });
    });
    
    function createInputParticles(input) {
        const rect = input.getBoundingClientRect();
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, var(--primary-color), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                animation: particleFloat 1s ease-out forwards;
            `;
            
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            document.body.appendChild(particle);
            
            // Animación de partícula
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            particle.animate([
                { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        if (!name || !email || !message) {
            showNotification('Por favor, completa los campos obligatorios.', 'error');
            return;
        }
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Efecto de carga espectacular
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="loading-text">Enviando...</span>';
        submitBtn.disabled = true;
        submitBtn.style.background = 'linear-gradient(135deg, var(--primary-dark), var(--accent-color))';
        
        // Crear efecto de partículas desde el botón
        createButtonParticles(submitBtn);
        
        setTimeout(() => {
            // Efecto de éxito
            const successEffect = document.createElement('div');
            successEffect.className = 'success-effect';
            successEffect.innerHTML = `
                <div class="success-content" style="
                    text-align: center;
                    padding: 40px;
                    background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(18, 18, 18, 0.98));
                    border-radius: var(--border-radius);
                    border: 1px solid var(--primary-color);
                    backdrop-filter: blur(20px);
                    transform-style: preserve-3d;
                    animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5),
                                0 0 50px rgba(58, 90, 120, 0.5);
                ">
                    <div style="font-size: 4rem; color: var(--primary-color); margin-bottom: 20px;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 style="color: var(--text-color); margin-bottom: 15px; font-size: 1.8rem;">
                        ¡Mensaje Enviado!
                    </h3>
                    <p style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 25px;">
                        Gracias <strong style="color: var(--primary-color);">${name}</strong>, 
                        hemos recibido tu mensaje y nos pondremos en contacto contigo en las próximas 24 horas.
                    </p>
                    <button class="btn btn-secondary close-success" style="margin-top: 10px;">
                        Cerrar
                    </button>
                </div>
            `;
            
            document.body.appendChild(successEffect);
            
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            
            // Limpiar formulario
            contactForm.reset();
            
            // Cerrar mensaje de éxito
            document.querySelector('.close-success')?.addEventListener('click', () => {
                successEffect.remove();
            });
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                successEffect.remove();
            }, 5000);
        }, 2000);
    });
    
    function createButtonParticles(button) {
        const rect = button.getBoundingClientRect();
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, var(--primary-color), var(--accent-color));
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
            `;
            
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            document.body.appendChild(particle);
            
            // Animación compleja de partícula
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            particle.animate([
                { 
                    transform: `translate(0, 0) scale(1) rotate(0deg)`,
                    opacity: 1
                },
                { 
                    transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0) rotate(360deg)`,
                    opacity: 0
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    // ========== EFECTO DE CONTADOR ESPECTACULAR ==========
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Actualiza esta parte en tu script.js para el contador de +20

const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 50;
    const duration = 1500;
    const stepTime = duration / 50;
    
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

// En la parte del observer, actualiza para manejar "+20"
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target;
            const text = statNumber.textContent.trim();
            let target;
            
            if (text.includes('+')) {
                // Manejar formato "+20"
                target = parseInt(text.replace('+', '').split(' ')[0]);
                if (isNaN(target)) target = 20; // Fallback
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
    
    // ========== EFECTO DE TEXTO TIPOWRITER ==========
    const heroTitle = document.querySelector('.hero-title');
    const originalText = heroTitle.innerHTML;
    
    // Simular efecto typewriter en carga
    setTimeout(() => {
        heroTitle.style.animation = 'textShimmer 3s infinite alternate';
    }, 1000);
    
    // ========== EFECTO DE SCROLL SUAVE MEJORADO ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    // Animación de scroll con easing
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Efecto visual durante el scroll
                    document.body.style.overflow = 'hidden';
                    setTimeout(() => {
                        document.body.style.overflow = '';
                    }, 1000);
                }
            }
        });
    });
    
    // ========== EFECTO DE CABECERA DINÁMICO ==========
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
            header.style.backdropFilter = 'blur(30px)';
        } else {
            header.classList.remove('scrolled');
            header.style.backdropFilter = 'blur(20px)';
        }
        
        // Efecto parallax en hero
        const hero = document.querySelector('.hero');
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        hero.style.transform = `translate3d(0, ${rate}px, 0)`;
    });
    
    // ========== EFECTO DE HOVER EN TARJETAS MEJORADO ==========
    const cards = document.querySelectorAll('.service-card, .value-item, .legal-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            // Efecto de partículas al hover
            if (!card.classList.contains('hovering')) {
                card.classList.add('hovering');
                
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        createCardParticles(card);
                    }, i * 100);
                }
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovering');
        });
    });
    
    function createCardParticles(card) {
        const rect = card.getBoundingClientRect();
        
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, var(--primary-color), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            const startX = rect.left + Math.random() * rect.width;
            const startY = rect.top + Math.random() * rect.height;
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 10;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            particle.animate([
                { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    // ========== EFECTO DE ILUMINACIÓN DINÁMICA ==========
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.documentElement.style.setProperty('--mouse-x', x);
        document.documentElement.style.setProperty('--mouse-y', y);
    });
    
    // ========== INICIALIZAR AÑO ACTUAL ==========
    const currentYear = new Date().getFullYear();
    document.getElementById('currentYear').textContent = currentYear;
    
    // ========== EFECTO DE SONIDO (OPCIONAL) ==========
    // Para un efecto completo, podrías añadir sonidos sutiles
    // en interacciones clave (hover de botones, envío de formulario, etc.)
    
    console.log('%c🔥 NEXORA SOLUTIONS - Efectos 3D Activados 🔥', 
        'font-size: 18px; font-weight: bold; color: #3a5a78; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
    console.log('%c✨ Experiencia visual mejorada con efectos 3D y animaciones avanzadas ✨', 
        'font-size: 14px; color: #ff6b6b;');
});