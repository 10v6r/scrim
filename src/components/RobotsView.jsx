import React, { useState } from 'react';
import { Bot, FileCode, CheckCircle2, XCircle, Search, ExternalLink, ShieldCheck } from 'lucide-react';

export function RobotsView({ robotsInfo, pages = new Map() }) {
  const [search, setSearch] = useState('');

  if (!robotsInfo) {
    return (
      <div className="table-container glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
        <Bot size={40} style={{ marginBottom: '12px' }} />
        <p>Запустите сканирование сайта для автоматического анализа файла robots.txt</p>
      </div>
    );
  }

  const pagesArray = Array.from(pages.values());
  const disallowedPages = pagesArray.filter((p) => p.isAllowedByRobots === false);
  const allowedPages = pagesArray.filter((p) => p.isAllowedByRobots === true);

  const filteredDisallowed = disallowedPages.filter((p) => {
    if (!search.trim()) return true;
    return p.url.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon" style={{ background: robotsInfo.found ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {robotsInfo.found ? 'Файл robots.txt обнаружен и проанализирован' : 'Файл robots.txt не найден (доступ открыт)'}
              </h3>
              <a
                href={robotsInfo.robotsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>{robotsInfo.robotsUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Доступно роботам: <strong>{allowedPages.length}</strong></span>
            </div>
            <div className="badge" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.85rem' }}>
              <XCircle size={16} />
              <span>Закрыто директивой Disallow: <strong>{disallowedPages.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Disallowed Pages Table if any */}
      <div className="table-container glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Страницы сайта, заблокированные в robots.txt ({disallowedPages.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Эти страницы присутствуют в коде сайта и доступны по ссылкам, но поисковые роботы не будут их индексировать
            </p>
          </div>

          <div className="url-field-wrapper" style={{ maxWidth: '300px' }}>
            <Search className="url-field-icon" size={14} />
            <input
              type="text"
              className="url-input"
              style={{ padding: '6px 10px 6px 32px', fontSize: '0.8rem' }}
              placeholder="Поиск по закрытым URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredDisallowed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.85rem' }}>
            {disallowedPages.length === 0 ? 'Все обнаруженные страницы открыты для индексации' : 'По запросу страниц не найдено'}
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Статус индекса</th>
                <th>URL страницы</th>
                <th style={{ width: '100px' }}>Код ответа</th>
                <th>Откуда на нее ссылаются</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisallowed.map((page) => (
                <tr key={page.url}>
                  <td>
                    <span className="badge" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
                      ⛔ Disallow
                    </span>
                  </td>
                  <td>
                    <span className="url-code">{page.url}</span>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      {page.title}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${Math.floor((page.statusCode || 200) / 100)}xx`}>
                      {page.statusCode || 'ERR'}
                    </span>
                  </td>
                  <td>
                    <span className="url-code" style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>
                      {page.parentUrl || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Raw robots.txt viewer */}
      {robotsInfo.content && (
        <div className="table-container glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileCode size={18} color="#818cf8" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Содержимое файла {robotsInfo.robotsUrl}
            </h4>
          </div>
          <pre
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              color: '#cbd5e1',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              maxHeight: '300px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {robotsInfo.content}
          </pre>
        </div>
      )}
    </div>
  );
}
