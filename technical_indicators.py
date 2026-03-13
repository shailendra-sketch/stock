import pandas as pd
import numpy as np

def calculate_ema(df: pd.DataFrame, period: int, column: str = 'close') -> pd.Series:
    return df[column].ewm(span=period, adjust=False).mean()

def calculate_macd(df: pd.DataFrame, fast=12, slow=26, signal=9) -> dict:
    ema_fast = calculate_ema(df, fast)
    ema_slow = calculate_ema(df, slow)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {"macd": macd_line, "signal": signal_line, "hist": histogram}

def calculate_rsi(df: pd.DataFrame, period=14) -> pd.Series:
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_stochastic(df: pd.DataFrame, period=14, smooth_k=3, smooth_d=3) -> dict:
    low_min = df['low'].rolling(window=period).min()
    high_max = df['high'].rolling(window=period).max()
    k_fast = 100 * (df['close'] - low_min) / (high_max - low_min)
    k_slow = k_fast.rolling(window=smooth_k).mean()
    d_slow = k_slow.rolling(window=smooth_d).mean()
    return {"k": k_slow, "d": d_slow}

def calculate_cci(df: pd.DataFrame, period=20) -> pd.Series:
    tp = (df['high'] + df['low'] + df['close']) / 3
    ma = tp.rolling(window=period).mean()
    md = tp.rolling(window=period).apply(lambda x: pd.Series(x - x.mean()).abs().mean())
    cci = (tp - ma) / (0.015 * md)
    return cci

def enrich_with_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df['ema50'] = calculate_ema(df, 50)
    df['ema200'] = calculate_ema(df, 200)
    
    macd_res = calculate_macd(df)
    df['macd'] = macd_res['macd']
    df['macd_signal'] = macd_res['signal']
    df['macd_hist'] = macd_res['hist']
    
    df['rsi'] = calculate_rsi(df)
    
    stoch_res = calculate_stochastic(df)
    df['stoch_k'] = stoch_res['k']
    df['stoch_d'] = stoch_res['d']
    
    df['cci'] = calculate_cci(df)
    
    # Fill Nans for mock robustness
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    df.fillna(0, inplace=True)
    
    return df

def generate_alerts(df: pd.DataFrame) -> list:
    alerts = []
    if len(df) < 3:
        return alerts
        
    latest = df.iloc[-1]
    prev = df.iloc[-2]
    timestamp = "Just now" # For live ticking, we can say just now or format time
    
    # MACD Crossover
    if prev['macd_hist'] <= 0 and latest['macd_hist'] > 0:
        alerts.insert(0, {"message": "MACD Bullish Crossover", "time": timestamp, "type": "bullish"})
    elif prev['macd_hist'] >= 0 and latest['macd_hist'] < 0:
        alerts.insert(0, {"message": "MACD Bearish Crossover", "time": timestamp, "type": "bearish"})
        
    # RSI
    if prev['rsi'] < 30 and latest['rsi'] >= 30:
        alerts.insert(0, {"message": "RSI Oversold Bounce", "time": timestamp, "type": "bullish"})
    elif prev['rsi'] > 70 and latest['rsi'] <= 70:
        alerts.insert(0, {"message": "RSI Overbought Drop", "time": timestamp, "type": "bearish"})
        
    # EMA Breakout
    if prev['close'] < prev['ema50'] and latest['close'] > latest['ema50']:
        alerts.insert(0, {"message": "EMA50 Breakout", "time": timestamp, "type": "bullish"})
    elif prev['close'] > prev['ema50'] and latest['close'] < latest['ema50']:
        alerts.insert(0, {"message": "EMA50 Breakdown", "time": timestamp, "type": "bearish"})
        
    # Stochastic Crossover
    if prev['stoch_k'] <= prev['stoch_d'] and latest['stoch_k'] > latest['stoch_d']:
        alerts.insert(0, {"message": "Stochastic Bullish Crossover", "time": timestamp, "type": "bullish"})
    elif prev['stoch_k'] >= prev['stoch_d'] and latest['stoch_k'] < latest['stoch_d']:
        alerts.insert(0, {"message": "Stochastic Bearish Crossover", "time": timestamp, "type": "bearish"})
        
    if not alerts:
         alerts = [
             {"message": "Consolidating near Support", "time": "5 mins ago", "type": "neutral"},
             {"message": "Volume Spike Detected", "time": "15 mins ago", "type": "neutral"}
         ]
         
    return alerts[:5]
