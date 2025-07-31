// src/lib/ai/gemini.ts
import { GoogleGenAI, Type ,Modality} from "@google/genai";
import { Topic, CardContent, CardType, MemeContent, Comment } from "./types";



// --- Copy all the schema definitions (cardSchema, feedResponseSchema) from your geminiService.ts here ---
const cardSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique UUID for the card, e.g., 'c9a6c3d4-b8e0-4c1f-9b5a-7e3d1b4c6a9e'" },
        type: {
            type: Type.STRING,
            enum: Object.values(CardType),
            description: "The type of the revision card."
        },
        content: {
            type: Type.OBJECT,
            description: "The content of the card, structured according to its type.",
            properties: {
                // Concept Card
                title: { type: Type.STRING, description: "Title for a concept or a meme card. For memes, this is the funny caption.", nullable: true },
                explanation: { type: Type.STRING, description: "Explanation for a concept card", nullable: true },
                analogy: { type: Type.STRING, description: "Analogy for a concept card", nullable: true },
                // Problem Card
                problemStatement: { type: Type.STRING, description: "The statement of the problem", nullable: true },
                hint: { type: Type.STRING, description: "A short, one-sentence hint for the problem, without giving away the answer.", nullable: true },
                solution: { type: Type.STRING, description: "The detailed solution to the problem.", nullable: true },
                // Flashcard
                question: { type: Type.STRING, description: "The question for the flashcard or quiz", nullable: true },
                answer: { type: Type.STRING, description: "The answer to the flashcard", nullable: true },
                // Meme Card
                description: { type: Type.STRING, description: "A detailed, witty description of a meme visual. This will be used as a prompt for an image generator. CRITICAL: This description must create a purely visual gag. It MUST NOT contain any text, letters, or numbers to be rendered in the image. E.g. 'A goofy cartoon drawing of a serene, meditating student while chaos of erupts around him.'", nullable: true },
                // Mnemonic Card
                concept: { type: Type.STRING, description: "The concept the mnemonic is for", nullable: true },
                mnemonic: { type: Type.STRING, description: "The mnemonic itself", nullable: true },
                // True or False
                statement: { type: Type.STRING, description: "A statement that is either true or false.", nullable: true },
                isTrue: { type: Type.BOOLEAN, description: "Whether the statement is true.", nullable: true },
                // Sequence Sort
                instruction: { type: Type.STRING, description: "Instruction for the sequence sort game, e.g., 'Order the steps of this reaction'.", nullable: true },
                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For Sequence Sort, an array of items to be sorted. Provide them in a scrambled order.", nullable: true },
                sequenceSolution: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For Sequence Sort cards, an array of strings representing the correct order of items.", nullable: true },
                 // Fill in the Blank Card
                sentence: { type: Type.STRING, description: "A sentence with a '[BLANK]' placeholder.", nullable: true },
                answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of correct answers for the blank.", nullable: true },
                 // Quiz Card
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 options for a quiz question.", nullable: true },
                correctAnswerIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the options array.", nullable: true },
            }
        },
        comments: {
            type: Type.ARRAY,
            nullable: true,
            description: "An optional array of 2-3 funny, student-like comments related to THIS specific card's content. Make them relatable to the Indian JEE aspirant experience.",
            items: {
                type: Type.OBJECT,
                properties: {
                    username: { type: Type.STRING, description: "A witty, student-like username, e.g., 'SharmaJiKaBeta', 'TopperAnanya', 'LastBenchLegend'" },
                    text: { type: Type.STRING, description: "The comment text. Can include Hinglish." }
                },
                required: ['username', 'text']
            }
        }
    },
    required: ['id', 'type', 'content']
};

const feedResponseSchema = {
    type: Type.ARRAY,
    items: cardSchema,
};

// --- Copy all the exported functions (generateLearningLoopPrompt, generateMemeImage, etc.) from your geminiService.ts here ---
const generateLearningLoopPrompt = (topic: Topic, history: string[]): string => {
    const historyPrompt = history.length > 0
        ? `The user has already seen cards on these concepts: ${history.join(', ')}. Please generate a new set of cards that covers DIFFERENT aspects or MORE ADVANCED applications of the main topic. AVOID repeating these ideas.`
        : 'This is the first batch of cards for this topic.';

    return `You are "JEE-GPT", an expert AI tutor with a sharp, relatable sense of humor, creating an addictive, TikTok-style revision feed for Indian engineering aspirants. Your audience is smart, stressed, and loves inside jokes.

    Task: Generate a cohesive 15-card "Learning Loop" for the topic: "${topic.name}" from the subject "${topic.subject}".

    Core Strategy: A "Learning Loop" is a psychologically satisfying, narrative sequence. The goal is a highly engaging session, not a random list.
    1.  **Introduce:** Start with a clear CONCEPT card to explain a core idea.
    2.  **Verify:** Immediately follow up with a simple QUIZ, FILL_IN_THE_BLANK, or TRUE_OR_FALSE to check understanding.
    3.  **Apply:** Introduce a more challenging PROBLEM or a tactile SEQUENCE_SORT card to make the user apply the concept. For PROBLEM cards, ALWAYS provide a 'hint'.
    4.  **Reinforce:** Offer a FLASHCARD or a clever MNEMONIC to solidify the memory.
    5.  **Reward:** End the loop with a light-hearted, relevant MEME as a dopamine hit.
    
    Instructions:
    - Create variations of this 5-step loop to fill the 15-card feed. Mix the order slightly and use a wide variety of card types to keep it fresh.
    - ${historyPrompt}
    - CRITICAL: Ensure a rich variety of card types. You MUST use the new interactive types TRUE_OR_FALSE and SEQUENCE_SORT where appropriate. Avoid overusing simple types.
    - For EVERY card, ALSO include an optional 'comments' array with 2-3 witty, relatable, student-like comments about that specific card's content. Think about coaching center life, hostel struggles, last-minute revision, funny physics/chemistry/math concepts, parental pressure. Create clever usernames (e.g., 'KotaFactoryDropout', 'ConfusedCarl', 'PaneerForTopper').
    - For MEME cards, the 'title' is a witty caption (use Hinglish for flavor, like "Bhai, ye kya ho raha hai?"). The 'description' is a prompt for an IMAGE generator for a purely VISUAL gag. It MUST NOT contain any text to be rendered in the image.
    - For SEQUENCE_SORT cards, 'items' should be the scrambled list, and 'sequenceSolution' should be an array of strings in the correct order.
    
    Constraints:
    - CRITICAL: Assign a unique UUID string to the 'id' field for every single card object.
    - Respond ONLY with a valid JSON array of 15 card objects matching the provided schema.
    - Keep all text concise, punchy, and mobile-friendly.
    `;
};


