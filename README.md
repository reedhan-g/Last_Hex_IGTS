# Last Hex

A 21-hex triangular strategy game with automatic numbers, six scoring variations, and four opponents: Rookie, Pro, Final Boss, and Player 2.

## Run locally

1. Extract the ZIP completely.
2. Open a terminal in the extracted `last-hex` folder (the folder containing `dist`).
3. Start a local server:

   Windows with Python installed:
   ```sh
   py -m http.server 8000 --bind 127.0.0.1 --directory dist
   ```

   macOS / Linux with Python 3 installed:
   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
   ```
4. Open http://localhost:8000 in your browser. Stop the server with Ctrl+C.

Use a local HTTP server rather than double-clicking index.html; JavaScript modules and background workers need an HTTP origin. No npm install, build step, API key, or model download is required. Google Fonts is optional; the game uses fallback fonts if unavailable.

The local server only serves files; it is not a game backend. Once published, players simply open the website link. They do not need Python, CMD, or a local server.

## Files

- `dist/index.html`: game page and controls.
- `dist/style.css`: all visual styling and responsive layouts.
- `dist/app.mjs`: game UI, turns, undo, and the last five results.
- `dist/engine.mjs`: board geometry, scoring, and computer opponents.
- `dist/strategy-worker.mjs`: background move search.
- `dist/docs.html`: online field guide.
- `dist/README.md`: field guide in Markdown.
- `dist/Last-Hex-Guide.docx`: downloadable Word field guide.
- `tests.mjs`: game engine tests.
- `results.test.mjs`: results and persistence tests.
- `interaction.test.mjs`: reset confirmation and two-tap interaction tests.
- `scripts/build_guide.py`: optional guide generator; needs Python and python-docx only if you want to regenerate the documentation.

## Check the code

With Node.js installed, run from the extracted root:

```sh
node tests.mjs
node results.test.mjs
node interaction.test.mjs
```

To regenerate all three guide formats after editing the generator:

```sh
python3 -m pip install python-docx
python3 scripts/build_guide.py
```

## Publish elsewhere

Upload the contents of `dist` to any static host that serves JavaScript modules with a JavaScript MIME type. Keep the relative file layout intact. The downloaded project does not include the original host's access controls or hosting credentials. Configure access on your chosen host if needed.

### GitHub Pages

1. Create a GitHub repository and upload the **contents** of `dist` to its root, including `.nojekyll`, `LICENSE`, and `THIRD_PARTY_NOTICES.md`.
2. In Settings → Pages, choose Deploy from a branch, then your main branch and `/ (root)`.
3. Open the Pages URL once deployment completes. No backend or build step is required.

Alternatively, keep this full project structure on a static host such as Vercel: use the Other framework preset, leave the build command empty, and set the output directory to `dist`.

Results are stored in the current browser under `last-hex-results-v1` using localStorage. Only the last five finished games are retained; the active round resets on reload. Different domains and browsers have separate results. If browser storage is blocked, results remain available in memory for that page session.

## Placement and restart controls

Tap twice to place starts enabled on touch devices and can be toggled above the board. First tap selects and previews; a second tap on the same hex places the number, without a time limit. A different hex replaces the selection. The preference is saved locally.

New game and changes to opponent or rules ask before discarding an unfinished round with moves. Keep playing preserves the game; Discard round resets it. Finished results remain saved.

## Credits

Last Hex is a browser adaptation by **David**, featuring additional rule variations, computer opponents, and local two-player play.

The core game is inspired by **Black Hole**, a pen-and-paper game by **Walter Joris**. See [Ben Orlin’s description of the original game](https://mathwithbaddrawings.com/2020/04/22/six-strategic-games-from-a-strange-and-bottomless-mind/).

## Reusing this project

You’re welcome to use, modify, and share this project under the MIT License. When copying or distributing the code or substantial portions of it, retain the copyright notice and MIT license text.

If you publish a game based on this project, a visible credit in your README, About page, or game credits would be appreciated:

> Based on Last Hex by David.

Please also link to the repository you obtained this project from. This visible credit and link are requests, not additional license requirements.

## License

This project's original code is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 David

Third-party components and assets remain subject to their respective licenses. See [third-party notices](dist/THIRD_PARTY_NOTICES.md). The license does not claim exclusive ownership of the underlying game rules.
