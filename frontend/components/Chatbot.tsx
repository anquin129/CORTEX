'use client';
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorLogoGroup,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
    PromptInput,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputFooter,
    PromptInputProvider,
    PromptInputSpeechButton,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {useEffect, useRef, useState} from "react";
import {CheckIcon} from "lucide-react";

const models = [
    {
        id: "gpt-4o",
        name: "GPT-4o",
        chef: "OpenAI",
        chefSlug: "openai",
        providers: ["openai", "azure"],
    },
    {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        chef: "OpenAI",
        chefSlug: "openai",
        providers: ["openai", "azure"],
    },
    {
        id: "claude-opus-4-20250514",
        name: "Claude 4 Opus",
        chef: "Anthropic",
        chefSlug: "anthropic",
        providers: ["anthropic", "azure", "google", "amazon-bedrock"],
    },
    {
        id: "claude-sonnet-4-20250514",
        name: "Claude 4 Sonnet",
        chef: "Anthropic",
        chefSlug: "anthropic",
        providers: ["anthropic", "azure", "google", "amazon-bedrock"],
    },
    {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        chef: "Google",
        chefSlug: "google",
        providers: ["google"],
    },
];

export default function Chatbot() {
    const [model, setModel] = useState(models[0].id);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // 'idle', 'submitted', 'streaming', 'error'
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const selectedModelData = models.find((m) => m.id === model);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, status]);

    const sendMessage = async (message) => {
        const hasText = Boolean(message.text);
        const hasAttachments = Boolean(message.files?.length);

        if (!(hasText || hasAttachments)) {
            return;
        }

        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: [{ type: 'text', text: message.text }],
            metadata: { createdAt: Date.now() }
        };

        // Handle file attachments
        if (message.files?.length) {
            message.files.forEach(file => {
                userMessage.parts.push({
                    type: 'file',
                    mediaType: file.type,
                    url: URL.createObjectURL(file),
                    filename: file.name
                });
            });
        }

        setMessages(prev => [...prev, userMessage]);
        setStatus('submitted');
        setError(null);

        try {
            const encodedQuestion = encodeURIComponent(message.text);
            const response = await fetch(`http://127.0.0.1:8000/query?question=${encodedQuestion}`);

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            // Add assistant message
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                parts: [{ type: 'text', text: data.answer || data.response || JSON.stringify(data) }],
                metadata: {
                    createdAt: Date.now(),
                    model: model
                }
            };

            setMessages(prev => [...prev, assistantMessage]);
            setStatus('idle');
        } catch (err) {
            setError(err);
            setStatus('error');
        }
    };

    const handleSubmit = (message) => {
        sendMessage(message);
    };

    const handleDelete = (id) => {
        setMessages(messages.filter(message => message.id !== id));
    };

    const reload = () => {
        if (messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMessage) {
                const textPart = lastUserMessage.parts.find(p => p.type === 'text');
                if (textPart) {
                    sendMessage({ text: textPart.text });
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border">
            {/* Header */}
            <div className="border-b px-4 py-3 bg-card rounded-t-lg">
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">
                    Using {selectedModelData?.name || 'AI Model'}
                </p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-sm">Start a conversation</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        {message.parts.map((part, index) => {
                                            if (part.type === 'text') {
                                                return <p key={index} className="text-sm whitespace-pre-wrap">{part.text}</p>;
                                            }
                                            if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                                                return <img key={index} src={part.url} alt={part.filename} className="max-w-full rounded mt-2" />;
                                            }
                                            return null;
                                        })}

                                        {message.metadata && (
                                            <div className="mt-2 text-xs opacity-70">
                                                {message.metadata.totalTokens && (
                                                    <span>{message.metadata.totalTokens} tokens</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDelete(message.id)}
                                        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                                        title="Delete message"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {(status === 'submitted' || status === 'streaming') && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                            <div className="flex items-center gap-3">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <p className="text-sm">An error occurred.</p>
                            <button
                                onClick={reload}
                                className="mt-2 text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Component */}
            <div className="border-t bg-card rounded-b-lg">
                <PromptInputProvider>
                    <PromptInput onSubmit={handleSubmit}>
                        <PromptInputAttachments>
                            {(attachment) => <PromptInputAttachment data={attachment} />}
                        </PromptInputAttachments>
                        <PromptInputBody>
                            <PromptInputTextarea ref={textareaRef} />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools>
                                <PromptInputSpeechButton textareaRef={textareaRef} />
                                <ModelSelector
                                    onOpenChange={setModelSelectorOpen}
                                    open={modelSelectorOpen}
                                >
                                    <ModelSelectorTrigger asChild>
                                        <PromptInputButton>
                                            {selectedModelData?.chefSlug && (
                                                <ModelSelectorLogo
                                                    provider={selectedModelData.chefSlug}
                                                />
                                            )}
                                            {selectedModelData?.name && (
                                                <ModelSelectorName>
                                                    {selectedModelData.name}
                                                </ModelSelectorName>
                                            )}
                                        </PromptInputButton>
                                    </ModelSelectorTrigger>
                                    <ModelSelectorContent>
                                        <ModelSelectorInput placeholder="Search models..." />
                                        <ModelSelectorList>
                                            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                                            {["OpenAI", "Anthropic", "Google"].map((chef) => (
                                                <ModelSelectorGroup heading={chef} key={chef}>
                                                    {models
                                                        .filter((m) => m.chef === chef)
                                                        .map((m) => (
                                                            <ModelSelectorItem
                                                                key={m.id}
                                                                onSelect={() => {
                                                                    setModel(m.id);
                                                                    setModelSelectorOpen(false);
                                                                }}
                                                                value={m.id}
                                                            >
                                                                <ModelSelectorLogo provider={m.chefSlug} />
                                                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                                                <ModelSelectorLogoGroup>
                                                                    {m.providers.map((provider) => (
                                                                        <ModelSelectorLogo
                                                                            key={provider}
                                                                            provider={provider}
                                                                        />
                                                                    ))}
                                                                </ModelSelectorLogoGroup>
                                                                {model === m.id && (
                                                                    <CheckIcon className="ml-auto size-4" />
                                                                )}
                                                            </ModelSelectorItem>
                                                        ))}
                                                </ModelSelectorGroup>
                                            ))}
                                        </ModelSelectorList>
                                    </ModelSelectorContent>
                                </ModelSelector>
                            </PromptInputTools>
                            <PromptInputSubmit status={status} />
                        </PromptInputFooter>
                    </PromptInput>
                </PromptInputProvider>
            </div>
        </div>
    );
}