
# HeyMint 💬✨
<table>
<tr>
<td>
  HeyMint is a modern video conferencing platform designed to make meetings more meaningful and effortless. Hosts can create free or protected meetings, while Stream-powered recording and transcription produce speaker-aware summaries and grounded conversational insights after each call.
</td>
</tr>
</table>

## 🚀 Features
 
 - 🔐 Access + Refresh token-based security
 
- 🧑 User management (Sign up / Login)

- 📅 Free and protected meeting scheduling

- 🧠 Speaker-aware summaries and meeting chatbot

- 🛡️ Participant-based access to protected insights

- ⚡ Fast Vite-based React frontend

- 📦 Express + Prisma backend with PostgreSQL

## 💡 Architecture


![](./frontend/src/assets/images/arch.png)


## 🛠️ Tech Stack
**Frontend**
- React (Vite)
- Tailwind CSS
- Shadcn/UI
- Framer Motion

**Backend**
- Node.js
- Express.js
- Prisma ORM

**Database**
- PostgreSQL

**Authentication**
- OTP based login (Resend)
- Google OAuth 2.0 (Passport)

**SDK Used**
- GetStream

## Meeting insights pipeline

Meeting audio is captured with Stream individual recording while Stream generates a speaker-attributed transcript. The verified Stream webhook stores a durable PostgreSQL job, and a separate worker normalizes the transcript, generates the summary, and updates the RAG index.

After configuring the backend environment from `backend/.env.example`, run:

```bash
cd backend
npx prisma migrate deploy
npm run build
```

Run the API and worker as separate processes:

```bash
npm start
npm run worker
```

Configure Stream to send video webhooks to `https://<backend-host>/api/webhooks/stream` and enable transcription for the `default` call type.



© [Abhay Pratap Singh ](https://github.com/drrakonov)
