# Nose Picker (JS)

Browser port of the Windows Phone 8 Silverlight game in `../NosePickerWP8`.
Plain HTML, CSS and ES modules, no build step.

## Run

    npm install
    npm run dev

then open http://localhost:8931/ (Vite also prints a LAN address for testing shake on a phone).

`npm run build` writes a static bundle to `dist/` for wrapping in an app;
`npm run preview` serves that bundle.

## Controls

- Drag on the nose. Moves are read as U, D, L, R. Shake the phone for X / Y.
- Keyboard (desktop testing): arrow keys, `X`, `Y`; Enter or a short pause ends the gesture.
- Menu (top right): free pick, challenge levels, items store, awards, show gestures, reset.

## Layout

- `public/` - images and audio, copied as-is by Vite.
- `js/data.js` - the 81 items and 16 levels, generated from the WP8 XML.
- `js/awards.js` - award definitions and checks.
- `js/state.js` - coins, item counts, level scores, awards; saved to localStorage.
- `js/gesture.js` - pointer / shake / keyboard gesture recognizer.
- `js/animations.js` - item pop-out motion (drop / slide / crawl by item size) and head wobble.
- `js/nose.js` - the face, finger and item animation.
- `js/challenge.js` - mine cart challenge mode.
- `js/ui.js` - top bar, menu drawer, panels.
# nose-picker
