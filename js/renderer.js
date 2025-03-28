/**
 * Handles all Three.js rendering operations
 */
class Renderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = [];
        
        // Camera settings
        this.cameraOffset = new THREE.Vector3(0, 5, 15);
        this.cameraLookAt = new THREE.Vector3(0, 0, 0);
        this.cameraLerpFactor = 0.1; // How quickly the camera follows the target (0-1)
        this.cameraLookAheadFactor = 0.5; // How much the camera looks ahead in the direction of movement
        
        // Camera shake effect properties
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeElapsed = 0;
        this.shakeOffset = new THREE.Vector3();
        
        // Post-processing effects
        this.composer = null;
        this.effectPass = null;
    }
    
    /**
     * Initialize the Three.js renderer, scene, and camera
     */
    async init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
            
            // Add subtle fog for depth
            this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
            
            // Create camera
            const aspectRatio = window.innerWidth / window.innerHeight;
            this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
            this.camera.position.copy(this.cameraOffset);
            this.camera.lookAt(this.cameraLookAt);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('game-canvas'),
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Add lights
            this.setupLights();
            
            // Add some basic environment elements (to be replaced with actual level geometry)
            this.addEnvironment();
            
            return true;
        } catch (error) {
            console.error('Error initializing renderer:', error);
            throw error;
        }
    }
    
    /**
     * Set up lighting for the scene
     */
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Optimize shadow map
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Add a secondary light for better illumination
        const secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.3);
        secondaryLight.position.set(-5, 10, -10);
        this.scene.add(secondaryLight);
        this.lights.push(secondaryLight);
    }
    
    /**
     * Add basic environment elements for testing
     */
    addEnvironment() {
        // Ground plane for testing
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x22DD22,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = -2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Grid helper for development
        const gridHelper = new THREE.GridHelper(50, 50);
        gridHelper.position.y = -1.99;
        this.scene.add(gridHelper);
        
        // Add distant skybox elements for depth and visual interest
        this.addSkyElements();
    }
    
    /**
     * Add distant sky elements for visual interest
     */
    addSkyElements() {
        // Create some distant clouds
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 1,
            metalness: 0,
            flatShading: true
        });
        
        // Create a group of clouds at different positions
        const cloudPositions = [
            { x: -20, y: 10, z: -30, scale: 2 },
            { x: -10, y: 15, z: -25, scale: 1.5 },
            { x: 0, y: 12, z: -35, scale: 2.5 },
            { x: 15, y: 14, z: -30, scale: 2 },
            { x: 25, y: 10, z: -25, scale: 1.5 }
        ];
        
        cloudPositions.forEach(pos => {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(pos.x, pos.y, pos.z);
            cloud.scale.set(pos.scale, pos.scale * 0.6, pos.scale);
            this.scene.add(cloud);
        });
        
        // Add a distant mountain range
        const mountainGeometry = new THREE.ConeGeometry(5, 10, 4);
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0x558855,
            roughness: 1,
            metalness: 0
        });
        
        // Create mountains at different positions
        const mountainPositions = [
            { x: -40, y: -2, z: -40 },
            { x: -25, y: -2, z: -40 },
            { x: -10, y: -2, z: -40 },
            { x: 5, y: -2, z: -40 },
            { x: 20, y: -2, z: -40 },
            { x: 35, y: -2, z: -40 }
        ];
        
        mountainPositions.forEach(pos => {
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(pos.x, pos.y, pos.z);
            // Randomize rotation and scale
            mountain.rotation.y = Math.random() * Math.PI;
            const scale = 1 + Math.random() * 0.5;
            mountain.scale.set(scale, scale + Math.random() * 0.5, scale);
            this.scene.add(mountain);
        });
    }
    
    /**
     * Render the scene
     */
    render() {
        // Update camera shake if active
        this.updateCameraShake();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Trigger a camera shake effect
     * @param {number} intensity - Intensity of the shake (0-1)
     * @param {number} duration - Duration of the shake in seconds
     */
    cameraShake(intensity = 0.3, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeElapsed = 0;
    }
    
    /**
     * Update camera shake effect
     */
    updateCameraShake() {
        if (this.shakeElapsed < this.shakeDuration) {
            // Update shake timer
            const deltaTime = 1/60; // Approx. one frame at 60fps
            this.shakeElapsed += deltaTime;
            
            // Calculate intensity based on remaining time (ease out)
            const currentIntensity = this.shakeIntensity * (1 - (this.shakeElapsed / this.shakeDuration));
            
            // Apply random offset to camera position
            this.shakeOffset.set(
                (Math.random() * 2 - 1) * currentIntensity,
                (Math.random() * 2 - 1) * currentIntensity,
                0
            );
            
            // Apply shake offset
            this.camera.position.add(this.shakeOffset);
        }
    }
    
    /**
     * Update camera to follow a target
     * @param {THREE.Vector3} targetPosition - Position to follow
     * @param {THREE.Vector3} targetVelocity - Target's velocity for look-ahead
     */
    updateCamera(targetPosition, targetVelocity = null) {
        if (!targetPosition) return;
        
        // Calculate the camera's target position (basic follow)
        const targetCameraPosition = new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + this.cameraOffset.y,
            targetPosition.z + this.cameraOffset.z
        );
        
        // Add look-ahead effect if target is moving
        if (targetVelocity && (Math.abs(targetVelocity.x) > 0.1 || Math.abs(targetVelocity.z) > 0.1)) {
            // Normalize x,z velocity and add look-ahead
            const lookAheadVelocity = new THREE.Vector3(targetVelocity.x, 0, targetVelocity.z);
            lookAheadVelocity.normalize();
            lookAheadVelocity.multiplyScalar(this.cameraLookAheadFactor * Math.min(targetVelocity.length(), 10));
            
            // Add look-ahead to target position (only in x,z plane)
            targetCameraPosition.x += lookAheadVelocity.x;
            targetCameraPosition.z += lookAheadVelocity.z;
        }
        
        // Smoothly interpolate the camera position (lerp)
        this.camera.position.lerp(targetCameraPosition, this.cameraLerpFactor);
        
        // Calculate look-at position (slightly ahead of the target)
        const lookAtPosition = new THREE.Vector3(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z
        );
        
        // Smoothly update the camera's look-at point
        this.cameraLookAt.lerp(lookAtPosition, this.cameraLerpFactor * 1.5);
        this.camera.lookAt(this.cameraLookAt);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}
