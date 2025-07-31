// src/app/(app)/revise/page.tsx
'use client';

// ... (keep all your existing imports and state definitions)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KeyRound, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { RevisionFeed } from '@/components/revise/RevisionFeed';
import { Topic } from '@/lib/ai/types';
import { encryptApiKey, decryptApiKey } from '@/lib/ai/crypto';

type ReviseView = 'SECURE_LOADING' | 'API_KEY' | 'TOPIC_INPUT' | 'FEED' | 'LOADING';

export default function RevisePage() {
    const [view, setView] = useState<ReviseView>('SECURE_LOADING');
    const [sessionKey, setSessionKey] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validatedTopic, setValidatedTopic] = useState<Topic | null>(null);

    // On mount, fetch the session key from the backend
    useEffect(() => {
        const initializeSession = async () => {
            try {
                const response = await fetch('/api/revise/get-session-key', { method: 'POST' });
                if (!response.ok) throw new Error("Could not establish a secure session.");
                
                const { sessionKey: key } = await response.json();
                setSessionKey(key);

                // Now that we have the session key, try to decrypt any stored API key
                const storedBlob = localStorage.getItem('gemini_api_key_blob_jeeforces');
                if (storedBlob) {
                    const { encryptedData, iv } = JSON.parse(storedBlob);
                    const decryptedKey = await decryptApiKey(encryptedData, iv, key);
                    if (decryptedKey) {
                        setApiKey(decryptedKey);
                        setView('TOPIC_INPUT'); // Key found and decrypted, go to topic input
                    } else {
                        setView('API_KEY'); // Decryption failed or no key, ask for it
                    }
                } else {
                    setView('API_KEY'); // No key stored, ask for it
                }
            } catch (error) {
                console.error(error);
                toast.error("Security Error", { description: "Could not initialize a secure session. Please refresh and try again." });
                setView('API_KEY'); // Fallback to asking for key
            }
        };
        initializeSession();
    }, []);

    const handleKeySave = async (rawApiKey: string) => {
        if (!sessionKey) {
            toast.error("Secure session not ready. Please wait.");
            return;
        }
        
        const trimmedKey = rawApiKey.trim();
        if (trimmedKey) {
            // Save new key: Encrypt and store
            const encryptedBlob = await encryptApiKey(trimmedKey, sessionKey);
            if (encryptedBlob) {
                localStorage.setItem('gemini_api_key_blob_jeeforces', JSON.stringify(encryptedBlob));
                setApiKey(trimmedKey);
                setView('TOPIC_INPUT');
                toast.success('API Key saved securely!');
            } else {
                toast.error("Encryption Failed", { description: "Could not securely save your API key." });
            }
        } else {
            // Empty input: Treat as "remove key"
            localStorage.removeItem('gemini_api_key_blob_jeeforces');
            setApiKey('');
            setView('API_KEY'); // Stay in API_KEY view (or change to 'TOPIC_INPUT' if you prefer)
            toast.success('API Key removed successfully!');
        }
    };

    const handleTopicValidation = async () => {
        if (!topicInput.trim()) {
            toast.error("Please enter a topic to revise.");
            return;
        }
        if (!apiKey) {
            toast.error("API key is missing. Please provide it first.");
            setView('API_KEY');
            return;
        }
        setIsValidating(true);
        try {
            const response = await fetch('/api/revise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Pass the decrypted API key with the request
                body: JSON.stringify({ action: 'validate_topic', userInput: topicInput, apiKey }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred during validation.");
            }
            const isValidValue = data.isValid === true || data.isValid === 'true';
            if (!isValidValue) {
                throw new Error(data.reason || "Invalid topic.");
            }

            const topic: Topic = { name: data.topicName, subject: data.subject };
            setValidatedTopic(topic);
            toast.success(`Let's revise: ${topic.name}`);

        } catch (error: any) {
            console.error(error);
            toast.error("Validation Failed", { description: error.message });
            setValidatedTopic(null);
        } finally {
            setIsValidating(false);
        }
    };

    // ... (rest of the component remains the same, e.g., any other handlers)

    if (validatedTopic) {
        return <RevisionFeed initialTopic={validatedTopic} apiKey={apiKey} />;
    }

    const renderContent = () => {
        switch (view) {
            case 'TOPIC_INPUT':
                return (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Wand2 className="h-6 w-6 text-primary" />
                                What do you want to conquer today?
                            </CardTitle>
                            <CardDescription>
                                Enter a specific topic, and our AI will craft an endless, adaptive learning loop just for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); handleTopicValidation(); }} className="flex flex-col gap-4">
                                <Input
                                    placeholder="e.g., 'Projectile Motion', 'SN1 Reactions'"
                                    value={topicInput}
                                    onChange={(e) => setTopicInput(e.target.value)}
                                    className="text-base"
                                />
                                <Button type="submit" size="lg" disabled={isValidating}>
                                    {isValidating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                    Start Revision Loop
                                </Button>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => { 
                                        localStorage.removeItem('gemini_api_key_blob_jeeforces'); // Clear the old key blob
                                        setApiKey(''); 
                                        setView('API_KEY'); 
                                        toast.info('Ready to change API key. Enter a new one or leave blank to remove.');
                                    }}
                                >
                                    Change API Key
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                );
            case 'API_KEY':
                return (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <KeyRound className="h-6 w-6 text-primary" />
                                Provide Your Gemini API Key
                            </CardTitle>
                            <CardDescription>
                                To power this personalized revision feed, please provide your own Google Gemini API key. It will be encrypted and stored securely in your browser's local storage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter your Google Gemini API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <Button onClick={() => handleKeySave(apiKey)} className="w-full">Save Key</Button>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block text-center mt-2">
                                Get a free API key from Google AI Studio
                            </a>
                        </CardContent>
                    </Card>
                );
            case 'SECURE_LOADING':
            default:
                return (
                    <Card className="shadow-lg">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p>Initializing secure session...</p>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                {renderContent()}
            </motion.div>
        </div>
    );
}