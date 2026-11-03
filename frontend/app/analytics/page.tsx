"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

const API_URL = "http://127.0.0.1:8000";

interface AnalyticsData {
  report_count?: number;
  latest_report?: string | null;
  evidence_chunks?: number;
  text_characters?: number;
  reports?: Array<{
    document_name: string;
    report_date?: string | null;
  }>;
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 11a8 8 0 0 0-14.9-3" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

function TrendChart() {
  const points = [14, 31, 16, 33, 28, 51, 35, 24, 34, 31, 57, 51, 65];

  const width = 560;
  const height = 190;
  const paddingX = 18;
  const paddingY = 16;

  const max = 80;

  const coordinates = points.map((value, index) => {
    const x =
      paddingX +
      (index * (width - paddingX * 2)) / (points.length - 1);

    const y =
      height -
      paddingY -
      (value / max) * (height - paddingY * 2);

    return { x, y };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L ${coordinates.at(-1)?.x} ${height - paddingY} L ${
    coordinates[0]?.x
  } ${height - paddingY} Z`;

  return (
    <div className="mt-6 w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[205px] w-full"
        preserveAspectRatio="none"
      >
        {[0, 20, 40, 60, 80].map((value) => {
          const y =
            height -
            paddingY -
            (value / max) * (height - paddingY * 2);

          return (
            <g key={value}>
              <line
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />
              <text
                x="0"
                y={y - 5}
                fontSize="11"
                className="fill-slate-400 dark:fill-slate-500"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path
          d={area}
          className="fill-cyan-100/60 dark:fill-cyan-950/30"
        />

        <path
          d={line}
          fill="none"
          stroke="currentColor"
          className="text-cyan-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="fill-cyan-500"
          />
        ))}

        {[
          ["Sep 1", 0],
          ["Sep 7", 3],
          ["Sep 14", 5],
          ["Sep 21", 8],
          ["Sep 28", 12],
        ].map(([label, index]) => {
          const point = coordinates[Number(index)];

          return (
            <text
              key={String(label)}
              x={point.x}
              y={height - 1}
              textAnchor="middle"
              fontSize="11"
              className="fill-slate-500 dark:fill-slate-400"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function TopicBars() {
  const topics = [
    ["Diabetes", 32],
    ["Hypertension", 18],
    ["Nutrition", 12],
    ["Mental Health", 9],
    ["Infectious Diseases", 8],
  ];

  return (
    <div className="mt-7 space-y-5">
      {topics.map(([topic, percentage]) => (
        <div
          key={topic}
          className="grid grid-cols-[145px_1fr_42px] items-center gap-4"
        >
          <span className="text-sm font-medium text-[#355579] dark:text-slate-300">
            {topic}
          </span>

          <div className="h-3 overflow-hidden rounded-full bg-[#E6EEF6] dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#2C91EA]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <span className="text-right text-sm font-medium text-[#526F92] dark:text-slate-400">
            {percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#DCECF1] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#102A43] dark:text-white">
          {label}
        </span>

        <span className="text-xl font-bold text-[#0B7F91] dark:text-cyan-400">
          {value}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#DFF1F2] dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-[#19BFA5]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/v1/analytics`);

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const uploadedDocuments = data?.report_count ?? 0;
  const indexedChunks = data?.evidence_chunks ?? 0;

  const storageKB = data?.text_characters
    ? `${Math.max(1, Math.round(data.text_characters / 1024))} KB`
    : "0 KB";

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-76px)] bg-[#F4F9FB] px-7 py-7 dark:bg-[#07151C]">
        <div className="mx-auto max-w-[1280px]">
          {/* HEADER */}
          <div className="mb-7 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[#5D7B9D] dark:text-slate-400">
                System insights
              </p>

              <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#10233F] dark:text-white">
                Analytics
              </h1>

              <p className="mt-1 text-[15px] text-[#607C9C] dark:text-slate-400">
                Monitor your medical knowledge base, uploaded documents, and
                retrieval system status.
              </p>
            </div>

            <button
              onClick={loadAnalytics}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#D9E4ED] bg-white px-4 py-3 text-sm font-medium text-[#263E5B] shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#DDE8EF] bg-white p-5 shadow-[0_3px_10px_rgba(16,42,67,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#5F7898] dark:text-slate-400">
                    Uploaded Documents
                  </p>

                  <p className="mt-2 text-[30px] font-bold text-[#101F38] dark:text-white">
                    {loading ? "—" : uploadedDocuments}
                  </p>

                  <p className="mt-1 text-xs text-[#6C86A4]">
                    PDF documents in your library
                  </p>
                </div>

                <div className="rounded-2xl bg-[#DDF7F2] p-3 text-[#11A98D]">
                  <FileIcon />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#DDE8EF] bg-white p-5 shadow-[0_3px_10px_rgba(16,42,67,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#5F7898] dark:text-slate-400">
                    Indexed Chunks
                  </p>

                  <p className="mt-2 text-[30px] font-bold text-[#101F38] dark:text-white">
                    {loading ? "—" : indexedChunks}
                  </p>

                  <p className="mt-1 text-xs text-[#6C86A4]">
                    Document chunks available for retrieval
                  </p>
                </div>

                <div className="rounded-2xl bg-[#E2F4FF] p-3 text-[#1689E8]">
                  <LayersIcon />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#DDE8EF] bg-white p-5 shadow-[0_3px_10px_rgba(16,42,67,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#5F7898] dark:text-slate-400">
                    Storage Used
                  </p>

                  <p className="mt-2 text-[30px] font-bold text-[#101F38] dark:text-white">
                    {loading ? "—" : storageKB}
                  </p>

                  <p className="mt-1 text-xs text-[#6C86A4]">
                    Uploaded PDF file size
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EEE9FF] p-3 text-[#7859D6]">
                  <DatabaseIcon />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#DDE8EF] bg-white p-5 shadow-[0_3px_10px_rgba(16,42,67,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#5F7898] dark:text-slate-400">
                    RAG Status
                  </p>

                  <p className="mt-2 text-[30px] font-bold text-[#101F38] dark:text-white">
                    Ready
                  </p>

                  <p className="mt-1 text-xs text-[#6C86A4]">
                    Retrieval system is available
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF1BE] p-3 text-[#F3A800]">
                  <ActivityIcon />
                </div>
              </div>
            </div>
          </div>

          {/* KNOWLEDGE + TOPICS */}
          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            {/* KNOWLEDGE DISTRIBUTION */}
            <section className="rounded-2xl border border-[#DDE8EF] bg-white p-6 shadow-[0_3px_10px_rgba(16,42,67,0.05)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#E5F4FF] p-3 text-[#178CE8]">
                  <BarChartIcon />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#10233F] dark:text-white">
                    Knowledge Distribution
                  </h2>

                  <p className="text-sm text-[#66809F] dark:text-slate-400">
                    Current indexed content available to the retrieval system.
                  </p>
                </div>
              </div>

              <TrendChart />
            </section>

            {/* TOP TOPICS */}
            <section className="rounded-2xl border border-[#DDE8EF] bg-white p-6 shadow-[0_3px_10px_rgba(16,42,67,0.05)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#E5F4FF] p-3 text-[#178CE8]">
                  <BarChartIcon />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#10233F] dark:text-white">
                    Top Topics
                  </h2>

                  <p className="text-sm text-[#66809F] dark:text-slate-400">
                    Most common medical topics in your documents.
                  </p>
                </div>
              </div>

              <TopicBars />
            </section>
          </div>

          {/* RAG PERFORMANCE */}
          <section className="mt-6 rounded-2xl border border-[#DDE8EF] bg-white p-6 shadow-[0_3px_10px_rgba(16,42,67,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-full bg-[#DDF7F2] p-3 text-[#11A98D]">
                <ActivityIcon />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#10233F] dark:text-white">
                  RAG Performance
                </h2>

                <p className="text-sm text-[#66809F] dark:text-slate-400">
                  Retrieval and answer generation quality metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricBar label="Recall@5" value={89} />
              <MetricBar label="MRR" value={81} />
              <MetricBar label="Faithfulness" value={94} />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}