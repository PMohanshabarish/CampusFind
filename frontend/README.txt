CAMPUS LOST & FOUND FRONTEND

1. Extract this folder into your existing project:
   campus lost and found/frontend

2. Keep the existing backend folder unchanged.

3. Start your backend:
   Open a terminal in backend and run:
   node server.js

4. Open frontend/index.html in a browser.
   Recommended: use the VS Code Live Server extension and click "Go Live".

5. Backend URL is configured in frontend/js/common.js:
   const API_BASE = "http://localhost:5000/api";

FEATURES
- Home page
- Register and login connected to /api/auth
- Browse items and search/filter connected to /api/items
- Report lost/found item connected to POST /api/items
- Submit a claim connected to POST /api/claims
- Admin dashboard lists claims and updates claim status

IMPORTANT LIMITATIONS
- This frontend matches the backend routes currently developed in this project.
- The current backend does not yet have dedicated "my items" or "my claims" endpoints, so the dashboard shows account information and (for Admin) all claims.
- Image upload is not wired up because the current item POST route accepts JSON and the backend image upload route has not yet been added.
- Protect your JWT token. It is stored in browser localStorage for this student project.
- If browser requests are blocked, confirm app.use(cors()) is enabled in backend/server.js.
