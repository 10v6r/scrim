import React from 'react';
import { Layers, Link2, ExternalLink, Timer } from 'lucide-react';

export function StatsOverview({ pagesCount, linksCount, externalCount, avgResponseTime, status }) {
  const getStatusText = () => {
    switch (status) {
      case 'scanning': return 'Идет сканирование...';
      case 'completed': return 'Обход завершен';
      case 'stopped': return 'Остановлено вручную';
      case 'error': return 'Ошибка запроса';
      default: return 'Ожидание ввода';
    }
  };

  return (
    <div className="stats-grid">
      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>Внутренних страниц</span>
          <Layers size={18} color="#6366f1" />
        </div>
        <div className="stat-value">{pagesCount}</div>
        <div className="stat-desc">Обойдено страниц домена</div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>Всего ссылок</span>
          <Link2 size={18} color="#818cf8" />
        </div>
        <div className="stat-value">{linksCount}</div>
        <div className="stat-desc">Связей на страницах</div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>Внешних ссылок</span>
          <ExternalLink size={18} color="#f59e0b" />
        </div>
        <div className="stat-value">{externalCount}</div>
        <div className="stat-desc">Уникальных внешних целей</div>
      </div>

      <div className="stat-card glass-panel">
        <div className="stat-header">
          <span>Ср. время ответа</span>
          <Timer size={18} color="#10b981" />
        </div>
        <div className="stat-value">{avgResponseTime ? `${avgResponseTime}ms` : '—'}</div>
        <div className="stat-desc">Статус: {getStatusText()}</div>
      </div>
    </div>
  );
}
