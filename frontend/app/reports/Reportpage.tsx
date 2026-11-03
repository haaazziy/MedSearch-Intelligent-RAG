"use client";

import AppShell from "../../components/AppShell";
import { ChangeEvent, useState } from "react";

interface UploadResult {
  status: string;
  message?: string;
  filename?: string;
  characters_extracted?: number;
  chunks_created?: number;
}

interface ReportResult {
  status: string;
  document_name?: string;
  summary?: string;
  sources?: string[];
  message?: string;
}

const API_BASE = "http://127.0.0.1:8000";

export default function ReportsPage() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const [uploadResult, setUploadResult] =
    useState<UploadResult | null>(null);

  const [reportResult, setReportResult] =
    useState<ReportResult | null>(null);

  const [error, setError] = useState("");

  const [showSources, setShowSources] = useState(false);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setUploadResult(null);
    setReportResult(null);
    setShowSources(false);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setSelectedFile(null);
      setError("Only PDF files are supported.");
      return;
    }

    setSelectedFile(file);
  }

  async function uploadReport() {
    if (!selectedFile) {
      setError("Please select a PDF report first.");
      return;
    }

    setUploading(true);
    setError("");
    setUploadResult(null);
    setReportResult(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE}/v1/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: UploadResult = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.message || "Report upload failed."
        );
      }

      setUploadResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the report."
      );
    } finally {
      setUploading(false);
    }
  }

  async function explainReport() {
    if (!selectedFile) {
      setError("Please upload a report first.");
      return;
    }

    setExplaining(true);
    setError("");
    setReportResult(null);
    setShowSources(false);

    try {
      const params = new URLSearchParams();

      params.set(
        "document_name",
        selectedFile.name
      );

      const response = await fetch(
        `${API_BASE}/v1/reports/explain?${params.toString()}`,
        {
          method: "POST",
        }
      );

      const data: ReportResult = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.message ||
            "Unable to generate the report explanation."
        );
      }

      setReportResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to explain the report."
      );
    } finally {
      setExplaining(false);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-76px)] bg-[#F3F8FA] px-6 py-8 text-[#102A43] transition-colors duration-500 dark:bg-[#07151C] dark:text-[#E8F4F7] md:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#36B9D0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#36B9D0]" />
              Medical Reports
            </div>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Understand your medical reports
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                  Upload a medical PDF and MedSearch AI will
                  retrieve the relevant evidence and explain
                  the report in patient-friendly language.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#DCE8EC] bg-white px-3 py-2 text-xs font-medium text-[#627D98] shadow-sm dark:border-[#1C3A45] dark:bg-[#0D2029] dark:text-[#8AA2AD]">
                <span className="h-2 w-2 rounded-full bg-[#20A779]" />
                RAG system online
              </div>
            </div>
          </div>

          {/* MAIN GRID */}

          <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">

            {/* UPLOAD PANEL */}

            <section className="rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-[0_8px_30px_rgba(16,42,67,0.04)] dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-none">

              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Upload report
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                  PDF files are processed locally through
                  the MedSearch AI retrieval pipeline.
                </p>
              </div>

              {/* DROP ZONE */}

              <label
                htmlFor="report-upload"
                className="
                  group
                  flex
                  min-h-[220px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-[#BFD4DB]
                  bg-[#F7FAFB]
                  px-6
                  text-center
                  transition
                  hover:border-[#36B9D0]
                  hover:bg-[#F1FAFC]
                  dark:border-[#28505D]
                  dark:bg-[#0A1B23]
                  dark:hover:border-[#36B9D0]
                  dark:hover:bg-[#0D252F]
                "
              >
                <input
                  id="report-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  className="
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#E8F7FA]
                    text-[#126782]
                    transition
                    group-hover:scale-105
                    dark:bg-[#10333E]
                    dark:text-[#36B9D0]
                  "
                >
                  <svg
                    width="27"
                    height="27"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <path d="M12 18V11" />
                    <path d="m9 14 3-3 3 3" />
                  </svg>
                </div>

                <div className="text-sm font-semibold">
                  Choose a medical PDF
                </div>

                <div className="mt-1 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                  Click to browse your files
                </div>

                <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#8AA0B1] dark:text-[#607984]">
                  PDF only
                </div>
              </label>

              {/* SELECTED FILE */}

              {selectedFile && (
                <div className="mt-4 rounded-xl border border-[#DCE8EC] bg-[#F7FAFB] p-4 dark:border-[#1C3A45] dark:bg-[#0A1B23]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {selectedFile.name}
                      </div>

                      <div className="mt-0.5 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadResult(null);
                        setReportResult(null);
                        setError("");
                      }}
                      className="text-xs font-medium text-[#627D98] hover:text-[#D14B4B] dark:text-[#8AA2AD]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* UPLOAD BUTTON */}

              <button
                type="button"
                onClick={uploadReport}
                disabled={
                  !selectedFile || uploading
                }
                className="
                  mt-5
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#126782]
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_8px_20px_rgba(18,103,130,0.18)]
                  transition
                  hover:bg-[#0F5970]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-[#17677D]
                  dark:hover:bg-[#1B7891]
                "
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Uploading report...
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 16V4" />
                      <path d="m7 9 5-5 5 5" />
                      <path d="M5 20h14" />
                    </svg>
                    Upload & index report
                  </>
                )}
              </button>

              {/* UPLOAD SUCCESS */}

              {uploadResult && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#16845F] dark:text-[#4ED3A6]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#20A779] text-white">
                      ✓
                    </span>
                    Report indexed successfully
                  </div>

                  <div className="mt-2 space-y-1 text-[11px] text-[#627D98] dark:text-[#8AA2AD]">
                    <div>
                      Characters extracted:{" "}
                      {uploadResult.characters_extracted}
                    </div>

                    <div>
                      Chunks created:{" "}
                      {uploadResult.chunks_created}
                    </div>
                  </div>
                </div>
              )}

              {/* EXPLAIN BUTTON */}

              <button
                type="button"
                onClick={explainReport}
                disabled={
                  !selectedFile ||
                  explaining ||
                  !uploadResult
                }
                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-[#DCE8EC]
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-[#126782]
                  transition
                  hover:border-[#36B9D0]
                  hover:bg-[#F7FAFB]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-[#1C3A45]
                  dark:bg-[#0D2029]
                  dark:text-[#36B9D0]
                  dark:hover:bg-[#10333E]
                "
              >
                {explaining ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#36B9D0]/30 border-t-[#36B9D0]" />
                    Analyzing report...
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3v18" />
                      <path d="M3 12h18" />
                      <path d="m5.6 5.6 12.8 12.8" />
                      <path d="m18.4 5.6-12.8 12.8" />
                    </svg>
                    Explain this report
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-[10px] leading-4 text-[#8AA0B1] dark:text-[#607984]">
                MedSearch AI provides information from
                retrieved report evidence and is not a
                substitute for professional medical advice.
              </p>
            </section>

            {/* RESULTS PANEL */}

            <section className="min-w-0 rounded-2xl border border-[#DCE8EC] bg-white p-6 shadow-[0_8px_30px_rgba(16,42,67,0.04)] dark:border-[#1C3A45] dark:bg-[#0D2029] dark:shadow-none">

              {!reportResult ? (
                <div className="flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                    <svg
                      width="31"
                      height="31"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3h9l4 4v14H6z" />
                      <path d="M15 3v5h4" />
                      <path d="M9 13h6" />
                      <path d="M9 17h4" />
                    </svg>
                  </div>

                  <h2 className="text-lg font-semibold">
                    Your report explanation will appear here
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                    Upload and index a medical report,
                    then select “Explain this report” to
                    generate a grounded explanation.
                  </p>

                  <div className="mt-7 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-3">
                    {[
                      [
                        "01",
                        "Retrieve",
                        "Find relevant report evidence.",
                      ],
                      [
                        "02",
                        "Explain",
                        "Convert technical content into simpler language.",
                      ],
                      [
                        "03",
                        "Cite",
                        "Keep the supporting evidence visible.",
                      ],
                    ].map(([number, title, text]) => (
                      <div
                        key={number}
                        className="rounded-xl border border-[#DCE8EC] bg-[#F7FAFB] p-4 dark:border-[#1C3A45] dark:bg-[#0A1B23]"
                      >
                        <div className="text-[10px] font-semibold tracking-[0.12em] text-[#36B9D0]">
                          {number}
                        </div>

                        <div className="mt-2 text-xs font-semibold">
                          {title}
                        </div>

                        <div className="mt-1 text-[10px] leading-4 text-[#627D98] dark:text-[#8AA2AD]">
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* RESULT HEADER */}

                  <div className="border-b border-[#DCE8EC] pb-5 dark:border-[#1C3A45]">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#20A779]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#20A779]" />
                          Analysis complete
                        </div>

                        <h2 className="truncate text-xl font-semibold">
                          {reportResult.document_name}
                        </h2>

                        <p className="mt-1 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                          Grounded in retrieved report evidence
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#DCE8EC] bg-[#F7FAFB] px-3 py-1.5 text-[10px] font-medium text-[#627D98] dark:border-[#1C3A45] dark:bg-[#0A1B23] dark:text-[#8AA2AD]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#20A779]" />
                        Evidence grounded
                      </div>
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div className="pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3v18" />
                          <path d="M3 12h18" />
                        </svg>
                      </div>

                      <h3 className="text-sm font-semibold">
                        Report explanation
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-[#DCE8EC] bg-[#F7FAFB] p-5 dark:border-[#1C3A45] dark:bg-[#0A1B23]">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-[#334E68] dark:text-[#C7D8DE]">
                        {reportResult.summary}
                      </div>
                    </div>
                  </div>

                  {/* SOURCES */}

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setShowSources(!showSources)
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[#DCE8EC]
                        bg-white
                        px-4
                        py-3
                        text-left
                        transition
                        hover:bg-[#F7FAFB]
                        dark:border-[#1C3A45]
                        dark:bg-[#0D2029]
                        dark:hover:bg-[#10333E]
                      "
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          Supporting evidence
                        </div>

                        <div className="mt-0.5 text-[11px] text-[#627D98] dark:text-[#8AA2AD]">
                          {reportResult.sources?.length || 0} retrieved
                          source passages
                        </div>
                      </div>

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-[#627D98] transition-transform ${
                          showSources
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {showSources && (
                      <div className="mt-2 space-y-2">
                        {reportResult.sources?.map(
                          (source, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-[#DCE8EC] bg-[#F7FAFB] p-4 dark:border-[#1C3A45] dark:bg-[#0A1B23]"
                            >
                              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#36B9D0]">
                                Evidence {index + 1}
                              </div>

                              <p className="whitespace-pre-wrap text-xs leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                                {source}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* SAFETY NOTE */}

                  <div className="mt-5 flex gap-3 rounded-xl border border-[#DCE8EC] bg-[#F7FAFB] p-4 dark:border-[#1C3A45] dark:bg-[#0A1B23]">
                    <div className="mt-0.5 shrink-0 text-[#36B9D0]">
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>

                    <p className="text-[11px] leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                      This explanation is based on the
                      information retrieved from the uploaded
                      report. It does not replace evaluation,
                      diagnosis, or treatment from a qualified
                      healthcare professional.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}