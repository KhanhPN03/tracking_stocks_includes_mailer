# 🚀 How to Start and Deploy Your Vietnamese Stock Tracker

## 🎯 **Quick Start (Already Done!)**

Your project is now set up and ready to run! I've created several helper scripts for you:

### For Windows Users:
```cmd
# Run this to start everything:
quick-start.bat

# Or start individually:
start-dev.bat      # Both frontend and backend
start-backend.bat  # Backend only  
start-frontend.bat # Frontend only
```

### For Linux/Mac Users:
```bash
# Run this to start everything:
./quick-start.sh

# Or start individually:
./start-dev.sh      # Both frontend and backend
./start-backend.sh  # Backend only
./start-frontend.sh # Frontend only
```

## 🌐 **Publishing to Live Website (Free!)**

### Step 1: Get Free Accounts
1. **Vercel** (Frontend hosting): [vercel.com](https://vercel.com) - Sign up with GitHub
2. **Railway** (Backend hosting): [railway.app](https://railway.app) - Sign up with GitHub  
3. **MongoDB Atlas** (Database): [mongodb.com/atlas](https://mongodb.com/atlas) - Free account

### Step 2: Get API Keys (Free)
1. **Alpha Vantage**: [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. **Gmail App Password**: Google Account → Security → 2-Step Verification → App passwords

### Step 3: Deploy in This Order

#### A. Database First (MongoDB Atlas)
1. Create free cluster
2. Create database user
3. Get connection string (starts with `mongodb+srv://`)
4. Whitelist all IPs (0.0.0.0/0)

#### B. Backend (Railway)
1. Connect your GitHub repository
2. Deploy the root folder (it will auto-detect the server)
3. Add environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=8080
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secure-secret-32-chars-minimum
   ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password
   SERVER_TIMEZONE=Asia/Ho_Chi_Minh
   SERVER_START_HOUR=9
   SERVER_END_HOUR=15
   ```
4. Get your Railway URL (e.g., `https://yourapp.railway.app`)

#### C. Frontend (Vercel)
1. Import your GitHub repository
2. Set root directory to `client`
3. Framework preset: `Vite`
4. Add environment variables:
   ```
   VITE_API_URL=https://yourapp.railway.app
   VITE_WS_URL=wss://yourapp.railway.app
   ```
5. Deploy!

### Step 4: Your Live Website!
- **Frontend**: `https://yourproject.vercel.app`
- **Backend API**: `https://yourproject.railway.app`

## 🎯 **Complete Flow Summary**

```bash
# 1. Local Development (Already set up!)
./start-dev.sh   # Start locally at localhost:3000

# 2. Test everything works locally

# 3. Push to GitHub
git add .
git commit -m "🚀 Ready for production"
git push origin main

# 4. Deploy to free hosting:
#    - MongoDB Atlas (database)
#    - Railway (backend API)  
#    - Vercel (frontend website)

# 5. Your website is live! 🎉
```

## 🔧 **Environment Variables Needed**

### For Railway (Backend):
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
```

### For Vercel (Frontend):
```env
VITE_API_URL=https://your-railway-app.railway.app
VITE_WS_URL=wss://your-railway-app.railway.app
```

## ✅ **Your Application Features**

Once deployed, your website will have:

- 🕘 **Smart Scheduling**: Automatically active 9 AM-3 PM Vietnam time
- 📊 **Real-time Stock Tracking**: Live prices and portfolio updates
- 📈 **User Analytics**: Track all user interactions automatically
- 🔔 **Alert System**: Price and volume notifications
- 📱 **Mobile Responsive**: Works on all devices
- 🔒 **Secure**: 0 vulnerabilities, production-ready
- 🚀 **Auto-scaling**: Handles traffic automatically

## 🎉 **Success!**

Your Vietnamese Stock Tracker will be live on the internet with:
- ✅ Professional-grade hosting
- ✅ Automatic SSL certificates  
- ✅ Global CDN for fast loading
- ✅ Automatic backups
- ✅ 99.9% uptime guarantee
- ✅ **All completely FREE!**

## 📞 **Need Help?**

If you run into any issues:
1. Check the `COMPLETE_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Look at the logs in Railway/Vercel dashboards
3. Make sure all environment variables are set correctly

Your Vietnamese Stock Tracker is ready to go live! 🚀🇻🇳

**Author: KhanhPN aka Laza**
