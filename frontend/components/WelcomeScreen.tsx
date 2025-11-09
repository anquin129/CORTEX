'use client';

import { useState, useEffect } from 'react';

interface WelcomeScreenProps {
    onComplete: () => void;
}

const getRandomChar = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    return chars[Math.floor(Math.random() * chars.length)];
};

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
    const [showCursor, setShowCursor] = useState(true);
    const [displayText, setDisplayText] = useState('');
    const [phase, setPhase] = useState<'initial' | 'text' | 'complete'>('initial');
    
    const text = 'cortex';
    const randomCycles = 5; // Number of random characters to cycle through per letter (reduced for faster typing)
    const randomCycleDelay = 20; // Delay between random character changes (ms) - faster
    const letterDelay = 80; // Delay after revealing actual letter before next letter - faster typing speed

    useEffect(() => {
        if (phase === 'initial') {
            // Phase 1: 3 cursor blinks before text (1.5s total - 3 blinks)
            let blinkCount = 0;
            const cursorInterval = setInterval(() => {
                setShowCursor(prev => !prev);
                blinkCount++;
                if (blinkCount >= 6) { // 3 full blinks (on/off = 2 states each)
                    clearInterval(cursorInterval);
                    setShowCursor(true);
                    setPhase('text');
                }
            }, 250); // 250ms per state change = 500ms per blink

            return () => clearInterval(cursorInterval);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'text') {
            let currentIndex = 0;
            let randomCycleCount = 0;
            let delayCount = 0;
            const delayCycles = Math.floor(letterDelay / randomCycleDelay);
            
            const revealInterval = setInterval(() => {
                if (currentIndex >= text.length) {
                    clearInterval(revealInterval);
                    // After all letters are revealed, start 3 more blinks
                    let blinkCount = 0;
                    const textBlinkInterval = setInterval(() => {
                        setShowCursor(prev => !prev);
                        blinkCount++;
                        if (blinkCount >= 6) { // 3 full blinks
                            clearInterval(textBlinkInterval);
                            setPhase('complete');
                        }
                    }, 250);
                    return;
                }

                // Add delay after revealing a letter
                if (delayCount > 0) {
                    delayCount--;
                    return;
                }

                // Cycle through random characters before revealing actual letter
                if (randomCycleCount < randomCycles) {
                    const revealedSoFar = text.slice(0, currentIndex);
                    const randomChar = getRandomChar();
                    setDisplayText(revealedSoFar + randomChar);
                    randomCycleCount++;
                } else {
                    // Reveal the actual letter
                    setDisplayText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                    randomCycleCount = 0;
                    delayCount = delayCycles; // Wait before starting next letter's random cycle
                }
            }, randomCycleDelay);

            return () => clearInterval(revealInterval);
        }
    }, [phase, randomCycles, randomCycleDelay, letterDelay, text]);

    useEffect(() => {
        if (phase === 'complete') {
            // Small delay before transitioning
            const timeout = setTimeout(() => {
                onComplete();
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [phase, onComplete]);

    return (
        <div className="fixed inset-0 bg-background text-foreground flex items-center justify-center z-50" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
            <div className="text-4xl md:text-6xl tracking-wider">
                <span>{displayText}</span>
                <span className={`ml-1 transition-opacity duration-75 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>
                    ▊
                </span>
            </div>
        </div>
    );
}

