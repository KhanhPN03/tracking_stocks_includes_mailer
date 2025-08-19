# 🚀 CI/CD & Production Deployment Guide

This guide covers setting up automated CI/CD pipeline and deploying to free cloud services.

## 📦 CI/CD Pipeline Features

✅ **Automated Testing** - Runs tests on every push/PR  
✅ **Security Scanning** - Checks for vulnerabilities and sensitive files  
✅ **Automated Building** - Builds both frontend and backend  
✅ **Multi-Environment Deployment** - Staging and Production environments  
✅ **Health Checks** - Monitors application health post-deployment  

## 🔧 Quick Setup Guide

### 1. Prepare Free Cloud Accounts

**Required (All Free):**
- GitHub account (for repository and CI/CD)
- Railway account (backend hosting) - $5/month credit
- Vercel account (frontend hosting) - Free tier
- MongoDB Atlas (database) - 512MB free tier

**Optional but Recommended:**
- Alpha Vantage (stock data API) - Free tier: 5 API requests per minute

### 2. Fork & Clone Repository

```bash
# Fork this repository on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/vietnam-stock-tracker.git
cd vietnam-stock-tracker
```

### 3. Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free account → Create cluster (M0 Sandbox - FREE)
3. Create database user: `Database Access` → `Add New Database User`
4. Network Access: Add IP `0.0.0.0/0` (allow all) or your specific IPs
5. Get connection string: `Clusters` → `Connect` → `Connect your application`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/vietnam_stock_tracker`

### 4. Deploy Backend to Railway

1. Go to [Railway](https://railway.app) → Sign up with GitHub
2. `New Project` → `Deploy from GitHub repo` → Select your forked repo
3. Choose `server` folder as root directory
4. Add Environment Variables in Railway dashboard:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vietnam_stock_tracker
JWT_SECRET=your_super_secure_jwt_secret_at_least_64_characters_long
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_at_least_64_characters
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
CLIENT_URL=https://your-vercel-app.vercel.app
PORT=5000
```

5. Deploy and note your Railway app URL (e.g., `https://your-app.up.railway.app`)

### 5. Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) → Sign up with GitHub
2. `Add New Project` → Import your GitHub repo
3. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:

```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
VITE_SERVER_URL=https://your-railway-app.up.railway.app
VITE_SOCKET_URL=https://your-railway-app.up.railway.app
VITE_APP_NAME=Vietnam Stock Tracker
VITE_APP_VERSION=1.0.0
```

5. Deploy and get your Vercel URL

### 6. Update CORS Settings

Update Railway environment variable:
```env
CLIENT_URL=https://your-vercel-app.vercel.app
```

## 🔄 CI/CD Automation Setup

### Enable GitHub Actions

The repository includes a complete CI/CD pipeline (`.github/workflows/ci-cd.yml`) that:

1. **Triggers** on push to `main` or `develop` branches
2. **Tests** both frontend and backend
3. **Security scans** for vulnerabilities
4. **Builds** applications
5. **Deploys** automatically to staging/production

### Add GitHub Secrets

Go to your GitHub repo → `Settings` → `Secrets and variables` → `Actions`

Add these secrets:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

**To get Vercel tokens:**
1. Vercel Dashboard → Settings → Tokens → Create
2. Project settings → General → Project ID

## 🛡️ Security Features

### Automated Security Scanning

The CI/CD pipeline includes:
- `npm audit` for dependency vulnerabilities
- Sensitive file detection
- Environment variable validation
- CORS configuration checks

### Security Best Practices Applied

✅ **Environment Variables**: All secrets in environment variables  
✅ **CORS Protection**: Configured for production domains  
✅ **Rate Limiting**: API rate limiting implemented  
✅ **Input Validation**: Joi validation on all inputs  
✅ **Authentication**: JWT with refresh tokens  
✅ **Password Security**: bcrypt hashing  
✅ **Helmet.js**: Security headers configured  

## 🚀 Deployment Commands

### Local Testing with Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up
```

### Manual Deployment

```bash
# Frontend build
cd client
npm install
npm run build

# Backend preparation  
cd ../server
npm install
npm run lint
npm test
```

## 📊 Monitoring & Health Checks

### Built-in Health Endpoints

- **Backend Health**: `https://your-railway-app.up.railway.app/api/health`
- **Frontend**: Automatically monitored by Vercel

