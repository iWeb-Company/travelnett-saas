export interface NonCommissionableExpense {
  name?: string | null;
  amount?: number | null;
}

function isEmbeddedPackageExpense(expense: NonCommissionableExpense): boolean {
  const name = expense.name || "";
  return (
    name === "Adicional cama (no comisionable)" ||
    (name.includes("50% No Comisionable") && name.includes("Single"))
  );
}

function sumExpenses(expenses: NonCommissionableExpense[]): number {
  return expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0,
  );
}

export function calculateCommissionableTotal(
  totalAmount: number,
  expenses: NonCommissionableExpense[],
): number {
  return Math.max(0, totalAmount - sumExpenses(expenses));
}

export function calculateLiquidationTotalsAfterExpenseEdit(
  currentTotalAmount: number,
  currentCommissionableTotal: number,
  previousExpenses: NonCommissionableExpense[],
  nextExpenses: NonCommissionableExpense[],
): { totalAmount: number; commissionableTotal: number } {
  const previousAdditiveExpenses = sumExpenses(
    previousExpenses.filter((expense) => !isEmbeddedPackageExpense(expense)),
  );
  const nextAdditiveExpenses = sumExpenses(
    nextExpenses.filter((expense) => !isEmbeddedPackageExpense(expense)),
  );
  const additiveDelta = nextAdditiveExpenses - previousAdditiveExpenses;
  const expenseDelta = sumExpenses(nextExpenses) - sumExpenses(previousExpenses);

  return {
    totalAmount: currentTotalAmount + additiveDelta,
    commissionableTotal: Math.max(
      0,
      currentCommissionableTotal + additiveDelta - expenseDelta,
    ),
  };
}
