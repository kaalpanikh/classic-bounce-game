// Main entry point for the game

// Create and start the game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing game...');
    
    try {
        // Create game instance
        const game = new Game();
        
        // Initialize game components
        await game.init();
        
        // Track key states for movement
        const keyState = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Add direct keyboard control - manipulate position directly
        window.addEventListener('keydown', function(event) {
            console.log('Ultra-direct keydown:', event.key);
            
            if (!game.ball || !game.ball.mesh) return;
            
            switch(event.key) {
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    keyState.left = true;
                    keyState.right = false;
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    keyState.left = false;
                    keyState.right = true;
                    break;
                case 'w':
                case 'W':
                case 'ArrowUp':
                    keyState.up = true;
                    break;
                case 's':
                case 'S':
                case 'ArrowDown':
                    keyState.down = true;
                    break;
                case ' ':
                    // Force jump regardless of ground status
                    keyState.up = true;
                    break;
                // P key pause/resume is now handled in index.html
            }
        });
        
        window.addEventListener('keyup', function(event) {
            console.log('Ultra-direct keyup:', event.key);
            
            switch(event.key) {
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    keyState.left = false;
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    keyState.right = false;
                    break;
                case 'w':
                case 'W':
                case 'ArrowUp':
                case ' ':
                    keyState.up = false;
                    break;
                case 's':
                case 'S':
                case 'ArrowDown':
                    keyState.down = false;
                    break;
            }
        });
        
        // Create a direct update loop that bypasses physics entirely if needed
        function directUpdate() {
            if (game.ball && game.ball.mesh) {
                // Only process movement if the game is not paused
                if (!game.gamePaused) {
                    // Apply movement based on key state
                    if (keyState.left) {
                        // Direct position change for immediate movement
                        game.ball.mesh.position.x -= 0.1;
                        if (game.ball.body) {
                            game.ball.body.position.x = game.ball.mesh.position.x;
                            game.ball.body.velocity.x = -8;
                        }
                    }
                    else if (keyState.right) {
                        // Direct position change for immediate movement
                        game.ball.mesh.position.x += 0.1;
                        if (game.ball.body) {
                            game.ball.body.position.x = game.ball.mesh.position.x;
                            game.ball.body.velocity.x = 8;
                        }
                    }
                    
                    // Handle up movement (jump)
                    if (keyState.up) {
                        // Direct position change for jump - ignore ground check for now
                        game.ball.mesh.position.y += 0.15;
                        if (game.ball.body) {
                            game.ball.body.position.y = game.ball.mesh.position.y;
                            game.ball.body.velocity.y = 5; // Less aggressive upward velocity
                        }
                    }
                    
                    // Handle down movement
                    if (keyState.down) {
                        // Direct position change for down movement
                        game.ball.mesh.position.y -= 0.1;
                        if (game.ball.body) {
                            game.ball.body.position.y = game.ball.mesh.position.y;
                            game.ball.body.velocity.y = -5;
                        }
                    }
                }
            }
            
            // Continue the loop
            requestAnimationFrame(directUpdate);
        }
        
        // Start our direct update loop
        directUpdate();
        
        // Start the game
        game.start();
        
        // Hide loading screen
        game.ui.hideLoadingScreen();
        
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        document.getElementById('loading-text').textContent = 'Error loading game: ' + error.message;
    }
});

// Handle window resize events
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.onWindowResize();
    }
});
