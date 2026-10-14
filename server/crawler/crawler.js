/**
 * Crawler Engine
 * Single Responsibility: Crawling queue management, recursive discovery,
 * extracting internal & external links, avoiding infinite loops and emitting events.
 */
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const { normalizeUrl, isInternalUrl } = require('./urlUtils');
const { fetchWithTimings } = require('./requester');

class Crawler {
  /**
   * @param {Object} options
   * @param {string} options.rootUrl - Entry point URL
   * @param {number} [options.maxDepth=3] - Maximum recursion depth
   * @param {number} [options.maxPages=50] - Maximum pages to crawl
   * @param {number} [options.concurrency=3] - Concurrent requests
   * @param {function} options.onEvent - Callback for SSE streaming events
   * @param {AbortSignal} [options.signal] - Abort controller signal
   */
  constructor({ rootUrl, maxDepth = 3, maxPages = 50, concurrency = 3, onEvent, signal }) {
    this.rootUrl = rootUrl;
    this.maxDepth = Number(maxDepth) || 3;
    this.maxPages = Number(maxPages) || 50;
    this.concurrency = Number(concurrency) || 3;
    this.onEvent = onEvent || (() => {});
    this.signal = signal;

    // robots.txt parser instance
    this.robots = null;
    this.robotsTxtContent = '';
    this.robotsUrl = '';

    // sitemap.xml storage
    this.sitemapUrls = new Set();
    this.sitemapUrl = '';
    this.sitemapFound = false;

    // Track states
    this.visitedUrls = new Set();
    this.pagesMap = new Map(); // url -> PageData
    this.allLinks = []; // { sourceUrl, targetUrl, rawHref, type: 'internal'|'external', anchorText }
    this.externalLinksMap = new Map(); // targetUrl -> { targetUrl, sourceUrls: Set, count }
    this.inboundLinksMap = new Map(); // targetUrl -> Array<{ sourceUrl, anchorText, rawHref }>

    // Queue for BFS
    this.queue = [];
    this.activeWorkers = 0;
    this.isAborted = false;
    this.isFinished = false;

    if (this.signal) {
      this.signal.addEventListener('abort', () => {
        this.isAborted = true;
      });
    }
  }

  /**
   * Fetches and parses robots.txt for the rootUrl domain
   */
  async loadRobotsTxt() {
    try {
      const rootObj = new URL(this.rootUrl);
      this.robotsUrl = `${rootObj.origin}/robots.txt`;
      const res = await fetchWithTimings(this.robotsUrl, 8000);
      if (res.success && res.statusCode === 200 && res.body) {
        this.robotsTxtContent = res.body;
        this.robots = robotsParser(this.robotsUrl, res.body);
        this.onEvent({
          type: 'robots_loaded',
          data: {
            robotsUrl: this.robotsUrl,
            found: true,
            content: this.robotsTxtContent,
          },
        });
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch robots.txt:', err.message);
    }

    // Default if no robots.txt or 404
    this.onEvent({
      type: 'robots_loaded',
      data: {
        robotsUrl: this.robotsUrl,
        found: false,
        content: '',
      },
    });
  }

  /**
   * Checks if URL is allowed by robots.txt
   * @param {string} url 
   * @param {string} [userAgent='*'] 
   * @returns {boolean}
   */
  isRobotsAllowed(url, userAgent = '*') {
    if (!this.robots) return true;
    try {
      const allowed = this.robots.isAllowed(url, userAgent);
      return allowed === undefined ? true : allowed;
    } catch {
      return true;
    }
  }

  /**
   * Fetches and parses sitemap.xml for the rootUrl domain
   */
  async loadSitemapXml() {
    try {
      const rootObj = new URL(this.rootUrl);
      this.sitemapUrl = `${rootObj.origin}/sitemap.xml`;
      const res = await fetchWithTimings(this.sitemapUrl, 10000);
      if (res.success && res.statusCode === 200 && res.body) {
        this.sitemapFound = true;
        // Parse <loc> tags using regex or cheerio
        const locRegex = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(res.body)) !== null) {
          const locUrl = normalizeUrl(match[1], this.rootUrl);
          if (locUrl) {
            this.sitemapUrls.add(locUrl);
          }
        }

        this.onEvent({
          type: 'sitemap_loaded',
          data: {
            sitemapUrl: this.sitemapUrl,
            found: true,
            totalUrls: this.sitemapUrls.size,
          },
        });
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch sitemap.xml:', err.message);
    }

    this.onEvent({
      type: 'sitemap_loaded',
      data: {
        sitemapUrl: this.sitemapUrl,
        found: false,
        totalUrls: 0,
      },
    });
  }

