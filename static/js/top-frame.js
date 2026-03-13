// =========================================================================
// SPA Navigation
// =========================================================================
// URL patterns that match the property's page config:
//   Index:          /en/              (matches ^\\/?(^(\\/(\w{2}\\/|...))\\/?$)
//   Booking Iframe: /en/roomsandrates/iframe/1015553  (matches ^\\/\\w+\\/roomsandrates\\/iframe\\/[0-9]+\\/?$)
const ROUTES = {
  index: '/en/',
  bookingIframe: '/en/roomsandrates/iframe/1015553',
  bookingIframeOther: '/en/roomsandrates/iframe/1015538',
  bookingIframeNoscript: '/en/roomsandrates/iframe/9999999',
};

function getPageId(path) {
  const p = path.replace(/\/$/, '') || path; // normalize trailing slash
  if (p === ROUTES.bookingIframeNoscript) return 'booking-iframe-noscript';
  if (p === ROUTES.bookingIframeOther) return 'booking-iframe-other';
  if (p === ROUTES.bookingIframe) return 'booking-iframe';
  return 'index';
}

function navigateTo(path) {
  history.pushState({}, '', path);
  updateActivePage();
}

window.addEventListener('popstate', updateActivePage);

function updateActivePage() {
  const path = location.pathname;
  const pageId = getPageId(path);

  // Update nav path display
  document.getElementById('nav-path').textContent = path;

  // Hide all pages, show active
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const activePage = document.getElementById('page-' + pageId);
  if (activePage) activePage.classList.add('active');

  // Update nav links
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });

  // Load/unload all booking iframes
  const iframes = {
    'booking-iframe':          { el: document.getElementById('booking-engine-iframe'),          childPath: '/en/roomsandrates/1015553' },
    'booking-iframe-other':    { el: document.getElementById('booking-engine-iframe-other'),    childPath: '/en/roomsandrates/1015538' },
    'booking-iframe-noscript': { el: document.getElementById('booking-engine-iframe-noscript'), childPath: '/en/roomsandrates/9999999' },
  };

  Object.entries(iframes).forEach(([id, { el, childPath }]) => {
    if (!el) return;
    if (pageId === id) {
      const bookingUrl = location.origin + childPath;
      if (!el.src.includes(childPath)) {
        el.src = bookingUrl;
      }
    } else {
      if (el.src) el.src = '';
    }
  });

  if (pageId === 'index') {
    debugLog('Navigated to Index page: ' + path, 'event');
  } else {
    debugLog('Navigated to Booking Iframe page (' + pageId + '): ' + path, 'event');
  }
}

// =========================================================================
// Debug Panel
// =========================================================================
let debugCollapsed = false;

function toggleDebugPanel() {
  debugCollapsed = !debugCollapsed;
  document.getElementById('debug-panel').classList.toggle('collapsed', debugCollapsed);
  document.getElementById('debug-toggle').textContent = debugCollapsed ? '[expand]' : '[collapse]';
}

function debugLog(msg, type = '') {
  const logEl = document.getElementById('debug-log');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.innerHTML = `<span class="time">${time}</span> <span class="msg">${msg}</span>`;
  logEl.prepend(entry);
  while (logEl.children.length > 100) logEl.removeChild(logEl.lastChild);
}

function updateStateGrid() {
  const grid = document.getElementById('state-grid');
  const gs = window.thn?.data;
  if (!gs) {
    grid.innerHTML = '<div class="state-item"><span class="label">thn.data not available yet</span></div>';
    return;
  }

  const items = [
    ['isDeferred', gs.isDeferred],
    ['childFrame', gs.childFrame ? 'connected' : null],
    ['deferralTimeout', gs.deferralTimeout ? 'active' : null],
    ['awakening', gs.awakening ? 'active' : null],
    ['pageName', gs.pageName],
    ['pageId', gs.pageId],
    ['office', gs.office],
    ['online', gs.online],
    ['mode', gs.mode],
    ['initialized', gs.initialized],
  ];

  grid.innerHTML = items.map(([label, value]) => {
    const cls = value === true ? 'true' : value === false ? 'false' : (value == null ? 'null' : '');
    const display = value == null ? 'null/undefined' : String(value);
    return `<div class="state-item"><span class="label">${label}:</span> <span class="value ${cls}">${display}</span></div>`;
  }).join('');
}

// =========================================================================
// Intercept postMessage to log parent-child communication
// =========================================================================
window.addEventListener('message', (event) => {
  const action = event.data?.action;
  if (!action) return;

  const labels = {
    thn_awake: '[postMessage] thn_awake probe sent to iframe',
    thn_ping: `[postMessage] thn_ping received from child (origin: ${event.origin})`,
    thn_pong: '[postMessage] thn_pong sent to child',
    thn_page_unload_tentative: '[postMessage] thn_page_unload_tentative from child',
  };

  if (labels[action]) {
    debugLog(labels[action], 'child');
  } else if (action.startsWith('thn_call_')) {
    debugLog(`[postMessage] ${action} (widget: ${event.data?.widgetName})`, 'deferral');
  }
});

// =========================================================================
// Poll globalState for deferral changes
// =========================================================================
let prevDeferred = undefined;
let prevChildFrame = undefined;
let prevPageName = undefined;

setInterval(() => {
  updateStateGrid();

  const gs = window.thn?.data;
  if (!gs) return;

  if (gs.isDeferred !== prevDeferred) {
    debugLog(`globalState.isDeferred changed: ${prevDeferred} -> ${gs.isDeferred}`, 'deferral');
    prevDeferred = gs.isDeferred;
  }
  if (!!gs.childFrame !== !!prevChildFrame) {
    const state = gs.childFrame ? 'CONNECTED' : 'DISCONNECTED';
    debugLog(`globalState.childFrame: ${state}`, 'child');
    prevChildFrame = !!gs.childFrame;
  }
  if (gs.pageName !== prevPageName) {
    debugLog(`Page detected: "${gs.pageName || '<none>'}"`, 'event');
    prevPageName = gs.pageName;
  }
}, 200);

// =========================================================================
// Expose to window (needed by inline onclick handlers)
// =========================================================================
window.navigateTo = navigateTo;
window.toggleDebugPanel = toggleDebugPanel;

// =========================================================================
// Init
// =========================================================================
updateActivePage();
debugLog('Sandbox loaded. THN script initializing...', 'event');
