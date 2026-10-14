import React, { useState, useMemo } from 'react';
import { Map, AlertTriangle, CheckCircle2, Search, ExternalLink, ArrowRight, Download } from 'lucide-react';

export function SitemapComparisonView({ sitemapInfo, pages = new Map() }) {
  const [filterMode, setFilterMode] = useState('missing'); // missing | present | all
  const [search, setSearch] = useState('');

  if (!sitemapInfo) {
    return (
      <div className="table-container glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
        <Map size={40} style={{ marginBottom: '12px' }} />
        <p>Запустите сканирование сайта для автоматического сравнения найденных страниц с sitemap.xml</p>
      </div>
    );
  }

  const pagesArray = Array.from(pages.values());
  const missingPages = pagesArray.filter((p) => p.isInSitemap === false);
  const presentPages = pagesArray.filter((p) => p.isInSitemap === true);

  const displayedList = useMemo(() => {
    let list = [];
    if (filterMode === 'missing') list = missingPages;
    else if (filterMode === 'present') list = presentPages;
    else list = pagesArray;

    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((p) => p.url.toLowerCase().includes(s) || (p.title && p.title.toLowerCase().includes(s)));
  }, [filterMode, missingPages, presentPages, pagesArray, search]);

  const handleExportCsv = () => {
    const header = 'URL,Статус код,В sitemap.xml,Откуда ссылается,Анкор\n';
    const rows = missingPages
      .map((p) => `"${p.url}","${p.statusCode || ''}","Нет","${p.parentUrl || ''}","${(p.anchorText || '').replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `missing_from_sitemap_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon" style={{ background: sitemapInfo.found ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <Map size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {sitemapInfo.found ? 'Файл sitemap.xml загружен и сопоставлен' : 'Файл sitemap.xml не найден'}
              </h3>
              <a
                href={sitemapInfo.sitemapUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>{sitemapInfo.sitemapUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="badge" style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', fontSize: '0.85rem' }}>
              <span>Всего URL в sitemap: <strong>{sitemapInfo.totalUrls || 0}</strong></span>
            </div>
            <div className="badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Есть в карте: <strong>{presentPages.length}</strong></span>
            </div>
            <div className="badge" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>Нет в карте: <strong>{missingPages.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="table-container glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn-primary ${filterMode === 'missing' ? '' : 'btn-stop'}`}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                background: filterMode === 'missing' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.05)',
                color: filterMode === 'missing' ? '#fbbf24' : '#94a3b8',
                borderColor: filterMode === 'missing' ? '#f59e0b' : 'var(--border-color)',
                fontWeight: 700,
              }}
              onClick={() => setFilterMode('missing')}
            >
              ⚠️ Отсутствуют в sitemap ({missingPages.length})
            </button>
            <button
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                background: filterMode === 'present' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                color: filterMode === 'present' ? '#38bdf8' : '#94a3b8',
                borderColor: filterMode === 'present' ? '#38bdf8' : 'var(--border-color)',
              }}
              onClick={() => setFilterMode('present')}
            >
              Присутствуют ({presentPages.length})
            </button>
            <button
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                background: filterMode === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                color: filterMode === 'all' ? '#818cf8' : '#94a3b8',
                borderColor: filterMode === 'all' ? '#6366f1' : 'var(--border-color)',
              }}
              onClick={() => setFilterMode('all')}
            >
              Все найденные ({pagesArray.length})
            </button>

            {missingPages.length > 0 && (
              <button
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: '1px solid var(--border-color)' }}
                onClick={handleExportCsv}
                title="Скачать список страниц, которых нет в карте сайта"
              >
                <Download size={14} />
                <span>Экспорт CSV</span>
              </button>
            )}
          </div>

          <div className="url-field-wrapper" style={{ maxWidth: '300px' }}>
            <Search className="url-field-icon" size={14} />
            <input
              type="text"
              className="url-input"
              style={{ padding: '6px 10px 6px 32px', fontSize: '0.8rem' }}
              placeholder="Поиск по URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {displayedList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {filterMode === 'missing'
              ? 'Отлично! Все просканированные страницы присутствуют в sitemap.xml'
              : 'Страницы не найдены'}
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Статус карты</th>
                <th>URL страницы</th>
                <th style={{ width: '90px' }}>Код ответа</th>
                <th>Откуда найдена ссылка (Источник)</th>
                <th>Анкорный текст</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map((page) => (
                <tr key={page.url}>
                  <td>
                    {page.isInSitemap ? (
                      <span className="badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
                        ✓ В карте
                      </span>
                    ) : (
                      <span className="badge" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)' }}>
                        ⚠️ Нет в sitemap
                      </span>
                    )}
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
                      {page.parentUrl || '(главная)'}
                    </span>
                  </td>
                  <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                    {page.anchorText || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
