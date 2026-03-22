/* SyncShop — Client-side JS */

/* FAQ accordion */
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('open');
  });
});

/* Toast helper */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* Sync Now */
const syncBtn = document.getElementById('syncNowBtn');
if (syncBtn) {
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span class="spinner"></span> Syncing…';
    try {
      const res = await fetch('/sync/now', { method: 'POST' });
      const data = await res.json();
      showToast(`Sync complete — ${data.synced} SKUs synced, ${data.errors} errors`, 'success');
      const lastSync = document.getElementById('lastSync');
      if (lastSync) {
        const now = new Date();
        lastSync.textContent = `Today at ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} ${now.getHours() >= 12 ? 'PM' : 'AM'} — ${data.synced} SKUs synced, ${data.errors} errors`;
      }
    } catch {
      showToast('Sync failed — please try again', 'error');
    }
    syncBtn.disabled = false;
    syncBtn.innerHTML = '⟳ Sync Now';
  });
}

/* Connect buttons */
function simulateConnect(platform, form) {
  const btn = form.querySelector('button[type=submit]');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Connecting…';
  setTimeout(() => {
    window.location.href = `/dashboard?connected=${platform}`;
  }, 2000);
}

const etsyForm = document.getElementById('etsyForm');
if (etsyForm) {
  etsyForm.addEventListener('submit', e => {
    e.preventDefault();
    simulateConnect('etsy', etsyForm);
  });
}

const shopifyForm = document.getElementById('shopifyForm');
if (shopifyForm) {
  shopifyForm.addEventListener('submit', e => {
    e.preventDefault();
    simulateConnect('shopify', shopifyForm);
  });
}

/* Connected banner on dashboard */
const params = new URLSearchParams(window.location.search);
const connected = params.get('connected');
if (connected) {
  const banner = document.getElementById('connectedBanner');
  if (banner) {
    const msg = connected === 'etsy'
      ? 'Etsy connected! Now connect Shopify →'
      : 'Shopify connected! Your stores are now syncing.';
    banner.textContent = msg;
    banner.style.display = 'block';
    // clean URL
    history.replaceState({}, '', '/dashboard');
  }
}

/* Billing toggle */
const billingToggle = document.getElementById('billingToggle');
if (billingToggle) {
  const prices = { starter: [9.99, 7.99], growth: [19.99, 15.99], pro: [49.99, 39.99] };
  billingToggle.addEventListener('change', () => {
    const annual = billingToggle.checked;
    Object.entries(prices).forEach(([plan, [monthly, yearly]]) => {
      const el = document.getElementById(`price-${plan}`);
      if (el) el.textContent = `$${annual ? yearly : monthly}`;
    });
  });
}
