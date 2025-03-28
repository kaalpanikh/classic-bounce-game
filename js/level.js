/**
 * Class that handles level loading and management
 */
class Level {
    constructor(levelNumber, scene, physicsWorld) {
        this.levelNumber = levelNumber;
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Level objects
        this.platforms = [];
        this.obstacles = [];
        this.hoops = [];
        this.checkpoints = [];
        this.powerUps = [];
        this.waterAreas = [];
        
        // Level state
        this.hoopsCollected = 0;
        this.totalHoops = 0;
    }
    
    /**
     * Initialize the level
     */
    async init() {
        try {
            await this.loadLevel(this.levelNumber);
            return true;
        } catch (error) {
            console.error('Error initializing level:', error);
            throw error;
        }
    }
    
    /**
     * Load a level by number
     * @param {number} levelNumber - Level to load
     */
    async loadLevel(levelNumber) {
        this.levelNumber = levelNumber;
        
        // Clear any existing level objects
        this.clearLevel();
        
        // For now, we'll just create a simple test level
        // Later this will load level data from a configuration
        this.createTestLevel(levelNumber);
        
        console.log(`Level ${levelNumber} loaded`);
        return true;
    }
    
    /**
     * Clear all level objects and reset state
     */
    clearLevel() {
        // Remove all objects from the scene and physics world
        [...this.platforms, ...this.obstacles, ...this.hoops, 
            ...this.checkpoints, ...this.powerUps, ...this.waterAreas].forEach(object => {
            if (object.mesh) {
                this.scene.remove(object.mesh);
            }
            if (object.body) {
                this.physicsWorld.removeObject(object);
            }
        });
        
        // Clear arrays
        this.platforms = [];
        this.obstacles = [];
        this.hoops = [];
        this.checkpoints = [];
        this.powerUps = [];
        this.waterAreas = [];
        
        // Reset state
        this.hoopsCollected = 0;
        this.totalHoops = 0;
    }
    
    /**
     * Create a test level for development
     * @param {number} levelNumber - Level number influences the complexity
     */
    createTestLevel(levelNumber) {
        // Create platforms based on level number
        switch (levelNumber) {
            case 1:
                this.createBasicLevel();
                break;
            case 2:
                this.createIntermediateLevel();
                break;
            default:
                // Default to basic level for now
                this.createBasicLevel();
                break;
        }
    }
    
    /**
     * Create a basic level with simple platforms and obstacles
     */
    createBasicLevel() {
        // Add some basic platforms
        this.addPlatform({ x: 0, y: -1, z: 0 }, { x: 10, y: 0.5, z: 3 });
        this.addPlatform({ x: -7, y: 0, z: 0 }, { x: 3, y: 0.5, z: 3 });
        this.addPlatform({ x: -12, y: 1, z: 0 }, { x: 3, y: 0.5, z: 3 });
        this.addPlatform({ x: 8, y: 0, z: 0 }, { x: 5, y: 0.5, z: 3 });
        this.addPlatform({ x: 15, y: 1, z: 0 }, { x: 5, y: 0.5, z: 3 });
        
        // Add a checkpoint
        this.addCheckpoint({ x: 8, y: 1, z: 0 });
        
        // Add some obstacles
        this.addObstacle({ x: -5, y: 0, z: 0 }, { x: 0.5, y: 0.5, z: 0.5 });
        this.addObstacle({ x: 5, y: 0, z: 0 }, { x: 0.5, y: 0.5, z: 0.5 });
        
        // Add a moving obstacle
        this.addMovingObstacle(
            { x: 12, y: 1, z: 0 },
            { x: 12, y: 1, z: 0 },
            { x: 15, y: 1, z: 0 },
            0.05
        );
        
        // Add some hoops (level goals)
        this.addHoop({ x: -12, y: 2.5, z: 0 });
        this.addHoop({ x: 15, y: 2.5, z: 0 });
        this.totalHoops = 2;
        
        // Add some power-ups
        this.addPowerUp({ x: -2, y: 0.5, z: 0 }, 'enlarge');
        this.addPowerUp({ x: 10, y: 1.5, z: 0 }, 'speed');
    }
    
    /**
     * Create a more complex level
     */
    createIntermediateLevel() {
        // More complex level to be implemented
        // This is just a placeholder for now
        this.createBasicLevel();
    }
    
    /**
     * Add a platform to the level
     * @param {Object} position - Position {x, y, z}
     * @param {Object} size - Size {x, y, z}
     * @returns {Object} - The created platform object
     */
    addPlatform(position, size) {
        // Create platform mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // Create physics body
        const body = this.physicsWorld.createBox(
            size,
            position,
            0, // Mass of 0 makes it static
            { friction: 0.5, restitution: 0.2 }
        );
        
        // Create platform object
        const platform = { mesh, body, position, size };
        
        // Add to platforms array
        this.platforms.push(platform);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(platform);
        
        return platform;
    }
    
