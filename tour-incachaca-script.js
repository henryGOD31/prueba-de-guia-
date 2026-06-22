/* ============================================================
   INCACHACA — Tour Virtual 360°
   Visor panorámico estilo Google Street View
   5 paradas del sendero de Incachaca, Cochabamba

   Cada parada puede tener su propia imagen equirectangular 360°.
   Si una parada no tiene imagen propia, usa la imagen por defecto
   con rotación y tinte para diferenciarla.
   ============================================================ */

// Imagen por defecto compartida (fallback)
const DEFAULT_SKYBOX = 'skybox-incachaca.jpg';

// ============================================================
// DATOS DE LAS 5 PARADAS DE INCACHACA
// ============================================================
const STOPS = [
    {
        id: 0,
        name: 'Parada 1: Puente Colgante',
        subtitle: 'Cruce sobre el río',
        description: 'Un puente colgante de madera y cuerdas de acero que cruza sobre el río de Incachaca. Rodeado de neblina y vegetación densa, ofrece una vista impresionante del cañón y las aguas turquesas que corren debajo. Es el primer punto de aventura del recorrido.',
        details: 'Altitud: 2,480 msnm | Distancia: 0 km | Tipo: Puente colgante',
        tags: ['Puente', 'Aventura', 'Río', 'Neblina'],
        icon: 'fa-bridge',
        image: 'skybox-puente.jpg',
        initialRotation: { y: 0 },
        tint: { color: 0x228833, opacity: 0.0 },
        mapPos: { x: 140, y: 280 },
    },
    {
        id: 1,
        name: 'Parada 2: Velo de la Novia',
        subtitle: 'Cascada majestuosa',
        description: 'La cascada "Velo de la Novia", una caída de agua de más de 20 metros rodeada de exuberante vegetación tropical. El agua cristalina se precipita entre paredes rocosas cubiertas de musgo y helechos, creando una cortina natural que recuerda un velo nupcial. Es el punto más fotografiado del recorrido.',
        details: 'Altitud: 2,450 msnm | Distancia: 0.5 km | Altura cascada: ~20m',
        tags: ['Cascada', 'Icónico', 'Foto', 'Naturaleza'],
        icon: 'fa-water',
        image: 'skybox-velo.jpg',
        initialRotation: { y: 0 },
        tint: { color: 0x2288aa, opacity: 0.0 },
        mapPos: { x: 140, y: 220 },
    },
    {
        id: 2,
        name: 'Parada 3: Hidroeléctrica Abandonada',
        subtitle: 'Patrimonio histórico',
        description: 'La antigua planta hidroeléctrica de Incachaca, construida a principios del siglo XX para abastecer de energía a Cochabamba. Este edificio de piedra y ladrillo, hoy abandonado, es testigo de la ingeniería boliviana de la época. Rodeado de montañas cubiertas de niebla y vegetación que reclama la estructura.',
        details: 'Altitud: 2,460 msnm | Distancia: 1 km | Época: Siglo XX',
        tags: ['Historia', 'Patrimonio', 'Arquitectura', 'Abandonado'],
        icon: 'fa-industry',
        image: 'skybox-hidroelectrica.jpg',
        initialRotation: { y: 0 },
        tint: { color: 0x555544, opacity: 0.0 },
        mapPos: { x: 140, y: 160 },
    },
    {
        id: 3,
        name: 'Parada 4: Baño de Ñustas',
        subtitle: 'Piscina natural sagrada',
        description: 'El "Baño de Ñustas" (Baño de las Princesas), una piscina natural de aguas turquesas cristalinas formada entre rocas y vegetación tropical. Según la leyenda, las princesas incas se bañaban en estas aguas sagradas. El color intenso del agua se debe a los minerales del lecho rocoso.',
        details: 'Altitud: 2,440 msnm | Distancia: 1.5 km | Tipo: Piscina natural',
        tags: ['Sagrado', 'Leyenda', 'Piscina Natural', 'Turquesa'],
        icon: 'fa-spa',
        image: 'skybox-nustas.jpg',
        initialRotation: { y: 0 },
        tint: { color: 0x11aaaa, opacity: 0.0 },
        mapPos: { x: 140, y: 100 },
    },
    {
        id: 4,
        name: 'Parada 5: Mirador de Incachaca',
        subtitle: 'Vista panorámica del valle',
        description: 'El mirador principal de Incachaca ofrece una vista panorámica impresionante del valle, con el río serpenteando entre montañas cubiertas de bosque nublado. Desde este punto elevado se aprecia la inmensidad del paisaje cochabambino. Un sendero empedrado conduce al punto más alto de observación.',
        details: 'Altitud: 2,520 msnm | Distancia: 2 km | Vista: 270°',
        tags: ['Mirador', 'Panorámica', 'Valle', 'Romántico'],
        icon: 'fa-binoculars',
        image: 'skybox-mirador.jpg',
        initialRotation: { y: 0 },
        tint: { color: 0x338844, opacity: 0.0 },
        mapPos: { x: 140, y: 40 },
    },
];

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let scene, camera, renderer;
let skyboxMesh, skyboxTexture;
let currentStop = 0;
let isTransitioning = false;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let lon = 0, lat = 0;
let targetLon = 0, targetLat = 0;
let phi = 0, theta = 0;
let fov = 70, targetFov = 70;
let tintMesh;

