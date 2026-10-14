import React, { useState, useMemo } from 'react';
import { TreeNode } from './TreeNode';
import { Network, FolderTree, Filter } from 'lucide-react';

export function SiteTree({ treeData, onSelectPage }) {
  const [statusFilter, setStatusFilter] = useState('all'); // all | 2xx | 3xx | 4xx | 5xx | error

  // Filter tree nodes recursively: keep node if it matches OR any of its descendants match
  const filteredTree = useMemo(() => {
    if (!treeData) return null;
    if (statusFilter === 'all') return treeData;

    const filterNode = (node) => {
      const code = node.statusCode || 0;
      let matches = false;

      if (statusFilter === '2xx') matches = code >= 200 && code < 300;
      else if (statusFilter === '3xx') matches = code >= 300 && code < 400;
      else if (statusFilter === '4xx') matches = code >= 400 && code < 500;
      else if (statusFilter === '5xx') matches = code >= 500 || code === 0;
      else if (statusFilter === 'errors') matches = code >= 400 || code === 0 || !node.statusCode;
      else if (statusFilter === 'robots_disallow') matches = node.isAllowedByRobots === false;
      else if (statusFilter === 'robots_allow') matches = node.isAllowedByRobots === true;
      else if (statusFilter === 'sitemap_missing') matches = node.isInSitemap === false;
      else if (statusFilter === 'sitemap_present') matches = node.isInSitemap === true;

      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(Boolean);

      // Keep node if it matches itself or has matching children
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          // highlight if node matches filter directly
          isDirectMatch: matches,
        };
      }
      return null;
    };

    return filterNode(treeData);
  }, [treeData, statusFilter]);

  if (!treeData) {
    return (
      <div className="tree-container glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '12px' }}>
        <FolderTree size={42} strokeWidth={1.5} />
        <p>Запустите сканирование сайта для построения иерархического дерева страниц</p>
      </div>
    );
  }

  return (
    <div className="tree-container glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
          <Network size={16} />
          <span>Иерархическая карта структуры сайта:</span>
        </div>

        {/* Status Code Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Фильтр:
          </span>
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
            Все
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
            2xx Успех
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === '3xx' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === '3xx' ? '#38bdf8' : 'var(--border-color)',
              color: statusFilter === '3xx' ? '#38bdf8' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('3xx')}
          >
            3xx Редиректы
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === '4xx' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === '4xx' ? '#f59e0b' : 'var(--border-color)',
              color: statusFilter === '4xx' ? '#fbbf24' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('4xx')}
          >
            4xx Ошибки (404 и др.)
          </button>
          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === '5xx' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === '5xx' ? '#ef4444' : 'var(--border-color)',
              color: statusFilter === '5xx' ? '#f87171' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('5xx')}
          >
            5xx / Ошибки сети
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
            ⚠️ Все ошибки (4xx + 5xx)
          </button>

          <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'robots_disallow' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'robots_disallow' ? '#ef4444' : 'var(--border-color)',
              color: statusFilter === 'robots_disallow' ? '#f87171' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('robots_disallow')}
            title="Страницы, которые запрещены для роботов директивой Disallow в robots.txt"
          >
            ⛔ Закрыто в robots.txt
          </button>

          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'robots_allow' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'robots_allow' ? '#10b981' : 'var(--border-color)',
              color: statusFilter === 'robots_allow' ? '#34d399' : '#94a3b8',
            }}
            onClick={() => setStatusFilter('robots_allow')}
            title="Страницы, разрешенные в robots.txt"
          >
            ✅ Открыто для роботов
          </button>

          <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

          <button
            className="badge"
            style={{
              cursor: 'pointer',
              background: statusFilter === 'sitemap_missing' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: statusFilter === 'sitemap_missing' ? '#f59e0b' : 'var(--border-color)',
              color: statusFilter === 'sitemap_missing' ? '#fbbf24' : '#94a3b8',
              fontWeight: 700,
            }}
            onClick={() => setStatusFilter('sitemap_missing')}
            title="Страницы, которые есть на сайте, но отсутствуют в sitemap.xml"
          >
            🗺️ Нет в sitemap.xml
          </button>
        </div>
      </div>

      {!filteredTree ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Нет страниц с выбранным статусом ошибки в дереве
        </div>
      ) : (
        <div className="tree-list">
          <TreeNode node={filteredTree} onSelectPage={onSelectPage} />
        </div>
      )}
    </div>
  );
}
