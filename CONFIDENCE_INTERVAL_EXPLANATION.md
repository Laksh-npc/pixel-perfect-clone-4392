# Confidence Interval - Complete Explanation

## 📚 Table of Contents
1. [Basic Concept](#basic-concept)
2. [Mathematical Foundation](#mathematical-foundation)
3. [Formulas](#formulas)
4. [How It's Calculated in Your Forecast](#how-its-calculated-in-your-forecast)
5. [Visualization in the Chart](#visualization-in-the-chart)
6. [Practical Interpretation](#practical-interpretation)

---

## 1. Basic Concept

### What is a Confidence Interval?

A **Confidence Interval (CI)** is a range of values that, with a certain level of confidence, is likely to contain the true value of a parameter (like a predicted stock return).

**Simple Analogy:**
Think of throwing darts at a target. If you're confident you'll hit within a circle 95% of the time, that circle is like your 95% confidence interval. The target center is your prediction (ARIMA mean), and the circle represents the range where the actual value will likely fall.

### Key Terms:

- **Confidence Level (95%)**: The probability that the interval contains the true value
- **Lower Bound (ci_lower)**: The minimum value in the interval
- **Upper Bound (ci_upper)**: The maximum value in the interval
- **Point Estimate**: The single predicted value (ARIMA mean)
- **Margin of Error**: Half the width of the confidence interval

---

## 2. Mathematical Foundation

### Statistical Distribution Theory

Confidence intervals rely on the assumption that our data follows a **normal (Gaussian) distribution**. This is the famous "bell curve."

**Normal Distribution Properties:**
- Symmetric around the mean
- ~68% of data falls within 1 standard deviation (σ)
- ~95% of data falls within 1.96 standard deviations (1.96σ)
- ~99.7% of data falls within 3 standard deviations (3σ)

### Z-Score (Standard Normal Distribution)

The **Z-score** tells us how many standard deviations away from the mean a value is:

```
Z = (X - μ) / σ
```

Where:
- `X` = observed value
- `μ` = population mean
- `σ` = standard deviation

For a 95% confidence interval, we use **Z = 1.96** because:
- 2.5% of data falls below -1.96 standard deviations
- 2.5% of data falls above +1.96 standard deviations
- 95% of data falls between -1.96 and +1.96 standard deviations

---

## 3. Formulas

### General Confidence Interval Formula

```
CI = Point Estimate ± (Z-score × Standard Error)
```

**Expanded:**
```
CI = μ ± (Z × σ)
```

Where:
- `μ` = mean/point estimate
- `Z` = Z-score for desired confidence level (1.96 for 95%)
- `σ` = standard deviation/standard error

### For 95% Confidence Interval:

```
Lower Bound = μ - (1.96 × σ)
Upper Bound = μ + (1.96 × σ)
```

**Width of Interval:**
```
Width = Upper Bound - Lower Bound = 2 × (1.96 × σ) = 3.92 × σ
```

### Z-Scores for Different Confidence Levels:

| Confidence Level | Z-Score | Use Case |
|-----------------|---------|----------|
| 90% | 1.645 | Less conservative |
| 95% | 1.96 | **Standard (most common)** |
| 99% | 2.576 | Very conservative |

---

## 4. How It's Calculated in Your Forecast

### Your Code (from `forecastService.ts`):

```typescript
// Line 104-106
// Calculate 95% CI
const ci_lower = arima_mean - 1.96 * garch_vol;
const ci_upper = arima_mean + 1.96 * garch_vol;
```

### Step-by-Step Process:

#### Step 1: Get the Point Estimate (ARIMA Mean)
```
ARIMA Mean = μ_predicted = Expected return from ARIMA model
```
- This is your best guess at what tomorrow's return will be
- Example: If ARIMA predicts +0.17%, that's your point estimate

#### Step 2: Get the Volatility (GARCH Volatility)
```
GARCH Volatility = σ_predicted = Predicted volatility from GARCH model
```
- This represents uncertainty/risk
- Example: If GARCH predicts 1.0% volatility, that's your σ

#### Step 3: Calculate Confidence Interval Bounds

**Lower Bound:**
```
ci_lower = ARIMA_mean - (1.96 × GARCH_vol)
         = 0.17% - (1.96 × 1.0%)
         = 0.17% - 1.96%
         = -1.79%
```

**Upper Bound:**
```
ci_upper = ARIMA_mean + (1.96 × GARCH_vol)
         = 0.17% + (1.96 × 1.0%)
         = 0.17% + 1.96%
         = +2.13%
```

#### Step 4: Interpretation

The 95% confidence interval is **[-1.79%, +2.13%]**

This means:
- We are 95% confident that tomorrow's return will fall between -1.79% and +2.13%
- The most likely return is 0.17% (ARIMA mean)
- There's a 5% chance the actual return will be outside this range

---

## 5. Visualization in the Chart

### Chart Elements:

1. **Purple Dashed Line (ARIMA Mean)**
   - Represents the point estimate (μ)
   - Your "best guess" at the expected return

2. **Purple Shaded Region (95% CI)**
   - The area between `ciLower` and `ciUpper`
   - Visual representation of uncertainty
   - Wider region = more uncertainty

3. **Blue Line (Historical Returns)**
   - Actual past returns for comparison
   - Shows how often historical returns fell within the CI

### Chart Code (from `HybridForecast.tsx`):

```typescript
// Lines 279-294
{/* 95% CI Region (Area) */}
<Area
  yAxisId="left"
  type="monotone"
  dataKey="ciUpper"      // Upper bound line
  stroke="none"
  fill="url(#ciGradient)"  // Purple gradient fill
  name="95% CI"
/>
<Area
  yAxisId="left"
  type="monotone"
  dataKey="ciLower"      // Lower bound line
  stroke="none"
  fill="url(#ciGradient)"  // Fills the area between
/>
```

### How the Shaded Region is Created:

1. **Two lines are drawn:**
   - Upper line at `ciUpper` values
   - Lower line at `ciLower` values

2. **Area between them is filled:**
   - Creates the purple shaded region
   - The fill uses a gradient (darker at center, lighter at edges)

3. **Visual Interpretation:**
   - Narrow region = High confidence, low uncertainty
   - Wide region = Lower confidence, high uncertainty

---

## 6. Practical Interpretation

### What Does "95% Confidence" Really Mean?

**Common Misconception:**
❌ "There's a 95% chance the return will be in this range"

**Correct Interpretation:**
✅ "If we repeated this forecast 100 times, in 95 of those cases, the actual return would fall within this interval"

### Real-World Example:

Suppose you see:
- **ARIMA Mean:** +0.17%
- **GARCH Volatility:** 1.0%
- **95% CI:** [-1.79%, +2.13%]

**Meaning:**
- Expected return: +0.17% (slightly positive)
- Range of likely outcomes: -1.79% to +2.13%
- Risk level: Moderate (1.0% volatility)

### Decision Making:

**Trading Strategy Based on CI:**

1. **CI is entirely positive (e.g., [0.5%, 2.0%])**
   - Strong bullish signal
   - High probability of positive return

2. **CI crosses zero (e.g., [-1.0%, +1.5%])**
   - Uncertain direction
   - Could go up or down
   - Higher risk

3. **CI is entirely negative (e.g., [-2.5%, -0.5%])**
   - Bearish signal
   - High probability of negative return

### Factors Affecting CI Width:

1. **Higher Volatility (σ)**
   - Wider CI
   - More uncertainty

2. **More Historical Data**
   - Narrower CI (usually)
   - Better estimate of parameters

3. **Market Conditions**
   - Volatile markets = wider CI
   - Stable markets = narrower CI

---

## 7. Mathematical Derivation (Advanced)

### Why 1.96 for 95% CI?

From the standard normal distribution:
- Probability density function (PDF) of Z ~ N(0, 1)
- Cumulative distribution function (CDF) gives probabilities

**For 95% confidence:**
- We want 2.5% in each tail
- P(Z ≤ -1.96) = 0.025
- P(Z ≥ +1.96) = 0.025
- P(-1.96 ≤ Z ≤ +1.96) = 0.95

**Proof:**
```
P(-1.96 ≤ Z ≤ +1.96) = Φ(1.96) - Φ(-1.96)
                     = 0.975 - 0.025
                     = 0.95
                     = 95%
```

Where `Φ` is the CDF of standard normal distribution.

### Standard Error vs Standard Deviation

**In your forecast:**
- GARCH volatility serves as the standard error (σ)
- It represents forecast uncertainty, not just historical volatility

**Why use GARCH volatility instead of historical volatility?**
- GARCH models time-varying volatility
- Captures volatility clustering
- Better reflects future uncertainty

---

## 8. Limitations and Assumptions

### Key Assumptions:

1. **Normality Assumption**
   - Returns are normally distributed
   - **Reality:** Stock returns often have "fat tails" (extreme events more common)

2. **Constant Parameters**
   - ARIMA/GARCH parameters remain stable
   - **Reality:** Market regimes change

3. **No Structural Breaks**
   - No sudden market changes
   - **Reality:** Black swan events occur

### What CI Doesn't Tell You:

- ❌ Exact future price
- ❌ Probability of specific return values
- ❌ Guarantee that future will behave like past

### What CI Does Tell You:

- ✅ Range of likely outcomes
- ✅ Level of uncertainty
- ✅ Risk assessment

---

## 9. Summary

### Key Takeaways:

1. **Confidence Interval** = Range of values that likely contains the true value

2. **95% CI Formula**:
   ```
   CI = μ ± (1.96 × σ)
   ```

3. **In Your Forecast**:
   ```
   ci_lower = ARIMA_mean - (1.96 × GARCH_vol)
   ci_upper = ARIMA_mean + (1.96 × GARCH_vol)
   ```

4. **Interpretation**:
   - 95% chance actual return falls within [ci_lower, ci_upper]
   - Wider interval = more uncertainty
   - Narrower interval = more confidence

5. **Visual Representation**:
   - Purple shaded region in chart
   - ARIMA mean (dashed line) at center
   - Bounds shown as filled area

### Quick Reference:

```typescript
// Your code implementation
const ci_lower = arima_mean - 1.96 * garch_vol;  // Lower bound
const ci_upper = arima_mean + 1.96 * garch_vol;  // Upper bound

// Interpretation
// 95% confidence that actual return ∈ [ci_lower, ci_upper]
```

---

## 10. Further Reading

- **Statistical Inference**: Understanding sampling and estimation
- **Time Series Analysis**: ARIMA/GARCH models
- **Risk Management**: Using CI for position sizing
- **Value at Risk (VaR)**: Related concept for risk measurement

---

**Created for:** Groww DSFM Analysis Forecast Visualization  
**File Reference:** `src/services/dsfm/forecastService.ts` (lines 104-106)

