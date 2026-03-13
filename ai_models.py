import pandas as pd
import random
import numpy as np

def generate_ai_forecast(df: pd.DataFrame) -> dict:
    if len(df) < 14:
        return {"signal": "Neutral", "confidence": 50, "reasons": ["Not enough data"]}
    
    latest_close = df.iloc[-1]['close']
    rsi = df.iloc[-1]['rsi']
    macd_hist = df.iloc[-1]['macd_hist']
    ema50 = df.iloc[-1]['ema50']
    ema200 = df.iloc[-1]['ema200']
    
    # Calculate volatility bound based on ATR pseudo-logic (std dev of recent closes)
    std_dev = df['close'].tail(14).std()
    
    score = 0
    reasons = []
    
    if latest_close > ema50:
        score += 20
        reasons.append("Price above 50 EMA")
    else:
        score -= 20
        reasons.append("Price below 50 EMA")
        
    if latest_close > ema200:
        score += 30
        reasons.append("Long-term Bullish Trend (Price > 200 EMA)")
    else:
        score -= 30
        reasons.append("Long-term Bearish Trend (Price < 200 EMA)")
        
    if macd_hist > 0:
        score += 25
        reasons.append("MACD Bullish Momentum")
    else:
        score -= 25
        reasons.append("MACD Bearish Momentum")
        
    if rsi < 30:
        score += 25
        reasons.append("RSI Oversold (Reversal Potential)")
    elif rsi > 70:
        score -= 25
        reasons.append("RSI Overbought (Downside Risk)")
        
    # Ensemble mock score
    confidence = min(abs(score), 95)
    
    if score > 20:
        signal = "Bullish"
        predicted_pt_delta = random.uniform(0.5 * std_dev, 2.0 * std_dev)
    elif score < -20:
        signal = "Bearish"
        predicted_pt_delta = -random.uniform(0.5 * std_dev, 2.0 * std_dev)
    else:
        signal = "Sideways"
        predicted_pt_delta = random.uniform(-0.5 * std_dev, 0.5 * std_dev)
        
    predicted_return = (predicted_pt_delta / latest_close) * 100
        
    # Limit reasons to top 3
    return {
        "signal": signal,
        "confidence": round(confidence, 1),
        "reasons": reasons[:3],
        "predicted_pts": round(predicted_pt_delta, 2),
        "predicted_return_pct": round(predicted_return, 2),
        "target_price": round(latest_close + predicted_pt_delta, 2)
    }

def get_sentiment(df: pd.DataFrame) -> dict:
    if len(df) < 2:
         return {"positive_pct": 50, "news": ["Market Neutral - Insufficient Data"]}
         
    latest = df.iloc[-1]
    
    bullish_signals = 0
    bearish_signals = 0
    total_signals = 0
    
    # MACD
    if latest.get('macd_hist', 0) > 0:
        bullish_signals += 1
    elif latest.get('macd_hist', 0) < 0:
        bearish_signals += 1
    total_signals += 1
        
    # RSI
    if latest.get('rsi', 50) < 30:
        bullish_signals += 1 # Oversold is considered bullish potential
    elif latest.get('rsi', 50) > 70:
        bearish_signals += 1
    total_signals += 1
        
    # Stochastic
    if latest.get('stoch_k', 50) > latest.get('stoch_d', 50):
        bullish_signals += 1
    elif latest.get('stoch_k', 50) < latest.get('stoch_d', 50):
        bearish_signals += 1
    total_signals += 1
        
    # CCI
    if latest.get('cci', 0) > 100:
        bullish_signals += 1
    elif latest.get('cci', 0) < -100:
        bearish_signals += 1
    total_signals += 1
        
    # EMA50
    if latest['close'] > latest.get('ema50', latest['close']):
        bullish_signals += 1
    elif latest['close'] < latest.get('ema50', latest['close']):
        bearish_signals += 1
    total_signals += 1
        
    if total_signals == 0:
        pct = 50
    else:
        # User requested formula: (bullish / total) * 100
        # To account for purely neutral markets we might adjust, but following instruction strictly:
        pct = int((bullish_signals / total_signals) * 100)
    
    news_headlines = []
    try:
        import yfinance as yf
        ticker = yf.Ticker("^NSEI")
        news = ticker.news
        if news and isinstance(news, list):
            for item in news[:3]:
                title = item.get('title', '')
                if title:
                    news_headlines.append({
                        "title": title,
                        "publisher": item.get('publisher', 'Yahoo Finance'),
                        "link": item.get('link', '#'),
                        "time": item.get('providerPublishTime', '') # can map to readable format downstream if needed
                    })
    except Exception as e:
        print(f"Error fetching news: {e}")
        
    if not news_headlines:
        news_headlines = [{
            "title": "Market news currently unavailable",
            "publisher": "",
            "link": "",
            "time": ""
        }]
        
    return {
        "positive_pct": pct,
        "news": news_headlines
    }
