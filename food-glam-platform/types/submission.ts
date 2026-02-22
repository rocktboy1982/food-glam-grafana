// Recipe Submission & Moderation Types

export type RecipeStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: number; // minutes
}

export interface RecipeSubmission {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  cuisine?: string;
  coverImage?: string;
  authorId?: string;
  status: RecipeStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface SubmissionPayload {
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  cuisine?: string;
  coverImage?: string;
}

export interface ModerationAction {
  id: string;
  recipeId: string;
  action: 'approve' | 'reject';
  reason?: string;
  moderatorId?: string;
  createdAt: Date;
}

export interface SubmissionResponse {
  success: boolean;
  id?: string;
  message: string;
  status?: RecipeStatus;
  errors?: Record<string, string>;
}
