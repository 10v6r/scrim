import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook for Crawler SSE Connection and State Management
 * Single Responsibility: SSE streaming, connection lifecycle, and reactive state
 */
export function useCrawler() {
  const [status, setStatus] = useState('idle'); // idle | scanning | completed | stopped | error
  const [rootUrl, setRootUrl] = useState('');
  const [pages, setPages] = useState(new Map()); // url -> PageData
  const [treeData, setTreeData] = useState(null);
  const [allLinks, setAllLinks] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);

  const [robotsInfo, setRobotsInfo] = useState(null);
  const [sitemapInfo, setSitemapInfo] = useState(null);

  const startCrawl = useCallback(({ url, maxDepth = 3, maxPages = 40, concurrency = 3 }) => {
    // Reset state
    setStatus('scanning');
    setError(null);
    setRootUrl(url);
    setPages(new Map());
    setTreeData(null);
    setAllLinks([]);
    setExternalLinks([]);
    setRobotsInfo(null);
    setSitemapInfo(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const queryParams = new URLSearchParams({
      url,
      maxDepth: String(maxDepth),
      maxPages: String(maxPages),
      concurrency: String(concurrency),
    });

    const es = new EventSource(`/api/crawl/stream?${queryParams.toString()}`);
    eventSourceRef.current = es;

    es.addEventListener('session_started', (event) => {
      const data = JSON.parse(event.data);
      setSessionId(data.sessionId);
    });

    es.addEventListener('robots_loaded', (event) => {
      const data = JSON.parse(event.data);
      setRobotsInfo(data);
    });

    es.addEventListener('sitemap_loaded', (event) => {
      const data = JSON.parse(event.data);
      setSitemapInfo(data);
    });

    es.addEventListener('page_scanned', (event) => {
      const data = JSON.parse(event.data);
      setPages((prev) => {
        const next = new Map(prev);
        next.set(data.page.url, data.page);
        return next;
      });

      if (data.newLinks && data.newLinks.length > 0) {
        setAllLinks((prev) => [...prev, ...data.newLinks]);
      }
    });

    es.addEventListener('finished', (event) => {
      const data = JSON.parse(event.data);
      if (data.tree) setTreeData(data.tree);
      if (data.allLinks) setAllLinks(data.allLinks);
      if (data.externalLinks) setExternalLinks(data.externalLinks);
      if (data.robotsInfo) setRobotsInfo(data.robotsInfo);
      if (data.sitemapInfo) setSitemapInfo(data.sitemapInfo);
      setStatus('completed');
      es.close();
    });

    es.addEventListener('error', (event) => {
      try {
        const data = JSON.parse(event.data);
        setError(data.message || 'Ошибка соединения');
      } catch {
        setError('Связь с сервером прервана');
      }
      setStatus('error');
      es.close();
    });

    es.onerror = () => {
      // If closed normally by server
      if (es.readyState === EventSource.CLOSED) {
        setStatus((s) => (s === 'scanning' ? 'completed' : s));
      } else {
        setStatus('error');
        setError('Потеряно соединение с сервером');
        es.close();
      }
    };
  }, []);

  const stopCrawl = useCallback(async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (sessionId) {
      try {
        await fetch('/api/crawl/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        console.warn('Failed to stop session:', err);
      }
    }
    setStatus('stopped');
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
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
  };
}
