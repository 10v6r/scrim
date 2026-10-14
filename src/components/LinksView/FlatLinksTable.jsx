import React, { useState, useMemo } from 'react';
import { ArrowRight, Search, ExternalLink, Filter } from 'lucide-react';

export function FlatLinksTable({ links = [], pages = new Map() }) {
  const [filterType, setFilterType] = useState('all'); // all | internal | external
  const [statusFilter, setStatusFilter] = useState('all'); // all | 2xx | errors | 4xx | 5xx
  const [search, setSearch] = useState('');

  const filteredLinks = useMemo(() => {
    return links.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Status check
      if (statusFilter !== 'all') {
        const pageInfo = pages.get(item.targetUrl);
        const code = pageInfo ? (pageInfo.statusCode || 0) : null;
        if (statusFilter === '2xx' && (code === null || code < 200 || code >= 300)) return false;
        if (statusFilter === '4xx' && (code === null || code < 400 || code >= 500)) return false;
        if (statusFilter === '5xx' && (code === null || (code < 500 && code !== 0))) return false;
        if (statusFilter === 'errors' && (code === null || (code < 400 && code !== 0))) return false;
        if (statusFilter === 'robots_disallow' && item.isAllowedByRobots !== false) return false;
      }

      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        item.sourceUrl.toLowerCase().includes(s) ||
        item.targetUrl.toLowerCase().includes(s) ||
        (item.anchorText && item.anchorText.toLowerCase().includes(s))
      );
    });
  }, [links, filterType, statusFilter, search, pages]);

  return (
    <div className="table-container glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn-primary ${filterType === 'all' ? '' : 'btn-stop'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem', background: filterType === 'all' ? undefined : 'rgba(255,255,255,0.05)', color: filterType === 'all' ? undefined : '#94a3b8', border: '1px solid var(--border-color)' }}
            onClick={() => setFilterType('all')}
          >
            Все ({links.length})
          </button>
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', background: filterType === 'internal' ? undefined : 'rgba(255,255,255,0.05)', color: filterType === 'internal' ? undefined : '#94a3b8', border: '1px solid var(--border-color)' }}
            onClick={() => setFilterType('internal')}
          >
            Внутренние ({links.filter(l => l.type === 'internal').length})
          </button>
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', background: filterType === 'external' ? undefined : 'rgba(255,255,255,0.05)', color: filterType === 'external' ? undefined : '#94a3b8', border: '1px solid var(--border-color)' }}
            onClick={() => setFilterType('external')}
          >
            Внешние ({links.filter(l => l.type === 'external').length})
          </button>

          <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

          {/* Status code filter pills */}
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'all' ? '#6366f1' : 'var(--border-color)',
              color: statusFilter === 'all' ? '#fff' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('all')}
          >
            Любой статус
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === '2xx' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === '2xx' ? '#10b981' : 'var(--border-color)',
              color: statusFilter === '2xx' ? '#34d399' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('2xx')}
          >
            2xx Успешные
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'errors' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'errors' ? '#ef4444' : 'var(--border-color)',
              color: statusFilter === 'errors' ? '#fca5a5' : '#94a3b8',
              fontWeight: 700,
            }}
            onClick={() => setStatusFilter('errors')}
          >
            ⚠️ Только ошибки (4xx / 5xx)
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'robots_disallow' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'robots_disallow' ? '#ef4444' : 'var(--border-color)',
              color: statusFilter === 'robots_disallow' ? '#f87171' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('robots_disallow')}
          >
            ⛔ Закрытые в robots.txt
          </button>
        </div>

        <div className="url-field-wrapper" style={{ maxWidth: '320px' }}>
          <Search className="url-field-icon" size={16} />
          <input
            type="text"
            className="url-input"
            style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
            placeholder="Поиск по URL или тексту ссылки..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredLinks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Нет найденных ссылок по заданному критерию
        </div>
      ) : (
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Тип</th>
              <th>Откуда ссылается (Source)</th>
              <th style={{ width: '30px' }}></th>
              <th>Куда ссылается (Target)</th>
              <th style={{ width: '80px' }}>Статус</th>
              <th>Анкор / Текст ссылки</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.slice(0, 500).map((link, idx) => {
              const targetPage = pages.get(link.targetUrl);
              const statusCode = targetPage ? targetPage.statusCode : null;
              return (
                <tr key={link.id || idx}>
                  <td>
                    <span className={`link-tag ${link.type}`}>
                      {link.type === 'internal' ? 'Внутренняя' : 'Внешняя'}
                    </span>
                  </td>
                  <td>
                    <span className="url-code">{link.sourceUrl}</span>
                  </td>
                  <td style={{ color: '#6366f1', textAlign: 'center' }}>
                    <ArrowRight size={14} />
                  </td>
                  <td>
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="url-code"
                      style={{ color: link.type === 'external' ? '#fbbf24' : '#818cf8', textDecoration: 'none' }}
                    >
                      {link.targetUrl}
                    </a>
                    {link.isAllowedByRobots === false && (
                      <span className="badge" style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '1px 6px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
                        Disallow
                      </span>
                    )}
                    {link.rawHref && link.rawHref !== link.targetUrl && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        В HTML: <code style={{ color: '#94a3b8' }}>href="{link.rawHref}"</code>
                      </div>
                    )}
                  </td>
                  <td>
                    {statusCode !== null ? (
                      <span className={`status-badge status-${Math.floor(statusCode / 100)}xx`}>
                        {statusCode}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#cbd5e1', fontStyle: link.anchorText ? 'normal' : 'italic' }}>
                    {link.anchorText || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {filteredLinks.length > 500 && (
        <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '0.8rem' }}>
          Показано 500 первых ссылок из {filteredLinks.length}
        </div>
      )}
    </div>
  );
}
