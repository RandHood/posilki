# Posiłki

Meal suggestions, meal prep and shopping lists for stores in Poland and Iceland.
Works as a Home Screen app on iPhone.

## Files

- `index.html`: the app
- `meals.json`: the meal catalog (meals, their ingredients, and new ingredients with macros per 100 g and typical products)
- `sw.js`: lets the app open offline and pick up updates
- `manifest.webmanifest`, `*.png`: app name and Home Screen icons

## Updating

1. Replace the changed files in this repository.
2. Bump `VERSION` in `sw.js` (the app version is shown in Settings).
3. GitHub Pages publishes within about a minute. The app picks it up the next time it's opened online.

## Meal catalog

`meals.json` holds every meal. Each meal lists ingredients as `[ingredient key, grams per portion]`, using keys from `index.html` or from the catalog's own `ingredients` section. Calories and macros are worked out by the app, never stored. `tags` add hand-picked categories (`sweet`, `soup`, `nocook`, `mealprep`, `polish`, `icelandic`, `spicy`); high protein, low calorie, low carb, quick, vegetarian, vegan and fish are worked out from the numbers. Bump `updated` when the file changes so phones pick it up.

Saved data lives on each phone and is never stored in this repository.
