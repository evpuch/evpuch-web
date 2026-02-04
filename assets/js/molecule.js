// 3D Molecule using Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function initMolecule() {
    const container = document.querySelector('.visual-block');
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

    const pointLight1 = new THREE.PointLight(0x60a5fa, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.8, 100);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x1d4ed8, 0.6, 100);
    pointLight3.position.set(0, 10, -10);
    scene.add(pointLight3);

    // Molecule group
    const molecule = new THREE.Group();
    scene.add(molecule);

    // Materials - different shades of blue
    const materials = {
        core: new THREE.MeshPhongMaterial({
            color: 0x60a5fa,
            emissive: 0x1e40af,
            emissiveIntensity: 0.3,
            shininess: 100
        }),
        major: new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            emissive: 0x1d4ed8,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        cluster: new THREE.MeshPhongMaterial({
            color: 0x0ea5e9,
            emissive: 0x0369a1,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        secondary: new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            emissive: 0x4338ca,
            emissiveIntensity: 0.2,
            shininess: 70
        }),
        tiny: new THREE.MeshPhongMaterial({
            color: 0x93c5fd,
            emissive: 0x2563eb,
            emissiveIntensity: 0.15,
            shininess: 60
        }),
        ring: new THREE.MeshPhongMaterial({
            color: 0x2563eb,
            emissive: 0x1e3a8a,
            emissiveIntensity: 0.2,
            shininess: 80
        }),
        bond: new THREE.MeshPhongMaterial({
            color: 0x60a5fa,
            emissive: 0x1e40af,
            emissiveIntensity: 0.1,
            shininess: 50,
            transparent: true,
            opacity: 0.7
        })
    };

    // Helper function to create atom
    function createAtom(radius, material, position) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        molecule.add(mesh);
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

        molecule.add(mesh);
        return mesh;
    }

    // Core cluster (3 atoms)
    const corePositions = [
        { x: -0.4, y: 0.2, z: 0 },
        { x: 0.5, y: -0.3, z: 0.4 },
        { x: 0.15, y: 0.6, z: -0.35 }
    ];

    const coreAtoms = corePositions.map(pos => createAtom(0.5, materials.core, pos));

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
        createAtom(0.35 - i * 0.02, materials.major, pos);
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
        createAtom(0.32, materials.major, pos);
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
        createAtom(0.3, materials.major, pos);
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
        createAtom(0.22, materials.cluster, pos);
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
        createAtom(0.2, materials.secondary, pos);
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

    secondaryB.forEach(pos => createAtom(0.18, materials.secondary, pos));
    createBond(branchB[1], secondaryB[0], 0.04);
    createBond(branchB[1], secondaryB[1], 0.04);

    // Secondary atoms off branch C
    const secondaryC = [
        { x: -0.7, y: -2.2, z: -3.9 },
        { x: 0.8, y: -2.1, z: -3.7 },
        { x: 0.5, y: -2.6, z: -2.9 },
        { x: -0.3, y: -1.3, z: -4.0 }
    ];

    secondaryC.forEach(pos => createAtom(0.2, materials.secondary, pos));
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
        createAtom(0.18, materials.ring, pos);
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

    tips.forEach(pos => createAtom(0.12, materials.tiny, pos));

    // Animation
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    function animate() {
        requestAnimationFrame(animate);

        // Slow automatic rotation
        molecule.rotation.y += 0.003;
        molecule.rotation.x += 0.001;

        // Subtle mouse interaction
        molecule.rotation.y += mouseX * 0.002;
        molecule.rotation.x += mouseY * 0.001;

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMolecule);
} else {
    initMolecule();
}
