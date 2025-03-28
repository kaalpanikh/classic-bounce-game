# Nokia Bounce Game Recreation

A modern web-based recreation of Nokia's classic Bounce game from 2001, using Three.js for 3D rendering and Cannon.js for physics simulation.

## Project Overview

This project aims to recreate the nostalgic Nokia Bounce game with modern web technologies. The original game was a platformer where players controlled a red ball through side-scrolling levels, navigating through hoops while avoiding obstacles like spikes and moving enemies.

## Features

- 3D graphics rendered with Three.js
- Realistic physics simulation using Cannon.js
- Responsive design for both desktop and mobile
- Classic game mechanics:
  - Ball physics (bouncing, rolling)
  - Obstacles and platforms
  - Hoops to collect
  - Lives system
  - Checkpoints
- Power-ups:
  - Enlarge spike (makes ball bigger and blue, floats on water)
  - Shrink spikes (returns ball to original size)
  - Speed box (temporarily increases ball speed)
  - Anti-gravity spike (allows ball to fly)

## Development Phases

### Phase 1: Project Setup and Basic Structure 
- Initialize project with necessary dependencies
- Set up Three.js scene, camera, and renderer
- Create basic HTML/CSS structure

### Phase 2: Physics Implementation
- Set up Cannon.js physics world
- Create the ball with basic physics properties
- Implement simple platform for testing

### Phase 3: Core Game Mechanics
- Implement ball movement controls
- Add collision detection
- Create basic level structure
- Implement lives system and checkpoints

### Phase 4: Game Elements
- Add obstacles (static and moving)
- Implement hoops and level completion logic
- Create water areas with appropriate physics
- Add power-ups with their effects

### Phase 5: UI and Polish
- Design and implement game UI
- Add sound effects
- Create level transitions
- Implement score system
- Add visual effects and polish

## Setup Instructions

1. Clone the repository:
```
git clone https://github.com/yourusername/nokia-bounce-game.git
cd nokia-bounce-game
```

2. Install dependencies:
```
npm install
```

3. Run the development server:
```
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

## Project Structure

- `index.html` - Main HTML file
- `css/style.css` - Styling for the game
- `js/` - JavaScript source files
  - `main.js` - Entry point for the game
  - `game.js` - Main game logic
  - `renderer.js` - Three.js rendering setup
  - `physics.js` - Cannon.js physics implementation
  - `ball.js` - Ball character implementation
  - `level.js` - Level creation and management
  - `ui.js` - User interface handling
- `assets/` - Game assets
  - `models/` - 3D models
  - `textures/` - Texture files
  - `sounds/` - Sound effects

## Deployment

To deploy to GitHub Pages:

```
npm run deploy
```

## Credits

- Original game by Nokia (2001)
- Three.js for 3D rendering
- Cannon.js for physics simulation

## License

MIT