# Day in the Life

Scrapbook-inspired social web app for hourly moments.

## Stack

- Next.js + React
- Tailwind CSS
- MongoDB Atlas
- Cloudinary
- react-webcam

## MVP implemented

- Camera capture with countdown (`react-webcam`)
- Upload image to Cloudinary through server API
- Save photo metadata in MongoDB
- Display photos in a vertical scrapbook timeline feed
- Prompt sticky note + empty state

## Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env.local
```

3. Fill `.env.local`

- `MONGODB_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

4. Start dev server

```bash
npm run dev
```

5. Open http://localhost:3000

## API

- `GET /api/photos` fetch latest photos
- `POST /api/photos` body:

```json
{
  "imageData": "data:image/jpeg;base64,...",
  "prompt": "What do you appreciate right now?",
  "userId": "guest"
}
```

## Notes

- This is auth-free MVP. `user_id` is currently set to `guest` from client.
- If Cloudinary or Mongo env vars are missing, API routes will fail fast on startup.
