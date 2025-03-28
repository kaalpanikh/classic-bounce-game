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
            checkpointReached: false
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
        
        // Track key states
        this.keyStates = {
            left: false,
            right: false,
            jump: false
        };
        
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            console.log('Key pressed:', event.key);
            
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keyStates.left = true;
                    if (!this.gamePaused) this.ball.moveLeft(true);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keyStates.right = true;
                    if (!this.gamePaused) this.ball.moveRight(true);
                    break;
                case ' ': // Spacebar
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keyStates.jump = true;
                    if (!this.gamePaused) this.ball.jump();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    if (event.ctrlKey) {
                        this.restart();
                    }
                    break;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            console.log('Key released:', event.key);
            
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keyStates.left = false;
                    if (!this.gamePaused) this.ball.moveLeft(false);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keyStates.right = false;
                    if (!this.gamePaused) this.ball.moveRight(false);
                    break;
                case ' ': // Spacebar
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.keyStates.jump = false;
                    break;
            }
        });
        
        // Handle window blur event (user switches tabs/apps)
        window.addEventListener('blur', () => {
            // Reset all key states when window loses focus
            this.keyStates.left = false;
            this.keyStates.right = false;
            this.keyStates.jump = false;
            
            // Stop all movement
            this.ball.moveLeft(false);
            this.ball.moveRight(false);
        });
        
        // Mobile touch controls
        const gameCanvas = document.getElementById('game-canvas');
        
        // Add touch controls container
        const touchControlsContainer = document.createElement('div');
        touchControlsContainer.id = 'touch-controls';
        touchControlsContainer.className = 'touch-controls';
        document.body.appendChild(touchControlsContainer);
        
        // Add touch buttons
        const leftButton = document.createElement('button');
        leftButton.className = 'touch-button left-button';
        leftButton.innerHTML = '&larr;';
        touchControlsContainer.appendChild(leftButton);
        
        const rightButton = document.createElement('button');
        rightButton.className = 'touch-button right-button';
        rightButton.innerHTML = '&rarr;';
        touchControlsContainer.appendChild(rightButton);
        
        const jumpButton = document.createElement('button');
        jumpButton.className = 'touch-button jump-button';
        jumpButton.innerHTML = '&uarr;';
        touchControlsContainer.appendChild(jumpButton);
        
        // Touch button event listeners
        leftButton.addEventListener('touchstart', () => {
            if (!this.gamePaused) this.ball.moveLeft(true);
        });
        
        leftButton.addEventListener('touchend', () => {
            if (!this.gamePaused) this.ball.moveLeft(false);
        });
        
        rightButton.addEventListener('touchstart', () => {
            if (!this.gamePaused) this.ball.moveRight(true);
        });
        
        rightButton.addEventListener('touchend', () => {
            if (!this.gamePaused) this.ball.moveRight(false);
        });
        
        jumpButton.addEventListener('touchstart', () => {
            if (!this.gamePaused) this.ball.jump();
        });
        
        // Add CSS for touch controls
        const style = document.createElement('style');
        style.textContent = `
            .touch-controls {
                position: fixed;
                bottom: 30px;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: space-between;
                padding: 0 20px;
                pointer-events: none;
                z-index: 1000;
            }
            
            .touch-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.5);
                color: white;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            
            .touch-button:active {
                background-color: rgba(255, 255, 255, 0.5);
            }
            
            .left-button, .right-button {
                margin-top: 20px;
            }
            
            /* Hide touch controls on desktop */
            @media (min-width: 768px) {
                .touch-controls {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Toggle pause state - DEPRECATED, now handled by external pause system
     * This method is kept for backward compatibility but will not be used
     */
    togglePause() {
        console.log('Original togglePause called - now deprecated');
        // This function is intentionally empty as we're using the new pause system
        // Don't remove this method as other code might reference it
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.clock.start();
            requestAnimationFrame(this.boundGameLoop);
            console.log('Game started');
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        this.isRunning = false;
        this.clock.stop();
        console.log('Game paused');
    }
    
    /**
     * Restart the game
     */
    restart() {
        this.lives = 3;
        this.score = 0;
        this.currentLevel = 1;
        
        // Update UI
        this.ui.updateLives(this.lives);
        this.ui.updateScore(this.score);
        this.ui.updateLevel(this.currentLevel);
        
        // Reset ball and level
        this.ball.reset();
        this.level.loadLevel(this.currentLevel);
        
        // Resume the game if it's paused
        if (this.gamePaused) {
            this.togglePause();
        }
        
        // Restart the game if it's not running
        if (!this.isRunning) {
            this.start();
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
        requestAnimationFrame(this.boundGameLoop);
    }
    
    /**
     * Process direct controls for immediate responsiveness
     */
    processDirectControls() {
        // Apply movement directly based on key states
        if (this.keyStates.left) {
            // Direct ball position change for instant visual feedback
            const currentPosition = this.ball.mesh.position.clone();
            this.ball.mesh.position.set(currentPosition.x - 0.1, currentPosition.y, currentPosition.z);
            
            // Also set physics velocity
            const currentVel = this.ball.body.velocity;
            this.ball.body.velocity.set(-8, currentVel.y, currentVel.z);
        } 
        else if (this.keyStates.right) {
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
