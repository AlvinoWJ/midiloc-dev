import React, { useState, useEffect } from "react";

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

export function DonutChart({ data, title, legendConfig }: DonutChartProps) {
  const statusColorMap: { [key: string]: string } = {
    OK: "#22C55E", // Hijau untuk status "OK" (Approve)
    "In Progress": "#F59E0B", // Kuning untuk "In Progress"
    NOK: "#da3a3aff",
    "Waiting for Forum": "#3b82f6",
  };
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const createPath = (percentage: number, cumulativePercentage: number) => {
    const animatedPercentage = percentage * animationProgress;
    const cappedPercentage = Math.min(animatedPercentage, 99.99);
    const angle = (cappedPercentage / 100) * 360;
    const startAngle = (cumulativePercentage / 100) * 360 - 90;

    // Untuk persentase > 50%, pecah menjadi 2 arc untuk menghindari glitch
    if (cappedPercentage > 50) {
      // Arc pertama: dari start sampai 180°
      const midAngle = startAngle + 180;
      const midAngleRad = (midAngle * Math.PI) / 180;
      const startAngleRad = (startAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startAngleRad);
      const y1 = 50 + 40 * Math.sin(startAngleRad);
      const xMid = 50 + 40 * Math.cos(midAngleRad);
      const yMid = 50 + 40 * Math.sin(midAngleRad);

      // Arc kedua: dari 180° sampai end
      const endAngle = startAngle + angle;
      const endAngleRad = (endAngle * Math.PI) / 180;
      const x2 = 50 + 40 * Math.cos(endAngleRad);
      const y2 = 50 + 40 * Math.sin(endAngleRad);

      // Gabungkan 2 arc dengan largeArcFlag = 0 untuk keduanya
      return `M 50,50 L ${x1},${y1} A 40,40 0 0,1 ${xMid},${yMid} A 40,40 0 0,1 ${x2},${y2} Z`;
    }

    // Untuk persentase <= 50%, gunakan single arc seperti biasa
    const endAngle = startAngle + angle;
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startAngleRad);
    const y1 = 50 + 40 * Math.sin(startAngleRad);
    const x2 = 50 + 40 * Math.cos(endAngleRad);
    const y2 = 50 + 40 * Math.sin(endAngleRad);

    return `M 50,50 L ${x1},${y1} A 40,40 0 0,1 ${x2},${y2} Z`;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)] relative">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg
            width="300"
            height="300"
            viewBox="0 0 100 100"
            onMouseMove={handleMouseMove}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            {data.map((item, index) => {
              const color = statusColorMap[item.status];
              const percentage = (item.value / total) * 100;
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
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
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

      {/* ======================================== */}
      {/* == LEGEND STATIS BARU DITAMBAHKAN DI SINI == */}
      {/* ======================================== */}
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

      {/* Tooltip */}
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
            {Math.round((data[hoveredIndex].value / total) * 100)}
            %)
          </div>
        </div>
      )}
    </div>
  );
}
