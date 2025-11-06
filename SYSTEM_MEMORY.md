
# 🧠 AURA.CA MESSAGING & AGORA SYSTEM ARCHITECTURE

## CORE OBJECTIVE
**Build a complete messaging system where all roles (Student, Tutor/Manager, Admin) can communicate with each other, with tutors able to initiate one-on-one video sessions using Agora.**

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

### ROLE HIERARCHY & COMMUNICATION
```
STUDENT (Learner)
  ↓ Can message ↔ Can message ↓
JUNIOR_MANAGER (Tutor - Basic)
  ↓ Can message ↔ Can message ↓
SENIOR_MANAGER (Tutor - Advanced)  
  ↓ Can message ↔ Can message ↓
ADMIN (Platform Admin)
```

**Key Rules:**
- All roles can message each other
- Tutors (JUNIOR/SENIOR_MANAGER) can initiate 1-on-1 video calls with students
- Managers can also call other managers and admins
- Admins can call anyone
- Each role has a dedicated message page: `/admin/messages`, `/manager/messages`, `/senior-manager/messages`, `/junior-manager/messages`, `/messages` (student)

---

## 🏗️ BACKEND INFRASTRUCTURE (Already Implemented)

### 1. DATABASE MODELS (Prisma)
```
Message
├── id: string (Primary Key)
├── senderId: string (FK → User)
├── receiverId: string (FK → User)
├── content: string
├── subject?: string
├── parentId?: string (for threaded messages)
├── attachments?: JSON[]
├── isRead: boolean
├── readAt?: DateTime
├── deliveredAt?: DateTime
├── type: enum ['text', 'image', 'file', 'audio', 'video']
├── metadata?: JSON
└── createdAt, updatedAt: DateTime

User (Already has role field)
├── id: string
├── email: string
├── firstName: string
├── lastName: string
├── role: enum ['STUDENT', 'JUNIOR_MANAGER', 'SENIOR_MANAGER', 'ADMIN']
├── profileImage?: string
├── lastActivityAt?: DateTime
└── ...other fields

LiveSession
├── id: string
├── title: string
├── description: string
├── instructor: string
├── date: DateTime
├── duration: integer (minutes)
├── channelName: string (For Agora)
├── maxParticipants: integer
├── status: enum ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']
├── requiredTier: enum ['FREE', 'ESSENTIAL', 'PREMIUM', 'PRO']
├── participants: LiveSessionParticipant[]
└── ...

LiveSessionParticipant
├── id: string
├── liveSessionId: string (FK)
├── userId: string (FK)
├── joinedAt: DateTime
└── leftAt?: DateTime
```

### 2. MESSAGING SERVICES (Backend)

**MessagingService** (`backend/src/services/messagingService.ts`)
- `sendMessage(senderId, receiverId, content, type)` → Saves to DB + queues for processing
- `sendGroupMessage(senderId, roomId, content, type)` → For group chats
- `getRecentMessages(userId, otherUserId, limit)` → Fetch chat history
- `markAsRead(messageId, userId)` → Mark messages as read
- `createOrGetRoom(senderId, receiverId)` → Create/get direct message room
- Redis integration for caching and queuing
- Rate limiting built-in
- Supports: text, image, file, audio, video types

**RealTimeMessagingService** (`backend/src/services/realTimeMessagingService.ts`)
- Socket.IO based real-time communication
- Events:
  - `message:send` → Send message via socket
  - `message:read` → Mark as read
  - `message:get_recent` → Get recent messages
  - `typing` → Typing indicators
  - `presence` → Online/offline status
- Broadcasting to rooms
- Typing user tracking

### 3. MESSAGE API ROUTES (Backend)

**GET `/api/messages`** (Query params: contactId, page, limit, type)
- If `contactId` provided: Returns messages for specific conversation
- Else: Returns paginated inbox messages
- Includes unread count

**POST `/api/messages`** (Body: receiverId, content, subject, attachments)
- Creates message in DB
- Triggers Pusher notification
- Creates notification for receiver
- Returns created message with sender/receiver details

**GET `/api/messages/contacts`**
- Returns list of all contacts (people user has messaged)
- Includes: id, name, email, role, avatar, isOnline, lastSeen, unreadCount, lastMessageTime
- Used for contact list in messaging UI

**GET `/api/messages/unread-count`**
- Returns total unread messages count for current user

