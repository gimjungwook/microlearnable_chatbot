"use strict";
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
// 📥 질문 CSV 읽기
function readQuestionsFromCSV(path) {
    const file = fs_1.default.readFileSync(path, 'utf8');
    const records = (0, sync_1.parse)(file, {
        columns: true,
        skip_empty_lines: true,
    });
    return records;
}
// ⏳ 지연
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 🧠 분류 (무한 재시도)
async function classifyQuestion(index, input) {
    const prompt = `
You are a classifier that categorizes a user's question.
Categorize the user's question into one of the following three categories based on content and context:

1. 'Simple': The question is related to Flutter or Dart and asks for a short explanation, usage, or syntax. It can be answered in 1-2 sentences.
2. 'Complex': The question is related to Flutter or Dart, but involves debugging, code logic, architectural understanding, or multi-step reasoning.
3. 'Irrelevant': The question is not related to Flutter or Dart at all.

Output only one word: 'Simple', 'Complex', or 'Irrelevant'.
Do not explain your reasoning. Do not include any extra text.

Question: "${input.question}"
`.trim();
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)()],
        model: googleai_1.gemini15Flash,
    });
    while (true) {
        const start = performance.now();
        try {
            const response = await ai.generate({ prompt });
            const end = performance.now();
            const actual = response.text.trim().replace(/["']/g, '');
            return {
                index,
                question: input.question,
                expected: input.expected,
                actual,
                is_match: actual === input.expected,
                elapsed_ms: Math.round(end - start),
            };
        }
        catch (error) {
            const wait = Math.floor(Math.random() * 5000) + 3000;
            console.warn(`⚠️ [${index}] ${error.status || ''} Retrying in ${wait}ms...`);
            await delay(wait);
        }
    }
}
// 🧾 사용자 입력 받기
function askUserInput(question) {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
// 🚀 메인 실행
async function classifyQuestionsFromCSV(csvPath) {
    const inputs = readQuestionsFromCSV(csvPath);
    const results = [];
    const filename = await askUserInput('📝 저장할 결과 파일 이름을 입력하세요 (확장자 제외): ');
    const dateStr = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    const resultDir = path_1.default.join('results', dateStr);
    if (!fs_1.default.existsSync(resultDir))
        fs_1.default.mkdirSync(resultDir, { recursive: true });
    const resultPath = path_1.default.join(resultDir, `${filename}.csv`);
    const partialPath = path_1.default.join(resultDir, 'partial_results.json');
    for (let i = 0; i < inputs.length; i++) {
        const result = await classifyQuestion(i + 1, inputs[i]);
        results.push(result);
        fs_1.default.writeFileSync(partialPath, JSON.stringify(results, null, 2));
        console.log(`${result.index}. ✅ ${result.actual}`);
    }
    // CSV 저장
    const csvHeader = 'index,question,expected,actual,is_match,elapsed_ms\n';
    const csvBody = results.map(r => `${r.index},"${r.question.replace(/"/g, '""')}",${r.expected},${r.actual},${r.is_match},${r.elapsed_ms}`).join('\n');
    fs_1.default.writeFileSync(resultPath, csvHeader + csvBody, 'utf8');
    console.log(`🎉 결과 저장 완료: ${resultPath}`);
}
// 🏁 실행 시작
(async () => {
    const inputPath = await askUserInput('📂 질문 CSV 파일 경로를 입력하세요: ');
    classifyQuestionsFromCSV(inputPath);
})();
