import React, { useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';

export function HeadersViewer({ headers = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [search, setSearch] = useState('');

  const entries = Object.entries(headers);

  const filtered = entries.filter(([key, val]) => {
    if (!search) return true;
    return key.toLowerCase().includes(search.toLowerCase()) || String(val).toLowerCase().includes(search.toLowerCase());
  });

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(`${key}: ${val}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          HTTP Заголовки ответа ({entries.length})
        </h4>

        <div className="url-field-wrapper" style={{ maxWidth: '260px' }}>
          <Search className="url-field-icon" size={14} />
          <input
            type="text"
            className="url-input"
            style={{ padding: '6px 10px 6px 32px', fontSize: '0.8rem' }}
            placeholder="Фильтр заголовков..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            Заголовки не найдены
          </div>
        ) : (
          <table className="custom-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '220px' }}>Имя заголовка</th>
                <th>Значение</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(([key, val]) => (
                <tr key={key}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#818cf8' }}>
                    {key}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: '#e2e8f0' }}>
                    {String(val)}
                  </td>
                  <td>
                    <button
                      className="btn-close"
                      onClick={() => handleCopy(key, val)}
                      title="Скопировать заголовок"
                    >
                      {copiedKey === key ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
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