    /**
     * Add an obstacle to the level
     * @param {Object} position - Position {x, y, z}
     * @param {Object} size - Size {x, y, z}
     * @returns {Object} - The created obstacle object
     */
    addObstacle(position, size) {
        // Create obstacle mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x330000
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // Create physics body
        const body = this.physicsWorld.createBox(
            size,
            position,
            0, // Mass of 0 makes it static
            { friction: 0.1, restitution: 0.2 }
        );
        
        // Create obstacle object
        const obstacle = { 
            mesh, 
            body, 
            position, 
            size,
            type: 'static' 
        };
        
        // Add to obstacles array
        this.obstacles.push(obstacle);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(obstacle);
        
        return obstacle;
    }
    
    /**
     * Add a moving obstacle to the level
     * @param {Object} position - Initial position {x, y, z}
     * @param {Object} start - Start position for movement {x, y, z}
     * @param {Object} end - End position for movement {x, y, z}
     * @param {number} speed - Movement speed
     * @returns {Object} - The created moving obstacle object
     */
    addMovingObstacle(position, start, end, speed) {
        // Create obstacle mesh
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFF4400,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x331100
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // Create physics body
        const body = this.physicsWorld.createBox(
            { x: 0.5, y: 0.5, z: 0.5 },
            position,
            0, // Mass of 0 makes it kinematic
            { friction: 0.1, restitution: 0.2 }
        );
        
        // Create moving obstacle object
        const obstacle = { 
            mesh, 
            body, 
            position, 
            size: { x: 0.5, y: 0.5, z: 0.5 },
            type: 'moving',
            movement: {
                start,
                end,
                speed,
                direction: 1, // 1 for forward, -1 for backward
                progress: 0 // 0 to 1
            }
        };
        
        // Add to obstacles array
        this.obstacles.push(obstacle);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(obstacle);
        
        return obstacle;
    }
    
    /**
     * Add a hoop (goal) to the level
     * @param {Object} position - Position {x, y, z}
     * @returns {Object} - The created hoop object
     */
    addHoop(position) {
        // Create hoop mesh - for now, just a simple ring
        const geometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x333300
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = Math.PI / 2; // Make the hoop horizontal
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // For collision detection, we'll use a simple sphere
        const body = this.physicsWorld.createSphere(
            0.6, // Slightly larger than visual radius for easier collision
            position,
            0 // Mass of 0 makes it static
        );
        
        // Set collision response to false so the ball doesn't bounce off
        body.collisionResponse = false;
        
        // Create hoop object
        const hoop = { 
            mesh, 
            body, 
            position,
            collected: false
        };
        
        // Add to hoops array
        this.hoops.push(hoop);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(hoop);
        
        return hoop;
    }
    
