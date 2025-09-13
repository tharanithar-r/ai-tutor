import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }).max(100, { message: 'Password must be less than 100 characters' }),
  name: z.string().min(1, { message: 'Name is required' }).max(100, { message: 'Name must be less than 100 characters' }).optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// Goal validation schemas
export const createGoalSchema = z.object({
  title: z.string().min(1, { message: 'Goal title is required' }).max(200, { message: 'Goal title must be less than 200 characters' }),
  description: z.string().max(1000, { message: 'Goal description must be less than 1000 characters' }).optional(),
  category: z.string().max(50, { message: 'Category must be less than 50 characters' }).optional(),
  targetDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, { message: 'Goal title is required' }).max(200, { message: 'Goal title must be less than 200 characters' }).optional(),
  description: z.string().max(1000, { message: 'Goal description must be less than 1000 characters' }).optional(),
  category: z.string().max(50, { message: 'Category must be less than 50 characters' }).optional(),
  targetDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Milestone validation schemas
export const createMilestoneSchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  title: z.string().min(1, { message: 'Milestone title is required' }).max(200, { message: 'Milestone title must be less than 200 characters' }),
  description: z.string().max(500, { message: 'Milestone description must be less than 500 characters' }).optional(),
  targetDate: z.string().datetime().optional(),
  order: z.number().int().nonnegative({ message: 'Order must be a non-negative integer' }).optional(),
  dependencies: z.array(z.number().int().positive()).optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1, { message: 'Milestone title is required' }).max(200, { message: 'Milestone title must be less than 200 characters' }).optional(),
  description: z.string().max(500, { message: 'Milestone description must be less than 500 characters' }).optional(),
  targetDate: z.string().datetime().optional(),
  order: z.number().int().nonnegative({ message: 'Order must be a non-negative integer' }).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  dependencies: z.array(z.number().int().positive()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Check-in validation schemas
export const createCheckInSchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  notes: z.string().max(1000, { message: 'Check-in notes must be less than 1000 characters' }).optional(),
  progress: z.number().min(0).max(100).optional(),
  mood: z.enum(['excited', 'happy', 'neutral', 'challenged', 'frustrated']).optional(),
});

export const updateCheckInSchema = z.object({
  notes: z.string().max(1000, { message: 'Check-in notes must be less than 1000 characters' }).optional(),
  progress: z.number().min(0).max(100).optional(),
  mood: z.enum(['excited', 'happy', 'neutral', 'challenged', 'frustrated']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Chat validation schemas
export const createChatMessageSchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  message: z.string().min(1, { message: 'Message is required' }).max(2000, { message: 'Message must be less than 2000 characters' }),
  context: z.enum(['goal_setup', 'milestone_planning', 'progress_check', 'motivation', 'problem_solving']).optional(),
});

export const getChatHistorySchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

// Progress tracking validation schemas
export const recordProgressSchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  value: z.number().min(0).max(100),
  notes: z.string().max(500, { message: 'Progress notes must be less than 500 characters' }).optional(),
});

// AI analysis validation schemas
export const requestAIAnalysisSchema = z.object({
  goalId: z.number().int().positive({ message: 'Goal ID must be a positive integer' }),
  type: z.enum(['goal_breakdown', 'milestone_suggestions', 'progress_insights', 'motivational_message']),
  context: z.string().max(2000, { message: 'Context must be less than 2000 characters' }).optional(),
});

// Utility function to validate and parse data
export async function validateData<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(JSON.stringify({ errors }));
    }
    throw error;
  }
}

// Validation error type
export interface ValidationError {
  errors: Array<{
    path: string;
    message: string;
  }>;
}

// Export types for use in API handlers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
export type UpdateCheckInInput = z.infer<typeof updateCheckInSchema>;
export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
export type GetChatHistoryInput = z.infer<typeof getChatHistorySchema>;
export type RecordProgressInput = z.infer<typeof recordProgressSchema>;
export type RequestAIAnalysisInput = z.infer<typeof requestAIAnalysisSchema>;
