# Vietnam Stock Market Portfolio Tracker

A comprehensive web application for tracking Vietnamese stock market portfolios with real-time price updates, alerts, and market news integration.

## 🌟 Features

### Core Features
- **Real-time Portfolio Tracking**: Monitor your stock investments with live price updates
- **Multiple Portfolio Management**: Create and manage multiple investment portfolios
- **Smart Alerts System**: Set price, volume, and percentage change alerts
- **Market News Integration**: Stay updated with latest market news and sentiment analysis
- **Watchlist Management**: Track stocks you're interested in
- **Performance Analytics**: Detailed portfolio performance analysis and risk metrics

### Advanced Features
- **Real-time Updates**: WebSocket-based live price feeds
- **Email Notifications**: Get alerts and reports via email
- **User Authentication**: Secure JWT-based authentication with email verification
- **Rate Limiting**: API protection with Redis-based rate limiting
- **Data Caching**: Optimized performance with intelligent caching
- **Mobile Responsive**: Works seamlessly on all devices

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - Real-time communication
- **Redis** - Caching and rate limiting
- **JWT** - Authentication
- **Nodemailer** - Email services
- **Joi** - Data validation
- **Cheerio** - Web scraping for news

### Frontend (To be implemented)
- **React.js** - UI framework
- **Redux/Context API** - State management
- **Material-UI/Ant Design** - UI components
- **Chart.js/Recharts** - Data visualization
- **Socket.io-client** - Real-time updates

## 📁 Project Structure

```
vietnam-stock-tracker/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Stock.js
│   │   ├── Watchlist.js
│   │   ├── Alert.js
│   │   └── News.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── portfolio.js
│   │   ├── stock.js
│   │   ├── alert.js
│   │   ├── watchlist.js
│   │   ├── news.js
│   │   └── analytics.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── services/
│   │   ├── priceService.js
│   │   ├── alertService.js
│   │   ├── emailService.js
│   │   ├── newsService.js
│   │   └── rateLimitService.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── client/ (To be implemented)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Redis (optional, for caching and rate limiting)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vietnam-stock-tracker.git
   cd vietnam-stock-tracker
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/vietnam_stock_tracker
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   
   # Email
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # DNSE API
   DNSE_API_KEY=your_dnse_api_key
   ```

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis (optional)
   redis-server
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

### API Documentation

#### Authentication Endpoints
```
POST /api/auth/register       - Register new user
POST /api/auth/login          - User login
POST /api/auth/refresh        - Refresh JWT token
POST /api/auth/forgot-password - Request password reset
POST /api/auth/verify-email   - Verify email address
```

#### Portfolio Endpoints
```
GET    /api/portfolio         - Get user portfolios
POST   /api/portfolio         - Create new portfolio
GET    /api/portfolio/:id     - Get portfolio details
PUT    /api/portfolio/:id     - Update portfolio
DELETE /api/portfolio/:id     - Delete portfolio
POST   /api/portfolio/:id/stocks - Add stock to portfolio
```

#### Stock Endpoints
```
GET    /api/stock             - Get stock list with filters
GET    /api/stock/search      - Search stocks
GET    /api/stock/:symbol     - Get stock details
GET    /api/stock/:symbol/history - Get price history
```

#### Alert Endpoints
```
GET    /api/alert             - Get user alerts
POST   /api/alert             - Create new alert
PUT    /api/alert/:id         - Update alert
DELETE /api/alert/:id         - Delete alert
```

#### News Endpoints
```
GET    /api/news              - Get news with filters
GET    /api/news/trending     - Get trending news
GET    /api/news/search       - Search news
GET    /api/news/:id          - Get news details
```

## 🔧 Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### DNSE API Setup
1. Register for DNSE Lightspeed API access
2. Get your API credentials
3. Add credentials to environment variables

### Redis Setup (Optional)
Redis is used for caching and rate limiting. If not available, the application will fall back to memory storage.

```bash
# Install Redis
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

## 📊 Features in Detail

### Real-time Price Updates
- WebSocket-based live updates
- Automatic market hours detection
- Fallback to mock data for development
- Configurable update intervals

### Alert System
- Multiple alert types: price, volume, percentage change
- Email notifications
- Smart triggering logic
- Performance tracking

### News Integration
- Automated news scraping from Vietnamese financial websites
- Sentiment analysis
- Stock symbol extraction
- Categorization and filtering

### Portfolio Management
- Multiple portfolio support
- Performance calculations
- Risk metrics
- Sharing capabilities
- Import/export functionality

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test models/User.test.js
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure email service
5. Set up Redis for production

### Docker Deployment (Optional)
```bash
# Build Docker image
docker build -t vietnam-stock-tracker .

# Run with Docker Compose
docker-compose up -d
```

### Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2, ECS, or Lambda
- **Vercel**: For frontend deployment

## 📈 Performance Optimization

- **Caching**: Redis-based caching for frequently accessed data
- **Rate Limiting**: Protection against API abuse
- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **CDN**: Static asset delivery optimization

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API protection
- **Helmet.js**: Security headers
- **Input Validation**: Joi-based validation
- **CORS Configuration**: Cross-origin protection
- **Environment Variables**: Secure configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Rate Limits

- **General API**: 1000 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour
- **Stock Prices**: 60 requests per minute
- **Premium Users**: Higher limits available

## 🐛 Known Issues

- DNSE API integration requires valid credentials
- Email notifications require Gmail App Password
- Redis is recommended for production rate limiting

## 🔮 Roadmap

### Phase 1 - Backend (Completed ✅)
- [x] User authentication and management
- [x] Portfolio CRUD operations
- [x] Real-time price service
- [x] Alert system
- [x] News service
- [x] Email notifications

### Phase 2 - Frontend (Next)
- [ ] React.js application setup
- [ ] User interface components
- [ ] Dashboard implementation
- [ ] Real-time updates integration
- [ ] Mobile responsiveness

### Phase 3 - Advanced Features
- [ ] Advanced analytics and charts
- [ ] Social features (sharing, following)
- [ ] Mobile app development
- [ ] Premium subscription features
- [ ] API marketplace integration

## 📞 Support

For support, email support@vietnamstocktracker.com or join our Telegram group.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- DNSE for providing market data API
- Vietnamese financial news sources
- Open source community for amazing tools and libraries

---

**Note**: This is a development version. Please ensure proper security measures before deploying to production.
