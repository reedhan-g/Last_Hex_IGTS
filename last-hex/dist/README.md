# Last Hex Webpage Guide

Last Hex is a numbered strategy game on a triangle of 21 hexagons. Players choose spaces while the game assigns their numbers automatically. This guide explains the turn sequence, six scoring variations, computer opponents, and source code for the updated game.

## Play a numbered round

- The board has six rows containing 1, 2, 3, 4, 5, and 6 hexagons. Teal starts, followed by Coral.

- Click or tap any empty hexagon. The sequence is Teal 1, Coral 1, Teal 2, Coral 2, continuing through Teal 10 and Coral 10. You never select a number.

- After twenty moves, each player owns ten tiles numbered 1 through 10. The twenty-first hexagon stays empty. More points around that final empty hex means you lose. Equal scores produce a draw.

Large numbers on occupied hexagons are their placed values. Empty hexagons show a + sign. Position IDs appear in the pressure inspector and results. The NEXT NUMBER strip shows the next automatic number. Classic scoring adds the values on edge-sharing neighbors of the final empty hex.

For example, if Teal has an adjacent 8 and Coral has an adjacent 10, the final score is Teal 8 to Coral 10: Coral loses. Unrelated tiles do not contribute.

## Controls and opponents

Choose Player 2, Rookie, Pro, or Final Boss. Player 2 is shared-device play. In every solo mode, you play Teal and the computer plays Coral. All three computer levels run locally without model downloads or API keys.

Hover or keyboard-focus an empty hex to inspect its current surrounding pressure. This shows current points, not a guaranteed final score. Undo removes one move in local play, or the latest pair of moves in solo play. It restores the automatic number as well as the space.

New game, an opponent change, or a rule change asks for confirmation if the current round has moves and is not finished. Keep playing preserves the round; Discard round starts over. Empty and completed rounds restart immediately. Reloading resets the current round. The last five completed games are saved on this device, newest first, with both final scores and the winner or draw. Undoing a finished round removes its result until it is completed again.

Tap twice to place is enabled initially on touch devices and can be toggled above the board. The first tap highlights a hex and previews both scores. Tap the same hex again to place, with no time limit. Tapping another hex changes the selection. The setting is remembered on this device; disabling it restores single-tap placement.

## Six scoring variations

All modes use the same triangle, alternating players, and automatic 1 through 10 sequence. Only the final scoring changes. More points always loses, and equal scores always draw.

### Classic

Add the printed numbers on hexagons sharing an edge with the last empty hex. A placed 7 contributes 7 points.

### High stakes

Five randomly selected spaces show ×2. If a marked tile borders the final empty hex, double its placed number. A 7 on ×2 contributes 14 points. The five marked positions are reshuffled for each new round; the placed numbers still follow the normal sequence.

### Ripple

Numbers one hex step from the final empty hex count twice. Numbers exactly two hex steps away count once. A neighboring 7 contributes 14 points; a 7 in the next ring contributes 7.

### Odd trouble

Only edge-sharing neighbors count. Odd printed numbers count twice; even printed numbers count normally. A neighboring 7 contributes 14 points, while an 8 contributes 8.

### Outer ring

Ignore immediate neighbors. Only numbers exactly two hex steps from the final empty hex count. Each contributes its printed value.

### Safety net

Add each player’s edge-sharing numbers, then subtract that player’s single highest adjacent value. With adjacent values 2, 5, and 9, the score becomes 7. With only one adjacent tile, that player scores zero.

## Distance and previews

Hex steps are measured on the hexagonal lattice using axial coordinates. One step means a shared edge. The triangle only contains the displayed cells; there is no wrapping between sides. The pressure inspector and final result both use the selected scoring mode, including multipliers and Safety net deductions.

## Four ways to play

The opponent menu now prioritizes low storage and memory use. The downloaded Hugging Face language model and its inference runtime have been removed. The game uses compact JavaScript algorithms; no model weights are downloaded, loaded into memory, or needed for any difficulty.

### Player 2

Two people take turns on one device. Teal starts and Coral follows. This is local pass-and-play; it does not create an online multiplayer room.

### Rookie

Chooses uniformly at random from the legal empty spaces. It does not look ahead. Use it for learning the rules or a relaxed round.

### Pro

Estimates early moves using 80 random game completions per candidate. Once five spaces remain, it searches every continuation with alpha-beta pruning: the last four placements are solved exactly. Earlier decisions are estimates.

### Final Boss

Uses adversarial Monte Carlo tree search to explore both players’ replies. Each early turn is capped at 16,000 simulations, 6,000 tree nodes, and a target of 1.2 seconds of search. Nodes store moves and statistics rather than copies of the whole board. Once eight spaces remain, it solves the last seven placements exactly.

