# DSFM Shock Simulator API Documentation

This document describes the backend API endpoints required for the Shock Simulator module in the Market Stability & Influence Analyzer.

## Base URL

All endpoints are prefixed with `/api/dsfm/`

## Endpoints

### 1. GET /api/dsfm/correlation

Returns the correlation matrix for the specified time window.

**Query Parameters:**
- `window` (string, optional): Time window for correlation calculation. Default: `"1y"`
  - Valid values: `"1y"`, `"6m"`, `"3m"`, `"1m"`, or custom date range format

**Response:**
```json
{
  "symbols": ["RELIANCE", "TCS", "HDFCBANK", ...],
  "correlation_matrix": [
    [1.0, 0.65, 0.72, ...],
    [0.65, 1.0, 0.58, ...],
    ...
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/dsfm/correlation?window=1y"
```

---

### 2. GET /api/dsfm/distance

Returns the distance matrix (shortest path hops) for the specified threshold.

**Query Parameters:**
- `threshold` (number, optional): Correlation threshold for graph construction. Default: `0.5`
  - Range: `0.1` to `0.9`

**Response:**
```json
{
  "symbols": ["RELIANCE", "TCS", "HDFCBANK", ...],
  "distance_matrix": [
    [0, 2, 1, ...],
    [2, 0, 3, ...],
    ...
  ]
}
```

**Notes:**
- Distance matrix contains shortest path hops between nodes
- `Infinity` or a large number (e.g., `999`) indicates unreachable nodes
- Distance of `0` indicates the same node

**Example:**
```bash
curl "http://localhost:3000/api/dsfm/distance?threshold=0.5"
```

---

### 3. GET /api/dsfm/centrality

Returns the betweenness centrality vector for all nodes.

**Query Parameters:**
- `window` (string, optional): Time window for centrality calculation. Default: `"1y"`

**Response:**
```json
{
  "symbols": ["RELIANCE", "TCS", "HDFCBANK", ...],
  "centrality": [0.234, 0.189, 0.156, ...]
}
```

**Notes:**
- Centrality values are normalized between 0 and 1
- Higher values indicate more central nodes (more shortest paths pass through)

**Example:**
```bash
curl "http://localhost:3000/api/dsfm/centrality?window=1y"
```

---

### 4. POST /api/dsfm/simulate-shock

Simulates shock propagation through the network.

**Request Body:**
```json
{
  "sources": ["RELIANCE", "LT"],
  "initial_shock_pct": -0.13,
  "decay_factor": 0.5,
  "use_signed_corr": true,
  "hub_boost_enabled": true
}
```

**Request Fields:**
- `sources` (string[]): Array of stock symbols to shock (1-5 stocks)
- `initial_shock_pct` (number): Initial shock magnitude as a decimal (-0.2 to +0.2)
  - Negative = price drop, Positive = price increase
- `decay_factor` (number, optional): Decay factor for shock propagation. Default: `0.5`
  - Range: `0.3` to `0.8`
- `use_signed_corr` (boolean, optional): Whether to use signed correlation (preserve direction). Default: `true`
- `hub_boost_enabled` (boolean, optional): Whether to apply hub boost multiplier. Default: `true`

**Response:**
```json
{
  "final_effects": {
    "RELIANCE": -0.13,
    "TCS": -0.018,
    "HDFCBANK": -0.024,
    ...
  },
  "per_source_contrib": {
    "RELIANCE": {
      "TCS": -0.012,
      "HDFCBANK": -0.015,
      ...
    },
    "LT": {
      "TCS": -0.006,
      "HDFCBANK": -0.009,
      ...
    }
  },
  "summary": {
    "total_affected": 20,
    "max_impact": 0.131,
    "avg_impact": 0.024
  },
  "time_series": [
    {
      "t": 0,
      "impacts": {
        "RELIANCE": -0.13,
        "LT": -0.13,
        ...
      }
    },
    {
      "t": 1,
      "impacts": {
        "RELIANCE": -0.065,
        "TCS": -0.009,
        ...
      }
    },
    ...
  ]
}
```

**Response Fields:**
- `final_effects`: Map of symbol → final shock impact (aggregated from all sources)
- `per_source_contrib`: Map of source → (target → contribution) showing individual source contributions
- `summary`: Aggregate statistics
  - `total_affected`: Number of nodes with non-zero impact
  - `max_impact`: Maximum absolute impact value
  - `avg_impact`: Average absolute impact value
- `time_series`: Array of time steps showing how shock decays over time
  - `t`: Time step (0 = initial, 1+ = subsequent steps with decay)
  - `impacts`: Map of symbol → impact at this time step

**Example:**
```bash
curl -X POST "http://localhost:3000/api/dsfm/simulate-shock" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["RELIANCE", "LT"],
    "initial_shock_pct": -0.13,
    "decay_factor": 0.5,
    "use_signed_corr": true,
    "hub_boost_enabled": true
  }'
```

---

## Simulation Algorithm

The backend should implement the following algorithm:

### Step 1: Load Data
- Load correlation matrix `C` (N×N)
- Load distance matrix `D` (N×N) - shortest path hops
- Load betweenness centrality vector `BC` (length N)

### Step 2: For Each Source Node `s`
```python
hub_multiplier = 1 + (BC[s] / max(BC)) if hub_boost_enabled else 1

For all target nodes j:
  if D[s, j] == Infinity:
    contribution[s, j] = 0
  else:
    corr = C[s, j] if use_signed_corr else abs(C[s, j])
    contribution[s, j] = initial_shock * corr * (decay_factor ** D[s, j]) * hub_multiplier
```

