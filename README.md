# WHITEOUT — Alpine Freeride

A browser-based 3D snowboarding game built with Three.js and Vite. It runs on desktop and mobile browsers and can be deployed to GitHub Pages.

## Play

- **A / D** or **← / →** — carve left and right
- **W / ↑** — tuck for a faster aerodynamic line
- **S / ↓** — brake and scrub speed
- **Space** — ollie / jump
- **Q / E** — spin while airborne
- **P / Esc** — pause
- **R** — restart the run

On touch screens, use the on-screen carve, brake, and ollie controls.

## Game systems

- Procedural rolling alpine terrain with slope- and elevation-tinted snow
- Instanced mountain forest and shoulder rocks for a broad playable world
- Directional sunlight, soft shadows, atmospheric distance fog, and a layered mountain skyline
- Slope-driven gravity, carving edge pressure, speed-dependent drag, braking, tuck, airborne spin, and landing checks
- Snow spray, windblown snowfall, board tracks, session scoring, and a chase camera with speed response

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

Vite writes the production site to `dist/`.

## GitHub Pages

Keep `.github/workflows/main.yml` in the repository. The workflow installs dependencies, runs the Vite build, and deploys `dist/` to GitHub Pages. The workflow file is required for automatic deployment.
