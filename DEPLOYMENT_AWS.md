# Deploying Quizify on AWS

This guide outlines production deployment of **Quizify** on **Amazon Web Services (AWS)** without Vercel or third-party PaaS wrappers.

---

## Recommended AWS Architecture

```text
User Browser (HTTPS)
   │
   ▼
Amazon CloudFront (CDN + Custom Domain + ACM SSL)
   ├── /*       ──> Amazon S3 (React + Vite static bundle: client/dist)
   └── /api/*   ──> AWS App Runner or ECS Fargate / ALB (Express API: server/)
                        │
                        ▼
                    Amazon RDS (PostgreSQL 16 in private subnet)
```

Routing both `/*` and `/api/*` behind **one CloudFront distribution** keeps cookies **same-origin** (`COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`), eliminates CORS complexity, and keeps RDS isolated inside your VPC.

---

## Step 1: Provision PostgreSQL on Amazon RDS

1. Open **AWS Console → RDS → Create database**.
2. Choose **PostgreSQL** (v16), **Free tier** or **Production** template, and set:
   - DB instance identifier: `quizify-db`
   - Initial database name: `quizify`
   - Master username & strong password (store in **AWS Secrets Manager**).
3. Under **Connectivity**:
   - Place RDS in your VPC private subnets (**Public access: No** when using ECS/EC2/App Runner VPC connector).
   - Attach a security group allowing inbound TCP `5432` **only** from your backend's security group.
4. Build your `DATABASE_URL` (include `?sslmode=require` for RDS TLS):
   ```text
   postgresql://USER:PASSWORD@quizify-db.xxxx.region.rds.amazonaws.com:5432/quizify?schema=public&sslmode=require
   ```

---

## Step 2: Deploy the Backend (`server/`) to AWS App Runner or ECS Fargate

### Option A — AWS App Runner (Managed Container Service)

1. Create an **Amazon ECR** repository named `quizify-server`.
2. Build and push the backend image from `server/`:
   ```powershell
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker build -t quizify-server ./server
   docker tag quizify-server:latest <account-id>.dkr.ecr.<region>.amazonaws.com/quizify-server:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/quizify-server:latest
   ```
3. In **AWS App Runner → Create service**:
   - Source: Container registry (`ECR` → `quizify-server:latest`).
   - Port: `5000`.
   - Health check path: `/api/health` (HTTP).
   - Networking: Attach a **VPC Connector** so App Runner can reach your private Amazon RDS instance.
   - Environment variables (use Secrets Manager/Parameter Store for sensitive values):
     - `NODE_ENV=production`
     - `PORT=5000`
     - `CLIENT_URL=https://quizify.yourdomain.com`
     - `DATABASE_URL=<RDS connection string>`
     - `JWT_SECRET=<64-char random secret>`
     - `JWT_EXPIRES_IN=7d`
     - `JWT_COOKIE_NAME=quizify_token`
     - `COOKIE_SAME_SITE=lax` (use `none` only if frontend and API are on different domains)
     - `COOKIE_SECURE=true`
4. Run production Prisma migrations against RDS (from a bastion/VPC task or CI runner with VPC access):
   ```powershell
   cd server
   npx prisma migrate deploy
   ```

### Option B — Amazon EC2 with Docker Compose (Single-VM)

If you prefer a single EC2 instance (Ubuntu 24.04) connected to RDS (or running containerized Postgres):
1. Install Docker and Docker Compose on EC2.
2. Create a `.env` file alongside `docker-compose.yml` with strong `JWT_SECRET`, `CLIENT_URL`, and DB credentials.
3. Run:
   ```bash
   docker compose up -d --build
   ```
4. Terminate TLS at an **Application Load Balancer (ALB)** with an **ACM SSL certificate** forwarding HTTPS `:443` to EC2 `:80`.

---

## Step 3: Deploy the Frontend (`client/`) to Amazon S3 + CloudFront

1. Set the production API URL when building `client/`:
   - If using **CloudFront `/api/*` behavior** (recommended):
     ```powershell
     $env:VITE_API_URL="/api"
     npm --prefix client run build
     ```
   - If calling an App Runner / ALB subdomain directly (e.g. `https://api.quizify.yourdomain.com/api`):
     ```powershell
     $env:VITE_API_URL="https://api.quizify.yourdomain.com/api"
     npm --prefix client run build
     ```
2. Create a private **S3 bucket** (block all public access) and upload `client/dist/`:
   ```powershell
   aws s3 sync ./client/dist s3://your-quizify-frontend-bucket --delete
   ```
3. Create a **CloudFront distribution**:
   - **Origin 1**: S3 bucket using **Origin Access Control (OAC)**, Default root object `index.html`.
   - **Origin 2** *(if using same-origin `/api/*`)*: App Runner / ALB origin, with behavior path pattern `/api/*` (all HTTP methods, forward `Authorization`, `Cookie`, and query strings, disable caching).
   - **Custom Error Responses** (required for React Router SPA routes such as `/quizzes`, `/reports`, `/admin`):
     - HTTP `403` → Response page `/index.html`, HTTP `200`
     - HTTP `404` → Response page `/index.html`, HTTP `200`
   - Attach your **ACM SSL certificate** (`HTTPS only` / Redirect HTTP to HTTPS).

---

## Production Verification Checklist

- [ ] `https://your-domain/api/health` returns `200` with `database.connected: true`.
- [ ] User registration and login set `quizify_token` as `HttpOnly; Secure` cookie.
- [ ] Direct navigation or browser refresh on `/quizzes`, `/reports`, `/leaderboard`, and `/admin` loads cleanly via CloudFront SPA fallback.
- [ ] No development seed scripts (`prisma db seed`) are executed in production (`seed.js` enforces `NODE_ENV !== 'production'`).
- [ ] `JWT_SECRET` and `DATABASE_URL` are stored exclusively in AWS Secrets Manager / App Runner / ECS environment secrets, never in Git.
