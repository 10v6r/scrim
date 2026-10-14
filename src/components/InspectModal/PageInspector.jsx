import React from 'react';
import { X, ExternalLink, Calendar, HardDrive } from 'lucide-react';
import { TimingWaterfall } from './TimingWaterfall';
import { HeadersViewer } from './HeadersViewer';

export function PageInspector({ page, onClose }) {
  if (!page) return null;

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`status-badge status-${Math.floor((page.statusCode || 200) / 100)}xx`}>
                {page.statusCode} {page.statusMessage}
              </span>
              <h3 className="modal-title">{page.title || 'Инспектор страницы'}</h3>
            </div>
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#818cf8', marginTop: '4px', textDecoration: 'none' }}
            >
              <span>{page.url}</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick info row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
              <HardDrive size={15} />
              <span>Размер контента: <strong style={{ color: '#fff' }}>{formatBytes(page.contentLength)}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
              <span>Тип: <strong style={{ color: '#fff' }}>{page.contentType || 'unknown'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
              <Calendar size={15} />
              <span>Глубина вложенности: <strong style={{ color: '#fff' }}>{page.depth}</strong></span>
            </div>
            {page.isAllowedByRobots !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Доступ в robots.txt:</span>
                <strong style={{ color: page.isAllowedByRobots ? '#34d399' : '#f87171' }}>
                  {page.isAllowedByRobots ? 'Разрешено (Allow)' : 'Запрещено (Disallow)'}
                </strong>
              </div>
            )}
            {page.isInSitemap !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#94a3b8' }}>В sitemap.xml:</span>
                <strong style={{ color: page.isInSitemap ? '#38bdf8' : '#fbbf24' }}>
                  {page.isInSitemap ? 'Присутствует' : 'Отсутствует в sitemap.xml'}
                </strong>
              </div>
            )}
          </div>

          {/* Inbound referrers: where does this link come from */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
              Откуда ссылаются на эту страницу ({page.inboundLinks ? page.inboundLinks.length : (page.parentUrl ? 1 : 0)})
            </h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'rgba(0, 0, 0, 0.2)' }}>
              {page.inboundLinks && page.inboundLinks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {page.inboundLinks.map((inbound, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ color: '#94a3b8' }}>Страница-источник:</span>
                        <a href={inbound.sourceUrl} target="_blank" rel="noreferrer" className="url-code" style={{ color: '#818cf8', textDecoration: 'none' }}>
                          {inbound.sourceUrl}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        <span>Анкор: <strong>{inbound.anchorText || '(без текста)'}</strong></span>
                        {inbound.rawHref && <span>Атрибут в HTML: <code style={{ color: '#fbbf24' }}>href="{inbound.rawHref}"</code></span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : page.parentUrl ? (
                <div style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Родительская страница: </span>
                  <a href={page.parentUrl} target="_blank" rel="noreferrer" className="url-code" style={{ color: '#818cf8', textDecoration: 'none' }}>
                    {page.parentUrl}
                  </a>
                  {page.anchorText && <span style={{ marginLeft: '8px', color: '#cbd5e1' }}>({page.anchorText})</span>}
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem', padding: '6px' }}>
                  Это стартовая (корневая) страница сканирования
                </div>
              )}
            </div>
          </div>

          {/* Response Timing breakdown */}
          <TimingWaterfall timings={page.timings} />

          {/* All HTTP Headers */}
          <HeadersViewer headers={page.headers} />
        </div>
      </div>
    </div>
  );
}
