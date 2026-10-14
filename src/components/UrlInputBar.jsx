import React, { useState } from 'react';
import { Search, Play, Square, Settings2 } from 'lucide-react';

export function UrlInputBar({ status, onStart, onStop }) {
  const [url, setUrl] = useState('https://praweb.ru');
  const [maxDepth, setMaxDepth] = useState(5);
  const [maxPages, setMaxPages] = useState(150);
  const [concurrency, setConcurrency] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onStart({ url: url.trim(), maxDepth, maxPages, concurrency });
  };

  const isScanning = status === 'scanning';

  return (
    <div className="input-section glass-panel">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="url-input-row">
          <div className="url-field-wrapper">
            <Search className="url-field-icon" size={20} />
            <input
              type="text"
              id="target-url-input"
              className="url-input"
              placeholder="Введите адрес сайта (например, https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              required
            />
          </div>

          {!isScanning ? (
            <button type="submit" id="start-crawler-btn" className="btn-primary">
              <Play size={18} />
              <span>Сканировать</span>
            </button>
          ) : (
            <button type="button" id="stop-crawler-btn" className="btn-stop" onClick={onStop}>
              <Square size={18} />
              <span>Остановить</span>
            </button>
          )}
        </div>

        <div className="crawler-options-row">
          <div className="option-group">
            <Settings2 size={16} />
            <label htmlFor="max-depth-select">Макс. глубина:</label>
            <select
              id="max-depth-select"
              className="option-select"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              disabled={isScanning}
            >
              <option value={1}>1 уровень (только прямые ссылки)</option>
              <option value={2}>2 уровня</option>
              <option value={3}>3 уровня</option>
              <option value={4}>4 уровня</option>
              <option value={5}>5 уровней (глубокий обход)</option>
              <option value={7}>7 уровней</option>
              <option value={10}>10 уровней (максимальный)</option>
            </select>
          </div>

          <div className="option-group">
            <label htmlFor="max-pages-input">Лимит страниц:</label>
            <input
              type="number"
              id="max-pages-input"
              className="option-input"
              min={5}
              max={1000}
              step={25}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              disabled={isScanning}
              style={{ width: '90px' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(до 1000)</span>
          </div>

          <div className="option-group">
            <label htmlFor="concurrency-select">Параллельность:</label>
            <select
              id="concurrency-select"
              className="option-select"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={isScanning}
            >
              <option value={1}>1 поток (вежливый)</option>
              <option value={3}>3 потока</option>
              <option value={5}>5 потоков (рекомендуется)</option>
              <option value={10}>10 потоков (быстрый)</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
