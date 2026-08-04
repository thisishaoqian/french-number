# Écoute les nombres — French Numbers Listening Game

A tiny browser game for practising French numbers by ear. Each game is
**10 rounds against the clock**: it speaks a random number aloud in French, you
type what you heard, and at the end you get a results screen with your score out
of 10 and your time. Supports both **France** and **Switzerland** number systems.

No build step, no dependencies, no server — just static HTML/CSS/JS, ready for
GitHub Pages.

## How to play

1. Choose your options:
   - **Variant** — 🇫🇷 France (`soixante-dix`, `quatre-vingts`, `quatre-vingt-dix`)
     or 🇨🇭 Suisse (`septante`, `huitante`, `nonante`).
   - **Answer mode** — *Digits* (type `72`) or *French words* (type `septante-deux`).
   - **Range** — `0–9`, `0–99`, `0–999`, or `0–9999`.
2. Press **Start game**. The timer begins and you play **10 rounds**.
3. Each round: listen, then type your answer and press **Check** (or <kbd>Enter</kbd>).
   Press the big button (or <kbd>Space</kbd>) to **Replay** the number, and **Reveal**
   if you're stuck. Then **Next** moves on.
4. After round 10 you get a **results screen**: how many you got right out of 10,
   your total time and average per round, a recap of every number, and **Play again**.

Words-mode grading is lenient about capitals, accents, hyphens, and spaces —
`quatre-vingt-un`, `Quatre vingt un`, and `QUATRE-VINGT-UN` all count.

### Settings

- **Speech speed** — slow the voice down while you're learning.
- **Voice** — pick a specific French voice, or leave it on automatic.

## A note on audio

The game uses your browser's built-in speech synthesis (the Web Speech API).
Audio must be started by a tap/click (browser rule), which is why there's a
Play button. If your device has a Swiss (`fr-CH`) voice it's used automatically
in Suisse mode; otherwise a standard French voice reads the Swiss words
correctly, since it's simply pronouncing `septante`, `huitante`, `nonante`.
The correct spelling is always revealed after each answer, so the game still
works even with no French voice installed.

Best supported in Chrome, Edge, and Safari.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `french-number`).
2. Put these files in the repository root and push:

   ```bash
   git init
   git add .
   git commit -m "French numbers listening game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/french-number.git
   git push -u origin main
   ```

3. On GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*,
   choose branch **main** and folder **/ (root)**, then **Save**.
5. Wait a minute; your game will be live at:

   ```
   https://<your-username>.github.io/french-number/
   ```

That's it — any future `git push` to `main` redeploys automatically.

## Files

| File            | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| `index.html`    | Page structure and controls                                    |
| `style.css`     | Styling (dark theme, responsive)                               |
| `app.js`        | Game logic, speech, scoring, timed mode                       |
| `numbers-fr.js` | `numberToFrench(n, variant)` + answer normalizer               |
| `test-numbers.js` | Node self-tests for the number logic (`node test-numbers.js`) |

## Developing / testing the number logic

```bash
node test-numbers.js
```

Covers the French/Swiss 70s–90s, hundreds/thousands pluralisation
(`deux cents` vs `deux cent un`), and the answer normalizer.