This is the most demanding search setting, not a guarantee of unbeatable play. Early moves still use sampling, and the time limit means faster devices can examine more possibilities. The exact endgame is small enough to search without storing a large tree.

## Storage and responsiveness

All levels share the same small game engine. Final Boss uses more temporary CPU and memory than Pro, but neither needs neural-network weights. Search runs in a module worker which is terminated after each move, releasing its search state. New game or changing opponents cancels pending work.

If a worker fails or exceeds five seconds, a smaller Pro search supplies a legal move. No external inference service receives the board. Ordinary page and optional font requests still occur.

A model cached by an older version may remain in browser storage. This update does not silently delete previous cache data. To reclaim that old download, clear this site’s stored data in your browser settings. That also removes the saved five-game results.

## Run and modify the source

This is a buildless HTML, CSS, and JavaScript site. From its source root, run python3 -m http.server 8000 --directory dist, then open http://localhost:8000. Use HTTP rather than opening index.html directly, because browser modules and workers need a server origin. No npm installation is required.

- dist/index.html and dist/style.css: controls, triangle layout, responsive styles, and the rules dialog.

- dist/engine.mjs: triangle coordinates, legal turns, automatic numbers, scoring, bonuses, random simulations, and endgame search.

- dist/app.mjs: board rendering, turn state, recent results, undo, previews, and worker coordination.

- dist/strategy-worker.mjs: background strategy computation.

- dist/docs.html, dist/README.md, and dist/Last-Hex-Guide.docx: documentation.

- tests.mjs: rule and search validation; run node tests.mjs.

- results.test.mjs and interaction.test.mjs: recent results, reset confirmation, and untimed two-tap checks; run each with node.

Board ownership, placed values, and positional bonuses are separate arrays. place() enforces alternating turns and assigns floor(occupied cells / 2) + 1. pressure() is the scoring source of truth. To add a variant, add its entry in MODES and scoring behavior, then create fixtures for its results. All three computer levels use the same scoring function and obey the active variation.

## Requirements and troubleshooting

Use a modern browser with JavaScript, ES modules, and module workers. There is no WebAssembly, WebGPU, Transformers.js, or Hugging Face requirement. Google Fonts is optional and has local font fallbacks.

Numbers reset when you start a new round. There are no online rooms, accounts, or cloud saves inside the game; access on a deployed copy depends on your hosting settings.

## Validation

Automated checks cover six triangular rows, alternating sequential values, legal moves, all six scoring modes, 300 full rounds, 36 independent endgame comparisons, and six strategy games. Additional checks exercise all three computer levels across all six modes, confirm search-node limits and unchanged input arrays, and compare both search tiers against an independent exhaustive endgame oracle. Results tests check final totals, the five-game limit, undo, and reload persistence.

## Publishing and credits

### Open the game locally or online

Double-clicking index.html uses a file URL, which browsers restrict for JavaScript modules and workers. A local HTTP server serves the files at localhost; it is not a game backend. On Windows, from the extracted project folder, run py -m http.server 8000 --bind 127.0.0.1 --directory dist. On macOS or Linux use python3 in place of py. Open http://localhost:8000 and stop the server with Ctrl+C.

Once hosted, players only need the website link. They do not need Python, CMD, a local server, an account inside the game, or an API key.

### GitHub Pages or Vercel

For GitHub Pages, upload the contents of dist to the repository root, including .nojekyll, LICENSE, and THIRD_PARTY_NOTICES.md. In Settings, open Pages, choose Deploy from a branch, and select the main branch and root folder. Keep all relative file paths unchanged.

For Vercel, keep the complete project folder, choose the Other framework preset, use no build command, and set dist as the output directory. Both hosts can serve this game as a static frontend. A backend is only needed if you later add features such as online multiplayer, accounts, or cloud saves.

## Credits and reuse

Last Hex is a browser adaptation by David, featuring additional rule variations, computer opponents, and local two-player play. The core game is inspired by Black Hole, a pen-and-paper game by Walter Joris, described by Ben Orlin at Math with Bad Drawings.

The original project code is licensed under the MIT License. Copyright (c) 2026 David. Include the full LICENSE file when distributing the code or substantial portions of it. A matching copy is included in dist for static hosting. The license does not claim exclusive ownership of the underlying game rules.

A visible credit is appreciated: Based on Last Hex by David. Please also link to the source repository you obtained this project from. Visible credit and backlinks are optional requests under MIT; retaining the copyright and license notices is required.

DM Sans and Space Grotesk are requested through Google Fonts under the SIL Open Font License 1.1. Their binaries are not bundled here. If you self-host the fonts, include their copyright and license notices. See THIRD_PARTY_NOTICES.md for links.

References: MIT license at https://opensource.org/license/mit and original game description at https://mathwithbaddrawings.com/2020/04/22/six-strategic-games-from-a-strange-and-bottomless-mind/.
