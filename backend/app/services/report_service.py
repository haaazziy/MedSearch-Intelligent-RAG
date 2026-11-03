from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import requests

from rag.ingestion.loader import load_pdf


# ============================================================
# Paths / Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

UPLOAD_DIR = BASE_DIR / "data" / "uploads"

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "phi:latest"


# ============================================================
# Basic Text Utilities
# ============================================================

def _clean_text(text: str) -> str:
    """Clean extracted PDF text while preserving line structure."""
    if not text:
        return ""

    text = text.replace("\x00", " ")
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    lines = []

    for line in text.split("\n"):
        line = line.strip()

        if line:
            line = re.sub(r"[ \t]+", " ", line)
            lines.append(line)

    return "\n".join(lines)


def _repair_encoding(text: str) -> str:
    """Repair common PDF encoding problems."""
    if not text:
        return ""

    replacements = {
        "â€“": "–",
        "â€”": "—",
        "â€˜": "'",
        "â€™": "'",
        "â€œ": '"',
        "â€": '"',
        "â€¢": "•",
        "Âµ": "µ",
        "Â": "",
        "Ã—": "×",
        "âˆ’": "−",
        "â‰¥": "≥",
        "â‰¤": "≤",
        "â‰ ": "≠",
    }

    for bad, good in replacements.items():
        text = text.replace(bad, good)

    return text


def _normalize_reference(reference: str | None) -> str:
    """Normalize a laboratory reference range."""
    if not reference:
        return ""

    reference = reference.strip()
    reference = reference.replace("–", "-")
    reference = reference.replace("—", "-")
    reference = reference.replace("−", "-")

    return re.sub(r"\s+", " ", reference)


def _normalize_unit(unit: str | None) -> str:
    """Normalize common laboratory units."""
    if not unit:
        return ""

    unit = unit.strip()

    replacements = {
        "mg/dl": "mg/dL",
        "g/dl": "g/dL",
        "iu/l": "IU/L",
        "u/l": "U/L",
        "miu/ml": "mIU/mL",
        "miu/l": "mIU/L",
        "mmol/l": "mmol/L",
        "ng/ml": "ng/mL",
        "pg/ml": "pg/mL",
        "x10": "×10",
    }

    return replacements.get(unit.lower(), unit)


def _clean_model_output(text: str) -> str:
    """Clean Ollama response text."""
    if not text:
        return ""

    text = text.strip()

    prefixes = [
        "Answer:",
        "Response:",
        "Interpretation:",
        "Medical interpretation:",
    ]

    for prefix in prefixes:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()

    return text


# ============================================================
# Ollama
# ============================================================

