import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { UserPlus, Trash2, Crown, Pencil, Eye, Copy, RefreshCw, Link2, Hash } from 'lucide-react'

const ROLE_CONFIG = {
  owner:  { label: 'Owner',  color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', icon: Crown },
  editor: { label: 'Editor', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',       icon: Pencil },
  viewer: { label: 'Viewer', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20',       icon: Eye },
}

export default function MembersPanel({ trip, role, currentUserId }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('email') // 'email' | 'code'
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'editor' })
  const [joinCode, setJoinCode] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)

  const accepted = trip.members?.filter(m => m.inviteStatus === 'accepted') || []
  const pending  = trip.members?.filter(m => m.inviteStatus === 'pending')  || []

  // ── Invite by email
  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: (data) => api.post(`/trips/${trip._id}/invite`, data).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success('Invite sent! 📧')
      setInviteLink(data.inviteLink) // show manual link as fallback
      setInviteForm({ email: '', role: 'editor' })
      qc.invalidateQueries({ queryKey: ['trip', trip._id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send invite'),
  })

  // ── Regenerate invite code
  const { mutate: regenCode, isPending: regening } = useMutation({
    mutationFn: () => api.post(`/trips/${trip._id}/invite-code/regenerate`).then(r => r.data.data),
    onSuccess: () => {
      toast.success('New code generated')
      qc.invalidateQueries({ queryKey: ['trip', trip._id] })
    },
  })

  // ── Join by code (for viewers joining from code)
  const { mutate: joinByCode, isPending: joining } = useMutation({
    mutationFn: (code) => api.post(`/trips/${trip._id}/join`, { code }).then(r => r.data.data),
    onSuccess: () => {
      toast.success('Joined trip!')
      qc.invalidateQueries({ queryKey: ['trip', trip._id] })
      setJoinCode('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid code'),
  })

  // ── Update role
  const { mutate: updateRole } = useMutation({
    mutationFn: ({ userId, role }) => api.patch(`/trips/${trip._id}/members/${userId}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip', trip._id] }); toast.success('Role updated') },
  })

  // ── Remove member
  const { mutate: removeMember } = useMutation({
    mutationFn: (userId) => api.delete(`/trips/${trip._id}/members/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trip', trip._id] }); toast.success('Member removed') },
  })

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Trip Members</h2>
          <p className="text-gray-400 text-sm">{accepted.length} member{accepted.length !== 1 ? 's' : ''}</p>
        </div>
        {role === 'owner' && (
          <button
            onClick={() => setShowInvite(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500
              text-white font-semibold text-sm rounded-xl transition"
          >
            <UserPlus size={15} /> Invite
          </button>
        )}
      </div>

      {/* Invite panel */}
      {showInvite && role === 'owner' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-4">
            <button
              onClick={() => setTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition
                ${tab === 'email' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Link2 size={12} /> Invite by Email
            </button>
            <button
              onClick={() => setTab('code')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition
                ${tab === 'code' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Hash size={12} /> Invite Code
            </button>
          </div>

          {/* Email invite */}
          {tab === 'email' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="colleague@email.com"
                  className={inputCls}
                  value={inviteForm.email}
                  onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                />
                <select
                  className="px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none"
                  value={inviteForm.role}
                  onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={() => inviteForm.email && invite(inviteForm)}
                  disabled={!inviteForm.email || inviting}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold
                    rounded-xl text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {inviting ? 'Sending...' : 'Send'}
                </button>
              </div>

              {/* Manual link fallback */}
              {inviteLink && (
                <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400 flex-1 truncate">
                    Manual link: <span className="text-blue-400">{inviteLink}</span>
                  </p>
                  <button
                    onClick={() => copyToClipboard(inviteLink, 'Invite link')}
                    className="text-gray-400 hover:text-white flex-shrink-0"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Invite code */}
          {tab === 'code' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Share this code with anyone — they can join as a Viewer instantly without email.
              </p>

              {/* Code display */}
              <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl border border-gray-700">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Invite Code</p>
                  <p className="text-3xl font-bold text-white tracking-[0.3em] font-mono">
                    {trip.inviteCode || '------'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => copyToClipboard(trip.inviteCode, 'Invite code')}
                    title="Copy code"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => regenCode()}
                    disabled={regening}
                    title="Generate new code"
                    className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={regening ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Copy full join URL */}
              <button
                onClick={() => copyToClipboard(
                  `Join my trip "${trip.title}" on TripSync!\nTrip ID: ${trip._id}\nInvite Code: ${trip.inviteCode}`,
                  'Invite details'
                )}
                className="w-full py-2 border border-gray-600 rounded-lg text-xs text-gray-300
                  hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <Copy size={12} /> Copy invite details
              </button>

              <p className="text-xs text-gray-600 text-center">
                Anyone with this code joins as Viewer. You can change their role after they join.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Join by code (for non-owners who aren't members yet — shown on public trips) */}
      {role === 'viewer' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Hash size={14} className="text-purple-400" /> Join another trip with code
          </p>
          <div className="flex gap-2">
            <input
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white
                text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 uppercase tracking-widest"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={() => joinCode.length === 6 && joinByCode(joinCode)}
              disabled={joinCode.length !== 6 || joining}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold
                rounded-xl text-sm disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="space-y-2 mb-6">
        {accepted.map(member => {
          const cfg  = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer
          const Icon = cfg.icon
          const isMe      = member.user?._id === currentUserId || member.user === currentUserId
          const isOwner   = member.role === 'owner'

          return (
            <div key={member._id}
              className="flex items-center gap-3 p-3.5 bg-gray-900 border border-gray-800 rounded-xl"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600
                flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {member.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  {member.user?.name || 'Unknown'}
                  {isMe && <span className="text-xs text-gray-500">(you)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{member.user?.email}</p>
              </div>

              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1
                rounded-lg font-semibold border ${cfg.color}`}>
                <Icon size={11} /> {cfg.label}
              </span>

              {role === 'owner' && !isOwner && !isMe && (
                <div className="flex gap-1 ml-1">
                  <select
                    className="text-xs px-2 py-1.5 bg-gray-700 border border-gray-600
                      rounded-lg text-gray-300 focus:outline-none"
                    value={member.role}
                    onChange={e => updateRole({ userId: member.user?._id || member.user, role: e.target.value })}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => confirm('Remove this member?') &&
                      removeMember(member.user?._id || member.user)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Pending Invites
          </h3>
          <div className="space-y-2">
            {pending.map(m => (
              <div key={m._id}
                className="flex items-center gap-3 p-3 bg-gray-900/50
                  border border-dashed border-gray-700 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center
                  justify-center text-gray-500 flex-shrink-0 text-sm">?</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{m.inviteEmail || 'Invited user'}</p>
                  <p className="text-xs text-gray-500">Pending · {m.role}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}