// Cache de texturas para no recargar cada vez que se cambia de parada
const textureCache = {};
const textureLoader = new THREE.TextureLoader();

// ============================================================
// INICIALIZACIÓN
// ============================================================
function init() {
    initScene();
    initControls();
    initUI();
    loadSkybox();
    animate();
}

function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1100);
    camera.position.set(0, 0, 0);

    const canvas = document.getElementById('tour-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================================
// CARGA DEL SKYBOX — soporta imagen por parada
// ============================================================

/**
 * Carga una textura y la guarda en cache.
 * Retorna una Promise con la textura lista.
 */
function loadTexture(url) {
    return new Promise((resolve, reject) => {
        if (textureCache[url]) {
            resolve(textureCache[url]);
            return;
        }
        textureLoader.load(
            url,
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                textureCache[url] = texture;
                resolve(texture);
            },
            undefined,
            (err) => reject(err)
        );
    });
}

/**
 * Obtiene la URL de imagen para una parada.
 * Si tiene imagen propia, la usa; si no, usa DEFAULT_SKYBOX.
 */
function getStopImageUrl(index) {
    return STOPS[index].image || DEFAULT_SKYBOX;
}

function loadSkybox() {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');

    // Pasos de carga simulados
    let step = 0;
    const loadSteps = [
        { pct: 20, msg: 'Conectando con el sendero...' },
        { pct: 40, msg: 'Capturando panorámica 360°...' },
    ];

    const stepInterval = setInterval(() => {
        if (step < loadSteps.length) {
            fill.style.width = loadSteps[step].pct + '%';
            text.textContent = loadSteps[step].msg;
            step++;
        } else {
            clearInterval(stepInterval);
        }
    }, 500);

    // Cargar la imagen de la primera parada
    const firstUrl = getStopImageUrl(0);

    loadTexture(firstUrl).then((texture) => {
        skyboxTexture = texture;

        // Crear esfera invertida
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        const material = new THREE.MeshBasicMaterial({ map: texture });
        skyboxMesh = new THREE.Mesh(geometry, material);
        scene.add(skyboxMesh);

        // Tint overlay (solo visible en paradas sin imagen propia)
        const tintGeo = new THREE.SphereGeometry(490, 32, 32);
        tintGeo.scale(-1, 1, 1);
        const tintMat = new THREE.MeshBasicMaterial({
            color: STOPS[0].tint.color,
            transparent: true,
            opacity: STOPS[0].tint.opacity,
            side: THREE.BackSide,
        });
        tintMesh = new THREE.Mesh(tintGeo, tintMat);
        scene.add(tintMesh);

        // Completar carga
        fill.style.width = '80%';
        text.textContent = 'Preparando puntos de interés...';

        setTimeout(() => {
            fill.style.width = '100%';
            text.textContent = '¡Bienvenido a Incachaca!';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('start-screen').style.display = 'flex';
            }, 500);
        }, 500);

        // Aplicar vista inicial
        applyStopView(0, false);

        // Pre-cargar imágenes de las demás paradas en segundo plano
        STOPS.forEach((s, i) => {
            if (i !== 0 && s.image) {
                loadTexture(s.image).catch(() => {});
            }
        });

    }).catch((err) => {
        text.textContent = 'Error al cargar imagen. Verifica los archivos de skybox.';
        console.error('Error cargando skybox:', err);
    });
}