def _ask_ollama(
    prompt: str,
    temperature: float = 0.2,
    timeout: int = 120,
) -> str:
    """Send a prompt to the local Ollama model."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                },
            },
            timeout=timeout,
        )

        response.raise_for_status()

        data = response.json()

        answer = data.get("response", "")

        return _clean_model_output(answer)

    except requests.exceptions.ConnectionError:
        return (
            "Ollama is not currently available. "
            "Please make sure `ollama serve` is running."
        )

    except requests.exceptions.Timeout:
        return (
            "The local AI model took too long to respond. "
            "Please try again."
        )

    except Exception as exc:
        return f"Unable to generate interpretation: {exc}"


# ============================================================
# Evidence Normalization
# ============================================================

def _normalize_evidence(evidence: Any) -> list[str]:
    """Convert different evidence formats into clean strings."""
    if evidence is None:
        return []

    if isinstance(evidence, str):
        return [evidence.strip()] if evidence.strip() else []

    if isinstance(evidence, dict):
        text = evidence.get("text") or evidence.get("content") or ""

        if isinstance(text, str) and text.strip():
            return [text.strip()]

        return []

    if isinstance(evidence, list):
        normalized = []

        for item in evidence:
            if isinstance(item, str):
                if item.strip():
                    normalized.append(item.strip())

            elif isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""

                if isinstance(text, str) and text.strip():
                    normalized.append(text.strip())

        return normalized

    return []


# ============================================================
# Numeric Utilities
# ============================================================

def _to_float(value: Any) -> float | None:
    """Convert a value into float when possible."""
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    value = str(value).strip()

    match = re.search(r"-?\d+(?:\.\d+)?", value)

    if not match:
        return None

    try:
        return float(match.group(0))
    except ValueError:
        return None


def _parse_reference_range(reference: str | None) -> dict[str, Any]:
    """Parse common reference range formats."""
    if not reference:
        return {
            "low": None,
            "high": None,
            "operator": None,
            "target": None,
        }

    reference = _normalize_reference(reference)

    # Less than or equal
    match = re.search(
        r"^\s*<=\s*(-?\d+(?:\.\d+)?)",
        reference,
    )

    if match:
        return {
            "low": None,
            "high": float(match.group(1)),
            "operator": "<=",
            "target": float(match.group(1)),
        }

    # Greater than or equal
    match = re.search(
        r"^\s*>=\s*(-?\d+(?:\.\d+)?)",
        reference,
    )

    if match:
        return {
            "low": float(match.group(1)),
            "high": None,
            "operator": ">=",
            "target": float(match.group(1)),
        }

    # Less than
    match = re.search(
        r"^\s*<\s*(-?\d+(?:\.\d+)?)",
        reference,
    )

    if match:
        return {
            "low": None,
            "high": float(match.group(1)),
            "operator": "<",
            "target": float(match.group(1)),
        }

    # Greater than
    match = re.search(
        r"^\s*>\s*(-?\d+(?:\.\d+)?)",
        reference,
    )

    if match:
        return {
            "low": float(match.group(1)),
            "high": None,
            "operator": ">",
            "target": float(match.group(1)),
        }

    # Range
    match = re.search(
        r"(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)",
        reference,
    )

    if match:
        return {
            "low": float(match.group(1)),
            "high": float(match.group(2)),
            "operator": "range",
            "target": None,
        }

    return {
        "low": None,
        "high": None,
        "operator": None,
        "target": None,
    }


def _get_range_status(
    value: float | None,
    reference: str | None,
) -> str:
    """Determine whether a laboratory value is normal, high, or low."""
    if value is None or not reference:
        return "unknown"

    parsed = _parse_reference_range(reference)

    low = parsed["low"]
    high = parsed["high"]
    operator = parsed["operator"]

    if operator == "range":
        if low is not None and value < low:
            return "low"

        if high is not None and value > high:
            return "high"

        return "normal"

    if operator in ("<", "<="):
        if high is None:
            return "unknown"

        if operator == "<":
            return "normal" if value < high else "high"

        return "normal" if value <= high else "high"

    if operator in (">", ">="):
        if low is None:
            return "unknown"

        if operator == ">":
            return "normal" if value > low else "low"

        return "normal" if value >= low else "low"

    return "unknown"


# ============================================================
# Report Date
# ============================================================

def _extract_report_date(text: str) -> str | None:
    """Extract a report date from common formats."""
    if not text:
        return None

    patterns = [
        (
            r"(?:report\s+date|date\s+of\s+report|test\s+date|"
            r"collection\s+date)\s*[:\-]?\s*"
            r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})"
        ),
        (
            r"(?:report\s+date|date\s+of\s+report|test\s+date|"
            r"collection\s+date)\s*[:\-]?\s*"
            r"(\d{1,2}[-/]\d{1,2}[-/]\d{4})"
        ),
        r"\b(\d{4}-\d{2}-\d{2})\b",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1)

    return None


# ============================================================
# Laboratory Extraction
# ============================================================

TEST_PATTERNS = [
    "Hemoglobin",
    "Haemoglobin",
    "White Blood Cell Count",
    "White Blood Cells",
    "WBC",
    "Red Blood Cell Count",
    "Red Blood Cells",
    "RBC",
    "Hematocrit",
    "Haematocrit",
    "Platelet Count",
    "Platelets",
    "MCV",
    "MCH",
    "MCHC",
    "RDW",
    "Neutrophils",
    "Lymphocytes",
    "Monocytes",
    "Eosinophils",
    "Basophils",
    "Fasting Glucose",
    "Glucose",
    "HbA1c",
    "A1c",
    "Creatinine",
    "BUN",
    "Urea",
    "Sodium",
    "Potassium",
    "Chloride",
    "Calcium",
    "Magnesium",
    "TSH",
    "Free T4",
    "Free T3",
    "Ferritin",
    "Iron",
    "Vitamin B12",
    "Vitamin D",
    "Total Cholesterol",
    "LDL Cholesterol",
    "LDL",
    "HDL Cholesterol",
    "HDL",
    "Triglycerides",
    "ALT",
    "AST",
    "ALP",
    "Albumin",
    "Total Protein",
    "Bilirubin",
    "Total Bilirubin",
]


def _extract_lab_results(text: str) -> list[dict[str, Any]]:
    """Extract common laboratory results from PDF text."""
    if not text:
        return []

    text = _repair_encoding(_clean_text(text))

    results: list[dict[str, Any]] = []
    seen: set[str] = set()

    test_pattern = "|".join(
        re.escape(name)
        for name in sorted(
            TEST_PATTERNS,
            key=len,
            reverse=True,
        )
    )

    pattern = re.compile(
        rf"^\s*"
        rf"(?P<name>{test_pattern})"
        rf"\s+"
        rf"(?P<value>-?\d+(?:\.\d+)?)"
        rf"(?:\s+"
        rf"(?P<reference>"
        rf"[<>]=?\s*-?\d+(?:\.\d+)?"
        rf"|"
        rf"-?\d+(?:\.\d+)?\s*[-–—]\s*-?\d+(?:\.\d+)?"
        rf")"
        rf")?"
        rf"\s*"
        rf"(?P<unit>"
        rf"mg/dL"
        rf"|g/dL"
        rf"|U/L"
        rf"|IU/L"
        rf"|mIU/L"
        rf"|mIU/mL"
        rf"|mmol/L"
        rf"|ng/mL"
        rf"|pg/mL"
        rf"|%"
        rf"|×10\d+(?:/\w+)?"
        rf"|x10\d+(?:/\w+)?"
        rf")?"
        rf"\s*$",
        flags=re.IGNORECASE,
    )

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        match = pattern.match(line)

        if not match:
            continue

        name = match.group("name").strip()
        value_text = match.group("value")
        reference = match.group("reference")
        unit = match.group("unit")

        value = _to_float(value_text)

        if value is None:
            continue

        normalized_name = name.lower().strip()

        if normalized_name in seen:
            continue

        seen.add(normalized_name)

        reference = _normalize_reference(reference)
        unit = _normalize_unit(unit)

        status = _get_range_status(
            value,
            reference,
        )

        results.append(
            {
                "test_name": name,
                "value": value,
                "reference_range": reference,
                "unit": unit,
                "status": status,
            }
        )

    return results


# ============================================================
# Report Sections
# ============================================================

def _build_lab_section(
    lab_results: list[dict[str, Any]],
) -> str:
    """Build a readable laboratory section."""
    if not lab_results:
        return "No laboratory values were confidently extracted."

    lines = []

    for item in lab_results:
        name = item.get("test_name", "Unknown")
        value = item.get("value", "")
        unit = item.get("unit", "")
        reference = item.get("reference_range", "")
        status = item.get("status", "unknown")

        line = f"- {name}: {value}"

        if unit:
            line += f" {unit}"

        if reference:
            line += f" (reference: {reference})"

        line += f" [{status}]"

        lines.append(line)

    return "\n".join(lines)


def _build_key_findings(
    lab_results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build key abnormal findings."""
    findings = []

    for item in lab_results:
        status = item.get("status")

        if status not in {"high", "low"}:
            continue

        findings.append(
            {
                "test_name": item.get("test_name"),
                "value": item.get("value"),
                "unit": item.get("unit"),
                "reference_range": item.get("reference_range"),
                "status": status,
            }
        )

    return findings