**PUT `/api/messages/:id/read`**
- Mark specific message as read

### 4. AGORA INTEGRATION (Backend)

**AgoraService** (`backend/src/services/agoraService.ts`)
- `generateRTCToken(request)` → Generate RTC token for video/audio calls
  - Token expires in 1 hour
  - Requires: channelName, uid, role ('publisher' or 'subscriber')
- `generateRTMToken(uid)` → Token for real-time messaging channel
- `startCloudRecording()` → Start recording a session
- `stopRecording()` → Stop recording
- Token generation using `agora-token` library

**AgoraController** (`backend/src/controllers/agoraController.ts`)
- **POST `/api/agora/rtc/token`** → Get RTC token for joining/publishing
- **POST `/api/agora/rtm/token`** → Get RTM token for chat
- **POST `/api/agora/recording/start`** → Start cloud recording
- **POST `/api/agora/recording/stop`** → Stop cloud recording

### 5. LIVE SESSION SERVICE (Backend)

**LiveSessionService** (`backend/src/services/liveSessionService.ts`)
- `createLiveSession(data)` → Create new session (Manager/Admin only)
- `getLiveSessionById(sessionId, userId)` → Get session details
- `registerForSession(sessionId, userId)` → Student joins session
- `getAllLiveSessions(filters)` → Get all available sessions
- `updateSessionStatus(sessionId, status)` → Update session state
- Subscription tier checking (FREE → ESSENTIAL → PREMIUM → PRO)
- Participant tracking and management

**LiveSessionRoutes** (`backend/src/routes/liveSessions.ts`)
- **POST `/api/live-sessions`** → Create session (Manager+)
- **GET `/api/live-sessions`** → Get all sessions
- **GET `/api/live-sessions/:id`** → Get specific session
- **PUT `/api/live-sessions/:id`** → Update session (Manager+)
- **POST `/api/live-sessions/:id/register`** → Join session
- **PUT `/api/live-sessions/:id/status`** → Change status

### 6. REAL-TIME FEATURES

**Pusher Integration**
- Channels: `private-{userId}` for direct messages
- Events: 'new-message', 'typing', 'message-status', 'presence'
- Used for instant notifications without polling

**WebSocket (Socket.IO)**
- Complementary to Pusher
- Handles typing indicators
- Presence information
- Can be used for group messaging

**Redis**
- Message queue: `message_queue` for async processing
- Cache: Stores recent messages for quick access
- Pub/Sub: For cross-server communication
- Separate connections for queue, cache, rate-limit

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. MESSAGING PAGES (Role-Based)

**Page Structure:**
- `/app/messages/page.tsx` → Student messages
- `/app/admin/messages/page.tsx` → Admin messages
- `/app/manager/messages/page.tsx` → Manager messages (uses same component)
- `/app/senior-manager/messages/page.tsx` → Senior manager messages
- `/app/junior-manager/messages/page.tsx` → Junior manager messages

Each page wraps `UnifiedMessagingPage` component with specific `userRole` prop.

### 2. UNIFIED MESSAGING COMPONENT

**Component:** `UnifiedMessagingPage.tsx`
- **Props:**
  - `userRole: 'ADMIN' | 'SENIOR_MANAGER' | 'JUNIOR_MANAGER' | 'STUDENT'`
  - `preSelectedContact?: Contact`

- **Features:**
  - Sidebar with contacts list
  - Main chat area with messages
  - Search functionality
  - Message input with emoji picker
  - File attachment support
  - Typing indicators
  - Online/offline status
  - Message context menu (reply, delete, edit)
  - WhatsApp-like scrolling (only message area scrolls)
  - Tab filtering: Tous, Étudiants, Tuteurs, Communauté

- **State Management:**
  - `contacts`: List of all contacts
  - `selectedContact`: Currently open conversation
  - `messages`: Messages for selected conversation
  - `activeTab`: Tab filtering
  - `isTyping`: Typing indicator state
  - `isVideoCallActive`: Video call state

- **Key Functions:**
  - `fetchContacts()` → Load contact list from API
  - `fetchMessages(contactId)` → Load messages for contact
  - `sendMessage(content)` → Send new message via Pusher
  - `handleVideoCall()` → Initiate 1-on-1 call
  - `handleReply()` → Reply to specific message

### 3. ONE-ON-ONE VIDEO CALL COMPONENT

