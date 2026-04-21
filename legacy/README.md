# Velocity & Vision — A Virtual Museum Exhibition

A virtual museum examining four supercars that changed automotive history across four decades.

## Pages

- `index.html` — Homepage / Exhibition entrance
- `countach.html` — Gallery I: Lamborghini Countach (1970s)
- `959.html` — Gallery II: Porsche 959 (1980s)
- `f1.html` — Gallery III: McLaren F1 (1990s)
- `veyron.html` — Gallery IV: Bugatti Veyron (2000s)
- `about.html` — Curatorial notes & annotated bibliography
- `shared.css` — Shared stylesheet for all gallery pages

## Deploying to GitHub Pages

1. Create a new repo at github.com (e.g. `supercar-museum`)
2. Upload all these files to the root of the repo
3. Go to **Settings → Pages**
4. Set Source to **Deploy from a branch**, branch: `main`, folder: `/ (root)`
5. Click Save — your site will be live at `https://[yourusername].github.io/supercar-museum/`

## Adding Car Photos

In each gallery page, find the `img-placeholder` div and replace it with:

```html
<img src="images/[carname].jpg" alt="[Description]" style="width:100%; aspect-ratio:16/9; object-fit:cover; margin: 2rem 0;">
```

Then add your images to an `images/` folder in the repo.

## Course Info

History [Course Number] · University of Tennessee, Knoxville · Spring 2026
