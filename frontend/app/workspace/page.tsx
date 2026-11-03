"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import AppShell from "../../components/AppShell";

const API_URL = "http://127.0.0.1:8000";

type ContextType =
  | "medical_knowledge"
  | "user_document"
  | "combined"
  | null;

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  contextType?: ContextType;
};

const suggestedQuestions = [
  "What is a CBC?",
  "Do I need to fast before a blood test?",
  "What does creatinine mean?",
  "What is HbA1c?",
  "What is my fasting glucose?",
  "What are the laboratory values in my report?",
];

export default function WorkspacePage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =========================================================
  // ASK AI
  // =========================================================

  async function handleAsk(
    event?: FormEvent<HTMLFormElement>,
    customQuestion?: string
  ) {
    event?.preventDefault();

    const currentQuestion = (
      customQuestion ?? question
    ).trim();

    if (!currentQuestion || loading) {
      return;
    }

    setQuestion("");
    setError("");

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: currentQuestion,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/v1/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned status ${response.status}`
        );
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.answer ||
          "The system did not return an answer.",
        sources: Array.isArray(data.sources)
          ? data.sources
          : [],
        contextType:
          data.context_type || null,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch {
      setError(
        "Unable to connect to MedSearch AI. Make sure the FastAPI backend and Ollama are running."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // SUGGESTED QUESTION
  // =========================================================

  function handleSuggestedQuestion(
    suggestedQuestion: string
  ) {
    handleAsk(
      undefined,
      suggestedQuestion
    );
  }

  // =========================================================
  // NEW CHAT
  // =========================================================

  function startNewChat() {
    setMessages([]);
    setQuestion("");
    setError("");
  }

  const hasMessages =
    messages.length > 0;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell>
      <div
        className="
          flex
          min-h-[calc(100vh-76px)]
          flex-col
          bg-[#F7FAFB]
          transition-colors
          duration-500
          dark:bg-[#07151C]
        "
      >

        {/* ===================================================
            WORKSPACE HEADER
        =================================================== */}

        <div
          className="
            border-b
            border-[#DCE8EC]
            bg-white
            px-6
            py-5
            transition-colors
            duration-500
            sm:px-8
            dark:border-[#1C3A45]
            dark:bg-[#091A22]
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1180px]
              items-center
              justify-between
              gap-4
            "
          >

            {/* HEADER TEXT */}

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
                    shadow-[0_0_7px_rgba(32,167,121,0.35)]
                  "
                />

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-[#8AA2AD]
                    dark:text-[#62808B]
                  "
                >
                  Medical intelligence
                </span>
              </div>

              <h2
                className="
                  mt-2
                  text-xl
                  font-semibold
                  tracking-tight
                  text-[#102A43]
                  transition-colors
                  duration-500
                  dark:text-[#E8F4F7]
                "
              >
                Ask MedSearch AI
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-[#627D98]
                  dark:text-[#8AA2AD]
                "
              >
                Ask medical questions or
                explore information from
                your uploaded reports.
              </p>
            </div>

            {/* NEW CHAT */}

            <button
              type="button"
              onClick={startNewChat}
              className="
                rounded-xl
                border
                border-[#DCE8EC]
                bg-white
                px-4
                py-2.5
                text-xs
                font-semibold
                text-[#627D98]
                transition-all
                duration-300
                hover:border-[#B9D9E1]
                hover:bg-[#F7FAFB]
                hover:text-[#126782]
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:text-[#8AA2AD]
                dark:hover:border-[#36B9D0]/40
                dark:hover:bg-[#102A32]
                dark:hover:text-[#36B9D0]
              "
            >
              + New chat
            </button>

          </div>
        </div>

        {/* ===================================================
            CHAT AREA
        =================================================== */}

        <div
          className="
            flex-1
            px-4
            py-6
            sm:px-8
          "
        >
          <div
            className="
              mx-auto
              flex
              min-h-full
              max-w-[1180px]
              flex-col
            "
          >

            {!hasMessages ? (
              <EmptyState
                onSuggestedQuestion={
                  handleSuggestedQuestion
                }
              />
            ) : (
              <div
                className="
                  space-y-6
                  pb-8
                "
              >

                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}

                {loading && (
                  <ThinkingMessage />
                )}

                {error && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-red-200
                      bg-red-50
                      p-4
                      text-sm
                      text-red-700
                      dark:border-[#63343A]
                      dark:bg-[#29181C]
                      dark:text-[#FF8D8D]
                    "
                  >
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />

              </div>
            )}

          </div>
        </div>

        {/* ===================================================
            COMPOSER
        =================================================== */}

        <div
          className="
            sticky
            bottom-0
            border-t
            border-[#DCE8EC]
            bg-white/95
            px-4
            py-5
            backdrop-blur
            transition-colors
            duration-500
            sm:px-8
            dark:border-[#1C3A45]
            dark:bg-[#091A22]/95
          "
        >
          <div
            className="
              mx-auto
              max-w-[1180px]
            "
          >

            <form
              onSubmit={handleAsk}
              className="
                relative
                rounded-2xl
                border
                border-[#DCE8EC]
                bg-white
                shadow-[0_10px_40px_rgba(15,23,42,0.08)]
                transition-all
                duration-300
                focus-within:border-[#9FCBD5]
                focus-within:shadow-[0_10px_45px_rgba(43,113,135,0.12)]
                dark:border-[#1C3A45]
                dark:bg-[#0D2029]
                dark:shadow-[0_15px_40px_rgba(0,0,0,0.28)]
                dark:focus-within:border-[#36B9D0]/50
                dark:focus-within:shadow-[0_10px_45px_rgba(54,185,208,0.08)]
              "
            >

              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    if (
                      question.trim() &&
                      !loading
                    ) {
                      handleAsk();
                    }
                  }
                }}
                placeholder="Ask a medical question..."
                rows={3}
                disabled={loading}
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  bg-transparent
                  px-5
                  pb-14
                  pt-4
                  text-sm
                  text-[#102A43]
                  outline-none
                  placeholder:text-[#8AA2AD]
                  disabled:opacity-60
                  dark:text-[#E8F4F7]
                  dark:placeholder:text-[#62808B]
                "
              />

              <div
                className="
                  absolute
                  bottom-3
                  left-4
                  right-4
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <span
                    className="
                      rounded-lg
                      bg-[#F1F7F8]
                      px-2.5
                      py-1.5
                      text-[10px]
                      font-medium
                      text-[#397286]
                      dark:bg-[#12313C]
                      dark:text-[#36B9D0]
                    "
                  >
                    RAG enabled
                  </span>

                  <span
                    className="
                      hidden
                      text-[10px]
                      text-[#8AA2AD]
                      sm:block
                      dark:text-[#62808B]
                    "
                  >
                    Enter to send · Shift +
                    Enter for new line
                  </span>

                </div>

                <button
                  type="submit"
                  disabled={
                    !question.trim() ||
                    loading
                  }
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#163F51]
                    text-white
                    transition-all
                    duration-300
                    hover:bg-[#123443]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    dark:bg-[#126782]
                    dark:shadow-[0_0_15px_rgba(54,185,208,0.10)]
                    dark:hover:bg-[#16819F]
                  "
                  aria-label="Send question"
                >

                  {loading ? (
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />
                  ) : (
                    <span className="text-sm">
                      ↑
                    </span>
                  )}

                </button>

              </div>

            </form>

            <p
              className="
                mt-3
                text-center
                text-[10px]
                text-[#8AA2AD]
                dark:text-[#62808B]
              "
            >
              MedSearch AI provides
              evidence-grounded medical
              information and is not a
              substitute for professional
              medical advice.
            </p>

          </div>
        </div>

      </div>
    </AppShell>
  );
}


/* ===============================================================
   EMPTY STATE
   =============================================================== */

function EmptyState({
  onSuggestedQuestion,
}: {
  onSuggestedQuestion: (
    question: string
  ) => void;
}) {
  return (
    <div
      className="
        flex
        flex-1
        flex-col
        items-center
        justify-center
        py-12
      "
    >

      {/* AI ICON */}

      <div
        className="
          relative
          flex
          h-20
          w-20
          items-center
          justify-center
        "
      >

        <div
          className="
            absolute
            inset-0
            rounded-[24px]
            bg-[#DFF1F5]
            blur-xl
            dark:bg-[#36B9D0]/10
          "
        />

        <div
          className="
            relative
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-[22px]
            border
            border-[#CFE4E9]
            bg-white
            shadow-[0_12px_35px_rgba(43,113,135,0.12)]
            transition-all
            duration-500
            dark:border-[#27515D]
            dark:bg-[#0D2029]
            dark:shadow-[0_0_30px_rgba(54,185,208,0.08)]
          "
        >

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-[#163F51]
              text-xl
              font-light
              text-white
              dark:bg-[#126782]
              dark:text-[#E8F4F7]
            "
          >
            +
          </div>

        </div>

      </div>

      <p
        className="
          mt-7
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.2em]
          text-[#397286]
          dark:text-[#36B9D0]
        "
      >
        Evidence-based medical AI
      </p>

      <h3
        className="
          mt-3
          text-center
          text-3xl
          font-semibold
          tracking-tight
          text-[#102A43]
          dark:text-[#E8F4F7]
        "
      >
        How can I help you?
      </h3>

      <p
        className="
          mt-3
          max-w-lg
          text-center
          text-sm
          leading-6
          text-[#627D98]
          dark:text-[#8AA2AD]
        "
      >
        Ask general medical questions or
        ask about information contained in
        your uploaded reports. MedSearch AI
        retrieves relevant evidence before
        generating an answer.
      </p>

      {/* SUGGESTIONS */}

      <div
        className="
          mt-9
          grid
          w-full
          max-w-3xl
          gap-3
          sm:grid-cols-2
        "
      >

        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() =>
              onSuggestedQuestion(item)
            }
            className="
              group
              rounded-2xl
              border
              border-[#DCE8EC]
              bg-white
              p-4
              text-left
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-[#B9D9E1]
              hover:shadow-md
              dark:border-[#1C3A45]
              dark:bg-[#0D2029]
              dark:hover:border-[#36B9D0]/35
              dark:hover:bg-[#102A32]
              dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <span
                className="
                  text-sm
                  leading-5
                  text-[#627D98]
                  transition-colors
                  group-hover:text-[#102A43]
                  dark:text-[#8AA2AD]
                  dark:group-hover:text-[#E8F4F7]
                "
              >
                {item}
              </span>

              <span
                className="
                  text-sm
                  text-[#B7C9CF]
                  transition-all
                  duration-300
                  group-hover:translate-x-0.5
                  group-hover:text-[#397286]
                  dark:text-[#46636D]
                  dark:group-hover:text-[#36B9D0]
                "
              >
                →
              </span>

            </div>

          </button>
        ))}

      </div>

    </div>
  );
}


/* ===============================================================
   CHAT MESSAGE
   =============================================================== */

function ChatMessage({
  message,
}: {
  message: Message;
}) {
  const isUser =
    message.role === "user";

  return (
    <div
      className={`flex gap-3 ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >

      {/* AI ICON */}

      {!isUser && (
        <div
          className="
            mt-1
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#163F51]
            text-sm
            font-medium
            text-white
            shadow-sm
            dark:bg-[#126782]
            dark:shadow-[0_0_14px_rgba(54,185,208,0.10)]
          "
        >
          +
        </div>
      )}

      <div
        className={`max-w-[820px] ${
          isUser
            ? "items-end"
            : "items-start"
        }`}
      >

        {/* ANSWER */}

        <div
          className={`
            rounded-2xl
            px-5
            py-4
            text-sm
            leading-7
            transition-colors
            duration-500
            ${
              isUser
                ? `
                  rounded-br-md
                  bg-[#163F51]
                  text-white
                  dark:bg-[#126782]
                  dark:shadow-[0_8px_22px_rgba(0,0,0,0.18)]
                `
                : `
                  rounded-bl-md
                  border
                  border-[#DCE8EC]
                  bg-white
                  text-[#627D98]
                  shadow-sm
                  dark:border-[#1C3A45]
                  dark:bg-[#0D2029]
                  dark:text-[#B8CBD1]
                  dark:shadow-[0_10px_25px_rgba(0,0,0,0.18)]
                `
            }
          `}
        >
          {message.content}
        </div>

        {/* SUPPORTING EVIDENCE */}

        {!isUser &&
          message.sources &&
          message.sources.length > 0 && (
            <Sources
              sources={message.sources}
              contextType={
                message.contextType
              }
            />
          )}

      </div>

      {/* USER ICON */}

      {isUser && (
        <div
          className="
            mt-1
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#E4EEF1]
            text-xs
            font-bold
            text-[#163F51]
            dark:bg-[#12313C]
            dark:text-[#36B9D0]
          "
        >
          HS
        </div>
      )}

    </div>
  );
}


/* ===============================================================
   SUPPORTING EVIDENCE — CLICK / FOLD DOWN
   =============================================================== */

function Sources({
  sources,
  contextType,
}: {
  sources: string[];
  contextType?: ContextType;
}) {
  const [expanded, setExpanded] =
    useState(false);

  const isUserDocument =
    contextType === "user_document";

  const description = isUserDocument
    ? "Evidence retrieved from your uploaded report"
    : "Evidence retrieved from the medical knowledge base";

  return (
    <div className="mt-3">

      {/* =====================================================
          SUPPORTING EVIDENCE BUTTON
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
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-[#DCE8EC]
          bg-white
          px-3
          py-2
          text-[11px]
          font-semibold
          text-[#397286]
          shadow-sm
          transition-all
          duration-200
          hover:border-[#B9D9E1]
          hover:bg-[#F7FAFB]
          dark:border-[#1C3A45]
          dark:bg-[#0D2029]
          dark:text-[#36B9D0]
          dark:hover:border-[#36B9D0]/40
          dark:hover:bg-[#102A32]
        "
      >

        {/* CHECK ICON */}

        <span
          className="
            flex
            h-5
            w-5
            items-center
            justify-center
            rounded-md
            bg-[#EAF3F6]
            text-[10px]
            font-semibold
            text-[#397286]
            dark:bg-[#12313C]
            dark:text-[#36B9D0]
          "
        >
          ✓
        </span>

        {/* TITLE */}

        <span>
          Supporting Evidence
        </span>

        {/* SOURCE COUNT */}

        <span
          className="
            rounded-md
            bg-[#F1F7F8]
            px-1.5
            py-0.5
            text-[9px]
            font-semibold
            text-[#627D98]
            dark:bg-[#12313C]
            dark:text-[#36B9D0]
          "
        >
          {sources.length}
        </span>

        {/* CHEVRON */}

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="
            transition-transform
            duration-200
          "
          style={{
            transform: expanded
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>

      </button>

      {/* =====================================================
          FOLD-DOWN EVIDENCE
          ONLY RENDERED AFTER CLICK
      ===================================================== */}

      {expanded && (
        <div
          className="
            mt-2
            overflow-hidden
            rounded-xl
            border
            border-[#DCE8EC]
            bg-white
            shadow-sm
            dark:border-[#1C3A45]
            dark:bg-[#0D2029]
          "
        >

          {/* DESCRIPTION */}

          <div
            className="
              border-b
              border-[#E8F0F2]
              px-4
              py-3
              dark:border-[#1C3A45]
            "
          >
            <p
              className="
                text-[10px]
                font-medium
                text-[#8AA2AD]
                dark:text-[#62808B]
              "
            >
              {description}
            </p>
          </div>

          {/* EVIDENCE LIST */}

          <div
            className="
              space-y-2
              p-3
            "
          >

            {sources.map(
              (source, index) => (
                <div
                  key={`${source}-${index}`}
                  className="
                    rounded-lg
                    bg-[#F7FAFB]
                    px-3
                    py-2.5
                    text-xs
                    leading-5
                    text-[#627D98]
                    dark:bg-[#0A1B23]
                    dark:text-[#8AA2AD]
                  "
                >

                  <span
                    className="
                      mr-2
                      font-semibold
                      text-[#397286]
                      dark:text-[#36B9D0]
                    "
                  >
                    {index + 1}.
                  </span>

                  {source}

                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}


/* ===============================================================
   THINKING MESSAGE
   =============================================================== */

function ThinkingMessage() {
  return (
    <div className="flex gap-3">

      {/* AI ICON */}

      <div
        className="
          mt-1
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[#163F51]
          text-sm
          font-medium
          text-white
          dark:bg-[#126782]
          dark:shadow-[0_0_14px_rgba(54,185,208,0.10)]
        "
      >
        +
      </div>

      {/* THINKING */}

      <div
        className="
          rounded-2xl
          rounded-bl-md
          border
          border-[#DCE8EC]
          bg-white
          px-5
          py-4
          shadow-sm
          transition-colors
          duration-500
          dark:border-[#1C3A45]
          dark:bg-[#0D2029]
          dark:shadow-[0_10px_25px_rgba(0,0,0,0.18)]
        "
      >

        <div
          className="
            flex
            items-center
            gap-1.5
          "
        >

          <span
            className="
              h-2
              w-2
              animate-pulse
              rounded-full
              bg-[#397286]
              dark:bg-[#36B9D0]
            "
          />

          <span
            className="
              h-2
              w-2
              animate-pulse
              rounded-full
              bg-[#397286]
              dark:bg-[#36B9D0]
            "
            style={{
              animationDelay: "150ms",
            }}
          />

          <span
            className="
              h-2
              w-2
              animate-pulse
              rounded-full
              bg-[#397286]
              dark:bg-[#36B9D0]
            "
            style={{
              animationDelay: "300ms",
            }}
          />

          <span
            className="
              ml-2
              text-xs
              text-[#8AA2AD]
              dark:text-[#6F919D]
            "
          >
            Searching medical evidence...
          </span>

        </div>

      </div>

    </div>
  );
}