// 📚 필요한 모듈들 import
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { parse } from 'csv-parse/sync';
import { gemini15Flash, gemini20Flash, gemini15Flash8b, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// 📝 인터페이스 정의: 입력 질문, 평가 결과, 분류 결과
interface QuestionInput {
  question: string;
  expected_difficulty?: string;
  expected_type?: string;
  studentName?: string;
  codingSkillLevel?: string;
  courseName?: string;
  languagePreference?: string;
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

// ClassificationResult에 각 AI 호출 시간과 선택한 답변 모델명을 추가함
interface ClassificationResult extends QuestionInput {
  index: number;
  actual_difficulty: string;
  actual_type: string;
  answer: string;
  elapsed_ms: number;          // 질문 전체 처리 시간
  evaluation: EvaluationResult;
  difficultyTime_ms: number;   // 난이도 분류에 소요된 시간
  typeTime_ms: number;         // 유형 분류에 소요된 시간
  answerTime_ms: number;       // 답변 생성에 소요된 시간 (선택한 모델 사용)
  evaluationTime_ms: number;   // 평가 요청에 소요된 시간
  answerModelUsed: string;     // 선택한 답변 모델명
}

// 📄 CSV 파일에서 질문을 읽어오는 함수
function readQuestionsFromCSV(filePath: string): QuestionInput[] {
  const file = fs.readFileSync(filePath, 'utf8'); // 📖 파일 읽기
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
  }) as QuestionInput[]; // 📋 CSV 파싱
  return records;
}

// ⏳ 지연 함수: ms 단위로 대기
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🤖 AI 분류 함수: modelOverride가 있으면 해당 모델로, 없으면 gemini15Flash로 호출
async function classify(input: string, prompt: string, modelOverride?: any): Promise<string> {
  const chosenModel = modelOverride ? modelOverride : gemini15Flash; // ✨ modelOverride 선택 가능
  const ai = genkit({
    plugins: [googleAI()], // 🔌 구글 AI 플러그인 사용
    model: chosenModel,
  });
  while (true) {
    try {
      const response = await ai.generate({ prompt });
      return response.text.trim(); // ✅ 성공 시 응답 반환
    } catch (error: any) {
      // ⚠️ 오류 발생 시 랜덤 대기 후 재시도
      const wait = Math.floor(Math.random() * 5000) + 3000;
      console.warn(`⚠️ Retrying in ${wait}ms due to error: ${error.status || error.message}`);
      await delay(wait);
    }
  }
}

