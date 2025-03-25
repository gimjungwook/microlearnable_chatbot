"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const sync_1 = require("csv-parse/sync");
const googleai_1 = require("@genkit-ai/googleai");
const genkit_1 = require("genkit");
function readQuestionsFromCSV(filePath) {
    const file = fs_1.default.readFileSync(filePath, 'utf8');
    const records = (0, sync_1.parse)(file, {
        columns: true,
        skip_empty_lines: true,
    });
    return records;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function classify(input, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const ai = (0, genkit_1.genkit)({
            plugins: [(0, googleai_1.googleAI)()],
            model: googleai_1.gemini15Flash,
        });
        while (true) {
            try {
                const response = yield ai.generate({ prompt });
                return response.text.trim();
            }
            catch (error) {
                const wait = Math.floor(Math.random() * 5000) + 3000;
                console.warn(`⚠️ Retrying in ${wait}ms due to error: ${error.status || error.message}`);
                yield delay(wait);
            }
        }
    });
}
function getSystemPrompt(type, context) {
    const { studentName = 'John Doe', codingSkillLevel = 'Beginner', courseName = 'Flutter Development', languagePreference = 'English', } = context;
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
        "language_handling": "If user has language preference, translate the whole response to that language.",
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
    }
    else {
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
    "language_handling": "If user has language preference, translate the whole response to that language.",
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
function getEvaluationPrompt(answer, elapsed, language) {
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
function parseEvaluation(raw) {
    var _a;
    const match = (label) => {
        var _a;
        const regex = new RegExp(`${label}.*?\\|\\s*(\\d\\.\\d)`);
        return parseFloat(((_a = raw.match(regex)) === null || _a === void 0 ? void 0 : _a[1]) || '0');
    };
    const total = parseFloat(((_a = raw.match(/Total Score[:：]\s*(\d\.\d)/)) === null || _a === void 0 ? void 0 : _a[1]) || '0');
    return {
        score_format: match("Format Compliance"),
        score_language: match("Language Accuracy"),
        score_content: match("Content Appropriateness"),
        score_visual: match("Visualization"),
        score_time: match("Response Time"),
        total_score: match("Format Compliance") + match("Language Accuracy") + match("Content Appropriateness") + match("Visualization") + match("Response Time"),
        reasons: raw,
    };
}
function processQuestions(csvPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputs = readQuestionsFromCSV(csvPath);
        const results = [];
        const dateStr = new Date().toISOString().slice(0, 10);
        const timeStr = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        const resultDir = path_1.default.join('results', dateStr);
        if (!fs_1.default.existsSync(resultDir))
            fs_1.default.mkdirSync(resultDir, { recursive: true });
        const resultPath = path_1.default.join(resultDir, `result_${timeStr}.json`);
        const partialPath = path_1.default.join(resultDir, 'partial_results.json');
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const start = performance.now();
            const difficultyPrompt = `Categorize the question into one of the following: \"Simple\", \"Complex\", or \"Irrelevant\".\nQuestion: \"${input.question}\"`;
            const typePrompt = `Classify the question into one of the following categories: \"Concept Understanding\" or \"Debugging/Error Fixing\".\nQuestion: \"${input.question}\"`;
            const actual_difficulty = yield classify(input.question, difficultyPrompt);
            const actual_type = yield classify(input.question, typePrompt);
            const systemPrompt = getSystemPrompt(actual_type, input);
            const answer = yield classify(input.question, systemPrompt);
            const end = performance.now();
            const elapsed = Math.round(end - start);
            const evalPrompt = getEvaluationPrompt(answer, elapsed / 1000, input.languagePreference || 'English');
            const rawEvaluation = yield classify('', evalPrompt);
            const evaluation = parseEvaluation(rawEvaluation);
            const result = Object.assign(Object.assign({ index: i + 1 }, input), { actual_difficulty,
                actual_type,
                answer, elapsed_ms: elapsed, evaluation });
            results.push(result);
            fs_1.default.writeFileSync(partialPath, JSON.stringify(results, null, 2));
            console.log(`${result.index}. ✅ Difficulty: ${actual_difficulty}, Type: ${actual_type}`);
        }
        fs_1.default.writeFileSync(resultPath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`\n🎉 All done! Final result saved to: ${resultPath}`);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('📂 CSV file path: ', (inputPath) => __awaiter(void 0, void 0, void 0, function* () {
        rl.close();
        yield processQuestions(inputPath.trim());
        process.exit(0);
    }));
}))();
