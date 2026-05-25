# Darrell Messer Website

Static professional website for Darrell Messer, built with [Astro](https://astro.build/) and ready for Cloudflare Pages.

## Local Development

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Build the static site:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Cloudflare Pages Deployment

Use these settings when connecting the GitHub repository to Cloudflare Pages:

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: current Cloudflare Pages default or a current LTS release

The project uses Astro static output, so the generated `dist` directory is suitable for Cloudflare Pages hosting.

## Content Notes

The site intentionally uses public-facing placeholders for contact links and professional details. Before launch, replace placeholder email, LinkedIn, practice-area language, canonical URL, and Open Graph URL values with verified public information.
