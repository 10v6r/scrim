/**
 * Network Requester & Timing Profiler
 * Single Responsibility: Execute HTTP/HTTPS requests with socket phase measurements,
 * measure DNS, TCP, TLS, TTFB and Download durations, and extract HTTP headers.
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * @typedef {Object} DetailedTimings
 * @property {number} dns - DNS lookup duration in ms
 * @property {number} tcp - TCP connection duration in ms
 * @property {number} tls - TLS handshake duration in ms (0 for HTTP)
 * @property {number} ttfb - Time to first byte in ms
 * @property {number} download - Content transfer duration in ms
 * @property {number} total - Total response time in ms
 */

/**
 * @typedef {Object} RequestResult
 * @property {boolean} success
 * @property {number} statusCode
 * @property {string} statusMessage
 * @property {Record<string, string>} headers
 * @property {DetailedTimings} timings
 * @property {string} body
 * @property {string} contentType
 * @property {number} contentLength
 * @property {string} [error]
 */

/**
 * Executes a network request and profiles socket lifecycle events.
 * @param {string} targetUrl 
 * @param {number} [timeoutMs=15000]
 * @returns {Promise<RequestResult>}
 */
function fetchWithTimings(targetUrl, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (err) {
      return resolve({
        success: false,
        statusCode: 0,
        statusMessage: 'Invalid URL',
        headers: {},
        timings: { dns: 0, tcp: 0, tls: 0, ttfb: 0, download: 0, total: 0 },
        body: '',
        contentType: '',
        contentLength: 0,
        error: err.message,
      });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const timings = {
      start: process.hrtime.bigint(),
      dnsStart: 0n,
      dnsEnd: 0n,
      tcpStart: 0n,
      tcpEnd: 0n,
      tlsStart: 0n,
      tlsEnd: 0n,
      requestSent: 0n,
      firstByte: 0n,
      end: 0n,
    };

    const options = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ScrimWebCrawler/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    };

    let isDone = false;
    const req = client.request(options);

    req.setTimeout(timeoutMs, () => {
      if (isDone) return;
      isDone = true;
      req.destroy(new Error(`Timeout of ${timeoutMs}ms exceeded`));
    });

    req.on('socket', (socket) => {
      timings.dnsStart = process.hrtime.bigint();

      socket.once('lookup', () => {
        timings.dnsEnd = process.hrtime.bigint();
        timings.tcpStart = timings.dnsEnd;
      });

      socket.once('connect', () => {
        timings.tcpEnd = process.hrtime.bigint();
        if (isHttps) {
          timings.tlsStart = timings.tcpEnd;
        }
      });

      socket.once('secureConnect', () => {
        timings.tlsEnd = process.hrtime.bigint();
      });
    });

    req.on('finish', () => {
      timings.requestSent = process.hrtime.bigint();
    });

    req.on('response', (res) => {
      timings.firstByte = process.hrtime.bigint();

      const chunks = [];
      let totalBytes = 0;

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
      });

      res.on('end', () => {
        if (isDone) return;
        isDone = true;
        timings.end = process.hrtime.bigint();

        const nsToMs = (ns) => Number(ns) / 1e6;

        // Calculate phase durations safely
        const dnsDuration = timings.dnsEnd && timings.dnsStart ? Math.max(0, nsToMs(timings.dnsEnd - timings.dnsStart)) : 0;
        const tcpDuration = timings.tcpEnd && timings.tcpStart ? Math.max(0, nsToMs(timings.tcpEnd - timings.tcpStart)) : 0;
        const tlsDuration = timings.tlsEnd && timings.tlsStart ? Math.max(0, nsToMs(timings.tlsEnd - timings.tlsStart)) : 0;
        
        const reqStart = timings.tlsEnd || timings.tcpEnd || timings.dnsEnd || timings.start;
        const ttfbDuration = timings.firstByte && reqStart ? Math.max(0, nsToMs(timings.firstByte - reqStart)) : 0;
        const downloadDuration = timings.end && timings.firstByte ? Math.max(0, nsToMs(timings.end - timings.firstByte)) : 0;
        const totalDuration = Math.max(0, nsToMs(timings.end - timings.start));

        const body = Buffer.concat(chunks).toString('utf-8');
        const headers = {};
        for (const [key, val] of Object.entries(res.headers)) {
          headers[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }

        resolve({
          success: true,
          statusCode: res.statusCode || 200,
          statusMessage: res.statusMessage || 'OK',
          headers,
          contentType: res.headers['content-type'] || '',
          contentLength: totalBytes,
          timings: {
            dns: Number(dnsDuration.toFixed(2)),
            tcp: Number(tcpDuration.toFixed(2)),
            tls: Number(tlsDuration.toFixed(2)),
            ttfb: Number(ttfbDuration.toFixed(2)),
            download: Number(downloadDuration.toFixed(2)),
            total: Number(totalDuration.toFixed(2)),
          },
          body,
        });
      });
    });

    req.on('error', (err) => {
      if (isDone) return;
      isDone = true;
      const totalDuration = Number(process.hrtime.bigint() - timings.start) / 1e6;
      resolve({
        success: false,
        statusCode: 0,
        statusMessage: 'Connection Failed',
        headers: {},
        contentType: '',
        contentLength: 0,
        timings: {
          dns: 0,
          tcp: 0,
          tls: 0,
          ttfb: 0,
          download: 0,
          total: Number(totalDuration.toFixed(2)),
        },
        body: '',
        error: err.message,
      });
    });

    req.end();
  });
}

module.exports = {
  fetchWithTimings,
};
