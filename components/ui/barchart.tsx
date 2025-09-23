// components/dashboard/BarChart.tsx
"use client";

import React from "react";

interface BarChartProps {
  data: {
    month: string;
    approved: number;
    pending: number;
  }[];
  title: string;
}

export function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.approved + d.pending));

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64">
        <div className="flex items-end justify-between h-full space-x-2">
          {data.map((item, index) => {
            const approvedHeight = (item.approved / maxValue) * 100;
            const pendingHeight = (item.pending / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full flex flex-col-reverse mb-2"
                  style={{ height: "200px" }}
                >
                  <div
                    className="bg-orange-400 rounded-t-sm"
                    style={{ height: `${pendingHeight}%` }}
                  ></div>
                  <div
                    className="bg-green-500 rounded-t-sm"
                    style={{ height: `${approvedHeight}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 transform -rotate-45 origin-left">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-center space-x-4 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Approve</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-400 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
      </div>
    </div>
  );
}
