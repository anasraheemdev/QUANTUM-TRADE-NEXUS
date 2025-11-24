"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { StockHistory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface StockChartProps {
  history: StockHistory;
}

type ChartType = "line" | "candlestick" | "volume";

export default function StockChart({ history }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>("line");

  // Validate and format data for charts
  if (!history || !history.lineData || !history.candleData) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card p-6">
        <p className="text-red-400">No chart data available</p>
      </div>
    );
  }

  // Format data for charts with error handling
  const lineData = (history.lineData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: Number(item.price) || 0,
      };
    } catch (error) {
      return {
        date: "Invalid",
        price: 0,
      };
    }
  }).filter(item => item.price > 0);

  const candleData = (history.candleData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      const isUp = (item.close || 0) >= (item.open || 0);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        open: Number(item.open) || 0,
        high: Number(item.high) || 0,
        low: Number(item.low) || 0,
        close: Number(item.close) || 0,
        bodyTop: Math.max(item.open || 0, item.close || 0),
        bodyBottom: Math.min(item.open || 0, item.close || 0),
        bodyHeight: Math.abs((item.close || 0) - (item.open || 0)),
        isUp,
      };
    } catch (error) {
      return {
        date: "Invalid",
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        bodyTop: 0,
        bodyBottom: 0,
        bodyHeight: 0,
        isUp: false,
      };
    }
  }).filter(item => item.close > 0);

  const volumeData = (history.candleData || []).map((item) => {
    try {
      const date = item.date ? new Date(item.date) : new Date();
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        volume: (Number(item.volume) || 0) / 1000000, // Convert to millions
      };
    } catch (error) {
      return {
        date: "Invalid",
        volume: 0,
      };
    }
  }).filter(item => item.volume > 0);

  // Show message if no valid data
  if (lineData.length === 0 && candleData.length === 0) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card p-6">
        <p className="text-red-400">No valid chart data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-blue-accent mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-white" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-6">
      {/* Chart Type Selector */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
        {(["line", "candlestick", "volume"] as ChartType[]).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              chartType === type
                ? "bg-blue-gradient text-white shadow-blue-glow"
                : "bg-dark-hover text-blue-accent hover:text-blue-primary"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="h-64 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis
                dataKey="date"
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                tickCount={10}
              />
              <YAxis
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          ) : chartType === "candlestick" ? (
            <ComposedChart data={candleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis
                dataKey="date"
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                tickCount={10}
              />
              <YAxis
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
                        <p className="text-blue-accent mb-2">{label}</p>
                        <p className="text-white">Open: {formatCurrency(data.open)}</p>
                        <p className="text-white">High: {formatCurrency(data.high)}</p>
                        <p className="text-white">Low: {formatCurrency(data.low)}</p>
                        <p className="text-white">Close: {formatCurrency(data.close)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* High line */}
              <Line
                type="monotone"
                dataKey="high"
                stroke="#60a5fa"
                strokeWidth={1}
                dot={false}
                connectNulls
              />
              {/* Low line */}
              <Line
                type="monotone"
                dataKey="low"
                stroke="#60a5fa"
                strokeWidth={1}
                dot={false}
                connectNulls
              />
              {/* Open price line */}
              <Line
                type="monotone"
                dataKey="open"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              {/* Close price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          ) : (
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis
                dataKey="date"
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                tickCount={10}
              />
              <YAxis
                stroke="#93c5fd"
                tick={{ fill: "#93c5fd" }}
                label={{ value: "Volume (M)", angle: -90, position: "insideLeft", fill: "#93c5fd" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
                        <p className="text-blue-accent mb-2">{payload[0].payload.date}</p>
                        <p className="text-white">
                          Volume: {(payload[0].value as number).toFixed(2)}M
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

