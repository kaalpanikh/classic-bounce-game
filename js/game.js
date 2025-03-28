/**
 * Main Game class that coordinates all game components
 */
class Game {
    constructor() {
        // Game state
        this.isRunning = false;
        this.lives = 3;
        this.score = 0;
        this.currentLevel = 1;
        
        // Game components will be initialized in the init method
        this.renderer = null;
        this.physics = null;
        this.ball = null;
        this.level = null;
        this.ui = null;
        
        // Time tracking for game loop
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        
        // Physics settings
        this.physicsTimeStep = 1/60; // Fixed physics time step (60 updates per second)
        this.maxSubSteps = 5; // Maximum physics sub-steps per frame
        
        // Game settings
        this.debugMode = false; // Set to true to show debug information
        this.gamePaused = false;
        
        // Event flags
        this.eventFlags = {
            levelComplete: false,
            powerUpCollected: false,
            checkpointReached: false,
            groundContact: false
        };
        
        // Store a reference to the game loop function with the correct 'this' binding
        this.boundGameLoop = this.gameLoop.bind(this);
        
        // Store the game instance in window for global access (mainly for resize events)
        window.game = this;
    }
    
    /**
     * Initialize all game components
     * @returns {Promise} - Resolves when initialization is complete
     */
    async init() {
        try {
            // Create progress updater for loading screen
            const updateProgress = (progress) => {
                const progressBar = document.getElementById('progress-bar');
                const loadingText = document.getElementById('loading-text');
                progressBar.style.width = `${progress * 100}%`;
                loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
            };
            
            // Initialize UI
            this.ui = new UI();
            this.ui.updateLives(this.lives);
            this.ui.updateScore(this.score);
            this.ui.updateLevel(this.currentLevel);
            
            // Initialize game components
            updateProgress(0.2);
            
            // Initialize renderer (Three.js)
            this.renderer = new Renderer();
            await this.renderer.init();
            updateProgress(0.4);
            
            // Initialize physics (Cannon.js)
            this.physics = new Physics();
            this.physics.init();
            updateProgress(0.6);
            
            // Initialize player ball
            this.ball = new Ball(this.renderer.scene, this.physics);
            await this.ball.init();
            updateProgress(0.8);
            
            // Initialize level
            this.level = new Level(this.currentLevel, this.renderer.scene, this.physics);
            await this.level.init();
            updateProgress(1.0);
            
            // Set up event listeners for controls
            this.setupControls();
            
            console.log('Game initialization complete');
            return true;
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }
    
    /**
     * Set up keyboard and touch controls
     */
    setupControls() {
        console.log('Setting up controls...');
        
        // Track key states - allow direct access to this object from outside
        this.keyState = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            console.log('Key pressed:', event.key);
            
            if (this.gamePaused) return; // Don't process keys when paused
            
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keyState.left = true;
                    this.ball.moveLeft(true);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keyState.right = true;
                    this.ball.moveRight(true);
                    break;
                case ' ': // Spacebar
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keyState.up = true;
                    this.ball.jump();
                    break;
                // P key pause handling now in HTML
            }
        });
        
        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keyState.left = false;
                    this.ball.moveLeft(false);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keyState.right = false;
                    this.ball.moveRight(false);
                    break;
                case ' ': // Spacebar
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keyState.up = false;
                    break;
            }
        });
        
        // Handle window blur event (user switches tabs/apps)
        window.addEventListener('blur', () => {
            // Reset all key states when window loses focus
            this.keyState.left = false;
            this.keyState.right = false;
            this.keyState.up = false;
            this.keyState.down = false;
            
            // Stop all movement
            this.ball.moveLeft(false);
            this.ball.moveRight(false);
        });
        
        // Mobile touch controls have been removed to resolve duplication issues
        // If mobile support is needed in the future, implement it here in a clean way
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (!this.gamePaused) {
            console.log('Pausing game...');
            this.gamePaused = true;
            // Stop the game loop
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            // Reset all key states
            this.keyState = {
                left: false,
                right: false,
                up: false,
                down: false
            };
        }
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.gamePaused) {
            console.log('Resuming game...');
            this.gamePaused = false;
            // Restart the game loop
            this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.gamePaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    /**
     * Restart the game
     */
    restart() {
        console.log('Restarting game...');
        
        // Reset game state
        this.lives = 3;
        this.score = 0;
        this.currentLevel = 1;
        this.isRunning = true;
        this.gamePaused = false;
        
        // Update UI and hide game over screen
        this.ui.updateLives(this.lives);
        this.ui.updateScore(this.score);
        this.ui.updateLevel(this.currentLevel);
        
        // Make sure game over screen is hidden
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
        }
        
        // Stop any existing animation frame to prevent duplicates
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset physics world to ensure clean state
        if (this.physics && this.physics.world) {
            this.physics.world.gravity.set(0, -9.82, 0);
        }
        
        // Reset ball position and state with a small delay to ensure physics is ready
        setTimeout(() => {
            if (this.ball) {
                this.ball.reset();
                
                // Ensure the ball has natural gravity
                if (this.ball.body) {
                    // Apply initial downward velocity to prevent floating
                    this.ball.body.velocity.set(0, -0.5, 0);
                }
            }
            
            // Reset level
            if (this.level) {
                this.level.loadLevel(this.currentLevel);
            }
        }, 100);
        
        // Reset key states
        this.keyState = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Restart the game loop immediately
        this.clock.start();
        this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.clock.start();
            this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
            console.log('Game started');
        }
    }
    
    /**
     * Game loop - runs every frame
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Calculate delta time for physics and animations
        this.deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap at 0.1 to prevent large jumps
        this.elapsedTime += this.deltaTime;
        
        if (!this.gamePaused) {
            // Direct control for better response when physics might be off
            this.processDirectControls();
            
            // Update physics with fixed timestep for stability
            this.physics.update(this.deltaTime);
            
            // Update game objects
            this.ball.update(this.deltaTime);
            this.level.update(this.deltaTime);
            
            // Check for collisions
            this.checkCollisions();
            
            // Check game conditions (win, lose, etc.)
            this.checkGameConditions();
            
            // Update camera to follow ball with velocity-based look-ahead
            this.renderer.updateCamera(this.ball.position, this.ball.body.velocity);
        }
        
        // Render the scene (always render even when paused)
        this.renderer.render();
        
        // Schedule the next frame
        this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
    }
    
    /**
     * Process direct controls for immediate responsiveness
     */
    processDirectControls() {
        // Apply movement directly based on key states
        if (this.keyState.left) {
            // Direct ball position change for instant visual feedback
            const currentPosition = this.ball.mesh.position.clone();
            this.ball.mesh.position.set(currentPosition.x - 0.1, currentPosition.y, currentPosition.z);
            
            // Also set physics velocity
            const currentVel = this.ball.body.velocity;
            this.ball.body.velocity.set(-8, currentVel.y, currentVel.z);
        } 
        else if (this.keyState.right) {
            // Direct ball position change for instant visual feedback
            const currentPosition = this.ball.mesh.position.clone();
            this.ball.mesh.position.set(currentPosition.x + 0.1, currentPosition.y, currentPosition.z);
            
            // Also set physics velocity
            const currentVel = this.ball.body.velocity;
            this.ball.body.velocity.set(8, currentVel.y, currentVel.z);
        } 
        else {
            // Stop horizontal movement when no keys are pressed
            const currentVel = this.ball.body.velocity;
            this.ball.body.velocity.set(0, currentVel.y, currentVel.z);
        }
    }
    
    /**
     * Check for collisions between the ball and game objects
     */
    checkCollisions() {
        // Check for collisions with obstacles
        const hitObstacle = this.level.checkObstacleCollisions(this.ball);
        if (hitObstacle) {
            this.loseLife();
        }
        
        // Check for collisions with hoops
        const hoopCollected = this.level.checkHoopCollisions(this.ball);
        if (hoopCollected) {
            this.addScore(100);
            this.ui.showNotification('+100 Points', 'success', 1000);
            
            // Play sound effect (to be implemented)
            // this.audio.playSound('hoop_collect');
        }
        
        // Check for collisions with checkpoints
        const checkpointReached = this.level.checkCheckpointCollisions(this.ball);
        if (checkpointReached && !this.eventFlags.checkpointReached) {
            // Set respawn point
            this.ball.setCheckpoint(checkpointReached.position);
            this.ui.showNotification('Checkpoint Reached!', 'info', 1500);
            this.eventFlags.checkpointReached = true;
            this.addScore(50);
            
            // Reset the flag after a delay to prevent multiple notifications
            setTimeout(() => {
                this.eventFlags.checkpointReached = false;
            }, 1000);
        }
        
        // Check for collisions with power-ups
        const powerUp = this.level.checkPowerUpCollisions(this.ball);
        if (powerUp && !this.eventFlags.powerUpCollected) {
            this.applyPowerUp(powerUp);
            this.addScore(50);
            this.eventFlags.powerUpCollected = true;
            
            // Reset the flag after a delay to prevent multiple notifications
            setTimeout(() => {
                this.eventFlags.powerUpCollected = false;
            }, 500);
        }
        
        // Check if ball has fallen out of bounds
        if (this.ball.position.y < -10) {
            this.loseLife();
        }
        
        // NEW: Check if ball is touching the green ground (not on a platform)
        this.checkGroundContact();
    }
    
    /**
     * Check if the ball is touching the green ground
     */
    checkGroundContact() {
        // If we've recently lost a life due to ground contact, don't check again yet
        if (this.eventFlags.groundContact) {
            return;
        }
        
        // If the ball is below a certain height and not on any platform, it's touching the ground
        // Use a small negative value to account for slight platform positioning variations
        if (this.ball.position.y < 0.2 && this.ball.position.y > -1) {
            const onPlatform = this.level.platforms.some(platform => {
                // Check if ball is above this platform with expanded tolerance
                const ballX = this.ball.position.x;
                const ballZ = this.ball.position.z;
                
                // Add extra margin to platform boundaries for more generous collision detection
                const margin = this.ball.radius * 0.8;
                const platformMinX = platform.position.x - platform.size.x / 2 - margin;
                const platformMaxX = platform.position.x + platform.size.x / 2 + margin;
                const platformMinZ = platform.position.z - platform.size.z / 2 - margin;
                const platformMaxZ = platform.position.z + platform.size.z / 2 + margin;
                
                // Vertical position check - ball should be near the top of the platform
                const platformTopY = platform.position.y + platform.size.y / 2;
                const ballBottomY = this.ball.position.y - this.ball.radius;
                const verticalProximity = Math.abs(platformTopY - ballBottomY);
                
                return (
                    ballX >= platformMinX && 
                    ballX <= platformMaxX && 
                    ballZ >= platformMinZ && 
                    ballZ <= platformMaxZ &&
                    verticalProximity < 0.5  // Ball must be near the top surface
                );
            });
            
            if (!onPlatform) {
                // Ball is touching the green ground
                this.loseLife();
                
                // Apply a stronger bounce to escape the ground
                this.ball.body.velocity.y = 10;
                
                // Show notification
                this.ui.showNotification('Deadly green surface!', 'warning', 1000);
                
                // Set flag to prevent multiple life losses in rapid succession
                this.eventFlags.groundContact = true;
                setTimeout(() => {
                    this.eventFlags.groundContact = false;
                }, 2000);
            }
        }
    }
    
    /**
     * Check game conditions like level completion, game over, etc.
     */
    checkGameConditions() {
        // Check if level is complete (all hoops collected)
        if (this.level.isComplete() && !this.eventFlags.levelComplete) {
            this.eventFlags.levelComplete = true;
            this.completeLevel();
        }
        
        // Check if game is over (no lives left)
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * Apply power-up effects to the ball
     * @param {Object} powerUp - The power-up to apply
     */
    applyPowerUp(powerUp) {
        let message = '';
        
        switch (powerUp.type) {
            case 'enlarge':
                this.ball.enlarge();
                message = 'Enlarged Ball!';
                break;
            case 'shrink':
                this.ball.shrink();
                message = 'Normal Size';
                break;
            case 'speed':
                this.ball.increaseSpeed();
                message = 'Speed Boost!';
                break;
            case 'antigravity':
                this.ball.enableAntiGravity();
                message = 'Anti-Gravity!';
                break;
        }
        
        if (message) {
            this.ui.showNotification(message, 'power-up', 2000);
        }
    }
    
    /**
     * Add points to the score
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.score += points;
        this.ui.updateScore(this.score);
    }
    
    /**
     * Lose a life and respawn the ball
     */
    loseLife() {
        this.lives--;
        this.ui.updateLives(this.lives);
        
        if (this.lives > 0) {
            // Add screen shake effect
            this.renderer.cameraShake(0.5, 0.5);
            
            // Show notification
            this.ui.showNotification('Life Lost!', 'warning', 1500);
            
            // Respawn the ball at the last checkpoint
            this.ball.respawn();
        } else {
            // Game over when no more lives
            this.gameOver();
        }
    }
    
    /**
     * Complete the current level and move to the next
     */
    completeLevel() {
        // Add bonus points for completing the level
        this.addScore(1000);
        
        // Show level complete message
        this.ui.showLevelComplete(this.currentLevel, this.score);
        
        // Short pause before loading next level
        this.gamePaused = true;
        setTimeout(() => {
            // Move to the next level
            this.currentLevel++;
            this.ui.updateLevel(this.currentLevel);
            
            // Load the next level
            this.level.loadLevel(this.currentLevel);
            
            // Reset the ball at the level's starting position
            this.ball.reset();
            
            // Resume the game
            this.gamePaused = false;
            this.eventFlags.levelComplete = false;
        }, 2000);
    }
    
    /**
     * End the game
     */
    gameOver() {
        this.isRunning = false;
        
        // Show game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        finalScore.textContent = this.score;
        gameOverScreen.classList.remove('hidden');
        
        console.log('Game over');
    }
    
    /**
     * Handle window resize event
     */
    onWindowResize() {
        if (this.renderer) {
            this.renderer.onWindowResize();
        }
    }
}
