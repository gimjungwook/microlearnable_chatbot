const axios = require('axios');

// 테스트 데이터: 모든 필수 필드를 포함합니다.
const testData = {
  question: "Flutter에서 상태 관리를 어떻게 하나요?",
  expected_difficulty: "Simple",
  expected_type: "Concept Understanding",
  studentName: "홍길동",
  codingSkillLevel: "Beginner",
  courseName: "Flutter Development",
  languagePreference: "Korean",
  persona: "Dark Fantasy Overlord Mentor",
  style: "A mysterious, slightly ominous mentor who teaches Dart and Flutter."
  // 필요한 경우 modelChoice 필드도 추가: "1" 또는 "2"
};

// 에뮬레이터 실행 시 표시된 URL을 사용 (YOUR_PROJECT_ID를 실제 값으로 교체)
const url = 'http://127.0.0.1:5001/chatbot-flow-e7cc4/us-central1/processQuestion';

axios.post(url, testData, {
  headers: { 'Content-Type': 'application/json' }
})
.then(response => {
  console.log("응답 결과:", response.data);
})
.catch(error => {
  console.error("오류 발생:", error);
});