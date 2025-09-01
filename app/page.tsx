export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your financial activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 text-green-600 dark:text-green-400">💰</div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Balance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">$4,652.67</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 text-blue-600 dark:text-blue-400">📈</div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Income</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">$3,500.00</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 text-red-600 dark:text-red-400">📊</div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Spending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">$2,847.33</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 text-purple-600 dark:text-purple-400">💳</div>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">147</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">WALMART SUPERCENTER</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jan 20, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">-$125.43</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Groceries</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">PAYCHECK DEPOSIT</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jan 17, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">+$3,500.00</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Groceries</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$326.52</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Gas</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$180.00</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-900 dark:text-white">Restaurants</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">$245.80</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}