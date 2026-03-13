import { extname, join, dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const DIR = dirname(fromFileUrl(import.meta.url));

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Route patterns matching the property's page config:
//   "Rooms and Rates": ^(\/\w+\/roomsandrates(\/nested)?\/[0-9]+)\/?$
//   This is the URL the iframe loads — serve the appropriate booking-engine HTML
const BOOKING_ENGINE_PATTERN =
  /^\/\w+\/roomsandrates(?:\/nested)?\/([0-9]+)\/?$/;

// Map property IDs to their booking engine HTML files
const BOOKING_ENGINE_FILES: Record<string, string> = {
  "1015553": "booking-engine.html", // Same property as top frame
  "1015538": "booking-engine-other.html", // Different property (different siteId)
  "9999999": "booking-engine-noscript.html", // No THN script installed
};

async function serveFile(filePath: string): Promise<Response> {
  try {
    const content = await Deno.readFile(filePath);
    const ext = extname(filePath);
    return new Response(content, {
      headers: { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(filePath);
    return stat.isFile;
  } catch {
    return false;
  }
}

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route: Booking engine iframe (matches "Rooms and Rates" URL pattern)
    // e.g. /en/roomsandrates/1015553, /en/roomsandrates/1015538, /en/roomsandrates/9999999
    const beMatch = pathname.match(BOOKING_ENGINE_PATTERN);
    if (beMatch) {
      const propertyId = beMatch[1];
      const fileName = BOOKING_ENGINE_FILES[propertyId] || "booking-engine.html";
      return serveFile(join(DIR, fileName));
    }

    // Serve static files directly (booking-engine.html, etc.)
    const filePath = join(DIR, pathname);
    if (await fileExists(filePath)) {
      return serveFile(filePath);
    }

    // SPA fallback: serve index.html for all other routes
    // e.g. /en/, /en/roomsandrates/iframe/1015553
    return serveFile(join(DIR, "index.html"));
  },
} satisfies Deno.ServeDefaultExport;
