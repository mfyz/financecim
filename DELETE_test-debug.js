// Test date calculation
const now = new Date('2025-09-28')
const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

console.log('Current date:', now.toISOString())
console.log('dateFrom:', dateFrom)
console.log('dateTo:', dateTo)

const startDate = new Date(dateFrom)
const endDate = new Date(dateTo)
const monthsInPeriod = Math.max(1,
  (endDate.getFullYear() - startDate.getFullYear()) * 12 +
  (endDate.getMonth() - startDate.getMonth()) + 1
)

console.log('startDate:', startDate.toISOString())
console.log('endDate:', endDate.toISOString())
console.log('startDate.getMonth():', startDate.getMonth())
console.log('endDate.getMonth():', endDate.getMonth())
console.log('monthsInPeriod:', monthsInPeriod)

// Test budget calculation
const monthlyBudget = 500
const totalSpent = 200.50
const periodBudget = monthlyBudget * monthsInPeriod
const budgetUtilization = (totalSpent / periodBudget) * 100

console.log('monthlyBudget:', monthlyBudget)
console.log('periodBudget:', periodBudget)
console.log('totalSpent:', totalSpent)
console.log('budgetUtilization:', budgetUtilization)