  /**
   * Checks if URL is present in sitemap.xml
   * @param {string} url 
   * @returns {boolean}
   */
  isInSitemap(url) {
    if (!this.sitemapFound) return false;
    const normalized = normalizeUrl(url, this.rootUrl);
    return Boolean(normalized && this.sitemapUrls.has(normalized));
  }

  /**
   * Starts crawler execution
   */
  async start() {
    this.onEvent({
      type: 'start',
      data: {
        rootUrl: this.rootUrl,
        maxDepth: this.maxDepth,
        maxPages: this.maxPages,
      },
    });

    // 1. Fetch robots.txt and sitemap.xml in parallel
    await Promise.all([
      this.loadRobotsTxt(),
      this.loadSitemapXml(),
    ]);

    // Add root URL to queue
    this.queue.push({
      url: this.rootUrl,
      parentUrl: null,
      depth: 0,
      anchorText: 'Home',
    });
    this.visitedUrls.add(this.rootUrl);

    await this.processQueue();

    this.isFinished = true;
    this.onEvent({
      type: 'complete',
      data: {
        totalPages: this.pagesMap.size,
        totalLinks: this.allLinks.length,
        totalExternal: this.externalLinksMap.size,
      },
    });
  }

  async processQueue() {
    return new Promise((resolve) => {
      const checkAndRun = () => {
        if (this.isAborted) {
          return resolve();
        }

        // When queue is empty and no active requests are pending, we are done
        if (this.queue.length === 0 && this.activeWorkers === 0) {
          return resolve();
        }

        while (
          this.queue.length > 0 &&
          this.activeWorkers < this.concurrency &&
          this.pagesMap.size < this.maxPages &&
          !this.isAborted
        ) {
          const item = this.queue.shift();
          this.activeWorkers++;

          this.crawlPage(item)
            .catch((err) => {
              console.error(`Error crawling ${item.url}:`, err.message);
            })
            .finally(() => {
              this.activeWorkers--;
              checkAndRun();
            });
        }

        if (this.pagesMap.size >= this.maxPages && this.activeWorkers === 0) {
          return resolve();
        }
      };

      checkAndRun();
    });
  }

