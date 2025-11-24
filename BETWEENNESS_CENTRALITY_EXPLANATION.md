# Betweenness Centrality: Step-by-Step Explanation

## Overview
Betweenness Centrality identifies "bridge stocks" - stocks that act as critical connectors in the market network. High betweenness means a stock lies on many shortest paths between other stocks, making it influential in market dynamics.

---

## **STEP 1: Data Collection & Preparation**

### Location: `src/services/dsfm/dataFetcher.ts`

**What happens:**
1. Fetches historical price data for NIFTY50 stocks (or sector indices)
2. For each stock, calculates **log returns**: `log(price_today / price_yesterday)`
3. Returns array of `StockData` with `returns` array for each stock

**Example:**
```javascript
StockData = {
  symbol: "RELIANCE.NS",
  name: "RELIANCE",
  prices: [{date: "2024-01-01", close: 2500}, ...],
  returns: [0.02, -0.01, 0.03, ...] // log returns
}
```

**Key Function:** `fetchMultipleStocks()` → `calculateReturns()`

---

## **STEP 2: Build Correlation Matrix**

### Location: `src/services/dsfm/correlationEngine.ts`

**What happens:**
1. Takes all stock return series
2. Calculates **Pearson correlation** between every pair of stocks
3. Creates a symmetric matrix where `matrix[i][j]` = correlation between stock i and j

**Correlation Formula:**
```javascript
corr(X,Y) = Σ(xi - x̄)(yi - ȳ) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
```

**Result:**
- 50×50 matrix for NIFTY50
- Values range from -1 to +1
- Diagonal = 1.0 (stock with itself)
- Symmetric: `matrix[i][j] = matrix[j][i]`

**Key Function:** `buildCorrelationMatrix()` → `calculateCorrelation()`

**Example Matrix:**
```
        RELIANCE  TCS    HDFCBANK
RELIANCE   1.0    0.45    0.52
TCS        0.45   1.0     0.38
HDFCBANK   0.52   0.38    1.0
```

---

## **STEP 3: Build Network Graph from Correlation Matrix**

### Location: `src/services/dsfm/networkEngine.ts` → `buildNetworkGraph()`

**What happens:**
1. **Apply Threshold** (default: 0.5)
   - Only correlations ≥ 0.5 create edges
   - Filters out weak relationships

2. **Build Adjacency List** (lines 62-70)
   ```javascript
   // For each stock i, find all stocks j where |correlation| >= 0.5
   adjacencyList[i] = [j, k, l, ...] // connected stocks
   ```

3. **Create Nodes & Edges**
   - **Nodes**: Each stock becomes a node
   - **Edges**: Strong correlations become edges
   - Result: Undirected graph

**Example Network:**
```
RELIANCE ←→ HDFCBANK (corr: 0.52)
TCS ←→ INFY (corr: 0.68)
HDFCBANK ←→ ICICIBANK (corr: 0.71)
```

---

## **STEP 4: Calculate Betweenness Centrality (Brandes Algorithm)**

### Location: `src/services/dsfm/networkEngine.ts` → `calculateBetweennessCentrality()`

### **The Algorithm (Lines 49-131):**

#### **Phase 1: Initialization (Lines 53-70)**
```javascript
// Initialize betweenness map to 0 for all stocks
betweenness.set(symbol, 0)

// Build adjacency list from correlation matrix
// Only include edges where |correlation| >= threshold
```

#### **Phase 2: For Each Source Node (Lines 73-118)**

For each stock `s` as source, run BFS to find shortest paths:

**A. BFS Setup (Lines 75-85)**
```javascript
const stack = []           // Track nodes in BFS order
const paths = []           // Predecessors for each node
const sigma = []           // Number of shortest paths
const dist = []            // Distance from source
const delta = []           // Dependency accumulation

sigma[s] = 1              // 1 path to source
dist[s] = 0               // Distance 0 to itself
queue = [s]               // Start BFS from source
```

**B. BFS Traversal (Lines 87-105)**
```javascript
while (queue.length > 0) {
  v = queue.shift()       // Get next node
  stack.push(v)           // Track order
  
  for each neighbor w of v:
    if w not visited:
      dist[w] = dist[v] + 1
      queue.push(w)
    
    if dist[w] == dist[v] + 1:  // Shortest path via v
      sigma[w] += sigma[v]       // Count paths
      paths[w].push(v)           // Track predecessor
}
```

**What this does:**
- Finds shortest paths from source `s` to all other nodes
- Counts how many shortest paths exist (`sigma`)
- Tracks which nodes are predecessors (`paths`)

**C. Accumulation Phase - Back Propagation (Lines 107-117)**
```javascript
while (stack.length > 0) {
  w = stack.pop()         // Process in reverse BFS order
  
  for each predecessor v of w:
    delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
  
  if w != s:
    betweenness[w] += delta[w]  // Add to betweenness
}
```

**What this does:**
- Works backwards from furthest nodes
- Calculates dependency: how much each node contributes to paths through it
- Formula: `δ[v] = (σ[v]/σ[w]) × (1 + δ[w])`
  - `σ[v]/σ[w]` = fraction of paths to w that go through v
  - `1 + δ[w]` = paths through w plus paths ending at w

