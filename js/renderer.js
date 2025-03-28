/**
 * Handles all Three.js rendering operations
 */
class Renderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = [];
    }
    
    /**
     * Initialize the Three.js renderer, scene, and camera
     */
    async init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
            
            // Create camera
            const aspectRatio = window.innerWidth / window.innerHeight;
            this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
            this.camera.position.set(0, 5, 15); // Position camera to view the game field
            this.camera.lookAt(0, 0, 0);
            
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
    }
    
    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Update camera to follow a target
     * @param {THREE.Vector3} targetPosition - Position to follow
     */
    updateCamera(targetPosition) {
        // Implement camera follow logic for the ball
        // This will be enhanced in later phases
        if (targetPosition) {
            this.camera.position.x = targetPosition.x;
            this.camera.position.z = targetPosition.z + 15;
            this.camera.lookAt(targetPosition);
        }
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