// ============================================================
// CONTROLES DE VISTA 360°
// ============================================================
function initControls() {
    const canvas = renderer.domElement;

    // Mouse
    canvas.addEventListener('mousedown', (e) => {
        if (isTransitioning) return;
        isDragging = true;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging || isTransitioning) return;
        const dx = e.clientX - previousMouseX;
        const dy = e.clientY - previousMouseY;
        lon -= dx * 0.15;
        lat += dy * 0.15;
        lat = Math.max(-85, Math.min(85, lat));
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });

    // Touch
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (isTransitioning || e.touches.length !== 1) return;
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging || isTransitioning || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        lon -= dx * 0.2;
        lat += dy * 0.2;
        lat = Math.max(-85, Math.min(85, lat));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', () => { isDragging = false; });

    // Zoom (scroll)
    canvas.addEventListener('wheel', (e) => {
        if (isTransitioning) return;
        targetFov += e.deltaY * 0.05;
        targetFov = Math.max(30, Math.min(100, targetFov));
    }, { passive: true });

    // Pinch zoom (mobile)
    let lastPinchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            targetFov -= (dist - lastPinchDist) * 0.1;
            targetFov = Math.max(30, Math.min(100, targetFov));
            lastPinchDist = dist;
        }
    }, { passive: true });

    // Teclado
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft': goToStop(currentStop - 1); break;
            case 'ArrowRight': goToStop(currentStop + 1); break;
            case 'KeyM': toggleMap(); break;
            case 'KeyI': toggleInfo(); break;
        }
    });
}

// ============================================================
// NAVEGACIÓN ENTRE PARADAS
// ============================================================
function goToStop(index) {
    if (isTransitioning || index < 0 || index >= STOPS.length || index === currentStop) return;

    isTransitioning = true;
    const overlay = document.getElementById('transition-overlay');
    const transText = document.getElementById('transition-text');

    // Mostrar transición
    const direction = index > currentStop ? 'Avanzando' : 'Retrocediendo';
    transText.textContent = `${direction} al ${STOPS[index].name}...`;
    overlay.style.display = 'flex';

    // Cargar la textura de la nueva parada (puede ser diferente)
    const newUrl = getStopImageUrl(index);

    loadTexture(newUrl).then((texture) => {
        setTimeout(() => {
            applyStopView(index, true, texture);
            currentStop = index;
            updateUI();

            setTimeout(() => {
                overlay.style.display = 'none';
                isTransitioning = false;
            }, 600);
        }, 600);
    }).catch(() => {
        // Si falla, usar la textura actual
        setTimeout(() => {
            applyStopView(index, true, null);
            currentStop = index;
            updateUI();
            setTimeout(() => {
                overlay.style.display = 'none';
                isTransitioning = false;
            }, 600);
        }, 600);
    });
}

function applyStopView(index, animated, newTexture) {
    const stop = STOPS[index];

    // Cambiar textura del skybox si se proporcionó una nueva
    if (newTexture && skyboxMesh) {
        skyboxMesh.material.map = newTexture;
        skyboxMesh.material.needsUpdate = true;
    }

    // Rotar skybox (útil para paradas que comparten la imagen default)
    if (skyboxMesh) {
        skyboxMesh.rotation.y = stop.initialRotation.y;
    }

    // Tinte: si la parada tiene imagen propia, sin tinte; si usa default, aplicar tinte
    if (tintMesh) {
        if (stop.image) {
            // Imagen propia → sin tinte
            tintMesh.material.opacity = 0;
        } else {
            // Imagen compartida → aplicar tinte diferenciador
            tintMesh.material.color.setHex(stop.tint.color);
            tintMesh.material.opacity = stop.tint.opacity;
        }
    }

    // Resetear vista
    lon = 0; lat = 0;
    targetFov = 70;
}

// ============================================================
// UI
// ============================================================
function initUI() {
    document.getElementById('btn-start').addEventListener('click', startTour);
    document.getElementById('btn-map').addEventListener('click', toggleMap);
    document.getElementById('btn-help').addEventListener('click', toggleHelp);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('btn-prev').addEventListener('click', () => goToStop(currentStop - 1));
    document.getElementById('btn-next').addEventListener('click', () => goToStop(currentStop + 1));
    document.getElementById('btn-close-info').addEventListener('click', () => {
        document.getElementById('info-panel').style.display = 'none';
    });
    document.getElementById('btn-close-map').addEventListener('click', () => {
        document.getElementById('minimap').style.display = 'none';
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        document.getElementById('help-panel').style.display = 'none';
    });

    // Botones de paradas
    document.querySelectorAll('.stop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.stop);
            goToStop(idx);
        });
    });
}

