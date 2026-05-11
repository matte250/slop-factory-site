## Concept
The player guides an auto‑advancing dot through a three‑lane tunnel, tapping to rotate the dot to the next lane (top→middle→bottom→top) as obstacles with lane‑specific gaps rush forward. Precise timing and pattern recognition make each pass feel rewarding.

## Player
- Avatar: a single neon dot that constantly moves forward down the tunnel.
- Controls: a tap or click (or key press) cycles the dot to the next lane in a fixed order.
- No other actions; the player only changes lanes.

## Core loop
1. The tunnel scrolls forward, bringing a new obstacle toward the dot every 1–3 seconds.
2. The player watches the upcoming obstacle’s gap layout.
3. Within the brief window before the obstacle reaches the dot, the player decides to stay or tap to shift lanes.
4. If the dot aligns with the gap, it passes safely; otherwise a collision ends the run.
5. The cycle repeats, with obstacle speed and gap patterns gradually becoming more challenging.

## Hazards / Obstacles
- **Lane‑gap walls** – solid barriers that fill two of the three lanes, leaving a single lane open. Their gap position changes each obstacle, forcing a lane change or hold.
- **Multi‑wall sequences** – short runs of consecutive walls where the open lane shifts unpredictably, testing rapid decision‑making.
- Optional visual flare: brief “spike” segments that briefly appear in a lane before the wall, adding visual telegraphing.

## Score
- Earn one point each time the dot safely traverses a wall’s gap.
- Bonus points may be awarded for streaks of consecutive passes without a lane change, encouraging risk‑taking.

## Win and lose
- **Lose:** Colliding with any solid part of a wall triggers a game‑over state, displaying the final score and a restart prompt.
- **Win:** After clearing a predetermined number of walls (e.g., 30) the game declares victory, showing a celebratory overlay and the final score.

## Feel
Fast‑paced, reflex‑driven arcade action with a sleek neon‑on‑dark aesthetic. The tunnel pulses with subtle gradients while the dot’s movement feels immediate. Simple chiptune blips accompany lane switches and successful passes, creating a rhythmic loop of tension and release.

## Why it's fun
The single‑tap lane‑cycle mechanic turns every obstacle into a quick, high‑stakes decision, delivering a satisfying “just‑in‑time” thrill with each near‑miss.
