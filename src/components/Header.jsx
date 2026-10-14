import React from 'react';
import { Globe2, Activity, Zap, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="app-header glass-panel">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Globe2 size={24} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">SiteCrawler & Network Profiler</h1>
          <p className="brand-subtitle">
            Аудит вложенности, сетевой водопад ответа и картография внутренних / внешних ссылок
          </p>
        </div>
      </div>
      <div className="header-badges">
        <div className="badge">
          <Zap size={14} color="#f59e0b" />
          <span>Декомпозиция TTFB / DNS / TLS</span>
        </div>
        <div className="badge">
          <Activity size={14} color="#10b981" />
          <span>Рекурсивный BFS граф</span>
        </div>
      </div>
    </header>
  );
}
