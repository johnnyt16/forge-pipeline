import { chromium, Browser, Page } from "playwright";
import { prisma } from "../db/client";
import { transitionStatus } from "../pipeline/status";
import { ProjectStatus } from "@prisma/client";

interface ScrapedPageData {
  url: string;
  title: string;
  content: string;
}

// Max pages to crawl per project to avoid runaway scraping
const MAX_PAGES = 10;

// Internal links we care about (skip pdfs, images, etc)
const SKIP_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".mp4", ".zip"];

/**
 * Scrape a website starting from the given URL.
 * Crawls the main page + discovers and scrapes internal links.
 *
 * If the project has rawContent but no websiteUrl, this is a no-op
 * (the content was already injected at project creation time).
 * If both exist, scrapes the URL and appends rawContent as an extra page.
 */
export async function scrapeWebsite(projectId: string): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  // If no URL to scrape, skip (manual-only projects already have content)
  if (!project.websiteUrl) {
    await transitionStatus(projectId, ProjectStatus.EXTRACTED);
    return;
  }

  await transitionStatus(projectId, ProjectStatus.SCRAPING);

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const baseUrl = new URL(project.websiteUrl);
    const visited = new Set<string>();
    const toVisit: string[] = [project.websiteUrl];
    const results: ScrapedPageData[] = [];

    while (toVisit.length > 0 && results.length < MAX_PAGES) {
      const url = toVisit.shift()!;
      const normalized = normalizeUrl(url);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      let page: Page | null = null;
      try {
        page = await context.newPage();
        const data = await scrapePage(page, url);
        results.push(data);

        // Discover internal links from first few pages
        if (results.length <= 3) {
          const links = await discoverLinks(page, baseUrl);
          for (const link of links) {
            if (!visited.has(normalizeUrl(link)) && !toVisit.includes(link)) {
              toVisit.push(link);
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to scrape ${url}:`, err);
      } finally {
        if (page) await page.close();
      }
    }

    await context.close();

    // Clear old scraped pages for this project
    await prisma.scrapedPage.deleteMany({ where: { projectId } });

    // Save scraped results
    for (const result of results) {
      await prisma.scrapedPage.create({
        data: {
          projectId,
          url: result.url,
          title: result.title,
          rawContent: result.content,
        },
      });
    }

    // If the project also has manual rawContent, add it as an additional page
    if (project.rawContent) {
      await prisma.scrapedPage.create({
        data: {
          projectId,
          url: "manual-input",
          title: `Additional info for ${project.clientName}`,
          rawContent: project.rawContent,
        },
      });
    }

    await transitionStatus(projectId, ProjectStatus.EXTRACTED);
  } catch (err) {
    await transitionStatus(projectId, ProjectStatus.FAILED);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Scrape a single page — extract title and text content.
 */
async function scrapePage(page: Page, url: string): Promise<ScrapedPageData> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  // Wait a bit for JS-rendered content
  await page.waitForTimeout(2000);

  const title = await page.title();
  const content = await page.evaluate(() => {
    // Remove script, style, nav, footer noise
    const removeSelectors = ["script", "style", "noscript", "iframe"];
    removeSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });
    return document.body?.innerText || "";
  });

  return { url, title, content: content.slice(0, 50000) }; // cap content length
}

/**
 * Discover internal links on a page.
 */
async function discoverLinks(page: Page, baseUrl: URL): Promise<string[]> {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean);
  });

  return links.filter((link) => {
    try {
      const parsed = new URL(link);
      // Same domain only
      if (parsed.hostname !== baseUrl.hostname) return false;
      // Skip non-page resources
      const path = parsed.pathname.toLowerCase();
      if (SKIP_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
      // Skip anchors and mailto
      if (link.startsWith("mailto:") || link.startsWith("tel:")) return false;
      return true;
    } catch {
      return false;
    }
  });
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, fragment, and common tracking params
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}
