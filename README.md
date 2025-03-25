
# 📦 genkit_classifier

**Genkit 기반 질문 분류 및 AI 응답 시스템**  
Flutter/Dart 관련 질문을 자동 분류하고, Gemini 모델을 활용해 교육 응답을 생성 및 평가하는 프로젝트입니다.

---

## 📁 프로젝트 구조

```
microlearnable/
└── genkit_classifier/      # 현재 프로젝트 (질문 분류기)
    ├── results/            # 결과 저장 폴더
    ├── example.csv         # 테스트용 입력 CSV
    └── mass_classifier.ts            # 메인 실행 파일 (TypeScript)
```

> 이후 이 프로젝트는 `Flutter + Firebase Functions` 기반의 웹 프로젝트와 통합될 예정입니다.  
> 통합 프로젝트는 `microlearnable/chatbot_demo` 디렉토리에 위치하게 됩니다.

---

## ✅ 주요 기능

| 기능 | 설명 |
|------|------|
| 📄 CSV 파일 입력 | 사용자 질문 및 정보(난이도 예상, 이름, 언어 등) 포함 |
| 🤖 Gemini 모델 사용 | 질문을 난이도(Simple/Complex/Irrelevant)와 유형(Concept/Debugging)으로 자동 분류 |
| 🧙 시스템 프롬프트 | 유형에 맞는 맞춤형 교육 응답 생성 |
| 🧪 응답 평가 | 응답을 5개 기준(형식, 언어, 내용, 시각화, 응답속도)으로 자동 평가 |
| 💾 실시간 저장 | 질문별 결과를 실시간으로 JSON 파일에 저장 |
| 📤 최종 저장 | 전체 결과는 날짜별 폴더에 JSON 파일로 저장됨 |

---

## 🧪 사용 방법

### 1. 폴더 이동
```bash
cd genkit_classifier
```

### 2. Dependencies 설치

```bash
npm install
```

### 3. 컴파일 후 실행

```bash
npx tsc
node mass_classifier.js
```

실행하면 인풋 CSV 경로를 입력하라는 메시지가 나타납니다.
> 기본적인 실험용 파일은 questions.csv입니다.

---

## 🗂 입력 CSV 예시

```csv
question,expected_difficulty,expected_type,studentName,codingSkillLevel,courseName,languagePreference
"How do I use `ListView.builder` in Flutter?",Simple,Concept Understanding,Anna Lee,Beginner,Flutter Bootcamp,English
"Why is my widget not rebuilding after setState?",Complex,Debugging/Error Fixing,James Park,Intermediate,Flutter UI Design,Korean
```

---

## 📊 평가 기준

| 항목                | 기준 설명 |
|---------------------|------------|
| 📘 Format Compliance | 마크다운 형식 및 섹션 포함 여부 |
| 🌐 Language Accuracy | 언어 설정 준수 및 번역 정확성 |
| ✅ Content            | 초보자 친화성, 정확성, 예시 포함 여부 |
| 🎨 Visualization     | ASCII 시각화 및 설명 |
| ⚡ Response Time     | 실제 응답 시간에 기반한 점수 |

---

## 🔮 향후 계획

- `genkit_classifier`를 Flutter + Firebase 기반의 프론트엔드와 통합
- Firebase Functions를 통해 질문 제출 및 응답 확인 기능 구현
- 학습자 개인화 응답 자동 생성 및 성능 분석 기능 추가

---

> 📌 개발자 참고: Genkit, Gemini 1.5 Flash API, csv-parse, fs 모듈 등을 사용하며, TypeScript 기반으로 작성되었습니다.
