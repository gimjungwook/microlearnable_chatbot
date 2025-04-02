// 📦 필수 모듈 import
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  googleAI,
  gemini15Flash,
  gemini15Flash8b,
  gemini20Flash,
} from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { performance } from "perf_hooks";

// 📄 타입 정의
interface QuestionInput {
  question: string;
  expected_difficulty: string;
  expected_type: string;
  studentName: string;
  codingSkillLevel: string;
  courseName: string;
  languagePreference: string;
  persona: string;
  style: string;
}

interface QuestionInputExtended extends QuestionInput {
  modelChoice?: string;
}

interface EvaluationResult {
  score_format: number;
  score_language: number;
  score_content: number;
  score_visual: number;
  score_time: number;
  total_score: number;
  reasons: string;
}

interface ClassificationResult extends QuestionInputExtended {
  index: number;
  actual_difficulty: string;
  actual_type: string;
  answer: string;
  elapsed_ms: number;
  evaluation: EvaluationResult;
  difficultyTime_ms: number;
  typeTime_ms: number;
  answerTime_ms: number;
  evaluationTime_ms: number;
  answerModelUsed: string;
}

// 🧪 입력 파싱 및 검증 함수
function parseInput(data: any): QuestionInputExtended {
  const requiredFields: (keyof QuestionInput)[] = [
    "question",
    "expected_difficulty",
    "expected_type",
    "studentName",
    "codingSkillLevel",
    "courseName",
    "languagePreference",
    "persona",
    "style",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    ...data,
    modelChoice: data.modelChoice ?? undefined,
  };
}

// 🤖 분류 및 답변 생성 함수
async function classify(
  input: string,
  prompt: string,
  modelOverride?: any
): Promise<string> {
  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
      model: modelOverride || gemini15Flash,
    });
    const response = await ai.generate({ prompt });
    return response.text.trim();
  } catch (error: any) {
    logger.error("🔥 classify() error:", error);
    throw new Error(`AI classification failed: ${error.message || error.toString()}`);
  }
}

// 🛠 시스템 프롬프트 생성 함수
function getSystemPrompt(type: string, context: QuestionInput): string {
  const { studentName, codingSkillLevel, courseName, languagePreference, persona, style } = context;

  const userCode = "N/A";
  const answerCode = "N/A";
  const errorMessage = "N/A";

  if (type === "Concept Understanding") {
    return `{
      "context": {
        "student": "${studentName} (${codingSkillLevel})",
        "course": "${courseName}",
        "language_preference": "${languagePreference}"
      },
      "persona": "${persona}",
      "tone": {
        "style": "${style}",
        "use_emoji": true
      },
      "task": {
        "language_handling": "Response MUST BE in user's language preperence.",
        "assumption": "Assume an absolute beginner with limited English.",
        "instructions": "Use simple words and break down concepts.",
        "sentence_structure": "Keep sentences short and clear."
      },
      "format": {
        "output": "markdown",
        "sections": [
          {
            "title": "## 📘 Concept Summary",
            "description": "Start with an encouraging greeting. Briefly explain why the concept is important and how it’s used."
          },
          {
            "title": "## 🔍 Step-by-Step Explanation",
            "description": "### 1️⃣ Define the concept – What the concept is and how it works.\\n### 2️⃣ How to use it – Show a simple example (skip unnecessary setup)."
          },
          {
            "title": "## 👀 Visualization",
            "description": "Add visuals using ASCII code with an explanation."
          },
          {
            "title": "## 🚨 Common Mistakes",
            "description": "List common errors and how to avoid them."
          },
          {
            "title": "## ✏️ Practice Question",
            "description": "Give a small task to apply learning."
          },
          {
            "title": "📚 Helpful Documents",
            "description": "Introduce the user to helpful resources to deepen understanding. End with encouragement, mentioning the name."
          }
        ]
      }
    }`;
  } else {
    return `{
      "context": {
        "student": "${studentName} (${codingSkillLevel})",
        "user_code": "${userCode}",
        "answer_code": "${answerCode}",
        "error_message": "${errorMessage}",
        "language_preference": "${languagePreference}"
      },
      "persona": "${persona}",
      "tone": {
        "style": "${style}",
        "use_emoji": true
      },
      "task": {
        "language_handling": "Response MUST BE in user's language preperence.",
        "assumption": "Assume an absolute beginner with limited English.",
        "explanation": "Use simple words and break down concepts.",
        "sentence_structure": "Keep sentences short and clear."
      },
      "format": {
        "output": "markdown",
        "sections": [
          {
            "title": "## 📘 Error (or Code) Summary",
            "description": "Start with a warm greeting. Briefly explain why the error (or debug) is required and how it’s used."
          },
          {
            "title": "## 🔍 Step-by-Step Explanation",
            "steps": [
              "### 1️⃣ Define the error (or code) – What the error (or problem) is and how it works.",
              "### 2️⃣ How to use it"
            ]
          },
          {
            "title": "## 👀 [Visualization or Code Example]",
            "instructions": [
              "ALWAYS skip unnecessary setup lines.",
              "DO NOT PROVIDE ANSWER, but provide a concise simple example.",
              "Widgets must be completely different from widgets in user code."
            ]
          },
          {
            "title": "## 🚨 Common Mistakes",
            "description": "List common errors and how to avoid them."
          },
          {
            "title": "## ✏️ Practice Question",
            "description": "Give a small task to apply learning."
          },
          {
            "title": "## 📚 Helpful Documents",
            "description": "Introduce user to helpful resources to deepen understanding.",
            "ending_note": "End with encouragement, mentioning name."
          }
        ]
      }
    }`;
  }
}

