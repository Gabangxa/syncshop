const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Shared layout helpers ───────────────────────────────────────────────────

const nav = (active = '') => `
<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">SyncShop</a>
    <ul class="nav-links">
      <li><a href="/#how-it-works">Features</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/connect">Connect</a></li>
      <li><a href="/connect" class="btn btn-primary">Get Started</a></li>
    </ul>
  </div>
</nav>`;

const footer = () => `
<footer>
  <p>© 2026 SyncShop. Built for Etsy & Shopify sellers. · <a href="/pricing">Pricing</a> · <a href="/connect">Connect</a></p>
</footer>`;

const page = (title, body, extraHead = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — SyncShop</title>
  <link rel="stylesheet" href="/style.css">
  ${extraHead}
</head>
<body>
  ${nav()}
  ${body}
  ${footer()}
  <div class="toast" id="toast"></div>
  <script src="/app.js"></script>
</body>
</html>`;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const syncHistory = [
  { time: 'Today 3:14 PM',      skus: 342, errors: 0, status: 'success' },
  { time: 'Today 2:44 PM',      skus: 342, errors: 0, status: 'success' },
  { time: 'Today 2:14 PM',      skus: 341, errors: 1, status: 'error'   },
  { time: 'Today 1:44 PM',      skus: 340, errors: 0, status: 'success' },
  { time: 'Yesterday 11:14 PM', skus: 338, errors: 0, status: 'success' },
];

const faqs = [
  { q: 'Is it safe to connect my Etsy and Shopify accounts?',
    a: 'Yes. We use official OAuth 2.0 — we only request inventory read/write permissions. We never see or store your payment data, customer data, or shop passwords.' },
  { q: 'What happens if I sell the same item on both platforms at the same time?',
    a: 'SyncShop detects conflicts within seconds and applies your conflict rule (e.g. "Shopify wins"). The losing platform\'s quantity is updated immediately to prevent a double-sale.' },
  { q: 'How often does syncing happen?',
    a: 'Growth plan syncs every 30 minutes, Starter plan syncs hourly, and Pro plan syncs in near-real-time (under 5 minutes). You can also trigger a manual sync anytime.' },
  { q: 'Will you support Amazon, eBay, or other platforms?',
    a: 'Amazon and eBay support are on our roadmap for Q3 2026. Pro plan subscribers will get early access. Join the waitlist at the bottom of the page.' },
  { q: 'What if my sync has an error?',
    a: 'We send an email alert immediately, log the error with details, and retry automatically. You can view the full error log on your dashboard.' },
];

const pricingFaqs = [
  ...faqs,
  { q: 'Can I switch plans?',
    a: 'Yes, you can upgrade or downgrade anytime. Upgrades take effect immediately; downgrades take effect at the next billing cycle.' },
  { q: 'Is there a free trial?',
    a: 'We offer a 14-day money-back guarantee. No credit card required to start.' },
  { q: 'Do you offer refunds?',
    a: 'Yes — full refund within 14 days of purchase, no questions asked.' },
];

const testimonials = [
  { text: '"I was manually exporting CSVs every Sunday night. SyncShop killed that habit in 5 minutes. Worth every penny."',
    author: 'Mara K.', role: 'Etsy seller — HandmadeByMara · 800+ sales' },
  { text: '"Overselling was costing me bad reviews. Since SyncShop, zero oversells in 4 months. My shop rating went from 4.6 to 4.9."',
    author: 'James T.', role: 'Ceramics shop owner · Etsy + Shopify' },
  { text: '"Setup literally took 4 minutes. I connected Etsy, connected Shopify, and it just worked. I forgot it was even running."',
    author: 'Priya R.', role: 'Textile artist · 2,000+ SKUs' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const renderFaqs = (items) => items.map(f => `
  <div class="faq-item">
    <div class="faq-q">${f.q} <span class="arrow">▾</span></div>
    <div class="faq-a">${f.a}</div>
  </div>`).join('');

const renderPricingCards = (annual = false) => {
  const plans = [
    { name: 'Starter', monthly: 9.99, annual: 7.99, desc: 'Perfect for new sellers', id: 'starter',
      features: ['Up to 1,000 SKUs', 'Hourly sync', 'Etsy + Shopify', '1 conflict rule', '7-day sync history'] },
    { name: 'Growth', monthly: 19.99, annual: 15.99, desc: 'Most popular for active sellers', id: 'growth', popular: true,
      features: ['Up to 10,000 SKUs', '30-minute sync', 'Etsy + Shopify', 'Custom conflict rules', '30-day sync history', 'Email alerts'] },
    { name: 'Pro', monthly: 49.99, annual: 39.99, desc: 'For high-volume power sellers', id: 'pro',
      features: ['Unlimited SKUs', 'Near-real-time sync (<5 min)', 'Etsy + Shopify', 'Advanced rules + webhooks', '90-day sync history', 'Priority support', 'Amazon (coming soon)'] },
  ];

  return plans.map(p => `
    <div class="pricing-card ${p.popular ? 'popular' : ''}">
      ${p.popular ? '<div class="popular-badge">⭐ Most Popular</div>' : ''}
      <div class="plan-name">${p.name}</div>
      <div class="plan-price">$<span id="price-${p.id}">${annual ? p.annual : p.monthly}</span><span>/mo</span></div>
      <div class="plan-desc">${p.desc}</div>
      <ul class="plan-features">
        ${p.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <a href="/connect" class="btn btn-primary" style="width:100%;justify-content:center;">
        ${p.popular ? 'Start Free Trial' : 'Get Started'}
      </a>
    </div>`).join('');
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /
app.get('/', (req, res) => {
  const body = `
  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <h1>Keep your <span>Etsy and Shopify</span><br>inventory in sync. Automatically.</h1>
      <p>Stop manually updating stock levels. SyncShop syncs both stores every 30 minutes — so you never oversell again.</p>
      <div class="hero-cta">
        <a href="/connect" class="btn btn-primary btn-lg">Start free — no credit card</a>
        <a href="#how-it-works" class="btn btn-outline btn-lg">See how it works</a>
      </div>
    </div>
  </section>

  <!-- PAIN -->
  <section style="padding:48px 0;background:#fff;">
    <div class="container">
      <div class="pain-box">
        💥 <strong>Sold your last item on Etsy but forgot to update Shopify?</strong><br>
        We fix that. SyncShop keeps your inventory quantities identical across both platforms — automatically, around the clock.
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section id="how-it-works">
    <div class="container">
      <h2 class="section-title">How it works</h2>
      <p class="section-sub">Get started in 5 minutes. No CSV exports. No developer needed.</p>
      <div class="steps">
        <div class="step card">
          <div class="step-num">1</div>
          <h3>Connect Etsy</h3>
          <p>Authorize SyncShop to read and update your Etsy inventory. Takes 60 seconds.</p>
        </div>
        <div class="step card">
          <div class="step-num">2</div>
          <h3>Connect Shopify</h3>
          <p>Enter your myshopify.com URL and authorize. We only access inventory — nothing else.</p>
        </div>
        <div class="step card">
          <div class="step-num">3</div>
          <h3>Done — syncs every 30 min</h3>
          <p>Sit back. SyncShop runs in the background, keeping stock levels identical on both platforms.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section style="background:#fff;">
    <div class="container">
      <h2 class="section-title">Simple, transparent pricing</h2>
      <p class="section-sub">Start free for 14 days. No credit card required.</p>
      <div class="pricing-grid">
        ${renderPricingCards()}
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section>
    <div class="container">
      <h2 class="section-title">Loved by Etsy sellers</h2>
      <p class="section-sub">Real sellers, real results.</p>
      <div class="testimonials-grid">
        ${testimonials.map(t => `
        <div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <p class="testimonial-text">${t.text}</p>
          <div class="testimonial-author">${t.author}</div>
          <div class="testimonial-role">${t.role}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section style="background:#fff;">
    <div class="container">
      <h2 class="section-title">Frequently asked questions</h2>
      <div class="faq">
        ${renderFaqs(faqs)}
      </div>
    </div>
  </section>

  <!-- CTA FOOTER -->
  <div class="cta-footer">
    <h2>Connect your first store in 5 minutes →</h2>
    <p>Join thousands of sellers who've stopped overselling forever.</p>
    <a href="/connect" class="btn btn-white btn-lg">Get started free</a>
  </div>`;

  res.send(page('Sync Etsy & Shopify Inventory', body));
});

// GET /dashboard
app.get('/dashboard', (req, res) => {
  const rows = syncHistory.map(r => `
    <tr>
      <td>${r.time}</td>
      <td>${r.skus}</td>
      <td>${r.errors}</td>
      <td><span class="badge badge-${r.status}">${r.status === 'success' ? '✓ Success' : '✗ Error'}</span></td>
    </tr>`).join('');

  const body = `
  <div class="container">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Your inventory sync is running smoothly.</p>
    </div>

    <div id="connectedBanner" class="banner" style="display:none;"></div>

    <!-- Platform status -->
    <div class="dashboard-grid" style="margin-bottom:24px;">
      <div class="card platform-card">
        <div class="platform-logo logo-etsy">E</div>
        <div class="platform-info">
          <h3>Etsy</h3>
          <p>HandmadeByMara</p>
        </div>
        <div class="status-dot" title="Connected"></div>
      </div>
      <div class="card platform-card">
        <div class="platform-logo logo-shopify">S</div>
        <div class="platform-info">
          <h3>Shopify</h3>
          <p>maracraft.myshopify.com</p>
        </div>
        <div class="status-dot" title="Connected"></div>
      </div>
    </div>

    <!-- Stats -->
    <div class="dashboard-grid" style="margin-bottom:24px;">
      <div class="card stat-card">
        <div class="stat-val">342</div>
        <div class="stat-label">SKUs synced (last run)</div>
      </div>
      <div class="card stat-card">
        <div class="stat-val" style="color:#22C55E;">0</div>
        <div class="stat-label">Errors (last 7 days)</div>
      </div>
    </div>

    <!-- Sync controls -->
    <div class="card" style="margin-bottom:24px;">
      <div class="sync-bar">
        <div class="sync-info">
          <strong>Last sync:</strong>
          <div class="sync-time" id="lastSync">Today at 3:14 PM — 342 SKUs synced, 0 errors</div>
          <div class="sync-time" style="margin-top:4px;">Next auto-sync in <strong>23 minutes</strong></div>
        </div>
        <button class="btn btn-primary" id="syncNowBtn">⟳ Sync Now</button>
      </div>
      <div class="conflict-row">
        <label for="conflictRule"><strong>Conflict rule:</strong></label>
        <select id="conflictRule">
          <option selected>Shopify wins (recommended)</option>
          <option>Etsy wins</option>
          <option>Lower quantity wins (safest)</option>
          <option>Higher quantity wins</option>
        </select>
      </div>
    </div>

    <!-- Sync history -->
    <div class="card" style="margin-bottom:24px;">
      <h2 style="margin-bottom:16px;font-size:1.1rem;">Sync History</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>SKUs Synced</th>
            <th>Errors</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Error log -->
    <div class="card" style="margin-bottom:48px;">
      <details>
        <summary>Error Log (last 7 days)</summary>
        <p class="error-ok">✓ No errors in the last 7 days</p>
      </details>
    </div>
  </div>`;

  res.send(page('Dashboard', body));
});

// GET /connect
app.get('/connect', (req, res) => {
  const body = `
  <section>
    <div class="container">
      <h2 class="section-title">Connect your stores</h2>
      <p class="section-sub">Connect both platforms to start syncing inventory automatically.</p>

      <div class="connect-grid">
        <!-- Etsy -->
        <div class="card connect-card">
          <div class="connect-logo-big logo-etsy">E</div>
          <h2>Connect your Etsy shop</h2>
          <p>Authorize SyncShop to read and update your Etsy inventory quantities.</p>
          <form id="etsyForm" action="/connect/etsy" method="POST">
            <button type="submit" class="btn btn-etsy" style="width:100%;justify-content:center;">
              Connect Etsy
            </button>
          </form>
        </div>

        <!-- Shopify -->
        <div class="card connect-card">
          <div class="connect-logo-big logo-shopify">S</div>
          <h2>Connect your Shopify store</h2>
          <p>Enter your Shopify domain and authorize inventory read/write access.</p>
          <form id="shopifyForm" action="/connect/shopify" method="POST">
            <input type="text" class="myshopify-input" name="store" placeholder="yourstore.myshopify.com" />
            <button type="submit" class="btn btn-shopify" style="width:100%;justify-content:center;">
              Connect Shopify
            </button>
          </form>
        </div>
      </div>

      <div class="security-note">
        🔒 We only request inventory read/write permissions. We never access your payment data.
      </div>
    </div>
  </section>`;

  res.send(page('Connect Platforms', body));
});

// POST /connect/etsy
app.post('/connect/etsy', (req, res) => {
  // Simulated OAuth — JS handles the 2-second delay and redirect
  res.redirect('/dashboard?connected=etsy');
});

// POST /connect/shopify
app.post('/connect/shopify', (req, res) => {
  res.redirect('/dashboard?connected=shopify');
});

// POST /sync/now
app.post('/sync/now', (req, res) => {
  setTimeout(() => {
    res.json({ synced: 342, errors: 0 });
  }, 2000);
});

// GET /pricing
app.get('/pricing', (req, res) => {
  const featureRows = [
    { label: 'SKU limit',           starter: '1,000',      growth: '10,000',     pro: 'Unlimited'     },
    { label: 'Sync frequency',      starter: 'Hourly',     growth: '30 minutes', pro: '<5 minutes'    },
    { label: 'Platforms',           starter: 'Etsy+Shopify', growth: 'Etsy+Shopify', pro: 'Etsy+Shopify+Amazon*' },
    { label: 'Conflict rules',      starter: '1',          growth: 'Custom',     pro: 'Advanced+Webhooks' },
    { label: 'Sync history',        starter: '7 days',     growth: '30 days',    pro: '90 days'       },
    { label: 'Priority support',    starter: '✗',          growth: '✗',          pro: '✓'             },
    { label: 'Amazon (coming soon)',starter: '✗',          growth: '✗',          pro: 'Early access'  },
  ].map(r => `
    <tr>
      <td>${r.label}</td>
      <td style="text-align:center;">${r.starter}</td>
      <td style="text-align:center;font-weight:600;">${r.growth}</td>
      <td style="text-align:center;">${r.pro}</td>
    </tr>`).join('');

  const body = `
  <section>
    <div class="container">
      <h2 class="section-title">Simple, transparent pricing</h2>
      <p class="section-sub">14-day money-back guarantee. No credit card to start.</p>

      <!-- Billing toggle -->
      <div class="billing-toggle">
        <span>Monthly</span>
        <label class="toggle-switch">
          <input type="checkbox" id="billingToggle">
          <span class="toggle-slider"></span>
        </label>
        <span>Annual <span class="discount-badge">Save 20%</span></span>
      </div>

      <!-- Pricing cards -->
      <div class="pricing-grid">
        ${renderPricingCards()}
      </div>

      <!-- Feature comparison table -->
      <h3 style="text-align:center;margin:48px 0 24px;font-size:1.3rem;">Full feature comparison</h3>
      <div class="feature-table-wrap">
        <table class="feature-table">
          <thead>
            <tr>
              <th style="text-align:left;">Feature</th>
              <th style="text-align:center;">Starter</th>
              <th style="text-align:center;color:var(--primary);">Growth ⭐</th>
              <th style="text-align:center;">Pro</th>
            </tr>
          </thead>
          <tbody>${featureRows}</tbody>
        </table>
      </div>

      <!-- Guarantee -->
      <div class="guarantee">
        🛡️ <strong>14-day money-back guarantee</strong> — if SyncShop isn't right for you, we refund 100%, no questions asked.
      </div>

      <!-- Extended FAQ -->
      <h3 style="text-align:center;margin:48px 0 24px;font-size:1.3rem;">Frequently asked questions</h3>
      <div class="faq">
        ${renderFaqs(pricingFaqs)}
      </div>
    </div>
  </section>`;

  res.send(page('Pricing', body));
});

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SyncShop running on http://0.0.0.0:${PORT}`);
});
