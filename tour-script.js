/* ============================================================
   DIN KONG RESORT PARK — Tour Virtual 3D
   Parque temático más grande de Bolivia · 32 hectáreas
   Shinahota, Cochabamba · km 163 carretera Cochabamba-Santa Cruz
   Coordenadas: -17.0172438, -65.4248232

   ARQUITECTURA PARA EQUIPO DE 3 ESTUDIANTES:
   - Estudiante 1 (Interfaz): Secciones 1, 2, 8
   - Estudiante 2 (Navegación): Secciones 3, 4, 5
   - Estudiante 3 (Modelos/POI): Secciones 6, 7
   ============================================================ */

// ============================================================
// SECCIÓN 0: VARIABLES GLOBALES
// ============================================================
let scene, camera, renderer, clock;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let playerHeight = 1.7;
let moveSpeed = 25;
let isLocked = false;
let isMobile = false;
let raycaster, mouse;
let colliders = [];
let poiObjects = [];
let poiData = [];
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
let joystickMoveData = { x: 0, y: 0, active: false };
let joystickLookData = { x: 0, y: 0, active: false };
let animatedObjects = []; // Objetos con animaciones continuas

// ============================================================
// SECCIÓN 1: SISTEMA DE CARGA (Estudiante 1 — Interfaz)
// ============================================================
function initLoadingScreen() {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    const steps = [
        { pct: 10, msg: 'Creando terreno tropical...' },
        { pct: 20, msg: 'Construyendo entrada King Kong...' },
        { pct: 30, msg: 'Esculpiendo dinosaurios...' },
        { pct: 40, msg: 'Llenando la laguna artificial...' },
        { pct: 50, msg: 'Generando piscinas y tobogán...' },
        { pct: 60, msg: 'Instalando puentes colgantes...' },
        { pct: 70, msg: 'Plantando vegetación tropical...' },
        { pct: 80, msg: 'Colocando luces y sombras...' },
        { pct: 90, msg: 'Preparando 15 puntos de interés...' },
        { pct: 100, msg: '¡Bienvenido a Din Kong!' }
    ];
    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            fill.style.width = steps[i].pct + '%';
            text.textContent = steps[i].msg;
            i++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('start-screen').style.display = 'flex';
            }, 500);
        }
    }, 350);
}

// ============================================================
// SECCIÓN 2: UI / HUD (Estudiante 1 — Interfaz)
// ============================================================
function initUI() {
    document.getElementById('btn-start').addEventListener('click', startTour);
    document.getElementById('btn-map').addEventListener('click', toggleMap);
    document.getElementById('btn-help').addEventListener('click', toggleHelp);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('btn-close-map').addEventListener('click', () => {
        document.getElementById('minimap').style.display = 'none';
    });
    document.getElementById('btn-close-info').addEventListener('click', () => {
        document.getElementById('info-panel').style.display = 'none';
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        document.getElementById('help-panel').style.display = 'none';
    });
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

function showPOIInfo(data) {
    document.getElementById('info-title').textContent = data.title;
    document.getElementById('info-description').textContent = data.description;
    const tagsEl = document.getElementById('info-tags');
    tagsEl.innerHTML = '';
    if (data.tags) {
        data.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'info-tag';
            span.textContent = tag;
            tagsEl.appendChild(span);
        });
    }
    document.getElementById('info-panel').style.display = 'block';
}

function updateLocationName() {
    const pos = camera.position;
    let name = 'Din Kong Resort Park';

    if (pos.z > 55) name = 'Entrada Principal — King Kong';
    else if (pos.z > 35 && pos.z <= 55) name = 'Pasillo de Dinosaurios';
    else if (pos.z <= 35 && pos.z > 15) name = 'Plaza Central';
    else if (pos.x < -15 && pos.z < 15) name = 'Laguna Artificial y Playa';
    else if (pos.x < -5 && pos.x >= -15 && pos.z < 10 && pos.z > -10) name = 'Zona de Piscinas';
    else if (pos.x > 15 && pos.z > 0) name = 'Acuario y Zona de Aventura';
    else if (pos.x > 10 && pos.z <= 0 && pos.z > -20) name = 'Cabañas Tropicales';
    else if (pos.z <= -10 && pos.z > -30) name = 'Sendero de Dinosaurios';
    else if (pos.z <= -30) name = 'Mirador y Camping';
    else if (pos.x > 5 && pos.z > 15) name = 'Puentes Colgantes';

    document.getElementById('location-name').textContent = name;
}

// ============================================================
// SECCIÓN 3: ESCENA THREE.JS (Estudiante 2 — Navegación)
// ============================================================
function initScene() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x78b8e0);
    scene.fog = new THREE.FogExp2(0x9dc8e0, 0.005);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
    camera.position.set(0, playerHeight, 65);
    camera.rotation.order = 'YXZ';

    const canvas = document.getElementById('tour-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    raycaster = new THREE.Raycaster();
    raycaster.far = 8;
    mouse = new THREE.Vector2(0, 0);

    initLighting();
    window.addEventListener('resize', onResize);
}

function initLighting() {
    // Hemisférica — cielo tropical azul + suelo verde
    const ambient = new THREE.HemisphereLight(0x87ceeb, 0x3a7a2a, 0.65);
    scene.add(ambient);

    // Sol tropical fuerte
    const sun = new THREE.DirectionalLight(0xfff8e0, 1.4);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Relleno cálido
    const fill = new THREE.DirectionalLight(0xffd4a0, 0.35);
    fill.position.set(-30, 40, -20);
    scene.add(fill);

    // Luces ambientales cálidas en zonas del parque
    const spots = [
        { pos: [0, 4, 40], color: 0xffaa44, int: 0.6, dist: 20 },
        { pos: [-10, 3, 0], color: 0x44ccff, int: 0.4, dist: 15 },
        { pos: [15, 3, -10], color: 0xffaa44, int: 0.5, dist: 15 },
        { pos: [-25, 3, -15], color: 0x44aaff, int: 0.3, dist: 20 },
    ];
    spots.forEach(s => {
        const light = new THREE.PointLight(s.color, s.int, s.dist);
        light.position.set(...s.pos);
        scene.add(light);
    });
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// SECCIÓN 4: CONTROLES PRIMERA PERSONA (Estudiante 2)
// ============================================================
function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp':    moveForward = true; break;
            case 'KeyS': case 'ArrowDown':  moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft':  moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'KeyM': toggleMap(); break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp':    moveForward = false; break;
            case 'KeyS': case 'ArrowDown':  moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft':  moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
        }
    });
}

