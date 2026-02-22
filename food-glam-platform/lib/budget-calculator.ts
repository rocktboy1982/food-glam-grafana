// /lib/budget-calculator.ts

export function calculateMealPlanBudget(entries: { costPerServing: number }[]): number {
  return entries.reduce((total, entry) => total + entry.costPerServing, 0);
}

export function calculateWeeklyBudget(mealPlan: { entries: { costPerServing: number }[] }) {
  return calculateMealPlanBudget(mealPlan.entries);
}

export function compareToBudget(actual: number, goal: number): string {
  if (actual < goal) return 'Under budget';
  if (actual === goal) return 'Exact budget';
  return 'Over budget';
}

// Example usage:
// const weeklyBudget = calculateWeeklyBudget({ entries: [{ costPerServing: 5.99 }, { costPerServing: 7.99 }] });
// console.log(weeklyBudget); // 13.98
// console.log(compareToBudget(13.98, 15)); // 'Under budget'