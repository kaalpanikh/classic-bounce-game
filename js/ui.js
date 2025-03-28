/**
 * Handles all UI-related functionality
 */
class UI {
    constructor() {
        // UI element references
        this.livesElement = null;
        this.scoreElement = null;
        this.levelElement = null;
        this.finalScoreElement = null;
        this.gameOverScreen = null;
        this.loadingScreen = null;
        this.progressBar = null;
        this.loadingText = null;
        this.notificationContainer = null;
        
        // Initialize UI elements
        this.init();
    }
    
    /**
     * Initialize UI elements
     */
    init() {
        // Get existing UI elements
        this.livesElement = document.getElementById('lives-count');
        this.scoreElement = document.getElementById('score-count');
        this.levelElement = document.getElementById('level-count');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-bar');
        this.loadingText = document.getElementById('loading-text');
        
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.id = 'notification-container';
            this.notificationContainer.className = 'notification-container';
            document.body.appendChild(this.notificationContainer);
            
            // Add CSS for notifications
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    pointer-events: none;
                }
                
                .notification {
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    margin-bottom: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                    transform: scale(0);
                    transition: transform 0.2s ease-out;
                    pointer-events: none;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }
                
                .notification.show {
                    transform: scale(1);
                }
                
                .notification.success {
                    background-color: rgba(40, 167, 69, 0.8);
                }
                
                .notification.warning {
                    background-color: rgba(255, 193, 7, 0.8);
                }
                
                .notification.error {
                    background-color: rgba(220, 53, 69, 0.8);
                }
                
                .notification.info {
                    background-color: rgba(23, 162, 184, 0.8);
                }
                
                .notification.power-up {
                    background-color: rgba(111, 66, 193, 0.8);
                }
                