function initPointerLock() {
    const canvas = renderer.domElement;
    canvas.addEventListener('click', () => {
        if (!isLocked && !isMobile) canvas.requestPointerLock();
        checkPOIInteraction();
    });
    document.addEventListener('pointerlockchange', () => {
        isLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        const sensitivity = 0.002;
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= e.movementX * sensitivity;
        euler.x -= e.movementY * sensitivity;
        euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
        camera.quaternion.setFromEuler(euler);
    });
}

function initMobileControls() {
    isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return;
    document.getElementById('mobile-controls').style.display = 'block';
    setupJoystick('joystick-move', 'joystick-stick-move', joystickMoveData);
    setupJoystick('joystick-look', 'joystick-stick-look', joystickLookData);
    document.getElementById('mobile-interact').addEventListener('touchstart', (e) => {
        e.preventDefault();
        checkPOIInteraction();
    });
}

function setupJoystick(containerId, stickId, data) {
    const container = document.getElementById(containerId);
    const stick = document.getElementById(stickId);
    const base = container.querySelector('.joystick-base');
    let baseRect;
    container.addEventListener('touchstart', (e) => {
        e.preventDefault(); baseRect = base.getBoundingClientRect();
        data.active = true; handleJoystickMove(e.touches[0], baseRect, stick, data);
    }, { passive: false });
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (data.active && baseRect) handleJoystickMove(e.touches[0], baseRect, stick, data);
    }, { passive: false });
    const end = () => { data.active = false; data.x = 0; data.y = 0; stick.style.transform = 'translate(0px,0px)'; };
    container.addEventListener('touchend', end);
    container.addEventListener('touchcancel', end);
}

function handleJoystickMove(touch, rect, stick, data) {
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx, dy = touch.clientY - cy;
    const max = rect.width / 2 - 25, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    stick.style.transform = `translate(${dx}px,${dy}px)`;
    data.x = dx / max; data.y = dy / max;
}

// ============================================================
// SECCIÓN 5: COLISIONES Y MOVIMIENTO (Estudiante 2)
// ============================================================
function updateMovement(delta) {
    velocity.x -= velocity.x * 8.0 * delta;
    velocity.z -= velocity.z * 8.0 * delta;
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    if (joystickMoveData.active) { direction.x = joystickMoveData.x; direction.z = -joystickMoveData.y; }
    direction.normalize();
    if (moveForward || moveBackward || joystickMoveData.active) velocity.z -= direction.z * moveSpeed * delta;
    if (moveLeft || moveRight || joystickMoveData.active) velocity.x -= direction.x * moveSpeed * delta;
    if (joystickLookData.active) {
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= joystickLookData.x * 2.0 * delta;
        euler.x -= joystickLookData.y * 1.5 * delta;
        euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
        camera.quaternion.setFromEuler(euler);
    }
    const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(); right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const moveVec = new THREE.Vector3();
    moveVec.addScaledVector(forward, -velocity.z * delta);
    moveVec.addScaledVector(right, -velocity.x * delta);
    const newPos = camera.position.clone().add(moveVec); newPos.y = playerHeight;
    if (!checkCollision(newPos)) { camera.position.copy(newPos); }
    else {
        const posX = camera.position.clone(); posX.x = newPos.x;
        if (!checkCollision(posX)) camera.position.x = newPos.x;
        const posZ = camera.position.clone(); posZ.z = newPos.z;
        if (!checkCollision(posZ)) camera.position.z = newPos.z;
    }
    camera.position.x = Math.max(-65, Math.min(65, camera.position.x));
    camera.position.z = Math.max(-65, Math.min(65, camera.position.z));
    camera.position.y = playerHeight;
}

function checkCollision(pos) {
    const dirs = [
        new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
        new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1),
        new THREE.Vector3(1,0,1).normalize(), new THREE.Vector3(-1,0,1).normalize(),
        new THREE.Vector3(1,0,-1).normalize(), new THREE.Vector3(-1,0,-1).normalize(),
    ];
    const origin = pos.clone(); origin.y = 1.0;
    for (const dir of dirs) {
        raycaster.set(origin, dir); raycaster.far = 0.5;
        if (raycaster.intersectObjects(colliders, true).length > 0) return true;
    }
    return false;
}

// ============================================================
// SECCIÓN 6: CONSTRUCCIÓN DEL ESCENARIO (Estudiante 3 — Modelos)
// ============================================================
function buildScene() {
    createSkyDome();
    createGround();
    createEntrance();
    createDinosaurAlley();
    createPoolArea();
    createLagoon();
    createCabanas();
    createHangingBridge();
    createAquariumBuilding();
    createPalmTrees();
    createRockFormations();
    createDecorations();
}

/* ---------- CIELO TROPICAL ---------- */
function createSkyDome() {
    const geo = new THREE.SphereGeometry(280, 32, 32);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x2a7fd4) },
            bottomColor: { value: new THREE.Color(0xb8e4f0) },
            offset: { value: 20 }, exponent: { value: 0.45 }
        },
        vertexShader: `varying vec3 vWP; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWP=wp.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWP; void main(){ float h=normalize(vWP+offset).y; gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),exponent),0.0)),1.0); }`,
        side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(geo, mat));
    // Nubes tropicales
    for (let i = 0; i < 20; i++) {
        const cg = new THREE.SphereGeometry(10 + Math.random() * 15, 8, 6);
        const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random() * 0.3 });
        const c = new THREE.Mesh(cg, cm);
        c.position.set(-100 + Math.random() * 200, 50 + Math.random() * 40, -100 + Math.random() * 200);
        c.scale.y = 0.25; scene.add(c);
    }
}

/* ---------- TERRENO ---------- */
function createGround() {
    // Pasto tropical
    const grassGeo = new THREE.PlaneGeometry(140, 140, 30, 30);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d8c2f, roughness: 0.9 });
    const verts = grassGeo.attributes.position;
    for (let i = 0; i < verts.count; i++) verts.setZ(i, verts.getZ(i) + (Math.random() - 0.5) * 0.4);
    grassGeo.computeVertexNormals();
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);

    // Camino principal (entrada → centro)
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd4c8a0, roughness: 0.7 });
    addBox(5, 0.06, 50, 0, 0.03, 40, pathMat, false);
    // Camino hacia laguna
    addBox(30, 0.06, 4, -18, 0.03, 5, pathMat, false);
    // Camino hacia cabañas
    addBox(20, 0.06, 4, 15, 0.03, -5, pathMat, false);
    // Camino circular del sendero de dinosaurios
    addBox(4, 0.06, 40, 5, 0.03, -20, pathMat, false);
    addBox(30, 0.06, 4, 5, 0.03, -40, pathMat, false);
}

function addBox(w, h, d, x, y, z, mat, collide) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true;
    scene.add(m);
    if (collide) colliders.push(m);
    return m;
}

