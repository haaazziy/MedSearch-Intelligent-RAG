"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

type UploadResult = {
  status: string;
  message: string;
  filename?: string;
  characters_extracted?: number;
  chunks_created?: number;
};

type Stats = {
  documents: number;
  status: string;
  rag_ready: boolean;
};

type StoredDocument = {
  filename: string;
  size: number;
  storage_path: string;
};

export default function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch(`${API_URL}/v1/stats`);

      if (!response.ok) {
        throw new Error("Unable to load document statistics.");
      }

      const data = await response.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }

  async function loadDocuments() {
    setLoadingDocuments(true);
    setDocumentError("");

    try {
      const response = await fetch(`${API_URL}/v1/documents`);

      if (!response.ok) {
        throw new Error("Unable to load stored documents.");
      }

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(
          data.message || "Unable to load stored documents."
        );
      }

      setDocuments(data.documents ?? []);
    } catch (documentLoadError) {
      setDocuments([]);

      setDocumentError(
        documentLoadError instanceof Error
          ? documentLoadError.message
          : "Unable to load stored documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setResult(null);
    setError("");

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setError("Only PDF files are supported.");
      return;
    }

    setSelectedFile(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    handleFile(event.dataTransfer.files?.[0]);
  }

  async function uploadDocument() {
    if (!selectedFile || uploading) {
      return;
    }

    setUploading(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/v1/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: UploadResult = await response.json();

      if (!response.ok || data.status === "error") {
        throw new Error(
          data.message || "Document upload failed."
        );
      }

      setResult(data);
      setSelectedFile(null);

      await loadStats();
      await loadDocuments();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the document."
      );
    } finally {
      setUploading(false);
    }
  }

  function openDocument(filename: string) {
    const encodedFilename = encodeURIComponent(filename);

    window.open(
      `${API_URL}/v1/documents/${encodedFilename}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const documentCount = stats?.documents ?? 0;

  return (
    <AppShell>
      <div
        className="
          min-h-[calc(100vh-72px)]
          bg-[#F3F8FA]
          px-4 py-6
          text-[#102A43]
          transition-colors
          duration-500
          dark:bg-[#07151C]
          dark:text-[#E8F4F7]
          sm:px-8
        "
      >
        <div className="mx-auto max-w-[1180px]">

          {/* Page heading */}
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#20A779]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8AA2AD] dark:text-[#6F929E]">
                  Personal medical library
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102A43] dark:text-[#E8F4F7]">
                Documents
              </h1>

              <p className="mt-1 max-w-xl text-sm leading-6 text-[#627D98] dark:text-[#8AA2AD]">
                Store, access, and use your medical reports
                with MedSearch AI.
              </p>
            </div>

            {/* Document count */}
            <div
              className="
                flex items-center gap-3
                rounded-2xl
                border
                border-[#DCE8EC]
                bg-white
                px-4 py-3
                shadow-sm
                transition-colors
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-none
              "
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F8] text-[#126782] dark:bg-[#123B49] dark:text-[#45C6DB]">
                <DocumentIcon />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8AA2AD] dark:text-[#6F929E]">
                  Indexed chunks
                </p>

                <p className="mt-0.5 text-lg font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                  {documentCount}
                </p>
              </div>
            </div>
          </div>

          {/* Upload section */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

            {/* Upload card */}
            <section
              className="
                rounded-3xl
                border
                border-[#DCE8EC]
                bg-white
                p-5
                shadow-[0_8px_30px_rgba(16,42,67,0.05)]
                transition-colors
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-none
                sm:p-7
              "
            >
              <div>
                <h2 className="text-base font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                  Upload a medical report
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                  Your original PDF is stored locally while
                  the document is processed and indexed for
                  AI retrieval.
                </p>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
                  dragActive
                    ? "border-[#36B9D0] bg-[#F0FBFD] dark:border-[#36B9D0] dark:bg-[#10343E]"
                    : "border-[#CFE1E6] bg-[#F8FBFC] dark:border-[#28515D] dark:bg-[#0A1B23]"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6F8] text-[#126782] dark:bg-[#123B49] dark:text-[#45C6DB]">
                  <UploadIcon />
                </div>

                <h3 className="mt-5 text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                  {selectedFile
                    ? selectedFile.name
                    : "Drop your PDF here"}
                </h3>

                <p className="mt-2 text-xs text-[#8AA2AD] dark:text-[#6F929E]">
                  {selectedFile
                    ? formatFileSize(selectedFile.size)
                    : "or choose a file from your computer"}
                </p>

                <label className="mt-5 inline-flex cursor-pointer items-center rounded-xl bg-[#126782] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0F5870]">
                  {selectedFile
                    ? "Choose another PDF"
                    : "Choose PDF"}

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-4 text-[10px] text-[#9AAEB6] dark:text-[#607D88]">
                  PDF only
                </p>
              </div>

              {/* Selected file */}
              {selectedFile && (
                <div
                  className="
                    mt-4 flex items-center gap-3
                    rounded-2xl
                    border
                    border-[#DCE8EC]
                    bg-[#F8FBFC]
                    p-3
                    dark:border-[#1C3A45]
                    dark:bg-[#0A1B23]
                  "
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#126782] shadow-sm dark:bg-[#12313B] dark:text-[#45C6DB] dark:shadow-none">
                    <FileIcon />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                      {selectedFile.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#8AA2AD] dark:text-[#6F929E]">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="
                      rounded-lg
                      px-2 py-1
                      text-xs
                      text-[#8AA2AD]
                      transition
                      hover:bg-white
                      hover:text-[#102A43]
                      dark:hover:bg-[#16313B]
                      dark:hover:text-[#E8F4F7]
                    "
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload button */}
              <button
                type="button"
                onClick={uploadDocument}
                disabled={!selectedFile || uploading}
                className="
                  mt-5 flex w-full items-center justify-center gap-2
                  rounded-xl
                  bg-[#163F51]
                  px-5 py-3
                  text-xs font-semibold text-white
                  transition
                  hover:bg-[#123443]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:bg-[#16495A]
                  dark:hover:bg-[#1A586A]
                "
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Indexing document...
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    Upload and index document
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-2xl border border-[#F1C7C7] bg-[#FFF5F5] px-4 py-3 text-xs leading-5 text-[#B54747] dark:border-[#633838] dark:bg-[#281719] dark:text-[#F08A8A]">
                  {error}
                </div>
              )}

              {/* Success */}
              {result && (
                <div className="mt-4 rounded-2xl border border-[#BFE5D5] bg-[#F2FBF7] p-4 dark:border-[#285B49] dark:bg-[#102B25]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DDF5EA] text-[#16825F] dark:bg-[#164A3A] dark:text-[#4BD39E]">
                      <CheckIcon />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#176B50] dark:text-[#4BD39E]">
                        Document indexed successfully
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-[#4D7C6B] dark:text-[#8BC7B1]">
                        {result.filename} is now stored and
                        available to MedSearch AI.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#397286] dark:bg-[#163C34] dark:text-[#9BD7C3]">
                          {result.characters_extracted ?? 0} characters
                        </span>

                        <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#397286] dark:bg-[#163C34] dark:text-[#9BD7C3]">
                          {result.chunks_created ?? 0} chunks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* How it works */}
            <section
              className="
                rounded-3xl
                border
                border-[#DCE8EC]
                bg-white
                p-5
                shadow-[0_8px_30px_rgba(16,42,67,0.05)]
                transition-colors
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-none
                sm:p-7
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F8] text-[#126782] dark:bg-[#123B49] dark:text-[#45C6DB]">
                  <SparkIcon />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    How indexing works
                  </h2>

                  <p className="mt-0.5 text-[10px] text-[#8AA2AD] dark:text-[#6F929E]">
                    Your document stays in the local RAG pipeline.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <PipelineStep
                  number="01"
                  title="Extract"
                  description="Text is extracted from each PDF page."
                />

                <PipelineStep
                  number="02"
                  title="Chunk"
                  description="Long documents are divided into searchable evidence blocks."
                />

                <PipelineStep
                  number="03"
                  title="Embed"
                  description="Each chunk is converted into a semantic vector."
                />

                <PipelineStep
                  number="04"
                  title="Index"
                  description="Embeddings and source text are stored in ChromaDB."
                />

                <PipelineStep
                  number="05"
                  title="Retrieve"
                  description="MedSearch AI retrieves relevant evidence when you ask a question."
                />
              </div>

              <div className="mt-7 rounded-2xl border border-[#DCE8EC] bg-[#F7FAFB] p-4 dark:border-[#1C3A45] dark:bg-[#0A1B23]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#20A779]" />

                  <span className="text-xs font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    RAG system
                  </span>

                  <span className="ml-auto text-[10px] font-medium text-[#20A779] dark:text-[#4BD39E]">
                    {stats?.rag_ready ? "Ready" : "Waiting"}
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                  Answers are generated using retrieved document
                  evidence rather than relying only on model memory.
                </p>
              </div>
            </section>
          </div>

          {/* Personal Medical Library */}
          <section
            className="
              mt-6 rounded-3xl
              border border-[#DCE8EC]
              bg-white
              p-5
              shadow-[0_8px_30px_rgba(16,42,67,0.05)]
              transition-colors
              dark:border-[#1C3A45]
              dark:bg-[#0D2029]
              dark:shadow-none
              sm:p-7
            "
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF6F8] text-[#126782] dark:bg-[#123B49] dark:text-[#45C6DB]">
                    <LibraryIcon />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                      Personal Medical Library
                    </h2>

                    <p className="mt-0.5 text-[10px] text-[#8AA2AD] dark:text-[#6F929E]">
                      Your previously uploaded medical reports
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadDocuments}
                disabled={loadingDocuments}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  border border-[#DCE8EC]
                  bg-white
                  px-3.5 py-2
                  text-[10px] font-semibold
                  text-[#397286]
                  transition
                  hover:bg-[#F7FAFB]
                  disabled:opacity-50
                  dark:border-[#28515D]
                  dark:bg-[#102C35]
                  dark:text-[#8BC7D2]
                  dark:hover:bg-[#153741]
                "
              >
                <RefreshIcon />
                Refresh
              </button>
            </div>

            {/* Loading */}
            {loadingDocuments && (
              <div className="mt-6 flex items-center justify-center rounded-2xl border border-[#DCE8EC] bg-[#F8FBFC] py-10 dark:border-[#1C3A45] dark:bg-[#0A1B23]">
                <div className="flex items-center gap-3 text-xs text-[#627D98] dark:text-[#8AA2AD]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#DCE8EC] border-t-[#36B9D0] dark:border-[#28515D] dark:border-t-[#36B9D0]" />
                  Loading your documents...
                </div>
              </div>
            )}

            {/* Error */}
            {!loadingDocuments && documentError && (
              <div className="mt-6 rounded-2xl border border-[#F1C7C7] bg-[#FFF5F5] px-4 py-3 text-xs leading-5 text-[#B54747] dark:border-[#633838] dark:bg-[#281719] dark:text-[#F08A8A]">
                {documentError}
              </div>
            )}

            {/* Empty state */}
            {!loadingDocuments &&
              !documentError &&
              documents.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-[#CFE1E6] bg-[#F8FBFC] px-5 py-12 text-center dark:border-[#28515D] dark:bg-[#0A1B23]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#8AA2AD] shadow-sm dark:bg-[#12313B] dark:text-[#6F929E] dark:shadow-none">
                    <DocumentIcon />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                    No medical documents yet
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-[#8AA2AD] dark:text-[#6F929E]">
                    Upload your first medical PDF above.
                    It will remain available here after indexing.
                  </p>
                </div>
              )}

            {/* Documents */}
            {!loadingDocuments &&
              !documentError &&
              documents.length > 0 && (
                <div className="mt-6 grid gap-3">
                  {documents.map((document) => (
                    <div
                      key={document.filename}
                      className="
                        group flex flex-col gap-4
                        rounded-2xl
                        border
                        border-[#DCE8EC]
                        bg-[#F8FBFC]
                        p-4
                        transition
                        hover:border-[#BBDDE5]
                        hover:bg-white
                        dark:border-[#1C3A45]
                        dark:bg-[#0A1B23]
                        dark:hover:border-[#285E6A]
                        dark:hover:bg-[#102C35]
                        sm:flex-row
                        sm:items-center
                      "
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#126782] shadow-sm dark:bg-[#12313B] dark:text-[#45C6DB] dark:shadow-none">
                          <FileIcon />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                            {document.filename}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-[#8AA2AD] dark:text-[#6F929E]">
                              PDF document
                            </span>

                            <span className="h-1 w-1 rounded-full bg-[#B7C8CE] dark:bg-[#41606A]" />

                            <span className="text-[10px] text-[#8AA2AD] dark:text-[#6F929E]">
                              {formatFileSize(document.size)}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-[#B7C8CE] dark:bg-[#41606A]" />

                            <span className="text-[10px] font-medium text-[#20A779] dark:text-[#4BD39E]">
                              Stored locally
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openDocument(document.filename)
                          }
                          className="
                            inline-flex flex-1 items-center justify-center gap-2
                            rounded-xl
                            bg-[#126782]
                            px-4 py-2.5
                            text-[10px] font-semibold text-white
                            transition
                            hover:bg-[#0F5870]
                            dark:bg-[#16566A]
                            dark:hover:bg-[#1A687E]
                            sm:flex-none
                          "
                        >
                          <EyeIcon />
                          Open PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* Safety note */}
          <div className="mt-6 rounded-2xl border border-[#DCE8EC] bg-white px-5 py-4 transition-colors dark:border-[#1C3A45] dark:bg-[#0D2029]">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F7F9] text-[#397286] dark:bg-[#12313B] dark:text-[#8BC7D2]">
                <InfoIcon />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                  Document privacy and medical safety
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#627D98] dark:text-[#8AA2AD]">
                  This prototype is designed for document retrieval
                  and software testing. Do not upload sensitive
                  patient information unless your deployment has the
                  appropriate privacy and security controls.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#DCE8EC] bg-[#F7FAFB] text-[9px] font-bold text-[#397286] dark:border-[#28515D] dark:bg-[#102C35] dark:text-[#8BC7D2]">
        {number}
      </div>

      <div>
        <p className="text-xs font-semibold text-[#102A43] dark:text-[#E8F4F7]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#627D98] dark:text-[#8AA2AD]">
          {description}
        </p>
      </div>
    </div>
  );
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

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
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
      strokeWidth="1.8"
    >
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8" />
      <path d="m15.6 15.6 2.8 2.8" />
      <path d="m18.4 5.6-2.8 2.8" />
      <path d="m8.4 15.6-2.8 2.8" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M7 4v14" />
      <path d="M9.5 8h5" />
      <path d="M9.5 12h5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 11a8 8 0 0 0-14.8-4" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.8 4" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}