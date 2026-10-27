# Nose Picker (JS)

Browser port of the Windows Phone 8 Silverlight game in `../NosePickerWP8`.
Plain HTML, CSS and ES modules, no build step.

## Run

    npm install
    npm run dev

then open http://localhost:8931/ (Vite also prints a LAN address for testing shake on a phone).

Vite is only an optional local development server. Any static HTTP server can
serve this folder; no build or npm install is needed for hosting.

## GitHub Pages

In Settings → Pages, choose **Deploy from a branch**, then **main** and **/ (root)**.
Commit and push the site files, including `images/`, `audio/`, and `.nojekyll`.
The site is served directly from the repository root with no Vite build:
https://jamesfdickinson.github.io/nose-picker/

## Controls

- Drag on the nose. Moves are read as U, D, L, R. Shake the phone for X / Y.
- Keyboard (desktop testing): arrow keys, `X`, `Y`; Enter or a short pause ends the gesture.
- Menu (top right): free pick, challenge levels, items store, awards, show gestures, reset.

## Layout

- `images/` and `audio/` - static assets served directly from the repository root.
- `js/data.js` - the 81 items and 16 levels, generated from the WP8 XML.
- `js/awards.js` - award definitions and checks.
- `js/state.js` - coins, item counts, level scores, awards; saved to localStorage.
- `js/gesture.js` - pointer / shake / keyboard gesture recognizer.
- `js/animations.js` - item pop-out motion (drop / slide / crawl by item size) and head wobble.
- `js/nose.js` - the face, finger and item animation.
- `js/challenge.js` - mine cart challenge mode.
- `js/ui.js` - top bar, menu drawer, panels.