/* ---------- ENTRADA KING KONG GIGANTE ---------- */
function createEntrance() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a6e5b, roughness: 0.85, metalness: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.9 });

    // Arco de piedra monumental
    const pillarL = addBox(6, 14, 5, -7, 7, 60, stoneMat, true);
    const pillarR = addBox(6, 14, 5, 7, 7, 60, stoneMat, true);
    addBox(20, 4, 5, 0, 15, 60, stoneMat, true);

    // ===== KING KONG GIGANTE (~15m de alto, basado en la estatua real) =====
    const kongMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.05 });
    const kongSkinMat = new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 0.9 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.5, 7, 10), kongMat);
    torso.position.set(0, 22, 60); torso.castShadow = true; scene.add(torso);

    // Pecho más ancho
    const chest = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 10), kongMat);
    chest.position.set(0, 23, 60); chest.scale.set(1.2, 0.8, 0.9); scene.add(chest);

    // Cabeza grande con mandíbula
    const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), kongMat);
    head.position.set(0, 27.5, 60); head.scale.set(1, 0.95, 1); head.castShadow = true; scene.add(head);

    // Cresta/ceja prominente
    const brow = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 2), kongMat);
    brow.position.set(0, 28.8, 61); scene.add(brow);

    // Ojos (esferas rojas brillantes)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), eyeMat);
        eye.position.set(side * 1.2, 28.2, 62); scene.add(eye);
    });

    // Boca abierta con dientes
    const jawMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), jawMat);
    jaw.position.set(0, 26, 62); jaw.scale.set(0.9, 0.4, 0.6); scene.add(jaw);
    // Dientes
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xf5f0d0 });
    for (let i = -3; i <= 3; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), toothMat);
        tooth.position.set(i * 0.4, 26.3, 62.3); tooth.rotation.x = Math.PI; scene.add(tooth);
    }

    // Brazos levantados (puños al aire)
    [-1, 1].forEach(side => {
        // Brazo superior
        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.8, 5, 8), kongMat);
        upperArm.position.set(side * 5, 24, 60);
        upperArm.rotation.z = side * Math.PI / 3.5;
        upperArm.castShadow = true; scene.add(upperArm);
        // Antebrazo
        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 4, 8), kongMat);
        forearm.position.set(side * 7, 27, 60);
        forearm.rotation.z = side * Math.PI / 6;
        forearm.castShadow = true; scene.add(forearm);
        // Puño
        const fist = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), kongMat);
        fist.position.set(side * 7.5, 29.5, 60); fist.castShadow = true; scene.add(fist);
    });

    // Piernas
    [-1.5, 1.5].forEach(side => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 5, 8), kongMat);
        leg.position.set(side, 17.5, 60); leg.castShadow = true; scene.add(leg);
        // Pie
        const foot = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 3), kongMat);
        foot.position.set(side, 15.3, 61); scene.add(foot);
    });

    // Letrero "DIN KONG RESORT PARK"
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1a6b2a, roughness: 0.5, metalness: 0.3 });
    const sign = addBox(16, 2.5, 0.5, 0, 1.2, 64, signMat, false);
    // Borde dorado del letrero
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.3, metalness: 0.7 });
    addBox(16.4, 0.3, 0.6, 0, 2.55, 64, goldMat, false);
    addBox(16.4, 0.3, 0.6, 0, -0.05, 64, goldMat, false);
}

