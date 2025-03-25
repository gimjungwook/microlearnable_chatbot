# Genkit Classifier

이 프로젝트는 Genkit과 TypeScript를 활용하여 질문을 분류(Classification)하고, 결과를 CSV 및 JSON 파일로 저장하는 시스템입니다.

---

## 📁 프로젝트 구조

- `.genkit/` – Genkit 설정 폴더  
- `dist/` – 컴파일된 JS 파일 (빌드 결과물)  
- `node_modules/` – 의존성 패키지  
- `results/` – 분류 결과 저장 폴더  
- `genkit_test.ts` – Genkit 테스트 코드  
- `mass_classifier.ts` – 대량 분류 실행 코드  
- `questions.csv` – 입력 질문 데이터  
- `classifier_results.csv` – 최종 분류 결과  
- `partial_results.json` – 중간 결과 저장  
- `package.json`, `package-lock.json` – 프로젝트 메타정보 및 의존성  
- `tsconfig.json` – TypeScript 설정  

---

## 🚀 실행 방법

1. **의존성 설치**

```bash
npm install
```

2. **분류 실행**

```bash
ts-node mass_classifier.ts
```

3. **결과 확인**

- `classifier_results.csv` → 최종 분류 결과  
- `partial_results.json` → 중간 결과  
- `results/` 폴더에 추가적인 결과 파일 저장 가능성 있음

---

## 🧠 주요 기능

- CSV 파일로부터 질문 데이터 읽기
- Genkit 기반 자동 분류
- CSV 및 JSON 형식으로 결과 저장
- TypeScript 기반으로 유지보수가 쉬움

---

## 🧩 사용 기술

- [Genkit](https://genkit.dev)
- [TypeScript](https://www.typescriptlang.org/)
- `csv-parser` (또는 유사한 CSV 라이브러리)

---

## ⚠️ 주의사항

- Node.js **18 이상** 버전을 권장합니다.  
- `.genkit/` 폴더는 로컬 개발 설정이므로 환경에 따라 달라질 수 있습니다.

---

궁금한 점이 있거나 기여하고 싶다면 언제든지 연락 주세요! 😊
