"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

const API_URL = "http://127.0.0.1:8000";

type DocumentItem = {
  filename: string;
  size?: number;
  modified?: number;
};

type ReportInfo = {
  filename: string;
  report_date: string | null;
};

type ComparisonRow = {
  test_name: string;
  previous_value: number | null;
  latest_value: number | null;
  previous_unit: string;
  latest_unit: string;
  change: number | null;
  percentage_change: number | null;
  previous_status: string;
  latest_status: string;
  status_changed: boolean;
  unit_match: boolean;
};

type TestResult = {
  test_name: string;
  value: number | null;
  unit: string;
  reference_range: string;
  status: string;
};

type ComparisonSummary = {
  common_tests: number;
  new_tests: number;
  missing_tests: number;
  improved: number;
  worsened: number;
};

type ComparisonResult = {
  status: string;

  previous_report: ReportInfo;
  latest_report: ReportInfo;

  comparison: ComparisonRow[];
  comparison_rows: ComparisonRow[];

  new_tests: TestResult[];
  missing_tests: TestResult[];

  improved: ComparisonRow[];
  worsened: ComparisonRow[];

  summary: ComparisonSummary;
};


function DocumentIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}


function CompareIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </svg>
  );
}


function formatValue(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}


function formatChange(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  if (value > 0) {
    return `+${formatValue(value)}`;
  }

  return formatValue(value);
}


function formatPercentage(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  return `${value.toFixed(1)}%`;
}


function getStatusClass(status: string) {
  switch (status) {
    case "high":
      return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";

    case "low":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";

    case "normal":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";

    default:
      return "bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300";
  }
}


