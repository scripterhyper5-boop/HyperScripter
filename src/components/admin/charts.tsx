"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminChartPoint } from "@/lib/admin/types";
import { DataEmpty } from "@/components/ui/data-state";

const COLORS = ["#8B5CF6", "#6366F1", "#10B981"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function toChartData(points: AdminChartPoint[]) {
  return points.map((point) => ({
    label: point.label,
    value: point.value,
  }));
}

export function UserGrowthChart({ data }: { data: AdminChartPoint[] }) {
  const chartData = toChartData(data);

  if (chartData.length === 0) {
    return <DataEmpty title="No users yet" description="User growth will appear here" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8B5CF6"
          strokeWidth={2}
          fill="url(#userGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ScriptTrendChart({ data }: { data: AdminChartPoint[] }) {
  const chartData = toChartData(data);

  if (chartData.length === 0) {
    return <DataEmpty title="No scripts yet" description="Script activity will appear here" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SubscriptionsChart({ data }: { data: AdminChartPoint[] }) {
  const chartData = toChartData(data);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <DataEmpty title="No subscriptions yet" description="Active subscriptions will appear here" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
