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
    let pointerInside = false;
    let pointerClientX = 0;
    let pointerClientY = 0;
    let lastHoveredGroup = null;
    let pinnedGroup = null;
    let pinnedX = 0;
    let pinnedY = 0;
    let spin = 1; // rotation speed factor (eases to 0 while reading a branch)
    const HL_COLOR = new THREE.Color(0x64ffda);

    // Each branch maps to a short blurb — PLACEHOLDER COPY, edit these freely.
    const BLURBS = {
        core:    { title: 'Currently', text: 'Deeply, unreasonably in love with pigs. Placeholder — replace me!' },
        aging:   { title: 'Hot take', text: 'A pig is smarter than your dog and twice as charming.' },
        music:   { title: 'One day', text: 'The teacup pig I will absolutely, definitely own.' },
        cars:    { title: 'Small joys', text: 'I name every animal I meet. The cows have full backstories.' },
        cooking: { title: 'Fair warning', text: 'I add too much of everything. Chaos is the secret ingredient.' },
        origins: { title: 'Daily thought', text: 'Pigs cannot look up at the sky. I think about this a lot.' }
    };

    // Popup element, layered over the hero
    const hero = container.closest('.hero') || container.parentElement;
    const tip = document.createElement('div');
    tip.className = 'atom-tip';
    tip.innerHTML = '<span class="atom-tip-title"></span><span class="atom-tip-text"></span><span class="atom-tip-hint">Click anywhere to dismiss</span>';
    if (hero) hero.appendChild(tip);

    renderer.domElement.addEventListener('pointermove', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        pointerClientX = e.clientX;
        pointerClientY = e.clientY;
        pointerInside = true;
    });
    renderer.domElement.addEventListener('pointerleave', () => {
        pointerInside = false;
    });

    // Click an atom to pin its blurb open (rotation pauses); click again or
    // click empty space to dismiss.
    renderer.domElement.addEventListener('click', () => {
        if (lastHoveredGroup && lastHoveredGroup !== pinnedGroup) {
            pinnedGroup = lastHoveredGroup;
            pinnedX = pointerClientX;
            pinnedY = pointerClientY;
        } else {
            pinnedGroup = null;
        }
    });

    function showTip(group) {
        if (!hero) return;
        if (group && BLURBS[group]) {
            const b = BLURBS[group];
            if (tip._group !== group) {
                tip.querySelector('.atom-tip-title').textContent = b.title;
                tip.querySelector('.atom-tip-text').textContent = b.text;
                tip._group = group;
            }
            const isPinned = pinnedGroup === group;
            tip.classList.toggle('pinned', isPinned);
            // Pinned popups stay where they were clicked; hovered ones follow the cursor.
            const baseX = isPinned ? pinnedX : pointerClientX;
            const baseY = isPinned ? pinnedY : pointerClientY;
            const rect = hero.getBoundingClientRect();
            const tw = tip.offsetWidth || 220;
            const th = tip.offsetHeight || 80;
            let lx = baseX - rect.left + 18;
            let ly = baseY - rect.top + 18;
            if (lx + tw > rect.width - 8) lx = baseX - rect.left - tw - 18;
            if (ly + th > rect.height - 8) ly = rect.height - th - 8;
            tip.style.transform = `translate(${Math.max(8, lx)}px, ${Math.max(8, ly)}px)`;
            tip.classList.add('visible');
        } else {
            tip.classList.remove('visible', 'pinned');
            tip._group = null;
        }
    }

    function updateHover() {
        let hovered = null;
        if (pointerInside) {
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(atomMeshes, false);
            if (hits.length) hovered = hits[0].object;
        }
        lastHoveredGroup = hovered ? hovered.userData.group : null;
        renderer.domElement.style.cursor = lastHoveredGroup ? 'pointer' : '';

        // A pinned branch wins; otherwise show whatever is hovered.
        const activeGroup = pinnedGroup || lastHoveredGroup;

        // Highlight the whole branch
        for (const m of atomMeshes) {
            const target = (activeGroup && m.userData.group === activeGroup) ? 1 : 0;
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

        showTip(activeGroup);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Ease the spin toward a stop while a branch is hovered or pinned, so
        // the atom stays under the cursor and its blurb is easy to read.
        const spinTarget = (pinnedGroup || lastHoveredGroup) ? 0 : 1;
        spin += (spinTarget - spin) * 0.08;

        molecule.rotation.y += 0.003 * spin;
        molecule.rotation.x += 0.001 * spin;

        // Subtle mouse interaction
        molecule.rotation.y += mouseX * 0.002 * spin;
        molecule.rotation.x += mouseY * 0.001 * spin;

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
