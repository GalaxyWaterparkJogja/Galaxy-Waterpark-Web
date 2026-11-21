# Frontend Visual & Layout Fixes Technical Specification (VF-01 – VF-06)

This document provides a comprehensive technical specification of the visual, layout, and responsive fixes implemented on branch `fix/frontend-audit-and-seo`.

---

## 1. VF-01: Mobile & Tablet Google Maps Embed Cropping & Visit Section

- **Target File:** `frontend/src/components/features/landing/sections/visit/visit.module.css`
- **Issue:**
  1. Base `.frame` and `.panel` had `overflow: hidden;` applied unconditionally on mobile and tablet viewports, clipping outer map border glows and card drop-shadows.
  2. The Google Maps embed displayed an intrusive top-left white info card (`115px` tall) on mobile viewports.
  3. Inside `@variant tablet`, `.map` used `aspect-ratio: 16 / 10`, which caused `height: calc(100% + 150px)` on `.map iframe` to fail resolving against an indefinite percentage base.
- **Fix Implemented:**
  - Removed `overflow: hidden` from base `.panel, .frame`. It is now scoped strictly under `@variant desktop { .panel, .frame { overflow: hidden; } }`.
  - Added section vertical breathing room: `padding-bottom: 24px` on mobile, `@variant tablet { .section { margin-top: var(--landing-section-space); padding-bottom: 28px; } }`, and `@variant desktop { .section { margin-top: var(--landing-section-space); padding-bottom: 36px; } }`.
  - Configured mobile `.map` with fixed `height: 172px; position: relative; overflow: hidden;` and `.map iframe { width: 100%; height: calc(100% + 150px); border: 0; margin-top: -150px; display: block; }` to clip Google Maps' top info bar.
  - On tablet (`@variant tablet`), replaced `aspect-ratio: 16 / 10` with explicit `height: 300px;` and added `@media (min-width: 1024px) { .map { height: 409px; } }` so `calc(100% + 150px)` always computes against a definite pixel height.

---

## 2. VF-02: Unclip Card Drop-Shadows Across All Landing Sections

- **Target Files:**
  - `frontend/src/components/ui/paged-carousel.module.css`
  - `frontend/src/components/features/landing/sections/tickets/tickets.module.css`
  - `frontend/src/components/features/landing/sections/promotions/promotions.module.css`
  - `frontend/src/components/features/landing/sections/events/events.module.css`
  - `frontend/src/components/features/landing/sections/reviews/reviews.module.css`
  - `frontend/src/components/features/landing/sections/categories/categories.module.css`
  - `frontend/src/components/features/landing/sections/about/about.module.css`
  - `frontend/src/components/features/landing/sections/partners/partners.module.css`
- **Issue:**
  - Sliding carousels and static grid containers cut off card drop-shadows on their top, bottom, and edges due to parent `overflow: hidden` and zero vertical padding bleed.
- **Fix Implemented:**
  - In `paged-carousel.module.css`: Added `.viewport { padding: 12px 0 28px; margin: -12px 0 -16px; }` on mobile (0px horizontal padding preserving exact `343px` client width on `375px` devices with vertical shadow bleed), and `@variant desktop { .viewport { overflow: visible; padding: 0; margin: 0; } }`.
  - In `tickets.module.css`, `promotions.module.css`, `events.module.css`, and `reviews.module.css`: Added `padding-bottom: 28px` on base/mobile `.section` and `padding-bottom: 36px` on desktop `.section`. Removed negative bottom margins on rails.
  - In `categories.module.css`: Added `padding-bottom: 28px;` on base `.section`, `@variant tablet { .section { margin-top: var(--landing-section-space); } }`, and `@variant desktop { .section { margin-top: var(--landing-section-space); padding-bottom: 36px; } }`.
  - In `about.module.css`: Ensured `@variant tablet { .section { margin-top: var(--landing-section-space); } }`.
  - In `partners.module.css`: Added `padding-bottom: 28px;` (mobile) and `padding-bottom: 36px;` (desktop) on `.section`. Added `.viewport { padding-block: 16px; margin-block: -16px; }` so the Embla continuous marquee does not clip logo card drop-shadows.

---

## 3. VF-03: Katalog Title-to-Card Spacing, Mobile 2-Column Centered Horizontal Scroll Rail & Edge Cases

- **Target Files:**
  - `frontend/src/components/features/katalog/katalog-page.tsx`
  - `frontend/src/components/features/katalog/katalog.module.css`
- **Issue:**
  - Mobile katalog sections lacked horizontal swipe rails with "Lihat Selengkapnya" end-cards; "Kategori Serupa" on mobile did not provide a way to navigate to the full category; single-child category grids were left-aligned rather than centered; title-to-card spacing was too tight.
