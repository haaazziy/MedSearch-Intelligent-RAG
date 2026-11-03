"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "../components/ThemeProvider";

const LOGO_LIGHT = "/images/medsearch-ai-logo-horizontal.png";
const LOGO_DARK = "/images/medsearch-ai-logo-horizontal-dark.png";

const APP_ICON_LIGHT = "/images/medsearch-ai-app-icon.png";
const APP_ICON_DARK = "/images/medsearch-ai-app-icon-dark.png";

const features = [
  {
    number: "01",
    title: "Understand reports",
    text: "Turn complex medical documents into structured, readable information.",
  },
  {
    number: "02",
    title: "Search evidence",
    text: "Retrieve relevant passages from indexed medical knowledge and documents.",
  },
  {
    number: "03",
    title: "Verify answers",
    text: "Inspect the sources and evidence supporting every response.",
  },
];

const pipeline = [
  "Document",
  "Chunk",
  "Retrieve",
  "Rerank",
  "Evidence",
  "Answer",
];

export default function Home() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [iconFailed, setIconFailed] = useState(false);

  const logoSrc = isDark ? LOGO_DARK : LOGO_LIGHT;
  const iconSrc = isDark ? APP_ICON_DARK : APP_ICON_LIGHT;

  const page = isDark
    ? "min-h-screen overflow-x-hidden bg-[#07151c] text-[#e7f2f5]"
    : "min-h-screen overflow-x-hidden bg-[#f4f9fb] text-[#17334d]";

  const muted = isDark ? "text-[#91aab5]" : "text-[#638199]";
  const heading = isDark ? "text-[#e7f2f5]" : "text-[#17334d]";

  const card = isDark
    ? "border-[#1c3a45] bg-[#0c2029]"
    : "border-[#dcebef] bg-white";

  const sectionLight = isDark
    ? "border-[#1c3a45] bg-[#0a1b23]"
    : "border-[#dcebef] bg-white";

  const sectionAlternate = isDark
    ? "border-[#1c3a45] bg-[#071820]"
    : "border-[#dcebef] bg-[#f4f9fb]";

  const softCard = isDark
    ? "border-[#1c3a45] bg-[#0d222c]"
    : "border-[#dcebef] bg-[#fbfdfe]";

  /*
   * NAVIGATION LOGO
   *
   * The fixed-height container keeps the logo vertically aligned.
   * object-contain preserves the original image proportions.
   * object-left aligns the image to the left side.
   *
   * Note: If the PNG itself contains whitespace, that whitespace
   * must be cropped from the image file.
   */

  const logo = (
    <div className="flex h-[48px] w-[190px] shrink-0 items-center justify-start overflow-hidden sm:w-[210px] lg:w-[230px]">
      <Image
        key={logoSrc}
        src={logoSrc}
        alt="MedSearch AI"
        width={430}
        height={100}
        priority
        unoptimized
        className="block h-full w-full object-contain object-left"
      />
    </div>
  );

  /*
   * APP ICON
   */

  const appIcon = (
    <Image
      key={`${iconSrc}-${iconFailed}`}
      src={iconFailed ? APP_ICON_LIGHT : iconSrc}
      alt="MedSearch AI"
      width={40}
      height={40}
      onError={() => {
        if (!iconFailed && iconSrc !== APP_ICON_LIGHT) {
          setIconFailed(true);
        }
      }}
      className="block h-8 w-8 shrink-0 object-contain"
    />
  );

  return (
    <main className={page}>
      {/* NAVIGATION */}

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl ${
          isDark
            ? "border-[#1c3a45] bg-[#07151c]/95"
            : "border-[#dcebf0] bg-white/95"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            aria-label="MedSearch AI home"
            className="flex shrink-0 items-center"
          >
            {logo}
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["Features", "#features"],
              ["How It Works", "#how-it-works"],
              ["For Patients", "#patients"],
              ["For Professionals", "#professionals"],
              ["About", "#about"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`text-[13px] font-medium transition ${
                  isDark
                    ? "text-[#91aab5] hover:text-[#36b9d0]"
                    : "text-[#5f7c91] hover:text-[#126c88]"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              aria-pressed={isDark}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-[#28505d] bg-[#0d222c] text-[#36b9d0] hover:bg-[#12313c]"
                  : "border-[#d5e6ec] bg-white text-[#17627b] hover:bg-[#f7fbfc]"
              }`}
            >
              {isDark ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
                </svg>
              )}
            </button>

            <Link
              href="/workspace"
              className="rounded-xl bg-[#126f91] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(18,111,145,0.18)] transition hover:bg-[#0e5e7b] sm:px-6"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}

      <section
        className={`relative overflow-hidden border-b pt-[76px] ${
          isDark ? "border-[#1c3a45]" : "border-[#dcebef]"
        }`}
      >
        <div
          className={`pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full blur-3xl ${
            isDark ? "bg-[#0e5364]/20" : "bg-[#d9f3f7]"
          }`}
        />

        <div
          className={`pointer-events-none absolute -right-40 top-20 h-[550px] w-[550px] rounded-full blur-3xl ${
            isDark ? "bg-[#123d4b]/30" : "bg-[#d9f2fa]"
          }`}
        />

        <div
          className={`pointer-events-none absolute right-[25%] top-[18%] h-[170px] w-[170px] rounded-full ${
            isDark ? "bg-[#10303b]/40" : "bg-[#e7f7fa]"
          }`}
        />

        {/* DOCTOR IMAGE */}

        <div
          className="
            pointer-events-none absolute left-[-330px] top-[80px]
            z-[1] h-[720px] w-[760px] overflow-hidden
            lg:left-[-300px] lg:top-[70px] lg:h-[760px] lg:w-[800px]
            xl:left-[-250px] xl:top-[55px] xl:h-[800px] xl:w-[850px]
          "
        >
          <img
            src="/doctor-hero.png"
            alt=""
            className="h-full w-full object-cover object-[72%_center]"
          />

          <div
            className={`absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r ${
              isDark
                ? "from-[#07151c] via-[#07151c]/80 to-transparent"
                : "from-[#f4f9fb] via-[#f4f9fb]/75 to-transparent"
            }`}
          />

          <div
            className={`absolute inset-y-0 right-0 w-[30%] bg-gradient-to-l ${
              isDark
                ? "from-[#07151c] via-[#07151c]/40 to-transparent"
                : "from-[#f4f9fb] via-[#f4f9fb]/30 to-transparent"
            }`}
          />

          <div
            className={`absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t ${
              isDark
                ? "from-[#07151c] via-[#07151c]/75 to-transparent"
                : "from-[#f4f9fb] via-[#f4f9fb]/70 to-transparent"
            }`}
          />

          <div
            className={`absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b ${
              isDark
                ? "from-[#07151c]/60 to-transparent"
                : "from-[#f4f9fb]/60 to-transparent"
            }`}
          />
        </div>

        <div
          className={`pointer-events-none absolute left-[-180px] top-[150px] z-0 h-[500px] w-[500px] rounded-full blur-[120px] ${
            isDark ? "bg-[#36b9d0]/10" : "bg-[#66d8e7]/20"
          }`}
        />

        <div className="relative mx-auto grid min-h-[720px] max-w-[1500px] items-center gap-12 px-5 py-16 sm:px-8 lg:px-12 lg:py-20 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-20 max-w-[680px]">
            <div
              className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${
                isDark
                  ? "border-[#285565] bg-[#0c2029]"
                  : "border-[#a8dbea] bg-white"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  isDark ? "bg-[#123b49]" : "bg-[#e2f6f8]"
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3L14.5 8.5L20.5 9L16 13L17.5 19L12 16L6.5 19L8 13L3.5 9L9.5 8.5L12 3Z"
                    stroke="#36b9d0"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span
                className={`text-[11px] font-semibold ${
                  isDark ? "text-[#8edce8]" : "text-[#26708a]"
                }`}
              >
                AI for a Healthier Tomorrow
              </span>
            </div>

            <h1
              className={`max-w-[700px] text-[48px] font-bold leading-[1.04] tracking-[-0.045em] sm:text-[62px] md:text-[70px] lg:text-[76px] ${heading}`}
            >
              Understand Your Health
              <br />
              with <span className="text-[#36b9d0]">Confidence</span>
            </h1>

            <p
              className={`mt-7 max-w-[620px] text-[15px] leading-7 sm:text-[17px] sm:leading-8 ${muted}`}
            >
              MedSearch AI helps you find trusted medical information,
              understand your reports, and get evidence-based answers in
              simple language.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/workspace"
                className="group flex items-center justify-center gap-3 rounded-xl bg-[#14759a] px-7 py-4 text-[13px] font-semibold text-white shadow-[0_12px_25px_rgba(20,117,154,0.18)] transition hover:bg-[#106782]"
              >
                Ask a Question
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/workspace"
                className={`flex items-center justify-center gap-3 rounded-xl border px-7 py-4 text-[13px] font-semibold transition ${
                  isDark
                    ? "border-[#285565] bg-[#0c2029] text-[#7fd8e6] hover:bg-[#10313c]"
                    : "border-[#afd6e2] bg-white text-[#17627c] hover:bg-[#f8fcfd]"
                }`}
              >
                Upload a Report

                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 16V4M7 9l5-5 5 5M5 20H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            <div className="mt-12 grid max-w-[650px] grid-cols-2 gap-5 sm:grid-cols-4">
              <TrustItem icon="shield" title="Evidence-Based" isDark={isDark} />
              <TrustItem icon="lock" title="Private & Secure" isDark={isDark} />
              <TrustItem icon="user" title="Patient-Friendly" isDark={isDark} />
              <TrustItem icon="ai" title="Powered by AI" isDark={isDark} />
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}

          <div className="relative z-10 min-w-0">
            <div
              className={`absolute -right-2 top-0 z-[1] hidden h-36 w-36 rounded-full border sm:block ${
                isDark ? "border-[#285565]" : "border-[#a8dfe9]"
              }`}
            />

            <div
              className={`absolute right-14 top-12 z-[1] hidden h-24 w-24 rounded-full border sm:block ${
                isDark ? "border-[#1c3a45]" : "border-[#c8ebf0]"
              }`}
            />

            <div
              className={`relative z-10 mt-8 overflow-hidden rounded-[28px] border shadow-[0_35px_90px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:mt-12 ${
                isDark
                  ? "border-[#1c3a45] bg-[#0b2029]/95"
                  : "border-[#d7e9ee] bg-white/95"
              }`}
            >
              <div
                className={`flex h-[58px] items-center justify-between gap-2 border-b px-4 sm:px-5 ${
                  isDark ? "border-[#1c3a45]" : "border-[#e5eef1]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {appIcon}

                  <span
                    className={`truncate text-[9px] font-semibold uppercase tracking-[0.16em] ${
                      isDark ? "text-[#91aab5]" : "text-[#7190a1]"
                    }`}
                  >
                    MedSearch AI
                  </span>

                  <span
                    className={`hidden text-[8px] sm:inline ${
                      isDark ? "text-[#607f8b]" : "text-[#9bb0bb]"
                    }`}
                  >
                    Intelligent Medical Workspace
                  </span>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1.5 text-[7px] font-semibold sm:px-3 sm:text-[8px] ${
                    isDark
                      ? "bg-[#123b35] text-[#5ee0b7]"
                      : "bg-[#eaf8f7] text-[#1c9c7a]"
                  }`}
                >
                  AI Workspace Ready
                </span>
              </div>

              <div className="grid min-h-[480px] grid-cols-[90px_minmax(0,1fr)] sm:grid-cols-[105px_minmax(0,1fr)]">
                <aside
                  className={`border-r p-2 sm:p-3 ${
                    isDark
                      ? "border-[#1c3a45] bg-[#091b23]"
                      : "border-[#e8f0f3] bg-[#f9fcfd]"
                  }`}
                >
                  <div
                    className={`mb-5 px-2 text-[7px] font-bold uppercase tracking-[0.18em] ${
                      isDark ? "text-[#607f8b]" : "text-[#91a9b6]"
                    }`}
                  >
                    Workspace
                  </div>

                  <MiniNav label="Dashboard" icon="grid" active isDark={isDark} />
                  <MiniNav label="Ask AI" icon="spark" isDark={isDark} />
                  <MiniNav label="Reports" icon="file" isDark={isDark} />
                  <MiniNav label="Search" icon="search" isDark={isDark} />
                  <MiniNav label="Documents" icon="doc" isDark={isDark} />
                  <MiniNav label="Analytics" icon="chart" isDark={isDark} />
                </aside>

                <div
                  className={`min-w-0 p-3 sm:p-6 ${
                    isDark ? "bg-[#071820]" : "bg-[#fbfdfe]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[7px] font-bold uppercase tracking-[0.18em] text-[#36b9d0]">
                        AI WORKSPACE
                      </div>

                      <div
                        className={`mt-1.5 text-[15px] font-bold tracking-[-0.03em] sm:text-[17px] ${heading}`}
                      >
                        Welcome to MedSearch AI
                      </div>
                    </div>

                    <div
                      className={`hidden rounded-full border px-3 py-1.5 text-[7px] sm:block ${
                        isDark
                          ? "border-[#1c3a45] bg-[#0c2029] text-[#91aab5]"
                          : "border-[#dcebef] bg-white text-[#7b96a5]"
                      }`}
                    >
                      Online
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border p-3 shadow-sm sm:p-4 ${
                      isDark
                        ? "border-[#1c3a45] bg-[#0c2029]"
                        : "border-[#dcecf1] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div
                          className={`text-[7px] font-semibold uppercase tracking-[0.16em] ${
                            isDark ? "text-[#7297a5]" : "text-[#7b9aaa]"
                          }`}
                        >
                          Medical knowledge
                        </div>

                        <div className={`mt-2 text-[10px] leading-4 ${muted}`}>
                          Search medical documents and ask evidence-based
                          questions.
                        </div>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#103744] sm:h-12 sm:w-12">
                        <svg
                          width="21"
                          height="21"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M11 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V13"
                            stroke="#36b9d0"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M14 4H20V10M20 4L12 12"
                            stroke="#36b9d0"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <div
                        className={`h-2 flex-1 rounded-full ${
                          isDark ? "bg-[#18333d]" : "bg-[#edf4f6]"
                        }`}
                      />
                      <div
                        className={`h-2 w-[28%] rounded-full ${
                          isDark ? "bg-[#214450]" : "bg-[#d9edf1]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniStat title="Documents" value="20" isDark={isDark} />
                    <MiniStat title="Questions" value="—" isDark={isDark} />
                    <MiniStat title="Reports" value="—" isDark={isDark} />
                  </div>

                  <div
                    className={`mt-3 rounded-2xl border p-3 sm:p-4 ${
                      isDark
                        ? "border-[#1c3a45] bg-[#0c2029]"
                        : "border-[#dcebef] bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#103744] text-[#36b9d0]">
                        ✦
                      </div>

                      <div>
                        <div className={`text-[8px] font-bold ${heading}`}>
                          Ask AI
                        </div>
                        <div className={`text-[6px] ${muted}`}>
                          Get evidence-based answers
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-4 rounded-xl px-3 py-3 text-[7px] leading-4 ${
                        isDark
                          ? "bg-[#071820] text-[#91aab5]"
                          : "bg-[#f4f9fa] text-[#76909f]"
                      }`}
                    >
                      What does my latest blood report indicate?
                    </div>

                    <div className="mt-3 flex justify-end">
                      <div className="rounded-lg bg-[#147b99] px-3 py-2 text-[7px] font-semibold text-white">
                        Ask AI →
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-xl border px-4 py-3 ${
                      isDark
                        ? "border-[#1c3a45] bg-[#0c2029]"
                        : "border-[#dcecef] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[7px] font-semibold uppercase tracking-[0.14em] ${muted}`}
                      >
                        RAG Pipeline
                      </span>

                      <span className="flex items-center gap-1.5 text-[7px] font-semibold text-[#20a77f]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#20a77f]" />
                        Ready
                      </span>
                    </div>

                    <div
                      className={`mt-2 h-1.5 rounded-full ${
                        isDark ? "bg-[#18333d]" : "bg-[#edf4f6]"
                      }`}
                    >
                      <div className="h-full w-[94%] rounded-full bg-[#31b9d0]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING EVIDENCE CARD */}

            <div
              className={`absolute -bottom-7 -left-5 z-20 hidden w-[245px] rounded-2xl border p-4 shadow-[0_20px_45px_rgba(0,0,0,0.12)] sm:block ${
                isDark
                  ? "border-[#1c3a45] bg-[#0c2029]"
                  : "border-[#dcecf0] bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#103744]">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3L14.7 8.3L20.5 9.1L16.3 13.2L17.3 19L12 16.3L6.7 19L7.7 13.2L3.5 9.1L9.3 8.3L12 3Z"
                      stroke="#36b9d0"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className={`text-[9px] font-bold ${heading}`}>
                    Evidence grounded
                  </div>
                  <div className={`mt-1 text-[7px] ${muted}`}>
                    Answers supported by sources
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING STATUS */}

            <div
              className={`absolute -right-4 top-[38%] z-20 hidden w-[190px] rounded-2xl border p-4 shadow-[0_20px_45px_rgba(0,0,0,0.12)] lg:block ${
                isDark
                  ? "border-[#1c3a45] bg-[#0c2029]"
                  : "border-[#dcecf0] bg-white"
              }`}
            >
              <div
                className={`text-[7px] font-bold uppercase tracking-[0.18em] ${muted}`}
              >
                System status
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[16px] font-bold ${heading}`}>
                  Online
                </span>
                <span className="h-2 w-2 rounded-full bg-[#20b582]" />
              </div>

              <div className={`mt-2 text-[7px] ${muted}`}>
                RAG pipeline ready
              </div>

              <div
                className={`mt-4 h-1.5 rounded-full ${
                  isDark ? "bg-[#18333d]" : "bg-[#edf4f6]"
                }`}
              >
                <div className="h-full w-full rounded-full bg-[#36b8d0]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section id="features" className={`border-t ${sectionLight}`}>
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="grid gap-12 xl:grid-cols-[0.85fr_1.15fr] xl:gap-20">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#36b9d0]">
                One intelligent workspace
              </div>

              <h2
                className={`mt-5 max-w-[600px] text-[40px] font-bold leading-[1.06] tracking-[-0.045em] sm:text-[50px] ${heading}`}
              >
                From medical documents
                <br />
                to understanding.
              </h2>

              <p className={`mt-6 max-w-[570px] text-[15px] leading-7 ${muted}`}>
                MedSearch AI connects medical documents, retrieval, evidence,
                and AI-powered explanations into one workspace designed to
                make complex information easier to understand.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.number}
                  number={feature.number}
                  title={feature.title}
                  text={feature.text}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section id="how-it-works" className={`border-t ${sectionAlternate}`}>
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#36b9d0]">
              How it works
            </div>

            <h2
              className={`mt-4 text-[38px] font-bold tracking-[-0.04em] sm:text-[48px] ${heading}`}
            >
              From your question to evidence.
            </h2>

            <p className={`mx-auto mt-5 max-w-[620px] text-[14px] leading-7 ${muted}`}>
              MedSearch AI uses a retrieval-augmented pipeline to connect your
              question with relevant medical information before generating an
              answer.
            </p>
          </div>

          <div
            className={`mt-14 grid overflow-hidden rounded-3xl border md:grid-cols-3 xl:grid-cols-6 ${card}`}
          >
            {pipeline.map((item, index) => (
              <PipelineStep
                key={item}
                number={`0${index + 1}`}
                title={item}
                text={
                  index === 0
                    ? "Medical reports and knowledge"
                    : index === 1
                      ? "Information is structured"
                      : index === 2
                        ? "Relevant evidence is found"
                        : index === 3
                          ? "Best passages are prioritized"
                          : index === 4
                            ? "Supporting sources are identified"
                            : "Clear grounded response"
                }
                last={index === pipeline.length - 1}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PATIENTS */}

      <section id="patients" className={`border-t ${sectionLight}`}>
        <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 xl:grid-cols-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#36b9d0]">
              For patients
            </div>

            <h2
              className={`mt-5 max-w-[600px] text-[40px] font-bold leading-[1.06] tracking-[-0.045em] sm:text-[50px] ${heading}`}
            >
              Complex medical information,
              <br />
              made simpler.
            </h2>

            <p className={`mt-6 max-w-[560px] text-[15px] leading-7 ${muted}`}>
              Upload your medical report, ask questions about your results,
              and explore supporting information through a patient-friendly
              interface.
            </p>

            <Link
              href="/workspace"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#14759a] px-6 py-3.5 text-[12px] font-semibold text-white shadow-[0_10px_25px_rgba(20,117,154,0.16)] transition hover:bg-[#106782]"
            >
              Explore MedSearch AI <span>→</span>
            </Link>
          </div>

          <div
            className={`relative rounded-3xl border p-5 shadow-[0_25px_70px_rgba(0,0,0,0.08)] sm:p-7 ${softCard}`}
          >
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-[8px] font-bold uppercase tracking-[0.18em] ${muted}`}>
                    Medical report
                  </div>

                  <div className={`mt-2 text-[14px] font-bold ${heading}`}>
                    Laboratory Results
                  </div>
                </div>

                <div className="rounded-full bg-[#103b35] px-3 py-1.5 text-[8px] font-semibold text-[#5ee0b7]">
                  Analyzed
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <ReportRow name="Hemoglobin" value="13.4 g/dL" isDark={isDark} />
                <ReportRow name="Fasting Glucose" value="96 mg/dL" isDark={isDark} />
                <ReportRow name="Creatinine" value="0.9 mg/dL" isDark={isDark} />
                <ReportRow name="ALT" value="28 U/L" isDark={isDark} />
              </div>

              <div
                className={`mt-5 rounded-xl border p-4 ${
                  isDark
                    ? "border-[#1c3a45] bg-[#0d222c]"
                    : "border-[#dceff1] bg-[#f2fafb]"
                }`}
              >
                <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#36b9d0]">
                  AI explanation
                </div>

                <p className={`mt-2 text-[10px] leading-5 ${muted}`}>
                  Your report contains measurements that fall within the
                  supplied reference ranges. MedSearch AI can help explain
                  what each result means in simple language.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROFESSIONALS */}

      <section id="professionals" className={`border-t ${sectionAlternate}`}>
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="grid gap-12 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#36b9d0]">
                For professionals
              </div>

              <h2
                className={`mt-5 text-[40px] font-bold leading-[1.06] tracking-[-0.045em] sm:text-[50px] ${heading}`}
              >
                Evidence at every step.
              </h2>

              <p className={`mt-6 max-w-[540px] text-[15px] leading-7 ${muted}`}>
                Explore retrieved passages, source documents, evidence
                strength, report analytics, and comparison results through a
                structured workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ProfessionalCard
                title="Evidence retrieval"
                text="Find relevant passages from indexed medical knowledge."
                isDark={isDark}
              />
              <ProfessionalCard
                title="Report analytics"
                text="Extract and organize laboratory measurements."
                isDark={isDark}
              />
              <ProfessionalCard
                title="Report comparison"
                text="Compare test values across different reports."
                isDark={isDark}
              />
              <ProfessionalCard
                title="Source transparency"
                text="Inspect the evidence behind generated responses."
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / SAFETY */}

      <section id="about" className={`border-t ${sectionLight}`}>
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div
            className={`rounded-3xl border p-7 sm:p-10 lg:p-12 ${
              isDark
                ? "border-[#1c3a45] bg-[#0d222c]"
                : "border-[#dcebef] bg-[#f5fafb]"
            }`}
          >
            <div className="grid gap-10 xl:grid-cols-[0.75fr_1.25fr] xl:items-center">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#36b9d0]">
                  Safety & limitations
                </div>

                <h2
                  className={`mt-4 text-[32px] font-bold tracking-[-0.035em] sm:text-[38px] ${heading}`}
                >
                  Responsible by design.
                </h2>
              </div>

              <div className={`border-l-2 border-[#36b9d0] pl-6 ${muted}`}>
                <p className="text-[14px] leading-7">
                  MedSearch AI is designed as an educational and medical
                  information retrieval assistant. It does not replace a
                  qualified healthcare professional, diagnosis, or treatment.
                  When evidence is insufficient, the system should communicate
                  that limitation rather than present unsupported certainty.
                </p>

                <p className="mt-4 text-[11px] leading-5">
                  For emergencies or serious symptoms, seek immediate
                  professional medical care or contact local emergency
                  services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section className="relative overflow-hidden bg-[#0c617b]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-[1000px] px-5 py-20 text-center sm:px-8 sm:py-24">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a8edf0]">
            MedSearch AI
          </div>

          <h2 className="mt-5 text-[38px] font-bold leading-[1.05] tracking-[-0.045em] text-white sm:text-[52px]">
            Understand your health
            <br />
            with greater confidence.
          </h2>

          <p className="mx-auto mt-5 max-w-[600px] text-[14px] leading-7 text-white/65">
            Explore your medical information through evidence-based retrieval,
            report understanding, and transparent AI assistance.
          </p>

          <Link
            href="/workspace"
            className="mt-8 inline-flex items-center gap-4 rounded-xl bg-white px-7 py-4 text-[12px] font-bold text-[#0d627d] shadow-lg transition hover:bg-[#f1fbfc]"
          >
            Get Started <span>→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}

      <footer className={`border-t ${sectionAlternate}`}>
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-3 px-5 py-7 text-[9px] sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            {appIcon}
            <span className={`font-semibold ${isDark ? "text-[#b6d3dc]" : "text-[#587589]"}`}>
              MedSearch AI
            </span>
          </div>

          <div className={muted}>
            Intelligent medical knowledge retrieval & analysis
          </div>

          <div className={muted}>© 2026 MedSearch AI</div>
        </div>
      </footer>
    </main>
  );
}

/* ===============================================================
   FEATURE CARD
=============================================================== */

function FeatureCard({
  number,
  title,
  text,
  isDark,
}: {
  number: string;
  title: string;
  text: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] ${
        isDark
          ? "border-[#1c3a45] bg-[#0c2029]"
          : "border-[#dcebef] bg-[#fbfdfe]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${isDark ? "text-[#607f8b]" : "text-[#8da5b2]"}`}>
          {number}
        </span>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#103744] text-[17px] font-semibold text-[#36b9d0]">
          →
        </span>
      </div>

      <h3 className={`mt-8 text-[15px] font-bold ${isDark ? "text-[#e7f2f5]" : "text-[#193750]"}`}>
        {title}
      </h3>

      <p className={`mt-3 text-[11px] leading-5 ${isDark ? "text-[#91aab5]" : "text-[#7892a2]"}`}>
        {text}
      </p>
    </div>
  );
}

/* ===============================================================
   TRUST ITEM
=============================================================== */

function TrustItem({
  icon,
  title,
  isDark,
}: {
  icon: "shield" | "lock" | "user" | "ai";
  title: string;
  isDark: boolean;
}) {
  const iconBox = isDark
    ? "bg-[#0d222c] ring-[#1c3a45]"
    : "bg-white ring-[#dcebef]";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${iconBox}`}>
        {icon === "shield" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L20 6V11.5C20 16.5 16.7 19.5 12 21C7.3 19.5 4 16.5 4 11.5V6L12 3Z" stroke="#36b9d0" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 12L11 14L15 10" stroke="#36b9d0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {icon === "lock" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="#36b9d0" strokeWidth="1.8" />
            <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" stroke="#36b9d0" strokeWidth="1.8" />
          </svg>
        )}

        {icon === "user" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" stroke="#36b9d0" strokeWidth="1.8" />
            <path d="M5 20C5.8 16.8 8.1 15 12 15C15.9 15 18.2 16.8 19 20" stroke="#36b9d0" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}

        {icon === "ai" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3L14 8L19 10L14 12L12 17L10 12L5 10L10 8L12 3Z" stroke="#36b9d0" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M19 16L20 18L22 19L20 20L19 22L18 20L16 19L18 18L19 16Z" stroke="#36b9d0" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <span className={`text-[9px] font-semibold leading-4 ${isDark ? "text-[#91aab5]" : "text-[#668294]"}`}>
        {title}
      </span>
    </div>
  );
}

/* ===============================================================
   MINI NAV
=============================================================== */

function MiniNav({
  label,
  icon,
  active = false,
  isDark,
}: {
  label: string;
  icon: "grid" | "spark" | "file" | "search" | "doc" | "chart";
  active?: boolean;
  isDark: boolean;
}) {
  const classes = active
    ? isDark
      ? "bg-[#103744] text-[#36b9d0]"
      : "bg-[#e2f5f8] text-[#126d88]"
    : isDark
      ? "text-[#7896a3]"
      : "text-[#8098a6]";

  return (
    <div className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-2 ${classes}`}>
      <span className="text-[9px]">
        {icon === "grid" && "▦"}
        {icon === "spark" && "✦"}
        {icon === "file" && "▤"}
        {icon === "search" && "⌕"}
        {icon === "doc" && "▧"}
        {icon === "chart" && "⌁"}
      </span>

      <span className="truncate text-[7px] font-semibold">{label}</span>
    </div>
  );
}

