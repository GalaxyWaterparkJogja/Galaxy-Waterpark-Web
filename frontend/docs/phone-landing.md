# Phone landing — LoFi slicing

Reference: [PAD UI / Phone_LandingPage](https://www.figma.com/design/2qCJHBezfBSmPLalkpKHuD/PAD-UI?node-id=146-660), in the LOFI page of the supplied file. The original URL points at the containing design context; the phone landing frame is node `146:660`.

The source frame is 393 × 4110. The top 48px represents native phone status UI, so the web content targets **393 × 4062**. Mobile Viewer supplies its own status and browser bars. Keep the large whitespace before Location: it is part of this LoFi reference.

## Structure

- `src/app/page.tsx`: route composition.
- `src/components/features/landing/landing-page.tsx`: server-rendered sections and shared wireframe cards/headings.
- `landing-controls.tsx`: the client boundary for the menu and reusable horizontal carousel. Supports touch/trackpad scrolling, pagination, keyboard arrows, and reduced motion.
- `landing-data.ts`: navigation, categories, and stable placeholder IDs to replace with content later.
- `landing.module.css`: scoped mobile-first layout with responsive desktop rules. Shared gutter/card-gap/radius tokens now come from the app shell. See [Responsive LoFi foundation](./responsive-layout.md) for the current architecture; the 768px shell cap no longer applies.
- `src/app/globals.css`: shared LoFi color tokens.
- `public/images/landing/location-map.png`: original map image loaded by the public Figma view. This is the London map placeholder from the design, not the park's verified address.

## Reference geometry at 393px

All Y positions below exclude the native 48px status bar.

| Element | Y | Height |
| --- | ---: | ---: |
| Hero | 0 | 473 |
| Operating hours | 473 | 282 |
| Category cards | 755 | 291 |
| Tickets heading | 1154 | 18 |
| Promo heading | 1356 | 18 |
| Event heading | 1825 | 18 |
| About Us band | 2418 | 198 |
| Reviews heading | 2744 | 18 |
| Location heading | 3530 | 18 |
| Map | 3566 | 182 |
| Footer | 3748 | 314 |

## Scope and fidelity

The Figma MCP account rejected design-context and screenshot requests with “Looks like you don't have edit access to this file.” The public Figma view remained accessible in persistent Chrome, so the layout was measured from a 100% screenshot of that frame. Main geometry and sampled LoFi colors are reproduced; native status UI is excluded and small icons are local outline approximations. This is not an assertion of pixel-identical typography or icon assets.

Cards remain deliberate LoFi placeholders. Gallery and social destinations are unconfigured placeholders; no booking, payment, or backend data is connected. Existing in-page navigation and carousel controls work.

## Preview and validation

Run `npm run dev` and visit `http://localhost:3000`. For a production preview, use `npm run build`, then `npm run start -- --port 3001`.

Use the existing Chrome User Data at `D:\VSC\playwright-chrome-persistent\.chrome_profile`. The installed mobile extension is **Mobile simulator – responsive testing tool** (`ckejmhbmlajgoklhgbapkiccekfoccmk`, version 4.21.2). Keep the Figma and preview tabs open for comparison.