  /**
   * Crawls a single page, parses links and updates relations
   */
  async crawlPage({ url, parentUrl, depth, anchorText }) {
    if (this.isAborted) return;

    this.onEvent({
      type: 'page_start',
      data: { url, parentUrl, depth },
    });

    // 1. Fetch with detailed timings
    const result = await fetchWithTimings(url);

    // 2. Parse HTML if available and content-type is text/html
    const internalFound = [];
    const externalFound = [];
    let title = '';

    const isHtml = (result.contentType || '').includes('text/html');

    if (result.success && isHtml && result.body) {
      try {
        const $ = cheerio.load(result.body);
        title = $('title').first().text().trim() || $('h1').first().text().trim() || '';

        const docBase = $('base[href]').first().attr('href') || null;

        $('a[href]').each((_, el) => {
          const rawHref = $(el).attr('href');
          const linkText = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
          const normalized = normalizeUrl(rawHref, url, docBase);

          if (!normalized) return;

          const isInternal = isInternalUrl(normalized, this.rootUrl);

          const isLinkAllowed = isInternal ? this.isRobotsAllowed(normalized) : true;

          const linkEntry = {
            id: `${url}->${normalized}->${this.allLinks.length}`,
            sourceUrl: url,
            targetUrl: normalized,
            rawHref: rawHref,
            type: isInternal ? 'internal' : 'external',
            isAllowedByRobots: isLinkAllowed,
            anchorText: linkText || '(без текста)',
          };

          this.allLinks.push(linkEntry);

          // Track inbound references
          if (!this.inboundLinksMap.has(normalized)) {
            this.inboundLinksMap.set(normalized, []);
          }
          this.inboundLinksMap.get(normalized).push({
            sourceUrl: url,
            anchorText: linkText || '(без текста)',
            rawHref: rawHref,
          });

          if (isInternal) {
            internalFound.push({ url: normalized, anchorText: linkText });
          } else {
            externalFound.push({ url: normalized, anchorText: linkText });

            if (!this.externalLinksMap.has(normalized)) {
              this.externalLinksMap.set(normalized, {
                targetUrl: normalized,
                sourceUrls: [url],
                count: 1,
              });
            } else {
              const ext = this.externalLinksMap.get(normalized);
              ext.count++;
              if (!ext.sourceUrls.includes(url)) {
                ext.sourceUrls.push(url);
              }
            }
          }
        });
      } catch (parseErr) {
        console.warn(`HTML Parse error for ${url}:`, parseErr.message);
      }
    }

    const isAllowedByRobots = this.isRobotsAllowed(url);
    const inSitemap = this.isInSitemap(url);

    const pageData = {
      url,
      parentUrl,
      depth,
      anchorText,
      inboundLinks: this.inboundLinksMap.get(url) || (parentUrl ? [{ sourceUrl: parentUrl, anchorText: anchorText || '(прямой переход)', rawHref: url }] : []),
      isAllowedByRobots, // true if allowed, false if disallow by robots.txt
      isInSitemap: inSitemap, // true if present in sitemap.xml, false otherwise
      title: title || url,
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
      contentType: result.contentType,
      contentLength: result.contentLength,
      headers: result.headers,
      timings: result.timings,
      error: result.error,
      internalLinksCount: internalFound.length,
      externalLinksCount: externalFound.length,
      crawledAt: new Date().toISOString(),
    };

    this.pagesMap.set(url, pageData);

    // Emit page scanned event
    this.onEvent({
      type: 'page_scanned',
      data: {
        page: pageData,
        newLinks: this.allLinks.slice(-internalFound.length - externalFound.length),
        externalCount: this.externalLinksMap.size,
      },
    });

    // 3. Queue next internal pages if depth permits
    if (depth < this.maxDepth && !this.isAborted && this.pagesMap.size < this.maxPages) {
      for (const item of internalFound) {
        if (!this.visitedUrls.has(item.url) && this.visitedUrls.size < this.maxPages * 2) {
          this.visitedUrls.add(item.url);
          this.queue.push({
            url: item.url,
            parentUrl: url,
            depth: depth + 1,
            anchorText: item.anchorText,
          });
        }
      }
    }
  }

  /**
   * Generates hierarchical tree structure of crawled pages
   */
  getTree() {
    const rootPage = this.pagesMap.get(this.rootUrl);
    if (!rootPage) return null;

    const childrenMap = new Map();
    for (const [url, page] of this.pagesMap.entries()) {
      if (url === this.rootUrl) continue;
      const parent = page.parentUrl || this.rootUrl;
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent).push(page);
    }

    const buildNode = (page) => {
      const children = childrenMap.get(page.url) || [];
      const inbound = this.inboundLinksMap.get(page.url) || (page.parentUrl ? [{ sourceUrl: page.parentUrl, anchorText: page.anchorText || '(прямой переход)' }] : []);
      return {
        ...page,
        inboundLinks: inbound,
        children: children.map(buildNode),
      };
    };

    return buildNode(rootPage);
  }

  getRobotsInfo() {
    return {
      url: this.robotsUrl,
      found: Boolean(this.robotsTxtContent),
      content: this.robotsTxtContent,
    };
  }

  getSitemapInfo() {
    // Find crawled pages that are missing from sitemap.xml
    const missingFromSitemap = [];
    const presentInSitemap = [];

    for (const [url, page] of this.pagesMap.entries()) {
      if (this.sitemapUrls.has(url)) {
        presentInSitemap.push(page);
      } else {
        missingFromSitemap.push(page);
      }
    }

    return {
      url: this.sitemapUrl,
      found: this.sitemapFound,
      totalSitemapUrls: this.sitemapUrls.size,
      sitemapUrls: Array.from(this.sitemapUrls),
      missingFromSitemap, // pages crawled on site but missing in sitemap.xml
      presentInSitemap,
    };
  }

  getAllLinks() {
    return this.allLinks;
  }

  getExternalLinks() {
    return Array.from(this.externalLinksMap.values());
  }
}

module.exports = {
  Crawler,
};
