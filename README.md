# site-fibramfer

A website built with Astro, consuming the internal Vue 3 Design System (ds-grupo-rkb).

## Setup

This project was set up following the [ADR 001](./docs/adr/001-initial-project-setup.md).

### Prerequisites

- Node.js (>=22)
- npm or yarn or pnpm
- Access to the Design System (ds-grupo-rkb) locally or as a private npm package

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Ensure the Design System is available. This project is configured to link to the DS locally at `../ds-grupo-rkb`. If your DS is located elsewhere, update the path in `package.json` or install it via your preferred method.

### Development

To start the development server:

   ```bash
   npm run dev
   ```

> **Note**: Due to a Windows Application Control Policy blocking the native `@astrojs/compiler-binding` module, the dev server may fail to start. If you encounter this error, you may need to adjust your system's application control policy to allow the execution of the native module, or use a different environment where the block is not present.

### Building

To build the site for production:

   ```bash
   npm run build
   ```

### Preview

To preview the production build locally:

   ```bash
   npm run preview
   ```

## Design System Integration

- The Design System is installed as a local dependency: `ds-grupo-rkb` linked from `../ds-grupo-rkb`.
- Tailwind CSS is shared via the `@tailwindcss/vite` plugin in `astro.config.mjs`.
- The DS's `style.css` is imported automatically when importing components from the DS, providing Tailwind base styles and design tokens.

## Navigation architecture

The site uses the home page as the persistent overview and the main content areas as
route-driven drawers. This follows the navigation model where the home remains visible
behind the current content panel.

### Routes

| Route | Behavior |
| --- | --- |
| `/` | Home overview with the `TrueHero` only |
| `/a-fibramfer/` | Home background with the `A Fibramfer` drawer open |
| `/cadeira-suspensa/` | Home background with the `Cadeira Suspensa` drawer open |
| `/seguranca/` | Home background with the `Segurança` drawer open |
| `/blog/` | Home background with the full Blog drawer open |
| `/contato/` | Home background with the `Contato` drawer open |
| `/privacidade/` | Home background with the `Privacidade` legal drawer open |
| `/termos/` | Home background with the `Termos de Uso` legal drawer open |
| `/admin/` | Home background with the `Admin` drawer open (Ctrl+Y) |
| `/blog/<slug>/` | Home background with the selected blog post open in the Drawer |

The main routes and individual blog posts are rendered by the shared
`FibramferDrawers.astro` composition. It mounts one `NavigationDrawer.vue` shell with
named content slots, so switching between drawer routes or posts replaces only the
active content instead of navigating to a separate page. The drawer behavior itself is
provided by the `Drawer` component from `ds-grupo-rkb`. Page-specific behavior stays in
this consumer; the Design System remains the source of truth for reusable UI components.

### URL and browser history

- Clicking a main navigation item updates the URL with `history.pushState` and opens the
  corresponding drawer without a full page reload.
- Clicking a Blog post title updates the URL to `/blog/<slug>/`, closes the current
  curtain over the Blog list, and reveals the selected post in the same Drawer.
- Clicking the home/logo control navigates back to `/` and closes the drawer.
- The browser Back/Forward buttons are synchronized through `popstate`.
- Direct access or refresh (F5) on any drawer route renders the Home background and opens
  the corresponding Drawer automatically, without replaying the entrance curtain. The
  Home background is marked `inert` while the Drawer is open.
- Opening `/blog/<slug>/` directly or refreshing that URL renders the Home background and
  opens the corresponding post Drawer automatically.
- Navigation drawers are closed only through the Header Home control; their internal
  close button, overlay click, and `Escape` are intentionally disabled.
- The Header updates the active item and `aria-current` according to the current route.
- The home scroll does not change the URL or act as a scrollspy route selector.
- Switching between two open panel routes keeps the same drawer and overlay mounted; the
  new route content appears without repeating the entrance delay or flashing the panel.
- The main drawers use the DS `transition="fade"` + `fullscreen` variants: the panel
  occupies the viewport and enters/exits through opacity instead of sliding horizontally
  or appearing as a floating card. On desktop, the panel uses 75% of the viewport width;
  on mobile, it uses the full width. The overlay and panel enter together through one
  synchronized 500ms fade layer, avoiding an intermediate flash.
- The main drawers use the DS four-gate curtain reveal: after the synchronized fade
  and a short delay, solid horizontal and vertical gates move from the center outward
  to reveal the content. Closing reverses the movement; switching routes while the
  drawer remains open closes the curtain over the current content, replaces the slot,
  and opens it again without fading the overlay a second time. When the Home control
  closes the drawer, the curtain also finishes closing before the drawer fade starts.
- Blog posts share a `blog-posts` content slot and use a unique reveal key per post, so
  changing posts repeats the curtain transition while keeping the overlay and Drawer
  mounted.
- While a panel route is active, the Header remains visible above the drawer overlay and
  receives `data-panel-open="true"`; its navigation remains fully visible, clickable and
  keyboard-navigable while the current route remains highlighted. These navigation drawers
  use the DS non-modal mode so the header can remain an active part of the route switcher.

The primary CTAs follow the same route contract:

- `Explorar Soluções` → `/cadeira-suspensa/`
- `Falar com Especialista` → `/contato/`
- `Conheça nossa história` → `/a-fibramfer/`

On desktop, the Fibramfer navigation drawer is anchored to the right at 75% width;
on smaller screens it uses the full width. The drawer supplies overlay handling,
Escape support, scroll locking, and reduced-motion behavior. Because these route
drawers are non-modal, the Header remains visually present and keyboard-navigable
while a panel is open.

### Static FTP output

Astro generates directory-based static routes. After `npm run build`, the deployable
structure includes:

```text
dist/index.html
dist/a-fibramfer/index.html
dist/cadeira-suspensa/index.html
dist/seguranca/index.html
dist/onde-comprar/index.html
dist/blog/index.html
dist/blog/<slug>/index.html
dist/contato/index.html
dist/privacidade/index.html
dist/termos/index.html
```

The FTP server must serve each directory's `index.html`, so the canonical deployed URLs
are expected to use a trailing slash, such as `/cadeira-suspensa/`. Direct access and refresh on
each main route must resolve to the generated directory index instead of a client-only
SPA fallback.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run test:slider` - Browser regression for the automatic slider (local Chrome/Chromium required; see `docs/hero-slider-smoke.md` for setup and reload scenarios)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Known Issues

- **Native Binding Block**: On Windows, if an Application Control Policy blocks the `@astrojs/compiler-binding` native module, Astro commands will fail. Workarounds include adjusting the policy or using a different environment.

## License

ISC