# ============================================================
# AI Interpretation - POINT-BASED OUTPUT
# ============================================================

def _generate_interpretation(
    lab_results: list[dict[str, Any]],
    report_text: str,
) -> str:
    """
    Generate a structured, point-based patient-friendly
    medical report interpretation using Ollama.
    """

    if not lab_results:
        return (
            "1. OVERALL SUMMARY\n"
            "- No laboratory values could be confidently extracted.\n\n"
            "2. IMPORTANT FINDINGS\n"
            "- Please review the original report with a "
            "qualified healthcare professional.\n\n"
            "3. MEDICAL SAFETY NOTE\n"
            "- This explanation does not replace professional "
            "medical advice."
        )

    lab_section = _build_lab_section(lab_results)

    prompt = f"""
You are MedSearch AI, a professional medical report
explanation assistant.

Your task is to explain laboratory results in simple,
patient-friendly language.

STRICT FORMATTING RULES:
- Use clear section headings.
- Use bullet points for EVERY individual finding.
- Never write long paragraphs.
- Keep each bullet point short and informative.
- Separate each section using a blank line.
- Do not combine multiple findings into one paragraph.
- Do not use unnecessary introductory text.
- Do not repeat the same information.
- Use simple language that patients can understand.

MEDICAL SAFETY RULES:
- Do not diagnose diseases.
- Do not prescribe medication.
- Do not recommend starting or stopping treatment.
- Never invent laboratory values.
- Use the supplied reference ranges when available.
- Clearly distinguish normal, high, low and unknown results.
- Do not assume that a high or low value automatically
  means a particular disease.
- If clinical context is missing, mention that interpretation
  depends on the patient's circumstances.
- Recommend consulting a qualified healthcare professional.

LABORATORY RESULTS:
{lab_section}

ORIGINAL REPORT TEXT:
{report_text[:10000]}

GENERATE THE RESPONSE USING EXACTLY THIS STRUCTURE:

1. OVERALL SUMMARY
- Provide 2-3 short bullet points summarizing the report.

2. IMPORTANT FINDINGS
- List important laboratory findings.
- Mention the test name, value, unit and status when available.

3. RESULTS OUTSIDE REFERENCE RANGE
- List every high or low result separately.
- Include the reference range when available.
- If no abnormal results are identified, state that clearly.
- Do not classify unknown results as normal.

4. WHAT THESE RESULTS MAY INDICATE
- Explain the possible general significance of abnormal results.
- Use cautious, patient-friendly language.
- Do not make a diagnosis.

5. RECOMMENDATIONS
- Provide 2-3 general follow-up suggestions.
- Encourage discussion with a healthcare professional.
- Do not prescribe medication or treatment.

6. MEDICAL SAFETY NOTE
- State that this is an AI-generated explanation.
- Remind the patient that it does not replace medical advice.

IMPORTANT:
Return ONLY the structured explanation.
Use bullet points throughout.
Do not return a long paragraph.
"""

    return _ask_ollama(
        prompt,
        temperature=0.1,
        timeout=120,
    )