/* ---------- PASILLO DE DINOSAURIOS ---------- */
function createDinosaurAlley() {
    // Esculturas de dinosaurios a lo largo del camino (30+ dinosaurios reales del parque)
    const dinoColors = [0x5a6e3a, 0x4a5e2a, 0x6b7e4a, 0x3a5025, 0x7a6e4a];

    const dinoPositions = [
        // T-Rex gigante (7m real)
        { pos: [-8, 0, 48], type: 'trex', scale: 2.5, color: 0x4a5e2a },
        { pos: [8, 0, 45], type: 'raptor', scale: 1.2, color: 0x5a6e3a },
        { pos: [-10, 0, 38], type: 'bronto', scale: 3, color: 0x6b7e4a },
        { pos: [10, 0, 35], type: 'trex', scale: 2, color: 0x3a5025 },
        { pos: [-7, 0, 28], type: 'raptor', scale: 1, color: 0x5a6e3a },
        { pos: [9, 0, 25], type: 'stego', scale: 1.8, color: 0x7a6e4a },
        // Sendero de dinosaurios (zona sur)
        { pos: [-15, 0, -15], type: 'trex', scale: 3, color: 0x4a5e2a },
        { pos: [15, 0, -20], type: 'bronto', scale: 3.5, color: 0x6b7e4a },
        { pos: [-12, 0, -30], type: 'raptor', scale: 1.5, color: 0x3a5025 },
        { pos: [20, 0, -35], type: 'stego', scale: 2, color: 0x5a6e3a },
        { pos: [0, 0, -40], type: 'trex', scale: 2.8, color: 0x7a6e4a },
        { pos: [-20, 0, -25], type: 'raptor', scale: 1.3, color: 0x4a5e2a },
        { pos: [25, 0, -28], type: 'bronto', scale: 2.5, color: 0x6b7e4a },
    ];

    dinoPositions.forEach(d => {
        const mat = new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.85, metalness: 0.05 });
        const group = new THREE.Group();

        if (d.type === 'trex') {
            // Cuerpo T-Rex
            const body = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), mat);
            body.scale.set(1.3, 1, 2); body.position.y = 2.5 * d.scale / 2; group.add(body);
            // Cabeza
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), mat);
            head.position.set(0, 3 * d.scale / 2, 1.5); group.add(head);
            // Mandíbula
            const jw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 1), new THREE.MeshStandardMaterial({ color: 0x8b2020 }));
            jw.position.set(0, 2.5 * d.scale / 2, 1.8); group.add(jw);
            // Cola
            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 6), mat);
            tail.position.set(0, 2 * d.scale / 2, -2.5); tail.rotation.x = Math.PI / 2.5; group.add(tail);
            // Patas
            [-0.5, 0.5].forEach(x => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 2, 6), mat);
                leg.position.set(x, 0.8 * d.scale / 2, 0.3); group.add(leg);
            });
            // Brazos pequeños
            [-0.7, 0.7].forEach(x => {
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 4), mat);
                arm.position.set(x, 2.8 * d.scale / 2, 0.8); arm.rotation.z = x > 0 ? -0.5 : 0.5; group.add(arm);
            });
        } else if (d.type === 'bronto') {
            // Brontosaurio — cuello largo
            const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), mat);
            body.scale.set(1.5, 1, 2); body.position.y = 2; group.add(body);
            // Cuello
            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 6), mat);
            neck.position.set(0, 4.5, 2); neck.rotation.x = -0.4; group.add(neck);
            // Cabeza pequeña
            const hd = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), mat);
            hd.position.set(0, 6.5, 3.5); group.add(hd);
            // Cola
            const tl = new THREE.Mesh(new THREE.ConeGeometry(0.4, 4, 6), mat);
            tl.position.set(0, 1.8, -3.5); tl.rotation.x = Math.PI / 2.2; group.add(tl);
            // Patas gruesas
            [[-0.7, 1], [0.7, 1], [-0.7, -1], [0.7, -1]].forEach(([x, z]) => {
                const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 2, 6), mat);
                lg.position.set(x, 0.8, z); group.add(lg);
            });
        } else if (d.type === 'raptor') {
            // Velociraptor — ágil
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), mat);
            body.scale.set(0.8, 0.7, 1.5); body.position.y = 1.5; group.add(body);
            const hd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.8), mat);
            hd.position.set(0, 2, 1.2); group.add(hd);
            const tl = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.5, 5), mat);
            tl.position.set(0, 1.3, -2); tl.rotation.x = Math.PI / 2.3; group.add(tl);
            [-0.3, 0.3].forEach(x => {
                const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.2, 5), mat);
                lg.position.set(x, 0.5, 0.2); group.add(lg);
            });
        } else if (d.type === 'stego') {
            // Estegosaurio — placas en la espalda
            const body = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), mat);
            body.scale.set(1, 0.8, 1.8); body.position.y = 1.5; group.add(body);
            // Placas
            const plateMat = new THREE.MeshStandardMaterial({ color: 0xcc6633, roughness: 0.8 });
            for (let i = -3; i <= 3; i++) {
                const plate = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), plateMat);
                plate.position.set(0, 2.5, i * 0.5); plate.rotation.x = 0; group.add(plate);
            }
            // Cola con púas
            const tl = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 5), mat);
            tl.position.set(0, 1.3, -2.5); tl.rotation.x = Math.PI / 2.3; group.add(tl);
            [[-0.6, 0.5], [0.6, 0.5], [-0.6, -0.5], [0.6, -0.5]].forEach(([x, z]) => {
                const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.2, 5), mat);
                lg.position.set(x, 0.5, z); group.add(lg);
            });
        }

        group.position.set(d.pos[0], d.pos[1], d.pos[2]);
        group.scale.setScalar(d.scale);
        group.rotation.y = Math.random() * Math.PI * 2;
        scene.add(group);

        // Colisión con el cuerpo principal
        const collBox = new THREE.Mesh(
            new THREE.BoxGeometry(2 * d.scale, 3 * d.scale, 3 * d.scale),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        collBox.position.set(d.pos[0], d.scale, d.pos[2]);
        scene.add(collBox); colliders.push(collBox);
    });

    // ===== GODZILLA (basado en la escultura real del parque) =====
    const godzMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.85 });
    const godzGroup = new THREE.Group();

    // Cuerpo masivo
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.8, 8, 10), godzMat);
    gBody.position.y = 5; godzGroup.add(gBody);
    // Cabeza reptiliana
    const gHead = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 3), godzMat);
    gHead.position.set(0, 10.5, 1.5); godzGroup.add(gHead);
    // Ojos amarillos
    const gEyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    [-0.8, 0.8].forEach(x => {
        const ge = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), gEyeMat);
        ge.position.set(x, 10.8, 3); godzGroup.add(ge);
    });
    // Espinas dorsales
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x4488aa, emissive: 0x224466, emissiveIntensity: 0.3 });
    for (let i = 0; i < 8; i++) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.5 + Math.sin(i * 0.5) * 0.5, 4), spineMat);
        spine.position.set(0, 6 + i * 0.8, -0.8); godzGroup.add(spine);
    }
    // Cola gruesa
    const gTail = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7, 8), godzMat);
    gTail.position.set(0, 3, -5); gTail.rotation.x = Math.PI / 2.5; godzGroup.add(gTail);
    // Patas
    [-1.2, 1.2].forEach(x => {
        const gLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 3, 6), godzMat);
        gLeg.position.set(x, 1.5, 0); godzGroup.add(gLeg);
    });

    godzGroup.position.set(22, 0, 20); godzGroup.scale.setScalar(1.5);
    scene.add(godzGroup);
    const gColl = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 8), new THREE.MeshBasicMaterial({ visible: false }));
    gColl.position.set(22, 6, 20); scene.add(gColl); colliders.push(gColl);
}

/* ---------- ZONA DE PISCINAS CON TOBOGÁN Y CASCADA ---------- */
function createPoolArea() {
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x30c0e0, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 });
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xd4c8a0, roughness: 0.6 });

    // Piscina principal grande
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.8, 28), poolMat);
    pool.position.set(-10, -0.1, 0); pool.receiveShadow = true; scene.add(pool);
    const border = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.45, 8, 36), borderMat);
    border.position.set(-10, 0.35, 0); border.rotation.x = Math.PI / 2; scene.add(border); colliders.push(border);

    // Piscina para niños
    const pool2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.5, 20), poolMat);
    pool2.position.set(-10, -0.1, 12); scene.add(pool2);
    const border2 = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.35, 8, 24), borderMat);
    border2.position.set(-10, 0.25, 12); border2.rotation.x = Math.PI / 2; scene.add(border2); colliders.push(border2);

    // ===== TOBOGÁN DE AGUA =====
    const slideMat = new THREE.MeshStandardMaterial({ color: 0x2196F3, roughness: 0.3, metalness: 0.2 });
    // Rampa principal
    const slide = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 8), slideMat);
    slide.position.set(-5, 2.5, -3); slide.rotation.x = Math.PI * 0.12; slide.castShadow = true; scene.add(slide);
    // Barandas del tobogán
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1565C0 });
    [-1.1, 1.1].forEach(x => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 8), railMat);
        rail.position.set(-5 + x, 2.9, -3); rail.rotation.x = Math.PI * 0.12; scene.add(rail);
    });
    // Plataforma del tobogán
    const platform = addBox(4, 0.3, 3, -5, 4, -7.5, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 }), true);
    // Escalera
    for (let i = 0; i < 8; i++) {
        addBox(2, 0.2, 0.6, -3, 0.5 + i * 0.5, -7.5 + i * 0.3, new THREE.MeshStandardMaterial({ color: 0x999999 }), false);
    }

    // ===== CASCADA ARTIFICIAL =====
    const cascadeMat = new THREE.MeshStandardMaterial({ color: 0x60d0f0, transparent: true, opacity: 0.6, emissive: 0x2090b0, emissiveIntensity: 0.2 });
    // Rocas de la cascada
    const cascadeRock = new THREE.Mesh(new THREE.DodecahedronGeometry(3, 1), new THREE.MeshStandardMaterial({ color: 0x7a6e5b, roughness: 0.95 }));
    cascadeRock.position.set(-15, 2.5, -4); cascadeRock.scale.set(1.5, 1, 1); cascadeRock.castShadow = true;
    scene.add(cascadeRock); colliders.push(cascadeRock);
    // Agua cayendo
    const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), cascadeMat);
    waterfall.position.set(-15, 2, -2.5); scene.add(waterfall);
    animatedObjects.push({ mesh: waterfall, type: 'waterfall' });
    // Luz azul en la cascada
    const cascadeLight = new THREE.PointLight(0x44ccff, 0.6, 10);
    cascadeLight.position.set(-15, 2, -3); scene.add(cascadeLight);

    // Hongo rojo gigante decorativo (del parque real)
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xe0d5c0 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 8), stemMat);
    stem.position.set(-12, 2, 3); scene.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
    cap.position.set(-12, 4, 3); cap.castShadow = true; scene.add(cap);
    for (let i = 0; i < 6; i++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        const a = (i / 6) * Math.PI * 2;
        dot.position.set(-12 + Math.cos(a) * 1.5, 4.5 + Math.sin(a * 0.5) * 0.3, 3 + Math.sin(a) * 1.5);
        scene.add(dot);
    }
}

