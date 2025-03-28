/**
 * Class representing the bouncing ball character
 */
class Ball {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Ball properties
        this.radius = 0.5;
        this.normalRadius = 0.5;
        this.largeRadius = 1.0;
        this.mass = 1;
        this.jumpForce = 10;
        this.moveForce = 5;
        this.isEnlarged = false;
        this.isAntiGravity = false;
        
        // Ball state
        this.isOnGround = false;
        this.movingLeft = false;
        this.movingRight = false;
        
        // Mesh and physics body
        this.mesh = null;
        this.body = null;
        
        // Checkpoint for respawn
        this.checkpoint = { x: 0, y: 2, z: 0 };
        this.initialPosition = { x: 0, y: 2, z: 0 };
        
        // Power-up timers
        this.powerUpTimers = {
            speed: null,
            antiGravity: null
        };
    }
    
    /**
     * Initialize the ball
     */
    async init() {
        try {
            // Create ball mesh
            const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xFF0000, // Red color like the original Nokia Bounce
                roughness: 0.4,
                metalness: 0.3
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = false;
            this.mesh.position.set(this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
            
            // Add to scene
            this.scene.add(this.mesh);
            
            // Create physics body
            this.body = this.physicsWorld.createSphere(
                this.radius,
                this.initialPosition,
                this.mass,
                { restitution: 0.7, friction: 0.5 }
            );
            
            // Add contact event to check if on ground
            this.body.addEventListener('collide', (event) => {
                // Check if collision is with the ground or platform
                const contactNormal = new CANNON.Vec3();
                const contact = event.contact;
                
                // Get contact normal - will be used to determine if ball is on ground
                if (contact.ni) {
                    contact.ni.negate(contactNormal);
                    
                    // If normal is pointing up, we are on a ground or platform
                    if (contactNormal.y > 0.5) {
                        this.isOnGround = true;
                    }
                }
            });
            
            // Register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            return true;
        } catch (error) {
            console.error('Error initializing ball:', error);
            throw error;
        }
    }
    
    /**
     * Update the ball
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Apply movement forces if moving
        if (this.movingLeft) {
            this.body.applyForce(new CANNON.Vec3(-this.moveForce, 0, 0), this.body.position);
        }
        
        if (this.movingRight) {
            this.body.applyForce(new CANNON.Vec3(this.moveForce, 0, 0), this.body.position);
        }
        
        // Update position vector for easy access
        this.position = this.body.position;
        
        // Reset ground detection for next frame
        this.isOnGround = false;
    }
    
    /**
     * Make the ball jump
     */
    jump() {
        if (this.isOnGround || this.isAntiGravity) {
            // Apply upward force
            this.body.applyImpulse(new CANNON.Vec3(0, this.jumpForce, 0), this.body.position);
            this.isOnGround = false;
        }
    }
    
    /**
     * Begin moving left
     * @param {boolean} active - Whether to activate or deactivate movement
     */
    moveLeft(active) {
        this.movingLeft = active;
        if (active) {
            this.movingRight = false;
        }
    }
    
    /**
     * Begin moving right
     * @param {boolean} active - Whether to activate or deactivate movement
     */
    moveRight(active) {
        this.movingRight = active;
        if (active) {
            this.movingLeft = false;
        }
    }
    
    /**
     * Enlarge the ball (blue ball power-up)
     */
    enlarge() {
        if (!this.isEnlarged) {
            this.isEnlarged = true;
            
            // Scale the mesh
            this.mesh.scale.set(2, 2, 2);
            
            // Change color to blue
            this.mesh.material.color.set(0x0066CC);
            
            // Update physics body (create new one with larger radius)
            const position = this.body.position.clone();
            const velocity = this.body.velocity.clone();
            const angularVelocity = this.body.angularVelocity.clone();
            
            // Remove old body
            this.physicsWorld.removeObject({
                mesh: this.mesh,
                body: this.body
            });
            
            // Create new body
            this.body = this.physicsWorld.createSphere(
                this.largeRadius,
                { x: position.x, y: position.y, z: position.z },
                this.mass * 1.5, // Slightly more mass when larger
                { restitution: 0.7, friction: 0.5 }
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Re-register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
        }
    }
    
    /**
     * Shrink the ball back to normal size
     */
    shrink() {
        if (this.isEnlarged) {
            this.isEnlarged = false;
            
            // Scale the mesh back
            this.mesh.scale.set(1, 1, 1);
            
            // Change color back to red
            this.mesh.material.color.set(0xFF0000);
            
            // Update physics body (create new one with normal radius)
            const position = this.body.position.clone();
            const velocity = this.body.velocity.clone();
            const angularVelocity = this.body.angularVelocity.clone();
            
            // Remove old body
            this.physicsWorld.removeObject({
                mesh: this.mesh,
                body: this.body
            });
            
            // Create new body
            this.body = this.physicsWorld.createSphere(
                this.normalRadius,
                { x: position.x, y: position.y, z: position.z },
                this.mass,
                { restitution: 0.7, friction: 0.5 }
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Re-register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
        }
    }
    
    /**
     * Increase the ball's speed temporarily
     */
    increaseSpeed() {
        const originalMoveForce = this.moveForce;
        this.moveForce *= 2;
        
        // Clear existing timer if there is one
        if (this.powerUpTimers.speed) {
            clearTimeout(this.powerUpTimers.speed);
        }
        
        // Reset after 5 seconds
        this.powerUpTimers.speed = setTimeout(() => {
            this.moveForce = originalMoveForce;
            this.powerUpTimers.speed = null;
        }, 5000);
    }
    
    /**
     * Enable anti-gravity mode temporarily
     */
    enableAntiGravity() {
        this.isAntiGravity = true;
        
        // Reduce gravity effect
        this.body.gravity.set(0, -1, 0);
        
        // Clear existing timer if there is one
        if (this.powerUpTimers.antiGravity) {
            clearTimeout(this.powerUpTimers.antiGravity);
        }
        
        // Reset after 5 seconds
        this.powerUpTimers.antiGravity = setTimeout(() => {
            this.isAntiGravity = false;
            this.body.gravity.set(0, -9.82, 0);
            this.powerUpTimers.antiGravity = null;
        }, 5000);
    }
    
    /**
     * Set checkpoint for respawn
     * @param {Object} position - Position {x, y, z} for checkpoint
     */
    setCheckpoint(position) {
        this.checkpoint = { ...position };
    }
    
    /**
     * Respawn the ball at the last checkpoint
     */
    respawn() {
        // Reset position to checkpoint
        this.body.position.set(this.checkpoint.x, this.checkpoint.y, this.checkpoint.z);
        
        // Reset velocity
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        // Reset power-ups
        if (this.isEnlarged) {
            this.shrink();
        }
        
        if (this.isAntiGravity) {
            this.isAntiGravity = false;
            this.body.gravity.set(0, -9.82, 0);
            
            if (this.powerUpTimers.antiGravity) {
                clearTimeout(this.powerUpTimers.antiGravity);
                this.powerUpTimers.antiGravity = null;
            }
        }
        
        if (this.powerUpTimers.speed) {
            clearTimeout(this.powerUpTimers.speed);
            this.moveForce = 5; // Reset to default
            this.powerUpTimers.speed = null;
        }
    }
    
    /**
     * Reset the ball to initial position
     */
    reset() {
        // Reset checkpoint
        this.checkpoint = { ...this.initialPosition };
        
        // Call respawn to reset position and states
        this.respawn();
    }
}
