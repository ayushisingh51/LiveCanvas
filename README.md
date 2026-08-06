# LiveCanvas

A real-time collaborative content management platform where teams can co-author web pages together — live, in the same tab-switch-free session — with AI-assisted content generation built in.

Think Notion's block editor + Google Docs' live collaboration + an AI writing assistant, built from scratch on the MERN stack.

---

## ✨ Features

- **Block-based page editor** — build pages from heading, text, image, and AI-generated blocks
- **Real-time multi-user collaboration** — edits sync live across sessions via WebSockets, no refresh needed
- **Drag-and-drop block reordering** — powered by `@dnd-kit`, with server-persisted order
- **AI content generation** — generate on-brand copy inline using Groq's LLaMA 3.1, directly inside the editor
- **Live multiplatform preview** — see how a page renders on mobile, tablet, and desktop simultaneously, before publishing
- **JWT authentication** — secure signup/login with protected routes
- **Public live rendering** — every page is instantly viewable at a public, shareable URL
- **Polished, animated UI** — Framer Motion micro-interactions throughout (staggered entrances, animated block reordering, modal transitions)

---

## 🛠️ Tech Stack

**Frontend**
- React.js (Create React App)
- React Router
- Framer Motion — animation
- @dnd-kit — accessible drag-and-drop
- Socket.IO Client
- Axios

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO — real-time sync engine
- JWT + bcrypt — authentication
- Groq SDK (LLaMA 3.1) — AI content generation

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## 🏗️ Architecture

```
livecanvas/
├── backend/
│   ├── config/          # DB connection
│   ├── models/          # User, Page (with embedded Block subdocuments)
│   ├── routes/          # auth, pages, ai
│   ├── middleware/      # JWT auth guard
│   ├── utils/           # permission helpers
│   └── server.js        # Express + Socket.IO server
│
└── frontend/
    ├── src/
    │   ├── api/          # axios instance, socket client, auth calls
    │   ├── components/   # Block, AIModal, PreviewStrip, ProtectedRoute
    │   ├── pages/         # Login, Signup, Dashboard, Editor, PublicView
    │   └── utils/         # greeting helper
    └── public/
```

### How real-time sync works
Each page has its own Socket.IO **room**. When a user edits a block, the change is:
1. Applied optimistically to local state (instant feedback)
2. Persisted via REST API to MongoDB
3. Broadcast to everyone else in that page's room via Socket.IO

This keeps the REST API as the single source of truth while Socket.IO handles low-latency propagation — REST for durability, WebSockets for speed.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB Atlas connection string
- A free Groq API key ([console.groq.com](https://console.groq.com))

### Backend setup
```bash
cd backend
npm install
```

Create a `.env` file:
```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

```bash
npm run dev
```

### Frontend setup
```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## 🧪 Testing Real-Time Sync Locally

1. Sign up and log in
2. Create a page and open it in the editor
3. Open the same page URL in a second browser tab (or incognito window)
4. Edit a block in one tab — watch it update live in the other

---

## 📌 Design Decisions

- **Blocks are embedded subdocuments**, not a separate collection — since blocks are always fetched with their parent page, embedding avoids unnecessary joins/populates.
- **Optimistic UI updates** — local state updates immediately on edit, then syncs to the server, so typing never feels blocked on network latency.
- **REST + Socket.IO split** — REST handles persistence and authorization; Socket.IO handles broadcast only. This keeps permission logic in one place (Express middleware) instead of duplicating it in socket handlers.
- **No CRDT/operational transforms** — simultaneous edits to the exact same block use last-write-wins. A production version would add conflict resolution (e.g. Yjs) for true concurrent text editing.

---

## 🗺️ Possible Future Improvements

- Collaborator invite system (owner/editor roles) for sharing pages with non-owners
- Version history / undo
- Real CRDT-based conflict resolution for simultaneous same-block edits
- Image upload (currently URL-based only)

---

## 📄 License

MIT