    /**
     * Add a checkpoint to the level
     * @param {Object} position - Position {x, y, z}
     * @returns {Object} - The created checkpoint object
     */
    addCheckpoint(position) {
        // Create checkpoint mesh - a yellow rhombus
        const geometry = new THREE.OctahedronGeometry(0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x333300
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to scene
        this.scene.add(mesh);
        
        // For collision detection, we'll use a sphere
        const body = this.physicsWorld.createSphere(
            0.7, // Slightly larger than visual size for easier activation
            position,
            0 // Mass of 0 makes it static
        );
        
        // Set collision response to false so the ball doesn't bounce off
        body.collisionResponse = false;
        
        // Create checkpoint object
        const checkpoint = { 
            mesh, 
            body, 
            position,
            activated: false
        };
        
        // Add to checkpoints array
        this.checkpoints.push(checkpoint);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(checkpoint);
        
        return checkpoint;
    }
    
    /**
     * Add a power-up to the level
     * @param {Object} position - Position {x, y, z}
     * @param {string} type - Power-up type ('enlarge', 'shrink', 'speed', 'antigravity')
     * @returns {Object} - The created power-up object
     */
    addPowerUp(position, type) {
        // Determine geometry and color based on type
        let geometry, color, emissive;
        
        switch (type) {
            case 'enlarge':
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                color = 0x0066CC; // Blue
                emissive = 0x001133;
                break;
            case 'shrink':
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                color = 0xFF0000; // Red
                emissive = 0x330000;
                break;
            case 'speed':
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                color = 0x00FF00; // Green
                emissive = 0x003300;
                break;
            case 'antigravity':
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                color = 0xAA00FF; // Purple
                emissive = 0x220033;
                break;
            default:
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                color = 0xFFFFFF;
                emissive = 0x333333;
        }
        
        const material = new THREE.MeshStandardMaterial({ 
            color,
            roughness: 0.3,
            metalness: 0.8,
            emissive
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Animate the power-up
        mesh.rotation.y = Math.random() * Math.PI;
        
        // Add to scene
        this.scene.add(mesh);
        
        // For collision detection, we'll use a sphere
        const body = this.physicsWorld.createSphere(
            0.5, // Slightly larger than visual size for easier collection
            position,
            0 // Mass of 0 makes it static
        );
        
        // Set collision response to false so the ball doesn't bounce off
        body.collisionResponse = false;
        
        // Create power-up object
        const powerUp = { 
            mesh, 
            body, 
            position,
            type,
            collected: false
        };
        
        // Add to power-ups array
        this.powerUps.push(powerUp);
        
        // Register for physics updates
        this.physicsWorld.addObjectToUpdate(powerUp);
        
        return powerUp;
    }
    
    /**
     * Check for collisions between the ball and obstacles
     * @param {Ball} ball - The player ball
     * @returns {boolean} - True if collision with obstacle
     */
    checkObstacleCollisions(ball) {
        for (const obstacle of this.obstacles) {
            // Simple distance-based collision detection
            const distance = new THREE.Vector3()
                .copy(ball.mesh.position)
                .sub(obstacle.mesh.position)
                .length();
            
            // If distance is less than sum of ball radius and obstacle size
            if (distance < (ball.isEnlarged ? ball.largeRadius : ball.normalRadius) + 0.5) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check for collisions between the ball and hoops
     * @param {Ball} ball - The player ball
     * @returns {boolean} - True if collision with a hoop
     */
    checkHoopCollisions(ball) {
        for (const hoop of this.hoops) {
            if (!hoop.collected) {
                // Simple distance-based collision detection
                const distance = new THREE.Vector3()
                    .copy(ball.mesh.position)
                    .sub(hoop.mesh.position)
                    .length();
                
                // If distance is less than sum of ball radius and hoop size
                if (distance < (ball.isEnlarged ? ball.largeRadius : ball.normalRadius) + 0.6) {
                    // Mark as collected and hide the hoop
                    hoop.collected = true;
                    hoop.mesh.visible = false;
                    
                    // Increment collected hoops count
                    this.hoopsCollected++;
                    
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check for collisions between the ball and checkpoints
     * @param {Ball} ball - The player ball
     * @returns {Object|null} - The checkpoint object if collision, null otherwise
     */
    checkCheckpointCollisions(ball) {
        for (const checkpoint of this.checkpoints) {
            if (!checkpoint.activated) {
                // Simple distance-based collision detection
                const distance = new THREE.Vector3()
                    .copy(ball.mesh.position)
                    .sub(checkpoint.mesh.position)
                    .length();
                
                // If distance is less than sum of ball radius and checkpoint size
                if (distance < (ball.isEnlarged ? ball.largeRadius : ball.normalRadius) + 0.7) {
                    // Mark as activated and change color
                    checkpoint.activated = true;
                    checkpoint.mesh.material.color.set(0x88FF88);
                    checkpoint.mesh.material.emissive.set(0x113311);
                    
                    return checkpoint;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Check for collisions between the ball and power-ups
     * @param {Ball} ball - The player ball
     * @returns {Object|null} - The power-up object if collision, null otherwise
     */
    checkPowerUpCollisions(ball) {
        for (const powerUp of this.powerUps) {
            if (!powerUp.collected) {
                // Simple distance-based collision detection
                const distance = new THREE.Vector3()
                    .copy(ball.mesh.position)
                    .sub(powerUp.mesh.position)
                    .length();
                
                // If distance is less than sum of ball radius and power-up size
                if (distance < (ball.isEnlarged ? ball.largeRadius : ball.normalRadius) + 0.5) {
                    // Mark as collected and hide the power-up
                    powerUp.collected = true;
                    powerUp.mesh.visible = false;
                    
                    return powerUp;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Update level objects
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update moving obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'moving') {
                // Update progress
                obstacle.movement.progress += obstacle.movement.speed * 
                    obstacle.movement.direction * deltaTime;
                
                // Check if we need to reverse direction
                if (obstacle.movement.progress >= 1) {
                    obstacle.movement.progress = 1;
                    obstacle.movement.direction = -1;
                } else if (obstacle.movement.progress <= 0) {
                    obstacle.movement.progress = 0;
                    obstacle.movement.direction = 1;
                }
                
                // Interpolate position
                const startPos = obstacle.movement.start;
                const endPos = obstacle.movement.end;
                const progress = obstacle.movement.progress;
                
                // Update position
                obstacle.body.position.x = startPos.x + (endPos.x - startPos.x) * progress;
                obstacle.body.position.y = startPos.y + (endPos.y - startPos.y) * progress;
                obstacle.body.position.z = startPos.z + (endPos.z - startPos.z) * progress;
            }
        });
        
        // Animate power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                powerUp.mesh.rotation.y += deltaTime * 2;
                powerUp.mesh.position.y = powerUp.position.y + Math.sin(Date.now() * 0.003) * 0.1;
            }
        });
        
        // Animate hoops
        this.hoops.forEach(hoop => {
            if (!hoop.collected) {
                hoop.mesh.rotation.y += deltaTime;
            }
        });
        
        // Animate checkpoints
        this.checkpoints.forEach(checkpoint => {
            checkpoint.mesh.rotation.y += deltaTime * 0.5;
        });
    }
    
    /**
     * Check if level is complete (all hoops collected)
     * @returns {boolean} - True if level is complete
     */
    isComplete() {
        return this.hoopsCollected >= this.totalHoops;
    }
}
