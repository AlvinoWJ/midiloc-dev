import React, { useState, useEffect } from "react";

const barColors: { [key: string]: string } = {
  approved: "#22C55E", // green-500
  nok: "#EF4444", // red-500
  inProgress: "#F59E0B", // yellow-500
  waitingforforum: "#3B82F6", // blue-500 (untuk KPLT)
};

interface BarChartProps {
  data: {
    month: string;
    approved: number;
    nok: number;
    inProgress: number;
    waitingforforum?: number;
  }[];
  title: string;
  legendConfig: {
    key: string; // 'approved', 'nok', 'inProgress', etc.
    label: string; // "Approved", "NOK", "In Progress", etc.
  }[];
}

export function BarChart({ data, title, legendConfig }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredType, setHoveredType] = useState<
    "approved" | "in progress" | "nok" | null
  >(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxValue = 100;
  const chartHeightPx = 256;

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleBarHover = (
    index: number,
    type: "approved" | "in progress" | "nok"
  ) => {
    setHoveredIndex(index);
    setHoveredType(type);
  };

  const handleBarLeave = () => {
    setHoveredIndex(null);
    setHoveredType(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      <h3 className="text-lg font-semibold mb-6 text-gray-800">{title}</h3>

      <div className="relative" onMouseMove={handleMouseMove}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col-reverse justify-between text-xs text-gray-500 -ml-2">
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <div key={v}>{v}</div>
          ))}
        </div>

        {/* Main Chart Area */}
        <div className="ml-6">
          <div className="h-64 relative bg-white">
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <div
                key={v}
                className="absolute w-full border-t border-gray-300"
                style={{ bottom: `${(v / maxValue) * 100}%` }}
              />
            ))}

            {/* Bars container */}
            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-around px-2">
              {data.map((item, index) => {
                const totalValue = item.approved + item.inProgress + item.nok;
                const cappedTotal = Math.min(totalValue, maxValue);
                const totalHeightPercentage =
                  (cappedTotal / maxValue) * 100 * animationProgress;

                const approvedHeight =
                  totalValue > 0
                    ? (item.approved / totalValue) * totalHeightPercentage
                    : 0;
                const inProgressHeight =
                  totalValue > 0
                    ? (item.inProgress / totalValue) * totalHeightPercentage
                    : 0;
                const nokHeight =
                  totalValue > 0
                    ? (item.nok / totalValue) * totalHeightPercentage
                    : 0;

                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={index}
                    className="relative flex flex-col-reverse"
                    style={{
                      width: "28px",
                      height: `${
                        (chartHeightPx / 100) * totalHeightPercentage
                      }px`,
                    }}
                  >
                    {/* Approved section (green) */}
                    <div
                      className={`w-full bg-green-500 cursor-pointer transition-all duration-300 ${
                        hoveredIndex === null
                          ? "opacity-80"
                          : isHovered && hoveredType === "approved"
                          ? "opacity-100 shadow-lg"
                          : "opacity-50"
                      }`}
                      style={{
                        height: `${(chartHeightPx / 100) * approvedHeight}px`,
                        borderRadius: "2px 2px 0 0",
                      }}
                      onMouseEnter={() => handleBarHover(index, "approved")}
                      onMouseLeave={handleBarLeave}
                    />

                    {/* In Progress section (yellow) */}
                    <div
                      className={`w-full bg-yellow-500 cursor-pointer transition-all duration-300 ${
                        hoveredIndex === null
                          ? "opacity-80"
                          : isHovered && hoveredType === "in progress"
                          ? "opacity-100 shadow-lg"
                          : "opacity-50"
                      }`}
                      style={{
                        height: `${(chartHeightPx / 100) * inProgressHeight}px`,
                      }}
                      onMouseEnter={() => handleBarHover(index, "in progress")}
                      onMouseLeave={handleBarLeave}
                    />

                    {/* NOK section (red) */}
                    <div
                      className={`w-full bg-red-500 cursor-pointer transition-all duration-300 ${
                        hoveredIndex === null
                          ? "opacity-80"
                          : isHovered && hoveredType === "nok"
                          ? "opacity-100 shadow-lg"
                          : "opacity-50"
                      }`}
                      style={{
                        height: `${(chartHeightPx / 100) * nokHeight}px`,
                        borderRadius:
                          approvedHeight === 0 && inProgressHeight === 0
                            ? "0 0 2px 2px"
                            : "0",
                      }}
                      onMouseEnter={() => handleBarHover(index, "nok")}
                      onMouseLeave={handleBarLeave}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-around px-2 mt-2">
            {data.map((item, index) => (
              <div
                key={index}
                className="text-center"
                style={{ minWidth: "28px" }}
              >
                <span className="text-xs text-gray-600">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Dinamis */}
      <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 mt-6">
        {legendConfig.map((item) => (
          <div key={item.key} className="flex items-center">
            <div
              className="w-4 h-3 mr-2 rounded-sm"
              style={{ backgroundColor: barColors[item.key] }}
            ></div>
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && hoveredType && (
        <div
          className="fixed bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 pointer-events-none transition-all duration-200"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: "translate(0, -100%)",
          }}
        >
          <div className="text-sm font-medium">{data[hoveredIndex].month}</div>
          <div className="text-xs opacity-90">
            {hoveredType === "approved"
              ? `Approved : ${data[hoveredIndex].approved}`
              : hoveredType === "in progress"
              ? `In Progress : ${data[hoveredIndex].inProgress}`
              : `NOK : ${data[hoveredIndex].nok}`}
          </div>
          <div className="text-xs opacity-75">
            Total :{" "}
            {data[hoveredIndex].approved +
              data[hoveredIndex].inProgress +
              data[hoveredIndex].nok}
          </div>
        </div>
      )}
    </div>
  );
}
