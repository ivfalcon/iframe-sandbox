// Shared booking engine debug module
// Reads data-variant from <body> for console.log prefix
const variant = document.body.dataset.variant || 'Child';

// Debug polling — null-checks each element so variants can omit debug fields
setInterval(() => {
  const iframedEl = document.getElementById('dbg-iframed');
  if (iframedEl) {
    const isIframed = window.self !== window.top;
    iframedEl.textContent = String(isIframed);
    iframedEl.className = 'value ' + String(isIframed);
  }

  const thnEl = document.getElementById('dbg-thn');
  if (thnEl) {
    const thnAvailable = !!(window.thn?.data);
    thnEl.textContent = String(thnAvailable);
    thnEl.className = 'value ' + String(thnAvailable);
  }

  const pathEl = document.getElementById('dbg-path');
  if (pathEl) {
    pathEl.textContent = location.pathname;
  }

  if (window.thn?.data) {
    const companionEl = document.getElementById('dbg-companion');
    if (companionEl) companionEl.textContent = window.thn.data.companionOrigin || '-';

    const pageEl = document.getElementById('dbg-page');
    if (pageEl) pageEl.textContent = window.thn.data.pageName || '-';
  }
}, 500);

// postMessage listener with counter (dbg-msgs only exists in noscript variant)
let msgCount = 0;
window.addEventListener('message', (event) => {
  const action = event.data?.action;
  if (!action) return;
  msgCount++;

  const msgsEl = document.getElementById('dbg-msgs');
  if (msgsEl) msgsEl.textContent = String(msgCount);

  console.log(`[${variant}] Received: ${action}`, event.data);
});
