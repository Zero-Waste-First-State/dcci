# DCCI Branding – Logos and Favicon

## Browser tab icon (favicon)

The app currently uses `app/favicon.ico` (default Next.js/Hack4Impact). To use **ZWFS** or **Be Scrappy**:

1. Replace `app/favicon.ico` with your chosen logo (recommended: 32×32 or 48×48, or multi-size .ico).
2. Optional: add `app/icon.png` (e.g. 32×32 or 48×48) for modern browsers; Next.js will use it automatically.

Use a high-resolution source so the tab icon is sharp (not low-res).

## Home page logos (green header block)

- **Left:** Plastic Free Delaware (PFD) – currently `public/pfd-logo.jpg`. For a transparent background on the green block, replace with `public/pfd-logo.png` (transparent PNG) and update `app/page.tsx` to use `src="/pfd-logo.png"`.
- **Right:** Zero Waste First State (ZWFS) – add `public/zwfs-logo.png` (transparent PNG). The page already references `/zwfs-logo.png`; once the file is in `public/`, it will appear.

Both logos are set to 80×80 in the layout; use transparent PNGs so there is no white box on the green background.

## Footer

The footer link text is **DCCI** (no “X Hack4Impact”). The small “Be Scrappy” image (`public/watermelon.jpg`) is still used next to it; you can swap that for another icon by replacing the file and updating the `alt` text in `app/page.tsx` if needed.
