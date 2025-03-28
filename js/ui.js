/**
 * Handles all UI-related functionality
 */
class UI {
    constructor() {
        // UI element references
        this.livesElement = document.getElementById('lives-count');
        this.scoreElement = document.getElementById('score-count');
        this.levelElement = document.getElementById('level-count');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-bar');
        this.loadingText = document.getElementById('loading-text');
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
        // Create and show a temporary level complete message
        const levelCompleteEl = document.createElement('div');
        levelCompleteEl.className = 'level-complete-notification';
        levelCompleteEl.innerHTML = `
            <h2>Level ${level} Complete!</h2>
            <p>Score: ${score}</p>
        `;
        
        document.body.appendChild(levelCompleteEl);
        
        // Remove after animation
        setTimeout(() => {
            if (levelCompleteEl.parentNode) {
                levelCompleteEl.parentNode.removeChild(levelCompleteEl);
            }
        }, 2000);
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
