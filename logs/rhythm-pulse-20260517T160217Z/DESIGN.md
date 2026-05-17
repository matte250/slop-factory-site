## Concept
One or two sentences in your own words. What does the player do, and why is it satisfying?

The player guides a continuously advancing dot by tapping to emit expanding pulses. By timing pulses to the beat, obstacles are briefly pushed aside, creating fleeting safe gaps that reward rhythmic precision.

## Player
Describe what the player controls — the avatar, ship, cursor, paddle, whatever it is. Visually, what is it (one sentence)? List its verbs (move, jump, shoot, place, type). Keep it abstract — no coordinates, no speeds.

The player controls a glowing dot that moves forward automatically along a single track. The only verb is **pulse** – a tap or key press that launches an outward wave.

## Core loop
What happens every 1–3 seconds of normal play. Be specific about the moment-to-moment experience: what's the player reading, what are they choosing between, what makes them lean forward.

A beat cue (visual and/or audio) repeats roughly every 1–2 seconds. Obstacles continuously spawn ahead of the dot and travel toward it. The player watches the approaching pattern, decides whether a pulse is needed, and taps on the beat. The pulse expands, pushes nearby obstacles aside for a short window, then the dot proceeds. The cycle repeats, with the rhythm speeding up over time.

## Hazards / Obstacles
What stands in the player's way. Describe each kind by behavior and threat — "fast horizontal sweepers that telegraph their path", "stationary blocks that explode when shot". Concepts and behaviors, not numbers.

- **Static barriers** – solid blocks that sit in the path; colliding with one ends the game.
- **Lateral sweepers** – obstacles that slide horizontally across the track, crossing the dot’s lane; they must be displaced by a pulse or avoided.
- **Spikes** – tiny pointy obstacles that cannot be moved by a pulse; any contact causes immediate loss.
- **Pulseable blocks** – regular obstacles that are pushed outward by a pulse, staying displaced for a brief moment before returning.

## Score
What discrete events increase the score. Examples: "survived a wave", "collected a pickup", "killed an enemy at long range". Avoid score = elapsed time as the only mechanic.

- Surviving an obstacle (either by pulse displacement or by passing untouched).
- Launching a pulse within a tight timing window around the beat cue.
- Maintaining a combo of consecutive on‑beat pulses (adds a bonus per streak).

## Win and lose
When does the player win? When do they lose? What happens on screen the moment it ends.

- **Lose**: Collision with any obstacle triggers a “Game Over” overlay showing the final score and a prompt to restart.
- **Win**: Surviving a pre‑defined number of beats (e.g., the length of a song) or reaching a target score displays a celebratory “You Win!” screen with the final tally.

## Feel
The vibe. Pace (frantic / steady / meditative). Aesthetic direction (neon / pastel / monochrome / retro CRT). Sound character (chiptune / arcade beeps / silent). One short paragraph.

The game feels fast‑paced and rhythmic, with a steady electronic beat driving the action. Neon‑bright pulses and obstacles cut against a dark backdrop, creating a cyber‑pulse aesthetic. Simple synth blips accompany each beat and pulse, giving immediate audio feedback for every successful tap.

## Why it's fun
One sentence. The single moment that would make a player smile, curse, or shout. What is this game's hook?

Landing a tap exactly on the beat to unleash a wave that shoves obstacles away, watching the ripple clear a path, delivers a crisp, satisfying “hit” that feels both visual and rhythmic.
