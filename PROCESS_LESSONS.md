# Website Build Process Lessons

## Process Summary

1. Built a public static site with GitHub Pages and hosted the installer through GitHub Releases.
2. Started with a lightweight single-page layout: password gate, hero title, rotating country/region label, download button, and interactive rotating globe.
3. Verified locally with browser automation before deployment, checking password flow, canvas rendering, responsive layout, download links, and public Pages availability.
4. Iterated on visual issues:
   - Removed unnecessary helper text from the globe.
   - Compressed the layout so the page fits within one viewport.
   - Replaced a gray wireframe globe with colored rendering.
   - Replaced cheap-looking flat land polygons with a spherical texture approach.
   - Optimized globe rendering by lowering internal texture resolution and throttling animation.
5. Expanded country/region rotation from a short manual list to a comprehensive ISO-style region-code list using `Intl.DisplayNames`.

## Core Lessons

- Decide deployment architecture early: GitHub Pages for the public site, GitHub Releases for large downloadable binaries.
- Treat password protection on static hosting as lightweight gating only, not real access control.
- Verify visual work in real browser viewports, not by code inspection alone.
- For animated hero graphics, prefer Canvas or CSS with small generated data over heavy models, textures, or libraries unless truly needed.
- Avoid visible instructional UI unless requested; interaction should be discoverable through cursor/touch behavior.
- For one-screen pages, constrain layout with viewport-aware sizing and test short desktop, normal desktop, and mobile heights.
- Do not fake spherical graphics with flat polygons. If land/water must appear attached to a globe, map color by spherical coordinates or use a true texture projection.
- Avoid per-frame blur filters and expensive effects. They may look good in screenshots but cause animation stutter.
- Precompute static geometry and keep each animation frame small.
- Validate the worst-case text, especially long country/region names, before assuming a rotating label is safe.

## Generic Add-On Prompt For Another Codex

Use this as an add-on prompt when asking Codex to build or refine a similar public landing page:

```text
Before implementing, inspect the existing project shape, deployment target, available assets, and large downloadable files. Choose a deployment plan that separates the static website from large binaries when possible.

For any animated visual hero, prioritize a lightweight implementation. Avoid heavy libraries, large textures, expensive per-frame filters, and decorative effects that can stutter. If building a globe or spherical object, do not use flat shapes that only appear correct from one angle. Make colors and surface details follow a spherical projection, texture projection, or real 3D geometry so they remain visually attached during rotation.

Design for the first viewport. The primary page should fit in one screen on desktop, short laptop heights, and mobile unless the user explicitly wants scrolling. Test the longest dynamic text, not only the default text.

Use real browser verification before finishing. Check desktop, short laptop, and mobile viewports; confirm no overflow, no overlapping UI, animation is nonblank and smooth, interaction works, and public deployment URLs are reachable. If the site is public, verify the deployed URL rather than only localhost.

Keep UI copy polished and minimal. Do not add visible usage instructions unless the user asks for them. For static-site password gates, clearly treat them as lightweight gates, not secure authentication.

When using country/region labels, prefer a standards-based list or browser-native region names instead of a small hand-written sample. Verify long names do not break layout.

After each visual iteration, judge both screenshot quality and runtime performance. If an effect improves a still image but creates slow frames, replace it with a cheaper technique.
```
