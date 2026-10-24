# WHITEOUT — Arcade Snowboarding

A browser-based 3D snowboarding game built with Three.js and Vite. This is an upgraded arcade-focused build with a stylized alpine course, instanced forest and rocks, a rebuilt rider, slope-projected acceleration, carve/edge response, braking/tuck, ollies, aerial spins, landing scoring, snow puffs, tracks, chase camera, responsive HUD, and touch controls.

## Controls
- **A / D** or **← / →** — carve left / right
- **W / ↑** — tuck for more speed
- **S / ↓** — brake
- **Space** — ollie / jump (requires some speed)
- **Q / E** — rotate while airborne
- **P / Esc** — pause
- **R** — restart run
- On touch screens, use the on-screen left/right, brake and ollie buttons.

## Publish with GitHub Pages (no local Node install needed)
1. Upload the contents of this folder into the root of your GitHub repository (not the ZIP file itself).
2. Ensure `.github/workflows/deploy.yml` is present.
3. In **Settings → Pages**, set the source to **GitHub Actions**.
4. Commit to `main`; the included workflow installs dependencies on GitHub's runner, builds the site, and deploys `dist`.

The project uses a Vite base of `./` so it can be hosted under a repository subpath. The public site updates after the GitHub Actions deployment succeeds.

## Local development (optional)
Requires Node.js 20+:
```bash
npm install
npm run dev
```

## Notes
This is an arcade-style browser game, not a professional snow/board dynamics simulator. Performance is prioritized through instanced scenery, capped pixel ratio, pooled particles, and a fixed physics timestep. The art is procedural and stylized; no external game assets are required.
