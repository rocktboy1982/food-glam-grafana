import { SubmissionPayload } from '@/types/submission';

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRecipe(data: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  // Type guard
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { general: 'Invalid input' } };
  }

  const payload = data as Partial<SubmissionPayload>;

  // Title validation
  if (!payload.title) {
    errors.title = 'Title is required';
  } else if (payload.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (payload.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  // Description validation
  if (!payload.description) {
    errors.description = 'Description is required';
  } else if (payload.description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  } else if (payload.description.length > 5000) {
    errors.description = 'Description must not exceed 5000 characters';
  }

  // Ingredients validation
  if (!payload.ingredients || !Array.isArray(payload.ingredients)) {
    errors.ingredients = 'Ingredients must be an array';
  } else if (payload.ingredients.length === 0) {
    errors.ingredients = 'At least one ingredient is required';
  } else {
    payload.ingredients.forEach((ing, idx) => {
      if (!ing.name || typeof ing.name !== 'string' || ing.name.trim() === '') {
        errors[`ingredients.${idx}.name`] = 'Ingredient name is required';
      }
      if (!ing.quantity || typeof ing.quantity !== 'number' || ing.quantity <= 0) {
        errors[`ingredients.${idx}.quantity`] = 'Ingredient quantity must be positive';
      }
      if (!ing.unit || typeof ing.unit !== 'string' || ing.unit.trim() === '') {
        errors[`ingredients.${idx}.unit`] = 'Ingredient unit is required';
      }
    });
  }

  // Instructions validation
  if (!payload.instructions || !Array.isArray(payload.instructions)) {
    errors.instructions = 'Instructions must be an array';
  } else if (payload.instructions.length === 0) {
    errors.instructions = 'At least one instruction is required';
  } else {
    payload.instructions.forEach((inst, idx) => {
      if (!inst.instruction || typeof inst.instruction !== 'string' || inst.instruction.trim() === '') {
        errors[`instructions.${idx}.instruction`] = 'Instruction text is required';
      }
      if (inst.instruction && inst.instruction.length > 500) {
        errors[`instructions.${idx}.instruction`] = 'Each instruction must not exceed 500 characters';
      }
    });
  }

  // Time validations
  if (payload.prepTime === undefined || payload.prepTime === null) {
    errors.prepTime = 'Prep time is required';
  } else if (typeof payload.prepTime !== 'number' || payload.prepTime < 0 || payload.prepTime > 480) {
    errors.prepTime = 'Prep time must be between 0 and 480 minutes';
  }

  if (payload.cookTime === undefined || payload.cookTime === null) {
    errors.cookTime = 'Cook time is required';
  } else if (typeof payload.cookTime !== 'number' || payload.cookTime < 0 || payload.cookTime > 480) {
    errors.cookTime = 'Cook time must be between 0 and 480 minutes';
  }

  // Servings validation
  if (payload.servings === undefined || payload.servings === null) {
    errors.servings = 'Servings is required';
  } else if (typeof payload.servings !== 'number' || payload.servings < 1 || payload.servings > 100) {
    errors.servings = 'Servings must be between 1 and 100';
  }

  // Difficulty validation
  if (!payload.difficulty) {
    errors.difficulty = 'Difficulty is required';
  } else if (!['easy', 'medium', 'hard'].includes(payload.difficulty)) {
    errors.difficulty = 'Difficulty must be easy, medium, or hard';
  }

  // Tags validation
  if (!payload.tags) {
    errors.tags = 'At least one tag is required';
  } else if (!Array.isArray(payload.tags) || payload.tags.length === 0) {
    errors.tags = 'At least one tag is required';
  } else if (payload.tags.length > 10) {
    errors.tags = 'Maximum 10 tags allowed';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
