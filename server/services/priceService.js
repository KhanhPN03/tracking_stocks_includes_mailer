const axios = require('axios');
const cron = require('node-cron');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const AlphaVantageService = require('./alphaVantageService');

class PriceService {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.updateInterval = null;
    this.priceCache = new Map();
    this.lastUpdate = null;
    this.errorCount = 0;
    this.maxErrors = 10;
    
    // Initialize API services
    this.alphaVantageService = new AlphaVantageService();
    
    // Yahoo Finance API configuration (fallback)
    this.yahooConfig = {
      baseURL: 'https://query1.finance.yahoo.com',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    // Rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 1000; // 1 second between requests
  }

  /**
   * Start the price service
   */
  start() {
    if (this.isRunning) {
      console.log('Price service is already running');
      return;
    }

    console.log('🚀 Starting Price Service...');
    this.isRunning = true;

    // Update prices immediately on start
    this.updateAllPrices();

    // Schedule regular updates during market hours
    this.scheduleMarketHoursUpdates();

    // Schedule after-hours updates (less frequent)
    this.scheduleAfterHoursUpdates();

    // Start processing request queue
    this.startQueueProcessor();

    console.log('✅ Price Service started successfully');
  }

  /**
   * Stop the price service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Price Service...');
    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    console.log('✅ Price Service stopped');
  }

  /**
   * Schedule updates during market hours (9:00-15:00 ICT, weekdays)
   */
  scheduleMarketHoursUpdates() {
    // Update every 5 seconds during market hours for real-time trading
    cron.schedule('*/5 * 9-14 * * 1-5', () => {
      if (this.isMarketOpen()) {
        this.updateAllPrices();
      }
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });

    // More frequent updates in the last 30 minutes of trading
    cron.schedule('*/3 * 14 * * 1-5', () => {
      if (this.isMarketOpen()) {
        const now = new Date();
        const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const minutes = vietnamTime.getMinutes();
        
        // Only in the last 30 minutes (14:30-15:00)
        if (minutes >= 30) {
          this.updateAllPrices();
        }
      }
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });
  }

  /**
   * Schedule updates outside market hours (less frequent)
   */
  scheduleAfterHoursUpdates() {
    // Update every 5 minutes outside market hours
    cron.schedule('*/5 * * * *', () => {
      if (!this.isMarketOpen()) {
        this.updateAllPrices();
      }
    }, {
      timezone: 'Asia/Ho_Chi_Minh'
    });
  }

  /**
   * Check if Vietnam stock market is currently open
   */
  isMarketOpen() {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    const hour = vietnamTime.getHours();
    const minute = vietnamTime.getMinutes();
    const dayOfWeek = vietnamTime.getDay();
    
    // Check if it's a weekday (Monday = 1, Friday = 5)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Trading hours: 9:00 - 15:00 ICT
    const currentTime = hour * 60 + minute;
    const marketOpen = 9 * 60; // 9:00
    const marketClose = 15 * 60; // 15:00
    
    return currentTime >= marketOpen && currentTime < marketClose;
  }

  /**
   * Update all stock prices
   */
  async updateAllPrices() {
    try {
      console.log('📊 Updating stock prices...');
      
      // Get all active stocks
      const stocks = await Stock.find({ isActive: true }).select('symbol exchange');
      
      if (stocks.length === 0) {
        console.log('No active stocks found');
        return;
      }

      // Group by exchange for batch requests
      const stocksByExchange = this.groupStocksByExchange(stocks);
      
      // Update each exchange
      for (const [exchange, exchangeStocks] of Object.entries(stocksByExchange)) {
        await this.updateExchangePrices(exchange, exchangeStocks);
      }

      this.lastUpdate = new Date();
      this.errorCount = 0; // Reset error count on successful update
      
      // Emit update to connected clients with optimized data
      this.emitOptimizedPriceUpdate();

      console.log(`✅ Updated ${stocks.length} stocks at ${this.lastUpdate.toISOString()}`);
      
    } catch (error) {
      this.handleError('updateAllPrices', error);
    }
  }

  /**
   * Emit optimized price updates to prevent UI lag
   */
  emitOptimizedPriceUpdate() {
    try {
      // Only send essential data to minimize payload size
      const optimizedData = {
        timestamp: this.lastUpdate,
        marketOpen: this.isMarketOpen(),
        // Only send updated symbols, not all stock data
        updateCount: this.priceCache.size
      };

      // Emit general update
      this.io.emit('price-update', optimizedData);

      // Emit specific updates for dashboard/portfolio views
      this.io.emit('market-status', {
        isOpen: this.isMarketOpen(),
        lastUpdate: this.lastUpdate
      });

    } catch (error) {
      console.error('Error emitting price updates:', error);
    }
  }

