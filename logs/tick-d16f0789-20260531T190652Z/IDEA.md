# Game Idea: Orbit Escape

- **Genre**: Arcade / Endless runner
- **Core mechanic**: Player pilots a spaceship at the center of an HTML canvas while asteroids rotate around in orbit.
- **Goal**: Dodge incoming asteroids and collect floating fuel pickups to keep moving.
- **Lose condition**: Collision with any asteroid **or** running out of fuel ends the game.

The idea is simple to implement with canvas drawing, basic physics for rotation, and keyboard controls for thrust. The game loop can handle spawning asteroids, rotating them, and checking collisions.