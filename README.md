# FoodWorld POS Dashboard

FoodWorld is a restaurant POS and storefront app with a React frontend and a Node.js/Express backend connected to MongoDB.

This project is configured to use the custom backend instead of Supabase. The frontend calls the backend through the `VITE_API_URL` environment variable.

## Project setup

### Frontend

1. Copy `.env.example` to `.env`.
2. Set the API URL for your backend.

Example:

```bash
VITE_API_URL=http://localhost:5000/api
```

For production on Vercel, set the same variable in the Vercel project settings:

```bash
VITE_API_URL=https://your-backend-domain.com/api
```

### Backend

Go to the backend folder:

```bash
cd backend
cp .env.example .env
```

Set MongoDB and JWT values:

```bash
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/foodworld
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.vercel.app
```

Install dependencies:

```bash
npm install
npm run seed
npm start
```

## Local development

Run the backend first:

```bash
cd backend && npm start
```

Run the frontend:

```bash
npm run dev
```

## Deploy to MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Whitelist `0.0.0.0/0` for testing, or your hosting IPs for production.
4. Copy the Atlas connection string and place it in `backend/.env`:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/foodworld
```

## Deploy frontend to Vercel

1. Push the project to GitHub.
2. Import the project in Vercel.
3. Set the build command:

```bash
npm run build
```

4. Set the output directory:

```bash
dist
```

5. Add environment variable:

```bash
VITE_API_URL=https://your-backend-domain.com/api
```

## Deploy backend to a Node host

Use any Node deployment platform such as Render, Railway, Fly.io, or similar.

Set these environment variables in the backend host:

```bash
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/foodworld
JWT_SECRET=your_long_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.vercel.app
```

Then deploy the backend from the `backend` folder.

## Notes

- Supabase has been removed from active app usage.
- Frontend/API communication is now done through the Node backend on `VITE_API_URL`.
- The app expects MongoDB Atlas or a compatible MongoDB instance for data storage.