# ============================================================
# Document Evidence
# ============================================================

def _get_document_evidence(
    filename: str,
) -> str:
    """Extract text from an uploaded report."""
    path = UPLOAD_DIR / Path(filename).name

    if not path.exists():
        raise FileNotFoundError(
            f"Report '{filename}' was not found in {UPLOAD_DIR}"
        )

    loaded = load_pdf(path)

    if isinstance(loaded, str):
        text = loaded

    elif isinstance(loaded, list):
        parts = []

        for item in loaded:
            if isinstance(item, str):
                parts.append(item)

            elif hasattr(item, "page_content"):
                parts.append(str(item.page_content))

            elif isinstance(item, dict):
                content = (
                    item.get("page_content")
                    or item.get("text")
                    or item.get("content")
                    or ""
                )

                if content:
                    parts.append(str(content))

        text = "\n".join(parts)

    else:
        text = str(loaded)

    return _repair_encoding(_clean_text(text))


# ============================================================
# Main Report Analysis
# ============================================================

def analyze_report(
    filename: str,
) -> dict[str, Any]:
    """Analyze a medical PDF report."""
    report_name = Path(filename).name

    text = _get_document_evidence(report_name)

    lab_results = _extract_lab_results(text)

    key_findings = _build_key_findings(lab_results)

    interpretation = _generate_interpretation(
        lab_results,
        text,
    )

    report_date = _extract_report_date(text)

    normal_count = sum(
        1
        for item in lab_results
        if item.get("status") == "normal"
    )

    high_count = sum(
        1
        for item in lab_results
        if item.get("status") == "high"
    )

    low_count = sum(
        1
        for item in lab_results
        if item.get("status") == "low"
    )

    return {
        "filename": report_name,
        "report_date": report_date,
        "text": text,
        "text_characters": len(text),
        "lab_results": lab_results,
        "laboratory_results": lab_results,
        "key_findings": key_findings,
        "interpretation": interpretation,
        "summary": interpretation,
        "statistics": {
            "total_tests": len(lab_results),
            "normal": normal_count,
            "high": high_count,
            "low": low_count,
            "unknown": (
                len(lab_results)
                - normal_count
                - high_count
                - low_count
            ),
        },
    }


