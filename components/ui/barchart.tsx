import React, { useState, useEffect, useRef } from "react";

const barColors: { [key: string]: string } = {
  approved: "#22C55E",
  nok: "#EF4444",
  inProgress: "#F59E0B",
  waitingforforum: "#3B82F6",
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
    key: string;
    label: string;
  }[];
}

export function BarChart({ data, title, legendConfig }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredType, setHoveredType] = useState<
    "approved" | "in progress" | "nok" | null
  >(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const maxValue = 100;

  // Responsive chart height
  const chartHeightPx = containerWidth < 640 ? 180 : 256;

  // Calculate available space and bar width
  const availableWidth = containerWidth - 64; // padding + y-axis space
  const totalGapSpace = (data.length - 1) * 4; // gap between bars
  const barWidth = Math.max(
    18,
    Math.min(32, (availableWidth - totalGapSpace) / data.length)
  );

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
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">
        {title}
      </h3>

      <div
        ref={containerRef}
        className="relative"
        onMouseMove={handleMouseMove}
      >
        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-0 flex flex-col-reverse justify-between text-gray-500"
          style={{ height: `${chartHeightPx}px`, marginLeft: "-8px" }}
        >
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <div key={v} className="text-[10px] sm:text-xs lg:text-sm">
              {v}
            </div>
          ))}
        </div>

        {/* Main Chart Area */}
        <div className="ml-4 sm:ml-6">
          <div
            className="relative bg-white"
            style={{ height: `${chartHeightPx}px` }}
          >
            {/* Grid lines */}
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <div
                key={v}
                className="absolute w-full border-t border-gray-300"
                style={{ bottom: `${(v / maxValue) * 100}%` }}
              />
            ))}

            {/* Bars container */}
            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between">
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
                      width: `${barWidth}px`,
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
          <div className="flex justify-between items-center mt-2">
            {data.map((item, index) => (
              <div
                key={index}
                className="text-center"
                style={{
                  width: `${barWidth}px`,
                }}
              >
                <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600 inline-block leading-tight">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Dinamis */}
      <div className="flex items-center justify-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 mt-4 sm:mt-6">
        {legendConfig.map((item) => (
          <div key={item.key} className="flex items-center">
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: barColors[item.key] }}
            ></div>
            <span className="text-xs sm:text-sm lg:text-base text-gray-700">
              {item.label}
            </span>
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

// Demo component
export default function App() {
  const sampleData = [
    { month: "Jan", approved: 45, nok: 15, inProgress: 20 },
    { month: "Feb", approved: 55, nok: 10, inProgress: 15 },
    { month: "Mar", approved: 60, nok: 12, inProgress: 18 },
    { month: "Apr", approved: 50, nok: 20, inProgress: 15 },
    { month: "May", approved: 65, nok: 8, inProgress: 12 },
    { month: "Jun", approved: 70, nok: 5, inProgress: 10 },
    { month: "Jul", approved: 58, nok: 15, inProgress: 17 },
    { month: "Aug", approved: 62, nok: 13, inProgress: 15 },
  ];

  const legendConfig = [
    { key: "approved", label: "Approved" },
    { key: "inProgress", label: "In Progress" },
    { key: "nok", label: "NOK" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <BarChart
          data={sampleData}
          title="Monthly Project Status"
          legendConfig={legendConfig}
        />
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Resize browser window untuk melihat
            responsivitas chart
          </p>
        </div>
      </div>
    </div>
  );
}
