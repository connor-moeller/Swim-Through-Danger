# Swim Through Danger - Build Log

## 2026-08-27
- Created an isolated browser game project in `swim-through-danger/`.
- Chose a dependency-free HTML canvas implementation for instant local play.
- Added the visual direction: deep teal water, coral orange hazards, goldfish protagonist, monospace dive-log HUD.
- Implemented the game loop with procedural water, bubbles, seafloor plants, coral gates, and rival fish.
- Added Arrow Up / Arrow Down movement with soft swimming physics.
- Added distance scoring, persistent best score, escalating current speed, pause with Space, and restart state.
- Added responsive layout and start/game-over overlays.
- Added top and bottom coral reef borders to clearly frame the swim lane.
- Corrected fish collision to use each fish's animated position and a tighter ellipse hit area instead of the old broad bounding box.
- Reduced the player collision radius and preserved a small, intentional margin for coral gate collisions.

## Verification
- Smoke check passed: opened `index.html`, started swimming, steered with Arrow Up and Arrow Down, and confirmed score progression without an immediate false collision.
- Visual check passed: top and bottom coral border shapes render inside the canvas.
- Replaced middle coral gates with compact animated seaweed clusters.
- Restricted seaweed elimination zones to the cluster footprint instead of treating the entire non-gap area as deadly.
- Added post-death record distance messaging and a large `NEW RECORD` announcement for personal bests.
- Verified new-record death state: `NEW RECORD` appears with the achieved distance.
- Verified repeat-death state: the announcement hides while the record distance remains visible.
- Added a first-visit instruction menu with movement and pause controls, remembered in local storage.
- Turned rival fish toward the player and randomized them across five colors.
- Made seaweed bases pointed to match their tapered tops and increased current speed scaling from the start of each run.
- Fixed returning-user onboarding state so acknowledged players see the start panel on later visits.
- Added descending fishing hooks that catch Goldie and drag her to the surface before ending the run.
- Added rare food pickups that grant five seconds of invincibility and speed, with a live HUD countdown and player glow.
- Refined hooks into J-shaped hazards where only the curved bottom tip can catch Goldie.
- Reduced food frequency to one appearance roughly every 18-30 seconds.
- Aligned each fishing line exactly with the vertical stem of its J-shaped hook.
- Added a GitHub Pages workflow to serve `index.html` as the live game site from the `main` branch.