# ============================================================
# Report Comparison
# ============================================================

def _canonical_test_name(name: str) -> str:
    """Normalize test names so equivalent names can be compared."""
    name = str(name or "").lower().strip()

    replacements = {
        "haemoglobin": "hemoglobin",
        "haematocrit": "hematocrit",
        "white blood cells": "white blood cell count",
        "platelets": "platelet count",
        "a1c": "hba1c",
        "ldl": "ldl cholesterol",
        "hdl": "hdl cholesterol",
    }

    name = replacements.get(
        name,
        name,
    )

    name = re.sub(
        r"\s+",
        " ",
        name,
    )

    return name


def compare_reports(
    previous_report: dict[str, Any],
    latest_report: dict[str, Any],
) -> dict[str, Any]:
    """Compare two analyzed medical reports."""
    previous_results = (
        previous_report.get("lab_results")
        or previous_report.get("laboratory_results")
        or []
    )

    latest_results = (
        latest_report.get("lab_results")
        or latest_report.get("laboratory_results")
        or []
    )

    previous_map = {
        _canonical_test_name(item.get("test_name")): item
        for item in previous_results
        if item.get("test_name")
    }

    latest_map = {
        _canonical_test_name(item.get("test_name")): item
        for item in latest_results
        if item.get("test_name")
    }

    common_names = sorted(
        set(previous_map.keys())
        & set(latest_map.keys())
    )

    new_names = sorted(
        set(latest_map.keys())
        - set(previous_map.keys())
    )

    missing_names = sorted(
        set(previous_map.keys())
        - set(latest_map.keys())
    )

    comparison_rows = []

    for name in common_names:
        previous = previous_map[name]
        latest = latest_map[name]

        previous_value = _to_float(
            previous.get("value")
        )

        latest_value = _to_float(
            latest.get("value")
        )

        previous_unit = _normalize_unit(
            previous.get("unit")
        )

        latest_unit = _normalize_unit(
            latest.get("unit")
        )

        same_unit = (
            not previous_unit
            or not latest_unit
            or previous_unit.lower()
            == latest_unit.lower()
        )

        change = None
        percentage_change = None

        if (
            previous_value is not None
            and latest_value is not None
            and same_unit
        ):
            change = round(
                latest_value - previous_value,
                4,
            )

            if previous_value != 0:
                percentage_change = round(
                    (
                        (latest_value - previous_value)
                        / abs(previous_value)
                    )
                    * 100,
                    2,
                )

        comparison_rows.append(
            {
                "test_name": (
                    latest.get("test_name")
                    or previous.get("test_name")
                ),
                "previous_value": previous_value,
                "latest_value": latest_value,
                "previous_unit": previous_unit,
                "latest_unit": latest_unit,
                "change": change,
                "percentage_change": percentage_change,
                "previous_status": previous.get(
                    "status",
                    "unknown",
                ),
                "latest_status": latest.get(
                    "status",
                    "unknown",
                ),
                "status_changed": (
                    previous.get(
                        "status",
                        "unknown",
                    )
                    != latest.get(
                        "status",
                        "unknown",
                    )
                ),
                "unit_match": same_unit,
            }
        )

    new_tests = [
        latest_map[name]
        for name in new_names
    ]

    missing_tests = [
        previous_map[name]
        for name in missing_names
    ]

    improved = []
    worsened = []

    for row in comparison_rows:
        previous_status = row["previous_status"]
        latest_status = row["latest_status"]

        if (
            previous_status in {"high", "low"}
            and latest_status == "normal"
        ):
            improved.append(row)

        elif (
            previous_status == "normal"
            and latest_status in {"high", "low"}
        ):
            worsened.append(row)

    return {
        "previous_report": {
            "filename": previous_report.get(
                "filename"
            ),
            "report_date": previous_report.get(
                "report_date"
            ),
        },
        "latest_report": {
            "filename": latest_report.get(
                "filename"
            ),
            "report_date": latest_report.get(
                "report_date"
            ),
        },
        "comparison": comparison_rows,
        "comparison_rows": comparison_rows,
        "new_tests": new_tests,
        "missing_tests": missing_tests,
        "improved": improved,
        "worsened": worsened,
        "summary": {
            "common_tests": len(common_names),
            "new_tests": len(new_names),
            "missing_tests": len(missing_names),
            "improved": len(improved),
            "worsened": len(worsened),
        },
    }


