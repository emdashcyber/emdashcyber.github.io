# EmDash Cyber GitHub Pages index

Static Astro index for the research sites hosted under `emdashcyber.com`. The site discovers public Pages repositories through GitHub and uses its committed fallback list when discovery is unavailable.

## Local development and validation

Use the Node major in `.node-version`. From the repository root:

```sh
npm ci
npm run dev
```

For the same checks used by PR validation and publication:

```sh
npm run check
```

`check` runs the project-discovery unit tests, builds the site, then verifies metadata, links, assets, privacy headers and accessibility-related output. Individual `test`, `build` and `verify` commands remain available; `verify` requires a completed build. The build may read the public GitHub repository API; an optional `GITHUB_TOKEN` is used only for read access, and failures use the saved list. No secret is required for local validation.

`node_modules`, `dist` and `.astro` are generated and ignored. PR/manual checks have read-only repository permissions. The existing main-branch/scheduled publication workflow uses the same validation command before Pages configuration and deployment. No deployment occurs during `check`.
