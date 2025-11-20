# API Documentation

This document describes all APIs and endpoints used by the application, organized by component.

## Main API Base

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:3000`)
- **API Types**: 
  - GraphQL API at `/graphql`
  - REST API at `/api/*`

---

## Component-Wise API Usage

### 1. **Index Page** (`src/pages/Index.tsx`)

#### Most Bought Stocks Section
- **API Method**: `api.getStockDetails(symbol)`
- **Endpoint**: `GET /api/equity/{symbol}`
- **Purpose**: Fetch stock details for hardcoded symbols (IDEA, TATAGOLD, NEWGEN, RELIANCE)
- **Data Used**: Company name, price, change, percentage change

#### Market Movers Section
- **API Method**: `api.getEquitiesBySymbols(symbols[])`
- **GraphQL Endpoint**: `POST /graphql`
- **Query**: 
  ```graphql
  query Movers($symbols: [String!]!) {
    equities(symbolFilter: { symbols: $symbols }) {
      symbol
      details {
        info { companyName }
        price { last previousClose tradedQuantity }
      }
    }
  }
  ```
- **Fallback**: If API fails or returns empty, uses `api.getStockDetails()` for fallback symbols:
  - RELIANCE, EICHERMOT, BAJFINANCE, BAJAJFINSV, INFY, TCS, HDFCBANK
- **Purpose**: Display top gainers, losers, and volume shockers

#### Market Ticker
- **Component**: `MarketTicker.tsx`
- **API Method**: `api.getIndices()`
- **GraphQL Endpoint**: `POST /graphql`
- **Query**:
  ```graphql
  query {
    indices {
      index
      last
      variation
      percentChange
    }
  }
  ```
- **Purpose**: Display NIFTY 50, NIFTY BANK, and other index data

---

### 2. **Stock Detail Page** (`src/pages/StockDetail.tsx`)

#### Stock Details
- **API Method**: `api.getStockDetails(symbol)`
- **Endpoint**: `GET /api/equity/{symbol}`
- **Purpose**: Fetch comprehensive stock information (company info, price info)

#### Trade Information
- **API Method**: `api.getStockTradeInfo(symbol)`
- **Endpoint**: `GET /api/equity/tradeInfo/{symbol}`
- **Purpose**: Get trading data (volume, market depth, etc.)

#### Corporate Information
- **API Method**: `api.getStockCorporateInfo(symbol)`
- **Endpoint**: `GET /api/equity/corporateInfo/{symbol}`
- **Purpose**: Get financials, announcements, corporate data

#### Stock Chart
- **Component**: `StockChart.tsx`
- **API Method**: `api.getStockIntradayData(symbol)`
- **Endpoint**: `GET /api/equity/intraday/{symbol}?preOpen=false`
- **Purpose**: Fetch intraday price data for chart

- **API Method**: `api.getStockHistoricalData(symbol, dateStart, dateEnd)`
- **Endpoint**: `GET /api/equity/historical/{symbol}?dateStart=YYYY-MM-DD&dateEnd=YYYY-MM-DD`
- **Purpose**: Fetch historical price data for chart

#### Similar Stocks
- **Component**: `SimilarStocks.tsx`
- **API Method**: `api.getSimilarStocks(symbol, limit)`
- **Internal**: 
  1. Calls `api.getStockDetails(symbol)` to get industry
  2. Calls `GET /api/allSymbols` to get all symbols
  3. Filters and calls `api.getStockDetails()` for matching industry stocks
- **Purpose**: Display stocks in the same industry/sector

---

### 3. **Terminal Page** (`src/pages/Terminal.tsx`)

#### Stock Details
- **API Method**: `api.getStockDetails(symbol)`
- **Endpoint**: `GET /api/equity/{symbol}`

#### Terminal Header
- **Component**: `TerminalHeader.tsx`
- **API Method**: `api.getIndices()`
- **GraphQL Endpoint**: `POST /graphql`
- **Purpose**: Display index data in terminal header

#### Candlestick Chart
- **Component**: `CandlestickChart.tsx`
- **API Method**: `api.getStockIntradayData(symbol)`
- **Endpoint**: `GET /api/equity/intraday/{symbol}`
- **Purpose**: Real-time intraday data for candlestick chart

- **API Method**: `api.getStockHistoricalData(symbol, dateStart, dateEnd)`
- **Endpoint**: `GET /api/equity/historical/{symbol}?dateStart=...&dateEnd=...`
- **Purpose**: Historical data for chart timeframes

#### Terminal Watchlist
- **Component**: `TerminalWatchlist.tsx`
- **API Method**: `api.getStockDetails(symbol)` (for each symbol in watchlist)
- **Endpoint**: `GET /api/equity/{symbol}`
- **Purpose**: Display watchlist stocks with current prices

---

### 4. **DSFM Analysis Page** (`src/pages/DSFMAnalysis.tsx`)

#### Data Fetcher
- **Service**: `src/services/dsfm/dataFetcher.ts`
- **API Method**: `api.getIndexHistoricalData(indexSymbol, dateStart, dateEnd)`
- **Endpoint**: `GET /api/index/historical/{indexSymbol}?dateStart=...&dateEnd=...`
- **Purpose**: Fetch historical data for sector indices

- **API Method**: `api.getStockHistoricalData(symbol, dateStart, dateEnd)`
- **Endpoint**: `GET /api/equity/historical/{symbol}?dateStart=...&dateEnd=...`
- **Purpose**: Fetch historical data for individual stocks

---

### 5. **Most Bought Stocks Page** (`src/pages/MostBoughtStocks.tsx`)

#### Stock Data
- **API Method**: `api.getStockDetails(symbol)`
- **Endpoint**: `GET /api/equity/{symbol}`
- **Purpose**: Fetch details for popular stock symbols

- **API Method**: `api.getStockTradeInfo(symbol)`
- **Endpoint**: `GET /api/equity/tradeInfo/{symbol}`
- **Purpose**: Fetch trade information for stocks

---

### 6. **Sector Detail Page** (`src/pages/SectorDetail.tsx`)

#### Sector Stocks
- **API Method**: `api.getEquitiesBySymbols(symbols[])`
- **GraphQL Endpoint**: `POST /graphql`
- **Purpose**: Fetch equities for sector-specific symbols

---

### 7. **Sectors Trending** (`src/components/SectorsTrending.tsx`)

#### Sectors Data
- **API Method**: `api.getSectors()`
- **Internal**: 
  1. Calls `api.getIndices()` (GraphQL)
  2. Filters indices by sector keywords
- **Purpose**: Display trending sectors

#### Sample Equities
- **API Method**: `api.getEquitiesBySymbols(sampleSymbols[])`
- **GraphQL Endpoint**: `POST /graphql`
- **Purpose**: Display sample stocks for each sector

---

### 8. **News Section** (`src/components/NewsSection.tsx`)

#### Stock News
- **API Method**: `api.getStockDetails(symbol)` (for company name)
- **Endpoint**: `GET /api/equity/{symbol}`

- **API Method**: `api.getMergedNews(limit)`
- **Internal**: 
  1. Tries `api.getFinnhubNews()` first
  2. Falls back to `api.getNewsAPINews()` if Finnhub fails
- **External APIs**:
  - **Finnhub**: `https://finnhub.io/api/v1/news?category=general&token={API_KEY}`
  - **NewsAPI**: `https://newsapi.org/v2/everything?q=stocks OR nifty OR sensex&language=en&sortBy=publishedAt&apiKey={API_KEY}`
- **Purpose**: Display financial news articles

#### Alternative: Backend News Proxy
- **API Method**: `api.getStockNews(limit)`
- **Endpoint**: `GET /api/news?limit={limit}`
- **Purpose**: Fetch news from backend proxy (if available)

---

### 9. **Holdings View** (`src/components/HoldingsView.tsx`)

#### Holdings Data
- **Hook**: `useHoldings.tsx`
- **API Method**: `api.getStockDetails(holding.symbol)`
- **Endpoint**: `GET /api/equity/{symbol}`
- **Purpose**: Fetch current price for holdings to calculate P&L

---

## API Endpoints Summary

### GraphQL Endpoints (`POST /graphql`)

1. **Indices Query**
   - Returns: All market indices (NIFTY, SENSEX, etc.)
   - Used by: MarketTicker, TerminalHeader, SectorsTrending

2. **Equities Query**
   - Variables: `symbols: [String!]!`
   - Returns: Stock details for multiple symbols
   - Used by: MarketMovers, SectorDetail

### REST API Endpoints (`GET /api/*`)

1. **Stock Details**
   - `/api/equity/{symbol}`
   - Used by: StockDetail, Terminal, Index (Most Bought), Holdings, SimilarStocks

2. **Trade Information**
   - `/api/equity/tradeInfo/{symbol}`
   - Used by: StockDetail, MostBoughtStocks

3. **Corporate Information**
   - `/api/equity/corporateInfo/{symbol}`
   - Used by: StockDetail

4. **Historical Data**
   - `/api/equity/historical/{symbol}?dateStart=...&dateEnd=...`
   - Used by: StockChart, CandlestickChart, DSFM Analysis

5. **Intraday Data**
   - `/api/equity/intraday/{symbol}?preOpen=false`
   - Used by: StockChart, CandlestickChart

6. **Index Historical Data**
   - `/api/index/historical/{indexSymbol}?dateStart=...&dateEnd=...`
   - Used by: DSFM Analysis

7. **All Symbols**
   - `/api/allSymbols`
   - Used by: SimilarStocks

8. **News Proxy**
   - `/api/news?limit={limit}`
   - Used by: NewsSection (optional fallback)

### External APIs

1. **Finnhub News API**
   - `https://finnhub.io/api/v1/news?category=general&token={API_KEY}`
   - Used by: NewsSection

2. **NewsAPI**
   - `https://newsapi.org/v2/everything?q=stocks OR nifty OR sensex&language=en&sortBy=publishedAt&apiKey={API_KEY}`
   - Used by: NewsSection (fallback)

---

## Error Handling

- All API calls handle network errors gracefully
- GraphQL errors return empty objects/arrays instead of throwing
- REST API errors for 500 status codes are handled silently
- Fallback mechanisms are in place for critical data (e.g., MarketMovers fallback symbols)

---

## Notes

- The GraphQL API is the primary source for indices and bulk equity data
- The REST API is used for individual stock details, historical data, and trade info
- External news APIs are used directly from the frontend (Finnhub, NewsAPI)
- All API calls respect the `VITE_API_BASE_URL` environment variable for the backend base URL