# ============================================================
# Test Trends
# ============================================================

def build_test_trends(
    reports: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Build longitudinal trends across multiple reports."""
    if not reports:
        return []

    trends: dict[str, list[dict[str, Any]]] = {}

    for report in reports:
        report_date = report.get("report_date")
        filename = report.get("filename")

        results = (
            report.get("lab_results")
            or report.get("laboratory_results")
            or []
        )

        for result in results:
            test_name = result.get("test_name")

            if not test_name:
                continue

            key = _canonical_test_name(
                test_name
            )

            trends.setdefault(
                key,
                [],
            ).append(
                {
                    "test_name": test_name,
                    "date": report_date,
                    "filename": filename,
                    "value": result.get("value"),
                    "unit": result.get("unit"),
                    "status": result.get("status"),
                }
            )

    output = []

    for key, points in trends.items():
        points.sort(
            key=lambda item: (
                item.get("date") or "",
                item.get("filename") or "",
            )
        )

        numeric_values = [
            point.get("value")
            for point in points
            if isinstance(
                point.get("value"),
                (int, float),
            )
        ]

        direction = "stable"

        if len(numeric_values) >= 2:
            first = numeric_values[0]
            last = numeric_values[-1]

            if last > first:
                direction = "increasing"

            elif last < first:
                direction = "decreasing"

        output.append(
            {
                "test_name": (
                    points[-1].get("test_name")
                    if points
                    else key
                ),
                "direction": direction,
                "points": points,
            }
        )

    return output


# ============================================================
# Report Analytics
# ============================================================

def generate_report_analytics(
    filename: str,
) -> dict[str, Any]:
    """Generate structured analytics for a medical report."""
    report = analyze_report(filename)

    lab_results = report.get(
        "lab_results",
        [],
    )

    normal = [
        item
        for item in lab_results
        if item.get("status") == "normal"
    ]

    high = [
        item
        for item in lab_results
        if item.get("status") == "high"
    ]

    low = [
        item
        for item in lab_results
        if item.get("status") == "low"
    ]

    unknown = [
        item
        for item in lab_results
        if item.get("status") == "unknown"
    ]

    return {
        "status": "success",
        "filename": report.get("filename"),
        "report_date": report.get("report_date"),
        "text_characters": report.get(
            "text_characters",
            0,
        ),
        "total_tests": len(lab_results),
        "normal_count": len(normal),
        "high_count": len(high),
        "low_count": len(low),
        "unknown_count": len(unknown),
        "normal_results": normal,
        "high_results": high,
        "low_results": low,
        "unknown_results": unknown,
        "lab_results": lab_results,
        "key_findings": report.get(
            "key_findings",
            [],
        ),
        "interpretation": report.get(
            "interpretation",
            "",
        ),
        "evidence_chunks": len(lab_results),
    }


# ============================================================
# Report Summary
# ============================================================

def generate_report_summary(
    filename: str,
) -> dict[str, Any]:
    """Generate a concise report summary."""
    report = analyze_report(filename)

    lab_results = report.get(
        "lab_results",
        [],
    )

    abnormal = [
        item
        for item in lab_results
        if item.get("status") in {"high", "low"}
    ]

    normal = [
        item
        for item in lab_results
        if item.get("status") == "normal"
    ]

    return {
        "status": "success",
        "filename": report.get("filename"),
        "report_date": report.get("report_date"),
        "summary": report.get(
            "interpretation",
            "",
        ),
        "total_tests": len(lab_results),
        "abnormal_tests": len(abnormal),
        "normal_tests": len(normal),
        "key_findings": report.get(
            "key_findings",
            [],
        ),
    }