### Step 3: Aggregate Effects
```python
For all nodes j:
  final_effect[j] = sum(contribution[s, j] for all sources s)
```

### Step 4: Generate Time Series
```python
# Option 1: Map distance to time step
For time step t = 0 to max_time_steps:
  For each node j:
    impact[j, t] = sum(
      initial_shock * corr * (decay_factor ** (D[s, j] + t)) * hub_multiplier
      for all sources s where D[s, j] <= t
    )

# Option 2: Apply global decay per step
For time step t = 0 to max_time_steps:
  For each node j:
    impact[j, t] = final_effect[j] * (decay_factor ** t)
```

---

## Performance Requirements

- **Vectorized Operations**: Use NumPy or similar for N×N matrix operations
- **Caching**: Cache correlation matrices, distance matrices, and centrality vectors for each time window and threshold combination
- **Update Frequency**: Update cache daily or on-demand
- **Response Time**: 
  - For N ≤ 200: < 200ms
  - For larger N: Use sparse matrix operations

---

## Error Handling

All endpoints should return appropriate HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid parameters (e.g., invalid window, threshold out of range)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Implementation Notes

### Backend Technology Stack

**Option 1: Node.js/Express + Python Microservice**
- Express handles routing and request/response
- Python microservice (Flask/FastAPI) handles numeric computations
- Communication via HTTP or message queue

**Option 2: Python Flask/FastAPI**
- Single Python backend
- Use NumPy, SciPy for matrix operations
- Use NetworkX for graph algorithms

**Example Python Implementation (FastAPI):**
```python
from fastapi import FastAPI, Query
import numpy as np
import networkx as nx
from typing import List, Dict

app = FastAPI()

@app.get("/api/dsfm/correlation")
async def get_correlation(window: str = "1y"):
    # Load correlation matrix from cache or compute
    symbols, matrix = load_correlation_matrix(window)
    return {"symbols": symbols, "correlation_matrix": matrix.tolist()}

@app.post("/api/dsfm/simulate-shock")
async def simulate_shock(request: ShockRequest):
    # Load matrices
    C = load_correlation_matrix(request.window)
    D = load_distance_matrix(request.threshold)
    BC = load_centrality(request.window)
    
    # Vectorized computation
    hub_multiplier = 1 + (BC / BC.max()) if request.hub_boost_enabled else 1
    contributions = np.zeros((len(sources), len(symbols)))
    
    for i, source in enumerate(request.sources):
        source_idx = symbols.index(source)
        for j in range(len(symbols)):
            if D[source_idx, j] != np.inf:
                corr = C[source_idx, j] if request.use_signed_corr else abs(C[source_idx, j])
                contributions[i, j] = (
                    request.initial_shock_pct * 
                    corr * 
                    (request.decay_factor ** D[source_idx, j]) * 
                    hub_multiplier[source_idx]
                )
    
    final_effects = contributions.sum(axis=0)
    
    # Generate time series
    time_series = []
    for t in range(4):  # 0 to 3
        impacts = {}
        for j, symbol in enumerate(symbols):
            impacts[symbol] = final_effects[j] * (request.decay_factor ** t)
        time_series.append({"t": t, "impacts": impacts})
    
    return {
        "final_effects": dict(zip(symbols, final_effects)),
        "per_source_contrib": {...},
        "summary": {...},
        "time_series": time_series
    }
```

---

## Testing

### Unit Tests

Test cases should cover:
1. Single source shock propagation
2. Multiple source shock aggregation
3. Decay factor effects
4. Hub boost multiplier
5. Signed vs absolute correlation
6. Unreachable nodes (distance = Infinity)
7. Edge cases (empty sources, zero shock, etc.)

### Example Test Case:
```python
def test_single_source_shock():
    request = {
        "sources": ["RELIANCE"],
        "initial_shock_pct": -0.1,
        "decay_factor": 0.5,
        "use_signed_corr": True,
        "hub_boost_enabled": True
    }
    response = simulate_shock(request)
    assert response["final_effects"]["RELIANCE"] == -0.1
    assert response["summary"]["total_affected"] > 0
```

---

## Frontend Integration

The frontend component (`ShockSimulator.tsx`) will:
1. Call these endpoints when "API Mode" is enabled
2. Fall back to client-side computation if API is unavailable
3. Display results in network graph, impact table, and timeline chart

See `src/services/dsfm/shockApi.ts` for the frontend API client implementation.

---

## Caching Strategy

1. **Correlation Matrix**: Cache by time window
   - Key: `correlation:{window}`
   - TTL: 1 day or on-demand refresh

2. **Distance Matrix**: Cache by threshold
   - Key: `distance:{threshold}`
   - TTL: Until correlation matrix changes

3. **Centrality Vector**: Cache by time window
   - Key: `centrality:{window}`
   - TTL: 1 day or on-demand refresh

---

## Security Considerations

- Validate input parameters (threshold range, shock magnitude range, etc.)
- Rate limiting for simulation endpoint (prevent abuse)
- Sanitize stock symbols to prevent injection
- CORS configuration for frontend access

---

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live shock propagation
2. **Historical Scenarios**: Store and replay historical shock scenarios
3. **Monte Carlo Simulation**: Run multiple simulations with random variations
4. **Sensitivity Analysis**: Automatically test different parameter combinations
5. **Export Formats**: Support JSON, CSV, Excel exports