### Monitoring Tools

- **Railway**: Built-in metrics and logs dashboard
- **Vercel**: Analytics and performance monitoring
- **MongoDB Atlas**: Database performance monitoring

## 🔧 Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `MONGODB_URI` | Database connection | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Yes | `64-char-random-string` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | `64-char-random-string` |
| `EMAIL_USER` | Gmail username | Yes | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app password | Yes | `16-char-app-password` |
| `ALPHA_VANTAGE_API_KEY` | Stock data API key | Yes | `your-api-key` |
| `CLIENT_URL` | Frontend URL | Yes | `https://your-app.vercel.app` |
| `PORT` | Server port | No | `5000` |

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `https://your-app.up.railway.app/api` |
| `VITE_SERVER_URL` | Backend base URL | Yes | `https://your-app.up.railway.app` |
| `VITE_SOCKET_URL` | WebSocket URL | Yes | `https://your-app.up.railway.app` |
| `VITE_APP_NAME` | Application name | No | `Vietnam Stock Tracker` |
| `VITE_APP_VERSION` | App version | No | `1.0.0` |

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Usage Limits | Cost After |
|---------|-----------|--------------|------------|
| **Railway** | $5 credit/month | ~550 hours runtime | $5-20/month |
| **Vercel** | Free forever | 100GB bandwidth | $20/month Pro |
| **MongoDB Atlas** | Free forever | 512MB storage | $9/month (2GB) |
| **Alpha Vantage** | Free forever | 5 requests/minute | $49.99/month |
| **GitHub Actions** | Free | 2000 minutes/month | $4/month |
| **Total** | **$0/month** | Perfect for testing | $38-53/month |

## 🚦 Deployment Checklist

### Pre-Deployment
- [ ] Create all required accounts (Railway, Vercel, MongoDB Atlas)
- [ ] Get API keys (Alpha Vantage, Gmail App Password)
- [ ] Fork repository and set up locally
- [ ] Configure environment variables

### During Deployment
- [ ] Deploy backend to Railway with environment variables
- [ ] Deploy frontend to Vercel with environment variables  
- [ ] Update CORS settings with frontend URL
- [ ] Set up GitHub secrets for CI/CD

### Post-Deployment Testing
- [ ] Frontend loads correctly (`https://your-app.vercel.app`)
- [ ] Backend health check works (`/api/health`)
- [ ] User registration/login functions
- [ ] Stock data loads (Vietnamese stocks)
- [ ] Real-time updates work (WebSocket)
- [ ] Email alerts function
- [ ] Mobile responsiveness

### CI/CD Verification
- [ ] Push to `develop` branch triggers staging deployment
- [ ] Push to `main` branch triggers production deployment
- [ ] GitHub Actions run successfully
- [ ] Security scans pass
- [ ] Tests execute properly

## 🆘 Troubleshooting Guide

### Common Issues & Solutions

**1. CORS Errors**
```
Solution: Update CLIENT_URL in Railway to match your Vercel URL exactly
```

**2. Database Connection Failed**
```
Solution: Check MONGODB_URI format and IP whitelist in Atlas
```

**3. Email Service Not Working**
```
Solution: Generate Gmail App Password (not regular password)
Account → Security → 2-Step Verification → App passwords
```

**4. Build Failures**
```
Solution: Check package.json dependencies and Node.js version compatibility
```

**5. Environment Variables Not Loading**
```
Solution: Ensure all required variables are set in deployment platforms
Check spelling and format exactly as documented
```

### Support Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🎉 Success! Your App is Live

After following this guide, you'll have:

✅ **Production-ready Vietnam Stock Tracker**  
✅ **Automated CI/CD pipeline**  
✅ **Free hosting on reliable platforms**  
✅ **Professional monitoring and security**  
✅ **Scalable architecture for future growth**  

**Frontend URL**: `https://your-app.vercel.app`  
**Backend URL**: `https://your-app.up.railway.app`  
**Admin Panel**: Available at `/admin` route  

**Next Steps:**
1. Share your live app with users
2. Monitor usage and performance  
3. Scale up resources as needed
4. Consider custom domain names
5. Add more Vietnamese stocks to database
