import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { Plus, Receipt, TrendingUp } from 'lucide-react'

const COLORS = {
  food: '#fb923c', transport: '#5b8def', stay: '#a855f7',
  activity: '#34d399', other: '#6b7280'
}

export default function BudgetPanel({ tripId, role, currency = 'USD', budgetLimit = 0 }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title:'', amount:'', category:'food', date: new Date().toISOString().split('T')[0] })
  const set = f => e => setForm(p => ({...p, [f]: e.target.value}))

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', tripId],
    queryFn: () => api.get(`/trips/${tripId}/expenses`).then(r => r.data.data)
  })

  const { mutate: addExpense, isPending } = useMutation({
    mutationFn: (d) => api.post(`/trips/${tripId}/expenses`, d),
    onSuccess: () => { qc.invalidateQueries(['expenses', tripId]); setShowAdd(false); setForm({ title:'', amount:'', category:'food', date: new Date().toISOString().split('T')[0] }); toast.success('Expense added') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  })

  const expenses = data?.expenses || []
  const summary  = data?.summary  || []
  const total    = data?.total    || 0
  const remaining = budgetLimit - total
  const pct = budgetLimit ? Math.min((total / budgetLimit) * 100, 100) : 0

  const inputCls = "w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Budget Tracker</h2>
        {role !== 'viewer' && (
          <button onClick={() => setShowAdd(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black
              font-bold text-sm rounded-xl transition">
            <Plus size={15} /> Add Expense
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-white">{currency} {total.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Budget Limit</p>
          <p className="text-2xl font-bold text-white">{currency} {budgetLimit.toFixed(2)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${remaining >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <p className="text-xs text-gray-400 mb-1">{remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
          <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currency} {Math.abs(remaining).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {budgetLimit > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{pct.toFixed(0)}% used</span>
            <span>{currency} {total.toFixed(0)} / {budgetLimit.toFixed(0)}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct > 90 ? '#ef4444' : pct > 70 ? '#f97316' : '#22c55e' }} />
          </div>
        </div>
      )}

      {/* Add expense form */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">Add Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Title *" className={inputCls} value={form.title} onChange={set('title')} />
            <input type="number" placeholder="Amount *" className={inputCls} value={form.amount} onChange={set('amount')} />
            <select className={inputCls} value={form.category} onChange={set('category')}>
              <option value="food">🍽️ Food</option>
              <option value="transport">🚌 Transport</option>
              <option value="stay">🏨 Stay</option>
              <option value="activity">🎯 Activity</option>
              <option value="other">📌 Other</option>
            </select>
            <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
            <button onClick={() => { if(!form.title || !form.amount) return toast.error('Title & amount required'); addExpense({...form, amount: Number(form.amount)}) }}
              disabled={isPending}
              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm disabled:opacity-50">
              {isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        {summary.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={summary.map(s => ({ name: s._id, value: s.total }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {summary.map(s => <Cell key={s._id} fill={COLORS[s._id] || '#6b7280'} />)}
                </Pie>
                <Tooltip formatter={(v) => `${currency} ${v.toFixed(2)}`} contentStyle={{ background:'#1f2937', border:'1px solid #374151', borderRadius:'8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expense list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-white">Expenses</h3>
          </div>
          <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
            {expenses.length === 0 && <p className="text-center text-gray-500 text-sm py-8">No expenses yet</p>}
            {expenses.map(exp => (
              <div key={exp._id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: COLORS[exp.category] + '20' }}>
                  {exp.category === 'food' ? '🍽️' : exp.category === 'transport' ? '🚌' : exp.category === 'stay' ? '🏨' : exp.category === 'activity' ? '🎯' : '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{exp.title}</p>
                  <p className="text-xs text-gray-500">{exp.paidBy?.name} · {new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-white">{currency} {exp.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}