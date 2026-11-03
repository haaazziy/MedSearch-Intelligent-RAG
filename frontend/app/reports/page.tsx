"use client";

import AppShell from "../../components/AppShell";
import {
  ChangeEvent,
  ReactNode,
  useState,
} from "react";

interface UploadResult {
  status: string;
  message?: string;
  filename?: string;
  characters_extracted?: number;
  chunks_created?: number;
  storage_path?: string;
}

interface ReportResult {
  status: string;
  document_name?: string;
  summary?: string;
  sources?: string[];
  message?: string;
  detail?: any;
  report?: {
    filename?: string;
    text?: string;
    interpretation?: string;
    summary?: string;
    lab_results?: Array<{
      test_name?: string;
      value?: string | number;
      unit?: string;
      reference_range?: string;
      status?: string;
    }>;
    [key: string]: any;
  };
}

interface ReportSectionData {
  title: string;
  content: string[];
}

interface LabRow {
  test: string;
  result: string;
  reference: string;
  unit: string;
}

const API_BASE = "http://127.0.0.1:8000";

export default function ReportsPage() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [explaining, setExplaining] =
    useState(false);

  const [uploadResult, setUploadResult] =
    useState<UploadResult | null>(null);

  const [reportResult, setReportResult] =
    useState<ReportResult | null>(null);

  const [error, setError] = useState("");

  const [showSources, setShowSources] =
    useState(false);

  // =========================================================
  // FILE SELECTION
  // =========================================================

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setUploadResult(null);
    setReportResult(null);
    setShowSources(false);

    if (
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setSelectedFile(null);
      setError("Only PDF files are supported.");
      return;
    }

    setSelectedFile(file);
  }

  // =========================================================
  // UPLOAD
  // =========================================================

  async function uploadReport() {
    if (!selectedFile) {
      setError("Please select a PDF report first.");
      return;
    }

    setUploading(true);
    setError("");
    setUploadResult(null);
    setReportResult(null);
    setShowSources(false);

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

      let data: UploadResult;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please check the backend."
        );
      }

      if (
        !response.ok ||
        !["success", "indexed"].includes(data.status)
      ) {
        throw new Error(
          data.message ||
            `Report upload failed. Server status: ${response.status}`
        );
      }

      setUploadResult(data);
      setError("");
    } catch (err) {
      setUploadResult(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the report. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  // =========================================================
  // EXPLAIN
  // =========================================================

  async function explainReport() {
    if (!selectedFile || !uploadResult) {
      setError(
        "Please upload and index the report first."
      );
      return;
    }

    setExplaining(true);
    setError("");
    setReportResult(null);
    setShowSources(false);

    try {
      const response = await fetch(
        `${API_BASE}/v1/reports/explain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename:
              uploadResult.filename || selectedFile.name,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid explanation response."
        );
      }

      if (!response.ok) {
        const detail = data?.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail || data?.message || data)
        );
      }

      if (data?.status !== "success" || !data?.report) {
        throw new Error(
          data?.message || "The backend did not return an analyzed report."
        );
      }

      const report = data.report;
      const reportText =
        typeof report.text === "string" ? report.text : "";
      const labResults = Array.isArray(report.lab_results)
        ? report.lab_results
        : Array.isArray(report.laboratory_results)
          ? report.laboratory_results
          : [];

      // Build supporting passages only from text actually extracted
      // from the uploaded PDF; do not fabricate evidence.
      const evidenceSources = labResults
        .map((item: any) => {
          const testName = String(item?.test_name || "").trim();
          if (!testName || !reportText) return "";

          const matchingLine = reportText
            .split(/\r?\n/)
            .find((line: string) =>
              line.toLowerCase().includes(testName.toLowerCase())
            );

          return matchingLine?.trim() || "";
        })
        .filter((source: string, index: number, all: string[]) =>
          Boolean(source) && all.indexOf(source) === index
        );

      setReportResult({
        status: data.status,
        document_name: report.filename || uploadResult.filename || selectedFile.name,
        summary:
          report.interpretation ||
          report.summary ||
          "The report was analyzed, but no summary was returned.",
        sources: evidenceSources,
        report,
      });
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

  // =========================================================
  // FILE SIZE
  // =========================================================

  function formatFileSize(
    bytes: number
  ) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  // =========================================================
  // REPORT RENDERER
  // =========================================================

  function renderReportSummary(
    summary: string
  ) {
    const sections =
      parseReportSections(summary);

    if (!sections.length) {
      return (
        <SummaryCard
          content={[summary.trim()]}
        />
      );
    }

    const output: ReactNode[] = [];

    let sectionNumber = 0;

    const summarySection =
      sections.find((section) =>
        isSummaryTitle(section.title)
      );

    const findingsSection =
      sections.find((section) =>
        isFindingsTitle(section.title)
      );

    const laboratorySection =
      sections.find((section) =>
        isLaboratoryTitle(section.title)
      );

    const interpretationSection =
      sections.find((section) =>
        isInterpretationTitle(section.title)
      );

    const noteSection =
      sections.find((section) =>
        isNoteTitle(section.title)
      );

    const usedTitles =
      new Set<string>();

    if (summarySection) {
      usedTitles.add(
        summarySection.title
      );

      output.push(
        <SummaryCard
          key="summary"
          content={
            summarySection.content
          }
        />
      );
    }

    if (findingsSection) {
      usedTitles.add(
        findingsSection.title
      );

      sectionNumber++;

      output.push(
        <ReportSection
          key="findings"
          title="KEY FINDINGS"
          content={
            findingsSection.content
          }
          index={sectionNumber}
          type="findings"
        />
      );
    }

    if (laboratorySection) {
      usedTitles.add(
        laboratorySection.title
      );

      sectionNumber++;

      output.push(
        <ReportSection
          key="laboratory"
          title="LABORATORY RESULTS"
          content={
            laboratorySection.content
          }
          index={sectionNumber}
          type="laboratory"
        />
      );
    }

    if (interpretationSection) {
      usedTitles.add(
        interpretationSection.title
      );

      sectionNumber++;

      output.push(
        <ReportSection
          key="interpretation"
          title="INTERPRETATION"
          content={
            interpretationSection.content
          }
          index={sectionNumber}
          type="interpretation"
        />
      );
    }

    if (noteSection) {
      usedTitles.add(
        noteSection.title
      );

      sectionNumber++;

      output.push(
        <ReportSection
          key="note"
          title="IMPORTANT NOTE"
          content={
            noteSection.content
          }
          index={sectionNumber}
          type="note"
        />
      );
    }

    for (const section of sections) {
      if (
        usedTitles.has(
          section.title
        )
      ) {
        continue;
      }

      if (
        isExerciseTitle(
          section.title
        ) ||
        isSolutionTitle(
          section.title
        )
      ) {
        continue;
      }

      sectionNumber++;

      output.push(
        <ReportSection
          key={`${section.title}-${sectionNumber}`}
          title={section.title}
          content={section.content}
          index={sectionNumber}
          type="normal"
        />
      );
    }

    return (
      <div className="space-y-6">
        {output}
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell>
      <div
        className="
          min-h-[calc(100vh-76px)]
          bg-[#F3F8FA]
          px-6
          py-8
          text-[#102A43]
          transition-colors
          duration-500
          dark:bg-[#07151C]
          dark:text-[#E8F4F7]
          md:px-8
          lg:px-10
        "
      >
        <div className="mx-auto max-w-7xl">

          {/* PAGE HEADER */}

          <div className="mb-8">

            <div
              className="
                mb-2
                flex
                items-center
                gap-2
                text-[11px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-[#36B9D0]
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#36B9D0]
                "
              />

              Medical Reports
            </div>

            <div
              className="
                flex
                flex-col
                justify-between
                gap-4
                md:flex-row
                md:items-end
              "
            >

              <div>

                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    md:text-4xl
                  "
                >
                  Understand your medical
                  reports
                </h1>

                <p
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    font-medium
                    leading-6
                    text-[#627D98]
                    dark:text-[#8AA2AD]
                  "
                >
                  Upload a medical PDF and
                  MedSearch AI will retrieve
                  relevant evidence and explain
                  the report in patient-friendly
                  language.
                </p>

              </div>

              <div
                className="
                  flex
                  w-fit
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#DCE8EC]
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-[#627D98]
                  shadow-sm
                  dark:border-[#1C3A45]
                  dark:bg-[#0D2029]
                  dark:text-[#8AA2AD]
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-[#20A779]
                  "
                />

                RAG system online
              </div>

            </div>
          </div>

          {/* MAIN GRID */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-[380px_minmax(0,1fr)]
            "
          >

            {/* =================================================
                LEFT — UPLOAD
            ================================================= */}

            <section
              className="
                h-fit
                rounded-2xl
                border
                border-[#DCE8EC]
                bg-white
                p-6
                shadow-[0_8px_30px_rgba(16,42,67,0.04)]
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-none
              "
            >

              <div className="mb-6">

                <h2 className="text-lg font-bold">
                  Upload report
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-[#627D98]
                    dark:text-[#8AA2AD]
                  "
                >
                  PDF files are processed
                  through the MedSearch AI
                  retrieval pipeline.
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
                  onChange={
                    handleFileChange
                  }
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
                  <UploadFileIcon />
                </div>

                <div className="text-sm font-bold">
                  Choose a medical PDF
                </div>

                <div
                  className="
                    mt-1
                    text-xs
                    font-medium
                    text-[#627D98]
                    dark:text-[#8AA2AD]
                  "
                >
                  Click to browse your files
                </div>

                <div
                  className="
                    mt-3
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-[#8AA0B1]
                    dark:text-[#607984]
                  "
                >
                  PDF only
                </div>

              </label>

              {/* SELECTED FILE */}

              {selectedFile && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border
                    border-[#DCE8EC]
                    bg-[#F7FAFB]
                    p-4
                    dark:border-[#1C3A45]
                    dark:bg-[#0A1B23]
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#E8F7FA]
                        text-[#126782]
                        dark:bg-[#10333E]
                        dark:text-[#36B9D0]
                      "
                    >
                      <PdfIcon />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div
                        className="
                          truncate
                          text-sm
                          font-semibold
                        "
                      >
                        {selectedFile.name}
                      </div>

                      <div
                        className="
                          mt-0.5
                          text-xs
                          font-medium
                          text-[#627D98]
                          dark:text-[#8AA2AD]
                        "
                      >
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
                        setShowSources(false);
                      }}
                      className="
                        text-xs
                        font-semibold
                        text-[#627D98]
                        hover:text-[#D14B4B]
                        dark:text-[#8AA2AD]
                      "
                    >
                      Remove
                    </button>

                  </div>

                </div>
              )}

              {/* ERROR */}

              {error && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-xs
                    font-semibold
                    leading-5
                    text-red-700
                    dark:border-red-900/50
                    dark:bg-red-950/20
                    dark:text-red-300
                  "
                >
                  {error}
                </div>
              )}

              {/* UPLOAD */}

              <button
                type="button"
                onClick={uploadReport}
                disabled={
                  !selectedFile ||
                  uploading
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
                  font-bold
                  text-white
                  shadow-[0_8px_20px_rgba(18,103,130,0.18)]
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:bg-[#0F5970]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-[#17677D]
                  dark:hover:bg-[#1B7891]
                "
              >

                {uploading ? (
                  <>
                    <Spinner />
                    Uploading report...
                  </>
                ) : (
                  <>
                    <UploadSmallIcon />
                    Upload & index report
                  </>
                )}

              </button>

              {/* SUCCESS */}

              {uploadResult && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border
                    border-emerald-200
                    bg-emerald-50
                    px-4
                    py-3
                    dark:border-emerald-900/50
                    dark:bg-emerald-950/20
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      text-[#16845F]
                      dark:text-[#4ED3A6]
                    "
                  >

                    <span
                      className="
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                        rounded-full
                        bg-[#20A779]
                        text-white
                      "
                    >
                      <CheckIcon />
                    </span>

                    Report indexed successfully
                  </div>

                  <div
                    className="
                      mt-2
                      space-y-1
                      text-[11px]
                      font-medium
                      text-[#627D98]
                      dark:text-[#8AA2AD]
                    "
                  >
                    <div>
                      Characters extracted:{" "}
                      {
                        uploadResult.characters_extracted
                      }
                    </div>

                    <div>
                      Chunks created:{" "}
                      {
                        uploadResult.chunks_created
                      }
                    </div>
                  </div>

                </div>
              )}

              {/* EXPLAIN */}

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
                  bg-[#36B9D0]
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_8px_22px_rgba(54,185,208,0.20)]
                  transition-all
                  duration-200
                  hover:-translate-y-[1px]
                  hover:bg-[#2FA8BE]
                  disabled:cursor-not-allowed
                  disabled:border
                  disabled:border-[#DCE8EC]
                  disabled:bg-[#F7FAFB]
                  disabled:text-[#9DB2BC]
                  disabled:shadow-none
                  dark:text-[#07151C]
                  dark:hover:bg-[#45C6DB]
                  dark:disabled:border-[#1C3A45]
                  dark:disabled:bg-[#0A1B23]
                  dark:disabled:text-[#607984]
                "
              >

                {explaining ? (
                  <>
                    <Spinner />
                    Analyzing report...
                  </>
                ) : (
                  <>
                    <SparkIcon />
                    Explain this report
                  </>
                )}

              </button>

              <p
                className="
                  mt-4
                  text-center
                  text-[10px]
                  font-medium
                  leading-4
                  text-[#8AA0B1]
                  dark:text-[#607984]
                "
              >
                Information from the report
                does not replace professional
                medical advice.
              </p>

            </section>

            {/* =================================================
                RIGHT — REPORT
            ================================================= */}

            <section
              className="
                min-w-0
                rounded-2xl
                border
                border-[#DCE8EC]
                bg-white
                shadow-[0_8px_30px_rgba(16,42,67,0.04)]
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-none
              "
            >

              {!reportResult ? (

                <EmptyReportState />

              ) : (

                <div>

                  {/* REPORT HEADER */}

                  <div
                    className="
                      border-b
                      border-[#E3EDF0]
                      px-7
                      py-7
                      dark:border-[#1C3A45]
                      lg:px-9
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-5
                      "
                    >

                      <div className="min-w-0">

                        <div
                          className="
                            mb-3
                            flex
                            items-center
                            gap-2
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-[0.18em]
                            text-[#36B9D0]
                          "
                        >
                          <span
                            className="
                              h-1.5
                              w-1.5
                              rounded-full
                              bg-[#36B9D0]
                            "
                          />

                          Medical report analysis
                        </div>

                        <h2
                          className="
                            text-2xl
                            font-extrabold
                            tracking-tight
                            text-[#102A43]
                            dark:text-[#E8F4F7]
                            sm:text-[27px]
                          "
                        >
                          AI REPORT EXPLANATION
                        </h2>

                        <p
                          className="
                            mt-2
                            max-w-2xl
                            text-[12px]
                            font-medium
                            leading-5
                            text-[#718A96]
                            dark:text-[#8AA2AD]
                          "
                        >
                          A clear, patient-friendly
                          explanation based on the
                          information retrieved from
                          your uploaded report.
                        </p>

                      </div>

                      <div
                        className="
                          hidden
                          shrink-0
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-[#CDEBE1]
                          bg-[#F2FBF7]
                          px-3
                          py-2
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.12em]
                          text-[#16825F]
                          sm:flex
                          dark:border-[#205544]
                          dark:bg-[#102C25]
                          dark:text-[#4ED3A6]
                        "
                      >

                        <span
                          className="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-[#20A779]
                          "
                        />

                        Evidence grounded

                      </div>

                    </div>

                    <div
                      className="
                        mt-6
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        bg-[#F7FAFB]
                        px-4
                        py-3
                        dark:bg-[#0A1B23]
                      "
                    >

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-white
                          text-[#126782]
                          shadow-sm
                          dark:bg-[#10343E]
                          dark:text-[#36B9D0]
                        "
                      >
                        <PdfIcon />
                      </div>

                      <div className="min-w-0">

                        <div
                          className="
                            truncate
                            text-xs
                            font-bold
                            text-[#294D63]
                            dark:text-[#D5E4E8]
                          "
                        >
                          {
                            reportResult.document_name
                          }
                        </div>

                        <div
                          className="
                            mt-0.5
                            text-[10px]
                            font-medium
                            text-[#8AA2AD]
                          "
                        >
                          Uploaded medical document
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* REPORT CONTENT */}

                  <div
                    className="
                      px-7
                      py-8
                      lg:px-9
                    "
                  >

                    {reportResult.summary && (
                      <div>
                        {renderReportSummary(
                          reportResult.summary
                        )}
                      </div>
                    )}

                    {/* SUPPORTING EVIDENCE */}

                    <div className="mt-7">

                      <button
                        type="button"
                        onClick={() =>
                          setShowSources(
                            !showSources
                          )
                        }
                        className="
                          group
                          flex
                          w-full
                          items-center
                          justify-between
                          border-t
                          border-[#E1EBEE]
                          px-1
                          py-5
                          text-left
                          dark:border-[#1C3A45]
                        "
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-lg
                              bg-[#F0F8F9]
                              text-[#126782]
                              dark:bg-[#10343E]
                              dark:text-[#36B9D0]
                            "
                          >
                            <EvidenceIcon />
                          </div>

                          <div>

                            <div
                              className="
                                text-sm
                                font-bold
                                text-[#294D63]
                                dark:text-[#D5E4E8]
                              "
                            >
                              Supporting Evidence
                            </div>

                            <div
                              className="
                                mt-0.5
                                text-[10px]
                                font-medium
                                text-[#8AA2AD]
                              "
                            >
                              View the relevant passages
                              used by the AI
                            </div>

                          </div>

                        </div>

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-[10px]
                            font-bold
                            text-[#627D98]
                            dark:text-[#8AA2AD]
                          "
                        >

                          {deduplicateSources(
                            reportResult.sources || []
                          ).length}

                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`
                              transition-transform
                              duration-300
                              group-hover:text-[#36B9D0]
                              ${
                                showSources
                                  ? "rotate-180"
                                  : ""
                              }
                            `}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>

                        </div>

                      </button>

                      {showSources && (
                        <div
                          className="
                            space-y-3
                            pb-2
                          "
                        >

                          {deduplicateSources(
                            reportResult.sources || []
                          ).map(
                            (
                              source,
                              index
                            ) => (
                              <div
                                key={`${source}-${index}`}
                                className="
                                  rounded-xl
                                  border
                                  border-[#DCE8EC]
                                  bg-[#F8FBFC]
                                  px-5
                                  py-4
                                  dark:border-[#1C3A45]
                                  dark:bg-[#0A1B23]
                                "
                              >

                                <div
                                  className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-2
                                  "
                                >

                                  <span
                                    className="
                                      flex
                                      h-5
                                      w-5
                                      items-center
                                      justify-center
                                      rounded-md
                                      bg-[#E8F7FA]
                                      text-[9px]
                                      font-bold
                                      text-[#126782]
                                      dark:bg-[#10333E]
                                      dark:text-[#36B9D0]
                                    "
                                  >
                                    {index + 1}
                                  </span>

                                  <span
                                    className="
                                      text-[9px]
                                      font-bold
                                      uppercase
                                      tracking-[0.12em]
                                      text-[#8AA2AD]
                                    "
                                  >
                                    Report evidence
                                  </span>

                                </div>

                                <p
                                  className="
                                    whitespace-pre-wrap
                                    text-[12px]
                                    font-medium
                                    leading-6
                                    text-[#627D98]
                                    dark:text-[#9CB2BA]
                                  "
                                >
                                  {source}
                                </p>

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>

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

// =========================================================
// EMPTY REPORT STATE
// =========================================================

function EmptyReportState() {
  return (
    <div
      className="
        flex
        min-h-[680px]
        flex-col
        items-center
        justify-center
        px-8
        py-12
        text-center
      "
    >

      <div
        className="
          relative
          mb-7
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-[22px]
          border
          border-[#D8E9ED]
          bg-[#F4FAFB]
          text-[#126782]
          shadow-[0_12px_30px_rgba(18,103,130,0.06)]
          dark:border-[#245664]
          dark:bg-[#10343E]
          dark:text-[#36B9D0]
        "
      >

        <ReportIcon />

        <span
          className="
            absolute
            -right-1
            -top-1
            h-3
            w-3
            rounded-full
            border-2
            border-white
            bg-[#36B9D0]
            dark:border-[#0D2029]
          "
        />

      </div>

      <div
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-[0.2em]
          text-[#36B9D0]
        "
      >
        Medical intelligence
      </div>

      <h2
        className="
          mt-2
          text-xl
          font-extrabold
          tracking-tight
        "
      >
        Your report explanation
      </h2>

      <p
        className="
          mt-3
          max-w-md
          text-sm
          font-medium
          leading-7
          text-[#718A96]
          dark:text-[#8AA2AD]
        "
      >
        Upload and index a medical report,
        then select “Explain this report”.
        Your structured explanation will
        appear here.
      </p>

      <div
        className="
          mt-8
          flex
          items-center
          gap-3
          text-[10px]
          font-semibold
          text-[#8AA2AD]
        "
      >

        <span className="h-px w-10 bg-[#DCE8EC] dark:bg-[#1C3A45]" />

        Upload

        <span className="h-1 w-1 rounded-full bg-[#36B9D0]" />

        Retrieve

        <span className="h-1 w-1 rounded-full bg-[#36B9D0]" />

        Explain

        <span className="h-px w-10 bg-[#DCE8EC] dark:bg-[#1C3A45]" />

      </div>

    </div>
  );
}

// =========================================================
// AI SUMMARY
// =========================================================

function SummaryCard({
  content,
}: {
  content: string[];
}) {
  const cleaned =
    removeDuplicateParagraphs(
      content
        .map(removeBullet)
        .join(" ")
    );

  return (
    <section
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-[#CFE7EC]
        bg-white
        shadow-[0_8px_28px_rgba(16,42,67,0.035)]
        dark:border-[#245664]
        dark:bg-[#0D2029]
      "
    >

      {/* SUMMARY HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#E2EEF1]
          px-6
          py-5
          dark:border-[#1C3A45]
          sm:px-7
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-[#E8F7FA]
              text-[#126782]
              dark:bg-[#10343E]
              dark:text-[#36B9D0]
            "
          >
            <SummaryIcon />
          </div>

          <div>

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.17em]
                text-[#36B9D0]
              "
            >
              Overview
            </div>

            <h3
              className="
                mt-0.5
                text-[17px]
                font-extrabold
                tracking-tight
                text-[#102A43]
                dark:text-[#E8F4F7]
              "
            >
              AI SUMMARY
            </h3>

          </div>

        </div>

        <span
          className="
            hidden
            text-[9px]
            font-bold
            uppercase
            tracking-[0.13em]
            text-[#8AA2AD]
            sm:block
          "
        >
          Patient-friendly
        </span>

      </div>

      {/* SUMMARY TEXT */}

      <div
        className="
          px-6
          py-7
          sm:px-7
          sm:py-8
        "
      >

        <div
          className="
            border-l-[3px]
            border-[#36B9D0]
            pl-5
            sm:pl-6
          "
        >

          <p
            className="
              max-w-3xl
              text-[15px]
              font-medium
              leading-[1.9]
              tracking-[0.001em]
              text-[#405E70]
              dark:text-[#D1E0E5]
              sm:text-[16px]
            "
          >
            {formatImportantText(
              cleaned
            )}
          </p>

        </div>

      </div>

    </section>
  );
}

// =========================================================
// REPORT SECTION
// =========================================================

function ReportSection({
  title,
  content,
  index,
  type,
}: {
  title: string;
  content: string[];
  index: number;
  type:
    | "findings"
    | "laboratory"
    | "interpretation"
    | "note"
    | "normal";
}) {
  const isFindings =
    type === "findings";

  const isLaboratory =
    type === "laboratory";

  const isInterpretation =
    type === "interpretation";

  const isNote =
    type === "note";

  return (
    <section
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-[#DCE8EC]
        bg-white
        shadow-[0_7px_25px_rgba(16,42,67,0.035)]
        dark:border-[#1C3A45]
        dark:bg-[#0D2029]
        dark:shadow-none
      "
    >

      {/* SECTION HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-[#E5EEF1]
          px-6
          py-5
          dark:border-[#1C3A45]
          sm:px-7
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#F0F8F9]
              text-[#126782]
              dark:bg-[#10343E]
              dark:text-[#36B9D0]
            "
          >

            {isFindings ? (
              <FindingsIcon />
            ) : isLaboratory ? (
              <LaboratoryIcon />
            ) : isInterpretation ? (
              <InterpretationIcon />
            ) : isNote ? (
              <InfoIcon />
            ) : (
              <SectionIcon />
            )}

          </div>

          <div>

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-[#8AA2AD]
              "
            >
              Section{" "}
              {String(index).padStart(2, "0")}
            </div>

            <h3
              className="
                mt-0.5
                text-[17px]
                font-extrabold
                tracking-tight
                text-[#102A43]
                dark:text-[#E8F4F7]
              "
            >
              {title}
            </h3>

          </div>

        </div>

        {isFindings && (
          <span
            className="
              hidden
              rounded-full
              bg-[#F1FBF7]
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-[#16825F]
              sm:block
              dark:bg-[#102C25]
              dark:text-[#4ED3A6]
            "
          >
            Key information
          </span>
        )}

        {isLaboratory && (
          <span
            className="
              hidden
              rounded-full
              bg-[#F4FAFB]
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-[#627D98]
              sm:block
              dark:bg-[#10343E]
              dark:text-[#70CBD8]
            "
          >
            Report values
          </span>
        )}

      </div>

      {/* SECTION BODY */}

      <div className="px-6 py-6 sm:px-7">

        {isLaboratory ? (
          <LaboratoryTable
            content={content}
          />
        ) : isFindings ? (
          <FindingsList
            content={content}
          />
        ) : (
          <div className="space-y-4">

            {content.map(
              (
                line,
                lineIndex
              ) => {

                if (!line.trim()) {
                  return null;
                }

                if (isBullet(line)) {
                  return (
                    <div
                      key={`${line}-${lineIndex}`}
                      className="
                        flex
                        gap-3
                      "
                    >
                      <span
                        className="
                          mt-[9px]
                          h-1.5
                          w-1.5
                          shrink-0
                          rounded-full
                          bg-[#36B9D0]
                        "
                      />

                      <p
                        className="
                          text-[14px]
                          font-medium
                          leading-7
                          text-[#405E70]
                          dark:text-[#CBDCE1]
                        "
                      >
                        {formatImportantText(
                          removeBullet(line)
                        )}
                      </p>
                    </div>
                  );
                }

                return (
                  <p
                    key={`${line}-${lineIndex}`}
                    className={`
                      text-[14px]
                      leading-7
                      ${
                        isNote
                          ? "font-medium text-[#718A96] dark:text-[#9CB2BA]"
                          : "font-medium text-[#405E70] dark:text-[#CBDCE1]"
                      }
                    `}
                  >
                    {formatImportantText(
                      line
                    )}
                  </p>
                );
              }
            )}

          </div>
        )}

        {/* NOTE — deliberately subtle */}

        {isNote && (
          <div
            className="
              mt-6
              flex
              items-start
              gap-3
              border-t
              border-[#E5EEF1]
              pt-5
              dark:border-[#1C3A45]
            "
          >

            <div
              className="
                mt-0.5
                shrink-0
                text-[#8AA2AD]
              "
            >
              <InfoIcon />
            </div>

            <p
              className="
                text-[11px]
                font-medium
                leading-5
                text-[#718A96]
                dark:text-[#8AA2AD]
              "
            >
              This explanation is for
              educational purposes and does
              not replace advice from a
              qualified healthcare professional.
            </p>

          </div>
        )}

      </div>

    </section>
  );
}

// =========================================================
// FINDINGS LIST
// =========================================================

function FindingsList({
  content,
}: {
  content: string[];
}) {
  const cleaned = content
    .map((line) =>
      removeBullet(line)
    )
    .filter(Boolean);

  return (
    <div
      className="
        divide-y
        divide-[#E7EFF2]
        rounded-xl
        border
        border-[#E1ECEF]
        dark:divide-[#1C3A45]
        dark:border-[#1C3A45]
      "
    >

      {cleaned.map(
        (
          line,
          index
        ) => {

          const structured =
            parseStructuredLine(
              line
            );

          if (structured) {
            return (
              <div
                key={`${line}-${index}`}
                className="
                  flex
                  min-h-[54px]
                  flex-col
                  justify-center
                  gap-1
                  px-5
                  py-3.5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:gap-8
                "
              >

                <div
                  className="
                    text-[12px]
                    font-semibold
                    text-[#627D98]
                    dark:text-[#8AA2AD]
                  "
                >
                  {structured.label}
                </div>

                <div
                  className="
                    text-[13px]
                    font-extrabold
                    text-[#126782]
                    dark:text-[#45C6DB]
                    sm:text-right
                  "
                >
                  {formatImportantText(
                    structured.value
                  )}
                </div>

              </div>
            );
          }

          return (
            <div
              key={`${line}-${index}`}
              className="
                flex
                min-h-[54px]
                items-center
                gap-3
                px-5
                py-3.5
              "
            >

              <span
                className="
                  h-1.5
                  w-1.5
                  shrink-0
                  rounded-full
                  bg-[#36B9D0]
                "
              />

              <p
                className="
                  text-[13px]
                  font-semibold
                  leading-6
                  text-[#405E70]
                  dark:text-[#CBDCE1]
                "
              >
                {formatImportantText(
                  line
                )}
              </p>

            </div>
          );
        }
      )}

    </div>
  );
}

// =========================================================
// LABORATORY TABLE
// =========================================================

function LaboratoryTable({
  content,
}: {
  content: string[];
}) {
  const rows =
    extractLabRows(content);

  if (!rows.length) {
    return (
      <div className="space-y-3">

        {content
          .filter(Boolean)
          .map(
            (
              line,
              index
            ) => (
              <p
                key={index}
                className="
                  text-[13px]
                  font-medium
                  leading-7
                  text-[#405E70]
                  dark:text-[#CBDCE1]
                "
              >
                {formatImportantText(
                  line
                )}
              </p>
            )
          )}

      </div>
    );
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-xl
        border
        border-[#DCE8EC]
        dark:border-[#1C3A45]
      "
    >

      <div className="overflow-x-auto">

        <table className="w-full min-w-[620px] border-collapse">

          <thead>

            <tr
              className="
                bg-[#F6FAFB]
                dark:bg-[#102A34]
              "
            >

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[#718A96]
                  dark:text-[#8AA2AD]
                "
              >
                Test
              </th>

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[#718A96]
                  dark:text-[#8AA2AD]
                "
              >
                Result
              </th>

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[#718A96]
                  dark:text-[#8AA2AD]
                "
              >
                Reference Range
              </th>

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[#718A96]
                  dark:text-[#8AA2AD]
                "
              >
                Unit
              </th>

            </tr>

          </thead>

          <tbody>

            {rows.map(
              (
                row,
                index
              ) => (
                <tr
                  key={index}
                  className="
                    border-t
                    border-[#E4EDF0]
                    dark:border-[#1C3A45]
                  "
                >

                  <td
                    className="
                      px-5
                      py-4
                      text-[13px]
                      font-semibold
                      text-[#294D63]
                      dark:text-[#D5E4E8]
                    "
                  >
                    {row.test}
                  </td>

                  <td
                    className="
                      px-5
                      py-4
                      text-[13px]
                      font-extrabold
                      text-[#126782]
                      dark:text-[#45C6DB]
                    "
                  >
                    {row.result}
                  </td>

                  <td
                    className="
                      px-5
                      py-4
                      text-[13px]
                      font-medium
                      text-[#627D98]
                      dark:text-[#9CB2BA]
                    "
                  >
                    {row.reference}
                  </td>

                  <td
                    className="
                      px-5
                      py-4
                      text-[13px]
                      font-medium
                      text-[#718A96]
                      dark:text-[#819AA4]
                    "
                  >
                    {row.unit || "—"}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// =========================================================
// EXTRACT LAB ROWS
// =========================================================

function extractLabRows(
  content: string[]
): LabRow[] {
  const rows: LabRow[] = [];

  for (const line of content) {

    const cleaned =
      line
        .replace(
          /^[-•*]\s+/,
          ""
        )
        .trim();

    const pipeMatch =
      cleaned.match(
        /^(.+?):\s*([0-9]+(?:\.\d+)?)\s*([^\s|]+)?\s*\|\s*(.+)$/i
      );

    if (pipeMatch) {
      rows.push({
        test:
          pipeMatch[1].trim(),
        result:
          pipeMatch[2].trim(),
        unit:
          pipeMatch[3]?.trim() || "",
        reference:
          pipeMatch[4].trim(),
      });

      continue;
    }

    const standardMatch =
      cleaned.match(
        /^([A-Za-z][A-Za-z\s()/-]{1,45})\s+([0-9]+(?:\.\d+)?)\s*([^\s]+)?\s+([0-9]+(?:\.\d+)?\s*[–-]\s*[0-9]+(?:\.\d+)?)\s*(.*)$/i
      );

    if (standardMatch) {
      rows.push({
        test:
          standardMatch[1].trim(),
        result:
          standardMatch[2].trim(),
        unit:
          standardMatch[3]?.trim() || "",
        reference:
          `${standardMatch[4]} ${
            standardMatch[5] || ""
          }`.trim(),
      });
    }
  }

  return rows;
}

// =========================================================
// STRUCTURED FINDING
// =========================================================

function parseStructuredLine(
  text: string
): {
  label: string;
  value: string;
} | null {
  const match =
    text.match(
      /^([^:]{2,40}):\s+(.+)$/
    );

  if (!match) {
    return null;
  }

  const label =
    match[1].trim();

  const value =
    match[2].trim();

  const allowedLabels = [
    "patient id",
    "age",
    "sex",
    "gender",
    "report date",
    "test date",
    "hemoglobin",
    "wbc",
    "white blood cells",
    "platelet",
    "platelets",
    "fasting glucose",
    "glucose",
    "creatinine",
    "alt",
    "ast",
    "cholesterol",
    "hdl",
    "ldl",
    "triglycerides",
  ];

  if (
    allowedLabels.includes(
      label.toLowerCase().trim()
    )
  ) {
    return {
      label,
      value,
    };
  }

  return null;
}

// =========================================================
// PARSE REPORT SECTIONS
// =========================================================

function parseReportSections(
  summary: string
): ReportSectionData[] {
  const text =
    summary
      .replace(/\r/g, "")
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .trim();

  if (!text) {
    return [];
  }

  const headingPattern =
    /(?:^|\n)\s*(REPORT SUMMARY|AI SUMMARY|SUMMARY|OVERVIEW|KEY FINDINGS|IMPORTANT FINDINGS|CLINICAL FINDINGS|LABORATORY RESULTS|LAB RESULTS|TEST RESULTS|LABORATORY FINDINGS|INTERPRETATION|CLINICAL INTERPRETATION|CLINICAL ASSESSMENT|CONCLUSION|IMPORTANT NOTE|SAFETY NOTE|MEDICAL SAFETY)\s*:?\s*(?=\n|$)/gi;

  const matches = [
    ...text.matchAll(
      headingPattern
    ),
  ];

  if (!matches.length) {
    return [
      {
        title: "REPORT SUMMARY",
        content: [
          text
            .replace(
              /\s+/g,
              " "
            )
            .trim(),
        ],
      },
    ];
  }

  const sections: ReportSectionData[] =
    [];

  const firstMatch =
    matches[0];

  const firstIndex =
    firstMatch.index ?? 0;

  const before =
    text
      .slice(
        0,
        firstIndex
      )
      .trim();

  if (before) {
    sections.push({
      title: "REPORT SUMMARY",
      content: [
        before
          .replace(
            /\s+/g,
            " "
          )
          .trim(),
      ],
    });
  }

  for (
    let i = 0;
    i < matches.length;
    i++
  ) {
    const match =
      matches[i];

    const title =
      match[1]
        .trim()
        .toUpperCase();

    const start =
      (match.index ?? 0) +
      match[0].length;

    const end =
      i + 1 < matches.length
        ? matches[i + 1].index ??
          text.length
        : text.length;

    const contentText =
      text
        .slice(
          start,
          end
        )
        .trim();

    if (!contentText) {
      continue;
    }

    const content =
      contentText
        .split(/\n+/)
        .map((line) =>
          cleanMarkdown(line)
        )
        .filter(Boolean);

    sections.push({
      title,
      content,
    });
  }

  return removeDuplicateSections(
    sections
  );
}

// =========================================================
// REMOVE DUPLICATE SECTIONS
// =========================================================

function removeDuplicateSections(
  sections: ReportSectionData[]
) {
  const result: ReportSectionData[] =
    [];

  const seen =
    new Set<string>();

  for (const section of sections) {
    const key =
      section.title
        .toLowerCase()
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(section);
  }

  return result;
}

// =========================================================
// TITLES
// =========================================================

function isSummaryTitle(
  title: string
) {
  return [
    "summary",
    "report summary",
    "ai summary",
    "overview",
  ].includes(
    title
      .toLowerCase()
      .trim()
  );
}

function isFindingsTitle(
  title: string
) {
  return [
    "key findings",
    "important findings",
    "clinical findings",
  ].includes(
    title
      .toLowerCase()
      .trim()
  );
}

function isLaboratoryTitle(
  title: string
) {
  return [
    "laboratory results",
    "lab results",
    "test results",
    "laboratory findings",
  ].includes(
    title
      .toLowerCase()
      .trim()
  );
}

function isInterpretationTitle(
  title: string
) {
  return [
    "interpretation",
    "clinical interpretation",
    "clinical assessment",
  ].includes(
    title
      .toLowerCase()
      .trim()
  );
}

function isNoteTitle(
  title: string
) {
  return [
    "important note",
    "safety note",
    "medical safety",
  ].includes(
    title
      .toLowerCase()
      .trim()
  );
}

// =========================================================
// EXERCISE / SOLUTION
// =========================================================

function isExerciseTitle(
  title: string
) {
  return /^(?:follow-up\s+)?exercise\s+\d+$/i.test(
    title
      .replace(
        /:$/,
        ""
      )
      .trim()
  );
}

function isSolutionTitle(
  title: string
) {
  return (
    title
      .replace(
        /:$/,
        ""
      )
      .trim()
      .toLowerCase() ===
    "solution"
  );
}

// =========================================================
// MARKDOWN
// =========================================================

function cleanMarkdown(
  text: string
) {
  return text
    .replace(
      /^#{1,6}\s*/,
      ""
    )
    .replace(
      /^\*\*(.*?)\*\*$/,
      "$1"
    )
    .replace(
      /^__(.*?)__$/,
      "$1"
    )
    .trim();
}

// =========================================================
// BULLETS
// =========================================================

function isBullet(
  text: string
) {
  return /^[-•*]\s+/.test(
    text
  );
}

function removeBullet(
  text: string
) {
  return text
    .replace(
      /^[-•*]\s+/,
      ""
    )
    .trim();
}

// =========================================================
// REMOVE DUPLICATE SUMMARY SENTENCES
// =========================================================

function removeDuplicateParagraphs(
  text: string
) {
  const sentences =
    text
      .split(
        /(?<=[.!?])\s+/
      )
      .map((item) =>
        item
          .replace(
            /\s+/g,
            " "
          )
          .trim()
      )
      .filter(Boolean);

  const seen =
    new Set<string>();

  const unique: string[] =
    [];

  for (const sentence of sentences) {
    const key =
      sentence
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          " "
        )
        .trim();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(sentence);
  }

  return unique.join(" ");
}

// =========================================================
// SOURCE DEDUPLICATION
// =========================================================

function deduplicateSources(
  sources: string[]
) {
  const unique: string[] =
    [];

  const seen =
    new Set<string>();

  for (const source of sources) {
    const cleaned =
      source
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (!cleaned) {
      continue;
    }

    const normalized =
      cleaned
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          " "
        )
        .trim();

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(cleaned);
  }

  return unique;
}

// =========================================================
// FORMAT IMPORTANT MEDICAL VALUES
// =========================================================

function formatImportantText(
  text: string
) {
  const pattern =
    /(\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|U\/L|mmol\/L|mL|mg|g|kg|cm|°C|bpm|%|mmHg)\b)/gi;

  const parts =
    text.split(pattern);

  return parts.map(
    (
      part,
      index
    ) => {

      const isMeasurement =
        /\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|U\/L|mmol\/L|mL|mg|g|kg|cm|°C|bpm|%|mmHg)\b/i.test(
          part
        );

      if (isMeasurement) {
        return (
          <span
            key={index}
            className="
              font-bold
              text-[#126782]
              dark:text-[#45C6DB]
            "
          >
            {part}
          </span>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    }
  );
}

// =========================================================
// ICONS
// =========================================================

function SummaryIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 5h14" />
      <path d="M5 10h10" />
      <path d="M5 15h8" />
      <path d="M5 20h5" />
      <circle
        cx="17"
        cy="16"
        r="3"
      />
      <path d="m19.2 18.2 1.6 1.6" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v5h4" />
      <path d="M9 13h6" />
      <path d="M9 17h5" />
    </svg>
  );
}

function FindingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 4-6" />
    </svg>
  );
}

function LaboratoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4v6.5l-3.4 5.7c-.7 1.2.2 2.8 1.6 2.8h9.6c1.4 0 2.3-1.6 1.6-2.8L15 10.5V4" />
      <path d="M8 4h8" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

function InterpretationIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
      />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
      />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function EvidenceIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4h10c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
      <path d="M8.5 9h7" />
      <path d="M8.5 12h7" />
      <path d="M8.5 15h4.5" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg
      width="29"
      height="29"
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
  );
}

function UploadFileIcon() {
  return (
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
  );
}

function PdfIcon() {
  return (
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
      <path d="M8 14h2" />
      <path d="M8 17h5" />
    </svg>
  );
}

function UploadSmallIcon() {
  return (
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
  );
}

function SparkIcon() {
  return (
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
      <path d="M12 3v5" />
      <path d="M12 16v5" />
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <path d="m5.6 5.6 3.5 3.5" />
      <path d="m14.9 14.9 3.5 3.5" />
      <path d="m18.4 5.6-3.5 3.5" />
      <path d="m9.1 14.9-3.5 3.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="
        h-4
        w-4
        animate-spin
        rounded-full
        border-2
        border-current
        border-t-transparent
      "
    />
  );
}

function SectionIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M7 5h10" />
      <path d="M7 9h10" />
      <path d="M7 13h7" />
      <path d="M7 17h10" />
    </svg>
  );
}