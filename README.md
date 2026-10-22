# Posiłki

Meal suggestions, meal prep and shopping lists for stores in Poland and Iceland.
Works as a Home Screen app on iPhone.

## Files

- `index.html`: the app
- `sw.js`: lets the app open offline and pick up updates
- `manifest.webmanifest`, `*.png`: app name and Home Screen icons

## Updating

1. Replace the changed files in this repository.
2. Bump `VERSION` in `sw.js` (the app version is shown in Settings).
3. GitHub Pages publishes within about a minute. The app picks it up the next time it's opened online.

Saved data lives on each phone and is never stored in this repository.