/* ===============================================================
   MINI STAT
=============================================================== */

function MiniStat({
  title,
  value,
  isDark,
}: {
  title: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${
      isDark
        ? "border-[#1c3a45] bg-[#0c2029]"
        : "border-[#dcebef] bg-white"
    }`}>
      <div className={`text-[6px] ${isDark ? "text-[#7896a3]" : "text-[#8ba3b0]"}`}>
        {title}
      </div>

      <div className={`mt-1.5 text-[15px] font-bold ${isDark ? "text-[#e7f2f5]" : "text-[#17364e]"}`}>
        {value}
      </div>
    </div>
  );
}

/* ===============================================================
   PIPELINE STEP
=============================================================== */

function PipelineStep({
  number,
  title,
  text,
  last = false,
  isDark,
}: {
  number: string;
  title: string;
  text: string;
  last?: boolean;
  isDark: boolean;
}) {
  return (
    <div
      className={`relative p-6 ${
        !last
          ? isDark
            ? "border-b border-[#1c3a45] xl:border-b-0 xl:border-r"
            : "border-b border-[#dcebef] xl:border-b-0 xl:border-r"
          : ""
      }`}
    >
      <div className={`text-[9px] font-bold tracking-[0.15em] ${isDark ? "text-[#607f8b]" : "text-[#9ab0bb]"}`}>
        {number}
      </div>

      <div className={`mt-8 text-[14px] font-bold ${isDark ? "text-[#e7f2f5]" : "text-[#1b3950]"}`}>
        {title}
      </div>

      <p className={`mt-2 text-[9px] leading-5 ${isDark ? "text-[#91aab5]" : "text-[#8199a7]"}`}>
        {text}
      </p>

      {!last && (
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-[#36b9d0] xl:block">
          →
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   REPORT ROW
=============================================================== */

function ReportRow({
  name,
  value,
  isDark,
}: {
  name: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-3 ${
      isDark
        ? "border-[#1c3a45] bg-[#0d222c]"
        : "border-[#e4eef1] bg-[#fcfeff]"
    }`}>
      <div>
        <div className={`text-[8px] font-semibold ${isDark ? "text-[#c2d7de]" : "text-[#426078]"}`}>
          {name}
        </div>

        <div className={`mt-1 text-[7px] ${isDark ? "text-[#7896a3]" : "text-[#91a6b2]"}`}>
          {value}
        </div>
      </div>

      <span className={`rounded-full px-2.5 py-1 text-[6px] font-semibold ${
        isDark
          ? "bg-[#123b35] text-[#5ee0b7]"
          : "bg-[#eaf8f3] text-[#239676]"
      }`}>
        Normal
      </span>
    </div>
  );
}

/* ===============================================================
   PROFESSIONAL CARD
=============================================================== */

function ProfessionalCard({
  title,
  text,
  isDark,
}: {
  title: string;
  text: string;
  isDark: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
      isDark
        ? "border-[#1c3a45] bg-[#0c2029]"
        : "border-[#dcebef] bg-white"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#103744] text-[#36b9d0]">
          ✦
        </div>

        <span className={`text-[16px] ${isDark ? "text-[#607f8b]" : "text-[#91a9b5]"}`}>
          →
        </span>
      </div>

      <h3 className={`mt-6 text-[14px] font-bold ${isDark ? "text-[#e7f2f5]" : "text-[#1b3950]"}`}>
        {title}
      </h3>

      <p className={`mt-2 text-[10px] leading-5 ${isDark ? "text-[#91aab5]" : "text-[#7d95a4]"}`}>
        {text}
      </p>
    </div>
  );
}