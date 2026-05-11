## Concept
The player taps to cycle a constantly‑moving dot through a set of colors, timing each change so the dot matches the color of upcoming obstacles and can pass safely. The satisfaction comes from the rhythmic “right‑on‑time” moments when a color shift lets the dot glide through a barrier.

## Player
The avatar is a simple colored dot that travels forward automatically. The player’s only control is a tap (or click) that cycles the dot to the next color in its preset sequence. **Verb:** changeColor (triggered by tap). The dot’s movement is continuous; the player does not direct its position.

## Core loop
1. An obstacle appears ahead, its color shown clearly.  
2. The player watches the dot approach and decides whether the current color will match.  
3. If a mismatch is imminent, the player taps to cycle the dot’s color.  
4. The dot reaches the obstacle; if colors match it passes, otherwise the game ends.  
5. Successful passes add to the score and present the next obstacle, typically within 1–3 seconds.

## Hazards / Obstacles
* **Static color barriers** – stationary blocks that block the path unless the dot’s color matches.  
* **Rotating color arms** – bars that spin around a pivot, each segment painted a different color; the dot must slip through the segment that matches its current hue.  
* **Sweeping color sweeps** – horizontal or vertical bars that move across the screen, colored solidly; timing a color change avoids collision.  
* **Color‑gated doors** – openings that open only for a specific color and close for others, requiring precise tapping.  
* **Multi‑color patterns** – composite obstacles composed of several colored sub‑parts that the player must navigate by switching colors multiple times in quick succession.

## Score
* **Pass** – each obstacle cleared awards points.  
* **Combo** – consecutive passes without a miss grant a multiplier.  
* **Color orb collection** – occasional floating orbs of matching color give bonus points.  
* **Streak milestones** – reaching a set number of cleared obstacles yields a bonus reward.

## Win and lose
* **Lose** – colliding with an obstacle whose color does not match the dot’s current color ends the game, accompanied by a visual “shatter” effect and a sound cue.  
* **Win** – completing a predefined sequence of obstacles (e.g., a level of 30 barriers) or surviving a timed wave triggers a celebratory animation, a final score tally, and a “next level” prompt.

## Feel
The game feels fast‑paced yet rhythmic, with neon‑glow visuals and a synth‑wave soundtrack that pulses with each tap. Colors are vivid and contrast sharply against a dark background, giving a sleek, arcade‑style aesthetic. Sound effects are crisp, melodic blips that reinforce successful color matches and stark buzzes for failures.

## Why it's fun
The thrill of perfectly timing a color change to slip through a looming barrier creates a quick, repeatable “aha!” moment that makes players grin, gasp, and strive for higher combos.