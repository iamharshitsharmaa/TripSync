import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, CheckSquare, Package, ListTodo } from 'lucide-react'

const TYPE_CONFIG = {
  packing: { label: 'Packing List', icon: Package, color: 'text-blue-400' },
  todo:    { label: 'To-Do',        icon: ListTodo, color: 'text-green-400' },
  custom:  { label: 'Custom',       icon: CheckSquare, color: 'text-purple-400' },
}

export default function ChecklistPanel({ tripId, role, members = [] }) {
  const qc = useQueryClient()
  const [newListTitle, setNewListTitle] = useState('')
  const [newListType, setNewListType] = useState('packing')
  const [newItems, setNewItems] = useState({}) // { checklistId: '' }

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', tripId],
    queryFn: () => api.get(`/trips/${tripId}/checklists`).then(r => r.data.data)
  })

  const { mutate: createList, isPending: creating } = useMutation({
    mutationFn: (data) => api.post(`/trips/${tripId}/checklists`, data),
    onSuccess: () => { qc.invalidateQueries(['checklists', tripId]); setNewListTitle('') }
  })

  const { mutate: addItem } = useMutation({
    mutationFn: ({ checklistId, text }) => api.post(`/checklists/${checklistId}/items`, { text }),
    onSuccess: (_, vars) => { qc.invalidateQueries(['checklists', tripId]); setNewItems(p => ({...p, [vars.checklistId]: ''})) }
  })

  const { mutate: toggleItem } = useMutation({
    mutationFn: ({ checklistId, itemId, isChecked }) =>
      api.patch(`/checklists/${checklistId}/items/${itemId}`, { isChecked }),
    onMutate: async ({ checklistId, itemId, isChecked }) => {
      // Optimistic update
      await qc.cancelQueries(['checklists', tripId])
      qc.setQueryData(['checklists', tripId], (old) =>
        old?.map(cl => cl._id === checklistId
          ? {...cl, items: cl.items.map(it => it._id === itemId ? {...it, isChecked} : it)}
          : cl
        )
      )
    },
    onError: () => qc.invalidateQueries(['checklists', tripId])
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: ({ checklistId, itemId }) => api.delete(`/checklists/${checklistId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries(['checklists', tripId])
  })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Checklists</h2>
      </div>

      {/* Create new list */}
      {role !== 'viewer' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">New Checklist</h3>
          <div className="flex gap-3">
            <input placeholder="e.g. Packing for Paris"
              className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm
                placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newListTitle && createList({ title: newListTitle, type: newListType })} />
            <select className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none"
              value={newListType} onChange={e => setNewListType(e.target.value)}>
              <option value="packing">📦 Packing</option>
              <option value="todo">✅ To-Do</option>
              <option value="custom">📋 Custom</option>
            </select>
            <button onClick={() => newListTitle && createList({ title: newListTitle, type: newListType })}
              disabled={!newListTitle || creating}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm disabled:opacity-40">
              {creating ? '...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Checklists */}
      {checklists.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <CheckSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>No checklists yet. Create a packing list or to-do above.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklists.map(cl => {
          const cfg = TYPE_CONFIG[cl.type] || TYPE_CONFIG.custom
          const Icon = cfg.icon
          const checked = cl.items.filter(i => i.isChecked).length
          const total = cl.items.length

          return (
            <div key={cl._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* List header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={cfg.color} />
                  <span className="text-sm font-bold text-white">{cl.title}</span>
                </div>
                <span className="text-xs font-mono text-gray-400">{checked}/{total}</span>
              </div>

              {/* Progress */}
              {total > 0 && (
                <div className="h-1 bg-gray-800">
                  <div className="h-full bg-green-500 transition-all"
                    style={{ width: `${(checked/total)*100}%` }} />
                </div>
              )}

              {/* Items */}
              <div className="p-3 space-y-1 max-h-60 overflow-y-auto">
                {cl.items.map(item => (
                  <div key={item._id} className="flex items-center gap-2.5 group">
                    <button
                      onClick={() => role !== 'viewer' && toggleItem({ checklistId: cl._id, itemId: item._id, isChecked: !item.isChecked })}
                      className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition
                        ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-gray-400'}`}>
                      {item.isChecked && <span className="text-white text-xs leading-none">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm transition ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                      {item.text}
                    </span>
                    {role !== 'viewer' && (
                      <button onClick={() => deleteItem({ checklistId: cl._id, itemId: item._id })}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {cl.items.length === 0 && (
                  <p className="text-xs text-gray-600 py-2 text-center">No items yet</p>
                )}
              </div>

              {/* Add item */}
              {role !== 'viewer' && (
                <div className="px-3 pb-3">
                  <div className="flex gap-2">
                    <input placeholder="Add item..." className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700
                      rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                      value={newItems[cl._id] || ''}
                      onChange={e => setNewItems(p => ({...p, [cl._id]: e.target.value}))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newItems[cl._id]?.trim()) {
                          addItem({ checklistId: cl._id, text: newItems[cl._id].trim() })
                        }
                      }} />
                    <button onClick={() => newItems[cl._id]?.trim() && addItem({ checklistId: cl._id, text: newItems[cl._id].trim() })}
                      className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}