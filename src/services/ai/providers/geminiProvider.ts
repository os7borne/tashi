import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProviderClient, AiCompletionRequest } from "../types";
import { createProviderFactory } from "../providerFactory";

const factory = createProviderFactory(
  (apiKey) => new GoogleGenerativeAI(apiKey),
);

export function createGeminiProvider(apiKey: string, modelId: string): AiProviderClient {
  const client = factory.getClient(apiKey);

  return {
    async complete(req: AiCompletionRequest): Promise<string> {
      const model = client.getGenerativeModel({
        model: modelId,
        systemInstruction: req.systemPrompt,
      });

      const result = await model.generateContent(req.userContent);
      return result.response.text();
    },

    async testConnection(): Promise<boolean> {
      try {
        const model = client.getGenerativeModel({
          model: modelId,
        });
        const result = await model.generateContent("Say hi");
        // Force the response to ensure the API call completes
        await result.response.text();
        return true;
      } catch (err) {
        console.error("Gemini connection test failed:", err);
        throw err;
      }
    },
  };
}

export function clearGeminiProvider(): void {
  factory.clear();
}
