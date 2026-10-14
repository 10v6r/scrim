import React, { useState } from 'react';
import { ExternalLink, Search, Globe } from 'lucide-react';

export function ExternalLinksList({ externalLinks = [] }) {
  const [search, setSearch] = useState('');

  const filtered = externalLinks.filter((item) => {
    if (!search.trim()) return true;
    return item.targetUrl.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="table-container glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Реестр внешних ссылок</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Внешние ресурсы, обнаруженные на страницах (по ним краулер не переходит)
          </p>
        </div>

        <div className="url-field-wrapper" style={{ maxWidth: '320px' }}>
          <Search className="url-field-icon" size={16} />
          <input
            type="text"
            className="url-input"
            style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
            placeholder="Поиск по внешнему URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Внешние ссылки пока не найдены
        </div>
      ) : (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Внешний целевой адрес</th>
              <th style={{ width: '120px' }}>Кол-во упоминаний</th>
              <th>Источники на сайте (где обнаружена)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={item.targetUrl || idx}>
                <td>
                  <a
                    href={item.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', textDecoration: 'none' }}
                  >
                    <Globe size={14} />
                    <span className="url-code">{item.targetUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td>
                  <span className="badge" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    {item.count} раз(а)
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(item.sourceUrls || []).slice(0, 3).map((src, i) => (
                      <span key={i} className="url-code" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {src}
                      </span>
                    ))}
                    {(item.sourceUrls || []).length > 3 && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        и еще {(item.sourceUrls || []).length - 3} стр.
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
