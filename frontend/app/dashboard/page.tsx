"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppShell from "../../components/AppShell";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Stats = {
  documents: number;
  status: string;
  rag_ready: boolean;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch(`${API_URL}/v1/stats`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load statistics");
        }

        const data: Stats = await response.json();

        if (!cancelled) {
          setStats(data);
        }
      } catch {
        if (!cancelled) {
          setStats({
            documents: 0,
            status: "offline",
            rag_ready: false,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const documents = stats?.documents ?? 0;
  const systemOnline = stats?.status === "online";
  const ragReady = stats?.rag_ready === true;

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-72px)] bg-[#F3F8FA] transition-colors duration-500 dark:bg-[#07151C]">
        <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:py-8">

          {/* WELCOME BANNER */}

          <section className="relative overflow-hidden rounded-3xl border border-[#DCE8EC] bg-white shadow-[0_12px_40px_rgba(16,42,67,0.05)] transition-all duration-500 dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#DDF4F7] blur-3xl dark:bg-[#36B9D0]/10" />

            <div className="pointer-events-none absolute right-12 top-8 hidden h-36 w-36 rounded-full border border-[#CBEAF0] lg:block dark:border-[#36B9D0]/10" />

            <div className="relative grid items-center gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_280px] lg:px-10 lg:py-9">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#CDE8ED] bg-[#F2FAFB] px-3 py-1.5 dark:border-[#1C5363] dark:bg-[#102C35]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#20A779] shadow-[0_0_7px_rgba(32,167,121,0.35)]" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#126782] dark:text-[#36B9D0]">
                    AI workspace
                  </span>
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#102A43] transition-colors duration-500 sm:text-4xl dark:text-[#E8F4F7]">
                  Welcome to MedSearch AI
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                  Search your medical documents, ask evidence-based
                  questions, and explore information through your
                  intelligent medical knowledge workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#126782] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#0F566D] dark:shadow-[0_0_18px_rgba(54,185,208,0.12)] dark:hover:bg-[#16819F]"
                  >
                    <span>✦</span>
                    Ask a Question
                  </Link>

                  <Link
                    href="/documents"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#BBDDE4] bg-white px-5 py-3 text-xs font-semibold text-[#126782] transition-all duration-300 hover:bg-[#F2FAFB] dark:border-[#27515D] dark:bg-[#102A32] dark:text-[#36B9D0] dark:hover:bg-[#15343E]"
                  >
                    <span>↑</span>
                    Upload a Document
                  </Link>
                </div>
              </div>

              {/* WORKSPACE STATUS */}

              <div className="hidden lg:block">
                <div className="rounded-2xl border border-[#DCE8EC] bg-white/90 p-5 shadow-sm backdrop-blur transition-all duration-500 dark:border-[#1C3A45] dark:bg-[#102A32]/90 dark:shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA2AD] dark:text-[#6F919D]">
                      System status
                    </span>

                    <span
                      className={`h-2 w-2 rounded-full ${
                        systemOnline ? "bg-[#20A779]" : "bg-[#E45858]"
                      }`}
                    />
                  </div>

                  <p className="mt-5 text-xl font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    {loading
                      ? "Checking..."
                      : systemOnline
                        ? "Online"
                        : "Offline"}
                  </p>

                  <p className="mt-1 text-xs text-[#8AA2AD] dark:text-[#6F919D]">
                    {ragReady
                      ? "RAG pipeline ready"
                      : "RAG pipeline unavailable"}
                  </p>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E8F1F3] dark:bg-[#18343E]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        ragReady
                          ? "w-full bg-[#36B9D0]"
                          : "w-1/3 bg-[#E45858]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STATISTICS */}

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Documents"
              value={loading ? "—" : String(documents)}
              description="Indexed in knowledge base"
              icon="□"
              iconClass="bg-[#EAF5FF] text-[#2D83C4] dark:bg-[#12313C] dark:text-[#36B9D0]"
            />

            <StatCard
              label="Questions"
              value="—"
              description="Ask AI to start"
              icon="✦"
              iconClass="bg-[#F0ECFF] text-[#7356C8] dark:bg-[#29243D] dark:text-[#B8A8FF]"
            />

            <StatCard
              label="Reports"
              value="—"
              description="Available for review"
              icon="▤"
              iconClass="bg-[#EAF9F4] text-[#20A779] dark:bg-[#12352C] dark:text-[#3FD39A]"
            />

            <StatCard
              label="System"
              value={loading ? "—" : systemOnline ? "Online" : "Offline"}
              description={
                ragReady
                  ? "RAG pipeline ready"
                  : "Check backend connection"
              }
              icon="▥"
              iconClass="bg-[#EAF7F8] text-[#126782] dark:bg-[#12313C] dark:text-[#36B9D0]"
              valueClass={
                systemOnline
                  ? "text-[#20A779] dark:text-[#3FD39A]"
                  : "text-[#E45858] dark:text-[#FF7777]"
              }
            />
          </section>

          {/* MAIN DASHBOARD */}

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">

            {/* RECENT ACTIVITY */}

            <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm transition-all duration-500 dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA2AD] dark:text-[#62808B]">
                    Workspace
                  </p>

                  <h3 className="mt-1.5 text-lg font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    Recent Activity
                  </h3>
                </div>

                <span className="text-xs text-[#8AA2AD] dark:text-[#6F919D]">
                  Live workspace
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <ActivityItem
                  icon="□"
                  title="Medical knowledge base"
                  description={
                    loading
                      ? "Checking indexed documents..."
                      : `${documents} document${
                          documents === 1 ? "" : "s"
                        } currently indexed`
                  }
                  status={ragReady ? "Ready" : "Unavailable"}
                  statusType={ragReady ? "success" : "error"}
                />

                <ActivityItem
                  icon="✦"
                  title="Ask AI"
                  description="Start a conversation with your medical knowledge base"
                  status="Available"
                  statusType="success"
                />

                <ActivityItem
                  icon="▤"
                  title="Medical reports"
                  description="Upload and analyze medical documents"
                  status="Available"
                  statusType="info"
                />
              </div>
            </div>

            {/* QUICK ACTIONS */}

            <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm transition-all duration-500 dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA2AD] dark:text-[#62808B]">
                Shortcuts
              </p>

              <h3 className="mt-1.5 text-lg font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                Quick Actions
              </h3>

              <div className="mt-6 grid gap-3">
                <QuickAction
                  href="/workspace"
                  icon="✦"
                  title="Ask a Question"
                  description="Get AI-powered answers"
                />

                <QuickAction
                  href="/documents"
                  icon="↑"
                  title="Upload Document"
                  description="Add a medical report"
                />

                <QuickAction
                  href="/reports"
                  icon="▤"
                  title="View Reports"
                  description="Review your reports"
                />
              </div>
            </div>
          </section>

          {/* GETTING STARTED */}

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#CFE8ED] bg-gradient-to-br from-[#F0FAFC] to-white p-6 transition-all duration-500 dark:border-[#1C5363] dark:from-[#0E2933] dark:to-[#0D2029]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-[#126782] shadow-sm dark:bg-[#12313C] dark:text-[#36B9D0]">
                  ✦
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    Evidence-based medical AI
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                    MedSearch AI retrieves relevant evidence from your
                    indexed documents before generating an answer.
                  </p>

                  <Link
                    href="/workspace"
                    className="mt-4 inline-flex text-xs font-semibold text-[#126782] hover:text-[#0F566D] dark:text-[#36B9D0] dark:hover:text-[#63D7E8]"
                  >
                    Start asking questions →
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 transition-all duration-500 dark:border-[#1C3A45] dark:bg-[#0D2029]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF7F8] text-lg text-[#126782] dark:bg-[#12313C] dark:text-[#36B9D0]">
                  ✓
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    Your documents stay at the center
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                    Upload medical PDFs, index their contents, and use
                    them as evidence when asking questions.
                  </p>

                  <Link
                    href="/documents"
                    className="mt-4 inline-flex text-xs font-semibold text-[#126782] hover:text-[#0F566D] dark:text-[#36B9D0] dark:hover:text-[#63D7E8]"
                  >
                    Manage documents →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <div className="py-7 text-center">
            <p className="text-[10px] text-[#8AA2AD] dark:text-[#62808B]">
              MedSearch AI · Intelligent search for a healthier tomorrow
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* STAT CARD */

function StatCard({
  label,
  value,
  description,
  icon,
  iconClass,
  valueClass = "text-[#102A43] dark:text-[#E8F4F7]",
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCE8EC] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)] dark:hover:border-[#27515D] dark:hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#8AA2AD] dark:text-[#6F919D]">
            {label}
          </p>

          <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueClass}`}>
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[#8AA2AD] dark:text-[#6F919D]">
            {description}
          </p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-base ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ACTIVITY ITEM */

function ActivityItem({
  icon,
  title,
  description,
  status,
  statusType,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
  statusType: "success" | "info" | "error";
}) {
  const statusClasses = {
    success:
      "bg-[#E8F8F1] text-[#16875F] dark:bg-[#12352C] dark:text-[#3FD39A]",
    info:
      "bg-[#EAF5FF] text-[#2D83C4] dark:bg-[#142F3D] dark:text-[#62C7F2]",
    error:
      "bg-[#FFF0F0] text-[#C94747] dark:bg-[#3B2024] dark:text-[#FF7777]",
  };

  const dotClasses = {
    success: "bg-[#20A779]",
    info: "bg-[#2D83C4]",
    error: "bg-[#E45858]",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E6EEF1] bg-[#FBFDFD] p-4 transition-all duration-300 dark:border-[#1B3741] dark:bg-[#0A1B23] dark:hover:border-[#27515D]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7F8] text-sm text-[#126782] dark:bg-[#12313C] dark:text-[#36B9D0]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-[#8AA2AD] dark:text-[#6F919D]">
          {description}
        </p>
      </div>

      <span
        className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${statusClasses[statusType]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[statusType]}`} />
        {status}
      </span>
    </div>
  );
}

/* QUICK ACTION */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-[#E2ECEF] p-4 transition-all duration-300 hover:border-[#BBDDE4] hover:bg-[#F8FCFD] dark:border-[#1B3741] dark:bg-[#0A1B23] dark:hover:border-[#36B9D0]/30 dark:hover:bg-[#102A32]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7F8] text-sm text-[#126782] transition-all duration-300 group-hover:bg-[#DDF3F6] dark:bg-[#12313C] dark:text-[#36B9D0] dark:group-hover:bg-[#173D49]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
          {title}
        </p>

        <p className="mt-1 text-xs text-[#8AA2AD] dark:text-[#6F919D]">
          {description}
        </p>
      </div>

      <span className="text-sm text-[#B0C4CC] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#126782] dark:text-[#46636D] dark:group-hover:text-[#36B9D0]">
        →
      </span>
    </Link>
  );
}