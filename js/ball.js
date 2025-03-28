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
        
        // Enable continuous, small bouncing like the original Nokia game
        this.autoBounce = true;
        this.idleBounceCooldown = 0;
        this.lastBounceTime = 0;
        
        // Visual stabilizer to prevent flashing
        this.lastMeshPosition = new THREE.Vector3();
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
            
            // *** USE EXACT SAME PHYSICS PROPERTIES AS BLUE BALL ***
            const blueballPhysics = {
                restitution: 0.45,
                friction: 0.25,
                contactEquationStiffness: 2e7,
                contactEquationRelaxation: 5
            };
            
            this.body = this.physicsWorld.createSphere(
                this.radius,
                this.initialPosition,
                this.mass,
                blueballPhysics
            );
            
            // Apply blue ball's exact settings
            this.body.linearDamping = 0.08;
            this.body.angularDamping = 0.4;
            this.body.fixedRotation = false;
            
            // Initialize trail effect
            this.initTrail();
            
            // Register for physics updates
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            // Add contact material for ball vs ground/platforms
            this.setupContactMaterials();
            
            return true;
        } catch (error) {
            console.error('Error initializing ball:', error);
            throw error;
        }
    }
    
    /**
     * Set up special contact materials for different surface interactions
     */
    setupContactMaterials() {
        // Create a ball material
        const ballMaterial = new CANNON.Material('ballMaterial');
        this.body.material = ballMaterial;
        
        // Exactly match the blue ball's contact materials
        const platformContact = new CANNON.ContactMaterial(
            ballMaterial,
            new CANNON.Material('platformMaterial'),
            {
                friction: 0.25,         // Blue ball's exact friction
                restitution: 0.45,      // Blue ball's exact bounce
                contactEquationRelaxation: 5,
                contactEquationStiffness: 2e7
            }
        );
        
        // Bouncy platforms with exact blue ball physics
        const bouncyContact = new CANNON.ContactMaterial(
            ballMaterial,
            new CANNON.Material('bouncyMaterial'),
            {
                friction: 0.2,
                restitution: 0.65,
                contactEquationRelaxation: 6,
                contactEquationStiffness: 2e7
            }
        );
        
        // Add contact materials to the world
        this.physicsWorld.world.addContactMaterial(platformContact);
        this.physicsWorld.world.addContactMaterial(bouncyContact);
    }
    
    /**
     * Cap extreme velocities to prevent physics issues
     * Exact implementation from blue ball
     */
    capVerticalVelocity() {
        // Always apply consistent downward force when the ball is above a certain height
        // This is the key physics difference that makes the blue ball come down naturally
        if (this.body.position.y > 3) {
            // Apply a stronger downward force based on height
            const heightFactor = Math.min((this.body.position.y - 3) / 5, 1);
            const gravityMultiplier = 0.3 + (heightFactor * 0.5);
            
            // Apply stronger downward force when moving up vs. moving down
            if (this.body.velocity.y > 0) {
                this.body.velocity.y -= gravityMultiplier * 0.6;
            } else {
                // Slightly boost downward velocity for consistent fall behavior
                this.body.velocity.y -= gravityMultiplier * 0.3;
            }
        }
        
        // Hard limit on upward velocity - essential for proper physics
        if (this.body.velocity.y > 5) {
            this.body.velocity.y = 5;
        }
        
        // Hard limit on downward velocity - prevents too-fast falls
        if (this.body.velocity.y < -12) {
            this.body.velocity.y = -12;
        }
        
        // Blue ball's original extra gravity for realistic arcs
        if (this.body.position.y > 4 && this.body.velocity.y > 0) {
            this.body.velocity.y -= 0.4;
        }
    }
    
    /**
     * Update the ball
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const time = performance.now() / 1000; // Current time in seconds
        
        // Update position vector for easy access
        this.position = this.body.position;
        
        // Add a downward raycast to more reliably detect ground
        this.checkGroundContact();
        
        // Always make sure physics is being properly applied
        this.ensurePhysicsIntegrity();
        
        // Apply strict velocity caps to prevent unwanted movement
        this.capVerticalVelocity();
        
        // Always apply authentic Nokia-style continuous bouncing
        this.applyContinuousBounce();
        
        // Update the trail effect
        this.updateTrail(time);
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        // Add a slight rotation based on movement for visual effect
        if (this.body.velocity.x !== 0) {
            this.mesh.rotation.z -= this.body.velocity.x * 0.01;
        }
        
        // Anti-flashing stabilization - only allow smooth position changes
        if (this.lastMeshPosition.distanceTo(this.mesh.position) > 1.0) {
            // If there's a large jump, it's likely a teleport/respawn - allow it
            this.lastMeshPosition.copy(this.mesh.position);
        } else if (this.lastMeshPosition.distanceTo(this.mesh.position) < 0.01) {
            // For tiny jitters, use the previous position to prevent flashing
            this.mesh.position.copy(this.lastMeshPosition);
        } else {
            // For normal movement, store the position
            this.lastMeshPosition.copy(this.mesh.position);
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
     * Apply continuous bounce to keep the ball always bouncing
     */
    applyContinuousBounce() {
        // Add constant downward force to simulate proper gravity behavior
        // This is what makes the blue ball come down properly
        if (this.body.velocity.y > 0 && this.body.position.y > 1.5) {
            // Apply progressively stronger downward force the higher we go
            const heightFactor = Math.min(this.body.position.y / 8, 1);
            const gravityMultiplier = 0.3 + (heightFactor * 0.4);
            this.body.velocity.y -= gravityMultiplier;
        }
        
        // Detect if ball is at rest on a surface (true idle state)
        const isIdle = this.isOnGround && Math.abs(this.body.velocity.y) < 0.1 && 
                       Math.abs(this.body.velocity.x) < 0.5;
        
        // Only apply idle bounce if we're truly idle to prevent interfering with natural bounce
        if (isIdle) {
            // Calculate time since last bounce
            const currentTime = performance.now();
            const timeSinceLastBounce = currentTime - this.lastBounceTime;
            
            // Apply Nokia-style continuous small bounce (occurs about once per second)
            if (timeSinceLastBounce > 800) { // 800ms timing matches original Nokia bounce rhythm
                // Apply just enough force for a tiny continuous bounce
                this.body.velocity.y = 1.5;
                
                // Add a tiny random horizontal variance like in the original
                const randomXVariance = (Math.random() - 0.5) * 0.2;
                this.body.velocity.x += randomXVariance;
                
                // Apply subtle visual effect
                this.applyBounceVisualEffect(1.05);
                
                // Record the bounce time
                this.lastBounceTime = currentTime;
            }
        }
    }
    
    /**
     * Use raycasting to reliably detect ground contact
     */
    checkGroundContact() {
        // Previous ground state for detecting landing moments
        const wasOnGround = this.isOnGround;
        
        // Create a raycast from slightly above the ball's center downward
        const start = new CANNON.Vec3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        
        const end = new CANNON.Vec3(
            this.body.position.x,
            this.body.position.y - this.radius - 0.05, // Shorter raycast for more conservative detection
            this.body.position.z
        );
        
        // Perform the raycast
        const result = new CANNON.RaycastResult();
        this.physicsWorld.world.raycastClosest(start, end, {}, result);
        
        // If hit something, we're on the ground
        if (result.hasHit) {
            this.isOnGround = true;
            
            // If we just landed and have significant downward velocity, bounce!
            if (!wasOnGround && this.body.velocity.y < -2) {
                this.bounce();
            }
            
            // Zero out very small vertical velocity to prevent micro-bounces
            if (Math.abs(this.body.velocity.y) < 0.5) {
                this.body.velocity.y = 0;
            }
        } else {
            // Only consider not on ground if we've actually moved away from it
            if (this.body.velocity.y < -0.5) {
                this.isOnGround = false;
            }
        }
    }
    
    /**
     * Handle bounce physics and effects
     */
    bounce() {
        // Get current velocity for bounce strength calculation
        const impactVelocity = -this.body.velocity.y;
        
        // Apply Nokia-style bounce effect with predictable physics
        if (impactVelocity > 2) {
            // Calculate bounce factor based on impact velocity
            // Higher impacts will have lower restitution for better control
            let bounceFactor = 0.4; // Default Nokia-like moderate bounce
            
            if (impactVelocity > 10) {
                bounceFactor = 0.3;  // Reduce bounce for very high impacts (better control)
            } else if (impactVelocity < 5) {
                bounceFactor = 0.5;  // More bounce for gentle impacts
            }
            
            // Apply bounce impulse with a cap for predictability
            const bounceVelocity = Math.min(impactVelocity * bounceFactor, 8);
            this.body.velocity.y = bounceVelocity;
            
            // Scale visual effect based on impact (squash and stretch)
            const bounceScale = Math.min(1 + (impactVelocity / 30), 1.25);
            this.applyBounceVisualEffect(bounceScale);
        }
    }
    
    /**
     * Apply a visual squash and stretch effect on bounce
     */
    applyBounceVisualEffect(scale) {
        // Store original scale to restore later
        const originalScale = this.mesh.scale.clone();
        
        // Apply squash effect (flatten vertically, expand horizontally)
        this.mesh.scale.set(
            originalScale.x * scale,
            originalScale.y * (0.8 / scale),
            originalScale.z * scale
        );
        
        // Restore to normal over time
        setTimeout(() => {
            // Create a subtle bounce-back effect
            this.mesh.scale.set(
                originalScale.x * 0.95,
                originalScale.y * 1.05,
                originalScale.z * 0.95
            );
            
            // Then restore original scale
            setTimeout(() => {
                this.mesh.scale.copy(originalScale);
            }, 100);
        }, 100);
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
            
            // Create new body with exact blue ball physics properties
            const perfectBluePhysics = {
                restitution: 0.45,
                friction: 0.25,
                contactEquationStiffness: 2e7,
                contactEquationRelaxation: 5
            };
            
            this.body = this.physicsWorld.createSphere(
                this.largeRadius,
                { x: position.x, y: position.y, z: position.z },
                this.mass * 1.5,
                perfectBluePhysics
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Add key settings from blue ball
            this.body.linearDamping = 0.08;
            this.body.angularDamping = 0.4;
            this.body.fixedRotation = false;
            
            // Register the new body with physics world
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            // Apply special contact materials
            this.setupContactMaterials();
        }
    }
    
    /**
     * Shrink the ball back to normal size
     */
    shrink() {
        if (this.isEnlarged) {
            this.isEnlarged = false;
            
            // Scale the mesh back to normal
            this.mesh.scale.set(1, 1, 1);
            
            // Restore original color
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
            
            // Create new body with exact blue ball physics properties
            const perfectBluePhysics = {
                restitution: 0.45,
                friction: 0.25,
                contactEquationStiffness: 2e7,
                contactEquationRelaxation: 5
            };
            
            this.body = this.physicsWorld.createSphere(
                this.normalRadius,
                { x: position.x, y: position.y, z: position.z },
                this.mass,
                perfectBluePhysics
            );
            
            // Apply previous velocity
            this.body.velocity.copy(velocity);
            this.body.angularVelocity.copy(angularVelocity);
            
            // Add key settings from blue ball
            this.body.linearDamping = 0.08;
            this.body.angularDamping = 0.4;
            this.body.fixedRotation = false;
            
            // Register the new body with physics world
            this.physicsWorld.addObjectToUpdate({
                mesh: this.mesh,
                body: this.body
            });
            
            // Apply special contact materials
            this.setupContactMaterials();
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
            this.mesh.material.emissive.set(0x330000);
            this.trail.material.color.set(0xFF6666);
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
            this.mesh.material.emissive.set(0x330000);
            this.trail.material.color.set(0xFF6666);
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
    
    /**
     * Ensure the ball's physics integrity is maintained
     * This fixes issues where physics properties might be lost during game state changes
     */
    ensurePhysicsIntegrity() {
        // Ensure we always have proper physics
        if (!this.body.linearDamping || this.body.linearDamping < 0.01) {
            this.body.linearDamping = 0.08;
        }
        
        if (!this.body.angularDamping || this.body.angularDamping < 0.01) {
            this.body.angularDamping = 0.4;
        }
        
        // If the ball is stuck or has invalid velocity, reset it
        if (isNaN(this.body.velocity.x) || isNaN(this.body.velocity.y) || isNaN(this.body.velocity.z)) {
            console.log("Fixed invalid ball velocity");
            this.body.velocity.set(0, 0, 0);
        }
        
        // If the ball somehow gets displaced very far away, reset it to last checkpoint
        if (Math.abs(this.body.position.x) > 100 || Math.abs(this.body.position.y) > 100 || Math.abs(this.body.position.z) > 100) {
            console.log("Ball out of bounds, resetting to checkpoint");
            this.respawn();
        }
    }
}
