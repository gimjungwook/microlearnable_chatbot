module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    // 한 줄 최대 길이를 120자로 늘림 (기본 80자에서 완화)
    "max-len": ["error", { "code": 120 }],
    // JSDoc 주석 요구 해제
    "require-jsdoc": "off",
    // 변수명이 camelCase가 아니어도 경고하지 않음
    camelcase: "off",
    // 중괄호 내 공백 규칙 (원하는 스타일로 조정)
    "object-curly-spacing": ["error", "always"],
    // 문자열은 큰따옴표 사용
    quotes: ["error", "double"],
    // 상수 조건 경고를 경고 수준으로 변경
    "no-constant-condition": "warn",
    // any 타입 사용 시 경고만 출력하도록 설정
    "@typescript-eslint/no-explicit-any": "warn"
  },
};