// 🔧 시스템 프롬프트 생성 함수: 질문 유형에 따라 다른 프롬프트 반환
function getSystemPrompt(type: string, context: QuestionInput): string {
  const {
    studentName = 'John Doe',
    codingSkillLevel = 'Beginner',
    courseName = 'Flutter Development',
    languagePreference = 'English',
  } = context;

  const userCode = "N/A";
  const answerCode = "N/A";
  const errorMessage = "N/A";

  const persona = "Dark Fantasy Overlord Mentor";
  const style = "A mysterious, slightly ominous mentor who teaches Dart and Flutter with an air of dark wisdom, challenging students to prove their worth.";

  if (type === 'Concept Understanding') {
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
            "description": "### 1️⃣ Define the concept – What the concept is and how it works.\n### 2️⃣ How to use it – Show a simple example (skip unnecessary setup)."
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

// 📝 평가 프롬프트 생성: 응답에 대해 평가할 수 있도록 프롬프트 작성
function getEvaluationPrompt(answer: string, elapsed: number, language: string): string {
  return `{
    "role": "evaluator",
    "instruction": "The following is an educational response generated by a chatbot. Please evaluate it based on the criteria below, using 0.2-point increments on a 5-point scale. Each category is worth a maximum of 1.0 point, for a total of 5 categories. Provide the score and the reason for each category. At the end, include the total score.\n\n### 📏 Evaluation Criteria (Scoring Details per Category)\n\n1. 📘 Format Compliance\n- 1.0: All 6 sections included and markdown format perfect\n- 0.8: Minor formatting issues (spacing, missing emoji, etc.)\n- 0.6: One section missing or order incorrect\n- 0.4: Two or more sections missing\n- 0.0: Markdown format completely ignored\n\n2. 🌐 Language Accuracy\n- 1.0: Perfect translation (respects user's language_preference)\n- 0.8: 1–2 missing emojis or subheadings\n- 0.6: Some English remains (3–4 instances)\n- 0.4: Incomplete translation (more than half in English)\n- 0.0: Almost entirely in English\n\n3. ✅ Content Appropriateness\n- 1.0: Concept and example are highly appropriate for beginners\n- 0.8: Explanation is good but lacks example or a bit complex\n- 0.6: Incomplete concept or somewhat difficult\n- 0.4: Lacks explanation or contains inaccurate info\n- 0.0: Content is not helpful\n\n4. 🎨 Visualization Quality\n- 1.0: ASCII visualization and explanation are both well done\n- 0.8: Visualization is okay but explanation is brief\n- 0.6: Simple visualization or explanation lacks detail\n- 0.4: Format exists but is inaccurate\n- 0.0: No visualization\n\n5. ⚡ Response Time\n- 1.0: 0–2 seconds\n- 0.8: 2–4 seconds\n- 0.6: 4–6 seconds\n- 0.4: 6–10 seconds\n- 0.0: Over 10 seconds\n\n---\n\nBelow is the chatbot response to be evaluated:\n\n---\n\n[Paste the chatbot response here]\n\n---\n\nResponse time: [e.g., 3.7 seconds]  \nUser's language preference: [e.g., Korean]\n\n---\n\nPlease provide the score and justification for each category in a table format. Include the total score on the final line.",
    "input": {
      "answer": ${JSON.stringify(answer)},
      "elapsed": ${elapsed},
      "language_preference": "${language}"
    }
  }`;
}

// 🔍 평가 결과 문자열을 파싱하여 객체로 반환
function parseEvaluation(raw: string): EvaluationResult {
  const match = (label: string) => {
    const regex = new RegExp(`${label}.*?\\|\\s*(\\d\\.\\d)`);
    return parseFloat(raw.match(regex)?.[1] || '0');
  };
  return {
    score_format: match("Format Compliance"),
    score_language: match("Language Accuracy"),
    score_content: match("Content Appropriateness"),
    score_visual: match("Visualization"),
    score_time: match("Response Time"),
    total_score: match("Format Compliance") +
                 match("Language Accuracy") +
                 match("Content Appropriateness") +
                 match("Visualization") +
                 match("Response Time"),
    reasons: raw,
  };
}

// 🚀 CSV 파일 내 모든 질문을 처리하는 메인 함수 (선택한 답변 모델을 인자로 받음)
async function processQuestions(csvPath: string, answerModel: any, answerModelName: string) {
  const inputs = readQuestionsFromCSV(csvPath); // 📂 CSV 파일 읽기
  const results: ClassificationResult[] = [];
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  // 💾 결과 파일명에 선택한 답변 모델명을 포함
  const resultDir = path.join('results', dateStr);
  if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });
  const resultPath = path.join(resultDir, `result_${timeStr}_${answerModelName}.json`);
  const partialPath = path.join(resultDir, 'partial_results.json');

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const totalStart = performance.now(); // ⏱ 전체 시작 시간

    // 🔎 난이도 분류 측정
    const diffStart = performance.now();
    const difficultyPrompt = `{
  "persona": "You are a classifier that categorizes a user's question."
  "task": "categorizes a user's question into one of the following three categories based on content and context:

1. 'Simple': The question is related to Flutter or Dart and asks for a short explanation, usage, or syntax. It can be answered in 1-2 sentences.
2. 'Complex': The question is related to Flutter or Dart, but involves debugging, code logic, architectural understanding, or multi-step reasoning.
3. 'Irrelevant': The question is not related to Flutter or Dart at all.

Pay special attention to questions that may not include the words 'Flutter' or 'Dart' directly, but are clearly asked in the context of writing or debugging code.

Your output must be one of: 'Simple', 'Complex', or 'Irrelevant'. Do not explain your reasoning. Do not include any extra text.",
  "input_format": "${input.question}",
  "output_format": "'Simple', 'Complex', or 'Irrelevant'"
}`;
    const actual_difficulty = await classify(input.question, difficultyPrompt);
    const difficultyTime = Math.round(performance.now() - diffStart);

    // 🏷 유형 분류 측정
    const typeStart = performance.now();
    const typePrompt = `Classify the question into one of the following categories: "Concept Understanding" or "Debugging/Error Fixing".\nQuestion: "${input.question}"`;
    const actual_type = await classify(input.question, typePrompt);
    const typeTime = Math.round(performance.now() - typeStart);

    // 🚫 'Irrelevant'인 경우, 별도 메시지 생성 후 다음 질문으로 건너뜀
    if (actual_difficulty === 'Irrelevant') {
      const totalElapsed = Math.round(performance.now() - totalStart);
      const result: ClassificationResult = {
        index: i + 1,
        ...input,
        actual_difficulty,
        actual_type,
        answer: "This system is not designed to answer non-Dart/Flutter related questions. Please ask something related to Dart or Flutter.",
        elapsed_ms: totalElapsed,
        evaluation: {
          score_format: 0,
          score_language: 0,
          score_content: 0,
          score_visual: 0,
          score_time: 0,
          total_score: 5,
          reasons: "No evaluation for irrelevant question."
        },
        difficultyTime_ms: difficultyTime,
        typeTime_ms: typeTime,
        answerTime_ms: 0,
        evaluationTime_ms: 0,
        answerModelUsed: answerModelName,
      };

      results.push(result);
      fs.writeFileSync(partialPath, JSON.stringify(results, null, 2));
      console.log(`${result.index}. ✅ Difficulty: ${actual_difficulty}, Type: ${actual_type}`);
      continue;
    }

    // 🛠 시스템 프롬프트 생성 후, 선택한 모델로 답변 생성 및 시간 측정
    const systemPrompt = getSystemPrompt(actual_type, input);
    const answerStart = performance.now();
    const answer = await classify(input.question, systemPrompt, answerModel);
    const answerTime = Math.round(performance.now() - answerStart);

    // 📝 평가 프롬프트 및 평가 측정
    const evalStart = performance.now();
    const overallElapsed = Math.round(performance.now() - totalStart);
    const evalPrompt = getEvaluationPrompt(answer, overallElapsed / 1000, input.languagePreference || 'English');
    const rawEvaluation = await classify('', evalPrompt);
    const evaluationTime = Math.round(performance.now() - evalStart);
    const evaluation = parseEvaluation(rawEvaluation);

    const result: ClassificationResult = {
      index: i + 1,
      ...input,
      actual_difficulty,
      actual_type,
      answer,
      elapsed_ms: overallElapsed,
      evaluation,
      difficultyTime_ms: difficultyTime,
      typeTime_ms: typeTime,
      answerTime_ms: answerTime,
      evaluationTime_ms: evaluationTime,
      answerModelUsed: answerModelName,
    };

    results.push(result);
    fs.writeFileSync(partialPath, JSON.stringify(results, null, 2));
    console.log(`${result.index}. ✅ Difficulty: ${actual_difficulty}, Type: ${actual_type}`);
  }

  // 📤 최종 결과 파일 저장 (파일명에 선택한 모델명 포함)
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n🎉 All done! Final result saved to: ${resultPath}`);
}

// 🚀 프로그램 시작: 먼저 답변 생성 모델 선택 후, CSV 파일 경로를 입력받음
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('🛠 Choose answer generation model (1: gemini20Flash, 2: gemini15Flash8b): ', (modelChoice) => {
  // 기본값은 gemini20Flash (1번)
  const chosenModel = (modelChoice.trim() === '2') ? gemini15Flash8b : gemini20Flash;
  const chosenModelName = (modelChoice.trim() === '2') ? 'gemini15Flash8b' : 'gemini20Flash';
  rl.question('📂 CSV file path: ', async (inputPath) => {
    rl.close();
    await processQuestions(inputPath.trim(), chosenModel, chosenModelName);
    process.exit(0);
  });
});
