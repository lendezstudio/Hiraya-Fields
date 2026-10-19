# Hiraya Fields: website concept (Modern Villa Gallery)

A static, single-page prospect concept with no build step. It is ready for GitHub Pages because all asset paths are relative.

## Preview
Open `index.html` in a browser, or serve the folder:
`python -m http.server` (or any static server), then visit http://localhost:8000.

## Structure
- `index.html`: page markup, copy, image focal points (`--pd` desktop / `--pt` tablet / `--pm` phone)
- `assets/css/styles.css`: design system, layout, animation, reduced-motion rules
- `assets/js/main.js`: slideshow, reveals, gallery masonry/filter/lightbox, FAQ, inquiry message builder
- `assets/img/`: optimized derivatives (640 px and ≤1200 px). Originals stay untouched in `Initial Images/`.
- `assets/brand/`: logo sizes, favicon (from the "HF" monogram), share image. The original `Logo.jpg` is unchanged.

## Before launch
- Make `og:image` / `twitter:image` absolute URLs and add a canonical URL once the domain is confirmed.
- Confirm the monitored inquiry channel. The form opens a pre-filled email to hirayafields@gmail.com.
- Excluded photos: two images carrying a third-party "Tara Trip Tayo" watermark, and the night before/after composite.