const generateMemeImage = async (description: string,apiKey:string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: description,
      config: {
        responseModalities: ["TEXT", "IMAGE"], // TEXT is optional
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      // @ts-ignore – inlineData is not yet in the public types
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return ""; // fallback
  } catch (err) {
    console.error("Image gen error:", err);
    return "";
  }
};


export const generateRevisionFeed = async (topic: Topic, history: string[],apiKey: string): Promise<CardContent[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = generateLearningLoopPrompt(topic, history);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: feedResponseSchema,
                temperature: 1.0,
            },
        });
        
        const jsonText = response.text;
        let generatedCards = JSON.parse(jsonText ?? '{}') as CardContent[];
        
        if (!Array.isArray(generatedCards)) {
            throw new Error("API did not return a valid array.");
        }
        
        generatedCards = generatedCards.filter(card => card && card.id && card.type && card.content);

        // Post-process to generate images for meme cards sequentially to avoid rate limiting
        const processedCards: CardContent[] = [];
        for (const card of generatedCards) {
            if (card.type === CardType.MEME) {
                const memeContent = card.content as MemeContent;
                if (memeContent.description) {
                    const imageUrl = await generateMemeImage(memeContent.description, apiKey);
                    processedCards.push({ ...card, content: { ...memeContent, imageUrl } });
                } else {
                     processedCards.push(card);
                }
            } else {
                processedCards.push(card);
            }
        }

        return processedCards;

    } catch (error) {
        
        console.error("Error generating content from Gemini:", error);
        throw new Error("Failed to parse or fetch data from AI service.");
    }
};

export const validateAndStructureTopic = async (userInput: string,apiKey:string): Promise<Topic> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `A student wants to revise for the JEE (Indian engineering entrance exam) on the topic: "${userInput}".

Your task is to validate and structure this topic.

1.  Analyze the input. Is it a reasonably specific and valid topic from the JEE syllabus of Physics, Chemistry, or Mathematics?
2.  If it is valid and specific (e.g., "Projectile Motion", "Markovnikov's Rule"), correct any minor typos and identify the subject.
3.  If it is too broad (e.g., "Physics", "Algebra") or not a real JEE topic (e.g., "History"), it is invalid.

Respond ONLY with a JSON object in the following format:
- For a valid topic: { "isValid": true, "topicName": "Corrected/Specific Topic Name", "subject": "Physics" | "Chemistry" | "Mathematics" }
- For an invalid topic: { "isValid": false, "reason": "Explain briefly why it's invalid, e.g., 'This topic is too broad. Please specify a concept like 'Newton's Laws of Motion'.' or 'This does not seem to be a standard JEE topic.'" }`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            isValid: { type: Type.BOOLEAN },
            topicName: { type: Type.STRING, nullable: true },
            subject: { type: Type.STRING, nullable: true },
            reason: { type: Type.STRING, nullable: true },
        },
        required: ['isValid']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });
        const result = JSON.parse(response.text ?? '{}');

        if (result.isValid) {
            return { name: result.topicName, subject: result.subject };
        } else {
            throw new Error(result.reason || "Invalid topic provided.");
        }

    } catch (error:any) {
        if (error.message?.includes("API key not valid") || error.status === 401 || error.status === 403) {
            throw new Error("Invalid Gemini API key. Please check it and try again.");
        }
        throw new Error("Could not validate the topic. Please try again: " + (error.message || "Unknown error"));
    }
};


export const generateExplanation = async (
    topic: Topic,
    question: string,
    incorrectAnswer: string,
    correctAnswer: string,
    apiKey: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are "JEE-GPT", an expert AI tutor for Indian engineering aspirants. Be encouraging, clear, and concise for a small screen.

A student is studying the topic "${topic.name}". They answered a question incorrectly.

Question: "${question}"
Their Answer: "${incorrectAnswer}"
Correct Answer: "${correctAnswer}"

Provide a step-by-step explanation of the correct solution. Start by acknowledging their attempt positively. Focus on the core concept they misunderstood. Keep the language simple and direct. Use basic markdown for formatting (e.g., **bold** for emphasis, newlines for paragraphs, and \`code\` for formulas).`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.4,
            },
        });
        return response.text ?? "";
    } catch (error) {
        console.error("Error generating explanation from Gemini:", error);
        return "Sorry, I couldn't generate an explanation at this moment. Please try again later.";
    }
};