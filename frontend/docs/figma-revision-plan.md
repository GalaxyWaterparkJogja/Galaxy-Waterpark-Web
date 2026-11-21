# Figma revision implementation plan

Sources: revised `ck1adXxS2UJzrMSI5eFjj4`, previous `aRMCrbcVzhM9PzlCRaZdjN`.
Landing: desktop `154:3867`, mobile `348:6566`.

## Delivery order

1. Reconcile the newer local testing implementation into the tracked frontend so both apps share the same baseline. Preserve local evidence, generated output, environment files and installed dependencies.
2. Landing design revision: compare matching Figma nodes, update scoped typography, card dimensions, spacing and assets. Keep the existing service contract and business content. Commit separately.
3. Review carousel: reproduce the discontinuity, fix looping/drag/keyboard behavior, verify resize and reduced motion. Commit separately.
4. Landing edge cases: test narrow screens, tablet boundaries, wide screens, long content, empty/single-item rails, focus and image geometry. Fix demonstrated issues and commit separately.
5. Second batch: implement Catalog, Promo, Event and Gallery from their revised desktop/mobile frames, one commit per page. Include detail states present in those page designs.

## Verification

- Inspect rendered screenshots against Figma at 412px and 1440px.
- Check 320, 375, 600, 768, 769, 1024, 1279, 1280 and 1920px for overflow, clipping and content overlap.
- Exercise carousels, keyboard navigation, links, filters/detail states and reduced motion.
- Run ESLint, TypeScript and production build for meaningful implementation milestones.
- Stage explicit implementation paths; exclude existing logs, local migration evidence, build output and node_modules. Commit messages contain only informative implementation details.
- Use `frontend/` for implementation and commits; leave `testing/` unchanged after the baseline synchronization, per the user's clarification.

## Progress

- [x] Inspect repository and identify the divergent local app copies.
- [x] Read revised and previous Landing desktop/mobile design context and screenshots.
- [x] Synchronize application baseline (`37be701`).
- [x] Landing revision: scoped type/card updates, revised partner cards, local SVGs, desktop section positions and mobile geometry. ESLint and TypeScript passed; rendered at 412px and 1440px.
- [x] Review sliding: isolated Embla review rail, seamless looping, pointer dragging, rapid keyboard navigation, Home/End and reduced-motion jumps. Checked at 412, 768, 1024 and 1440px; ESLint and TypeScript passed.
- [x] Landing edge cases: empty/single/long content, narrow and wide viewports, initial ticket position, visible map destination, local font, reduced-motion carousel. Full lint and production build passed.
- [x] Catalog: responsive overview, all category lists, item details, related cards, image crops, deep links and native Back/Forward. Shared content shell follows revised colors/type. Checked at 320/412/768/1440px; source lint and TypeScript passed.
- [x] Promo: revised responsive poster grid and detail dialog, separate page fixture/service. Checked at 320/412/768/1440px, dialog focus/scroll lock/Escape/restore, lint and TypeScript.
- [x] Event: revised mobile poster grid, desktop horizontal cards and accessible detail dialogs. Checked at 320/412/768/1440px, focus restoration, lint and TypeScript.
- [x] Gallery: local Figma photos, mobile stack, desktop drag/keyboard photo rails, accessible enlarged viewer. Checked at 320/412/768/1440px, keyboard photo navigation and Escape. Lint, TypeScript and production build passed.

## Final verification

- 50 responsive checks: five public routes at 320, 375, 600, 768, 769, 1024, 1279, 1280, 1440 and 1920px. No document overflow or clipped headings/review copy found.
- Landing empty, single-item and long unbroken content cases passed; temporary fixture changes were restored.
- Promo/Event dialogs passed focus trapping, body scroll lock, Escape and trigger-focus restoration checks.
- Catalog category/detail links and browser Back navigation passed.
- Local assets are non-empty; rendered subpage checks found no broken visible images.
- Full ESLint and optimized production build (including TypeScript) passed.
- The real Google Maps embed remains network-dependent; the location address links directly to the correct destination even when the embed is unavailable. Figma's static London placeholder was not substituted for the park location.
- Public page content remains fixture-backed. Existing local logs, CSS migration evidence and testing app are excluded from delivery commits.

## Content sources

- Landing: `src/fixtures/landing.json` through the existing landing service.
- Catalog: `features/katalog/catalog-data.ts` contains the reference category/item fixtures.
- Promo: `src/fixtures/promo.json` through `promo-service.ts`.
- Event: `src/fixtures/events.json` through `event-service.ts`.
- Gallery: `src/fixtures/gallery.json` through `gallery-service.ts`.
- Responsive-only fixture slots mirror Figma's repeated example cards; no backend publication or deployment is part of this work.

## Landing follow-up: reviews and partners

1. Expand Landing fixtures to ten distinct reviews and ten partners.
2. Keep reviews manually controlled, with a seamless bidirectional loop, free dragging and wheel/trackpad scrolling.
3. Restore continuous desktop partner scrolling at 1024px and above, without a pause button; retain hover/focus and reduced-motion behavior.
4. Below 1024px, use a two-column partner grid capped at eight cards, with an expandable "Lihat selengkapnya" control.
5. Treat partner names longer than 20 characters as long: subtract 1px from the existing breakpoint size; add 1px for shorter names.
6. Verify repeated loop crossings, both wheel axes, mouse drag, expansion/collapse, responsive boundaries, lint and production build. Keep changes in separate review/partner commits.
