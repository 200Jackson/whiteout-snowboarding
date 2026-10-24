# WHITEOUT — Arcade Snowboarding

A browser-based 3D snowboarding game built with Three.js and Vite. This revision brings the chase camera closer to the rider, gives the slope stronger rounded terrain features, adds more forest density, and improves the snow/lighting presentation while keeping the existing keyboard and touch controls.

## Controls

- A / D or ← / → — carve left / right
- W / ↑ — tuck for more speed
- S / ↓ — brake
- Space — ollie / jump (requires some speed)
- Q / E — rotate while airborne
- P / Esc — pause
- R — restart run
- Touch screens have on-screen controls

## Update the existing GitHub Pages site

1. Extract this ZIP on your computer.
2. In your GitHub repository, use **Add file → Upload files**.
3. Upload the extracted `index.html`, `package.json`, `README.md`, `vite.config.js`, and the complete `src` folder so they replace the files with the same names in the repository root.
4. **Keep your existing `.github/workflows/main.yml` file. Do not delete the `.github` folder.**
5. Commit the upload, then check the Actions tab. Wait for a green check before opening the published site.

The site uses Vite's relative base path so it can run from a GitHub Pages repository URL.

## Local development (optional)

Requires Node.js 20+:

```sh
npm install
npm run dev
```

This is a stylized arcade game, not a professional snow-sports simulator. Scenery is procedural and does not require external art assets.
