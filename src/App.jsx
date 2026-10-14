import React, { useState } from 'react';
import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { StatsOverview } from './components/StatsOverview';
import { SiteTree } from './components/TreeView/SiteTree';
import { FlatLinksTable } from './components/LinksView/FlatLinksTable';
import { ExternalLinksList } from './components/LinksView/ExternalLinksList';
import { PageInspector } from './components/InspectModal/PageInspector';
import { RobotsView } from './components/RobotsView';
import { SitemapComparisonView } from './components/SitemapComparisonView';
import { useCrawler } from './hooks/useCrawler';
import { Network, Table, ExternalLink, Bot, Map as MapIcon } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('tree'); // tree | flat_links | external_links | robots | sitemap
  const [inspectedPage, setInspectedPage] = useState(null);

  const {
    status,
    rootUrl,
    pages,
    treeData,
    allLinks,
    externalLinks,
    robotsInfo,
    sitemapInfo,
    error,
    startCrawl,
    stopCrawl,
  } = useCrawler();

  // Average response time calculation
  const pagesArray = Array.from(pages.values());
  const avgResponseTime = pagesArray.length
    ? Math.round(
        pagesArray.reduce((acc, p) => acc + (p.timings?.total || 0), 0) / pagesArray.length
      )
    : 0;

  // Count disallowed pages
  const disallowedCount = pagesArray.filter(p => p.isAllowedByRobots === false).length;
  // Count pages missing from sitemap
  const missingFromSitemapCount = pagesArray.filter(p => p.isInSitemap === false).length;

  // Helper to build hierarchy from pages during scanning
  const activeTree = React.useMemo(() => {
    if (treeData) return treeData;
    if (pages.size === 0 || !rootUrl) return null;

    const childrenMap = new Map();
    for (const [url, page] of pages.entries()) {
      if (url === rootUrl) continue;
      const parent = page.parentUrl || rootUrl;
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, []);
      }
      childrenMap.get(parent).push(page);
    }

    const buildNode = (page) => {
      const children = childrenMap.get(page.url) || [];
      return {
        ...page,
        children: children.map(buildNode),
      };
    };

    const rootPage = pages.get(rootUrl);
    return rootPage ? buildNode(rootPage) : null;
  }, [treeData, pages, rootUrl]);

  return (
    <div className="app-container">
      <Header />

      <UrlInputBar status={status} onStart={startCrawl} onStop={stopCrawl} />

      {error && (
        <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.9rem' }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <StatsOverview
        pagesCount={pages.size}
        linksCount={allLinks.length}
        externalCount={externalLinks.length}
        avgResponseTime={avgResponseTime}
        status={status}
      />

      <div className="view-tabs-bar">
        <button
          className={`view-tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
          onClick={() => setActiveTab('tree')}
        >
          <Network size={16} />
          <span>Карта сайта с вложенностью</span>
        </button>

        <button
          className={`view-tab-btn ${activeTab === 'flat_links' ? 'active' : ''}`}
          onClick={() => setActiveTab('flat_links')}
        >
          <Table size={16} />
          <span>Плоский список ссылок ({allLinks.length})</span>
        </button>

        <button
          className={`view-tab-btn ${activeTab === 'external_links' ? 'active' : ''}`}
          onClick={() => setActiveTab('external_links')}
        >
          <ExternalLink size={16} />
          <span>Внешние ссылки ({externalLinks.length})</span>
        </button>

        <button
          className={`view-tab-btn ${activeTab === 'robots' ? 'active' : ''}`}
          onClick={() => setActiveTab('robots')}
        >
          <Bot size={16} />
          <span>Анализ robots.txt {disallowedCount > 0 ? `(${disallowedCount})` : ''}</span>
        </button>

        <button
          className={`view-tab-btn ${activeTab === 'sitemap' ? 'active' : ''}`}
          onClick={() => setActiveTab('sitemap')}
        >
          <MapIcon size={16} />
          <span>Сравнение с sitemap.xml {missingFromSitemapCount > 0 ? `(${missingFromSitemapCount} нет в карте)` : ''}</span>
        </button>
      </div>

      <main>
        {activeTab === 'tree' && (
          <SiteTree
            treeData={activeTree}
            onSelectPage={(page) => setInspectedPage(page)}
          />
        )}

        {activeTab === 'flat_links' && <FlatLinksTable links={allLinks} pages={pages} />}

        {activeTab === 'external_links' && (
          <ExternalLinksList externalLinks={externalLinks} />
        )}

        {activeTab === 'robots' && (
          <RobotsView robotsInfo={robotsInfo} pages={pages} />
        )}

        {activeTab === 'sitemap' && (
          <SitemapComparisonView sitemapInfo={sitemapInfo} pages={pages} />
        )}
      </main>

      {inspectedPage && (
        <PageInspector
          page={inspectedPage}
          onClose={() => setInspectedPage(null)}
        />
      )}
    </div>
  );
}

export default App;
