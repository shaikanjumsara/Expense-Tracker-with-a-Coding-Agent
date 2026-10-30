import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'expense-tracker-transactions-v1'

const defaultTransactions = [
  { id: 't1', type: 'income', category: 'Salary', description: 'Monthly salary', amount: 4200, date: '2026-10-01' },
  { id: 't2', type: 'expense', category: 'Housing', description: 'Rent payment', amount: 1480, date: '2026-10-03' },
  { id: 't3', type: 'expense', category: 'Food', description: 'Groceries', amount: 320, date: '2026-10-08' },
  { id: 't4', type: 'expense', category: 'Transport', description: 'Fuel and commute', amount: 170, date: '2026-10-12' },
]

const categoryOptions = {
  expense: ['Food', 'Housing', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

function App() {
  const [transactions, setTransactions] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultTransactions
    }

    const savedTransactions = window.localStorage.getItem(STORAGE_KEY)

    if (!savedTransactions) {
      return defaultTransactions
    }

    try {
      const parsed = JSON.parse(savedTransactions)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTransactions
    } catch {
      return defaultTransactions
    }
  })

  const [filter, setFilter] = useState('all')
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'Food',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

    const expenses = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    )

    return filter === 'all' ? sorted : sorted.filter((item) => item.type === filter)
  }, [filter, transactions])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleTypeChange = (event) => {
    const nextType = event.target.value
    setFormData((current) => ({
      ...current,
      type: nextType,
      category: categoryOptions[nextType][0],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const amount = Number(formData.amount)
    const description = formData.description.trim()

    if (!description || !amount || amount <= 0) {
      return
    }

    const newTransaction = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      type: formData.type,
      category: formData.category,
      description,
      amount,
      date: formData.date,
    }

    setTransactions((current) => [newTransaction, ...current])
    setFormData({
      type: formData.type,
      category: categoryOptions[formData.type][0],
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleDelete = (transactionId) => {
    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== transactionId),
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal finance</p>
          <h1>Expense tracker</h1>
        </div>
        <div className="balance-pill">
          <span>Balance</span>
          <strong>{formatCurrency(totals.balance)}</strong>
        </div>
      </header>

      <main className="dashboard">
        <section className="summary-grid">
          <article className="summary-card income-card">
            <span className="card-label">Income</span>
            <strong>{formatCurrency(totals.income)}</strong>
          </article>

          <article className="summary-card expense-card">
            <span className="card-label">Expenses</span>
            <strong>{formatCurrency(totals.expenses)}</strong>
          </article>

          <article className="summary-card net-card">
            <span className="card-label">Net</span>
            <strong>{formatCurrency(totals.balance)}</strong>
          </article>
        </section>

        <section className="content-grid">
          <form className="expense-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Add transaction</h2>
            </div>

            <div className="field-group radio-group">
              <label>
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleTypeChange}
                />
                Expense
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleTypeChange}
                />
                Income
              </label>
            </div>

            <div className="field-group">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g. Grocery run"
              />
            </div>

            <div className="field-row">
              <div className="field-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categoryOptions[formData.type].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="primary-btn">
              Save transaction
            </button>
          </form>

          <section className="transactions-panel">
            <div className="panel-header">
              <h2>Recent activity</h2>
              <div className="filter-bar" aria-label="Filter transactions">
                {['all', 'income', 'expense'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={filter === option ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilter(option)}
                  >
                    {option === 'all' ? 'All' : option}
                  </button>
                ))}
              </div>
            </div>

            <ul className="transaction-list">
              {filteredTransactions.length === 0 ? (
                <li className="empty-state">No transactions found for this filter.</li>
              ) : (
                filteredTransactions.map((transaction) => (
                  <li key={transaction.id} className="transaction-item">
                    <div className="transaction-copy">
                      <div className="transaction-heading">
                        <span className="transaction-type">{transaction.type}</span>
                        <h3>{transaction.description}</h3>
                      </div>
                      <div className="transaction-meta">
                        <span>{transaction.category}</span>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="transaction-actions">
                      <strong className={transaction.type === 'income' ? 'positive' : 'negative'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </strong>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(transaction.id)}
                        aria-label={`Delete ${transaction.description}`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
