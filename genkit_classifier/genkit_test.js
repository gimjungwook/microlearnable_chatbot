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
Object.defineProperty(exports, "__esModule", { value: true });
// import the Genkit and Google AI plugin libraries
const googleai_1 = require("@genkit-ai/googleai");
const genkit_1 = require("genkit");
// configure a Genkit instance
const ai = (0, genkit_1.genkit)({
    plugins: [(0, googleai_1.googleAI)()],
    model: googleai_1.gemini20Flash, // set default model
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // make a generation request
        const { text } = yield ai.generate('Hello, Gemini!');
        console.log(text);
    });
}
main();
