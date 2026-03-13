# Test Cases

Detailed verification steps for each deferral scenario in the sandbox.

## URL Routing

Sandbox URLs match the page patterns configured for property 1015553:

| URL | Detected Page | Pattern |
|-----|--------------|---------|
| `/en/` | Index | `^\\/?(^(\\/(\w{2}\\/\|...)))\\/?$` |
| `/en/roomsandrates/iframe/1015553` | Booking Iframe | `^\\/\\w+\\/roomsandrates\\/iframe\\/[0-9]+\\/?$` |
| `/en/roomsandrates/iframe/1015538` | Booking Iframe | Same pattern, different property |
| `/en/roomsandrates/iframe/9999999` | Booking Iframe | Same pattern, no THN script |
| `/en/roomsandrates/1015553` (iframe) | Rooms and Rates | `^\\/\\w+\\/roomsandrates(\\/nested)?\\/[0-9]+\\/?$` |
| `/en/roomsandrates/1015538` (iframe) | Rooms and Rates | Same pattern, different property |
| `/en/roomsandrates/9999999` (iframe) | — | No THN script to detect page |

## Booking Engine HTML (Engine 25)

`booking-engine.html` and `booking-engine-other.html` use the engine 25 (priceParseDataV1) DOM structure:

- `body#thn_hotel_sandbox` — Marker element
- `select#checkin`, `select#checkout` — Dates in YYYY/MM/DD format
- `select#adults`, `select#children` — Guest count
- `.price` — Price element
- `.card > .room-content h5` / `p` / `.room-image img` — Room cards

`booking-engine-noscript.html` is a plain HTML page with no THN script. Simulates a third-party booking engine without integration.

---

## 1. Index (`/en/`) — No Deferral

**Expected state:**
- `pageName` = `"Index"`
- `isDeferred` = `false` / `undefined`
- `childFrame` = `null`

**Verify:**
- `awakeChildScript()` does **not** run (only triggers on "Booking Iframe" pages)
- Widgets evaluate and display normally

---

## 2. Same Property (`/en/roomsandrates/iframe/1015553`) — Deferral with Same siteId

**Expected state:**
- `pageName` = `"Booking Iframe"`
- `isDeferred` = `true`

**Verify:**
- Parent sends `thn_awake` probes to the iframe every 400ms
- Child at `/en/roomsandrates/1015553` responds with `thn_ping`
- `childFrame` = connected, `deferralTimeout` is cancelled
- Top frame widgets blocked by `isOnline() → false`
- Child Kitt bubbles up and displays in the top frame as delegated

---

## 3. Other Property (`/en/roomsandrates/iframe/1015538`) — Deferral with Different siteId

**Expected state:**
- `pageName` = `"Booking Iframe"`
- `isDeferred` = `true`

**Verify:**
- Child (property 1015538) has a **different siteId** than the top frame
- If top frame has an active Kitt → child Kitt should destroy it and re-show with its own data
- Validates that delegation works across different properties

---

## 4. No THN Script (`/en/roomsandrates/iframe/9999999`) — Deferral Timeout Fallback

**Expected state:**
- `pageName` = `"Booking Iframe"`
- `isDeferred` = `true` (initially)

**Verify:**
- Iframe at `/en/roomsandrates/9999999` has **no THN script**
- No `thn_ping` arrives → awakening probes expire
- After **10 seconds**, `deferralTimeout` fires:
  - `isDeferred` becomes `false`
  - `pageCheck({ force: true })` re-triggers
  - Top frame widgets evaluate and execute normally

---

## 5. SPA Navigation: Booking Iframe → Index

**Verify:**
- Navigating back to Index triggers `thn_page_unload_tentative` from the child
- `childFrame` is deleted, `isDeferred` = `false`
- `thn:child-frame.disconnected` cleans up delegated Kitt state
- `pageCheck({ force: true })` re-evaluates widgets

---

## 6. SPA Navigation: Between Booking Iframes

**Verify:**
- Switching from one Booking Iframe to another (e.g., Same Property → Other Property)
- Previous child disconnects cleanly
- New child connects (potentially with a different siteId)
- Deferral and delegation state transitions are clean with no stale references
