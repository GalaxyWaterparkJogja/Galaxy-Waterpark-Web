# Responsive LoFi foundation

Reference: [PAD UI / LOFI](https://www.figma.com/design/hyoqVZX1pfVA8Yvqv0b3cM/PAD-UI--Copy-Deletable-?node-id=125-484). Desktop frames: landing `130:523`, catalog `153:3217`, promo `130:709`, event `130:747`, gallery `130:785`.

## Audit and changes

- The desktop subpage overrides reset `max-width` to `100%`, bypassing the shared boundary. All four subpages now compose `layout/container.module.css`.
- Catalog, event, and gallery media queries targeted unused grid selectors. Rules now target the actual rendered containers.
- Landing sections used mobile card heights on desktop. The same sections now adapt with grids, aspect ratios, and bounded fluid spacing from the reference.
- Header navigation had separate desktop and mobile link trees and route-specific conditionals. There is now one navigation tree, with route identity stored in `navigation.ts`. The gallery destination opens the existing gallery route; other landing section destinations remain intact.
- Carousel pagination assumed a fixed number of pages even when cards fit. It now measures overflow and visible card widths, updates on resize, and omits controls when scrolling is unnecessary.

## Ownership

| File | Responsibility |
| --- | --- |
| `components/layout/layout.module.css` | Shell tokens, breakpoint widths, header, drawer, footer, floating chat |
| `components/layout/container.module.css` | Centered content boundary and shared horizontal padding |
| `components/layout/navigation.ts` | Labels, destinations, route identity |
| `features/landing/landing-page.tsx` | Section order only |
| `features/landing/landing-sections.tsx` | Shared section markup for both viewport sizes |
| `features/landing/landing-data.ts` | Placeholder IDs, visibility, semantic promo grid placement |
| `features/landing/landing-controls.tsx` | Scroll, keyboard navigation, responsive pagination |
| `ui/wireframe-text.tsx` | Reusable decorative LoFi text lines |

## Responsive rules

The shell stays `width: 100%`. Its `--container-max-width` is `100%` below 769px, `1024px` from 769px, `1200px` from 1024px, and `1440px` from 1440px. Gutter and card-gap tokens are inherited by all features; change them in the shell rather than introducing feature overrides.

The header retains the same logo, 64px height, `#f8fafc` background, and `rgba(203, 213, 225, 0.7)` bottom border. Only navigation presentation changes at 769px. The drawer occupies 75% of the mobile viewport. JavaScript reads the `--desktop-breakpoint` token to release the scroll lock when the viewport becomes desktop. Keep that token and the matching CSS media query together when changing this boundary.

Desktop landing uses three category columns, four ticket columns, semantic promo grid areas, and two event columns with horizontal image/body cards. Hero, About, and map bands span the viewport while their content follows the shared boundary. Extra desktop LoFi slots carry visibility metadata and reuse the same card markup; mobile keeps its original visible card counts.

Subpages retain the existing catalog filters and shared mobile markup. Desktop catalog/promo use three columns; event uses two; gallery uses three, then four at 1024px. Catalog filtering is deliberately retained rather than replacing it with the reference's three simultaneous category groups.

Floating chat remains 55px with a 38px chat-round-dots icon, `#1fc16b`, and the existing `https://wa.me` destination. Its horizontal offset follows the viewport and shared container boundary.

## Next session

Replace placeholder slot data and wireframe copy with backend content using the existing sections and card containers. Remove `desktopOnly` visibility metadata when real content should be available at every viewport size. Keep promo placement semantic rather than tying it to array order.

The map is the existing Figma London placeholder, not a verified park map. Contact copy follows the LoFi reference; WhatsApp still needs a real destination number. The catalog content and filters need a separate product decision before expanding to the reference's complete groups.

No build, lint, tests, or rendered browser validation were run in this session, as requested. Visual fidelity and mobile behavior therefore still need a later review.