**Component:** `OneOnOneVideoCall.tsx`
- **Props:**
  - `contactId`: ID of person to call
  - `contactName`: Display name
  - `contactRole`: User role (for permission checking)
  - `onEndCall`: Callback when call ends

- **Agora Integration:**
  - Channel name format: `one-on-one-{senderId}-{receiverId}`
  - Modes:
    - Admin → Anyone (publisher)
    - Manager → Students/Managers/Admins (publisher)
    - Student → Managers/Admins only (publisher)

- **Features:**
  - Video on/off toggle
  - Microphone on/off toggle
  - Screen sharing
  - Chat panel during call
  - Participant info display
  - Call duration timer
  - End call button
  - Error handling & fallbacks

- **Call Flow:**
  1. Click video icon in contact card
  2. Check permissions (canInitiateCall)
  3. Request Agora RTC token from backend
  4. Create Agora client with token
  5. Join Agora channel
  6. Create local audio/video tracks
  7. Publish tracks to channel
  8. Listen for remote user joining
  9. Subscribe to remote user's streams
  10. Render video on UI
  11. On call end: Unpublish tracks, leave channel, cleanup

### 4. MESSAGE SERVICE (Frontend)

**Service:** `lib/services/messageService.ts`
- `getContacts()` → Fetch contact list from `/api/messages/contacts`
- `getMessages(contactId, page, limit)` → Fetch messages for conversation
- `sendMessage(receiverId, content, attachments)` → POST to `/api/messages`
- `markAsRead(messageId)` → PUT to `/api/messages/:id/read`
- `getUnreadCount()` → GET `/api/messages/unread-count`
- Fallback mechanism: If main endpoint returns 404, try `/fallback/contacts`

**Contact Interface:**
```typescript
interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
  profileImage?: string
  isOnline: boolean
  lastSeen?: string
  lastMessageTime?: string
  unreadCount: number
}
```

**Message Interface:**
```typescript
interface Message {
  id: string
  senderId: string
  receiverId: string
  senderName?: string
  receiverName?: string
  content: string
  type: 'text' | 'image' | 'file' | 'audio' | 'video'
  isRead: boolean
  timestamp: string
  attachments?: any[]
  replyTo?: Message | null
}
```

### 5. PUSHER HOOK

**Hook:** `hooks/usePusher.ts`
- **Initialization:**
  - Connects to Pusher with app key '110ed53534004e19ee0c'
  - Cluster: 'eu'
  - Auth endpoint: '/api/pusher/auth'

- **Functions:**
  - `subscribeToUser(userId)` → Subscribe to user's private channel
  - `subscribeToPresence(userId)` → Track online status
  - `sendMessage(receiverId, content)` → Send via Pusher
  - `sendTypingIndicator(receiverId, isTyping)` → Send typing state

- **Events Handled:**
  - 'new-message' → Receive new messages
  - 'typing' → Receive typing indicators
  - 'message-status' → Delivery/read receipts
  - 'presence' → Online/offline updates

- **Offline Support:**
  - Uses `offlineMessageService` to store messages locally
  - Auto-syncs when connection restored
  - Messages queued in localStorage with timestamp

### 6. OFFLINE MESSAGE SERVICE

**Service:** `lib/services/offlineMessageService.ts`
- `storeMessage(message)` → Store in localStorage as 'offline_messages'
- `getOfflineMessages()` → Retrieve all offline messages
- `syncOfflineMessages()` → Send all stored messages to backend
- `clearOfflineMessages()` → Clear after successful sync

### 7. LIVE SESSION SERVICE (Frontend)

**Service:** `lib/services/liveSessionService.ts`
- `getAllSessions(pagination, filters)` → GET `/api/live-sessions`
- `getUpcomingSessions(pagination)` → GET `/api/live-sessions/upcoming`
- `getSessionById(sessionId)` → GET `/api/live-sessions/:id`
- `registerForSession(sessionId)` → POST `/api/live-sessions/:id/register`
- `updateReminder(sessionId, reminderTime)` → POST `/api/live-sessions/:id/reminder`

### 8. LIVE PAGE (Frontend)

