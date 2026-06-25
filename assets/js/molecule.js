// 3D Molecule using Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function initMolecule() {
    const container = document.querySelector('#molecule-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x93c5fd, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7dd3fc, 0.8, 100);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x60a5fa, 0.6, 100);
    pointLight3.position.set(0, 10, -10);
    scene.add(pointLight3);

    // Molecule group (outer = rotates; inner = holds geometry, offset to its centroid)
    const molecule = new THREE.Group();
    const inner = new THREE.Group();
    molecule.add(inner);
    scene.add(molecule);

    // Atoms that respond to hover
    const atomMeshes = [];

    // Materials - lighter shades of blue
    const materials = {
        core: new THREE.MeshPhongMaterial({
            color: 0x93c5fd,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.3,
            shininess: 100
        }),
        major: new THREE.MeshPhongMaterial({
            color: 0x7dd3fc,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        cluster: new THREE.MeshPhongMaterial({
            color: 0xa5f3fc,
            emissive: 0x22d3ee,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        secondary: new THREE.MeshPhongMaterial({
            color: 0xa5b4fc,
            emissive: 0x818cf8,
            emissiveIntensity: 0.2,
            shininess: 70
        }),
        tiny: new THREE.MeshPhongMaterial({
            color: 0xbfdbfe,
            emissive: 0x60a5fa,
            emissiveIntensity: 0.15,
            shininess: 60
        }),
        ring: new THREE.MeshPhongMaterial({
            color: 0x7dd3fc,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        bond: new THREE.MeshPhongMaterial({
            color: 0x93c5fd,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.1,
            shininess: 50,
            transparent: true,
            opacity: 0.7
        })
    };

    // Helper function to create atom
    function createAtom(radius, material, position, group) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        // Clone the material so each atom can be highlighted independently.
        const mat = material.clone();
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData.baseColor = mat.color.clone();
        mesh.userData.baseEmissive = mat.emissive.clone();
        mesh.userData.baseEI = mat.emissiveIntensity;
        mesh.userData.hl = 0;
        mesh.userData.group = group;
        atomMeshes.push(mesh);
        inner.add(mesh);
        return mesh;
    }

    // Helper function to create bond between two positions
    function createBond(start, end, radius = 0.05) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();

        const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        const mesh = new THREE.Mesh(geometry, materials.bond);

        mesh.position.copy(start).add(direction.multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );

        inner.add(mesh);
        return mesh;
    }

    // Core cluster (3 atoms)
    const corePositions = [
        { x: -0.4, y: 0.2, z: 0 },
        { x: 0.5, y: -0.3, z: 0.4 },
        { x: 0.15, y: 0.6, z: -0.35 }
    ];

    const coreAtoms = corePositions.map(pos => createAtom(0.5, materials.core, pos, 'core'));

    // Core bonds
    createBond(corePositions[0], corePositions[1], 0.08);
    createBond(corePositions[1], corePositions[2], 0.08);

    // Major branch A - long chain
    const branchA = [
        { x: 1.5, y: -0.8, z: 0.6 },
        { x: 2.5, y: -1.3, z: 1.2 },
        { x: 3.2, y: -0.6, z: 2.0 },
        { x: 3.8, y: 0.3, z: 1.6 }
    ];

    branchA.forEach((pos, i) => {
        createAtom(0.35 - i * 0.02, materials.major, pos, 'aging');
        if (i === 0) {
            createBond(corePositions[1], pos, 0.06);
        } else {
            createBond(branchA[i-1], pos, 0.06);
        }
    });

    // Major branch B - going down-left
    const branchB = [
        { x: -1.4, y: 1.2, z: -0.5 },
        { x: -2.2, y: 1.8, z: -1.1 }
    ];

    branchB.forEach((pos, i) => {
        createAtom(0.32, materials.major, pos, 'music');
        if (i === 0) {
            createBond(corePositions[0], pos, 0.06);
        } else {
            createBond(branchB[i-1], pos, 0.06);
        }
    });

    // Major branch C - going into z-space
    const branchC = [
        { x: 0.3, y: -0.5, z: -1.5 },
        { x: -0.5, y: -1.1, z: -2.5 },
        { x: 0.15, y: -1.8, z: -3.3 }
    ];

    branchC.forEach((pos, i) => {
        createAtom(0.3, materials.major, pos, 'cars');
        if (i === 0) {
            createBond(corePositions[2], pos, 0.06);
        } else {
            createBond(branchC[i-1], pos, 0.06);
        }
    });

    // Dense cluster
    const cluster = [
        { x: -1.6, y: -1.2, z: 1.0 },
        { x: -2.1, y: -0.9, z: 0.6 },
        { x: -1.8, y: -1.8, z: 0.5 },
        { x: -2.4, y: -1.5, z: 1.1 },
        { x: -1.3, y: -1.9, z: 1.3 }
    ];

    cluster.forEach((pos, i) => {
        createAtom(0.22, materials.cluster, pos, 'cooking');
    });
    createBond(corePositions[0], cluster[0], 0.05);
    createBond(cluster[0], cluster[1], 0.04);
    createBond(cluster[0], cluster[2], 0.04);
    createBond(cluster[1], cluster[3], 0.04);
    createBond(cluster[2], cluster[4], 0.04);

    // Secondary atoms off branch A
    const secondaryA = [
        { x: 2.8, y: -1.9, z: 0.8 },
        { x: 2.2, y: -1.7, z: 2.0 },
        { x: 4.3, y: 0.8, z: 2.0 },
        { x: 4.1, y: -0.1, z: 2.4 },
        { x: 3.6, y: 1.0, z: 0.9 }
    ];

    secondaryA.forEach((pos, i) => {
        createAtom(0.2, materials.secondary, pos, 'aging');
    });
    createBond(branchA[1], secondaryA[0], 0.04);
    createBond(branchA[1], secondaryA[1], 0.04);
    createBond(branchA[3], secondaryA[2], 0.04);
    createBond(branchA[3], secondaryA[3], 0.04);
    createBond(branchA[3], secondaryA[4], 0.04);

    // Secondary atoms off branch B
    const secondaryB = [
        { x: -2.7, y: 2.3, z: -1.6 },
        { x: -2.5, y: 1.3, z: -1.7 }
    ];

    secondaryB.forEach(pos => createAtom(0.18, materials.secondary, pos, 'music'));
    createBond(branchB[1], secondaryB[0], 0.04);
    createBond(branchB[1], secondaryB[1], 0.04);

    // Secondary atoms off branch C
    const secondaryC = [
        { x: -0.7, y: -2.2, z: -3.9 },
        { x: 0.8, y: -2.1, z: -3.7 },
        { x: 0.5, y: -2.6, z: -2.9 },
        { x: -0.3, y: -1.3, z: -4.0 }
    ];

    secondaryC.forEach(pos => createAtom(0.2, materials.secondary, pos, 'cars'));
    createBond(branchC[2], secondaryC[0], 0.04);
    createBond(branchC[2], secondaryC[1], 0.04);
    createBond(branchC[2], secondaryC[2], 0.04);
    createBond(branchC[2], secondaryC[3], 0.04);

    // Ring structure
    const ringRadius = 0.6;
    const ringCenter = { x: -2.8, y: -0.7, z: 1.5 };
    const ringAtoms = [];

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const pos = {
            x: ringCenter.x + Math.cos(angle) * ringRadius,
            y: ringCenter.y + Math.sin(angle) * ringRadius * 0.8,
            z: ringCenter.z + Math.sin(angle) * 0.3
        };
        ringAtoms.push(pos);
        createAtom(0.18, materials.ring, pos, 'origins');
    }

    for (let i = 0; i < 5; i++) {
        createBond(ringAtoms[i], ringAtoms[(i + 1) % 5], 0.035);
    }
    createBond(cluster[3], ringAtoms[0], 0.04);

    // Tiny tip atoms
    const tips = [
        { x: 3.1, y: -2.3, z: 0.5 },
        { x: 2.0, y: -2.0, z: 2.4 },
        { x: 4.7, y: 1.2, z: 2.3 },
        { x: 4.4, y: -0.4, z: 2.9 },
        { x: 3.9, y: 1.4, z: 0.5 },
        { x: -3.0, y: 2.7, z: -2.0 },
        { x: -2.8, y: 0.9, z: -2.1 },
        { x: -1.0, y: -2.6, z: -4.4 },
        { x: 1.1, y: -2.4, z: -4.1 },
        { x: 0.8, y: -3.0, z: -2.6 },
        { x: -0.5, y: -1.0, z: -4.5 },
        { x: -1.0, y: -2.3, z: 1.6 }
    ];

    // Tip groups follow the branch each tip sprouts from
    const tipGroups = [
        'aging', 'aging', 'aging', 'aging', 'aging',
        'music', 'music',
        'cars', 'cars', 'cars', 'cars',
        'cooking'
    ];
    tips.forEach((pos, i) => createAtom(0.12, materials.tiny, pos, tipGroups[i]));

    // Recenter: offset inner group by its geometric centroid so the molecule
    // sits in the middle of the frame and rotates around its own center.
    const bbox = new THREE.Box3().setFromObject(inner);
    const center = bbox.getCenter(new THREE.Vector3());
    inner.position.sub(center);

    // Fit the camera to the molecule's bounding sphere. Fill aggressively on
    // landscape (vertical-bound) for a big hero; on portrait, fit the width so
    // the wide molecule never clips at the sides.
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;

    function fitCamera() {
        const vFov = (camera.fov * Math.PI) / 180;
        const distV = radius / Math.sin(vFov / 2);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const distH = radius / Math.sin(hFov / 2);
        camera.position.z = Math.max(distV * 0.82, distH);
        camera.updateProjectionMatrix();
    }
    fitCamera();

    // Animation
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // Hover highlighting + per-branch blurbs via raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerMoved = false;  // re-pick the branch only when the cursor moves
    let currentGroup = null;   // branch currently shown in the side panel
    const HL_COLOR = new THREE.Color(0x64ffda);

    // Each branch maps to a short blurb — PLACEHOLDER COPY, edit these freely.
    const BLURBS = {
        core:    { title: 'Pigs, obviously', img: '/assets/images/pig.jpg', text: "I love pigs with my whole chest. Fun fact: they can be taught to play joystick video games — and they beat some toddlers at it. Brilliant, stubborn, perfect animals." },
        aging:   { title: 'Useless expertise', img: '/assets/images/fridge.jpg', text: "I have an uncanny memory for the inside of fridges. Open one once and I can tell you, years later, exactly which shelf the mustard lives on. (Random fridge, a Connecticut basement, 2026.)" },
        music:   { title: 'On repeat', text: "There's always one song I've decided is the greatest ever recorded, and I'll loop it until everyone agrees or quietly leaves. The pick changes weekly.", link: { href: 'https://open.spotify.com/user/emilka.2006?si=2585f563cebe473e', label: 'My Spotify' } },
        cars:    { title: 'Quiet marvels', text: "A genuine, faintly unreasonable love for catalytic converters — a palm-sized lattice of platinum, palladium and rhodium that turns toxic exhaust into mostly water and CO2. Chemistry doing quiet, beautiful work." },
        cooking: { title: 'Always bubbling', img: '/assets/images/ferment.jpg', text: "Devoted to fermentation. There's always a jar of something alive on my counter — kimchi, kraut, hot sauce, the occasional experiment I don't mention. Letting microbes do the cooking is the closest thing to magic I know." },
        origins: { title: 'Time sink', img: '/assets/images/map.jpg', text: "Give me a good map and I will happily disappear into it — especially urban rail maps. I can lose the better part of an hour comparing how different cities draw and untangle their transit lines. (Caught communing with the Montréal Métro.)" }
    };

    // Popup element, layered over the hero
    const hero = container.closest('.hero') || container.parentElement;
    const tip = document.createElement('div');
    tip.className = 'atom-tip';
    tip.innerHTML = '<img class="atom-tip-img" alt="" /><span class="atom-tip-title"></span><span class="atom-tip-text"></span><a class="atom-tip-link" target="_blank" rel="noopener"></a>';
    if (hero) hero.appendChild(tip);

    renderer.domElement.addEventListener('pointermove', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        pointerMoved = true;
    });
    // Clear the side panel when the cursor leaves the hero entirely
    if (hero) hero.addEventListener('mouseleave', () => { currentGroup = null; });

    // Project the atoms to screen space to find the molecule's current bounds,
    // so blurb panels can avoid landing on top of it.
    const _projV = new THREE.Vector3();
    function moleculeScreenBox() {
        const hr = hero.getBoundingClientRect();
        const cr = renderer.domElement.getBoundingClientRect();
        const ox = cr.left - hr.left, oy = cr.top - hr.top;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const msh of atomMeshes) {
            msh.getWorldPosition(_projV).project(camera);
            const sx = ox + (_projV.x * 0.5 + 0.5) * cr.width;
            const sy = oy + (1 - (_projV.y * 0.5 + 0.5)) * cr.height;
            if (sx < minX) minX = sx;
            if (sx > maxX) maxX = sx;
            if (sy < minY) minY = sy;
            if (sy > maxY) maxY = sy;
        }
        const pad = 36;
        return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
    }

    function pickTipPosition() {
        const hr = hero.getBoundingClientRect();
        const m = 24;
        const tw = tip.offsetWidth || 280;
        const th = tip.offsetHeight || 200;
        const maxL = Math.max(m, hr.width - tw - m);
        const maxT = Math.max(m, hr.height - th - m);
        const box = moleculeScreenBox();
        let best = { left: m, top: m }, bestOverlap = Infinity;
        for (let i = 0; i < 40; i++) {
            const left = m + Math.random() * (maxL - m);
            const top = m + Math.random() * (maxT - m);
            const ox = Math.max(0, Math.min(left + tw, box.maxX) - Math.max(left, box.minX));
            const oy = Math.max(0, Math.min(top + th, box.maxY) - Math.max(top, box.minY));
            const overlap = ox * oy;
            if (overlap === 0) return { left: Math.round(left), top: Math.round(top) };
            if (overlap < bestOverlap) { bestOverlap = overlap; best = { left: Math.round(left), top: Math.round(top) }; }
        }
        return best;
    }

    function showTip(group) {
        if (!hero) return;
        if (group && BLURBS[group]) {
            if (tip._group !== group) {
                const b = BLURBS[group];
                tip.querySelector('.atom-tip-title').textContent = b.title;
                tip.querySelector('.atom-tip-text').textContent = b.text;
                const img = tip.querySelector('.atom-tip-img');
                if (b.img) {
                    img.src = b.img;
                    img.style.display = 'block';
                } else {
                    img.removeAttribute('src');
                    img.style.display = 'none';
                }
                const link = tip.querySelector('.atom-tip-link');
                if (b.link) {
                    link.href = b.link.href;
                    link.textContent = b.link.label;
                    link.style.display = 'inline-flex';
                } else {
                    link.removeAttribute('href');
                    link.style.display = 'none';
                }
                tip._group = group;

                // Pop up at a random open spot, biased away from the molecule
                const pos = pickTipPosition();
                tip.style.left = pos.left + 'px';
                tip.style.top = pos.top + 'px';
            }
            tip.classList.add('visible');
        } else {
            tip.classList.remove('visible');
            tip._group = null;
        }
    }

    function updateHover() {
        // Re-pick the branch only when the cursor actually moves, so the
        // continuously spinning molecule never changes the selection on its own.
        if (pointerMoved) {
            pointerMoved = false;
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(atomMeshes, false);
            if (hits.length) {
                currentGroup = hits[0].object.userData.group;
                renderer.domElement.style.cursor = 'pointer';
            } else {
                renderer.domElement.style.cursor = '';
                // keep the panel showing the last branch while over empty space
            }
        }

        // Highlight the active branch — its atoms stay lit as they spin
        for (const m of atomMeshes) {
            const target = (currentGroup && m.userData.group === currentGroup) ? 1 : 0;
            m.userData.hl += (target - m.userData.hl) * 0.15;
            const hl = m.userData.hl;
            if (hl > 0.002) {
                m.material.color.copy(m.userData.baseColor).lerp(HL_COLOR, hl * 0.5);
                m.material.emissive.copy(m.userData.baseEmissive).lerp(HL_COLOR, hl * 0.65);
                m.material.emissiveIntensity = m.userData.baseEI + hl * 0.6;
                m.scale.setScalar(1 + hl * 0.16);
            } else {
                m.material.color.copy(m.userData.baseColor);
                m.material.emissive.copy(m.userData.baseEmissive);
                m.material.emissiveIntensity = m.userData.baseEI;
                m.scale.setScalar(1);
            }
        }

        showTip(currentGroup);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Molecule spins continuously
        molecule.rotation.y += 0.003;
        molecule.rotation.x += 0.001;

        // Subtle mouse interaction
        molecule.rotation.y += mouseX * 0.002;
        molecule.rotation.x += mouseY * 0.001;

        // Keep world matrices current so raycasting tracks the rotating atoms
        scene.updateMatrixWorld();
        updateHover();

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        camera.aspect = newWidth / newHeight;
        fitCamera();
        renderer.setSize(newWidth, newHeight);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMolecule);
} else {
    initMolecule();
}
