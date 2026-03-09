import "dotenv/config";
import { prisma, writeSite } from "@forge/core";

/**
 * Bulk rebuild script — regenerates static files for all LIVE sites.
 * Usage: npm run build:sites
 */
async function main() {
  console.log("Building all LIVE sites...\n");

  const sites = await prisma.site.findMany({
    where: { status: "LIVE" },
  });

  if (sites.length === 0) {
    console.log("No LIVE sites found.");
    return;
  }

  let built = 0;
  let skipped = 0;
  let failed = 0;

  for (const site of sites) {
    try {
      const config = site.liveConfig as Record<string, any> | null;
      if (!config) {
        console.log(`  [SKIP] ${site.slug} — no live config`);
        skipped++;
        continue;
      }

      const features = (site.features || {}) as Record<string, boolean>;
      const outputDir = writeSite({
        slug: site.slug,
        config,
        siteId: site.id,
        showForm: features.contactForm === true,
      });

      console.log(`  [OK]   ${site.slug} → ${outputDir}`);
      built++;
    } catch (err) {
      console.error(`  [ERR]  ${site.slug}:`, err);
      failed++;
    }
  }

  console.log(
    `\nDone. ${built} built, ${skipped} skipped, ${failed} failed (${sites.length} total).`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
