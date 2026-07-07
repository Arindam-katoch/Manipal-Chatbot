import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATED_AI_API_KEY || '',
});

export async function embedWithBackoff(text: string, retries = 5, initialDelay = 1000): Promise<number[]> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: text,
      });
      return embedding;
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.statusCode === 429 || 
                    (error?.message && error.message.includes('429')) ||
                    (error?.message && error.message.includes('Quota exceeded'));
      
      if (is429 && i < retries - 1) {
        console.warn(`429 rate limit encountered. Retrying in ${delay}ms (attempt ${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to generate embedding after maximum retries');
}
