import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GoalAnalysisInput {
  title: string;
  description: string;
  category?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface GoalAnalysisResult {
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_weeks: number;
  timeline: {
    phase: string;
    duration_weeks: number;
    description: string;
    key_activities: string[];
  }[];
  milestones: {
    title: string;
    description: string;
    week: number;
    dependencies?: string[];
  }[];
  recommendations: string[];
  prerequisites: string[];
  success_metrics: string[];
}

/**
 * Analyze a learning goal using Gemini and generate structured breakdown
 */
export async function analyzeGoal(input: GoalAnalysisInput): Promise<GoalAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `You are an expert learning coach and curriculum designer. Analyze the following learning goal and provide a detailed, structured breakdown.

Goal Title: ${input.title}
Goal Description: ${input.description}
Category: ${input.category || 'General'}
User Level: ${input.userLevel || 'Not specified'}

Please provide a comprehensive analysis in the following JSON format:

{
  "difficulty_level": "beginner|intermediate|advanced",
  "estimated_duration_weeks": number,
  "timeline": [
    {
      "phase": "Phase name",
      "duration_weeks": number,
      "description": "What happens in this phase",
      "key_activities": ["activity1", "activity2", "activity3"]
    }
  ],
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What the user will achieve",
      "week": number,
      "dependencies": ["prerequisite milestone titles if any"]
    }
  ],
  "recommendations": ["specific advice for success"],
  "prerequisites": ["what the user should know before starting"],
  "success_metrics": ["how to measure progress and completion"]
}

Guidelines:
- Break down complex goals into 3-6 manageable phases
- Create 5-12 specific, measurable milestones
- Estimate realistic timeframes based on typical learning curves
- Consider the user's specified level when setting difficulty
- Provide actionable recommendations and clear success metrics
- Make milestones progressive and build upon each other

Respond with only the JSON object, no additional text.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const fullPrompt = `You are an expert learning coach. Always respond with valid JSON only.

${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    
    // Remove markdown code block formatting if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse and validate the JSON response
    const analysis = JSON.parse(jsonContent) as GoalAnalysisResult;
    
    // Basic validation
    if (!analysis.difficulty_level || !analysis.estimated_duration_weeks || !analysis.timeline || !analysis.milestones) {
      throw new Error('Invalid analysis structure received from Gemini');
    }

    return analysis;
  } catch (error) {
    console.error('Gemini goal analysis error:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Gemini response as JSON');
    }
    
    throw new Error('Failed to analyze goal with Gemini');
  }
}

/**
 * Generate personalized learning recommendations based on user progress
 */
export async function generateLearningRecommendations(
  goalTitle: string,
  currentProgress: number,
  completedMilestones: string[],
  strugglingAreas: string[]
): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `As a learning coach, provide 3-5 specific, actionable recommendations for a student working on: "${goalTitle}"

Current Progress: ${currentProgress}% complete
Completed Milestones: ${completedMilestones.join(', ') || 'None yet'}
Struggling Areas: ${strugglingAreas.join(', ') || 'None identified'}

Provide recommendations as a JSON array of strings. Focus on:
- Next steps to maintain momentum
- Strategies to overcome struggling areas
- Resources or techniques to accelerate learning
- Motivation and mindset advice

Example format: ["Recommendation 1", "Recommendation 2", "Recommendation 3"]`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const fullPrompt = `You are a learning coach. Respond with a JSON array of recommendation strings only.

${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    
    // Remove markdown code block formatting if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(jsonContent) as string[];
  } catch (error) {
    console.error('Gemini recommendations error:', error);
    throw new Error('Failed to generate learning recommendations');
  }
}

/**
 * Generate context-aware chat responses for the AI tutor
 */
export async function generateTutorResponse(
  userMessage: string,
  goalContext: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  currentMilestone?: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const systemPrompt = `You are an AI tutor helping a student achieve their learning goal: "${goalContext}"

${currentMilestone ? `Current milestone: ${currentMilestone}` : ''}

Your role:
- Provide encouraging, supportive guidance
- Ask clarifying questions to understand their needs
- Offer specific, actionable advice
- Break down complex concepts into manageable steps
- Celebrate progress and help overcome obstacles
- Keep responses conversational and engaging

Guidelines:
- Be encouraging but realistic
- Provide specific examples when helpful
- Ask follow-up questions to gauge understanding
- Suggest practical exercises or next steps
- Keep responses focused and concise (2-3 paragraphs max)`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Build conversation context
    const conversationHistory = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}

Previous conversation:
${conversationHistory}

User: ${userMessage}`;

    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();
    
    if (!content) {
      throw new Error('No response from Gemini');
    }

    return content;
  } catch (error) {
    console.error('Gemini tutor response error:', error);
    throw new Error('Failed to generate tutor response');
  }
}
