/* ============================================================
   CIRCUITO TURÍSTICO DEL VALLE — Cochabamba, Bolivia
   Script principal · Interactividad y animaciones
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // 1. NAVBAR — Efecto scroll y transparencia
    // =============================================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleNavbarScroll() {
        const currentScroll = window.scrollY;

        // Fondo sólido al hacer scroll
        navbar.classList.toggle('scrolled', currentScroll > 50);

        // Ocultar/mostrar navbar al hacer scroll hacia abajo/arriba
        if (currentScroll > 600) {
            if (currentScroll > lastScroll && currentScroll - lastScroll > 10) {
                navbar.style.transform = 'translateY(-100%)';
            } else if (lastScroll > currentScroll && lastScroll - currentScroll > 10) {
                navbar.style.transform = 'translateY(0)';
            }
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    // =============================================
    // 2. MENÚ MÓVIL — Toggle y cierre automático
    // =============================================
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    let menuOpen = false;

    function toggleMenu() {
        menuOpen = !menuOpen;

        if (menuOpen) {
            navLinks.classList.add('mobile-open');
            navToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            navLinks.classList.remove('mobile-open');
            navToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }

    if (navToggle) {
        navToggle.addEventListener('click', toggleMenu);
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (menuOpen && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            toggleMenu();
        }
    });

    // =============================================
    // 3. SMOOTH SCROLL — Navegación suave
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                // Offset para que el navbar no tape el contenido
                const navHeight = navbar.offsetHeight;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });

                // Cerrar menú móvil si está abierto
                if (menuOpen) toggleMenu();
            }
        });
    });

    // =============================================
    // 4. ACTIVE NAV LINK — Resaltar sección activa
    // =============================================
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');

    function highlightActiveSection() {
        const scrollPos = window.scrollY + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === '#' + sectionId) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightActiveSection, { passive: true });

    // =============================================
    // 5. ANIMACIONES SCROLL — Intersection Observer
    // =============================================
    const fadeElements = document.querySelectorAll('.fade-up');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Delay escalonado para elementos hijos
                const children = entry.target.children;
                if (children.length > 1) {
                    Array.from(children).forEach((child, index) => {
                        child.style.opacity = '0';
                        child.style.transform = 'translateY(20px)';
                        child.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                        setTimeout(() => {
                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0)';
                        }, 50);
                    });
                }
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // =============================================
    // 6. CONTADOR ANIMADO — Números del Hero
    // =============================================
    const statNumbers = document.querySelectorAll('.hero-stat .number');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        statNumbers.forEach(stat => {
            const target = parseInt(stat.textContent);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const counter = setInterval(() => {
                current += step;
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(counter);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 16);
        });
    }

    // Activar contadores cuando el hero sea visible
    const heroObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entries[0].target);
        }
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) heroObserver.observe(heroStats);

    // =============================================
    // 7. PARALLAX SUAVE — Efecto en el Hero
    // =============================================
    const hero = document.querySelector('.hero');

    function handleParallax() {
        if (!hero) return;
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / (window.innerHeight * 0.8));
            }
        }
    }

    window.addEventListener('scroll', handleParallax, { passive: true });

    // =============================================
    // 8. LIGHTBOX — Visor de imágenes ampliadas
    // =============================================

    // Crear el lightbox dinámicamente
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-overlay"></div>
        <div class="lightbox-content">
            <button class="lightbox-close"><i class="fas fa-times"></i></button>
            <img class="lightbox-img" src="" alt="Imagen ampliada">
            <p class="lightbox-caption"></p>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxOverlay = lightbox.querySelector('.lightbox-overlay');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    function openLightbox(imgSrc, caption) {
        lightboxImg.src = imgSrc;
        lightboxCaption.textContent = caption || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxImg.src = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // Hacer clic en imágenes de paradas para ampliarlas
    document.querySelectorAll('.poi-card-img img, .dest-image-container img, .service-card-img img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            const caption = img.alt || img.closest('.poi-card')?.querySelector('h4')?.textContent || '';
            openLightbox(img.src, caption);
        });
    });

    // =============================================
    // 9. LAZY LOADING — Carga diferida de imágenes
    // =============================================
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px 0px'
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // =============================================
    // 10. SCROLL TO TOP — Botón volver arriba
    // =============================================
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top-btn';
    scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(scrollTopBtn);

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });

    // =============================================
    // 11. TOOLTIPS — Info al pasar el mouse
    // =============================================
    const infoCards = document.querySelectorAll('.info-card');

    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(58, 175, 143, 0.3)';
        });
        card.addEventListener('mouseleave', function () {
            this.style.borderColor = '';
        });
    });

    // =============================================
    // 12. PROGRESS BAR — Barra de progreso de lectura
    // =============================================
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (window.scrollY / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }, { passive: true });

    // =============================================
    // 13. IMAGEN ERROR HANDLER — Fallback si falla
    // =============================================
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function () {
            this.style.display = 'none';
            const placeholder = this.nextElementSibling;
            if (placeholder && placeholder.classList.contains('img-fallback')) {
                placeholder.style.display = 'flex';
            }
        });
    });

    // =============================================
    // 14. PAQUETES — Tabs interactivos
    // =============================================
    const pkgTabs = document.querySelectorAll('.pkg-tab');
    const pkgCategories = document.querySelectorAll('.pkg-category');

    pkgTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;

            pkgTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            pkgCategories.forEach(cat => {
                cat.classList.remove('active');
                if (cat.id === 'cat-' + category) {
                    cat.classList.add('active');
                    // Re-observe fade-up elements inside
                    cat.querySelectorAll('.fade-up').forEach(el => {
                        el.classList.remove('visible');
                        fadeObserver.observe(el);
                    });
                }
            });
        });
    });

    // =============================================
    // 15. CLIMA — API Open-Meteo (sin API key)
    // =============================================
    const DESTINOS_CLIMA = [
        {
            id: 'corani',
            nombre: 'Laguna Corani',
            lat: -17.34,
            lon: -65.87,
            recoBase: 'Temperaturas frescas. Llevar abrigo ligero.',
            recoLluvia: 'Probabilidad de lluvia. Llevar impermeable y abrigo.',
            recoSol: 'Clima despejado ideal. Llevar bloqueador solar y gorro.'
        },
        {
            id: 'incachaca',
            nombre: 'Incachaca',
            lat: -17.24,
            lon: -65.82,
            recoBase: 'Zona húmeda. Impermeable y calzado antideslizante.',
            recoLluvia: 'Lluvias probables. Impermeable obligatorio, cuidado en senderos.',
            recoSol: 'Buen clima. Calzado de trekking y agua extra.'
        },
        {
            id: 'dinkong',
            nombre: 'Din Kong Park',
            lat: -17.02,
            lon: -65.42,
            recoBase: 'Revisar pronóstico. Bloqueador solar recomendado.',
            recoLluvia: 'Posibles lluvias. Actividades al aire libre podrían verse afectadas.',
            recoSol: 'Clima caluroso ideal para piscinas. Llevar traje de baño y bloqueador.'
        }
    ];

    // Weather code descriptions
    function weatherDesc(code) {
        const descriptions = {
            0: 'Cielo despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
            3: 'Nublado', 45: 'Niebla', 48: 'Niebla con escarcha',
            51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
            61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
            71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
            80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos violentos',
            95: 'Tormenta eléctrica', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo fuerte'
        };
        return descriptions[code] || 'Variable';
    }

    function getSemaforoLevel(weatherCode, precipitation, windSpeed) {
        // Red: heavy rain/storm, >10mm rain, >50km/h wind
        if (weatherCode >= 65 || weatherCode >= 95 || precipitation > 10 || windSpeed > 50) return 'rojo';
        // Yellow: light rain/fog, some precipitation
        if (weatherCode >= 45 || precipitation > 2 || windSpeed > 30) return 'amarillo';
        // Green: clear/partly cloudy
        return 'verde';
    }

    async function fetchWeather() {
        for (const dest of DESTINOS_CLIMA) {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=sunrise,sunset&timezone=America/La_Paz&forecast_days=1`;
                const res = await fetch(url);
                const data = await res.json();
                const c = data.current;
                const d = data.daily;

                // Temperature
                document.getElementById('temp-' + dest.id).textContent = Math.round(c.temperature_2m) + '°C';
                // Description
                document.getElementById('desc-' + dest.id).textContent = weatherDesc(c.weather_code);
                // Rain probability (using current precipitation)
                document.getElementById('rain-' + dest.id).textContent = c.precipitation + ' mm';
                // Wind
                document.getElementById('wind-' + dest.id).textContent = Math.round(c.wind_speed_10m) + ' km/h';
                // Sunrise/sunset
                if (d.sunrise && d.sunrise[0]) {
                    document.getElementById('sunrise-' + dest.id).textContent = d.sunrise[0].split('T')[1];
                }
                if (d.sunset && d.sunset[0]) {
                    document.getElementById('sunset-' + dest.id).textContent = d.sunset[0].split('T')[1];
                }

                // Semaphore
                const level = getSemaforoLevel(c.weather_code, c.precipitation, c.wind_speed_10m);
                const dotEl = document.getElementById('sem-' + dest.id);
                const colors = { verde: '#4caf50', amarillo: '#ffc107', rojo: '#f44336' };
                dotEl.style.background = colors[level];
                dotEl.style.boxShadow = `0 0 8px ${colors[level]}`;

                // Recommendation
                const recoEl = document.getElementById('reco-' + dest.id);
                if (level === 'rojo') {
                    recoEl.innerHTML = '<strong>Alerta:</strong> ' + dest.recoLluvia;
                } else if (level === 'amarillo') {
                    recoEl.innerHTML = '<strong>Precaución:</strong> ' + dest.recoLluvia;
                } else {
                    recoEl.innerHTML = '<strong>Recomendación:</strong> ' + dest.recoSol;
                }

            } catch (err) {
                console.error('Error clima ' + dest.id, err);
                document.getElementById('desc-' + dest.id).textContent = 'No disponible';
            }
        }

        // Activate the worst semaphore level across all destinations
        updateGlobalSemaforo();
    }

    function updateGlobalSemaforo() {
        const dots = document.querySelectorAll('.clima-semaforo-dot');
        let worst = 'verde';
        dots.forEach(d => {
            const color = d.style.background;
            if (color.includes('244') || color.includes('f44')) worst = 'rojo';
            else if ((color.includes('255') || color.includes('ffc')) && worst !== 'rojo') worst = 'amarillo';
        });

        document.querySelectorAll('.semaforo-card').forEach(card => {
            card.classList.remove('activo');
            if (card.classList.contains('semaforo-' + worst)) {
                card.classList.add('activo');
            }
        });
    }

    // Fetch weather on load
    fetchWeather();
    // Refresh every 10 minutes
    setInterval(fetchWeather, 600000);

});
