'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Chatbot() {
    const { messages, sendMessage, status, stop, reload, error, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });

    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && status === 'ready') {
            sendMessage({ text: input });
            setInput('');
        }
    };

    const handleDelete = (id) => {
        setMessages(messages.filter(message => message.id !== id));
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border">
            {/* Header */}
            <div className="border-b px-4 py-3 bg-card rounded-t-lg">
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">Ask me anything</p>
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
                                <button
                                    onClick={stop}
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Stop
                                </button>
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
            </div>

            {/* Input Form */}
            <div className="border-t p-4 bg-card rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={status !== 'ready'}
                        className="flex-1 px-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    />
                    <button
                        type="submit"
                        disabled={status !== 'ready' || !input.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}