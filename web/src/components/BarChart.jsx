/** 純 SVG 雙序列長條圖（開放/關閉票務），無外部依賴 */
export default function BarChart({ data }) {
  if (!data?.length) return <div className="empty">尚無數據</div>;

  const max = Math.max(1, ...data.map((d) => d.open + d.closed));
  const W = 640;
  const H = 160;
  const barW = Math.max(4, (W / data.length) * 0.55);
  const slot = W / data.length;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="bar-chart" role="img" aria-label="近 14 日票務趨勢">
        {data.map((d, i) => {
          const openH = (d.open / max) * H;
          const closedH = (d.closed / max) * H;
          const x = i * slot + (slot - barW) / 2;
          return (
            <g key={d.day}>
              <title>{`${d.day}: 開放 ${d.open} / 關閉 ${d.closed}`}</title>
              <rect x={x} y={H - closedH - openH} width={barW} height={openH + closedH} rx={2} fill="#7c5cff" opacity={0.55} />
              <rect x={x} y={H - closedH} width={barW} height={closedH} rx={2} fill="#0c8a6e" opacity={0.9} />
              <text x={x + barW / 2} y={H + 16} fontSize="9" textAnchor="middle" fill="currentColor" opacity={0.55}>
                {d.day.slice(5)}
              </text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" strokeOpacity={0.15} />
      </svg>
      <div className="chart-legend">
        <span><i className="legend-dot open" /> 開放</span>
        <span><i className="legend-dot closed" /> 關閉/歸檔</span>
      </div>
    </div>
  );
}
