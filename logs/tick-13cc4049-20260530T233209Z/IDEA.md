# Canvas Game Idea: Meteor Dodge

A top‑down endless game where the player controls a spaceship on an HTML canvas, dodging incoming meteors that spawn from the edges. The ship can rotate and thrust in any direction. The background scrolls to simulate movement. The game ends (lose) when the ship collides with a meteor or runs out of fuel.

**Core Mechanics**
- Rotate ship with left/right arrows, thrust with up arrow.
- Meteors spawn randomly with increasing speed.
- Fuel depletes over time; collect floating fuel canisters to extend play.
- Score is time survived.

**Lose Condition**
- Collision with any meteor.
- Fuel reaches zero.

The game can be built with plain JavaScript, using `requestAnimationFrame` for the canvas loop.
