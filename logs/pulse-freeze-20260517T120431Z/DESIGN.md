## Concept
The player is a small dot that can move freely and tap to create a brief temporal field that freezes all nearby obstacles, letting them slip through dense clusters before the field cools down.

## Player
A bright dot, visually a simple neon circle. The player can move in any direction (up, down, left, right) and activate a temporal field with a tap/click. Verbs: move, activate field.

## Core loop
Obstacles continuously spawn and travel across the screen. Each frame the player sees the flow of hazards, decides where to steer, and times the field activation to pause a tight group of obstacles, slipping through the gap. After each use the field enters cooldown, forcing the player to plan the next safe passage. The loop repeats: navigate → anticipate → field → survive → repeat.

## Hazards / Obstacles
- **Sweeping bars** that slide horizontally or vertically, reversing direction after reaching the edge. They act as moving walls that can crush the player.
- **Oscillating spikes** that swing back and forth on a fixed axis, creating rhythmic timing challenges.
- **Rotating blades** that spin around a center point, sweeping a circular area.
- **Static mines** that pulse and expand, becoming lethal when their radius touches the player.
Each hazard moves independently and can overlap, creating dense clusters that require the field to navigate.

## Score
Score increments each time the player successfully passes a hazard cluster without collision, and extra points are awarded for each successful field activation that lets the player escape a dense group. Collecting occasional glowing pickups that appear in safe zones also adds points.

## Win and lose
The player loses immediately upon colliding with any active hazard. The player wins by surviving a final wave of extremely dense obstacles after the field has cooled, signalling mastery of timing and navigation. When the game ends, a “Game Over” or “You Win!” overlay appears with the final score and a prompt to restart.

## Feel
Fast‑paced and tense, with neon‑bright visual cues against a dark background. The field flash gives a brief moment of stillness, then the world rushes back, creating a rhythm of frantic movement punctuated by short pauses. Audio consists of crisp, synth stabs for taps and subtle hums for hazards.

## Why it's fun
The thrill of timing a single, powerful pause to slip through an impossible‑looking wall makes the player feel like a time‑bending hero at every successful escape.