- **Fix Implemented:**
  - In `katalog-page.tsx`:
    - Moved `<Link href={`/katalog/${category.id}`} className={styles.moreCard}>` directly inside `<div className={styles.preview}>` after the first 3 cards.
    - Updated the `"Kategori Serupa"` detail view section (`styles.similarSection`) to render `<Link href={`/katalog/${group.id}`} className={styles.moreCard}>` inside `<div className={styles.preview}>`.
  - In `katalog.module.css`:
    - Increased `.heading` and `.back` bottom margin to `20px` on mobile and `28px` at `@media (min-width: 1024px)`.
    - Styled `.preview` as a horizontal scroll snap rail on mobile/tablet `< 1024px` with `-ms-overflow-style: none`, `scrollbar-width: none`, and `scroll-snap-type: x mandatory`.
    - Set `.preview > .card, .preview > .moreCard` to `flex: 0 0 calc((100% - 12px) / 2); max-width: calc((100% - 12px) / 2); scroll-snap-align: start;`.
    - Added `.grid:has(> :only-child) { grid-template-columns: calc((100% - 12px) / 2); justify-content: center; }` on `< 600px`.
    - Added centered layout for `.detailTop` and `.detailCard` on mobile `< 1024px` with `width: min(100%, 402px); border-radius: 24px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);`.

---

## 4. VF-03b: Secondary Pages (`/promo`, `/event`, `/galeri`) Mobile 2-Column Layout

- **Target Files:**
  - `frontend/src/components/features/promo/promo.module.css`
  - `frontend/src/components/features/event/event.module.css`
  - `frontend/src/components/features/galeri/galeri.module.css`
- **Issue:**
  - Secondary pages suffered from button text clipping, fixed height overflows, and single-column stretched cards on mobile.
- **Fix Implemented:**
  - `promo.module.css`: Added `overflow-x: clip; padding-bottom: 56px;` on `.page`. Configured 2-column mobile `.grid` with single-child centering `grid:has(> :only-child)`. Changed mobile `.card` from fixed `height: 184px` to `height: auto; min-height: 220px; width: 100%`. Set `.media, .image { aspect-ratio: 168 / 112; min-height: 104px; }`. Set `.body { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 8px 10px 12px; gap: 6px; }` and `.cta { margin-top: auto; }`.
  - `event.module.css`: Added `overflow-x: clip; padding-bottom: 56px;` on `.page`. Configured 2-column mobile `.grid` with single-child centering. Changed `.card` to `height: auto; min-height: 215px; width: 100%`. Set `.image { aspect-ratio: 168 / 109; min-height: 109px; }`. Set `.body { flex: 1; min-height: 106px; padding: 10px 10px 12px; }`.
  - `galeri.module.css`: Added `overflow-x: clip; padding-bottom: 56px;` on `.page`. Constrained mobile `.tile, .photoCard { max-height: 360px; }` with `max-height: none` at `@media (min-width: 600px)`.

---

## 5. VF-04: Hide Sidebar Scrollbars on Non-Landing Pages

- **Target Files:**
  - `frontend/src/app/globals.css`
  - `frontend/src/components/layout/layout.module.css`
- **Issue:**
  - Browsers on Windows showed unsightly gray scrollbars on subpages and nested scroll containers caused double scrollbars.
- **Fix Implemented:**
  - In `globals.css`: Added universal scrollbar hiding:
    ```css
    *, *::before, *::after {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    *::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    ```
    Along with `overflow-x: clip;` on `html, body`.
  - In `layout.module.css`: Changed `overflow-x: hidden;` to `overflow-x: clip;` on `.siteWrapper:has([data-page="content"])` and `.mainContent, .main` to prevent nested vertical scrollbars.

---

## 6. VF-05: Centered Mobile Detail Dialog

- **Target File:** `frontend/src/components/ui/detail-dialog.module.css`
- **Issue:**
  - Bottom sheet dialog on mobile clipped images and pushed close buttons off-screen.
- **Fix Implemented:**
  - Centered `.dialog` on mobile `< 600px`:
    ```css
    @media (max-width: 599px) {
      .dialog {
        position: fixed;
        inset: 0;
        width: min(calc(100vw - 32px), 368px);
        max-width: calc(100vw - 32px);
        max-height: min(85dvh, 720px);
        margin: auto;
        border: 0;
        border-radius: 20px;
        padding: 0;
        background: #fff;
        box-shadow: 0 24px 60px rgb(0 0 0 / 0.28);
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .media {
        max-height: 42dvh;
        overflow: hidden;
      }
    }
    ```

---

## 7. VF-06: Reduce Mobile Footer Max Height

- **Target File:** `frontend/src/components/layout/app-footer.module.css`
- **Issue:**
  - Mobile footer had excessive vertical padding, consuming more than 60% of viewport height on phones.
- **Fix Implemented:**
  - Reduced mobile `.footer` padding to `padding: 24px 0 12px;`.
  - Reduced mobile `.inner` grid gap to `gap: 16px;`.
  - Set `.copyright { margin: 0; padding-bottom: 0; }`.
