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

  // Format data for charts
  const lineData = history.lineData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price: item.price,
  }));

  const candleData = history.candleData.map((item) => {
    const isUp = item.close >= item.open;
    return {
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      bodyTop: Math.max(item.open, item.close),
      bodyBottom: Math.min(item.open, item.close),
      bodyHeight: Math.abs(item.close - item.open),
      isUp,
    };
  });

  const volumeData = history.candleData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    volume: item.volume / 1000000, // Convert to millions
  }));

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
      <div className="flex gap-2 mb-6">
        {(["line", "candlestick", "volume"] as ChartType[]).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" && (
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
          )}

          {chartType === "candlestick" && (
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
          )}

          {chartType === "volume" && (
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