#### **Phase 3: Normalization (Lines 120-128)**
```javascript
normalizationFactor = (n-1)(n-2) / 2
betweenness[symbol] = betweenness[symbol] / normalizationFactor
```

**Why normalize:**
- Makes values between 0 and 1
- Easier to interpret and compare
- For 50 stocks: max = (49×48)/2 = 1176, so divide by this

---

## **STEP 5: Visualization**

### **A. Table Visualization**
### Location: `src/components/dsfm/CentralityTable.tsx`

**What happens:**
1. Receives `NetworkNode[]` with betweenness values
2. Sorts by betweenness (descending)
3. Displays in table format

**Key Code (Lines 11-13):**
```javascript
const sortedNodes = [...nodes]
  .sort((a, b) => b.betweenness - a.betweenness)  // Sort by betweenness
  .slice(0, maxRows)                              // Take top N
```

**Display:**
- Rank, Symbol, Betweenness (2 decimals), Degree, Sector
- Shows top 10-20 bridge stocks

---

### **B. Network Graph Visualization**
### Location: `src/components/dsfm/CorrelationNetworkGraph.tsx`

**What happens:**
1. Uses **vis-network** library for interactive graph
2. Maps betweenness to **node size** (Line 32)
3. Maps correlation to **edge thickness** (Line 41)
4. Colors nodes by sector

**Key Code (Lines 29-35):**
```javascript
const nodes = graph.nodes.map((node) => ({
  id: node.id,
  label: node.label,
  value: node.betweenness * 10 + 5,  // ⭐ SIZE = betweenness
  color: getNodeColor(node.sector),
  title: `Betweenness: ${node.betweenness.toFixed(2)}`  // Tooltip
}));
```

**Visual Encoding:**
- **Node Size** = Betweenness Centrality (larger = more bridge-like)
- **Edge Thickness** = Correlation strength
- **Node Color** = Sector
- **Hover Tooltip** = Shows exact betweenness value

---

## **Complete Flow Diagram**

```
1. Fetch Historical Prices
   ↓
2. Calculate Log Returns
   ↓
3. Build Correlation Matrix (50×50)
   ↓
4. Apply Threshold (0.5) → Create Edges
   ↓
5. For Each Stock (as source):
   ├─ Run BFS to find shortest paths
   ├─ Count paths (sigma)
   ├─ Back propagate dependencies (delta)
   └─ Accumulate betweenness
   ↓
6. Normalize by (n-1)(n-2)/2
   ↓
7. Visualize:
   ├─ Table: Top bridge stocks
   └─ Graph: Node size = betweenness
```

---

## **Example Walkthrough**

### Input: 3 Stocks
```
RELIANCE, TCS, HDFCBANK
Correlations:
  RELIANCE ↔ TCS: 0.45 (weak, no edge)
  RELIANCE ↔ HDFCBANK: 0.65 (strong, edge)
  TCS ↔ HDFCBANK: 0.55 (strong, edge)
```

### Network Graph:
```
RELIANCE ←→ HDFCBANK ←→ TCS
```

### Betweenness Calculation:

**For source = RELIANCE:**
- BFS finds: RELIANCE → HDFCBANK → TCS
- Paths to TCS: 1 path (via HDFCBANK)
- HDFCBANK is on the only path from RELIANCE to TCS
- **HDFCBANK gets +1 betweenness**

**For source = TCS:**
- Similar: TCS → HDFCBANK → RELIANCE
- **HDFCBANK gets +1 betweenness**

**For source = HDFCBANK:**
- No paths through other nodes
- No additional betweenness

**Result:**
- RELIANCE: 0
- **HDFCBANK: 2** (highest - bridge stock!)
- TCS: 0

Normalized: HDFCBANK = 2 / ((3-1)(3-2)/2) = 2 / 1 = 2.0

---

## **Key Parameters**

1. **Threshold (0.5)**: Only correlations ≥ 0.5 create edges
   - Lower threshold = more edges = different betweenness
   - Higher threshold = fewer edges = more isolated nodes

2. **Time Range**: Affects correlation strength
   - Longer range = more stable correlations
   - Shorter range = more volatile, different bridge stocks

3. **Normalization**: Makes values comparable
   - Without normalization: raw count of paths
   - With normalization: 0 to 1 scale

---

## **How to Interpret Results**

- **High Betweenness (0.1-0.3)**: Bridge stock connecting different sectors
  - Example: Large banks connecting IT and Energy sectors
  - These stocks are critical for market stability

- **Medium Betweenness (0.05-0.1)**: Important but not critical
  - Well-connected within their sector
  - Some cross-sector influence

- **Low Betweenness (0-0.05)**: Peripheral stocks
  - Mostly connected within their sector
  - Less influence on overall market network

---

## **Performance Notes**

- **Time Complexity**: O(n²m) where n=nodes, m=edges
- For 50 stocks with ~500 edges: ~1.25M operations
- Runs in milliseconds on modern browsers
- Uses Brandes algorithm (industry standard, O(nm) per source)

