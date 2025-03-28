/**
 * Main entry point for the Nokia Bounce game
 */
// Wait for DOM to load before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new Game();
    
    // Initialize the game
    game.init().then(() => {
        // Hide loading screen when initialization is complete
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'none';
        
        // Start the game loop
        game.start();
    }).catch(error => {
        console.error('Game initialization failed:', error);
        alert('Failed to initialize the game. Please check the console for details.');
    });
    
    // Add event listener for the restart button
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', () => {
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.add('hidden');
        game.restart();
    });
});

// Handle window resize events
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.onWindowResize();
    }
});
