# Betweenness Centrality Calculation - Technical Explanation

## How Betweenness Centrality is Calculated (1 Month Stock-Level Analysis)

### Step-by-Step Process:

#### 1. **Data Collection (1 Month)**
   - Fetches historical price data for all NIFTY50 stocks for the past 1 month
   - Calculates daily log returns: `log(price_today / price_yesterday)`
   - Each stock gets a return series (typically ~20-22 trading days for 1 month)

#### 2. **Correlation Matrix Construction**
   - Computes Pearson correlation coefficient between every pair of stocks
   - Formula: `corr(X,Y) = Σ(xi - x̄)(yi - ȳ) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)`
   - Results in a 50×50 symmetric matrix where:
     - Diagonal values = 1.0 (stock correlated with itself)
     - Off-diagonal values = correlation between -1 and +1

#### 3. **Network Graph Construction**
   - Threshold: 0.5 (default) - only correlations ≥ 0.5 create edges
   - Creates an undirected graph where:
     - **Nodes** = Stocks
     - **Edges** = Strong correlations (≥ threshold)
   - Example: If RELIANCE and TCS have correlation 0.65, they're connected

#### 4. **Betweenness Centrality Calculation (Brandes Algorithm)**

The algorithm calculates: **How many shortest paths between all pairs of nodes pass through each node?**

**Algorithm Steps:**

1. **For each node s (source):**
   - Run BFS (Breadth-First Search) from s to find shortest paths
   - Count number of shortest paths to each node (σ)
   - Track distances (d)

2. **Accumulation Phase:**
   - For each node w, calculate dependency: `δ[w] = Σ(σ[v]/σ[w]) × (1 + δ[w])`
   - This measures how much w contributes to paths through it

3. **Final Betweenness:**
   - Sum up dependencies for each node across all sources
   - Normalize by `(n-1)(n-2)/2` for undirected graphs

**Mathematical Definition:**
```
Betweenness(v) = Σ(σ_st(s,t|v) / σ_st(s,t))
```
Where:
- `σ_st(s,t)` = number of shortest paths from s to t
- `σ_st(s,t|v)` = number of shortest paths from s to t that pass through v

### Example (Simplified):

**Network:**
```
A -- B -- C
|    |
D -- E
```

**Betweenness Calculation:**
- **Node A**: Only on paths A→D, A→B. Low betweenness.
- **Node B**: On paths A→C, A→E, D→C, D→E. **High betweenness** (bridge node).
- **Node C**: Only on paths ending at C. Low betweenness.

**Result:** B has highest betweenness = it's the bridge stock.

### For 1 Month Stock Analysis:

1. **Input**: 50 stocks × ~20 daily returns
2. **Correlation Matrix**: 50×50 = 2,500 correlations
3. **Network**: ~500-1000 edges (correlations ≥ 0.5)
4. **Betweenness**: Calculated for all 50 stocks
5. **Output**: Stocks ranked by betweenness (bridge stocks first)

## How to Validate the Data is Correct

### Validation Checks:

#### 1. **Data Completeness**
   - ✅ All stocks should have similar number of data points
   - ✅ Check: No missing dates in the time series
   - ✅ Warning if any stock has < 10 data points

#### 2. **Correlation Matrix Validation**
   - ✅ **Diagonal Check**: All diagonal values = 1.0
   - ✅ **Symmetry Check**: `corr(i,j) = corr(j,i)` for all pairs
   - ✅ **Range Check**: All values between -1 and +1
   - ✅ **No NaN/Infinity**: All values are finite numbers

#### 3. **Network Graph Validation**
   - ✅ **Betweenness Range**: Should be between 0 and 1 (normalized)
   - ✅ **No Negative Values**: Betweenness cannot be negative
   - ✅ **Consistency**: Higher degree usually correlates with higher betweenness (but not always)

#### 4. **Statistical Validation**
   - ✅ **Average Correlation**: Should be reasonable (typically 0.3-0.6 for stocks)
   - ✅ **Strong Correlations**: Count correlations ≥ 0.7 (should be meaningful)
   - ✅ **Edge Count**: Should match number of correlations ≥ threshold

#### 5. **Business Logic Validation**
   - ✅ **Sector Clustering**: Stocks in same sector should have higher correlations
   - ✅ **Bridge Stocks**: Should be stocks that connect different sectors
   - ✅ **Time Range Impact**: Longer time ranges should show more stable correlations

### Using the Validation Tab:

1. Go to **DSFM Analysis** → **Validation** tab
2. Review:
   - **Issues** (red): Critical problems that need fixing
   - **Warnings** (orange): Potential problems to investigate
   - **Information** (blue): Statistics about your data
3. Check **Sample Betweenness Values** table
4. Export validation report as JSON for detailed analysis

### Manual Validation Steps:

1. **Check Raw Data:**
   ```javascript
   // In browser console on DSFM Analysis page
   console.log("Stock count:", stockData.length);
   console.log("Sample stock:", stockData[0]);
   console.log("Returns length:", stockData[0].returns.length);
   ```

2. **Verify Correlations:**
   ```javascript
   // Check correlation matrix
   console.log("Correlation matrix size:", correlationMatrix.symbols.length);
   console.log("Sample correlation:", correlationMatrix.matrix[0][1]);
   ```

3. **Verify Betweenness:**
   ```javascript
   // Check network graph
   console.log("Top bridge stock:", networkGraph.nodes.sort((a,b) => b.betweenness - a.betweenness)[0]);
   ```

### Expected Results for 1 Month:

- **Data Points**: ~20-22 per stock (trading days)
- **Correlations**: Average ~0.4-0.6 (stocks in same market)
- **Network Edges**: ~500-800 (depending on threshold)
- **Betweenness Range**: 0.0 to ~0.3 (normalized)
- **Top Bridge Stocks**: Usually large-cap stocks connecting sectors (e.g., RELIANCE, HDFCBANK, TCS)

### Common Issues & Solutions:

1. **Low Betweenness Values**: 
   - Check if threshold is too high (fewer edges = lower betweenness)
   - Verify correlations are being calculated correctly

2. **All Betweenness = 0**:
   - Network might be disconnected
   - Threshold might be too high
   - Check if correlations are all below threshold

3. **Unexpected Bridge Stocks**:
   - Verify data quality (no missing values)
   - Check if time range is appropriate
   - Consider sector mapping accuracy

### Performance Notes:

- **Time Complexity**: O(n²m) where n = nodes, m = edges
- For 50 stocks: ~50² × 500 = ~1.25M operations (very fast)
- Algorithm uses Brandes algorithm (industry standard)

