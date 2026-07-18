# Manwok 🚀

Manwok is a modern, real-time workspace and project management application inspired by Trello. It empowers teams to collaborate efficiently with boards, lists, and cards, featuring live updates and intuitive drag-and-drop interfaces.

## 🌟 Key Features

- **Real-time Collaboration**: Instant updates across all clients using Socket.io.
- **Drag and Drop**: Seamlessly move cards and lists with `react-beautiful-dnd`.
- **Workspaces & Boards**: Organize projects into dedicated workspaces and boards.
- **Card Details**: Add descriptions, checklists, due dates, comments, and attachments.
- **Authentication**: Secure JWT-based authentication and Google OAuth login.
- **Admin Dashboard**: Manage users, monitor growth, and handle system settings.

## 🛠️ Tech Stack

**Frontend (Client)**
- React 18, Vite, TypeScript
- Tailwind CSS & Lucide Icons
- Socket.io-client
- React Router DOM
- Zustand (State Management)

**Backend (Server)**
- Node.js, Express, TypeScript
- Prisma ORM & PostgreSQL (Neon)
- Socket.io for WebSockets
- Cloudinary (File Uploads)
- JWT & Google Auth Library

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Database
- Cloudinary Account
- Google OAuth Credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/quocviln-lang/manwok.git
   cd manwok
   ```

2. **Setup Backend:**
   ```bash
   cd apps/server
   npm install
   # Create a .env file based on .env.example
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd apps/client
   npm install
   # Create a .env file with VITE_API_URL, VITE_SOCKET_URL, VITE_GOOGLE_CLIENT_ID
   npm run dev
   ```
