# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
pnpm
```

## Local Development

```bash
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

We use Github Pages as the host for the appcket-docs site.

Any commit to main will trigger the GitHub Action defined in .github/workflows/node.js.yml which will build the static files to be served by GitHub Pages.