**Page:** `/app/live/page.tsx`
- Displays all available live sessions
- Filters by level, category, search term
- Shows upcoming sessions at top
- Join button for each session
- Reminder setting
- Participant count display
- Different UI based on user role

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Middleware (`middleware.ts`)
- Role-based route protection
- Routes:
  - `/admin/*` → Only ADMIN
  - `/manager/*`, `/senior-manager/*`, `/junior-manager/*` → Managers + Admin
  - `/messages`, `/live/*`, etc. → Students + Managers + Admin
- Automatic redirects based on role

### Message Permissions
- All authenticated users can message each other
- No role restrictions on messaging
- One-on-one calls: Role-based (tutors can initiate with students)

### Live Session Access
- Subscription tier checking
- Session `requiredTier`: FREE, ESSENTIAL, PREMIUM, PRO
- Managers/Admins bypass tier restrictions

---

## 📡 DATA FLOW

### SENDING A MESSAGE
```
User (Frontend)
  ↓ clicks Send
UnifiedMessagingPage.sendMessage()
  ↓
usePusher.sendMessage()
  ↓
Pusher Channel: private-{receiverId}
  ↓
Backend receives via Pusher
  ↓
MessagingService.sendMessage()
  ↓ Saves to DB + Queues in Redis
Message + Notification
  ↓ Stored in PostgreSQL
  ↓ Pushed via Pusher to receiver
Receiver (Frontend)
  ↓ Receives via usePusher
  ↓ Updates message list
Chat UI updates
```

### STARTING 1-ON-1 CALL
```
Tutor (Frontend) clicks Video Icon
  ↓
OneOnOneVideoCall.initAgora()
  ↓ Checks canInitiateCall()
  ↓
Request Agora Token: POST /api/agora/rtc/token
  ↓
Backend: AgoraService.generateRTCToken()
  ↓
Returns token for channel: one-on-one-{senderId}-{receiverId}
  ↓
Frontend: Agora.join(token)
  ↓ Creates & publishes local tracks
Broadcast via Pusher: 'incoming-call' event
  ↓
Student receives notification
  ↓
Student clicks Accept (or auto-joins)
  ↓
Request token, join same channel
  ↓ Subscribes to tutor's streams
Both see each other's video/audio
  ↓
Chat, screen share, recording (optional)
  ↓
End Call: Leave channel, cleanup
```

### LOADING MESSAGE HISTORY
```
User selects Contact
  ↓
UnifiedMessagingPage: setSelectedContact()
  ↓
fetchMessages(contactId)
  ↓
messageService.getMessages(contactId)
  ↓
GET /api/messages?contactId={contactId}
  ↓
Backend: Queries all messages between users
  ↓
Returns ordered by timestamp (newest first)
  ↓
Frontend: setMessages()
  ↓
UI renders chat history
  ↓
scrollToBottom()
```

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### Backend Required Env Vars
```
# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
AGORA_CUSTOMER_ID=optional
AGORA_CUSTOMER_SECRET=optional
AGORA_RECORDING_BUCKET=agora-recordings
AGORA_RECORDING_ACCESS_KEY=your_key
AGORA_RECORDING_SECRET_KEY=your_secret

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=110ed53534004e19ee0c
PUSHER_SECRET=...
PUSHER_CLUSTER=eu

# Server
PORT=3001
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
```

### Frontend Required Env Vars
```
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=110ed53534004e19ee0c
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

---

## 📋 CURRENT ISSUES TO FIX

1. **Message Persistence**: Messages sometimes don't save to DB
2. **WhatsApp Scrolling**: Page scrolls instead of just message area
3. **Profile Pictures**: Not fetching real Gmail/Google images
4. **Timestamp Display**: Showing "Vu il y a 2 heures" instead of send time
5. **Tab Order**: Not in correct order (Tous → Étudiants → Tuteurs → Communauté)
6. **Role-Based Security**: Need to ensure proper permission checks
7. **Offline Messages**: Not syncing when connection restored
8. **Video Call Integration**: Missing seamless call flow with notifications

---

## 🎯 NEXT STEPS

1. Fix message persistence in database
2. Implement proper WhatsApp-like UI with correct scrolling
3. Complete one-on-one call flow with notifications
4. Test all role combinations for messaging and calling
5. Implement offline message sync
6. Add typing indicators UI
7. Performance optimization (pagination, caching)
8. Comprehensive error handling

---

**Last Updated**: October 27, 2025
**Status**: Architecture Complete, Implementation In Progress
**Focus**: Messaging System & Agora Integration