function startTour() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    showStopInfo(0);
}

function updateUI() {
    const stop = STOPS[currentStop];

    // Actualizar nombre
    document.getElementById('location-name').textContent = stop.name;

    // Actualizar botones de parada
    document.querySelectorAll('.stop-btn').forEach((btn, i) => {
        btn.classList.remove('active');
        if (i === currentStop) btn.classList.add('active');
        if (i < currentStop) btn.classList.add('visited');
    });

    // Actualizar flechas
    document.getElementById('btn-prev').disabled = currentStop === 0;
    document.getElementById('btn-next').disabled = currentStop === STOPS.length - 1;

    // Mostrar info
    showStopInfo(currentStop);

    // Actualizar minimap
    if (document.getElementById('minimap').style.display === 'block') {
        drawMinimap();
    }
}

function showStopInfo(index) {
    const stop = STOPS[index];
    document.getElementById('info-title').textContent = stop.name;
    document.getElementById('info-description').textContent = stop.description;
    document.getElementById('info-details').textContent = stop.details;
    document.getElementById('info-icon-i').className = `fas ${stop.icon}`;

    const tagsEl = document.getElementById('info-tags');
    tagsEl.innerHTML = '';
    stop.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'info-tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
    });

    document.getElementById('info-panel').style.display = 'block';
}

function toggleInfo() {
    const panel = document.getElementById('info-panel');
    if (panel.style.display === 'none') {
        showStopInfo(currentStop);
    } else {
        panel.style.display = 'none';
    }
}

function toggleMap() {
    const map = document.getElementById('minimap');
    map.style.display = map.style.display === 'none' ? 'block' : 'none';
    if (map.style.display === 'block') drawMinimap();
}

function toggleHelp() {
    const help = document.getElementById('help-panel');
    help.style.display = help.style.display === 'none' ? 'block' : 'none';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

// ============================================================
// MINIMAPA DEL SENDERO
// ============================================================
function drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Fondo del sendero
    ctx.fillStyle = '#1a3322';
    ctx.fillRect(0, 0, w, h);

    // Dibujar río (curva azul)
    ctx.strokeStyle = 'rgba(78, 184, 212, 0.4)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 300);
    ctx.quadraticCurveTo(100, 240, 120, 200);
    ctx.quadraticCurveTo(150, 150, 130, 100);
    ctx.quadraticCurveTo(110, 50, 140, 20);
    ctx.stroke();

    // Dibujar sendero (línea punteada)
    ctx.strokeStyle = 'rgba(212, 200, 160, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();

    const points = STOPS.map(s => s.mapPos);
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2 + (Math.random() - 0.5) * 30;
        const cpy = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(cpx, cpy, curr.x, curr.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Dibujar paradas
    STOPS.forEach((stop, i) => {
        const p = stop.mapPos;
        const isActive = i === currentStop;
        const isVisited = i < currentStop;

        // Círculo de la parada
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#4fc3f7' : isVisited ? '#88d498' : 'rgba(255,255,255,0.3)';
        ctx.fill();

        if (isActive) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Nombre
        ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.6)';
        ctx.font = isActive ? 'bold 10px Poppins' : '9px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${stop.subtitle}`, p.x + 15, p.y + 4);
    });

    // Etiquetas especiales
    ctx.fillStyle = 'rgba(78, 184, 212, 0.5)';
    ctx.font = 'italic 8px Poppins';
    ctx.fillText('Río', 155, 200);
    ctx.fillText('Valle', 155, 50);
}

// ============================================================
// RENDER LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    // Suavizar FOV
    fov += (targetFov - fov) * 0.05;
    camera.fov = fov;
    camera.updateProjectionMatrix();

    // Auto-rotación suave cuando no se arrastra
    if (!isDragging && !isTransitioning) {
        lon += 0.015; // Muy lento, para dar vida
    }

    // Calcular dirección de la cámara
    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
}

// ============================================================
// INICIO
// ============================================================
init();
