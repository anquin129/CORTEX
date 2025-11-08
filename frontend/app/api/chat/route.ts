import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, model }: { messages: UIMessage[]; model?: string } = await req.json();

    // Default to gemini if no model specified
    const selectedModel = model || 'gemini-2.0-flash-exp';

    // Map model IDs to actual model instances
    let modelInstance;

    if (selectedModel.startsWith('gpt-')) {
        modelInstance = openai(selectedModel);
    } else if (selectedModel.startsWith('claude-')) {
        modelInstance = anthropic(selectedModel);
    } else if (selectedModel.startsWith('gemini-')) {
        modelInstance = google(selectedModel);
    } else {
        // Fallback to gemini
        modelInstance = google('gemini-2.0-flash-exp');
    }

    const result = streamText({
        model: modelInstance,
        system: 'You are a helpful assistant.',
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
            if (part.type === 'start') {
                return {
                    createdAt: Date.now(),
                    model: selectedModel,
                };
            }
            if (part.type === 'finish') {
                return {
                    totalTokens: part.totalUsage.totalTokens,
                };
            }
        },
    });
}