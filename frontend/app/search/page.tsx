"use client";

import { FormEvent, useState } from "react";
import AppShell from "../../components/AppShell";

const API_URL = "http://127.0.0.1:8000";

type SearchResult = {
  question: string;
  answer: string;
  sources: string[];
};

export default function MedicalSearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] =
    useState<SearchResult | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function searchMedicalKnowledge(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const question = query.trim();

    if (!question || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_URL}/v1/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Medical search failed."
        );
      }

      setResult({
        question:
          data.question ?? question,
        answer:
          data.answer ||
          "No answer was generated from the available evidence.",
        sources:
          Array.isArray(data.sources)
            ? data.sources
            : [],
      });
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Unable to complete the medical search."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExample(
    question: string
  ) {
    setQuery(question);
  }

  function clearSearch() {
    setQuery("");
    setResult(null);
    setError("");
  }

  return (
    <AppShell>
      <div
        className="
          min-h-[calc(100vh-72px)]
          bg-[#F3F8FA]
          px-4
          py-6
          text-[#102A43]
          transition-colors
          duration-500
          dark:bg-[#07151C]
          dark:text-[#E8F4F7]
          sm:px-8
        "
      >

        <div className="mx-auto max-w-[1120px]">

          {/* =================================================
              HEADER
          ================================================= */}

          <div>

            <div
              className="
                flex
                items-center
                gap-2
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

              <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-[#8AA2AD]
                  dark:text-[#6F929E]
                "
              >
                Medical knowledge retrieval
              </span>

            </div>

            <h1
              className="
                mt-2
                text-2xl
                font-semibold
                tracking-tight
                text-[#102A43]
                dark:text-[#E8F4F7]
              "
            >
              Medical Search
            </h1>

            <p
              className="
                mt-1
                max-w-2xl
                text-sm
                leading-6
                text-[#627D98]
                dark:text-[#8AA2AD]
              "
            >
              Search your indexed medical
              knowledge base using natural
              language and retrieve relevant
              evidence.
            </p>

          </div>


          {/* =================================================
              SEARCH AREA
          ================================================= */}

          <section
            className="
              mt-8
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

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EAF6F8]
                  text-[#126782]
                  dark:bg-[#123B49]
                  dark:text-[#45C6DB]
                "
              >
                <SearchIcon />
              </div>

              <div>

                <h2
                  className="
                    text-base
                    font-semibold
                    text-[#102A43]
                    dark:text-[#E8F4F7]
                  "
                >
                  Search medical knowledge
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-[#8AA2AD]
                    dark:text-[#6F929E]
                  "
                >
                  Ask a question about your
                  indexed medical documents.
                </p>

              </div>

            </div>


            {/* =================================================
                SEARCH FORM
            ================================================= */}

            <form
              onSubmit={
                searchMedicalKnowledge
              }
              className="mt-6"
            >

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  rounded-2xl
                  border
                  border-[#CFE1E6]
                  bg-[#F8FBFC]
                  p-2
                  transition
                  focus-within:border-[#36B9D0]
                  focus-within:ring-4
                  focus-within:ring-[#36B9D0]/10
                  dark:border-[#28515D]
                  dark:bg-[#0A1B23]
                  dark:focus-within:border-[#36B9D0]
                "
              >

                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >

                  <div
                    className="
                      mt-2
                      ml-2
                      text-[#8AA2AD]
                      dark:text-[#6F929E]
                    "
                  >
                    <SearchIcon />
                  </div>

                  <textarea
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    placeholder="Ask something about your medical documents..."
                    rows={3}
                    className="
                      min-h-[76px]
                      flex-1
                      resize-none
                      bg-transparent
                      px-1
                      py-2
                      text-sm
                      leading-6
                      text-[#102A43]
                      outline-none
                      placeholder:text-[#9AAEB6]
                      dark:text-[#E8F4F7]
                      dark:placeholder:text-[#607D88]
                    "
                  />

                </div>


                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    border-t
                    border-[#DCE8EC]
                    px-2
                    pt-2
                    dark:border-[#1C3A45]
                  "
                >

                  <span
                    className="
                      hidden
                      text-[10px]
                      text-[#8AA2AD]
                      dark:text-[#6F929E]
                      sm:block
                    "
                  >
                    Answers are generated from
                    retrieved evidence.
                  </span>

                  <button
                    type="submit"
                    disabled={
                      !query.trim() ||
                      loading
                    }
                    className="
                      ml-auto
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#126782]
                      px-5
                      py-2.5
                      text-xs
                      font-semibold
                      text-white
                      transition
                      hover:bg-[#0F5870]
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >

                    {loading ? (
                      <>
                        <span
                          className="
                            h-3.5
                            w-3.5
                            animate-spin
                            rounded-full
                            border-2
                            border-white/30
                            border-t-white
                          "
                        />

                        Searching...
                      </>
                    ) : (
                      <>
                        Search
                        <ArrowIcon />
                      </>
                    )}

                  </button>

                </div>

              </div>

            </form>


            {/* =================================================
                EXAMPLE SEARCHES
            ================================================= */}

            <div className="mt-5">

              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-[#8AA2AD]
                  dark:text-[#6F929E]
                "
              >
                Example searches
              </p>

              <div
                className="
                  mt-2
                  flex
                  flex-wrap
                  gap-2
                "
              >

                <ExampleButton
                  text="What is the fasting glucose level?"
                  onClick={() =>
                    handleExample(
                      "What is the fasting glucose level?"
                    )
                  }
                />

                <ExampleButton
                  text="What laboratory results are available?"
                  onClick={() =>
                    handleExample(
                      "What laboratory results are available?"
                    )
                  }
                />

                <ExampleButton
                  text="Summarize the important findings."
                  onClick={() =>
                    handleExample(
                      "Summarize the important findings."
                    )
                  }
                />

              </div>

            </div>

          </section>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-[#F1C7C7]
                bg-[#FFF5F5]
                px-5
                py-4
                text-xs
                leading-5
                text-[#B54747]
                dark:border-[#633838]
                dark:bg-[#281719]
                dark:text-[#F08A8A]
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >

                <div className="mt-0.5">
                  <InfoIcon />
                </div>

                <div>

                  <p className="font-semibold">
                    Search could not be completed
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              RESULTS
          ================================================= */}

          {result && !error && (
            <div
              className="
                mt-6
                space-y-6
              "
            >

              {/* =================================================
                  SEARCH QUERY
              ================================================= */}

              <div
                className="
                  flex
                  flex-col
                  justify-between
                  gap-3
                  rounded-2xl
                  border
                  border-[#DCE8EC]
                  bg-white
                  px-5
                  py-4
                  dark:border-[#1C3A45]
                  dark:bg-[#0D2029]
                  sm:flex-row
                  sm:items-center
                "
              >

                <div className="min-w-0">

                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-[#8AA2AD]
                      dark:text-[#6F929E]
                    "
                  >
                    Search query
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      leading-6
                      text-[#36566A]
                      dark:text-[#C8DCE2]
                    "
                  >
                    {result.question}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="
                    shrink-0
                    rounded-xl
                    border
                    border-[#DCE8EC]
                    bg-white
                    px-3
                    py-2
                    text-[10px]
                    font-semibold
                    text-[#627D98]
                    transition
                    hover:bg-[#F7FAFB]
                    dark:border-[#28515D]
                    dark:bg-[#102C35]
                    dark:text-[#8BC7D2]
                    dark:hover:bg-[#153741]
                  "
                >
                  New search
                </button>

              </div>


              {/* =================================================
                  AI ANSWER
              ================================================= */}

              <section
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-[#A9DDE6]
                  bg-gradient-to-br
                  from-[#E8F8FA]
                  via-[#F5FCFD]
                  to-white
                  shadow-[0_12px_38px_rgba(54,185,208,0.10)]
                  dark:border-[#245C68]
                  dark:from-[#103944]
                  dark:via-[#0D2D36]
                  dark:to-[#0D2029]
                  dark:shadow-none
                "
              >

                <div
                  className="
                    h-[3px]
                    bg-[#36B9D0]
                  "
                />

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    border-b
                    border-[#C7E8EE]
                    px-5
                    py-5
                    dark:border-[#245664]
                    sm:px-6
                  "
                >

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      text-[#126782]
                      shadow-sm
                      dark:bg-[#16434D]
                      dark:text-[#45C6DB]
                    "
                  >
                    <SparkIcon />
                  </div>

                  <div>

                    <p
                      className="
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.18em]
                        text-[#269BB0]
                        dark:text-[#45C6DB]
                      "
                    >
                      RAG generated
                    </p>

                    <h2
                      className="
                        mt-0.5
                        text-base
                        font-bold
                        text-[#102A43]
                        dark:text-[#E8F4F7]
                      "
                    >
                      Medical Answer
                    </h2>

                  </div>

                </div>

                <div
                  className="
                    px-5
                    py-6
                    sm:px-6
                    sm:py-7
                  "
                >

                  <p
                    className="
                      whitespace-pre-wrap
                      text-sm
                      leading-7
                      text-[#36566A]
                      dark:text-[#D3E4E9]
                    "
                  >
                    {result.answer}
                  </p>

                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    border-t
                    border-[#C7E8EE]
                    bg-[#F1FBFD]
                    px-5
                    py-4
                    dark:border-[#245664]
                    dark:bg-[#10343E]
                    sm:px-6
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

                  <span
                    className="
                      text-[10px]
                      font-semibold
                      text-[#397286]
                      dark:text-[#70CBD8]
                    "
                  >
                    Generated using retrieved
                    document evidence
                  </span>

                </div>

              </section>


              {/* =================================================
                  COLLAPSIBLE SUPPORTING EVIDENCE
              ================================================= */}

              <SupportingEvidence
                sources={result.sources}
              />


              {/* =================================================
                  SAFETY NOTE
              ================================================= */}

              <div
                className="
                  rounded-2xl
                  border
                  border-[#DCE8EC]
                  bg-white
                  px-5
                  py-4
                  dark:border-[#1C3A45]
                  dark:bg-[#0D2029]
                "
              >

                <div
                  className="
                    flex
                    items-start
                    gap-3
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
                      bg-[#F0F7F9]
                      text-[#397286]
                      dark:bg-[#12313B]
                      dark:text-[#8BC7D2]
                    "
                  >
                    <InfoIcon />
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        font-semibold
                        text-[#102A43]
                        dark:text-[#E8F4F7]
                      "
                    >
                      Medical information notice
                    </p>

                    <p
                      className="
                        mt-1
                        text-[11px]
                        leading-5
                        text-[#627D98]
                        dark:text-[#8AA2AD]
                      "
                    >
                      Search results are generated
                      from indexed document evidence
                      and are provided for informational
                      purposes. They do not replace
                      professional medical advice.
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              INITIAL STATE
          ================================================= */}

          {!result &&
            !error &&
            !loading && (
              <div className="mt-8">

                <div
                  className="
                    rounded-3xl
                    border
                    border-dashed
                    border-[#CFE1E6]
                    bg-white/70
                    px-6
                    py-14
                    text-center
                    dark:border-[#28515D]
                    dark:bg-[#0D2029]/70
                  "
                >

                  <div
                    className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#EAF6F8]
                      text-[#126782]
                      dark:bg-[#123B49]
                      dark:text-[#45C6DB]
                    "
                  >
                    <SearchIcon />
                  </div>

                  <h2
                    className="
                      mt-5
                      text-sm
                      font-semibold
                      text-[#102A43]
                      dark:text-[#E8F4F7]
                    "
                  >
                    Search your medical
                    knowledge base
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-md
                      text-[11px]
                      leading-5
                      text-[#8AA2AD]
                      dark:text-[#6F929E]
                    "
                  >
                    Ask a natural-language
                    question and MedSearch AI
                    will retrieve relevant
                    evidence from your indexed
                    documents.
                  </p>

                </div>

              </div>
            )}

        </div>
      </div>
    </AppShell>
  );
}


/* ===============================================================
   SUPPORTING EVIDENCE — COLLAPSIBLE
   =============================================================== */

function SupportingEvidence({
  sources,
}: {
  sources: string[];
}) {
  const [expanded, setExpanded] =
    useState(false);

  return (
    <section
      className="
        rounded-2xl
        border
        border-[#DCE8EC]
        bg-white
        transition-all
        duration-300
        dark:border-[#1C3A45]
        dark:bg-[#0D2029]
      "
    >

      {/* =====================================================
          BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (previous) => !previous
          )
        }
        aria-expanded={expanded}
        className="
          flex
          w-full
          items-center
          justify-between
          gap-4
          px-5
          py-4
          text-left
          transition
          hover:bg-[#F8FBFC]
          dark:hover:bg-[#102A32]
          sm:px-6
        "
      >

        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >

          {/* CHECK */}

          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#EAF3F6]
              text-[#397286]
              dark:bg-[#12313C]
              dark:text-[#36B9D0]
            "
          >
            <CheckIcon />
          </span>

          {/* TITLE */}

          <div className="min-w-0">

            <p
              className="
                text-xs
                font-semibold
                text-[#102A43]
                dark:text-[#E8F4F7]
              "
            >
              Supporting Evidence
            </p>

            <p
              className="
                mt-0.5
                text-[10px]
                text-[#8AA2AD]
                dark:text-[#6F929E]
              "
            >
              {sources.length}{" "}
              {sources.length === 1
                ? "source"
                : "sources"}
            </p>

          </div>

        </div>


        {/* CHEVRON */}

        <span
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-[#F1F7F8]
            text-[#397286]
            transition-all
            duration-300
            dark:bg-[#12313C]
            dark:text-[#36B9D0]
          "
        >

          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="
              transition-transform
              duration-300
            "
            style={{
              transform: expanded
                ? "rotate(180deg)"
                : "rotate(0deg)",
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>

        </span>

      </button>


      {/* =====================================================
          FOLD DOWN
      ===================================================== */}

      <div
        className={`
          grid
          transition-all
          duration-300
          ${
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }
        `}
      >

        <div
          className="
            min-h-0
            overflow-hidden
          "
        >

          <div
            className="
              border-t
              border-[#DCE8EC]
              px-5
              pb-5
              pt-4
              dark:border-[#1C3A45]
              sm:px-6
            "
          >

            {sources.length === 0 ? (
              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-[#CFE1E6]
                  bg-[#F8FBFC]
                  px-5
                  py-8
                  text-center
                  dark:border-[#28515D]
                  dark:bg-[#0A1B23]
                "
              >

                <p
                  className="
                    text-xs
                    text-[#8AA2AD]
                    dark:text-[#6F929E]
                  "
                >
                  No supporting passages
                  were returned.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {sources.map(
                  (source, index) => (
                    <div
                      key={`${index}-${source.slice(
                        0,
                        30
                      )}`}
                      className="
                        rounded-xl
                        border
                        border-[#DCE8EC]
                        bg-[#F8FBFC]
                        p-4
                        dark:border-[#1C3A45]
                        dark:bg-[#0A1B23]
                      "
                    >

                      <div
                        className="
                          flex
                          items-start
                          gap-3
                        "
                      >

                        {/* NUMBER */}

                        <div
                          className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-white
                            text-[9px]
                            font-bold
                            text-[#397286]
                            shadow-sm
                            dark:bg-[#12313B]
                            dark:text-[#8BC7D2]
                            dark:shadow-none
                          "
                        >
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        {/* PASSAGE */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >

                          <p
                            className="
                              mb-2
                              text-[9px]
                              font-bold
                              uppercase
                              tracking-[0.12em]
                              text-[#8AA2AD]
                              dark:text-[#6F929E]
                            "
                          >
                            Retrieved passage
                          </p>

                          <p
                            className="
                              whitespace-pre-wrap
                              text-[11px]
                              leading-6
                              text-[#526D7A]
                              dark:text-[#B8CDD3]
                            "
                          >
                            {source}
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}


/* ===============================================================
   EXAMPLE BUTTON
   =============================================================== */

function ExampleButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        rounded-xl
        border
        border-[#DCE8EC]
        bg-white
        px-3
        py-2
        text-left
        text-[10px]
        font-medium
        text-[#397286]
        transition
        hover:border-[#BBDDE5]
        hover:bg-[#F7FAFB]
        dark:border-[#28515D]
        dark:bg-[#102C35]
        dark:text-[#8BC7D2]
        dark:hover:border-[#367080]
        dark:hover:bg-[#153741]
      "
    >
      {text}
    </button>
  );
}


/* ===============================================================
   ICONS
   =============================================================== */

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 5 5" />
    </svg>
  );
}


function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
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


function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" />
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}