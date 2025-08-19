const axios = require('axios');

class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseURL = 'https://www.alphavantage.co/query';
    this.rateLimitDelay = 12000; // 5 calls per minute = 12 seconds between calls
    this.lastRequestTime = 0;
  }

  /**
   * Get real-time stock quote
   */
  async getStockQuote(symbol) {
    try {
      // Rate limiting
      await this.waitForRateLimit();

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: `${symbol}.VN`,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      return this.parseGlobalQuoteResponse(response.data, symbol);
    } catch (error) {
      console.error(`Alpha Vantage API Error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get multiple stock quotes
   */
  async getMultipleQuotes(symbols) {
    const results = [];
    
    for (const symbol of symbols) {
      const quote = await this.getStockQuote(symbol);
      if (quote) {
        results.push(quote);
      }
      
      // Wait between requests to respect rate limits
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await this.waitForRateLimit();
      }
    }
    
    return results;
  }

  /**
   * Get historical data (daily)
   */
  async getHistoricalData(symbol, outputSize = 'compact') {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: `${symbol}.VN`,
          outputsize: outputSize, // 'compact' (100 days) or 'full' (20+ years)
          apikey: this.apiKey
        },
        timeout: 15000
      });

      return this.parseTimeSeriesResponse(response.data, symbol);
    } catch (error) {
      console.error(`Alpha Vantage Historical Data Error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Parse Global Quote API response
   */
  parseGlobalQuoteResponse(data, originalSymbol) {
    try {
      const quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        console.log(`No data found for ${originalSymbol} in Alpha Vantage response`);
        return null;
      }

      const price = parseFloat(quote['05. price'] || 0);
      const change = parseFloat(quote['09. change'] || 0);
      const changePercent = parseFloat((quote['10. change percent'] || '0%').replace('%', ''));
      const volume = parseInt(quote['06. volume'] || 0);

      return {
        symbol: originalSymbol,
        name: originalSymbol, // Alpha Vantage doesn't provide company name in quote
        price: price,
        change: change,
        changePercent: changePercent,
        dayChangePercent: changePercent,
        volume: volume,
        high: parseFloat(quote['03. high'] || price),
        low: parseFloat(quote['04. low'] || price),
        open: parseFloat(quote['02. open'] || price),
        previousClose: parseFloat(quote['08. previous close'] || price),
        marketCap: 0, // Not provided by Alpha Vantage in basic quote
        lastUpdated: new Date().toISOString(),
        source: 'Alpha Vantage'
      };
    } catch (error) {
      console.error(`Error parsing Alpha Vantage response for ${originalSymbol}:`, error);
      return null;
    }
  }

  /**
   * Parse Time Series API response
   */
  parseTimeSeriesResponse(data, originalSymbol) {
    try {
      const timeSeries = data['Time Series (Daily)'];
      
      if (!timeSeries) {
        console.log(`No historical data found for ${originalSymbol}`);
        return null;
      }

      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
      const historicalData = dates.map(date => ({
        date: date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      }));

      return {
        symbol: originalSymbol,
        data: historicalData,
        source: 'Alpha Vantage'
      };
    } catch (error) {
      console.error(`Error parsing Alpha Vantage time series for ${originalSymbol}:`, error);
      return null;
    }
  }

  /**
   * Rate limiting helper
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next Alpha Vantage request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'API key not configured'
        };
      }

      // Test with a simple symbol
      const result = await this.getStockQuote('VCB');
      
      return {
        success: !!result,
        data: result,
        message: result ? 'Alpha Vantage API connection successful' : 'No data returned'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AlphaVantageService;
