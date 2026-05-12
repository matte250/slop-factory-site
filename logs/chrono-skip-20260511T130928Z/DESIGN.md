## Concept
The player pilots a lone dot moving through an endless scrolling tunnel. By tapping, they create a brief time‑slip that instantly jumps the dot forward a set distance while the tunnel continues to scroll, forcing strategic timing due to a cooldown.

## Player
A glowing dot representing the player’s presence in the tunnel. Its only controllable action is **time‑slip** (activate the forward jump). The dot otherwise drifts forward at the tunnel’s base speed.

## Core loop
Each frame the tunnel scrolls forward, presenting a stream of obstacles. The player watches the approaching patterns, decides whether to wait for a safe gap or trigger a time‑slip, and then taps to instantly advance the dot. After a slip the cooldown blocks further slips for a short interval, during which the player must rely on the tunnel’s base speed and any lateral dodges to survive. This cycle repeats continuously.

## Hazards / Obstacles
- **Static spikes:** Fixed points that protrude from the tunnel walls; colliding ends the run.
- **Sweeping blades:** Horizontal bars that move back and forth across the tunnel, their motion is fully telegraphed before sweeping.
- **Pulsing lasers:** Short bursts that fire at regular intervals, creating temporary gaps.
- **Rotating barriers:** Rings that rotate around the tunnel axis, the safe opening rotates and can be timed with a slip.
- **Moving shards:** Small projectiles that travel perpendicular to the tunnel flow, requiring precise slip timing to bypass.

## Score
- Each obstacle successfully passed without collision adds a point.
- Every successful time‑slip that clears at least one obstacle awards a bonus point.
- Collecting rare “chronon” pickups that appear in the tunnel grants extra points.

## Win and lose
The player loses when the dot contacts any hazard, triggering a Game Over overlay with the final score and restart prompt. The player wins by surviving until a predefined distance (or time) is reached, at which point a Victory screen celebrates the achievement and offers a restart.

## Feel
A high‑tempo, reflex‑driven experience with a neon‑glow aesthetic. The tunnel glows in rhythmic pulses, the dot flashes each time‑slip, and the soundtrack builds tension with sharp synth stabs. The pace accelerates as the run progresses, rewarding precise timing.

## Why it's fun
The thrill of pulling off a perfectly‑timed time‑slip to evade an imminent hazard makes the player feel a burst of control and satisfaction.
