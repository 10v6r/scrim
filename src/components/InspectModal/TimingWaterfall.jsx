import React from 'react';

export function TimingWaterfall({ timings = {} }) {
  const { dns = 0, tcp = 0, tls = 0, ttfb = 0, download = 0, total = 0 } = timings;

  const phases = [
    { key: 'dns', label: 'DNS Lookup', val: dns, color: 'var(--color-dns)', desc: 'Разрешение доменного имени в IP' },
    { key: 'tcp', label: 'TCP Handshake', val: tcp, color: 'var(--color-tcp)', desc: 'Установка TCP-сокета' },
    { key: 'tls', label: 'TLS / SSL Handshake', val: tls, color: 'var(--color-tls)', desc: 'Шифрование и согласование сертификата' },
    { key: 'ttfb', label: 'TTFB (First Byte)', val: ttfb, color: 'var(--color-ttfb)', desc: 'Ожидание ответа веб-сервера' },
    { key: 'download', label: 'Content Transfer', val: download, color: 'var(--color-download)', desc: 'Чтение и загрузка HTML потока' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Фазы сетевого времени ответа</h4>
        <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
          Всего: {total} ms
        </span>
      </div>

      <div className="breakdown-list">
        {phases.map((phase) => {
          const percent = total > 0 ? ((phase.val / total) * 100).toFixed(1) : 0;
          return (
            <div key={phase.key} className="breakdown-row">
              <div className="breakdown-label">
                <div className="color-dot" style={{ backgroundColor: phase.color }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{phase.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{phase.desc}</div>
                </div>
              </div>

              <div className="breakdown-bar-track">
                <div
                  className="breakdown-bar-fill"
                  style={{
                    width: `${Math.max(phase.val > 0 ? 3 : 0, percent)}%`,
                    backgroundColor: phase.color,
                  }}
                />
              </div>

              <div className="breakdown-value">
                <div>{phase.val} ms</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{percent}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
