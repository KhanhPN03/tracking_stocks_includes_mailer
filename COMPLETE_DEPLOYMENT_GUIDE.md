# 🚀 Complete Deployment Guide: From Local to Live Website

## 📋 Prerequisites Checklist

Before we start, make sure you have:
- [x] Node.js 18+ installed
- [x] Git installed and configured
- [x] A GitHub account
- [x] Your project code ready

## 🔧 Step 1: Local Development Setup

### 1.1 Install Dependencies
```bash
# Navigate to your project
cd /d/stock/stock_RT_price_news

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 1.2 Environment Configuration
Create environment files for both development and production:

```bash
# Create server environment file
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vietnam_stock_tracker

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# External APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
DNSE_API_KEY=your_dnse_api_key

# Email Service (for notifications)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Scheduling
SERVER_TIMEZONE=Asia/Ho_Chi_Minh
SERVER_START_HOUR=9
SERVER_END_HOUR=15

# Development
NODE_ENV=development
PORT=5000

# Activity Logging
ACTIVITY_BATCH_SIZE=10
ACTIVITY_BATCH_INTERVAL=5000
```

### 1.3 Start Local Development
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend (in new terminal)
cd client
npm run dev
```

Your application will be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🌐 Step 2: Free Website Publishing Setup

We'll use completely free services to publish your website:

### 2.1 Frontend Deployment (Vercel) - FREE
1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Connect Repository**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` folder as root directory

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### 2.2 Backend Deployment (Railway) - FREE
1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select "Deploy Now"

3. **Configure Environment Variables**
   Add these to Railway dashboard:
   ```
   NODE_ENV=production
   PORT=8080
   MONGODB_URI=mongodb+srv://... (from MongoDB Atlas)
   JWT_SECRET=production_secure_secret_32_chars_minimum
   ALPHA_VANTAGE_API_KEY=your_api_key
   SERVER_TIMEZONE=Asia/Ho_Chi_Minh
   SERVER_START_HOUR=9
   SERVER_END_HOUR=15
   ```

### 2.3 Database Setup (MongoDB Atlas) - FREE
1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free account

2. **Create Free Cluster**
   - Choose "Free Shared" option
   - Select region closest to your users
   - Cluster name: `vietnam-stock-tracker`

3. **Setup Database Access**
   - Create database user with username/password
   - Add your IP address to whitelist (0.0.0.0/0 for all access)
   - Get connection string

## 🔐 Step 3: Production Environment Variables

### 3.1 Get Required API Keys

#### Alpha Vantage API (Free Stock Data)
1. Go to [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Sign up for free API key
3. Use this key in your environment variables

#### Gmail App Password (For Email Notifications)
1. Enable 2-Factor Authentication on your Gmail
2. Go to Google Account settings
3. Generate App Password for "Mail"
4. Use this password in EMAIL_PASS

### 3.2 Configure Production Environment Variables

#### Railway (Backend) Environment Variables:
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vietnam_stock_tracker
JWT_SECRET=super_secure_production_secret_minimum_32_characters
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
SERVER_TIMEZONE=Asia/Ho_Chi_Minh
SERVER_START_HOUR=9
SERVER_END_HOUR=15
ACTIVITY_BATCH_SIZE=10
ACTIVITY_BATCH_INTERVAL=5000
```

#### Vercel (Frontend) Environment Variables:
```env
VITE_API_URL=https://your-railway-app.railway.app
VITE_WS_URL=wss://your-railway-app.railway.app
```

## 🚀 Step 4: Automated Deployment Process

### 4.1 GitHub Actions Setup (Already Configured!)
Your project already has CI/CD pipeline in `.github/workflows/ci-cd.yml`. When you push to GitHub:

1. **Automatic Testing**: Runs all tests
2. **Security Scanning**: Checks for vulnerabilities
3. **Build Process**: Creates production bundles
4. **Deployment**: Automatically deploys to staging and production

