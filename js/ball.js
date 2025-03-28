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
        this.moveForce = 15; // Increased for better responsiveness
        this.maxSpeed = 15; // Maximum horizontal speed
        this.isEnlarged = false;
        this.isAntiGravity = false;
        
        // Ball state
        this.isOnGround = false;
        this.movingLeft = false;
        this.movingRight = false;
        this.jumpCooldown = 0; // Cooldown timer for jumps
        
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
        
        // Trail effect
        this.trail = null;
        this.trailPoints = [];
        this.maxTrailPoints = 20;
        this.lastTrailUpdateTime = 0;
        this.trailUpdateInterval = 0.05; // Seconds between trail updates
    }
    
    /**
     * Initialize the ball
     */
    async init() {
        try {
            // Create ball mesh with more detailed geometry
            const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xFF0000, // Red color like the original Nokia Bounce
                roughness: 0.4,
                metalness: 0.3,
                emissive: 0x330000, // Slight emissive color for glow effect
                emissiveIntensity: 0.2
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = false;
            this.mesh.position.set(this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
            
            // Add to scene
            this.scene.add(this.mesh);
            
            // Create physics body with more realistic properties
            this.body = this.physicsWorld.createSphere(
                this.radius,
                this.initialPosition,
                this.mass,
                { restitution: 0.5, friction: 0.3 } // Adjusted for better gameplay feel
            );
            
            // Add contact event to check if on ground
            this.body.addEventListener('collide', (event) => {
                // Check if collision is with the ground or platform
                const contactNormal = new CANNON.Vec3();
                const contact = event.contact;
                
                // Get contact normal - will be used to determine if ball is on ground
                if (contact && contact.ni) {
                    contact.ni.negate(contactNormal);
                    
                    // If normal is pointing up, we are on a ground or platform
                    if (contactNormal.y > 0.5) {
                        this.isOnGround = true;
                    }
                }
            });
            
            // Initialize trail effect
            this.initTrail();
            
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
     * Initialize trail effect for the ball
     */
    initTrail() {
        // Create trail geometry
        const trailGeometry = new THREE.BufferGeometry();
        
        // Initialize positions for the trail points
        const positions = new Float32Array(this.maxTrailPoints * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Set draw range to zero initially
        trailGeometry.setDrawRange(0, 0);
        
        // Create trail material
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xFF6666,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        // Create the trail line
        this.trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(this.trail);
    }
    
    /**
     * Update the trail effect
     */
    updateTrail(time) {
        // Only update at certain intervals for performance
        if (time - this.lastTrailUpdateTime < this.trailUpdateInterval) return;
        
        // Update last update time
        this.lastTrailUpdateTime = time;
        
        // Add current position to trail
        this.trailPoints.unshift({
            x: this.mesh.position.x,
            y: this.mesh.position.y,
            z: this.mesh.position.z
        });
        
        // Limit the number of trail points
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.pop();
        }
        
        // Update trail geometry
        const positions = this.trail.geometry.attributes.position.array;
        let index = 0;
        
        for (const point of this.trailPoints) {
            positions[index++] = point.x;
            positions[index++] = point.y;
            positions[index++] = point.z;
        }
        
        // Update the draw range
        this.trail.geometry.setDrawRange(0, this.trailPoints.length);
        this.trail.geometry.attributes.position.needsUpdate = true;
        
        // Make the trail fade based on velocity
        const speed = this.body.velocity.length();
        const baseOpacity = 0.3;
        const velocityFactor = Math.min(speed / 10, 1); // Normalize speed
        this.trail.material.opacity = baseOpacity + 0.4 * velocityFactor;
    }
    
    /**
     * Update the ball
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const time = performance.now() / 1000; // Current time in seconds
        
        // Debug movement state
        if (this.movingLeft || this.movingRight) {
            console.log('Movement state:', 
                this.movingLeft ? 'LEFT' : (this.movingRight ? 'RIGHT' : 'NONE'), 
                'Velocity X:', this.body ? this.body.velocity.x.toFixed(2) : 'N/A'
            );
        }
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        // Update position vector for easy access
        this.position = this.body.position;
        
        // Update the trail effect
        this.updateTrail(time);
        
        // Reset ground detection for next frame (will be set by collision events)
        this.isOnGround = false;
        
        // Add a slight rotation based on movement for visual effect
        if (this.body.velocity.x !== 0) {
            this.mesh.rotation.z -= this.body.velocity.x * 0.01;
        }
    }
    
    /**
     * Make the ball jump
     */
    jump() {
        if ((this.isOnGround || this.isAntiGravity) && this.jumpCooldown <= 0) {
            // Apply upward impulse
            const jumpStrength = this.isEnlarged ? this.jumpForce * 0.8 : this.jumpForce;
            this.body.applyImpulse(new CANNON.Vec3(0, jumpStrength, 0), this.body.position);
            this.isOnGround = false;
            
            // Set jump cooldown to prevent jump spamming
            this.jumpCooldown = 0.3;
            
            // Reset any extreme rotation
            this.body.angularVelocity.set(0, 0, 0);
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
            console.log('Moving left activated');
        } else {
            console.log('Moving left deactivated');
        }
        
        // Apply immediate velocity change for more responsive control
        if (this.body) {
            const currentVel = this.body.velocity;
            if (active) {
                // Set a strong leftward velocity immediately
                this.body.velocity.set(-8, currentVel.y, currentVel.z);
            } else if (!this.movingRight) {
                // Stop horizontal movement if not moving right
                this.body.velocity.set(0, currentVel.y, currentVel.z);
            }
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
            console.log('Moving right activated');
        } else {
            console.log('Moving right deactivated');
        }
        
        // Apply immediate velocity change for more responsive control
        if (this.body) {
            const currentVel = this.body.velocity;
            if (active) {
                // Set a strong rightward velocity immediately
                this.body.velocity.set(8, currentVel.y, currentVel.z);
            } else if (!this.movingLeft) {
                // Stop horizontal movement if not moving left
                this.body.velocity.set(0, currentVel.y, currentVel.z);
            }
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
            
            // Change color to blue with visual effect
            this.mesh.material.color.set(0x0066CC);
            this.mesh.material.emissive.set(0x001133);
            this.trail.material.color.set(0x6699FF);
            
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
                { restitution: 0.5, friction: 0.3 }
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Re-register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            // Add collision event listener again
            this.body.addEventListener('collide', (event) => {
                const contactNormal = new CANNON.Vec3();
                const contact = event.contact;
                
                if (contact && contact.ni) {
                    contact.ni.negate(contactNormal);
                    if (contactNormal.y > 0.5) {
                        this.isOnGround = true;
                    }
                }
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
            this.mesh.material.emissive.set(0x330000);
            this.trail.material.color.set(0xFF6666);
            
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
                { restitution: 0.5, friction: 0.3 }
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Re-register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            // Add collision event listener again
            this.body.addEventListener('collide', (event) => {
                const contactNormal = new CANNON.Vec3();
                const contact = event.contact;
                
                if (contact && contact.ni) {
                    contact.ni.negate(contactNormal);
                    if (contactNormal.y > 0.5) {
                        this.isOnGround = true;
                    }
                }
            });
        }
    }
    
    /**
     * Increase the ball's speed temporarily
     */
    increaseSpeed() {
        const originalMoveForce = this.moveForce;
        const originalMaxSpeed = this.maxSpeed;
        
        // Increase speed parameters
        this.moveForce *= 2;
        this.maxSpeed *= 1.5;
        
        // Visual feedback
        this.mesh.material.emissive.set(0x003300);
        this.trail.material.color.set(0xFF3333);
        
        // Clear existing timer if there is one
        if (this.powerUpTimers.speed) {
            clearTimeout(this.powerUpTimers.speed);
        }
        
        // Reset after 5 seconds
        this.powerUpTimers.speed = setTimeout(() => {
            this.moveForce = originalMoveForce;
            this.maxSpeed = originalMaxSpeed;
            this.mesh.material.emissive.set(this.isEnlarged ? 0x001133 : 0x330000);
            this.trail.material.color.set(this.isEnlarged ? 0x6699FF : 0xFF6666);
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
        
        // Visual feedback
        this.mesh.material.emissive.set(0x220033);
        this.trail.material.color.set(0xAA66FF);
        
        // Clear existing timer if there is one
        if (this.powerUpTimers.antiGravity) {
            clearTimeout(this.powerUpTimers.antiGravity);
        }
        
        // Reset after 5 seconds
        this.powerUpTimers.antiGravity = setTimeout(() => {
            this.isAntiGravity = false;
            this.body.gravity.set(0, -9.82, 0);
            this.mesh.material.emissive.set(this.isEnlarged ? 0x001133 : 0x330000);
            this.trail.material.color.set(this.isEnlarged ? 0x6699FF : 0xFF6666);
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
        
        // Reset trail
        this.trailPoints = [];
        this.trail.geometry.setDrawRange(0, 0);
        
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
            this.moveForce = 15; // Reset to default
            this.maxSpeed = 15;
            this.powerUpTimers.speed = null;
        }
        
        // Reset visual appearance
        this.mesh.material.emissive.set(0x330000);
        this.trail.material.color.set(0xFF6666);
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
