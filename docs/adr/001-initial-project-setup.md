# ADR 001: Initial Project Setup for site-fibramfer with Astro, Vue DS, and Decap CMS

## Status
Accepted

## Context
We are initiating a new website project (site-fibramfer) with moderate complexity. The project has the following existing assets:
- An internal Design System library built with Vue 3 (ds-grupo-rkb) that includes:
  - Component library
  - Storybook for documentation
  - Tailwind CSS configuration
- A GitHub Actions + FTP workflow that currently builds and deploys only the Storybook static site
- The need for a marketing/site presence that will consume the Vue DS

The site requires:
- Consumption of Vue 3 components from the internal DS
- Consistent styling using the existing Tailwind configuration from the DS
- A blog section with content management capabilities
- Continued use of the existing Storybook for DS documentation (separate repo)
- Deployment via GitHub Actions + FTP (extended to include the site)

## Decision
We will implement the site using Astro with the following approach:

### Phase 1: Astro + Vue Setup
- Initialize Astro project with Vue integration (`@astrojs/vue`)
- Configure Git repository and development dependencies (ESLint, Prettier, TypeScript)
- Verify basic setup with `npm run dev`

### Phase 2: Design System Integration
- Consume internal Vue DS via:
  - Development: Direct link (`npm install ../ds-grupo-rkb`)
  - Production: Private npm package or Git dependency
- Share Tailwind configuration by extending/reference the DS's `tailwind.config.js`
- Maintain existing Storybook in DS repository for component documentation

### Phase 3: Extended Deploy Strategy
- Analyze existing GitHub Actions workflow for Storybook
- Extend workflow to include:
  - Astro site build (`npm run build`)
  - FTP upload of Astro `dist/` folder to appropriate location
- Maintain existing Storybook deploy unchanged

### Phase 4: Decap CMS for Blog
- Install `decap-cms-app`
- Create `public/admin/` with `index.html` and `config.yml`
- Configure backend (git-gateway or GitHub), media folders, and blog collection
- Map fields: title, slug, description, image, author, date, category, tags, body
- Test CMS accessibility at `/admin`

## Consequences

### Positive
- Enables rapid development with modern Astro + Vue stack
- Leverages existing DS investment without duplication
- Maintains separate concerns: site (Astro) vs DS documentation (Storybook)
- Provides content management for blog without custom backend
- Uses existing deployment infrastructure (FTP) with minimal changes

### Negative
- Initial setup complexity for Vue-Astro integration
- Need to manage two deployment artifacts (Storybook + Site)
- Potential configuration drift between DS Tailwind and site Tailwind
- CMS adds dependency and learning curve for content editors

## Implications
- **Team**: Developers need familiarity with Astro, Vue, and Decap CMS
- **Process**: ADRs should be created for significant architectural decisions during development
- **Infrastructure**: FTP credentials and workflows must support dual deployment
- **Future**: Consider unifying deployments or migrating to modern hosting (Vercel/Netlify) later
- **Documentation**: Keep ADRs in `docs/adr/` following numeric naming convention