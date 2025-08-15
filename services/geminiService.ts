import { GoogleGenAI } from "@google/genai";
import { Message, User } from '../types';

let ai: GoogleGenAI | undefined;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("Gemini API key not found. Smart features will be disabled. Make sure to set the API_KEY environment variable.");
}

// --- Rate Limiting State ---
let isRateLimited = false;
let rateLimitResetTime = 0;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 1 minute

const handleApiError = (error: any) => {
    console.error("Gemini API Error:", error);
    const errorMessage = typeof error?.message === 'string' ? error.message : JSON.stringify(error);
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        if (!isRateLimited) { // Only log the warning once
            console.warn(`Gemini API rate limit exceeded. Disabling AI features for ${RATE_LIMIT_COOLDOWN_MS / 1000} seconds.`);
            isRateLimited = true;
            rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        }
    }
};

const checkRateLimit = (): boolean => {
    if (isRateLimited && Date.now() < rateLimitResetTime) {
        return true; // Still rate-limited
    }
    if (isRateLimited && Date.now() >= rateLimitResetTime) {
        console.log("Gemini API rate limit cooldown finished. Re-enabling AI features.");
        isRateLimited = false; // Cooldown finished
    }
    return false;
};
// --- End Rate Limiting State ---


const formatConversation = (messages: Message[], contacts: User[], currentUser: User): string => {
  return messages.map(msg => {
    const sender = msg.senderId === currentUser.id ? currentUser : contacts.find(c => c.id === msg.senderId);
    return `${sender ? sender.name : 'Unknown User'}: ${msg.content}`;
  }).join('\n');
};

export const getSmartReplies = async (
  messages: Message[],
  contacts: User[],
  currentUser: User
): Promise<string[]> => {
  if (!ai) {
      return ["Can't connect to AI", "Try again later", "Okay"];
  }
  if (checkRateLimit()) {
      console.warn("getSmartReplies skipped due to rate limiting.");
      return [];
  }
  
  const conversationHistory = formatConversation(messages, contacts, currentUser);

  const prompt = `
    Based on the following conversation, suggest three distinct, short, and natural-sounding replies for "${currentUser.name}".
    Each reply should be a complete sentence and appropriate for an instant message.
    Do not add any prefixes, numbering, or quotation marks. Return the three replies as a JSON array of strings.

    Conversation:
    ${conversationHistory}

    JSON Output format:
    ["Reply 1", "Reply 2", "Reply 3"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedReplies: unknown = JSON.parse(jsonStr);

    if (Array.isArray(parsedReplies) && parsedReplies.every(item => typeof item === 'string')) {
      return parsedReplies;
    }
    
    console.error("Gemini API returned an unexpected format:", parsedReplies);
    return [];

  } catch (error) {
    handleApiError(error);
    return [];
  }
};

export const generateAvatar = async (prompt: string): Promise<string> => {
    if (!ai) {
        throw new Error("API key not configured.");
    }
    if (checkRateLimit()) {
        throw new Error("AI features are temporarily unavailable due to high demand. Please try again in a minute.");
    }
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `A circular profile picture for a chat app. A clean, modern, vector-style illustration of: ${prompt}`,
            config: { numberOfImages: 1, outputMimeType: 'image/png' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        handleApiError(error);
        console.error("Error generating avatar from Gemini:", error);
        throw error;
    }
};

export const generateMeetingNotes = async (
    messages: Message[],
    contacts: User[],
    currentUser: User
): Promise<string> => {
    if (!ai) {
        return "AI features are disabled. Please configure your API key.";
    }
    if (checkRateLimit()) {
        return "AI features are temporarily unavailable. Please try again in a minute.";
    }

    const conversationHistory = formatConversation(messages.filter(m => m.type === 'text' && !m.isDeleted), contacts, currentUser);

    if (!conversationHistory.trim()) {
        return "There's not enough conversation to generate notes.";
    }

    const prompt = `
        You are an expert meeting assistant. Your task is to analyze the following meeting transcript and generate concise, well-structured notes.
        The notes should include:
        1.  **Key Discussion Points**: A brief summary of the main topics discussed.
        2.  **Decisions Made**: A clear list of any decisions that were reached.
        3.  **Action Items**: A list of tasks assigned to individuals, formatted as "[Assignee Name]: [Task Description]".

        Transcript:
        ${conversationHistory}

        Please provide a clean, readable output without any extra commentary.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        handleApiError(error);
        return "Sorry, I was unable to generate the meeting notes at this time.";
    }
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
    if (!ai) {
        return "AI features are disabled.";
    }
     if (!text.trim()) {
        return "";
    }
    if (checkRateLimit()) {
        console.warn(`translateText to ${targetLang} skipped due to rate limiting.`);
        return "Translation unavailable (rate limit).";
    }

    const prompt = `Translate this English phrase to ${targetLang}: "${text}". Provide ONLY the direct translation, with no alternatives or explanations. Wrap the translated text in markdown bold tags, like this: **Translation Here**.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2
            }
        });
        return response.text;
    } catch (error) {
        handleApiError(error);
        console.error(`Error translating text to ${targetLang}:`, error);
        return `Translation Error`;
    }
};