/* ---------- LAGUNA ARTIFICIAL CON PLAYA ---------- */
function createLagoon() {
    // Laguna grande
    const lagoonMat = new THREE.MeshStandardMaterial({
        color: 0x2090a0, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.75
    });
    const lagoon = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.5, 32), lagoonMat);
    lagoon.position.set(-30, -0.15, -10); lagoon.receiveShadow = true; scene.add(lagoon);

    // Borde de la laguna (arena)
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.9 });
    const sandRing = new THREE.Mesh(new THREE.TorusGeometry(14.5, 2.5, 8, 36), sandMat);
    sandRing.position.set(-30, 0.05, -10); sandRing.rotation.x = Math.PI / 2; sandRing.receiveShadow = true;
    scene.add(sandRing);

    // Playa artificial (zona arenosa)
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(20, 10, 8, 4), sandMat);
    beach.rotation.x = -Math.PI / 2; beach.position.set(-25, 0.04, 2);
    beach.receiveShadow = true; scene.add(beach);

    // Sombrillas de playa
    const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xff6633, roughness: 0.6 });
    [[-28, 4], [-22, 3], [-32, 5]].forEach(([x, z]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b7355 }));
        pole.position.set(x, 1.5, z); scene.add(pole);
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1, 8), umbrellaMat);
        top.position.set(x, 3.2, z); top.castShadow = true; scene.add(top);
    });

    // Botes pedal (cisnes)
    const boatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    [[-33, -8], [-27, -14]].forEach(([x, z]) => {
        const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), boatMat);
        hull.position.set(x, 0.1, z); hull.scale.set(1.5, 0.4, 0.8); scene.add(hull);
        // Cuello del cisne
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6), boatMat);
        neck.position.set(x + 1, 0.8, z); neck.rotation.z = -0.3; scene.add(neck);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), boatMat);
        hd.position.set(x + 1.3, 1.5, z); scene.add(hd);
    });

    // Kayaks
    const kayakMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 });
    [[-35, -5], [-25, -16]].forEach(([x, z]) => {
        const kayak = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 4), kayakMat);
        kayak.position.set(x, 0.1, z); kayak.scale.set(3, 0.3, 0.6); scene.add(kayak);
    });
}

/* ---------- CABAÑAS TROPICALES ---------- */
function createCabanas() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xb8a060, roughness: 1.0 });

    const cabanaPositions = [
        { x: 15, z: -5 }, { x: 22, z: -8 }, { x: 18, z: -15 },
        { x: 25, z: -18 }, { x: 12, z: -20 }
    ];

    cabanaPositions.forEach((c, idx) => {
        const size = 3 + (idx % 2);
        // Postes
        const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
        corners.forEach(([dx, dz]) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 3.5, 6), woodMat);
            post.position.set(c.x + dx * size / 2, 1.75, c.z + dz * size / 2);
            post.castShadow = true; scene.add(post); colliders.push(post);
        });
        // Techo cónico de paja
        const roof = new THREE.Mesh(new THREE.ConeGeometry(size * 0.85, 2.5, 8), thatchMat);
        roof.position.set(c.x, 4.7, c.z); roof.castShadow = true; scene.add(roof);
        // Piso de madera
        const floor = new THREE.Mesh(new THREE.BoxGeometry(size, 0.1, size), woodMat);
        floor.position.set(c.x, 0.05, c.z); scene.add(floor);
    });

    // Restaurante principal (estructura más grande)
    addBox(12, 4, 8, 20, 2, 5, new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 }), true);
    // Techo del restaurante
    const rstShape = new THREE.Shape();
    rstShape.moveTo(-7, 0); rstShape.lineTo(0, 3.5); rstShape.lineTo(7, 0); rstShape.lineTo(-7, 0);
    const rstRoof = new THREE.Mesh(
        new THREE.ExtrudeGeometry(rstShape, { depth: 9, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 })
    );
    rstRoof.position.set(20, 4, 0.5); rstRoof.castShadow = true; scene.add(rstRoof);
}

/* ---------- PUENTE COLGANTE ---------- */
function createHangingBridge() {
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.85 });

    // Torres del puente
    const towerPos = [[10, 20], [10, 30]];
    towerPos.forEach(([x, z]) => {
        [-1.5, 1.5].forEach(dx => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 6, 6), ropeMat);
            pole.position.set(x + dx, 3, z); pole.castShadow = true; scene.add(pole);
            colliders.push(pole);
        });
        // Travesaño superior
        addBox(3.5, 0.2, 0.2, x, 5.8, z, ropeMat, false);
    });

    // Tablones del puente
    for (let z = 20; z <= 30; z += 0.8) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.6), plankMat);
        const sway = Math.sin((z - 20) * 0.3) * 0.3;
        plank.position.set(10, 3.5 + sway, z); scene.add(plank);
    }

    // Cuerdas laterales (simuladas con cilindros delgados)
    [-1.2, 1.2].forEach(dx => {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 12, 4), ropeMat);
        rope.position.set(10 + dx, 4.5, 25); rope.rotation.x = Math.PI / 2; scene.add(rope);
        // Cuerda inferior
        const ropeBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 12, 4), ropeMat);
        ropeBottom.position.set(10 + dx, 3.6, 25); ropeBottom.rotation.x = Math.PI / 2; scene.add(ropeBottom);
    });

    // Cuerdas verticales
    [-1.2, 1.2].forEach(dx => {
        for (let z = 21; z <= 29; z += 2) {
            const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), ropeMat);
            vert.position.set(10 + dx, 4.1, z); scene.add(vert);
        }
    });
}

