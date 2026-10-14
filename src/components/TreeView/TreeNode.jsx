import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Clock, ExternalLink } from 'lucide-react';

export function TreeNode({ node, onSelectPage }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const timings = node.timings || {};
  const totalTime = timings.total || 0;

  const getStatusClass = (code) => {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    return 'status-5xx';
  };

  // Mini waterfall breakdown widths
  const dnsW = totalTime ? Math.max(3, (timings.dns / totalTime) * 100) : 0;
  const tcpW = totalTime ? Math.max(3, (timings.tcp / totalTime) * 100) : 0;
  const tlsW = totalTime ? Math.max(3, (timings.tls / totalTime) * 100) : 0;
  const ttfbW = totalTime ? Math.max(3, (timings.ttfb / totalTime) * 100) : 0;
  const dlW = totalTime ? Math.max(3, (timings.download / totalTime) * 100) : 0;

  const isMatch = node.isDirectMatch;

  return (
    <div className="tree-node-wrapper">
      <div
        className="tree-node-item"
        style={isMatch ? { borderColor: node.statusCode >= 400 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 102, 241, 0.6)', background: node.statusCode >= 400 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)' } : undefined}
        onClick={() => onSelectPage(node)}
      >
        <div className="tree-node-left">
          {hasChildren ? (
            <button
              className="btn-close"
              style={{ padding: '2px' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
              <FileText size={14} color="#64748b" />
            </div>
          )}

          <div>
            <div className="tree-node-title">
              {node.title || node.url}
            </div>
            <div className="tree-node-url">{node.url}</div>
            {node.parentUrl && (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748b' }}>Ссылка найдена на:</span>
                <span className="url-code" style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>{node.parentUrl}</span>
                {node.anchorText && <span style={{ color: '#cbd5e1' }}>({node.anchorText})</span>}
              </div>
            )}
          </div>
        </div>

        <div className="tree-node-right">
          {node.isAllowedByRobots !== undefined && (
            <div
              className="badge"
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: node.isAllowedByRobots ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: node.isAllowedByRobots ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)',
                color: node.isAllowedByRobots ? '#34d399' : '#f87171',
              }}
              title={node.isAllowedByRobots ? 'Страница разрешена для поисковых роботов в robots.txt' : 'Страница ЗАБЛОКИРОВАНА директивой Disallow в robots.txt'}
            >
              {node.isAllowedByRobots ? 'Robots: Allow' : 'Robots: Disallow'}
            </div>
          )}

          {node.isInSitemap !== undefined && (
            <div
              className="badge"
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: node.isInSitemap ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: node.isInSitemap ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.4)',
                color: node.isInSitemap ? '#38bdf8' : '#fbbf24',
              }}
              title={node.isInSitemap ? 'Страница присутствует в sitemap.xml' : 'Страница ОТСУТСТВУЕТ в sitemap.xml'}
            >
              {node.isInSitemap ? 'В Sitemap' : 'Нет в Sitemap'}
            </div>
          )}

          <div className={`status-badge ${getStatusClass(node.statusCode)}`}>
            {node.statusCode || 'ERR'}
          </div>

          <div className="mini-waterfall" title={`DNS: ${timings.dns}ms | TCP: ${timings.tcp}ms | TLS: ${timings.tls}ms | TTFB: ${timings.ttfb}ms | DL: ${timings.download}ms`}>
            {timings.dns > 0 && <div className="waterfall-segment waterfall-dns" style={{ width: `${dnsW}%` }} />}
            {timings.tcp > 0 && <div className="waterfall-segment waterfall-tcp" style={{ width: `${tcpW}%` }} />}
            {timings.tls > 0 && <div className="waterfall-segment waterfall-tls" style={{ width: `${tlsW}%` }} />}
            {timings.ttfb > 0 && <div className="waterfall-segment waterfall-ttfb" style={{ width: `${ttfbW}%` }} />}
            {timings.download > 0 && <div className="waterfall-segment waterfall-dl" style={{ width: `${dlW}%` }} />}
          </div>

          <div className="timing-badge">
            <Clock size={12} />
            <span>{totalTime}ms</span>
          </div>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.url} node={child} onSelectPage={onSelectPage} />
          ))}
        </div>
      )}
    </div>
  );
}