  /**
   * Get optimized stock data for specific symbols (used by frontend)
   */
  async getOptimizedStockData(symbols) {
    try {
      if (!symbols || symbols.length === 0) {
        return [];
      }

      // Get from cache first for better performance
      const cachedData = [];
      const missingSymbols = [];

      symbols.forEach(symbol => {
        const cached = this.priceCache.get(symbol);
        if (cached && this.isCacheValid(cached.timestamp)) {
          cachedData.push(cached);
        } else {
          missingSymbols.push(symbol);
        }
      });

      // Fetch missing data if needed
      if (missingSymbols.length > 0) {
        const freshData = await Stock.find({ 
          symbol: { $in: missingSymbols },
          isActive: true 
        }).select('symbol currentPrice previousClose dayChange dayChangePercent volume lastUpdated').lean();
        
        cachedData.push(...freshData);
      }

      return cachedData;
    } catch (error) {
      console.error('Error getting optimized stock data:', error);
      return [];
    }
  }

  /**
   * Check if cached data is still valid (within 30 seconds during market hours)
   */
  isCacheValid(timestamp) {
    const now = new Date();
    const age = now - timestamp;
    const maxAge = this.isMarketOpen() ? 30000 : 300000; // 30s during market, 5min after hours
    return age < maxAge;
  }

  /**
   * Group stocks by exchange
   */
  groupStocksByExchange(stocks) {
    return stocks.reduce((acc, stock) => {
      if (!acc[stock.exchange]) {
        acc[stock.exchange] = [];
      }
      acc[stock.exchange].push(stock);
      return acc;
    }, {});
  }

