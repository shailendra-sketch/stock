import pandas as pd

def detect_patterns(df: pd.DataFrame) -> dict:
    if len(df) < 5:
        return {"pattern": "No Active Pattern", "confidence": 0}
        
    # Analyze the last few candles, specifically taking the most recent closed candle
    latest = df.iloc[-1]
    prev = df.iloc[-2]
    
    # Calculate sizes
    curr_body = latest['close'] - latest['open']
    curr_range = latest['high'] - latest['low']
    prev_body = prev['close'] - prev['open']
    
    # 1. Bullish Engulfing
    if prev_body < 0 and curr_body > 0 and latest['close'] > prev['open'] and latest['open'] < prev['close']:
        return {"pattern": "Bullish Engulfing", "confidence": 0.85}
        
    # 2. Bearish Engulfing
    if prev_body > 0 and curr_body < 0 and latest['open'] > prev['close'] and latest['close'] < prev['open']:
        return {"pattern": "Bearish Engulfing", "confidence": 0.85}
        
    # 3. Doji
    if curr_range > 0 and (abs(curr_body) / curr_range) < 0.1:
        return {"pattern": "Doji", "confidence": 0.70}
        
    # 4. Hammer
    lower_wick = latest['open'] - latest['low'] if curr_body > 0 else latest['close'] - latest['low']
    upper_wick = latest['high'] - latest['close'] if curr_body > 0 else latest['high'] - latest['open']
    if lower_wick > (2 * abs(curr_body)) and upper_wick < (0.2 * abs(curr_body)):
         return {"pattern": "Hammer", "confidence": 0.75}
         
    # 5. Morning Star
    if len(df) >= 3:
        prev2 = df.iloc[-3]
        if (prev2['close'] - prev2['open']) < 0 and abs(prev_body) < ((prev2['high'] - prev2['low']) * 0.3) and curr_body > 0 and latest['close'] > (prev2['open'] + prev2['close'])/2:
             return {"pattern": "Morning Star", "confidence": 0.80}

    # 6. Triangles
    if len(df) >= 20:
        recent = df.tail(20)
        highs_max = recent['high'].max()
        lows_trend = recent['low'].is_monotonic_increasing
        # simplistic check for ascending resistance with higher lows
        if lows_trend and latest['close'] >= highs_max * 0.998:
            return {"pattern": "Ascending Triangle", "confidence": 0.90}
            
        lows_min = recent['low'].min()
        highs_trend = recent['high'].is_monotonic_decreasing
        if highs_trend and latest['close'] <= lows_min * 1.002:
            return {"pattern": "Descending Triangle", "confidence": 0.90}
            
    return {"pattern": "No Active Pattern", "confidence": 0}
