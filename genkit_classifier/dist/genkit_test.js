"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import the Genkit and Google AI plugin libraries
const googleai_1 = require("@genkit-ai/googleai");
const genkit_1 = require("genkit");
// configure a Genkit instance
const ai = (0, genkit_1.genkit)({
    plugins: [(0, googleai_1.googleAI)()],
    model: googleai_1.gemini20Flash, // set default model
});
async function main() {
    // make a generation request
    const { text } = await ai.generate('Hello, Gemini!');
    console.log(text);
}
main();
