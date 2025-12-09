import React, { useState, useEffect } from "react";

/**
 * Props untuk komponen DonutChart.
 * - `data`: daftar status beserta value-nya
 * - `title`: judul chart
 * - `legendConfig`: konfigurasi legend (status → label)
 */
interface DonutChartProps {
  data: {
    status: string;
    label: string;
    value: number;
  }[];
  title: string;
  legendConfig: {
    status: string;
    label: string;
  }[];
}

// Komponen Legend dan interface LegendProps sudah dihapus dari sini

/**
 * DonutChart Component
 * --------------------
 * Komponen untuk menampilkan chart berbentuk donut dengan animasi,
 * hover effect, tooltip dinamis, dan legend statis.
 *
 * Fitur utama:
 * - Animasi growth dari 0% → penuh
 * - Highlight slice ketika di-hover
 * - Tooltip mengikuti posisi mouse
 * - Legend statis berdasarkan status
 */
export function DonutChart({ data, title, legendConfig }: DonutChartProps) {
  /**
   * Mapping warna berdasarkan status.
   * Warna disesuaikan kebutuhan dashboard.
   */
  const statusColorMap: { [key: string]: string } = {
    OK: "#22C55E",
    "In Progress": "#F59E0B",
    NOK: "#da3a3aff",
    "Waiting for Forum": "#3b82f6",
  };

  /** Index slice yang sedang di-hover, null saat tidak ada hover */
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /** Progress animasi (0 → 1) untuk membuat donat "tumbuh" */
  const [animationProgress, setAnimationProgress] = useState(0);

  /** Posisi mouse saat hover (untuk tooltip) */
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  /**
   * Menjalankan animasi setelah komponen mount.
   * Animasi berjalan 100ms setelah render.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /** Total value (untuk menghitung persen tiap slice) */
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  /**
   * Membuat path SVG untuk slice donut.
   * Meng-handle kasus persentase > 50% dengan memecah arc menjadi 2 bagian
   * agar tidak terjadi glitch pada large-arc SVG.
   */
  const createPath = (percentage: number, cumulativePercentage: number) => {
    const animatedPercentage = percentage * animationProgress;
    const cappedPercentage = Math.min(animatedPercentage, 99.99);
    const angle = (cappedPercentage / 100) * 360;
    const startAngle = (cumulativePercentage / 100) * 360 - 90;

    // Jika persen > 50%, pecah menjadi 2 arc
    if (cappedPercentage > 50) {
      const midAngle = startAngle + 180;
      const midAngleRad = (midAngle * Math.PI) / 180;
      const startAngleRad = (startAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startAngleRad);
      const y1 = 50 + 40 * Math.sin(startAngleRad);
      const xMid = 50 + 40 * Math.cos(midAngleRad);
      const yMid = 50 + 40 * Math.sin(midAngleRad);

      const endAngle = startAngle + angle;
      const endAngleRad = (endAngle * Math.PI) / 180;
      const x2 = 50 + 40 * Math.cos(endAngleRad);
      const y2 = 50 + 40 * Math.sin(endAngleRad);

      /**
       * Membuat path dengan 2 arc
       */
      return `M 50,50 L ${x1},${y1} A 40,40 0 0,1 ${xMid},${yMid} A 40,40 0 0,1 ${x2},${y2} Z`;
    }

    // Jika persen <= 50%, cukup 1 arc saja
    const endAngle = startAngle + angle;
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startAngleRad);
    const y1 = 50 + 40 * Math.sin(startAngleRad);
    const x2 = 50 + 40 * Math.cos(endAngleRad);
    const y2 = 50 + 40 * Math.sin(endAngleRad);

    return `M 50,50 L ${x1},${y1} A 40,40 0 0,1 ${x2},${y2} Z`;
  };

  /**
   * Handler untuk mendeteksi posisi kursor (dipakai tooltip)
   */
  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)] relative">
      {/* Judul Chart */}
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {/* Chart utama */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg
            width="300"
            height="300"
            viewBox="0 0 100 100"
            onMouseMove={handleMouseMove}
          >
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />

            {/* Slice donut */}
            {data.map((item, index) => {
              const color = statusColorMap[item.status];
              const percentage = (item.value / total) * 100;

              // Hindari slice 100% menyebabkan glitch
              const drawablePercentage =
                percentage >= 100 ? 99.999 : percentage;

              const path = createPath(drawablePercentage, cumulativePercentage);

              cumulativePercentage += percentage;

              const isHovered = hoveredIndex === index;

              return (
                <path
                  key={index}
                  d={path}
                  fill={color}
                  opacity={hoveredIndex === null ? 0.8 : isHovered ? 1 : 0.5}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "50px 50px",
                    filter: isHovered
                      ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                      : "none",
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {/* Lingkaran tengah (lubang donut) */}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>

          {/* Data tengah donut */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center transition-all duration-300">
              <div className="text-2xl font-bold text-gray-900">
                {hoveredIndex !== null
                  ? Math.round((data[hoveredIndex].value / total) * 100)
                  : data[0]
                  ? Math.round((data[0].value / total) * 100)
                  : 0}
                %
              </div>

              <div className="text-sm text-gray-600">
                {hoveredIndex !== null
                  ? data[hoveredIndex].status
                  : data[0]?.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend statis (di bawah chart) */}
      <div className="mt-6 flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
        {legendConfig.map((item, index) => (
          <div key={index} className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: statusColorMap[item.status] }}
            ></span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip mengikuti mouse */}
      {hoveredIndex !== null && (
        <div
          className="fixed bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 pointer-events-none transition-all duration-200"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: "translate(0, -100%)",
          }}
        >
          <div className="text-sm font-medium">{data[hoveredIndex].status}</div>
          <div className="text-xs opacity-90">
            Value : {data[hoveredIndex].value} (
            {Math.round((data[hoveredIndex].value / total) * 100)}%)
          </div>
        </div>
      )}
    </div>
  );
}