// 🧾 평가용 프롬프트 생성
function getEvaluationPrompt(answer: string, elapsed: number, language: string): string {
  return `{
    "role": "evaluator",
    "instruction": "The following is an educational response generated by a chatbot...",
    "input": {
      "answer": ${JSON.stringify(answer)},
      "elapsed": ${elapsed},
      "language_preference": "${language}"
    }
  }`;
}

// 🔍 평가 결과 파싱
function parseEvaluation(raw: string): EvaluationResult {
  const match = (label: string) => {
    const regex = new RegExp(`${label}.*?\\|\\s*(\\d\\.\\d)`);
    return parseFloat(raw.match(regex)?.[1] || "0");
  };
  return {
    score_format: match("Format Compliance"),
    score_language: match("Language Accuracy"),
    score_content: match("Content Appropriateness"),
    score_visual: match("Visualization"),
    score_time: match("Response Time"),
    total_score:
      match("Format Compliance") +
      match("Language Accuracy") +
      match("Content Appropriateness") +
      match("Visualization") +
      match("Response Time"),
    reasons: raw,
  };
}

// ☁️ Gen 2 Firebase Function 정의
export const processQuestion = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request): Promise<ClassificationResult> => {
    logger.info("📥 Received data", request.data);

    const input = parseInput(request.data);
    const modelChoice = input.modelChoice?.toLowerCase();

    const chosenModel =
      modelChoice === "2" || modelChoice === "gemini15flash8b"
        ? gemini15Flash8b
        : gemini20Flash;

    const chosenModelName =
      modelChoice === "2" || modelChoice === "gemini15flash8b"
        ? "gemini15Flash8b"
        : "gemini20Flash";

    const totalStart = performance.now();

    // 🔎 난이도 분류
    const diffStart = performance.now();
    const difficultyPrompt = `{
      "persona": "You are a classifier that categorizes a user's question.",
      "task": "Categorize a user's question...",
      "input_format": "${input.question}",
      "output_format": "'Simple', 'Complex', or 'Irrelevant'"
    }`;
    const actual_difficulty = await classify(input.question, difficultyPrompt);
    const difficultyTime_ms = Math.round(performance.now() - diffStart);

    // 🏷 유형 분류
    const typeStart = performance.now();
    const typePrompt = `Classify the question into one of the following categories: \"Concept Understanding\" or \"Debugging/Error Fixing\".\nQuestion: \"${input.question}\"`;
    const actual_type = await classify(input.question, typePrompt);
    const typeTime_ms = Math.round(performance.now() - typeStart);

    if (actual_difficulty === "Irrelevant") {
      return {
        index: 1,
        ...input,
        actual_difficulty,
        actual_type,
        answer: "This system is not designed to answer non-Dart/Flutter related questions.",
        elapsed_ms: Math.round(performance.now() - totalStart),
        evaluation: {
          score_format: 0,
          score_language: 0,
          score_content: 0,
          score_visual: 0,
          score_time: 0,
          total_score: 5,
          reasons: "No evaluation for irrelevant question.",
        },
        difficultyTime_ms,
        typeTime_ms,
        answerTime_ms: 0,
        evaluationTime_ms: 0,
        answerModelUsed: chosenModelName,
      };
    }

    // ✍️ 답변 생성
    const answerStart = performance.now();
    const systemPrompt = getSystemPrompt(actual_type, input);
    const answer = await classify(input.question, systemPrompt, chosenModel);
    const answerTime_ms = Math.round(performance.now() - answerStart);

    // 🧪 평가 생성
    const evalStart = performance.now();
    const evalPrompt = getEvaluationPrompt(answer, (performance.now() - totalStart) / 1000, input.languagePreference);
    const rawEvaluation = await classify("", evalPrompt);
    const evaluationTime_ms = Math.round(performance.now() - evalStart);
    const evaluation = parseEvaluation(rawEvaluation);

    return {
      index: 1,
      ...input,
      actual_difficulty,
      actual_type,
      answer,
      elapsed_ms: Math.round(performance.now() - totalStart),
      evaluation,
      difficultyTime_ms,
      typeTime_ms,
      answerTime_ms,
      evaluationTime_ms,
      answerModelUsed: chosenModelName,
    };
  }
);