  /**
   * Update prices for a specific exchange
   */
  async updateExchangePrices(exchange, stocks) {
    try {
      const symbols = stocks.map(stock => stock.symbol);
      const batchSize = 50; // Process in batches to avoid overwhelming the API
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        await this.fetchAndUpdateBatch(exchange, batch);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < symbols.length) {
          await this.delay(this.rateLimitDelay);
        }
      }
    } catch (error) {
      console.error(`Error updating ${exchange} prices:`, error.message);
    }
  }

  /**
   * Fetch and update a batch of stocks
   */
  async fetchAndUpdateBatch(exchange, symbols) {
    try {
      // Prepare API request based on exchange
      const priceData = await this.fetchPriceData(exchange, symbols);
      
      if (!priceData || priceData.length === 0) {
        console.log(`No price data received for ${exchange} symbols:`, symbols);
        return;
      }

      // Update each stock in the database
      const updatePromises = priceData.map(async (stockData) => {
        try {
          await this.updateStockPrice(stockData);
          
          // Cache the price data
          this.priceCache.set(stockData.symbol, {
            ...stockData,
            timestamp: new Date()
          });
          
          // Emit individual stock update
          this.io.emit(`stock-update-${stockData.symbol}`, stockData);
          
        } catch (updateError) {
          console.error(`Error updating ${stockData.symbol}:`, updateError.message);
        }
      });

      await Promise.allSettled(updatePromises);
      
    } catch (error) {
      console.error(`Error in fetchAndUpdateBatch:`, error.message);
    }
  }

  /**
   * Fetch price data from multiple API sources (Alpha Vantage primary, Yahoo Finance fallback)
   */
  async fetchPriceData(exchange, symbols) {
    try {
      let priceData = [];
      
      // Try Alpha Vantage first if configured
      if (this.alphaVantageService.isConfigured()) {
        console.log('📊 Fetching price data from Alpha Vantage API...');
        try {
          priceData = await this.alphaVantageService.getMultipleQuotes(symbols);
          
          if (priceData && priceData.length > 0) {
            console.log(`✅ Alpha Vantage: Got data for ${priceData.length} symbols`);
            return priceData;
          } else {
            console.log('⚠️ Alpha Vantage returned no data, trying Yahoo Finance...');
          }
        } catch (error) {
          console.error('Alpha Vantage API Error:', error.message);
          console.log('⚠️ Alpha Vantage failed, trying Yahoo Finance fallback...');
        }
      } else {
        console.log('⚠️ Alpha Vantage not configured, using Yahoo Finance...');
      }

      // Fallback to Yahoo Finance
      console.log('📊 Fetching price data from Yahoo Finance API (fallback)...');
      priceData = await this.fetchFromYahooFinance(exchange, symbols);
      
      if (priceData && priceData.length > 0) {
        console.log(`✅ Yahoo Finance: Got data for ${priceData.length} symbols`);
        return priceData;
      }

      console.error('❌ All API sources failed. No real price data available.');
      return [];
      
    } catch (error) {
      console.error('Price Data Fetch Error:', error.message);
      return [];
    }
  }

  /**
   * Fetch price data from Yahoo Finance API (fallback method)
   */
  async fetchFromYahooFinance(exchange, symbols) {
    try {
      const priceData = [];
      
      // Yahoo Finance requires individual API calls for each symbol
      for (const symbol of symbols) {
        try {
          const yahooSymbol = this.convertToYahooSymbol(symbol, exchange);
          const response = await axios.get(`${this.yahooConfig.baseURL}/v8/finance/chart/${yahooSymbol}`, {
            headers: this.yahooConfig.headers,
            timeout: this.yahooConfig.timeout
          });

          const parsedData = this.parseYahooResponse(response.data, symbol);
          if (parsedData) {
            priceData.push(parsedData);
          }
          
          // Add small delay between requests to be respectful
          await this.delay(100);
          
        } catch (error) {
          console.error(`Error fetching ${symbol} from Yahoo:`, error.message);
        }
      }

      return priceData;
      
    } catch (error) {
      console.error('Yahoo Finance API Error:', error.message);
      return [];
    }
  }

  /**
   * Convert Vietnamese stock symbol to Yahoo Finance format
   */
  convertToYahooSymbol(symbol, exchange) {
    // Most Vietnamese stocks use .VN suffix on Yahoo Finance
    return `${symbol}.VN`;
  }

  /**
   * Parse Yahoo Finance API response
   */
  parseYahooResponse(data, originalSymbol) {
    try {
      if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
        console.log(`No data found for ${originalSymbol}`);
        return null;
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const indicators = result.indicators;
      
      if (!meta || !indicators) {
        console.log(`Invalid data structure for ${originalSymbol}`);
        return null;
      }

      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      const dayHigh = meta.regularMarketDayHigh;
      const dayLow = meta.regularMarketDayLow;
      const volume = meta.regularMarketVolume;
      
      // Calculate change
      const dayChange = currentPrice - previousClose;
      const dayChangePercent = ((dayChange / previousClose) * 100);

      return {
        symbol: originalSymbol,
        currentPrice: Math.round(currentPrice),
        previousClose: Math.round(previousClose),
        dayChange: Math.round(dayChange),
        dayChangePercent: parseFloat(dayChangePercent.toFixed(2)),
        volume: volume || 0,
        high: Math.round(dayHigh || currentPrice),
        low: Math.round(dayLow || currentPrice),
        open: Math.round(previousClose), // Yahoo doesn't always provide open price
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`Error parsing Yahoo response for ${originalSymbol}:`, error);
      return null;
    }
  }

  /**
   * Generate mock price data for development/testing
   */
  generateMockPriceData(symbols) {
    return symbols.map(symbol => {
      const basePrice = 50000 + Math.random() * 200000; // Random price between 50k-250k VND
      const change = (Math.random() - 0.5) * 0.1; // ±5% change
      const currentPrice = basePrice * (1 + change);
      
      return {
        symbol,
        currentPrice: Math.round(currentPrice),
        previousClose: Math.round(basePrice),
        dayChange: Math.round(currentPrice - basePrice),
        dayChangePercent: parseFloat((change * 100).toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
        high: Math.round(currentPrice * (1 + Math.random() * 0.02)),
        low: Math.round(currentPrice * (1 - Math.random() * 0.02)),
        open: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.01)),
        timestamp: new Date()
      };
    });
  }

  /**
   * Update stock price in database
   */
  async updateStockPrice(priceData) {
    try {
      const stock = await Stock.findOne({ symbol: priceData.symbol });
      
      if (!stock) {
        console.log(`Stock ${priceData.symbol} not found in database`);
        return;
      }

      // Update current price data
      stock.previousClose = stock.currentPrice || priceData.previousClose;
      stock.currentPrice = priceData.currentPrice;
      stock.dayChange = priceData.dayChange;
      stock.dayChangePercent = priceData.dayChangePercent;
      stock.volume = priceData.volume;
      stock.lastPriceUpdate = new Date();

      // Add to price history if it's a new trading day
      const today = new Date().toDateString();
      const lastHistoryDate = stock.priceHistory.length > 0 
        ? stock.priceHistory[stock.priceHistory.length - 1].date.toDateString()
        : '';

      if (today !== lastHistoryDate && priceData.open && priceData.high && priceData.low) {
        stock.priceHistory.push({
          date: new Date(),
          open: priceData.open,
          high: priceData.high,
          low: priceData.low,
          close: priceData.currentPrice,
          volume: priceData.volume
        });

        // Keep only last 365 days
        if (stock.priceHistory.length > 365) {
          stock.priceHistory = stock.priceHistory.slice(-365);
        }
      }

      await stock.save();
      
      // Update portfolio values that contain this stock
      await this.updatePortfolioValues(priceData.symbol, priceData.currentPrice);
      
    } catch (error) {
      console.error(`Error updating stock ${priceData.symbol}:`, error);
    }
  }

  /**
   * Update portfolio values when stock prices change
   */
  async updatePortfolioValues(symbol, newPrice) {
    try {
      const portfolios = await Portfolio.find({
        'stocks.symbol': symbol,
        isActive: true
      });

      const updatePromises = portfolios.map(async (portfolio) => {
        let totalValue = 0;
        let totalCost = 0;

        portfolio.stocks.forEach(stock => {
          const currentPrice = stock.symbol === symbol ? newPrice : (this.priceCache.get(stock.symbol)?.currentPrice || stock.purchasePrice);
          const stockValue = stock.currentQuantity * currentPrice;
          totalValue += stockValue;
          totalCost += stock.totalInvested;
        });

        portfolio.performance.totalValue = totalValue;
        portfolio.performance.totalCost = totalCost;
        portfolio.performance.totalReturn = totalValue - totalCost;
        portfolio.performance.totalReturnPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        portfolio.performance.lastUpdated = new Date();

        await portfolio.save();

        // Emit portfolio update to connected users
        this.io.to(`portfolio-${portfolio._id}`).emit('portfolio-update', {
          portfolioId: portfolio._id,
          performance: portfolio.performance
        });
      });

      await Promise.allSettled(updatePromises);
      
    } catch (error) {
      console.error(`Error updating portfolio values for ${symbol}:`, error);
    }
  }

  /**
   * Start processing the request queue
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (this.requestQueue.length > 0 && !this.isProcessingQueue) {
        this.isProcessingQueue = true;
        
        const request = this.requestQueue.shift();
        try {
          await this.processQueueRequest(request);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
        
        this.isProcessingQueue = false;
      }
    }, this.rateLimitDelay);
  }

  /**
   * Process a queued request
   */
  async processQueueRequest(request) {
    // Implement specific request processing logic
    console.log('Processing queued request:', request);
  }

  /**
   * Get cached price for a symbol
   */
  getCachedPrice(symbol) {
    const cached = this.priceCache.get(symbol.toUpperCase());
    if (cached && (new Date() - cached.timestamp) < 60000) { // 1 minute cache
      return cached;
    }
    return null;
  }

  /**
   * Get current price data for multiple symbols
   */
  async getCurrentPrices(symbols) {
    const prices = {};
    const uncachedSymbols = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = this.getCachedPrice(symbol);
      if (cached) {
        prices[symbol] = cached;
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const freshData = await this.fetchPriceData('HOSE', uncachedSymbols);
        freshData.forEach(data => {
          prices[data.symbol] = data;
          this.priceCache.set(data.symbol, { ...data, timestamp: new Date() });
        });
      } catch (error) {
        console.error('Error fetching fresh prices:', error);
      }
    }

    return prices;
  }

  /**
   * Handle errors with retry logic
   */
  handleError(operation, error) {
    this.errorCount++;
    console.error(`Error in ${operation}:`, error.message);

    if (this.errorCount >= this.maxErrors) {
      console.error(`Too many errors (${this.errorCount}). Stopping price service.`);
      this.stop();
      return;
    }

    // Exponential backoff for retries
    const retryDelay = Math.min(1000 * Math.pow(2, this.errorCount), 30000);
    console.log(`Retrying in ${retryDelay}ms...`);
    
    setTimeout(() => {
      if (this.isRunning) {
        this.updateAllPrices();
      }
    }, retryDelay);
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      errorCount: this.errorCount,
      cacheSize: this.priceCache.size,
      marketOpen: this.isMarketOpen(),
      queueLength: this.requestQueue.length
    };
  }
}

module.exports = PriceService;
