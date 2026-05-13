## Concept
The player taps repeatedly to build up a charge on a glowing dot, then releases a single tap to fire a forward burst that leaps over the upcoming obstacles. A short cooldown follows, forcing the player to time each jump for maximum impact.

## Player
A small, neon‑glowing dot represents the player, moving along a forward‑scrolling lane. Its core actions are:
- **Charge** – repeated taps increase a visual charge meter.
- **Burst** – a tap after charging launches the dot forward in a powerful jump.
- **Cooldown** – after bursting, the dot must wait briefly before charging again.

## Core loop
Every few seconds the player watches obstacles approach, taps to fill the charge meter, and then taps again to release a burst that vaults over the next set of hazards. After the burst, a brief cooldown prevents immediate re‑charging, so the player must decide when to build charge again. This cycle of watching, charging, bursting, and cooling repeats continuously.

## Hazards / Obstacles
- **Static spikes** – fixed blocks that kill on contact.
- **Sweeping walls** – horizontal barriers that slide across the lane, telegraphed by a brief glow.
- **Rotating blades** – circular hazards that spin in place, cutting any uncharged dot that passes through.
- **Moving clusters** – groups of small obstacles that travel together, creating tighter gaps that require precise bursts to clear.
All hazards move toward the player (or the player moves forward) and must be avoided unless jumped over during a burst.

## Score
Score increases each time a burst successfully clears one or more obstacles, rewarding the player for timing a jump over a hazard. Bonus points are awarded for clearing a cluster of obstacles in a single burst or for surviving a wave without taking damage.

## Win and lose
- **Lose:** The player collides with any hazard while not in a burst, triggering a Game Over overlay with the final score and restart instructions.
- **Win:** After surviving a predefined number of obstacle waves (or traveling a set distance), the game displays a "You Win!" screen with a celebratory visual effect and the final score.

## Feel
The game feels fast‑paced and rhythmic, with a neon‑on‑dark aesthetic: glowing dots, sharp hazard silhouettes, and pulsating background gradients. Audio adds crisp beeps for each charge tap, a deep synth whoosh for each burst, and a sharp glitch tone on collision. The experience is frantic yet rewarding, encouraging players to sync their taps with the obstacle flow.

## Why it's fun
The addictive thrill comes from building tension with each tap and then experiencing the satisfying, momentary flight over a wall of danger.
