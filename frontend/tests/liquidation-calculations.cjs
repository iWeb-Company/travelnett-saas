const assert = require("node:assert/strict");
const {
  calculateCommissionableTotal,
  calculateLiquidationTotalsAfterExpenseEdit,
} = require("../lib/liquidationCalculations.ts");

assert.equal(calculateCommissionableTotal(530, [{ amount: 30 }, { amount: 150 }]), 350);
assert.equal(calculateCommissionableTotal(530, [{ amount: 30 }]), 500);
assert.equal(calculateCommissionableTotal(530, [{ amount: 30 }, { amount: 75 }]), 425);
assert.equal(calculateCommissionableTotal(100, [{ amount: 150 }]), 0);

assert.deepEqual(
  calculateLiquidationTotalsAfterExpenseEdit(
    530,
    350,
    [
      { name: "Gastos administrativos", amount: 30 },
      { name: "50% No Comisionable Habitación Single", amount: 150 },
    ],
    [{ name: "Gastos administrativos", amount: 30 }],
  ),
  { totalAmount: 530, commissionableTotal: 500 },
);
assert.deepEqual(
  calculateLiquidationTotalsAfterExpenseEdit(
    220,
    200,
    [{ name: "Gastos administrativos", amount: 20 }],
    [],
  ),
  { totalAmount: 200, commissionableTotal: 200 },
);
assert.deepEqual(
  calculateLiquidationTotalsAfterExpenseEdit(
    220,
    200,
    [{ name: "Gastos administrativos", amount: 20 }],
    [
      { name: "Gastos administrativos", amount: 20 },
      { name: "Extra", amount: 15 },
    ],
  ),
  { totalAmount: 235, commissionableTotal: 200 },
);
assert.deepEqual(
  calculateLiquidationTotalsAfterExpenseEdit(
    999,
    700,
    [
      { name: "Gastos administrativos", amount: 30 },
      { name: "50% No Comisionable Habitación Single", amount: 75 },
    ],
    [{ name: "Gastos administrativos", amount: 30 }],
  ),
  { totalAmount: 999, commissionableTotal: 775 },
);

console.log("liquidation calculations: commissionable total follows edited expenses");