/* ---------- ACUARIO ---------- */
function createAquariumBuilding() {
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88ccee, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.4
    });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb0c8d8, roughness: 0.5 });

    // Estructura del acuario
    const building = addBox(10, 5, 8, 30, 2.5, 15, wallMat, true);
    // Ventanales de vidrio
    const glass1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.5), glassMat);
    glass1.position.set(30, 2.5, 19.01); scene.add(glass1);
    const glass2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.5), glassMat);
    glass2.position.set(30, 2.5, 10.99); glass2.rotation.y = Math.PI; scene.add(glass2);

    // Letrero "ACUARIO"
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1565C0, roughness: 0.4 });
    addBox(6, 1.5, 0.3, 30, 5.5, 19.2, signMat, false);

    // Peces decorativos visibles (esferas de colores dentro)
    const fishColors = [0xff6633, 0xffcc00, 0x33ccff, 0xff33cc, 0x33ff66];
    for (let i = 0; i < 15; i++) {
        const fishMat = new THREE.MeshBasicMaterial({ color: fishColors[i % fishColors.length] });
        const fish = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), fishMat);
        fish.position.set(
            27 + Math.random() * 6,
            1.5 + Math.random() * 2.5,
            12 + Math.random() * 6
        );
        fish.scale.set(2, 0.6, 0.8);
        scene.add(fish);
        animatedObjects.push({ mesh: fish, type: 'fish', basePos: fish.position.clone(), speed: 0.5 + Math.random() });
    }

    // Luz interior azul
    const aquaLight = new THREE.PointLight(0x2299cc, 0.8, 15);
    aquaLight.position.set(30, 3, 15); scene.add(aquaLight);
}

/* ---------- PALMERAS TROPICALES (Chapare) ---------- */
function createPalmTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7, side: THREE.DoubleSide });

    const positions = [
        [-6, 15], [6, 15], [-15, 10], [-22, 0], [16, 3], [20, -12],
        [-8, -18], [8, -22], [-24, -5], [3, -14], [-5, -25], [18, -20],
        [-35, 5], [-38, -5], [-28, -20], [28, 8], [32, -5], [-12, 25],
        [12, 22], [-18, -35], [5, -35], [-40, -15], [35, -15], [-8, 8],
        [25, 25], [-20, 15], [30, -25], [-45, 0], [40, 10],
    ];

    positions.forEach(([px, pz]) => {
        const h = 6 + Math.random() * 5;
        // Tronco con segmentos
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, h, 8), trunkMat);
        trunk.position.set(px, h / 2, pz); trunk.castShadow = true;
        scene.add(trunk); colliders.push(trunk);

        // Hojas (8-10 por palmera, más realistas)
        const leafCount = 8 + Math.floor(Math.random() * 3);
        for (let j = 0; j < leafCount; j++) {
            const leafGeo = new THREE.PlaneGeometry(0.7, 4);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            const a = (j / leafCount) * Math.PI * 2;
            leaf.position.set(px + Math.cos(a) * 1.8, h + 0.3, pz + Math.sin(a) * 1.8);
            leaf.rotation.x = -Math.PI / 3.5;
            leaf.rotation.y = a;
            leaf.castShadow = true;
            scene.add(leaf);
        }
        // Copa
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), leafMat);
        top.position.set(px, h + 0.2, pz); scene.add(top);
    });
}

/* ---------- FORMACIONES ROCOSAS ---------- */
function createRockFormations() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7e6b, roughness: 0.95, metalness: 0.05 });

    const rocks = [
        { pos: [-35, 3, -3], scale: [6, 5, 5] },
        { pos: [-28, 2, 15], scale: [3, 3, 3] },
        { pos: [28, 4, 5], scale: [5, 7, 5] },
        { pos: [30, 3, -10], scale: [4, 5, 4] },
        { pos: [-12, 1.5, -35], scale: [3, 3, 3] },
        { pos: [12, 2, -38], scale: [4, 4, 3] },
        { pos: [-35, 4, -25], scale: [7, 8, 6] },
        { pos: [35, 3, -25], scale: [5, 6, 5] },
        { pos: [-45, 2, -20], scale: [4, 3, 4] },
        { pos: [40, 2, -5], scale: [3, 4, 3] },
    ];

    rocks.forEach(r => {
        const geo = new THREE.DodecahedronGeometry(1, 1);
        const v = geo.attributes.position;
        for (let i = 0; i < v.count; i++) {
            v.setX(i, v.getX(i) + (Math.random() - 0.5) * 0.35);
            v.setY(i, v.getY(i) + (Math.random() - 0.5) * 0.35);
            v.setZ(i, v.getZ(i) + (Math.random() - 0.5) * 0.35);
        }
        geo.computeVertexNormals();
        const rock = new THREE.Mesh(geo, rockMat);
        rock.position.set(...r.pos); rock.scale.set(...r.scale);
        rock.castShadow = true; rock.receiveShadow = true;
        scene.add(rock); colliders.push(rock);
    });
}

