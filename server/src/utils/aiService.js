import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeConsultation = async (chatHistory) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert clinical scribe. Analyze the following consultation chat history and generate a professional clinical brief.
      
      Format the output in clean Markdown with the following sections:
      1. **Consultation Summary**: High-level overview.
      2. **Reported Symptoms**: List of symptoms mentioned by the patient.
      3. **Clinical Observations**: Key medical insights or red flags identified.
      4. **Suggested Next Steps**: Possible tests, medications, or referrals.
      
      Chat History:
      ${chatHistory}
      
      Generate a concise, professional, and structured report.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Failed to generate AI clinical brief');
  }
};
