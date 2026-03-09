/**
 * Static site builder — generates HTML, CSS, and JS from a SiteConfig.
 * This is the static export equivalent of the runtime's React-based SiteRenderer.
 *
 * The output is a set of editable files:
 *   index.html  — full page linking to styles.css and script.js
 *   styles.css  — theme-driven via CSS custom properties in :root
 *   script.js   — mobile nav toggle + contact form (STATIC_PLUS)
 */

export interface BuildOutput {
  html: string;
  css: string;
  js: string;
}

export interface BuildOptions {
  siteId: string;
  showForm: boolean;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function renderStaticSite(
  config: Record<string, any>,
  options: BuildOptions,
): BuildOutput {
  const css = buildCSS(config);
  const js = buildJS(options);
  const html = buildHTML(config, options);
  return { html, css, js };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// CSS Builder
// ---------------------------------------------------------------------------

/**
 * Ensure a color value is a valid hex color for alpha suffix operations.
 * Returns the hex color, or a fallback if the input isn't hex.
 */
function normalizeHex(color: string, fallback: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    // Expand shorthand: #abc → #aabbcc
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function buildCSS(config: Record<string, any>): string {
  const theme = config.theme || {};
  const primary = normalizeHex(theme.primaryColor || "#1a56db", "#1a56db");
  const fontBody = theme.fontBody || "Inter";
  const fontHeading = theme.fontHeading || "Inter";
  const textColor = theme.textColor || "#111827";
  const bgColor = theme.backgroundColor || "#ffffff";

  return `/* Forge Static Site — Edit :root to change theme colors */
:root {
  --primary: ${primary};
  --primary-dark: ${primary}dd;
  --primary-overlay: ${primary}cc;
  --primary-badge: ${primary}12;
  --primary-tint: ${primary}08;
  --text: ${textColor};
  --bg: ${bgColor};
  --font-body: '${fontBody}', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading: '${fontHeading}', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Reset */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-body);
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.2;
}
img { max-width: 100%; }
a { text-decoration: none; }

/* ---- Header ---- */
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 5%;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}
.site-header .logo {
  font-weight: 700;
  font-size: 20px;
  color: var(--primary);
}
.site-header .logo img {
  height: 40px;
}
.site-header .nav {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 14px;
}
.site-header .nav a {
  color: #374151;
  font-weight: 500;
}
.site-header .phone-cta {
  background-color: var(--primary);
  color: #fff;
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}
.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #374151;
}

/* ---- Hero ---- */
.hero {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  padding: 100px 5% 80px;
  text-align: center;
}
.hero-inner {
  max-width: 800px;
  margin: 0 auto;
}
.hero h1 {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.1;
}
.hero .subtitle {
  font-size: clamp(16px, 2vw, 20px);
  opacity: 0.9;
  margin-bottom: 36px;
  line-height: 1.6;
}
.hero .ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.hero .cta-primary {
  background-color: #fff;
  color: var(--primary);
  padding: 14px 36px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
}
.hero .cta-secondary {
  background-color: transparent;
  color: #fff;
  padding: 14px 36px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid rgba(255,255,255,0.4);
}

/* ---- Carriers Trust Bar ---- */
.carriers {
  padding: 32px 5%;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.carriers-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.carriers .label {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 20px;
}
.carriers .badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.carriers .badge-item {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
}

/* ---- Services ---- */
.services {
  padding: 80px 5%;
  background-color: #f9fafb;
}
.services-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.services h2 {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}
.services .subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 18px;
  margin-bottom: 48px;
}
.services .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 32px;
}
.services .card {
  background-color: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.services .badge {
  width: 48px;
  height: 48px;
  background-color: var(--primary-badge);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--primary);
  font-weight: 700;
  font-size: 18px;
}
.services .card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.services .card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.7;
}

/* ---- Why Choose Us ---- */
.why-choose-us {
  padding: 80px 5%;
}
.why-choose-us-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.why-choose-us h2 {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
}
.why-choose-us .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.why-choose-us .card {
  background-color: #fff;
  padding: 32px 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
}
.why-choose-us .icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: var(--primary-badge);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--primary);
}
.why-choose-us .card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}
.why-choose-us .card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.7;
}

/* ---- About ---- */
.about {
  padding: 80px 5%;
}
.about-inner {
  max-width: 900px;
  margin: 0 auto;
}
.about h2 {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
}
.about .description {
  font-size: 16px;
  line-height: 1.8;
  color: #4b5563;
  text-align: center;
  white-space: pre-line;
}
.about .highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 40px;
}
.about .highlight {
  padding: 16px 20px;
  background-color: var(--primary-tint);
  border-radius: 8px;
  border-left: 4px solid var(--primary);
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* ---- Testimonials ---- */
.testimonials {
  padding: 80px 5%;
  background-color: #f9fafb;
}
.testimonials-inner {
  max-width: 1000px;
  margin: 0 auto;
}
.testimonials h2 {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
}
.testimonials .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.testimonials .card {
  background-color: #fff;
  padding: 28px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.testimonials .quote {
  font-size: 32px;
  color: #d1d5db;
  margin-bottom: 12px;
}
.testimonials .card p {
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 20px;
}
.testimonials .author {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}
.testimonials .author strong {
  font-size: 14px;
}
.testimonials .author .role {
  display: block;
  font-size: 13px;
  color: #9ca3af;
}

/* ---- FAQ ---- */
.faq {
  padding: 80px 5%;
}
.faq-inner {
  max-width: 800px;
  margin: 0 auto;
}
.faq h2 {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
}
.faq-item {
  padding: 20px 0;
  border-bottom: 1px solid #e5e7eb;
}
.faq-item h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}
.faq-item p {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.7;
}

/* ---- Contact ---- */
.contact {
  padding: 80px 5%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-overlay) 100%);
  color: #fff;
}
.contact-inner {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
}
.contact h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
}
.contact .subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
  line-height: 1.5;
}
.contact .info-card {
  background-color: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 32px;
}
.contact .info-card .phone {
  margin-bottom: 16px;
  font-size: 22px;
}
.contact .info-card .phone a {
  color: #fff;
  font-weight: 700;
}
.contact .info-card .email {
  margin-bottom: 16px;
}
.contact .info-card .email a {
  color: #fff;
  font-size: 16px;
}
.contact .info-card .address {
  margin-bottom: 16px;
  opacity: 0.9;
  font-size: 15px;
}
.contact .info-card .hours {
  opacity: 0.8;
  font-size: 14px;
}
.contact .cta {
  display: inline-block;
  margin-top: 28px;
  background-color: #fff;
  color: var(--primary);
  padding: 14px 44px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
}
.contact form {
  text-align: left;
}
.contact .form-error {
  background-color: rgba(220,38,38,0.2);
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  display: none;
}
.contact .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.contact .form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  background-color: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 15px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}
.contact .form-input::placeholder {
  color: rgba(255,255,255,0.6);
}
.contact .form-input.full {
  margin-bottom: 12px;
}
.contact textarea.form-input {
  resize: vertical;
  margin-bottom: 16px;
}
.contact .form-submit {
  width: 100%;
  padding: 14px;
  background-color: #fff;
  color: var(--primary);
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  font-family: inherit;
}
.contact .form-submit:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.contact .form-success {
  background-color: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 40px;
  font-size: 18px;
}
.contact .form-success p {
  margin-top: 8px;
  opacity: 0.9;
}

/* ---- Footer ---- */
.site-footer {
  background-color: #111827;
  color: #d1d5db;
  padding: 48px 5% 24px;
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  margin-bottom: 32px;
}
.site-footer .brand {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}
.site-footer .tagline {
  font-size: 14px;
  line-height: 1.6;
}
.site-footer .col-title {
  font-weight: 600;
  color: #fff;
  margin-bottom: 14px;
  font-size: 14px;
}
.site-footer .links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}
.site-footer .links a {
  color: #d1d5db;
}
.site-footer .info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}
.site-footer .copyright {
  border-top: 1px solid #374151;
  padding-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .site-header .nav {
    display: none;
  }
  .site-header .nav.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    padding: 16px 5%;
    border-bottom: 1px solid #e5e7eb;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero {
    padding: 60px 5% 50px;
  }
  .contact .form-row {
    grid-template-columns: 1fr;
  }
}
`;
}

// ---------------------------------------------------------------------------
// JS Builder
// ---------------------------------------------------------------------------

function buildJS(options: BuildOptions): string {
  return `/* Forge Static Site — Interactivity */

// Mobile nav toggle
(function() {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-header .nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
  }
})();

// Contact form submission
(function() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var siteId = form.getAttribute('data-site-id');
  var ctaText = form.getAttribute('data-cta-text') || 'Send Message';
  var submitBtn = form.querySelector('.form-submit');
  var errorEl = form.querySelector('.form-error');
  var wrapper = document.getElementById('contact-form-wrapper');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    if (errorEl) errorEl.style.display = 'none';

    var formData = new FormData(form);

    fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: siteId,
        formType: 'contact',
        data: {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message')
        }
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Submission failed');
      wrapper.innerHTML = '<div class="form-success"><strong>Thank you!</strong><p>We will be in touch shortly.</p></div>';
    })
    .catch(function() {
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again or call us directly.';
        errorEl.style.display = 'block';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = ctaText;
    });
  });
})();
`;
}

// ---------------------------------------------------------------------------
// HTML Builder
// ---------------------------------------------------------------------------

function buildFontLinks(config: Record<string, any>): string {
  const theme = config.theme || {};
  const fonts = new Set<string>();
  fonts.add(theme.fontBody || "Inter");
  fonts.add(theme.fontHeading || "Inter");

  return Array.from(fonts)
    .map((font) => {
      const encoded = encodeURIComponent(font);
      return `  <link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
    })
    .join("\n");
}

function buildHTML(config: Record<string, any>, options: BuildOptions): string {
  const layout = config.layout || {};
  const title = esc(config.branding?.businessName || "Site");

  const sections: string[] = [];
  sections.push(renderHeader(config));
  if (layout.showHero !== false) sections.push(renderHero(config));
  if (layout.showCarriers === true) sections.push(renderCarriers(config));
  if (layout.showServices !== false) sections.push(renderServices(config));
  if (layout.showWhyChooseUs === true) sections.push(renderWhyChooseUs(config));
  if (layout.showAbout !== false) sections.push(renderAbout(config));
  if (layout.showTestimonials !== false) sections.push(renderTestimonials(config));
  if (layout.showFaq !== false) sections.push(renderFaq(config));
  if (layout.showContact !== false) sections.push(renderContact(config, options));
  sections.push(renderFooter(config));

  const body = sections.filter(Boolean).join("\n\n");
  const fontLinks = buildFontLinks(config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
${fontLinks}
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${body}

  <script src="script.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Section Renderers
// ---------------------------------------------------------------------------

function renderHeader(config: Record<string, any>): string {
  const b = config.branding || {};
  const layout = config.layout || {};

  const logo = b.logoUrl
    ? `<img src="${esc(b.logoUrl)}" alt="${esc(b.businessName)}">`
    : esc(b.businessName || "Business");

  const phoneCta = b.phone
    ? `\n      <a href="tel:${esc(b.phone)}" class="phone-cta">${esc(b.phone)}</a>`
    : "";

  const whyUsLink = layout.showWhyChooseUs === true
    ? `\n      <a href="#why-us">Why Us</a>`
    : "";

  return `  <nav class="site-header">
    <div class="logo">${logo}</div>
    <button class="menu-toggle" aria-label="Toggle menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
    </button>
    <div class="nav">
      <a href="#services">Services</a>${whyUsLink}
      <a href="#about">About</a>
      <a href="#testimonials">Testimonials</a>
      <a href="#contact">Contact</a>${phoneCta}
    </div>
  </nav>`;
}

function renderHero(config: Record<string, any>): string {
  const h = config.hero || {};

  const secondaryCta = h.ctaSecondaryText
    ? `\n        <a href="#services" class="cta-secondary">${esc(h.ctaSecondaryText)}</a>`
    : "";

  return `  <section class="hero">
    <div class="hero-inner">
      <h1>${esc(h.headline || "Welcome")}</h1>
      <p class="subtitle">${esc(h.subheadline || "")}</p>
      <div class="ctas">
        <a href="#contact" class="cta-primary">${esc(h.ctaText || "Get Started")}</a>${secondaryCta}
      </div>
    </div>
  </section>`;
}

function renderServices(config: Record<string, any>): string {
  const s = config.services || {};
  const items = s.items || [];

  const subtitle = s.subtitle
    ? `\n      <p class="subtitle">${esc(s.subtitle)}</p>`
    : "";

  const cards = items
    .map(
      (item: any, i: number) => `
        <div class="card">
          <div class="badge">${String(i + 1).padStart(2, "0")}</div>
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.description)}</p>
        </div>`,
    )
    .join("");

  return `  <section id="services" class="services">
    <div class="services-inner">
      <h2>${esc(s.title || "Our Services")}</h2>${subtitle}
      <div class="grid">${cards}
      </div>
    </div>
  </section>`;
}

function renderCarriers(config: Record<string, any>): string {
  const carriers = config.carriers || {};
  const items: string[] = carriers.items || [];
  if (items.length === 0) return "";

  const label = carriers.title
    ? `\n      <p class="label">${esc(carriers.title)}</p>`
    : "";

  const badges = items
    .map((name: string) => `\n        <span class="badge-item">${esc(name)}</span>`)
    .join("");

  return `  <section id="carriers" class="carriers">
    <div class="carriers-inner">${label}
      <div class="badges">${badges}
      </div>
    </div>
  </section>`;
}

const WHY_CHOOSE_US_ICONS: Record<string, string> = {
  shield: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  users: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  award: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
};

function renderWhyChooseUs(config: Record<string, any>): string {
  const section = config.whyChooseUs || {};
  const items: { title: string; description: string; icon?: string }[] = section.items || [];
  if (items.length === 0) return "";

  const cards = items
    .map((item) => {
      const icon = WHY_CHOOSE_US_ICONS[item.icon || "shield"] || WHY_CHOOSE_US_ICONS.shield;
      return `
        <div class="card">
          <div class="icon">${icon}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </div>`;
    })
    .join("");

  return `  <section id="why-us" class="why-choose-us">
    <div class="why-choose-us-inner">
      <h2>${esc(section.title || "Why Choose Us")}</h2>
      <div class="grid">${cards}
      </div>
    </div>
  </section>`;
}

function renderAbout(config: Record<string, any>): string {
  const a = config.about || {};
  const highlights = a.highlights || [];

  let highlightsHtml = "";
  if (highlights.length > 0) {
    const items = highlights
      .map((h: string) => `\n          <div class="highlight">${esc(h)}</div>`)
      .join("");
    highlightsHtml = `\n      <div class="highlights">${items}
      </div>`;
  }

  return `  <section id="about" class="about">
    <div class="about-inner">
      <h2>${esc(a.title || "About Us")}</h2>
      <p class="description">${esc(a.description || "")}</p>${highlightsHtml}
    </div>
  </section>`;
}

function renderTestimonials(config: Record<string, any>): string {
  const t = config.testimonials || {};
  const items = t.items || [];
  if (items.length === 0) return "";

  const cards = items
    .map((item: any) => {
      const role = item.role
        ? `\n            <span class="role">${esc(item.role)}</span>`
        : "";
      return `
        <div class="card">
          <div class="quote">&ldquo;</div>
          <p>${esc(item.text)}</p>
          <div class="author">
            <strong>${esc(item.author)}</strong>${role}
          </div>
        </div>`;
    })
    .join("");

  return `  <section id="testimonials" class="testimonials">
    <div class="testimonials-inner">
      <h2>${esc(t.title || "What Our Clients Say")}</h2>
      <div class="grid">${cards}
      </div>
    </div>
  </section>`;
}

function renderFaq(config: Record<string, any>): string {
  const f = config.faq || {};
  const items = f.items || [];
  if (items.length === 0) return "";

  const faqItems = items
    .map(
      (item: any) => `
        <div class="faq-item">
          <h3>${esc(item.question)}</h3>
          <p>${esc(item.answer)}</p>
        </div>`,
    )
    .join("");

  return `  <section id="faq" class="faq">
    <div class="faq-inner">
      <h2>${esc(f.title || "Frequently Asked Questions")}</h2>
      <div>${faqItems}
      </div>
    </div>
  </section>`;
}

function renderContact(
  config: Record<string, any>,
  options: BuildOptions,
): string {
  const c = config.contact || {};
  const b = config.branding || {};

  const content = options.showForm
    ? renderContactForm(c, options)
    : renderContactInfo(b, c);

  return `  <section id="contact" class="contact">
    <div class="contact-inner">
      <h2>${esc(c.title || "Get in Touch")}</h2>
      <p class="subtitle">${esc(c.subtitle || "Contact us today.")}</p>
${content}
    </div>
  </section>`;
}

function renderContactInfo(b: any, c: any): string {
  const parts: string[] = [];
  if (b.phone)
    parts.push(
      `        <div class="phone"><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a></div>`,
    );
  if (b.email)
    parts.push(
      `        <div class="email"><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></div>`,
    );
  if (b.address)
    parts.push(`        <div class="address">${esc(b.address)}</div>`);
  if (b.officeHours)
    parts.push(
      `        <div class="hours">Hours: ${esc(b.officeHours)}</div>`,
    );

  const href = b.email ? `mailto:${esc(b.email)}` : "#";

  return `      <div class="info-card">
${parts.join("\n")}
      </div>
      <a href="${href}" class="cta">${esc(c.ctaText || "Contact Us")}</a>`;
}

function renderContactForm(c: any, options: BuildOptions): string {
  return `      <div id="contact-form-wrapper">
        <form id="contact-form" data-site-id="${esc(options.siteId)}" data-cta-text="${esc(c.ctaText || "Send Message")}">
          <div class="form-error"></div>
          <div class="form-row">
            <input class="form-input" name="name" placeholder="Your name" required>
            <input class="form-input" name="email" type="email" placeholder="Email address" required>
          </div>
          <input class="form-input full" name="phone" placeholder="Phone (optional)">
          <textarea class="form-input" name="message" placeholder="How can we help?" rows="4" required></textarea>
          <button type="submit" class="form-submit">${esc(c.ctaText || "Send Message")}</button>
        </form>
      </div>`;
}

function renderFooter(config: Record<string, any>): string {
  const f = config.footer || {};
  const b = config.branding || {};
  const layout = config.layout || {};

  const businessName = f.businessName || b.businessName || "Business";
  const tagline = f.tagline
    ? `\n        <p class="tagline">${esc(f.tagline)}</p>`
    : "";

  const contactInfo: string[] = [];
  if (f.phone || b.phone)
    contactInfo.push(`          <span>${esc(f.phone || b.phone)}</span>`);
  if (f.email || b.email)
    contactInfo.push(`          <span>${esc(f.email || b.email)}</span>`);
  if (f.address || b.address)
    contactInfo.push(`          <span>${esc(f.address || b.address)}</span>`);
  if (b.officeHours)
    contactInfo.push(`          <span>${esc(b.officeHours)}</span>`);

  const year = new Date().getFullYear();
  const copyright =
    f.copyright || `\u00A9 ${year} ${businessName}. All rights reserved.`;

  return `  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <div class="brand">${esc(businessName)}</div>${tagline}
      </div>
      <div>
        <div class="col-title">Quick Links</div>
        <div class="links">
          <a href="#services">Services</a>${layout.showWhyChooseUs === true ? '\n          <a href="#why-us">Why Us</a>' : ""}
          <a href="#about">About</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div>
        <div class="col-title">Contact</div>
        <div class="info">
${contactInfo.join("\n")}
        </div>
      </div>
    </div>
    <div class="copyright">${esc(copyright)}</div>
  </footer>`;
}