/* ---------- DECORACIONES ---------- */
function createDecorations() {
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d7a1e, roughness: 0.85 });

    // Arbustos tropicales densos
    for (let i = 0; i < 50; i++) {
        const size = 0.5 + Math.random() * 1.2;
        const bush = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), bushMat);
        bush.position.set(-45 + Math.random() * 90, size * 0.4, -45 + Math.random() * 90);
        bush.scale.y = 0.6; bush.castShadow = true; scene.add(bush);
    }

    // Flores tropicales
    const flowerColors = [0xff6b9d, 0xffd93d, 0xff8a5c, 0xc678dd, 0xff4081, 0xffab40];
    for (let i = 0; i < 60; i++) {
        const c = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6),
            new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.15 }));
        flower.position.set(-35 + Math.random() * 70, 0.12 + Math.random() * 0.3, -35 + Math.random() * 70);
        scene.add(flower);
    }

    // Bancas de parque (a lo largo de caminos)
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.9 });
    [[-4, 10], [4, 10], [-4, -5], [4, -5], [-15, 8], [15, 8], [0, -15]].forEach(([x, z]) => {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 0.6), benchMat);
        seat.position.set(x, 0.55, z); seat.castShadow = true; scene.add(seat);
        // Respaldo
        const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.1), benchMat);
        back.position.set(x, 0.8, z - 0.3); scene.add(back);
    });

    // Faroles decorativos a lo largo del camino
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 });
    [[2.5, 30], [-2.5, 30], [2.5, 20], [-2.5, 20], [2.5, 10], [-2.5, 10]].forEach(([x, z]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 6), lampMat);
        pole.position.set(x, 1.75, z); scene.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffdd88 }));
        lamp.position.set(x, 3.6, z); scene.add(lamp);
        const light = new THREE.PointLight(0xffdd88, 0.3, 8);
        light.position.set(x, 3.6, z); scene.add(light);
    });

    // Cancha de fútbol (del parque real)
    const fieldMat = new THREE.MeshStandardMaterial({ color: 0x2a8c1f, roughness: 0.9 });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), fieldMat);
    field.rotation.x = -Math.PI / 2; field.position.set(-35, 0.02, -35);
    field.receiveShadow = true; scene.add(field);
    // Líneas de la cancha
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    addBox(20, 0.02, 0.1, -35, 0.04, -28, lineMat, false); // línea superior
    addBox(20, 0.02, 0.1, -35, 0.04, -42, lineMat, false); // línea inferior
    addBox(0.1, 0.02, 14, -45, 0.04, -35, lineMat, false); // lateral
    addBox(0.1, 0.02, 14, -25, 0.04, -35, lineMat, false); // lateral
    addBox(0.1, 0.02, 14, -35, 0.04, -35, lineMat, false); // centro

    // Zona de camping (carpas)
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
    const tentMat2 = new THREE.MeshStandardMaterial({ color: 0xff8f00, roughness: 0.7 });
    [[0, -50], [6, -48], [-6, -52], [12, -50]].forEach(([x, z], i) => {
        const tentShape = new THREE.ConeGeometry(1.5, 2, 4);
        const tent = new THREE.Mesh(tentShape, i % 2 === 0 ? tentMat : tentMat2);
        tent.position.set(x, 1, z); tent.rotation.y = Math.PI / 4;
        tent.castShadow = true; scene.add(tent);
    });
}

// ============================================================
// SECCIÓN 7: PUNTOS DE INTERÉS (Estudiante 3 — POIs)
// ============================================================
function createPOIs() {
    const poiDefinitions = [
        {
            position: [0, 3, 58],
            title: 'Entrada King Kong Gigante',
            description: 'La imponente entrada del parque con la estatua de King Kong de más de 15 metros. Escultura de fibra de vidrio creada por el artista Juan García Guzmán y estudiantes de Artes Plásticas de Cochabamba.',
            tags: ['Icónico', 'Escultura', 'Foto'],
            color: 0xff6622
        },
        {
            position: [22, 3, 20],
            title: 'Godzilla — Rey de los Monstruos',
            description: 'Impresionante escultura de Godzilla con sus espinas dorsales brillantes. Una de las 50 esculturas de fibra de vidrio que adornan el parque temático más grande de Bolivia.',
            tags: ['Escultura', 'Fantástico', 'Foto'],
            color: 0x44aa66
        },
        {
            position: [-8, 2, 45],
            title: 'T-Rex — Sendero de Dinosaurios',
            description: 'Más de 30 dinosaurios en tamaño real adornan los senderos del parque. Esculturas de hasta 7 metros creadas en fibra de vidrio con detalle paleontológico.',
            tags: ['Dinosaurios', 'Educativo', 'Aventura'],
            color: 0x5a8e3a
        },
        {
            position: [-10, 2, 0],
            title: 'Piscina Principal con Cascada',
            description: 'Piscina principal del parque con tobogán acuático y cascada artificial. Agua cristalina rodeada de vegetación tropical del Chapare. Incluye vestidores.',
            tags: ['Piscina', 'Tobogán', 'Cascada'],
            color: 0x35b8d6
        },
        {
            position: [-10, 2, 12],
            title: 'Piscina Infantil',
            description: 'Piscina de menor profundidad diseñada para niños. Zona segura con supervisión y juegos acuáticos.',
            tags: ['Familia', 'Niños', 'Seguro'],
            color: 0x4fc3f7
        },
        {
            position: [-30, 2, -10],
            title: 'Laguna Artificial y Playa',
            description: 'Laguna artificial con playa de arena blanca. Disfruta de botes pedal en forma de cisne, kayaks y pesca deportiva. Un oasis tropical en el corazón de Bolivia.',
            tags: ['Laguna', 'Playa', 'Kayak', 'Cisnes'],
            color: 0x2090a0
        },
        {
            position: [10, 4, 25],
            title: 'Puente Colgante',
            description: 'Puente colgante de aventura que cruza sobre el sendero. Desafía tu equilibrio y disfruta de vistas panorámicas del parque. Actividad de puentes de equilibrio y rompe-miedos.',
            tags: ['Aventura', 'Adrenalina', 'Puente'],
            color: 0x8b7355
        },
        {
            position: [30, 2, 15],
            title: 'Acuario Din Kong',
            description: 'Acuario con especies acuáticas de agua dulce tropicales. Ventanales panorámicos para observar la vida marina del Chapare boliviano.',
            tags: ['Acuario', 'Educativo', 'Naturaleza'],
            color: 0x2299cc
        },
        {
            position: [15, 2, -5],
            title: 'Cabañas Tropicales',
            description: 'Cabañas con techo de paja para alojamiento y descanso. Disfruta de la noche tropical en el parque con todas las comodidades.',
            tags: ['Alojamiento', 'Descanso', 'Cabañas'],
            color: 0xb8a060
        },
        {
            position: [20, 2, 5],
            title: 'Restaurante y Snacks',
            description: 'Restaurante principal del parque con gastronomía cochabambina y tropical. Snacks, bebidas y platos típicos del trópico de Cochabamba.',
            tags: ['Comida', 'Bebidas', 'Restaurante'],
            color: 0xe8a87c
        },
        {
            position: [-15, 2, -15],
            title: 'T-Rex Gigante del Sendero Sur',
            description: 'El Tyrannosaurus Rex más grande del parque, con 7 metros de altura. Ubicado en el Sendero de Dinosaurios, perfecto para fotos.',
            tags: ['Dinosaurio', 'T-Rex', 'Foto'],
            color: 0x3a5025
        },
        {
            position: [-12, 3.5, 3],
            title: 'Hongo Mágico Gigante',
            description: 'Estructura fantástica en forma de hongo rojo con puntos blancos. Un toque de fantasía que encanta a grandes y chicos.',
            tags: ['Fantástico', 'Decorativo', 'Foto'],
            color: 0xcc2222
        },
        {
            position: [-35, 2, -35],
            title: 'Cancha de Fútbol',
            description: 'Cancha de fútbol dentro del parque para actividades deportivas. Espacio para juegos familiares y recreación.',
            tags: ['Deporte', 'Fútbol', 'Familia'],
            color: 0x2a8c1f
        },
        {
            position: [0, 2, -50],
            title: 'Zona de Camping',
            description: 'Área de camping con carpas disponibles para pasar la noche en la naturaleza tropical. Experiencia completa de aventura en el Chapare.',
            tags: ['Camping', 'Aventura', 'Naturaleza'],
            color: 0x2e7d32
        },
        {
            position: [15, 2, -35],
            title: 'Brontosaurio del Valle',
            description: 'Impresionante escultura de brontosaurio con su largo cuello elevándose entre las palmeras. Réplica a escala real de estos gigantes herbívoros.',
            tags: ['Dinosaurio', 'Escultura', 'Educativo'],
            color: 0x6b7e4a
        },
    ];

    poiDefinitions.forEach((poi, index) => {
        const markerGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: poi.color, transparent: true, opacity: 0.85 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(...poi.position);
        marker.userData = { poiIndex: index };
        scene.add(marker); poiObjects.push(marker);

        // Anillo
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 32),
            new THREE.MeshBasicMaterial({ color: poi.color, transparent: true, opacity: 0.5 }));
        ring.position.copy(marker.position);
        ring.userData = { ring: true, speed: 0.5 + Math.random() * 0.5 };
        scene.add(ring);

        // Pilar de luz
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 4),
            new THREE.MeshBasicMaterial({ color: poi.color, transparent: true, opacity: 0.25 }));
        pillar.position.set(poi.position[0], poi.position[1] - 1.2, poi.position[2]);
        scene.add(pillar);

        poiData.push({ title: poi.title, description: poi.description, tags: poi.tags });
    });
}

