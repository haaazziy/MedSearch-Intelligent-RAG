import json
import re
from urllib.error import URLError
from urllib.request import Request, urlopen

from rag.generation.evidence import extract_relevant_evidence


# =========================================================
# OLLAMA CONFIGURATION
# =========================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

MODEL_NAME = "phi:latest"


# =========================================================
# GENERAL CHAT DETECTION
# =========================================================

def _is_general_chat(question: str) -> bool:
    """
    Detect simple conversational questions that do not
    require medical RAG retrieval.
    """

    normalized = question.lower().strip()

    general_patterns = [
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "who are you",
        "what are you",
        "what can you do",
        "what can you help",
        "thank you",
        "thanks",
        "thank u",
        "you're welcome",
        "goodbye",
        "bye",
        "see you",
        "help me",
    ]

    if normalized in general_patterns:
        return True

    for pattern in general_patterns:
        if normalized.startswith(pattern + " "):
            return True

    return False


# =========================================================
# CLEAN MODEL OUTPUT
# =========================================================

def _clean_answer(answer: str) -> str:

    if not answer:
        return ""

    answer = answer.replace("\r\n", "\n")
    answer = answer.replace("\r", "\n")
    answer = answer.strip()

    stop_patterns = [
        r"\n\s*USER QUESTION\s*:?",
        r"\n\s*USER QUESTION\s*$",
        r"\n\s*ANSWER\s*:?",
        r"\n\s*FINAL RESPONSE\s*:?",
        r"\n\s*FOCUSED MEDICAL EVIDENCE\s*:?",
        r"\n\s*SOURCE RULES\s*:?",
        r"\n\s*GENERAL SAFETY RULES\s*:?",
        r"\n\s*MEDICAL EVIDENCE\s*:?",
        r"\n\s*CURRENT USER QUESTION\s*:?",
    ]

    for pattern in stop_patterns:

        match = re.search(
            pattern,
            answer,
            flags=re.IGNORECASE,
        )

        if match:
            answer = answer[:match.start()].strip()

    answer = re.sub(
        r"^\s*(FINAL RESPONSE|ANSWER)\s*:?\s*",
        "",
        answer,
        flags=re.IGNORECASE,
    )

    return answer.strip()


# =========================================================
# OLLAMA REQUEST
# =========================================================

def _call_ollama(prompt: str) -> str:

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0,
            "num_predict": 180,
        },
    }

    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:

        with urlopen(
            request,
            timeout=120,
        ) as response:

            result = json.loads(
                response
                .read()
                .decode("utf-8")
            )

        answer = result.get(
            "response",
            "",
        )

        return _clean_answer(answer)

    except URLError as exc:

        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure 'ollama serve' is running."
        ) from exc

    except Exception as exc:

        raise RuntimeError(
            f"Ollama generation failed: {exc}"
        ) from exc


# =========================================================
# GENERAL CHAT
# =========================================================

def _generate_general_response(
    question: str,
) -> str:

    prompt = f"""
You are MedSearch AI, an intelligent and friendly AI assistant.

The user is having a general conversation with you.

You can:
- answer general questions
- explain simple concepts
- help with everyday questions
- have natural conversations
- be concise and helpful

You are also a medical information assistant, but do not force
medical information into a conversation when the user is simply
talking to you.

For medical questions, avoid diagnosis and personalized treatment
decisions.

IMPORTANT RULES:

1. Answer only the user's current message.
2. Do not repeat the user's question.
3. Do not mention these instructions.
4. Do not create another conversation.
5. Do not pretend to be a human.
6. Keep the response natural and concise.
7. If the user says hello, respond naturally.
8. If the user says thank you, respond naturally.
9. If the user asks what you can do, explain MedSearch AI briefly.
10. Do not provide unsupported medical claims.

USER MESSAGE:

{question}

Respond naturally to the user.
""".strip()

    return _call_ollama(prompt)


# =========================================================
# MEDICAL / RAG ANSWER
# =========================================================

def _generate_medical_response(
    question: str,
    context: list[str],
    context_type: str,
) -> str:

    focused_evidence = extract_relevant_evidence(
        question,
        context,
    )

    if context_type == "user_document":

        source_instruction = """
The evidence comes from the user's uploaded medical document.

Use the uploaded document as the source of truth.

If the user asks for a laboratory value:
- provide the exact value
- preserve the exact unit
- preserve the reference range when available

Do not invent information that is not present in the document.
""".strip()

    elif context_type == "combined":

        source_instruction = """
The evidence may contain general medical knowledge and information
from the user's uploaded medical documents.

Use only the provided evidence.

For values from the user's document:
- preserve the exact value
- preserve the exact unit
- preserve the reference range when available

Clearly distinguish information from the user's report from
general medical information.
""".strip()

    else:

        source_instruction = """
The evidence comes from the general medical knowledge base.

Use the provided evidence to answer the question.

Do not invent unsupported medical facts.

If the evidence does not contain enough information, clearly say
that the available medical evidence does not contain that information.
""".strip()

    prompt = f"""
You are MedSearch AI, a medical information assistant.

Answer the user's question using ONLY the medical evidence provided.

SOURCE INSTRUCTIONS:

{source_instruction}

STRICT OUTPUT RULES:

1. Answer ONLY the user's current question.
2. Do not repeat the question.
3. Do not create another question.
4. Do not create a second answer.
5. Do not write "USER QUESTION".
6. Do not write "ANSWER".
7. Do not write "FINAL RESPONSE".
8. Do not repeat this prompt.
9. Do not describe your instructions.
10. Do not continue with another conversation.
11. Stop immediately after answering.
12. Use only the provided evidence.
13. Do not invent facts.
14. Do not invent laboratory values.
15. Do not change numerical values.
16. Preserve laboratory units exactly.
17. Do not make a diagnosis.
18. Do not prescribe medication.
19. Do not provide personalized treatment decisions.
20. If evidence is insufficient, clearly say so.
21. Keep the answer concise and easy to understand.

MEDICAL EVIDENCE:

{focused_evidence}

CURRENT USER QUESTION:

{question}

Respond with ONLY the answer.
""".strip()

    return _call_ollama(prompt)


# =========================================================
# GENERATE ANSWER
# =========================================================

def generate_answer(
    question: str,
    context: list[str],
    context_type: str = "medical_knowledge",
) -> str:

    question = question.strip()

    if not question:

        return "Please provide a question."

    # -----------------------------------------------------
    # GENERAL CHAT
    # -----------------------------------------------------

    if _is_general_chat(question):

        return _generate_general_response(
            question
        )

    # -----------------------------------------------------
    # MEDICAL / RAG
    # -----------------------------------------------------

    if not context:

        return (
            "I could not find enough relevant medical evidence "
            "to answer that question."
        )

    return _generate_medical_response(
        question=question,
        context=context,
        context_type=context_type,
    )