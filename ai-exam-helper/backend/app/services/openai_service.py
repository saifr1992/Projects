import json
from typing import List, Optional

from fastapi import HTTPException
from openai import OpenAI

from app.core.config import settings

SYSTEM_PROMPT = (
    "You are 'ExamHelper AI', a friendly and patient study assistant for university students. "
    "Your job is to help students understand concepts, work through past-paper questions, and "
    "prepare for exams.\n\n"
    "Guidelines:\n"
    "- Explain answers step-by-step, showing reasoning before the final answer.\n"
    "- Use clear headings, bullet points, and short paragraphs when helpful.\n"
    "- For maths or formulas, use LaTeX-style with $...$ for inline and $$...$$ for blocks.\n"
    "- If a question is ambiguous, ask the student a brief clarifying question.\n"
    "- Be encouraging and concise. Avoid filler."
)

QUIZ_SYSTEM_PROMPT = (
    "You are a question generator for university exam preparation. "
    "You produce high-quality multiple-choice questions (MCQs) in strict JSON. "
    "Each question must have exactly 4 options, one correct, and a short explanation."
)


def _client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Set OPENAI_API_KEY in backend/.env",
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def chat_completion(messages: List[dict], paper_context: Optional[str] = None) -> str:
    """Run a non-streaming chat completion."""
    system = SYSTEM_PROMPT
    if paper_context:
        system += f"\n\nThe student is studying this past paper context:\n{paper_context}"

    payload = [{"role": "system", "content": system}, *messages]
    client = _client()
    try:
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=payload,
            temperature=0.4,
        )
        return resp.choices[0].message.content or ""
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")


def generate_quiz_questions(
    topic: Optional[str],
    paper_title: Optional[str],
    paper_context: Optional[str],
    num_questions: int,
    difficulty: str,
) -> List[dict]:
    """Use OpenAI structured JSON to produce MCQs."""
    context_lines = []
    if paper_title:
        context_lines.append(f"Past paper: {paper_title}")
    if topic:
        context_lines.append(f"Topic / focus: {topic}")
    if paper_context:
        context_lines.append(f"Reference notes:\n{paper_context}")
    context_text = "\n".join(context_lines) or "General university-level exam preparation."

    user_prompt = (
        f"Generate {num_questions} {difficulty}-difficulty multiple choice questions.\n\n"
        f"{context_text}\n\n"
        "Return ONLY valid JSON in this exact shape:\n"
        "{\n"
        '  "questions": [\n'
        '    {"question": "...", "options": ["A","B","C","D"], '
        '"correct_index": 0, "explanation": "..."}\n'
        "  ]\n"
        "}\n"
        "Each question must have exactly 4 options. correct_index is 0-3."
    )

    try:
        resp = _client().chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.6,
        )
        raw = resp.choices[0].message.content or "{}"
        data = json.loads(raw)
        questions = data.get("questions", [])
        cleaned = []
        for q in questions:
            opts = q.get("options") or []
            if (
                isinstance(q.get("question"), str)
                and isinstance(opts, list)
                and len(opts) == 4
                and isinstance(q.get("correct_index"), int)
                and 0 <= q["correct_index"] < 4
            ):
                cleaned.append(
                    {
                        "question": q["question"],
                        "options": opts,
                        "correct_index": q["correct_index"],
                        "explanation": q.get("explanation", ""),
                    }
                )
        if not cleaned:
            raise HTTPException(status_code=502, detail="AI returned no valid questions")
        return cleaned
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")
