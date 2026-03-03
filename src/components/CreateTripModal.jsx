import { useState } from 'react'
import api from '../lib/axios'
import { useQueryClient } from '@tanstack/react-query'

export default function CreateTripModal({ onClose }) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'USD',
    budgetLimit: 0,
  })

  const handleSubmit = async e => {
    e.preventDefault()
    await api.post('/trips', form)
    qc.invalidateQueries(['trips'])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-6 rounded-xl w-96 space-y-4"
      >
        <h2 className="font-bold text-lg">Create Trip</h2>

        <input
          placeholder="Title"
          className="w-full bg-gray-800 p-2 rounded"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
        />

        <input
          type="date"
          className="w-full bg-gray-800 p-2 rounded"
          onChange={e => setForm({ ...form, startDate: e.target.value })}
          required
        />

        <input
          type="date"
          className="w-full bg-gray-800 p-2 rounded"
          onChange={e => setForm({ ...form, endDate: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Budget"
          className="w-full bg-gray-800 p-2 rounded"
          onChange={e =>
            setForm({ ...form, budgetLimit: Number(e.target.value) })
          }
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}