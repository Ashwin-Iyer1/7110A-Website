# 7110A engineering archive

An interactive archive of Carroll Robotics' 2023–24 team website: nine original CAD models, the seven-person historical roster, a Blockly route sketcher, and a source-attributed robot-code lab. Original CRA and HTML sources remain in this repository for provenance.

## Explore and develop

`npm ci`, then `npm run dev`. Node 22.12+ is required. `npm test` checks bounded route geometry, imports and code generation; `npm run test:ui` checks real CAD loading, failures, route editing/export, mobile layout and source links. Install Chromium with `npx playwright install chromium` first. `npm run build` produces `dist/` for a static host, including a legacy-route fallback.

- CAD is optional and loaded on demand. File sizes are shown before download; originals are served from this repository's Git LFS media endpoint. The complete robot is about 50 MB. The Sled model is used for the real-render browser test. Blockly and the 3D viewer are separate lazy chunks; their library size does not burden the initial page.
- The route builder supports blocks and a keyboard step editor, replay, bounded JSON import/export and a **plain-text educational C++ sketch**. It models idealized point motion, not robot footprint, obstacles, acceleration, slip or validated firmware. Plans stay in page memory and are lost on reload unless exported.
- `public/code-lab/` contains only the reviewed companion files from the archived [7110A_Code](https://github.com/Ashwin-Iyer1/7110A_Code) project. Its [source review](public/code-lab/SOURCE_REVIEW.md) and [provenance manifest](public/code-lab/provenance.json) distinguish geometry recorded in code from hypothetical plant/controller assumptions. The original code repository remains archived and unchanged.
- Team names, photos and roles come from the original website. No sole-authorship, current membership or independently verified competition-result claims are added.

## Publication

The existing `gh-pages` branch publishes to https://ashwin-iyer1.github.io/7110A-Website/. Authenticated Pages settings and that branch have no custom domain; the historical root `CNAME` (`7110a.me`) remains in source but is deliberately not copied to the build. At the October 2026 review that old domain did not resolve. `dist/archive-source.json` records the archived source revision and lab provenance.

The root Vite app replaces the old published build. Historical `7110a-website/`, `helloryan/`, old root compiled assets and original model files are retained as source history; they are not copied wholesale into the new deployment.