                /* Level complete screen */
                .level-complete {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .level-complete.show {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .level-complete-content {
                    background-color: rgba(0, 0, 0, 0.8);
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                    border: 2px solid #ffd700;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                    max-width: 400px;
                }
                
                .level-complete h2 {
                    color: #ffd700;
                    font-size: 32px;
                    margin-bottom: 20px;
                }
                
                .level-complete p {
                    font-size: 20px;
                    margin: 15px 0;
                }
                
                /* Pause screen */
                .pause-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .pause-content {
                    background-color: rgba(0, 0, 0, 0.8);
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                    border: 2px solid #3498db;
                    box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
                }
                
                .pause-content h2 {
                    color: #3498db;
                    font-size: 32px;
                    margin-bottom: 20px;
                }
            `;
            document.head.appendChild(style);
        } else {
            this.notificationContainer = document.getElementById('notification-container');
        }
    }
    
    /**
     * Update the lives display
     * @param {number} lives - Current number of lives
     */
    updateLives(lives) {
        if (this.livesElement) {
            this.livesElement.textContent = lives;
        }
    }
    
    /**
     * Update the score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
            
            // Add animation effect for score updates
            this.scoreElement.classList.add('score-updated');
            setTimeout(() => {
                this.scoreElement.classList.remove('score-updated');
            }, 300);
        }
    }
    
    /**
     * Update the level display
     * @param {number} level - Current level
     */
    updateLevel(level) {
        if (this.levelElement) {
            this.levelElement.textContent = level;
        }
    }
    
    /**
     * Show game over screen
     * @param {number} finalScore - Final score to display
     */
    showGameOver(finalScore) {
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = finalScore;
        }
        
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.remove('hidden');
        }
    }
    
    /**
     * Hide game over screen
     */
    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.add('hidden');
        }
    }
    
    /**
     * Show level completion message
     * @param {number} level - Completed level number
     * @param {number} score - Current score
     */
    showLevelComplete(level, score) {
        // Check if level complete screen already exists
        let levelComplete = document.getElementById('level-complete');
        
        if (!levelComplete) {
            // Create level complete screen
            levelComplete = document.createElement('div');
            levelComplete.id = 'level-complete';
            levelComplete.className = 'level-complete';
            
            // Add content
            levelComplete.innerHTML = `
                <div class="level-complete-content">
                    <h2>Level ${level} Complete!</h2>
                    <p>Score: ${score}</p>
                    <p>+1000 Bonus Points!</p>
                    <p>Get Ready for Level ${level + 1}...</p>
                </div>
            `;
            
            document.body.appendChild(levelComplete);
        } else {
            // Update existing level complete screen content
            levelComplete.innerHTML = `
                <div class="level-complete-content">
                    <h2>Level ${level} Complete!</h2>
                    <p>Score: ${score}</p>
                    <p>+1000 Bonus Points!</p>
                    <p>Get Ready for Level ${level + 1}...</p>
                </div>
            `;
        }
        
        // Show the level complete screen
        setTimeout(() => {
            levelComplete.classList.add('show');
        }, 10);
        
        // Hide after delay
        setTimeout(() => {
            levelComplete.classList.remove('show');
            setTimeout(() => {
                levelComplete.remove();
            }, 300);
        }, 2000);
    }
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, warning, error, info, power-up)
     * @param {number} duration - How long to show the notification in ms
     */
    showNotification(message, type = 'info', duration = 2000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to container
        this.notificationContainer.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 200);
        }, duration);
    }
    
    /**
     * Update loading progress
     * @param {number} progress - Progress value between 0 and 1
     * @param {string} message - Optional message to display
     */
    updateLoadingProgress(progress, message = null) {
        if (this.progressBar) {
            this.progressBar.style.width = `${progress * 100}%`;
        }
        
        if (this.loadingText && message) {
            this.loadingText.textContent = message;
        } else if (this.loadingText) {
            this.loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Message type ('info', 'success', 'warning', 'error')
     * @param {number} duration - How long to show the message in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${type}`;
        notificationEl.textContent = message;
        
        // Add to the DOM
        document.body.appendChild(notificationEl);
        
        // Animate in
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notificationEl.classList.remove('show');
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.parentNode.removeChild(notificationEl);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Update power-up indicator
     * @param {string} type - Power-up type
     * @param {boolean} active - Whether the power-up is active
     * @param {number} timeLeft - Time left in seconds (if applicable)
     */
    updatePowerUpIndicator(type, active, timeLeft = null) {
        let indicatorId = `power-up-${type}`;
        let indicator = document.getElementById(indicatorId);
        
        // Create indicator if it doesn't exist
        if (!indicator && active) {
            indicator = document.createElement('div');
            indicator.id = indicatorId;
            indicator.className = 'power-up-indicator';
            
            let icon = '';
            let label = '';
            
            switch (type) {
                case 'enlarge':
                    icon = '↑';
                    label = 'Enlarged';
                    break;
                case 'shrink':
                    icon = '↓';
                    label = 'Normal';
                    break;
                case 'speed':
                    icon = '→';
                    label = 'Speed';
                    break;
                case 'antigravity':
                    icon = '↗';
                    label = 'Anti-gravity';
                    break;
            }
            
            indicator.innerHTML = `
                <span class="power-up-icon">${icon}</span>
                <span class="power-up-label">${label}</span>
                ${timeLeft ? `<span class="power-up-timer">${timeLeft}s</span>` : ''}
            `;
            
            // Add to UI
            const gameUI = document.getElementById('game-ui');
            if (gameUI) {
                gameUI.appendChild(indicator);
            }
        }
        
        // Update existing indicator
        if (indicator) {
            if (active) {
                indicator.classList.add('active');
                
                // Update timer if provided
                if (timeLeft !== null) {
                    const timerEl = indicator.querySelector('.power-up-timer');
                    if (timerEl) {
                        timerEl.textContent = `${Math.ceil(timeLeft)}s`;
                    }
                }
            } else {
                // Remove indicator if power-up is no longer active
                indicator.classList.add('fade-out');
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
        }
    }
}
