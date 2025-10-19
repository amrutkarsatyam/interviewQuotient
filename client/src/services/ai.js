// client/src/services/ai.js
import groq from "../services/groq";

export const fetchQuestionsFromAI = async (jobDescription, interviewType) => {
  const prompt = `
    Based on the following job description, generate 4 diverse interview questions for a ${interviewType} interview.
    - 3 questions should be verbal.
    - 1 question should be a simple coding challenge if the role is technical, otherwise another verbal question.
    - Return a valid JSON object: { "questions": [{ "type": "verbal", "text": "..." }, { "type": "coding", "text": "..." }] }

    Job Description: "${jobDescription}"
  `;
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const responseJson = JSON.parse(completion.choices[0].message.content);
    return responseJson.questions;
  } catch (error) {
    console.error("Error fetching questions from AI:", error);
    throw new Error("Failed to generate questions. The AI service may be unavailable.");
  }
};

export const getAnalysisFromAI = async (analysisData) => {
  // NOTE: focusPercent was removed from the prompt
  const prompt = `
    Analyze the following interview performance for a candidate applying for a job with this description: "${analysisData.jobDescription}".
    The candidate's resume is: "${analysisData.resumeText}".

    Their known weaknesses are: [${analysisData.weaknesses.join(", ")}].
    
    Here are the questions, their answers, and how long they took to answer:
    ${JSON.stringify(analysisData.interviewData, null, 2)}

    Your task is to provide a comprehensive analysis. Return a single, valid JSON object with five keys:
    1. "narrative": A 3-4 paragraph constructive summary of the overall performance.
    2. "scores": An object with ratings out of 10 for: "Technical Accuracy", "Communication & Clarity", "Confidence Level", "Time Management".
    3. "strengths": An updated array of up to 5 strings listing key strengths demonstrated in THIS interview.
    4. "weaknesses": An updated array of up to 5 strings listing key areas for improvement.
    5. "resumeAnalysis": A concise, 2-3 sentence analysis of the resume against the job description.
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error getting analysis from AI:", error);
    throw new Error("Failed to generate analysis. The AI service may be unavailable.");
  }
};