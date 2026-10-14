/**
 * Express Server with SSE (Server-Sent Events) API
 * Single Responsibility: API routing, handling crawl requests and streaming updates
 */
const express = require('express');
const cors = require('cors');
const { Crawler } = require('./crawler/crawler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store active crawling abort controllers by session ID
const activeSessions = new Map();

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * SSE endpoint for starting site crawling
 * Query params: url, maxDepth, maxPages, concurrency
 */
app.get('/api/crawl/stream', (req, res) => {
  const { url, maxDepth = '2', maxPages = '30', concurrency = '3' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Параметр url обязателен' });
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const abortController = new AbortController();
  activeSessions.set(sessionId, abortController);

  const sendSSE = (eventName, data) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendSSE('session_started', { sessionId, targetUrl: formattedUrl });

  const crawler = new Crawler({
    rootUrl: formattedUrl,
    maxDepth: parseInt(maxDepth, 10),
    maxPages: parseInt(maxPages, 10),
    concurrency: parseInt(concurrency, 10),
    signal: abortController.signal,
    onEvent: (event) => {
      sendSSE(event.type, event.data);
    },
  });

  crawler
    .start()
    .then(() => {
      sendSSE('finished', {
        tree: crawler.getTree(),
        allLinks: crawler.getAllLinks(),
        externalLinks: crawler.getExternalLinks(),
        robotsInfo: crawler.getRobotsInfo(),
        sitemapInfo: crawler.getSitemapInfo(),
      });
      res.end();
    })
    .catch((err) => {
      sendSSE('error', { message: err.message || 'Ошибка краулера' });
      res.end();
    })
    .finally(() => {
      activeSessions.delete(sessionId);
    });

  req.on('close', () => {
    abortController.abort();
    activeSessions.delete(sessionId);
  });
});

/**
 * Stop active crawling session
 */
app.post('/api/crawl/stop', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && activeSessions.has(sessionId)) {
    activeSessions.get(sessionId).abort();
    activeSessions.delete(sessionId);
    return res.json({ success: true, message: 'Сессия остановлена' });
  }
  res.status(404).json({ success: false, message: 'Сессия не найдена' });
});

app.listen(PORT, () => {
  console.log(`[Crawler Server] Запущен на http://localhost:${PORT}`);
});
