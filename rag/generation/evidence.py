import re


LAB_PATTERNS = {
    "Hemoglobin": r"Hemoglobin\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s*g/dL",
    "White Blood Cell Count": r"White Blood Cell Count\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+(?:×10[^\s]+/L|x10[^\s]+/L)",
    "Platelet Count": r"Platelet Count\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+(?:×10[^\s]+/L|x10[^\s]+/L)",
    "Fasting Glucose": r"Fasting Glucose\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+mg/dL",
    "Creatinine": r"Creatinine\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+mg/dL",
    "ALT": r"ALT\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+U/L",
    "AST": r"AST\s+([\d.]+)\s+([\d.]+[–-][\d.]+)\s+U/L",
}


def extract_lab_values(documents: list[str]) -> list[str]:
    """
    Extract known laboratory values from retrieved medical evidence.
    """

    text = " ".join(documents)
    extracted = []

    for test_name, pattern in LAB_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            result = match.group(1)
            reference_range = match.group(2)

            if test_name in {"Hemoglobin", "Fasting Glucose", "Creatinine"}:
                unit = "mg/dL" if test_name != "Hemoglobin" else "g/dL"

            elif test_name in {"ALT", "AST"}:
                unit = "U/L"

            else:
                unit = "×10⁹/L"

            extracted.append(
                f"{test_name}: {result} {unit} "
                f"(Reference range: {reference_range})"
            )

    return extracted


def extract_relevant_evidence(
    question: str,
    documents: list[str],
) -> str:
    """
    Extract focused evidence relevant to the user's question.
    """

    if not documents:
        return ""

    lab_values = extract_lab_values(documents)

    question_lower = question.lower()

    if any(
        phrase in question_lower
        for phrase in [
            "laboratory values",
            "lab values",
            "lab results",
            "which values",
            "all values",
            "all laboratory",
        ]
    ):
        if lab_values:
            return "\n".join(lab_values)

    keywords = [
        "hemoglobin",
        "haemoglobin",
        "glucose",
        "creatinine",
        "platelet",
        "white blood cell",
        "wbc",
        "alt",
        "ast",
    ]

    relevant = []

    for value in lab_values:
        if any(
            keyword in value.lower()
            for keyword in keywords
            if keyword in question_lower
        ):
            relevant.append(value)

    if relevant:
        return "\n".join(relevant)

    return "\n\n".join(documents)