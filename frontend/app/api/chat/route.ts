import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: google('gemini-2.5-flash'), // or 'gemini-1.5-pro', 'gemini-1.5-flash'
        system: 'You are a helpful assistant.',
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
            if (part.type === 'start') {
                return {
                    createdAt: Date.now(),
                    model: 'gemini-2.0-flash-exp',
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