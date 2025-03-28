/**
 * Handles all physics simulation using Cannon.js
 */
class Physics {
    constructor() {
        this.world = null;
        this.bodies = [];
        this.timeStep = 1/60; // Fixed time step for physics (60 fps)
        this.objectsToUpdate = [];
    }
    
    /**
     * Initialize the physics world
     */
    init() {
        // Create a new physics world
        this.world = new CANNON.World();
        
        // Set gravity - back to Earth standard for predictable behavior
        this.world.gravity.set(0, -9.82, 0);
        
        // Set up collision detection
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Enable sleeping for better performance
        this.world.allowSleep = true;
        
        // Set solver iterations
        this.world.solver.iterations = 10;
        
        // Add ground plane for basic testing
        this.addGroundPlane();
        
        console.log('Physics world initialized with standard settings');
        return true;
    }
    
    /**
     * Add a ground plane to the physics world
     */
    addGroundPlane() {
        // Create a static ground plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Mass of 0 makes it static
            shape: groundShape
        });
        
        // Rotate the ground plane to be horizontal
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -2, 0);
        
        // Add the ground to the world
        this.world.addBody(groundBody);
        this.bodies.push(groundBody);
    }
    
    /**
     * Create a physics body for a sphere
     * @param {number} radius - Radius of the sphere
     * @param {Object} position - Initial position {x, y, z}
     * @param {number} mass - Mass of the sphere
     * @param {Object} material - Physics material properties
     * @returns {CANNON.Body} - The created physics body
     */
    createSphere(radius, position, mass, material = {}) {
        // Create a sphere shape
        const sphereShape = new CANNON.Sphere(radius);
        
        // Create physics material
        const physicsMaterial = new CANNON.Material();
        
        // Set material properties
        if (material.restitution !== undefined) {
            physicsMaterial.restitution = material.restitution; // Bounciness
        }
        if (material.friction !== undefined) {
            physicsMaterial.friction = material.friction;
        }
        
        // Create the body
        const body = new CANNON.Body({
            mass: mass,
            shape: sphereShape,
            material: physicsMaterial,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        
        // Add linear damping (air resistance)
        body.linearDamping = 0.1;
        body.angularDamping = 0.1;
        
        // Add the body to the world
        this.world.addBody(body);
        this.bodies.push(body);
        
        return body;
    }
    
    /**
     * Create a physics body for a box
     * @param {Object} dimensions - Box dimensions {x, y, z}
     * @param {Object} position - Initial position {x, y, z}
     * @param {number} mass - Mass of the box
     * @param {Object} material - Physics material properties
     * @returns {CANNON.Body} - The created physics body
     */
    createBox(dimensions, position, mass, material = {}) {
        // Create a box shape
        const boxShape = new CANNON.Box(new CANNON.Vec3(
            dimensions.x / 2,
            dimensions.y / 2,
            dimensions.z / 2
        ));
        
        // Create physics material
        const physicsMaterial = new CANNON.Material();
        
        // Set material properties
        if (material.restitution !== undefined) {
            physicsMaterial.restitution = material.restitution;
        }
        if (material.friction !== undefined) {
            physicsMaterial.friction = material.friction;
        }
        
        // Create the body
        const body = new CANNON.Body({
            mass: mass,
            shape: boxShape,
            material: physicsMaterial,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        
        // Add the body to the world
        this.world.addBody(body);
        this.bodies.push(body);
        
        return body;
    }
    
    /**
     * Register an object to be updated by the physics system
     * @param {Object} object - Object with mesh and body properties
     */
    addObjectToUpdate(object) {
        this.objectsToUpdate.push(object);
    }
    
    /**
     * Remove an object from the update list and the physics world
     * @param {Object} object - Object to remove
     */
    removeObject(object) {
        // Remove from update list
        const index = this.objectsToUpdate.indexOf(object);
        if (index !== -1) {
            this.objectsToUpdate.splice(index, 1);
        }
        
        // Remove body from world
        if (object.body && this.world) {
            this.world.removeBody(object.body);
            
            // Remove from bodies array
            const bodyIndex = this.bodies.indexOf(object.body);
            if (bodyIndex !== -1) {
                this.bodies.splice(bodyIndex, 1);
            }
        }
    }
    
    /**
     * Update the physics world
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Step the physics world with correct parameters
        // Parameters: timeStep, deltaTime, maxSubSteps
        this.world.step(1/60, deltaTime, 3);
        
        // Update all registered objects
        this.objectsToUpdate.forEach(object => {
            if (object.body && object.mesh) {
                // Copy the body position to the mesh
                object.mesh.position.copy(object.body.position);
                
                // Copy the body quaternion to the mesh
                object.mesh.quaternion.copy(object.body.quaternion);
                
                // Additional velocity check to prevent objects from going too high
                if (object.body.position.y > 10 && object.body.velocity.y > 0) {
                    // Apply dampening force to objects that are too high
                    object.body.velocity.y *= 0.8;
                }
            }
        });
    }
}
