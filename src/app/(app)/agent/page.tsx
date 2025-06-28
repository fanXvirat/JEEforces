'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KeyRound, Sparkles, Loader2, AlertTriangle, Wand2 } from 'lucide-react';
import { DynamicAnalysisRenderer } from './DynamicAnalysisRenderer';
import { toast } from 'sonner';

export default function AgentPage() {
    const [apiKey, setApiKey] = useState('');
    const [isKeySaved, setIsKeySaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setIsKeySaved(true);
        }
    }, []);

    const handleKeySave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setIsKeySaved(true);
            toast.success('API Key saved successfully!');
        } else {
            toast.error('Please enter a valid API key.');
        }
    };
    
    const handleKeyClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setIsKeySaved(false);
        setGeneratedHtml('');
        toast.info('API Key cleared.');
    }

    const handleGenerate = useCallback(async () => {
        if (!apiKey) {
            toast.error('API Key is missing.');
            return;
        }
        setIsLoading(true);
        setGeneratedHtml('');
        setError('');

        try {
            const response = await fetch('/api/agent/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey }),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(responseText || 'Failed to generate analysis.');
            }
            
            setGeneratedHtml(responseText);

        } catch (err: any) {
            console.error('Generation failed:', err);
            setError(err.message);
            toast.error("Generation Failed", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [apiKey]);
    
    if (!isKeySaved) {
        return (
            <div className="container mx-auto max-w-lg py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-6 w-6 text-primary" />
                            Provide Your Gemini API Key
                        </CardTitle>
                        <CardDescription>
                            This feature uses Google's Gemini model. Since JEEForces is a free platform, please bring your own API key to use the AI Agent. You can get a free key from Google AI Studio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter your Google Gemini API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <Button onClick={handleKeySave} className="w-full">Save Key</Button>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline block text-center mt-2">
                            Get a free API key here
                        </a>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Wand2 className="h-7 w-7 text-primary"/>
                    AI Performance Agent
                </h1>
                <Button variant="outline" size="sm" onClick={handleKeyClear}>Change API Key</Button>
            </div>
            
            {!generatedHtml && !isLoading && !error && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">Ready for your analysis?</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Click the button below to generate a personalized report on your strengths, weaknesses, and a tailored study plan.</p>
                    <Button onClick={handleGenerate} size="lg">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate My Analysis
                    </Button>
                </div>
            )}
            
            {isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4 border rounded-lg bg-muted/50">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">Force-Agent is thinking...</h2>
                    <p className="text-muted-foreground mt-2">Analyzing your performance and searching for the best resources. This may take a moment.</p>
                </div>
            )}

            {error && !isLoading && (
                 <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-semibold text-destructive">An Error Occurred</h2>
                    <p className="text-destructive/80 mt-2 mb-4">{error}</p>
                    <Button onClick={handleGenerate} variant="destructive">
                        Try Again
                    </Button>
                </div>
            )}

            {generatedHtml && !isLoading && (
                <div>
                  <DynamicAnalysisRenderer html={generatedHtml} />
                  <Button onClick={handleGenerate} className="mt-8 mx-auto block">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate Analysis
                  </Button>
                </div>
            )}
        </div>
    );
}