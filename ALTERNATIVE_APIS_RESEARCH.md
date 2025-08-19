# Alternative APIs for Vietnamese Stock Market Data

## Current Issue
Yahoo Finance API is experiencing rate limiting and reliability issues for Vietnamese stock market data.

## Alternative API Options

### 1. **Alpha Vantage API** ⭐⭐⭐⭐⭐
- **URL**: https://www.alphavantage.co/
- **Pricing**: Free tier: 5 API calls/minute, 500 calls/day
- **Premium**: $49.99/month for 5,000 calls/minute
- **Coverage**: Global markets including Vietnam
- **Endpoints**: 
  - Real-time quotes: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VCB.VN&apikey=YOUR_API_KEY`
  - Historical data: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VCB.VN&apikey=YOUR_API_KEY`
- **Pros**: Reliable, well-documented, supports Vietnamese stocks
- **Cons**: Limited free tier

### 2. **Finnhub API** ⭐⭐⭐⭐
- **URL**: https://finnhub.io/
- **Pricing**: Free tier: 60 calls/minute
- **Coverage**: Global markets
- **Endpoints**:
  - Quote: `https://finnhub.io/api/v1/quote?symbol=VCB.VN&token=YOUR_API_KEY`
  - Company profile: `https://finnhub.io/api/v1/stock/profile2?symbol=VCB.VN&token=YOUR_API_KEY`
- **Pros**: Good free tier, reliable
- **Cons**: Limited Vietnamese stock coverage

### 3. **VietStock API** ⭐⭐⭐⭐⭐
- **URL**: https://finance.vietstock.vn/
- **Type**: Vietnamese local provider
- **Coverage**: Comprehensive Vietnamese market data
- **Endpoints**: 
  - Public API: `https://finance.vietstock.vn/data/`
  - WebSocket: Real-time updates
- **Pros**: Local provider, comprehensive Vietnamese data
- **Cons**: May require subscription, Vietnamese documentation

### 4. **TradingView API** ⭐⭐⭐
- **URL**: https://www.tradingview.com/
- **Type**: Chart and market data provider
- **Coverage**: Global including Vietnam
- **Pros**: Excellent charting capabilities
- **Cons**: Expensive, mainly for institutional use

### 5. **DNSE API** ⭐⭐⭐⭐
- **URL**: https://www.dnse.com.vn/
- **Type**: Vietnamese broker API
- **Coverage**: Vietnamese stocks only
- **Pros**: Local, comprehensive Vietnamese data
- **Cons**: Requires brokerage account

### 6. **FiinPro API** ⭐⭐⭐⭐
- **URL**: https://fiinpro.com/
- **Type**: Vietnamese financial data provider
- **Coverage**: Vietnamese market only
- **Pros**: Professional Vietnamese market data
- **Cons**: Enterprise pricing

### 7. **Free Alternative: Web Scraping**
- **Sources**: 
  - https://finance.vietstock.vn/
  - https://s.cafef.vn/
  - https://banggia.vnexpress.net/
- **Pros**: Free, real-time data
- **Cons**: Legal concerns, unreliable, can be blocked

## Recommended Implementation Strategy

### Phase 1: Immediate Fix (Alpha Vantage)
```javascript
// Alpha Vantage implementation
class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseURL = 'https://www.alphavantage.co/query';
    this.rateLimitDelay = 12000; // 5 calls per minute = 12 seconds between calls
  }

  async getStockQuote(symbol) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: `${symbol}.VN`,
          apikey: this.apiKey
        }
      });
      
      return this.parseAlphaVantageResponse(response.data);
    } catch (error) {
      console.error('Alpha Vantage API Error:', error);
      return null;
    }
  }

  parseAlphaVantageResponse(data) {
    const quote = data['Global Quote'];
    if (!quote) return null;

    return {
      symbol: quote['01. symbol'].replace('.VN', ''),
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
    };
  }
}
```

### Phase 2: Hybrid Approach
- Primary: Alpha Vantage API
- Fallback 1: VietStock API (if available)
- Fallback 2: Cached database data

### Phase 3: Professional Solution
- Migrate to VietStock API or FiinPro for production
- Implement proper enterprise-grade data feeds

## Implementation Priority

1. **Alpha Vantage** (Easy to implement, reliable)
2. **VietStock API** (Best for Vietnamese market)
3. **Finnhub** (Good alternative)
4. **Hybrid approach** (Multiple sources for reliability)

## Cost Analysis

| API | Free Tier | Paid Tier | Best For |
|-----|-----------|-----------|----------|
| Alpha Vantage | 500 calls/day | $49.99/month | Development/Small apps |
| Finnhub | 60 calls/minute | $49.99/month | Global coverage |
| VietStock | Limited | Contact for pricing | Vietnamese focus |
| Yahoo Finance | Free | Free | Current (when working) |

## Next Steps

1. Sign up for Alpha Vantage API key
2. Implement Alpha Vantage service
3. Add API key to environment variables
4. Test with Vietnamese stock symbols
5. Implement fallback mechanism
