# Alpine Line — browser snowboarding prototype

A 3D browser snowboarding prototype built with Three.js and Vite. It can be published as a public website using GitHub Pages without installing development tools on your Mac.

## Publish it from your browser (no local setup)

1. Sign in to GitHub or create an account at https://github.com/.
2. Create a **new public repository**. A name like `alpine-line` works.
3. On the repository page, choose **Add file → Upload files**.
4. Extract this ZIP on your Mac, then drag the *contents* of the `snowboard_web_prototype` folder into the GitHub upload page. Make sure `.github/workflows/deploy.yml` is included. Hidden folders may not be selected when using Finder; if `.github` is missing, create the path in GitHub using **Add file → Create new file** and name it `.github/workflows/deploy.yml`, then paste the workflow from the file in this project.
5. Commit the uploaded files to the `main` branch.
6. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
7. Open the **Actions** tab and wait for the “Deploy Alpine Line to GitHub Pages” workflow to finish successfully.
8. Open **Settings → Pages** to find the public website URL. It will look like `https://YOUR-USERNAME.github.io/alpine-line/`.

After the first successful deployment, each new commit to `main` automatically rebuilds and republishes the game.

## Controls
- **A / D** or **← / →** — steer / carve
- **W / ↑** — tuck (slightly reduces drag)
- **S / ↓** — brake
- **Space** — ollie / jump (requires some speed)
- **Q / E** — rotate while airborne (use A/D for directional spin control)
- **P** or **Esc** — pause
- **R** — reset the run

## What is implemented
- Procedural rolling slope and distant alpine peaks
- Instanced conifer forest and scattered rocks
- Third-person follow camera with speed-responsive field of view
- Snowboarder rig, board and bindings
- Fixed-timestep motion update (120 Hz)
- Gravity projected onto local terrain normals
- Speed-dependent steering, lateral slip damping, edge engagement, drag and braking
- Ollie, airborne rotation, landing detection and hard-landing recovery
- Snow spray particles and on-screen speed / run HUD

## Realism note
This is a playable prototype, not a validated sports simulator or a photorealistic AAA game. The physics are a simplified game model and the terrain/materials are procedural. The game can be developed further with more accurate snowboard geometry, tuned contact physics, rider animation, richer snow materials, sound, and performance optimization.

## Optional local development
Local development is not needed to publish the site through GitHub Actions. If you later want to work on it locally, install Node.js and run `npm install`, `npm run dev`.