export default function ReportComparisonPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [previousReport, setPreviousReport] =
    useState("");

  const [latestReport, setLatestReport] =
    useState("");

  const [comparison, setComparison] =
    useState<ComparisonResult | null>(null);

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [comparing, setComparing] =
    useState(false);

  const [error, setError] = useState("");


  // ==========================================================
  // LOAD SAVED REPORTS
  // ==========================================================

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoadingDocuments(true);
        setError("");

        const response = await fetch(
          `${API_URL}/v1/documents`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load saved reports."
          );
        }

        const data = await response.json();

        setDocuments(
          Array.isArray(data.documents)
            ? data.documents
            : []
        );

      } catch (err) {
        console.error(err);

        setError(
          "Unable to load saved reports. Make sure the backend is running."
        );

      } finally {
        setLoadingDocuments(false);
      }
    }

    loadDocuments();
  }, []);


  // ==========================================================
  // COMPARE REPORTS
  // ==========================================================

  async function handleCompare() {
    setError("");

    if (!previousReport) {
      setError(
        "Please select the previous report."
      );
      return;
    }

    if (!latestReport) {
      setError(
        "Please select the latest report."
      );
      return;
    }

    if (previousReport === latestReport) {
      setError(
        "Please select two different reports."
      );
      return;
    }

    try {
      setComparing(true);
      setComparison(null);

      const response = await fetch(
        `${API_URL}/v1/reports/compare`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            previous_report: previousReport,
            latest_report: latestReport,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        data.status === "error"
      ) {
        throw new Error(
          data.message ||
          "Unable to compare reports."
        );
      }

      setComparison(data);

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Report comparison failed."
      );

    } finally {
      setComparing(false);
    }
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AppShell>

      <div className="min-h-screen bg-[#F3F8FA] px-6 py-8 text-[#102A43] dark:bg-[#07151C] dark:text-[#E8F4F7] lg:px-10">

        <div className="mx-auto max-w-7xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div>

            <p className="text-sm font-medium text-[#627D98] dark:text-[#8AA2AD]">
              Medical report history
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Report Comparison
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
              Compare two saved medical reports and identify
              changes in laboratory measurements over time.
            </p>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}


          {/* ==================================================
              REPORT SELECTORS
          ================================================== */}

          <div className="mt-8 grid gap-5 lg:grid-cols-2">

            {/* ==================================================
                PREVIOUS REPORT
            ================================================== */}

            <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                  <DocumentIcon />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#627D98] dark:text-[#8AA2AD]">
                    Previous report
                  </p>

                  <h2 className="mt-1 text-base font-semibold">
                    Select earlier report
                  </h2>

                </div>

              </div>


              <div className="mt-6">

                <select
                  value={previousReport}
                  onChange={(event) =>
                    setPreviousReport(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingDocuments ||
                    comparing
                  }
                  className="w-full rounded-xl border border-[#DCE8EC] bg-white px-4 py-3 text-sm text-[#102A43] outline-none transition focus:border-[#36B9D0] focus:ring-2 focus:ring-[#DDF4F7] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1C3A45] dark:bg-[#091B23] dark:text-[#E8F4F7] dark:focus:border-[#36B9D0] dark:focus:ring-[#10333E]"
                >

                  <option value="">
                    {loadingDocuments
                      ? "Loading saved reports..."
                      : "Select a saved report"}
                  </option>

                  {documents.map((document) => (
                    <option
                      key={document.filename}
                      value={document.filename}
                    >
                      {document.filename}
                    </option>
                  ))}

                </select>

              </div>


              {previousReport && (
                <div className="mt-4 rounded-xl bg-[#F7FAFB] px-4 py-3 dark:bg-[#091B23]">

                  <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                    Selected report
                  </p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {previousReport}
                  </p>

                </div>
              )}

            </div>


            {/* ==================================================
                LATEST REPORT
            ================================================== */}

            <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                  <DocumentIcon />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#627D98] dark:text-[#8AA2AD]">
                    Latest report
                  </p>

                  <h2 className="mt-1 text-base font-semibold">
                    Select newer report
                  </h2>

                </div>

              </div>


              <div className="mt-6">

                <select
                  value={latestReport}
                  onChange={(event) =>
                    setLatestReport(
                      event.target.value
                    )
                  }
                  disabled={
                    loadingDocuments ||
                    comparing
                  }
                  className="w-full rounded-xl border border-[#DCE8EC] bg-white px-4 py-3 text-sm text-[#102A43] outline-none transition focus:border-[#36B9D0] focus:ring-2 focus:ring-[#DDF4F7] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1C3A45] dark:bg-[#091B23] dark:text-[#E8F4F7] dark:focus:border-[#36B9D0] dark:focus:ring-[#10333E]"
                >

                  <option value="">
                    {loadingDocuments
                      ? "Loading saved reports..."
                      : "Select a saved report"}
                  </option>

                  {documents.map((document) => (
                    <option
                      key={document.filename}
                      value={document.filename}
                    >
                      {document.filename}
                    </option>
                  ))}

                </select>

              </div>


              {latestReport && (
                <div className="mt-4 rounded-xl bg-[#F7FAFB] px-4 py-3 dark:bg-[#091B23]">

                  <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                    Selected report
                  </p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {latestReport}
                  </p>

                </div>
              )}

            </div>

          </div>


          {/* ==================================================
              COMPARE BUTTON
          ================================================== */}

          <div className="mt-6 flex justify-center">

            <button
              type="button"
              onClick={handleCompare}
              disabled={
                comparing ||
                loadingDocuments ||
                !previousReport ||
                !latestReport
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#126782] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0E566D] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#17677D] dark:hover:bg-[#1B718A]"
            >

              <CompareIcon />

              {comparing
                ? "Comparing reports..."
                : "Compare Reports"}

            </button>

          </div>


          {/* ==================================================
              LESS THAN TWO REPORTS
          ================================================== */}

          {!loadingDocuments &&
            documents.length < 2 && (

              <div className="mt-8 rounded-2xl border border-[#DCE8EC] bg-white p-10 text-center shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                  <DocumentIcon />
                </div>

                <h2 className="mt-4 text-base font-semibold">
                  At least two saved reports are required
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                  Upload another medical report from the
                  Reports or Documents section before
                  comparing report history.
                </p>

              </div>

            )}


          {/* ==================================================
              COMPARISON RESULTS
          ================================================== */}

          {comparison && (
            <div className="mt-8 space-y-6">

              {/* ==================================================
                  SUMMARY
              ================================================== */}

              <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                    <CompareIcon />
                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-[#627D98] dark:text-[#8AA2AD]">
                      Comparison results
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Report-to-report analysis
                    </h2>

                  </div>

                </div>


                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  {/* PREVIOUS */}

                  <div className="rounded-xl bg-[#F7FAFB] p-4 dark:bg-[#091B23]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      Previous report
                    </p>

                    <p className="mt-2 truncate text-sm font-medium">
                      {comparison.previous_report?.filename ||
                        "Unknown report"}
                    </p>

                    {comparison.previous_report?.report_date && (
                      <p className="mt-1 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                        {comparison.previous_report.report_date}
                      </p>
                    )}

                  </div>


                  {/* LATEST */}

                  <div className="rounded-xl bg-[#F7FAFB] p-4 dark:bg-[#091B23]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      Latest report
                    </p>

                    <p className="mt-2 truncate text-sm font-medium">
                      {comparison.latest_report?.filename ||
                        "Unknown report"}
                    </p>

                    {comparison.latest_report?.report_date && (
                      <p className="mt-1 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                        {comparison.latest_report.report_date}
                      </p>
                    )}

                  </div>


                  {/* MATCHED */}

                  <div className="rounded-xl bg-[#F7FAFB] p-4 dark:bg-[#091B23]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      Matched tests
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {comparison.summary?.common_tests ?? 0}
                    </p>

                  </div>

                </div>


                {/* SMALL SUMMARY STATS */}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-[#E5EEF1] px-4 py-3 dark:border-[#1C3A45]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      New tests
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {comparison.summary?.new_tests ?? 0}
                    </p>

                  </div>


                  <div className="rounded-xl border border-[#E5EEF1] px-4 py-3 dark:border-[#1C3A45]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      Missing tests
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {comparison.summary?.missing_tests ?? 0}
                    </p>

                  </div>


                  <div className="rounded-xl border border-[#E5EEF1] px-4 py-3 dark:border-[#1C3A45]">

                    <p className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      Status improved
                    </p>

                    <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {comparison.summary?.improved ?? 0}
                    </p>

                  </div>

                </div>

              </div>


              {/* ==================================================
                  LABORATORY TABLE
              ================================================== */}

              <div className="overflow-hidden rounded-2xl border border-[#DCE8EC] bg-white shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

                <div className="border-b border-[#DCE8EC] px-6 py-5 dark:border-[#1C3A45]">

                  <h2 className="text-base font-semibold">
                    Laboratory comparison
                  </h2>

                  <p className="mt-1 text-sm text-[#627D98] dark:text-[#8AA2AD]">
                    Laboratory values found in both
                    selected reports.
                  </p>

                </div>


                {comparison.comparison.length === 0 ? (

                  <div className="px-6 py-12 text-center">

                    <p className="text-sm font-semibold">
                      No matching laboratory tests found
                    </p>

                    <p className="mt-2 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                      The selected reports do not contain
                      common structured laboratory values.
                    </p>

                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px] text-left">

                      <thead>

                        <tr className="border-b border-[#DCE8EC] text-xs uppercase tracking-wide text-[#627D98] dark:border-[#1C3A45] dark:text-[#8AA2AD]">

                          <th className="px-6 py-4 font-semibold">
                            Test
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Previous
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Latest
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Change
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Change %
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Status
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Reference
                          </th>

                        </tr>

                      </thead>


                      <tbody className="divide-y divide-[#DCE8EC] dark:divide-[#1C3A45]">

                        {comparison.comparison.map(
                          (row) => (

                            <tr
                              key={row.test_name}
                              className="transition hover:bg-[#F7FAFB] dark:hover:bg-[#091B23]"
                            >

                              {/* TEST */}

                              <td className="px-6 py-4">

                                <p className="text-sm font-semibold">
                                  {row.test_name}
                                </p>

                                {row.previous_unit && (
                                  <p className="mt-1 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                                    {row.previous_unit}
                                  </p>
                                )}

                              </td>


                              {/* PREVIOUS */}

                              <td className="px-6 py-4">

                                <p className="text-sm">
                                  {formatValue(
                                    row.previous_value
                                  )}
                                </p>

                                {row.previous_status && (
                                  <span
                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusClass(
                                      row.previous_status
                                    )}`}
                                  >
                                    {row.previous_status}
                                  </span>
                                )}

                              </td>


                              {/* LATEST */}

                              <td className="px-6 py-4">

                                <p className="text-sm font-semibold">
                                  {formatValue(
                                    row.latest_value
                                  )}
                                </p>

                                {row.latest_status && (
                                  <span
                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusClass(
                                      row.latest_status
                                    )}`}
                                  >
                                    {row.latest_status}
                                  </span>
                                )}

                              </td>


                              {/* CHANGE */}

                              <td className="px-6 py-4 text-sm font-semibold">

                                {formatChange(
                                  row.change
                                )}

                              </td>


                              {/* PERCENTAGE */}

                              <td className="px-6 py-4 text-sm font-semibold">

                                {formatPercentage(
                                  row.percentage_change
                                )}

                              </td>


                              {/* STATUS */}

                              <td className="px-6 py-4">

                                {row.status_changed ? (

                                  <span className="inline-flex rounded-full bg-[#E8F7FA] px-2.5 py-1 text-[11px] font-medium text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                                    Changed
                                  </span>

                                ) : (

                                  <span className="text-xs text-[#627D98] dark:text-[#8AA2AD]">
                                    Stable
                                  </span>

                                )}

                              </td>


                              {/* REFERENCE */}

                              <td className="px-6 py-4 text-sm text-[#627D98] dark:text-[#8AA2AD]">

                                —
                                
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>


              {/* ==================================================
                  NEW TESTS
              ================================================== */}

              {comparison.new_tests.length > 0 && (

                <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

                  <h2 className="text-base font-semibold">
                    New tests
                  </h2>

                  <p className="mt-1 text-sm text-[#627D98] dark:text-[#8AA2AD]">
                    Tests found in the latest report but not
                    in the previous report.
                  </p>


                  <div className="mt-4 flex flex-wrap gap-2">

                    {comparison.new_tests.map(
                      (test) => (

                        <span
                          key={test.test_name}
                          className="rounded-full bg-[#E8F7FA] px-3 py-1.5 text-xs font-medium text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]"
                        >
                          {test.test_name}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}


              {/* ==================================================
                  MISSING TESTS
              ================================================== */}

              {comparison.missing_tests.length > 0 && (

                <div className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029]">

                  <h2 className="text-base font-semibold">
                    Tests not present in latest report
                  </h2>

                  <p className="mt-1 text-sm text-[#627D98] dark:text-[#8AA2AD]">
                    Tests found in the previous report that
                    were not found in the latest report.
                  </p>


                  <div className="mt-4 flex flex-wrap gap-2">

                    {comparison.missing_tests.map(
                      (test) => (

                        <span
                          key={test.test_name}
                          className="rounded-full bg-[#F3F6F7] px-3 py-1.5 text-xs font-medium text-[#627D98] dark:bg-[#132A33] dark:text-[#A6BAC2]"
                        >
                          {test.test_name}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}


              {/* ==================================================
                  IMPROVED / WORSENED
              ================================================== */}

              {(comparison.improved.length > 0 ||
                comparison.worsened.length > 0) && (

                <div className="grid gap-5 lg:grid-cols-2">

                  {/* IMPROVED */}

                  {comparison.improved.length > 0 && (

                    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-[#0D2029]">

                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Improved
                      </p>

                      <h2 className="mt-1 text-base font-semibold">
                        Results moved into the normal range
                      </h2>

                      <div className="mt-4 space-y-2">

                        {comparison.improved.map(
                          (row) => (

                            <div
                              key={`improved-${row.test_name}`}
                              className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/20"
                            >

                              <span className="text-sm font-medium">
                                {row.test_name}
                              </span>

                              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                                {row.previous_status} →{" "}
                                {row.latest_status}
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* WORSENED */}

                  {comparison.worsened.length > 0 && (

                    <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/40 dark:bg-[#0D2029]">

                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        Needs attention
                      </p>

                      <h2 className="mt-1 text-base font-semibold">
                        Results moved outside the normal range
                      </h2>

                      <div className="mt-4 space-y-2">

                        {comparison.worsened.map(
                          (row) => (

                            <div
                              key={`worsened-${row.test_name}`}
                              className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-950/20"
                            >

                              <span className="text-sm font-medium">
                                {row.test_name}
                              </span>

                              <span className="text-xs text-amber-700 dark:text-amber-300">
                                {row.previous_status} →{" "}
                                {row.latest_status}
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                </div>

              )}


              {/* ==================================================
                  SAFETY NOTE
              ================================================== */}

              <div className="rounded-2xl border border-[#DCE8EC] bg-[#F7FAFB] p-5 dark:border-[#1C3A45] dark:bg-[#091B23]">

                <p className="text-xs leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                  Report comparison is an educational
                  information-retrieval feature. Changes in
                  laboratory values do not by themselves
                  establish a diagnosis or indicate a required
                  treatment. Interpret results with a qualified
                  healthcare professional.
                </p>

              </div>

            </div>
          )}

        </div>

      </div>

    </AppShell>
  );
}