function checkPOIInteraction() {
    raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    raycaster.far = 10;
    const hits = raycaster.intersectObjects(poiObjects);
    if (hits.length > 0) {
        const idx = hits[0].object.userData.poiIndex;
        if (idx !== undefined) showPOIInfo(poiData[idx]);
    }
}

function updatePOIHints() {
    raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    raycaster.far = 8;
    document.getElementById('interaction-hint').style.display =
        raycaster.intersectObjects(poiObjects).length > 0 ? 'flex' : 'none';
}

// ============================================================
// SECCIÓN 8: MINI-MAPA (Estudiante 1 — Interfaz)
// ============================================================
function drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const scale = 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a2e1a'; ctx.fillRect(0, 0, w, h);
    const ox = w / 2, oy = h / 2;
    const wToM = (x, z) => [ox + x * scale, oy - z * scale];

    // Laguna
    ctx.fillStyle = 'rgba(32,144,160,0.4)';
    let [lx, ly] = wToM(-30, -10);
    ctx.beginPath(); ctx.arc(lx, ly, 14 * scale, 0, Math.PI * 2); ctx.fill();

    // Piscinas
    ctx.fillStyle = 'rgba(53,184,214,0.4)';
    let [p1x, p1y] = wToM(-10, 0);
    ctx.beginPath(); ctx.arc(p1x, p1y, 8 * scale, 0, Math.PI * 2); ctx.fill();
    let [p2x, p2y] = wToM(-10, 12);
    ctx.beginPath(); ctx.arc(p2x, p2y, 4.5 * scale, 0, Math.PI * 2); ctx.fill();

    // Camino principal
    ctx.strokeStyle = 'rgba(212,200,160,0.5)'; ctx.lineWidth = 4;
    let [c1x, c1y] = wToM(0, 15); let [c2x, c2y] = wToM(0, 65);
    ctx.beginPath(); ctx.moveTo(c1x, c1y); ctx.lineTo(c2x, c2y); ctx.stroke();

    // Edificios
    ctx.fillStyle = 'rgba(154,142,122,0.5)';
    let [bx, by] = wToM(14, 9); ctx.fillRect(bx, by, 12 * scale, 8 * scale);
    // Acuario
    ctx.fillStyle = 'rgba(34,153,204,0.4)';
    let [ax, ay] = wToM(25, 19); ctx.fillRect(ax, ay, 10 * scale, 8 * scale);

    // POIs
    poiData.forEach((_, i) => {
        const obj = poiObjects[i];
        if (obj) {
            const [mx, my] = wToM(obj.position.x, obj.position.z);
            ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.fill();
        }
    });

    // Jugador
    const [plx, ply] = wToM(camera.position.x, camera.position.z);
    ctx.fillStyle = '#4fc3f7'; ctx.beginPath(); ctx.arc(plx, ply, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    const dir = camera.getWorldDirection(new THREE.Vector3());
    ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(plx, ply); ctx.lineTo(plx + dir.x * 15, ply - dir.z * 15); ctx.stroke();
}

// ============================================================
// SECCIÓN 9: ANIMACIONES Y LOOP
// ============================================================
function animatePOIs(time) {
    poiObjects.forEach((marker, i) => {
        marker.position.y = marker.userData.baseY + Math.sin(time * 2 + i) * 0.2;
        const s = 1 + Math.sin(time * 3 + i * 0.5) * 0.1;
        marker.scale.set(s, s, s);
    });
    scene.traverse(obj => {
        if (obj.userData && obj.userData.ring) {
            obj.rotation.x = Math.sin(time * obj.userData.speed) * 0.5;
            obj.rotation.y += 0.02;
        }
    });
}

function animateSpecial(time) {
    animatedObjects.forEach(obj => {
        if (obj.type === 'fish') {
            obj.mesh.position.x = obj.basePos.x + Math.sin(time * obj.speed + obj.basePos.z) * 2;
            obj.mesh.position.y = obj.basePos.y + Math.sin(time * 1.5 + obj.basePos.x) * 0.3;
        }
        if (obj.type === 'waterfall') {
            obj.mesh.material.opacity = 0.4 + Math.sin(time * 4) * 0.2;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();
    updateMovement(delta);
    animatePOIs(time);
    animateSpecial(time);
    updatePOIHints();
    if (Math.floor(time * 60) % 30 === 0) {
        updateLocationName();
        if (document.getElementById('minimap').style.display === 'block') drawMinimap();
    }
    renderer.render(scene, camera);
}

// ============================================================
// SECCIÓN 10: INICIALIZACIÓN
// ============================================================
function startTour() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    if (!isMobile) renderer.domElement.requestPointerLock();
}

function init() {
    isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    initScene();
    buildScene();
    createPOIs();
    poiObjects.forEach(obj => { obj.userData.baseY = obj.position.y; });
    initKeyboardControls();
    initPointerLock();
    initMobileControls();
    initUI();
    initLoadingScreen();
    animate();
}

init();
