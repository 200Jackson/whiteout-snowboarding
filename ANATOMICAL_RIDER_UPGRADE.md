# WHITEOUT — Anatomical Rider Upgrade

This update expands the procedural Three.js rider with a hierarchical articulated character rig and a second pass of equipment and surface detail. The visual detailing is attached to the relevant moving body pivots, so protective pieces follow the limbs rather than floating in place.

## Articulated parts
- Pelvis and segmented lower spine/chest
- Neck, independently posed head, helmet, and visor
- Left/right shoulders, upper arms, elbows, forearms, wrists, gloves, and simplified fingers/thumbs
- Left/right hips, thighs, knees, shins, ankles, boots, and toe pivots
- Technical jacket details: collar, storm flap, zipper, pull, chest seams, reflective panel, and harness straps
- Protective gear: shoulder overlays, elbow guards, reinforced knee pads, hip pockets, belt and buckle
- Equipment details: glove knuckle guards, wrist cuffs, boot laces, gaiters, binding straps, and metal hardware
- Helmet vents, side pads, goggle strap, rear dial, and pack harness
- The existing snowboard, bindings, physics, terrain, camera, and controls are retained

## Important scope note
This is a real-time game character rig built from procedural Three.js geometry, not a medical-grade anatomical simulation. It represents the major joint chains and adds visible smaller hand/foot parts, but does not model every anatomical articulation or muscle. The latest pass primarily improves visible gear and silhouette detail; it does not claim to be a full medical anatomy model or a fully physics-driven human skeleton. For production-quality anatomy, replace the procedural body with a properly modeled and skin-weighted humanoid mesh and use inverse kinematics/animation clips.

## Install / run
1. Extract the ZIP.
2. Run `npm install`.
3. Run `npm run dev` to play locally, or `npm run build` to build for deployment.

The existing project uses Vite and Three.js. The current environment did not have Vite installed and dependency installation timed out, so a full Vite production build and in-browser visual test could not be completed here. `src/main.js` passed Node's JavaScript syntax check.
