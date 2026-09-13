# Deployment Guide
> Author: Aakarsh Sharma  
> Application: AI Interview Prep Kit  

This guide explains how to deploy the **AI Interview Prep Kit** to **GitHub** and **Render**, along with running it behind an **Nginx** reverse proxy and using **Docker**.

---

## 1. GitHub Deployment & Repository Setup

### Push to GitHub
```bash
# Verify remote repository
git remote -v

# Push to your GitHub repository
git push -u origin main
```

### GitHub Secrets for CI/CD (Optional)
If setting up automated testing via GitHub Actions:
- `GEMINI_API_KEY`: Google Gemini API key (optional for offline mock mode).
- `GROQ_API_KEY`: Groq Cloud API key (optional).
- `JWT_SECRET`: Random 32+ character string.

---

## 2. Deploying on Render

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint that configures both the Express API and Next.js frontend services.

### Option A: Render Blueprint (Recommended)
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository (`interview-prep-generator`).
4. Render detects [`render.yaml`](./render.yaml) and provisions two services:
   - `prep-kit-api`: Node.js Express backend (Port 5000).
   - `prep-kit-ui`: Next.js frontend (Port 3000).
5. In the environment variables section, set your `GEMINI_API_KEY` (or `GROQ_API_KEY`).
6. Click **Apply**. Both services will build and deploy automatically.

### Option B: Manual Service Setup on Render

#### 1. Backend Service (`prep-kit-api`)
- **Type:** Web Service
- **Environment:** Node
- **Root Directory:** Leave empty (repo root)
- **Build Command:** `cd server && npm install`
- **Start Command:** `cd server && npm start`
- **Health Check Path:** `/health`
- **Environment Variables:**
  ```env
  NODE_ENV=production
  PORT=5000
  JWT_SECRET=<your-random-jwt-secret>
  JWT_EXPIRES_IN=7d
  LLM_PROVIDER=gemini
  GEMINI_API_KEY=<your-api-key>
  FRONT_END_URL=https://prep-kit-ui.onrender.com
  ALLOWED_ORIGINS=https://prep-kit-ui.onrender.com
  ALLOW_LOCAL_URLS=false
  ```
  *(Note: If `MONGODB_URI` is not set, the server runs an embedded in-memory MongoDB instance automatically).*

#### 2. Frontend Service (`prep-kit-ui`)
- **Type:** Web Service
- **Environment:** Node
- **Build Command:** `cd client && npm install && npm run build`
- **Start Command:** `cd client && npm start`
- **Environment Variables:**
  ```env
  NODE_ENV=production
  NEXT_PUBLIC_API_BASE_URL=https://prep-kit-api.onrender.com
  ```

---

## 3. Nginx Reverse Proxy Setup

An [`nginx.conf`](./nginx.conf) configuration is provided for VPS / dedicated server deployments.

### Features
- Proxies `/api/*` to the Express backend (`127.0.0.1:5000`).
- Proxies `/` to the Next.js frontend (`127.0.0.1:3000`).
- Forwards `Authorization` headers (`Bearer <token>`) so JWT authentication works transparently.
- Configures Gzip compression for JSON, CSS, and JS bundles.
- Configures 60s upstream timeouts for long-running LLM generation requests.

### Running with Nginx
```bash
# Test nginx configuration syntax
nginx -t -c $(pwd)/nginx.conf

# Run nginx with the custom configuration
nginx -c $(pwd)/nginx.conf
```

---

## 4. Docker Deployment

A multi-stage [`Dockerfile`](./Dockerfile) builds the Next.js bundle and packages both the frontend and backend.

```bash
# Build the Docker image
docker build -t interview-prep-generator .

# Run the container
docker run -d \
  -p 5000:5000 \
  -p 3000:3000 \
  -e JWT_SECRET="your-jwt-secret-key" \
  -e GEMINI_API_KEY="your-gemini-key" \
  --name prep-kit \
  interview-prep-generator
```

---

## 5. Security & Authentication Architecture

- **JWT Authentication:** Stateful user authentication with bcrypt password hashing (10 rounds) and HTTP Bearer tokens.
- **SSRF Defenses:** Validates all crawled domains. Disallows loopbacks and private RFC 1918 addresses in production.
- **Input Sanitization:** Job descriptions, roles, and URLs are validated via Zod schemas before hitting any business logic.
- **Rate Limiting:** LLM generation and authentication routes are rate-limited to avoid abuse.
