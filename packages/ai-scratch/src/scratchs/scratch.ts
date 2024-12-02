import { OpenAI } from "openai";
import { environment } from "../../environment.js";

const openai = new OpenAI({ apiKey: environment.openaiApiKey });

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});

console.log("ME> Hello\n");
console.log("ASSISTANT> ", completion.choices[0].message.content);
