import OpenAI from "openai";

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

// Only throw if we actually try to use the client; warn at startup to aid debugging.
if (!baseURL || !apiKey) {
  console.warn(
    "[integrations-openai] AI_INTEGRATIONS_OPENAI_BASE_URL or AI_INTEGRATIONS_OPENAI_API_KEY is not set. " +
    "AI features will use fallback responses. " +
    "Run setupReplitAIIntegrations() to provision the OpenAI integration."
  );
}

export const openai = new OpenAI({
  apiKey: apiKey ?? "placeholder",
  baseURL: baseURL ?? "https://api.openai.com/v1",
});
