# Tabs UX/UI QA Checklist

## Scope
- Home
- Product
- News
- Member
- Bottom Tabs Bar

## Environment
- Devices: 360x800, 390x844, 430x932
- Browser: Chrome latest, Edge latest
- Build: npm run build passes

## Global Checks
- Tab switching is smooth and without visual jump.
- Bottom tab labels and icons are readable on 360 width.
- Touch targets are easy to tap with one hand.
- No text overlap, clipping, or horizontal scrolling.

## Home Page
- Hero banner displays correctly and can navigate to product section.
- Quick entry cards are aligned in three columns.
- News card list shows title, summary, and detail cue.
- On 360 width, card spacing and text remain readable.

## Product Page
- Top segment switches among three business categories correctly.
- Express sub-segment switches among DHL/FedEx/UPS/TNT correctly.
- Card title, subtitle, and content are readable at 360 width.
- No broken layout when switching segment quickly.

## News Page
- Initial loading skeleton appears before first data load.
- Pull-to-refresh works and ends only after response completes.
- Empty state is shown when category has no data.
- Error state shows retry button and retry recovers page.
- Infinite scroll loads next page normally.

## Member Page
- Login card fields are accessible and validation behavior is correct.
- Logged-in hero area shows account, message badge, and KPI panel.
- Quick task chips open correct target pages.
- Quick menu manage modal:
  - progress bar updates with selection count
  - save button disabled before minimum selection
  - recommendation chips can add shortcuts
  - reorder and save produce expected shortcut order
- Full menu is grouped by business/account/tools categories.
- Badge values display and update correctly.

## Regression Checks
- Existing member secondary pages still open from menu items.
- No console errors during basic navigation.
- Build output has no new TypeScript errors.

## Acceptance
- All checks pass on 360/390/430 widths.
- Core user flows can be completed in 1-2 taps from each tab first screen.
- Visual style remains consistent with Ionic components and theme variables.
