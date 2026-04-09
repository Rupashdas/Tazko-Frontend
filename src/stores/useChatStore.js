import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const CURRENT_USER_ID = 1

const MOCK_USERS = [
    { id: 1, name: 'Alex Chen',        initials: 'AC', color: '#6c63ff', online: true,  lastSeen: null },
    { id: 2, name: 'Sarah Park',       initials: 'SP', color: '#f59e0b', online: true,  lastSeen: null },
    { id: 3, name: 'Marcus Johnson',   initials: 'MJ', color: '#10b981', online: false, lastSeen: '2h ago' },
    { id: 4, name: 'Elena Rodriguez',  initials: 'ER', color: '#ef4444', online: true,  lastSeen: null },
    { id: 5, name: 'Tom Williams',     initials: 'TW', color: '#3b82f6', online: false, lastSeen: 'Yesterday' },
    { id: 6, name: 'Yuki Tanaka',      initials: 'YT', color: '#8b5cf6', online: true,  lastSeen: null },
]

function t(minutesAgo) {
    const d = new Date(Date.now() - minutesAgo * 60000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

let _id = 1000
function uid() { return `m${++_id}` }

const MOCK_MESSAGES = {
    'dm-2': [
        { id: uid(), senderId: 2, type: 'text', content: 'Hey! Did you get a chance to review the new Figma mockups?', time: t(1440), date: 'Yesterday', reactions: [], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Not yet, been swamped with the API integration. Will check tonight!', time: t(1438), date: 'Yesterday', reactions: [{ emoji: '👍', userIds: [2] }], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'No worries! Just let me know when you do. The color system is way cleaner now.', time: t(1435), date: 'Yesterday', reactions: [], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 2, type: 'image', content: 'design-preview.png', url: 'https://picsum.photos/seed/desk42/480/280', time: t(1430), date: 'Yesterday', reactions: [{ emoji: '😍', userIds: [1] }, { emoji: '🔥', userIds: [1, 2] }], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Just checked — the new design looks incredible! The typography choices are chef\'s kiss 🤌', time: t(30), date: 'Today', reactions: [{ emoji: '❤️', userIds: [2] }], readBy: [1, 2], threads: [
            { id: uid(), senderId: 2, type: 'text', content: 'Thanks! I spent ages on that font pairing 😅', time: t(28), date: 'Today', reactions: [], readBy: [1, 2] },
            { id: uid(), senderId: 1, type: 'text', content: 'It really shows. Merriweather was the right call.', time: t(25), date: 'Today', reactions: [], readBy: [1, 2] },
        ] },
        { id: uid(), senderId: 2, type: 'text', content: 'Right?? And we finally ditched that awful purple gradient 😂', time: t(28), date: 'Today', reactions: [{ emoji: '😂', userIds: [1] }], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 2, type: 'file', content: 'design-system-v2.pdf', fileSize: '2.4 MB', fileType: 'pdf', time: t(20), date: 'Today', reactions: [], readBy: [1, 2], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'Can we sync tomorrow morning to go over the component library?', time: t(5), date: 'Today', reactions: [], readBy: [1], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'Say 10am? ☕', time: t(4), date: 'Today', reactions: [], readBy: [1], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: '@Alex Chen let me know!', time: t(2), date: 'Today', reactions: [], readBy: [], threads: [] },
    ],
    'dm-3': [
        { id: uid(), senderId: 3, type: 'text', content: 'The sprint planning doc is ready. Can you review before tomorrow?', time: t(180), date: 'Yesterday', reactions: [], readBy: [1, 3], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'On it! Will add my notes by EOD.', time: t(170), date: 'Yesterday', reactions: [{ emoji: '👍', userIds: [3] }], readBy: [1, 3], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Also, should we move the auth tickets to next sprint?', time: t(165), date: 'Yesterday', reactions: [], readBy: [1, 3], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Yeah let\'s deprioritize those. We have enough on our plate.', time: t(160), date: 'Yesterday', reactions: [], readBy: [1, 3], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Agreed. I\'ll update the board.', time: t(155), date: 'Yesterday', reactions: [], readBy: [1, 3], threads: [] },
    ],
    'dm-4': [
        { id: uid(), senderId: 4, type: 'text', content: 'Hey! The client loved the presentation today 🎉', time: t(45), date: 'Today', reactions: [{ emoji: '🎉', userIds: [1] }], readBy: [1, 4], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'That\'s amazing! All credit to your prep work honestly.', time: t(40), date: 'Today', reactions: [{ emoji: '❤️', userIds: [4] }], readBy: [1, 4], threads: [] },
        { id: uid(), senderId: 4, type: 'text', content: 'We make a great team 🙌', time: t(38), date: 'Today', reactions: [], readBy: [1, 4], threads: [] },
    ],
    'grp-1': [
        { id: uid(), senderId: 2, type: 'text', content: 'Good morning team! Ready for the sprint? ☕', time: t(300), date: 'Yesterday', reactions: [{ emoji: '☕', userIds: [1, 4, 6] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 4, type: 'text', content: 'Always ready! What\'s the priority today?', time: t(295), date: 'Yesterday', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Focus on closing out the MessageList component and getting the ThreadPanel wired up.', time: t(290), date: 'Yesterday', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'text', content: 'I can help with animations! Already have some ideas with CSS transitions.', time: t(285), date: 'Yesterday', reactions: [{ emoji: '🔥', userIds: [1, 2] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 2, type: 'file', content: 'sprint-board.xlsx', fileSize: '156 KB', fileType: 'xlsx', time: t(280), date: 'Yesterday', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 4, type: 'text', content: 'Just pushed the new sidebar styles. Looks great on mobile too!', time: t(60), date: 'Today', reactions: [{ emoji: '👏', userIds: [1, 2, 6] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'text', content: 'The transitions are smooth! Nice work Elena 🎨', time: t(55), date: 'Today', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'We\'re ahead of schedule. Let\'s use the extra time to polish the empty states.', time: t(50), date: 'Today', reactions: [{ emoji: '💯', userIds: [2, 4, 6] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'Love that idea! I\'ll work on some illustrations.', time: t(48), date: 'Today', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'image', content: 'animation-concept.gif', url: 'https://picsum.photos/seed/anim/480/260', time: t(40), date: 'Today', reactions: [{ emoji: '🤩', userIds: [1, 2, 4] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'text', content: 'Quick concept for the loading state. What do you think?', time: t(39), date: 'Today', reactions: [], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'text', content: 'Team standup in 10 minutes everyone! 👋', time: t(10), date: 'Today', reactions: [{ emoji: '👋', userIds: [1, 2, 4] }], readBy: [1, 2, 4, 6], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'Same, just wrapping up this PR', time: t(3), date: 'Today', reactions: [], readBy: [1, 2], threads: [] },
    ],
    'ch-general': [
        { id: uid(), senderId: 4, type: 'text', content: 'Welcome to #general everyone! This is our main team channel.', time: t(1440), date: 'Yesterday', reactions: [{ emoji: '👋', userIds: [1, 2, 3, 5, 6] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'Excited to be here! Great team 🙌', time: t(1430), date: 'Yesterday', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 5, type: 'text', content: 'All-hands meeting rescheduled to Friday 2pm. Don\'t forget!', time: t(120), date: 'Today', reactions: [{ emoji: '📅', userIds: [1, 2, 3, 4] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'text', content: 'Thanks for the heads up Tom!', time: t(115), date: 'Today', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Is the Friday 2pm in UTC or EST?', time: t(110), date: 'Today', reactions: [], readBy: [1, 2, 3, 5, 6], threads: [] },
        { id: uid(), senderId: 5, type: 'text', content: 'EST! Will send a calendar invite shortly.', time: t(108), date: 'Today', reactions: [], readBy: [1, 2, 3, 5, 6], threads: [] },
    ],
    'ch-design': [
        { id: uid(), senderId: 4, type: 'text', content: 'New design tokens are live on Figma. Please review before Thursday\'s sync.', time: t(240), date: 'Yesterday', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 2, type: 'text', content: 'The spacing scale looks much more systematic now. Great work!', time: t(220), date: 'Yesterday', reactions: [{ emoji: '👍', userIds: [4] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 6, type: 'image', content: 'color-system.png', url: 'https://picsum.photos/seed/colorscale/480/240', time: t(210), date: 'Yesterday', reactions: [{ emoji: '😍', userIds: [1, 2, 4] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 4, type: 'text', content: 'That\'s the new color scale. Semantic tokens above, raw palette below.', time: t(208), date: 'Yesterday', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'I love the warm neutrals. Way better than the old cold grays.', time: t(200), date: 'Yesterday', reactions: [{ emoji: '💯', userIds: [2, 4, 6] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Accessibility check passed for all primary combinations. We\'re good on contrast ratios ✅', time: t(90), date: 'Today', reactions: [{ emoji: '✅', userIds: [1, 2, 4, 6] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
    ],
    'ch-dev': [
        { id: uid(), senderId: 3, type: 'text', content: 'Just merged the auth refactor. Runs 40% faster now.', time: t(150), date: 'Yesterday', reactions: [{ emoji: '🚀', userIds: [1, 2, 5] }], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 5, type: 'text', content: 'Excellent! Can you write a quick summary for the changelog?', time: t(145), date: 'Yesterday', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Sure, I\'ll add it to the PR description.', time: t(140), date: 'Yesterday', reactions: [], readBy: [1, 2, 3, 4, 5, 6], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Pipeline is green ✅ Deploying to staging now.', time: t(75), date: 'Today', reactions: [{ emoji: '🎉', userIds: [2, 3, 5] }], readBy: [1, 2, 3, 5, 6], threads: [] },
        { id: uid(), senderId: 5, type: 'text', content: 'Staging looks good! Approving for production.', time: t(60), date: 'Today', reactions: [], readBy: [1, 2, 3, 5], threads: [] },
        { id: uid(), senderId: 3, type: 'file', content: 'deployment-notes.md', fileSize: '8 KB', fileType: 'md', time: t(55), date: 'Today', reactions: [], readBy: [1, 2, 3, 5], threads: [] },
        { id: uid(), senderId: 3, type: 'text', content: 'Has anyone seen the memory leak in the file upload component?', time: t(15), date: 'Today', reactions: [], readBy: [1, 3], threads: [] },
        { id: uid(), senderId: 1, type: 'text', content: 'Looking into it now. Might be the blob URLs not being revoked.', time: t(12), date: 'Today', reactions: [{ emoji: '👍', userIds: [3] }], readBy: [1, 3], threads: [] },
    ],
}

const MOCK_CONVERSATIONS = [
    { id: 'dm-2',      type: 'dm',      userId: 2, unread: 3, pinned: true,  lastMessage: { text: '@Alex Chen let me know!',          senderId: 2, time: t(2)   } },
    { id: 'dm-3',      type: 'dm',      userId: 3, unread: 0, pinned: false, lastMessage: { text: "Agreed. I'll update the board.",    senderId: 3, time: t(155) } },
    { id: 'dm-4',      type: 'dm',      userId: 4, unread: 0, pinned: false, lastMessage: { text: 'We make a great team 🙌',           senderId: 4, time: t(38)  } },
    { id: 'grp-1',     type: 'group',   name: 'Frontend Squad', members: [1, 2, 4, 6], unread: 2, pinned: true,  lastMessage: { text: 'Same, just wrapping up this PR', senderId: 2, time: t(3)   } },
    { id: 'ch-general',type: 'channel', name: 'general',     project: 'Tazko App', unread: 0, pinned: false, lastMessage: { text: 'EST! Will send a calendar invite shortly.', senderId: 5, time: t(108) } },
    { id: 'ch-design', type: 'channel', name: 'design',      project: 'Tazko App', unread: 0, pinned: false, lastMessage: { text: "Accessibility check passed...",          senderId: 3, time: t(90)  } },
    { id: 'ch-dev',    type: 'channel', name: 'development', project: 'Tazko App', unread: 2, pinned: false, lastMessage: { text: 'Looking into it now...',                 senderId: 1, time: t(12)  } },
]

export const useChatStore = defineStore('chat', () => {
    const users              = ref(MOCK_USERS.map(u => ({ ...u })))
    const conversations      = ref(MOCK_CONVERSATIONS.map(c => ({ ...c })))
    const messages           = ref(Object.fromEntries(Object.entries(MOCK_MESSAGES).map(([k, v]) => [k, v.map(m => ({ ...m, reactions: m.reactions.map(r => ({ ...r, userIds: [...r.userIds] })), threads: [...(m.threads || [])] }))])))
    const activeConvId       = ref('dm-2')
    const activeThread       = ref(null)   // { messageId, conversationId } | null
    const callState          = ref(null)   // { type, conversationId, status } | null
    const typingMap          = ref({})     // { [convId]: userId[] }
    const searchQuery        = ref('')
    const mobileSidebarOpen  = ref(true)
    const replyingTo         = ref(null)   // { id, content, senderName, senderId } | null
    const convSearchQuery    = ref('')     // in-conversation search

    // ── Derived ──────────────────────────────────────────────────────────

    const currentUser = computed(() => users.value.find(u => u.id === CURRENT_USER_ID))

    const activeConv = computed(() => conversations.value.find(c => c.id === activeConvId.value))

    const activeMessages = computed(() => messages.value[activeConvId.value] ?? [])

    const typingUsersInActive = computed(() => {
        const ids = typingMap.value[activeConvId.value] ?? []
        return ids.map(id => users.value.find(u => u.id === id)).filter(Boolean)
    })

    const threadParent = computed(() => {
        if (!activeThread.value) return null
        return (messages.value[activeThread.value.conversationId] ?? []).find(m => m.id === activeThread.value.messageId) ?? null
    })

    const threadReplies = computed(() => threadParent.value?.threads ?? [])

    const filteredConversations = computed(() => {
        const q = searchQuery.value.toLowerCase().trim()
        if (!q) return conversations.value
        return conversations.value.filter(c => convName(c).toLowerCase().includes(q))
    })

    const directMessages = computed(() => filteredConversations.value.filter(c => c.type === 'dm'))
    const groupChats     = computed(() => filteredConversations.value.filter(c => c.type === 'group'))
    const channels       = computed(() => filteredConversations.value.filter(c => c.type === 'channel'))
    const totalUnread    = computed(() => conversations.value.reduce((s, c) => s + (c.unread || 0), 0))

    // ── Helpers ───────────────────────────────────────────────────────────

    function getUser(id) {
        return users.value.find(u => u.id === id) ?? null
    }

    function convName(conv) {
        if (!conv) return ''
        if (conv.type === 'dm')      return getUser(conv.userId)?.name ?? 'Unknown'
        if (conv.type === 'group')   return conv.name
        if (conv.type === 'channel') return `#${conv.name}`
        return ''
    }

    function convSubtitle(conv) {
        if (!conv) return ''
        if (conv.type === 'dm') {
            const u = getUser(conv.userId)
            return u?.online ? 'Active now' : u?.lastSeen ? `Last seen ${u.lastSeen}` : 'Offline'
        }
        if (conv.type === 'group') {
            const online = (conv.members ?? []).filter(id => getUser(id)?.online).length
            return `${online} online · ${(conv.members ?? []).length} members`
        }
        if (conv.type === 'channel') return conv.project
        return ''
    }

    function convAvatar(conv) {
        if (!conv) return null
        if (conv.type === 'dm') return getUser(conv.userId)
        return null
    }

    // ── Actions ───────────────────────────────────────────────────────────

    function setActiveConv(id) {
        activeConvId.value       = id
        activeThread.value       = null
        mobileSidebarOpen.value  = false
        replyingTo.value         = null
        convSearchQuery.value    = ''
        const conv = conversations.value.find(c => c.id === id)
        if (conv) conv.unread = 0
    }

    function setReplyTo(msg) {
        let preview = msg.content
        if (msg.type === 'image') preview = '📷 Image'
        else if (msg.type === 'file') preview = `📎 ${msg.content}`
        replyingTo.value = {
            id:         msg.id,
            content:    preview,
            senderName: getUser(msg.senderId)?.name ?? 'Unknown',
            senderId:   msg.senderId,
        }
    }

    function clearReplyTo() { replyingTo.value = null }

    function sendMessage(content, type = 'text', extra = {}) {
        const convId = activeConvId.value
        const now    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const msg = {
            id:        `msg-${Date.now()}`,
            senderId:  CURRENT_USER_ID,
            type,
            content,
            time:      now,
            date:      'Today',
            reactions: [],
            readBy:    [CURRENT_USER_ID],
            threads:   [],
            replyTo:   replyingTo.value ? { ...replyingTo.value } : null,
            ...extra,
        }
        replyingTo.value = null
        if (!messages.value[convId]) messages.value[convId] = []
        messages.value[convId].push(msg)

        const conv = conversations.value.find(c => c.id === convId)
        if (conv) conv.lastMessage = { text: content, senderId: CURRENT_USER_ID, time: now }

        _scheduleReply(convId)
    }

    function sendThreadReply(content) {
        if (!activeThread.value) return
        const { messageId, conversationId } = activeThread.value
        const msgs   = messages.value[conversationId]
        const parent = msgs?.find(m => m.id === messageId)
        if (!parent) return
        if (!parent.threads) parent.threads = []
        parent.threads.push({
            id:        `t-${Date.now()}`,
            senderId:  CURRENT_USER_ID,
            type:      'text',
            content,
            time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date:      'Today',
            reactions: [],
            readBy:    [CURRENT_USER_ID],
        })
    }

    function toggleReaction(messageId, emoji, convId = activeConvId.value) {
        const msg = (messages.value[convId] ?? []).find(m => m.id === messageId)
        if (!msg) return
        const existing = msg.reactions.find(r => r.emoji === emoji)
        if (existing) {
            if (existing.userIds.includes(CURRENT_USER_ID)) {
                existing.userIds = existing.userIds.filter(id => id !== CURRENT_USER_ID)
                if (!existing.userIds.length) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji)
            } else {
                existing.userIds.push(CURRENT_USER_ID)
            }
        } else {
            msg.reactions.push({ emoji, userIds: [CURRENT_USER_ID] })
        }
    }

    function deleteMessage(messageId) {
        const msgs = messages.value[activeConvId.value]
        if (!msgs) return
        const msg = msgs.find(m => m.id === messageId)
        if (msg) { msg.deleted = true; msg.content = 'This message was deleted.' }
    }

    function openThread(messageId) {
        if (activeThread.value?.messageId === messageId) {
            activeThread.value = null
        } else {
            activeThread.value = { messageId, conversationId: activeConvId.value }
        }
    }

    function closeThread() { activeThread.value = null }

    function startCall(type) {
        callState.value = { type, conversationId: activeConvId.value, status: 'calling' }
        setTimeout(() => {
            if (callState.value) callState.value.status = 'connected'
        }, 3000)
    }

    function endCall() { callState.value = null }

    function loadOlderMessages() {
        const convId = activeConvId.value
        const older = [
            {
                id:        `old-${Date.now()}`,
                senderId:  2,
                type:      'text',
                content:   'This is an older message that was just loaded from history.',
                time:      '08:42 AM',
                date:      '2 Days Ago',
                reactions: [],
                readBy:    [1, 2],
                threads:   [],
            },
        ]
        messages.value[convId] = [...older, ...(messages.value[convId] ?? [])]
    }

    // ── Simulated reply ────────────────────────────────────────────────

    let _replyTimer = null
    function _scheduleReply(convId) {
        clearTimeout(_replyTimer)
        const conv = conversations.value.find(c => c.id === convId)
        if (!conv) return
        let responderId
        if      (conv.type === 'dm')    responderId = conv.userId
        else if (conv.type === 'group') responderId = (conv.members ?? []).filter(id => id !== CURRENT_USER_ID)[0]
        else return

        if (!typingMap.value[convId]) typingMap.value[convId] = []
        typingMap.value[convId] = [responderId]

        _replyTimer = setTimeout(() => {
            typingMap.value[convId] = []
            const replies = ['Got it, thanks!', 'Makes sense! 👍', 'On it!', 'Sure thing!', 'Sounds good!', "I'll look into it.", 'Perfect, thanks!', 'Will do! 🙌']
            const content = replies[Math.floor(Math.random() * replies.length)]
            const now     = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            if (!messages.value[convId]) messages.value[convId] = []
            messages.value[convId].push({
                id: `auto-${Date.now()}`, senderId: responderId, type: 'text', content,
                time: now, date: 'Today', reactions: [], readBy: [responderId], threads: [],
            })
            const c = conversations.value.find(x => x.id === convId)
            if (c) {
                c.lastMessage = { text: content, senderId: responderId, time: now }
                if (convId !== activeConvId.value) c.unread = (c.unread || 0) + 1
            }
        }, 2000 + Math.random() * 1500)
    }

    return {
        // state
        users, conversations, messages, activeConvId, activeThread, callState,
        typingMap, searchQuery, mobileSidebarOpen,
        // computed
        currentUser, activeConv, activeMessages, typingUsersInActive,
        threadParent, threadReplies,
        directMessages, groupChats, channels, totalUnread,
        filteredConversations,
        // helpers
        getUser, convName, convSubtitle, convAvatar,
        // actions
        setActiveConv, sendMessage, sendThreadReply,
        toggleReaction, deleteMessage,
        openThread, closeThread,
        startCall, endCall,
        loadOlderMessages,
        setReplyTo, clearReplyTo, replyingTo,
        convSearchQuery,
        CURRENT_USER_ID,
    }
})
