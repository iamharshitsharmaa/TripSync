import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { Trash2, CornerDownRight, Send } from 'lucide-react'

export default function CommentThread({ tripId, entityType, entityId }) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null) // { id, authorName }

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => api.get(`/comments?entityType=${entityType}&entityId=${entityId}`).then(r => r.data.data)
  })

  const { mutate: post, isPending } = useMutation({
    mutationFn: (data) => api.post('/comments', data),
    onSuccess: () => { qc.invalidateQueries(['comments', entityType, entityId]); setText(''); setReplyTo(null) }
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id) => api.delete(`/comments/${id}`),
    onSuccess: () => qc.invalidateQueries(['comments', entityType, entityId])
  })

  const handlePost = () => {
    if (!text.trim()) return
    post({ tripId, entityType, entityId, content: text.trim(), parentId: replyTo?.id || null })
  }

  // Separate top-level and replies
  const topLevel = comments.filter(c => !c.parentId)
  const replies  = comments.filter(c => c.parentId)
  const getReplies = (parentId) => replies.filter(r => r.parentId === parentId || r.parentId?._id === parentId || r.parentId?.toString() === parentId?.toString())

  return (
    <div className="space-y-2">
      {/* Comment input */}
      <div className="flex gap-2 items-end">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
          flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-1">
              <CornerDownRight size={10} />
              Replying to {replyTo.authorName}
              <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white">×</button>
            </div>
          )}
          <div className="flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Add a comment...'}
              className="flex-1 px-3 py-1.5 bg-gray-700/60 border border-gray-600/50 rounded-lg
                text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition" />
            <button onClick={handlePost} disabled={!text.trim() || isPending}
              className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition disabled:opacity-30">
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-1.5 pl-8">
        {topLevel.map(comment => (
          <div key={comment._id}>
            {/* Top-level comment */}
            <div className="group">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-teal-600
                  flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                  {comment.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-200">{comment.author?.name}</span>
                    <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleTimeString('en', {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setReplyTo({ id: comment._id, authorName: comment.author?.name })}
                      className="text-xs text-gray-600 hover:text-cyan-400 transition">
                      Reply
                    </button>
                    {comment.author?._id === user?._id && (
                      <button onClick={() => remove(comment._id)}
                        className="text-xs text-gray-600 hover:text-red-400 transition">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Replies */}
            {getReplies(comment._id).map(reply => (
              <div key={reply._id} className="ml-7 mt-1.5 pl-3 border-l border-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600
                    flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                    {reply.author?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-300">{reply.author?.name}</span>
                      <span className="text-xs text-gray-600">{new Date(reply.createdAt).toLocaleTimeString('en', {hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">{reply.content}</p>
                    {reply.author?._id === user?._id && (
                      <button onClick={() => remove(reply._id)} className="text-xs text-gray-600 hover:text-red-400 transition mt-1">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-gray-600 py-1">No comments yet</p>
        )}
      </div>
    </div>
  )
}