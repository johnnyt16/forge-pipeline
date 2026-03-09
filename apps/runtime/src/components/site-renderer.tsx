import { SiteHeader } from "./sections/header";
import { HeroSection } from "./sections/hero";
import { CarriersSection } from "./sections/carriers";
import { ServicesSection } from "./sections/services";
import { WhyChooseUsSection } from "./sections/why-choose-us";
import { AboutSection } from "./sections/about";
import { TestimonialsSection } from "./sections/testimonials";
import { FaqSection } from "./sections/faq";
import { ContactSection } from "./sections/contact";
import { FooterSection } from "./sections/footer";

interface SiteRendererProps {
  config: Record<string, any>;
  siteId: string;
  isPreview: boolean;
  features: Record<string, boolean>;
}

/**
 * Renders a complete site from its config JSON.
 * This is the single renderer used for ALL tenant sites — preview and production.
 */
export function SiteRenderer({ config, siteId, isPreview, features }: SiteRendererProps) {
  const theme = config.theme || {};
  const layout = config.layout || {};

  return (
    <html lang="en">
      <head>
        <title>{config.branding?.businessName || "Site"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {Array.from(new Set([theme.fontBody || "Inter", theme.fontHeading || "Inter"])).map((font) => (
          <link
            key={font}
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap`}
            rel="stylesheet"
          />
        ))}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: '${theme.fontBody || "Inter"}', -apple-system, sans-serif;
                color: ${theme.textColor || "#111827"};
                background: ${theme.backgroundColor || "#ffffff"};
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
              }
              h1, h2, h3, h4, h5, h6 {
                font-family: '${theme.fontHeading || "Inter"}', -apple-system, sans-serif;
                line-height: 1.2;
              }
              img { max-width: 100%; }
              a { text-decoration: none; }
              @media (max-width: 768px) {
                .site-nav {
                  display: none !important;
                }
                .site-nav.open {
                  display: flex !important;
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
                  display: flex !important;
                  align-items: center;
                  justify-content: center;
                }
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Preview banner */}
        {isPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: "#f59e0b",
              color: "#000",
              padding: "6px 20px",
              fontSize: "13px",
              zIndex: 9999,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            PREVIEW MODE — This site is not yet live
          </div>
        )}

        <div style={{ marginTop: isPreview ? "32px" : 0 }}>
          <SiteHeader config={config} />
          {layout.showHero !== false && <HeroSection config={config} />}
          {layout.showCarriers === true && <CarriersSection config={config} />}
          {layout.showServices !== false && <ServicesSection config={config} />}
          {layout.showWhyChooseUs === true && <WhyChooseUsSection config={config} />}
          {layout.showAbout !== false && <AboutSection config={config} />}
          {layout.showTestimonials !== false && <TestimonialsSection config={config} />}
          {layout.showFaq !== false && <FaqSection config={config} />}
          {layout.showContact !== false && (
            <ContactSection
              config={config}
              siteId={siteId}
              showForm={features.contactForm === true}
            />
          )}
          <FooterSection config={config} />
        </div>
      </body>
    </html>
  );
}
