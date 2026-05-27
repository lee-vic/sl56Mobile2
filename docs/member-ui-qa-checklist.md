# Member Center UI QA Checklist

## Scope

- Page: `app/tabs/member`
- State: logged-in dashboard and logged-out login view
- Goal: verify UX/UI refresh has no functional regression

## Devices

- Small phone: 360x800
- Main phone: 390x844
- Tablet: 768x1024
- Large viewport: >= 992 width

## Visual Checks

- Header gradient is rendered without clipping.
- User number and service icons align on one line.
- KPI cards have equal height and balanced spacing.
- Quick menu and full menu sections are visually distinct.
- Menu title wraps to max two lines without overflow.
- Bottom tab bar has updated border/shadow and selected-state color.

## Interaction Checks

- Message entry button opens unread message page.
- "我的客服专员" button opens chat page.
- KPI and debt cards keep stable press feedback.
- All menu items are clickable and route correctly.
- "业务公告" unread badge still blinks before click.
- "合同签署" badge count still shows when > 0.

## Accessibility Checks

- Menu tiles can be focused by keyboard.
- Enter/Space on focused menu tile triggers navigation.
- Key action buttons have visible focus ring.
- Unread badge value updates are announced (`aria-live`).
- Text remains readable at 200% zoom.

## Responsive Checks

- <= 767 width: menu uses 3 columns.
- 768-991 width: menu uses 4 columns.
- >= 992 width: menu uses 5 columns.
- Window resize triggers menu reflow correctly.

## Regression Checks

- Login flow remains unchanged.
- Logout still clears session and returns to login UI.
- Unread notice count loading still works.
- Wait-to-sign count loading still works.
- Build command `npm run build` succeeds.

## Pass Criteria

- No broken navigation.
- No visual overlap or text truncation issues.
- No console/template runtime errors.
- Build succeeds in production mode.
