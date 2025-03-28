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
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                    this.ball.moveLeft(true);
                    break;
                case 'ArrowRight':
                    this.ball.moveRight(true);
                    break;
                case ' ': // Spacebar
                case 'ArrowUp':
                    this.ball.jump();
                    break;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                    this.ball.moveLeft(false);
                    break;
                case 'ArrowRight':
                    this.ball.moveRight(false);
                    break;
            }
        });
        
        // Touch controls - will be implemented in Phase 5
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
        
        // Update physics
        this.physics.update(this.deltaTime);
        
        // Update game objects
        this.ball.update(this.deltaTime);
        this.level.update(this.deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Check game conditions (win, lose, etc.)
        this.checkGameConditions();
        
        // Render the scene
        this.renderer.render();
        
        // Schedule the next frame
        requestAnimationFrame(this.boundGameLoop);
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
        }
        
        // Check for collisions with checkpoints
        const checkpointReached = this.level.checkCheckpointCollisions(this.ball);
        if (checkpointReached) {
            // Set respawn point
            this.ball.setCheckpoint(checkpointReached.position);
        }
        
        // Check for collisions with power-ups
        const powerUp = this.level.checkPowerUpCollisions(this.ball);
        if (powerUp) {
            this.applyPowerUp(powerUp);
            this.addScore(50);
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
        if (this.level.isComplete()) {
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
        switch (powerUp.type) {
            case 'enlarge':
                this.ball.enlarge();
                break;
            case 'shrink':
                this.ball.shrink();
                break;
            case 'speed':
                this.ball.increaseSpeed();
                break;
            case 'antigravity':
                this.ball.enableAntiGravity();
                break;
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
        
        // Move to the next level
        this.currentLevel++;
        this.ui.updateLevel(this.currentLevel);
        
        // Load the next level
        this.level.loadLevel(this.currentLevel);
        
        // Reset the ball at the level's starting position
        this.ball.reset();
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
