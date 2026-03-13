# Hotel Sandbox

Testing environment for the THN Agent script deferral mechanism. Simulates a hotel website (SPA) with multiple iframe scenarios to verify parent-child frame communication, widget deferral, and timeout fallback behavior.

## Quick Start

```bash
deno task dev
```

Open `http://localhost:3000/en/` in your browser.

## Deploy

Ready for [Deno Deploy](https://deno.com/deploy). Connect the repository and Deno Deploy will use `main.ts` as the entry point automatically.

## Test Scenarios

The sandbox provides four pages accessible from the navigation bar:

| Page | Top Frame URL | Child Iframe | What it tests |
|------|--------------|-------------|---------------|
| **Index** | `/en/` | None | Normal widget execution, no deferral |
| **Same Property** | `/en/roomsandrates/iframe/1015553` | Property 1015553 | Deferral with same siteId, child connects |
| **Other Property** | `/en/roomsandrates/iframe/1015538` | Property 1015538 | Deferral with different siteId, Kitt destroy + re-show |
| **No THN Script** | `/en/roomsandrates/iframe/9999999` | No script | 10s deferral timeout fallback |

SPA navigation between pages tests child disconnection and deferral state cleanup.

See [docs/test-cases.md](docs/test-cases.md) for detailed expected behavior and verification steps.

## Project Structure

```
iframe-sandbox/
├── config.ts                      # Source of truth for properties, IDs, and account key
├── main.ts                        # Deno server (imports config, entry point for Deno Deploy)
├── index.html                     # SPA top frame with THN script (property 1015553)
├── booking-engine.html            # Booking engine — same property (1015553, engine 25)
├── booking-engine-other.html      # Booking engine — different property (1015538, engine 25)
├── booking-engine-noscript.html   # Booking engine — no THN script installed
├── static/
│   ├── css/
│   │   ├── top-frame.css          # Styles for the SPA top frame (index.html)
│   │   └── booking-engine.css     # Shared styles for all booking engines (CSS custom properties)
│   └── js/
│       ├── top-frame.js           # SPA router, debug panel, postMessage interceptor, state poller
│       └── booking-engine-debug.js # Shared debug polling + postMessage logging for iframes
├── deno.json                      # Deno config and tasks
├── docs/
│   └── test-cases.md              # Detailed test case documentation
└── README.md
```

## Properties

| Property | Hotel ID | Engine | Role |
|----------|----------|--------|------|
| 1015553 | 1091125 | 25 | Top frame + same-property child |
| 1015538 | 1091113 | 25 | Different-property child |

## Debug Panel

The top frame includes a fixed debug panel at the bottom showing:

- **globalState** values in real time (`isDeferred`, `childFrame`, `pageName`, etc.)
- **postMessage log** for parent-child communication (`thn_awake`, `thn_ping`, `thn_pong`, etc.)
- **State transitions** for deferral and child connection changes

Each booking engine iframe has its own debug panel showing `isIframed`, `companionOrigin`, and `pageName`.