### 4.2 Deploy to Production
```bash
# Commit your changes
git add .
git commit -m "🚀 Ready for production deployment"

# Push to main branch (triggers automatic deployment)
git push origin main
```

## 📱 Step 5: Custom Domain Setup (Optional)

### 5.1 Add Custom Domain to Vercel
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain (e.g., `mystocktracker.com`)
4. Follow DNS configuration instructions

### 5.2 Add Custom Domain to Railway
1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add custom domain for API (e.g., `api.mystocktracker.com`)

## 🔧 Step 6: Testing Your Live Website

### 6.1 Frontend Testing
Visit your Vercel URL and test:
- [ ] User registration/login
- [ ] Dashboard loads correctly
- [ ] Server status card shows current status
- [ ] Portfolio management works
- [ ] Real-time updates function

### 6.2 Backend API Testing
Test your Railway API URL:
```bash
# Health check
curl https://your-app.railway.app/health

# Server status
curl https://your-app.railway.app/api/activity/server-status
```

## 📊 Step 7: Monitoring and Maintenance

### 7.1 Monitor Your Application
- **Vercel**: Check deployment status and analytics
- **Railway**: Monitor resource usage and logs
- **MongoDB Atlas**: Monitor database performance

### 7.2 View Application Logs
```bash
# Railway logs (in Railway dashboard)
# Check for any errors or issues

# MongoDB Atlas logs
# Monitor database queries and performance
```

## 🎯 Quick Start Commands

Here's everything you need to run in order:

```bash
# 1. Setup local development
cd /d/stock/stock_RT_price_news
cd server && npm install
cd ../client && npm install

# 2. Configure environment
# Edit server/.env with your settings

# 3. Test locally
cd server && npm run dev
# In new terminal: cd client && npm run dev

# 4. Deploy to production
git add .
git commit -m "🚀 Production deployment"
git push origin main
```

## 🌟 Your Live Website URLs

After deployment, you'll have:

- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-project.railway.app`
- **Admin Dashboard**: `https://your-project.vercel.app/dashboard`

## 🔍 Troubleshooting Common Issues

### Issue 1: Build Fails on Vercel
**Solution**: Check that your `client/package.json` has correct build scripts:
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### Issue 2: API Connection Issues
**Solution**: Update frontend environment variables:
```env
VITE_API_URL=https://your-actual-railway-domain.railway.app
```

### Issue 3: Database Connection Fails
**Solution**: Check MongoDB Atlas:
- Whitelist IP addresses (0.0.0.0/0 for all)
- Verify connection string
- Check database user permissions

### Issue 4: Server Scheduling Not Working
**Solution**: Verify timezone environment variable:
```env
SERVER_TIMEZONE=Asia/Ho_Chi_Minh
TZ=Asia/Ho_Chi_Minh
```

## 🎉 Success! Your Website is Live

Congratulations! Your Vietnamese Stock Tracker is now live on the internet with:

✅ **Intelligent Scheduling**: Automatically operates during market hours (9 AM-3 PM)  
✅ **User Activity Analytics**: Tracks all user interactions  
✅ **Real-time Updates**: Live stock prices and server status  
✅ **Production Security**: 0 vulnerabilities, secure deployment  
✅ **Free Hosting**: No monthly costs with free tier limits  

## 📈 Next Steps

1. **Share your website** with friends and users
2. **Monitor analytics** to see user engagement
3. **Add more features** as needed
4. **Scale up** if you need more resources

## 💡 Pro Tips

- **Custom Domain**: Add your own domain for professional look
- **SSL Certificate**: Automatically included with Vercel and Railway
- **Performance**: Monitor Core Web Vitals in Vercel dashboard
- **Backup**: Regular MongoDB Atlas backups are automatic
- **Updates**: Push to GitHub to automatically deploy updates

Your Vietnamese Stock Tracker is now live and ready for users! 🚀🇻🇳
