# DSFM Analysis Dashboard

## Overview
The DSFM (Data Science for Financial Markets) Analysis Dashboard provides comprehensive market network analysis, correlation studies, and shock propagation simulation.

## Features

### 1. Dual Analysis Modes
- **Stock-Level Network**: Analyzes NIFTY50 companies
- **Sector-Level Network**: Analyzes NIFTY sector indices

### 2. Time Range Selection
- Predefined ranges: 1M, 3M, 6M, 1Y, 3Y, 5Y
- Custom date range picker

### 3. Market Bridge Finder
- Computes betweenness centrality
- Identifies bridge stocks/sectors
- Visual network graph with vis-network

### 4. Shock Propagation Simulator
- Simulate shocks from 1% to 15%
- Calculate impact propagation
- Identify most affected sectors

### 5. AI-Generated Insights
- Automatic market connectivity analysis
- Systemic risk identification
- Sector clustering insights

## Components

- `TimeRangeSelector`: Time period selection
- `ModeToggle`: Switch between stock/sector modes
- `CorrelationNetworkGraph`: Interactive network visualization
- `CentralityTable`: Top bridge nodes table
- `ShockSimulator`: Shock propagation tool
- `Insights`: AI-generated market insights

## Services

- `dataFetcher.ts`: Historical data fetching
- `correlationEngine.ts`: Correlation matrix computation
- `networkEngine.ts`: Network metrics (centrality, communities)
- `shockEngine.ts`: Shock simulation engine

## Usage

Navigate to `/dsfm-analysis` to access the full dashboard.

From the Terminal page, click the DSFM Analysis panel on the right side to open the dashboard.

## Data Sources

- NIFTY50 stocks (from Wikipedia scraping or predefined list)
- NIFTY Sector Indices:
  - NIFTYIT.NS
  - NIFTYBANK.NS
  - NIFTYAUTO.NS
  - NIFTYPHARMA.NS
  - NIFTYFMCG.NS
  - NIFTYENERGY.NS
  - NIFTYFIN.NS
  - NIFTYREALTY.NS
  - NIFTYMETAL.NS
  - NIFTYPSUBANK.NS

## Export

Results can be exported to CSV format for further analysis.

