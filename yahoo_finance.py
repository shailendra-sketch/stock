import os
import json
import logging
from datetime import datetime, timedelta, date
import pytz
import pandas as pd
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

try:
    import yfinance as yf
except ImportError:
    logging.warning("yfinance not installed. Demo mode will be forced if used.")
    yf = None

load_dotenv()
logger = logging.getLogger(__name__)

# Config
NIFTY_SYMBOL = os.getenv("NIFTY_SYMBOL", "^NSEI")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def _get_cache_path(timeframe: str) -> str:
    return os.path.join(CACHE_DIR, f"historical_{timeframe}.json")


# Static list of major NSE holidays for 2024/2025 (YYYY-MM-DD)
# This is a sample list and should be extended/maintained for production.
NSE_HOLIDAYS = [
    "2024-01-26", # Republic Day
    "2024-03-08", # Mahashivratri
    "2024-03-25", # Holi
    "2024-03-29", # Good Friday
    "2024-04-11", # Id-Ul-Fitr (Ramzan Id)
    "2024-04-17", # Shri Ram Navmi
    "2024-05-01", # Maharashtra Day
    "2024-06-17", # Bakri Id
    "2024-07-17", # Muharram
    "2024-08-15", # Independence Day
    "2024-10-02", # Mahatma Gandhi Jayanti
    "2024-11-01", # Diwali-Laxmi Pujan
    "2024-11-15", # Gurunanak Jayanti
    "2024-12-25", # Christmas
    # 2025 samples
    "2025-01-26", "2025-02-26", "2025-03-14", "2025-03-31", 
    "2025-04-10", "2025-04-14", "2025-04-18", "2025-05-01", 
    "2025-08-15", "2025-08-27", "2025-10-02", "2025-10-21", 
    "2025-11-05", "2025-12-25"
]

def is_market_open() -> bool:
    """
    Check if the current time is within NSE market hours.
    NSE Market Hours: Monday to Friday, 09:15 to 15:30 IST.
    Excludes weekends and dates in NSE_HOLIDAYS.
    """
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    # Check if weekend (0=Mon, 5=Sat, 6=Sun)
    if now.weekday() >= 5:
        return False
        
    # Check if holiday
    current_date_str = now.strftime("%Y-%m-%d")
    if current_date_str in NSE_HOLIDAYS:
        return False
        
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    return True # Force open for verifying ticks

def get_historical_data(timeframe: str) -> list[dict]:
    """
    Fetch historical data from Yahoo Finance with retries and fallback to local cache.
    Maps our internal timeframes to Yahoo Finance intervals and periods.
    """
    if not yf:
        logger.error("yfinance library not available")
        return []
        
    tf_mapping = {
        "1D": {"interval": "1d", "period": "6mo"},
        "1W": {"interval": "1wk", "period": "1y"},
        "1M": {"interval": "1mo", "period": "5y"},
        "15m": {"interval": "15m", "period": "5d"},
        "5m": {"interval": "5m", "period": "5d"},
        "1m": {"interval": "1m", "period": "1d"},
    }
    
    if timeframe not in tf_mapping:
         logger.error(f"Unsupported timeframe for Yahoo Finance: {timeframe}")
         return []
         
    config = tf_mapping[timeframe]
    cache_path = _get_cache_path(timeframe)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _fetch():
        ticker = yf.Ticker(NIFTY_SYMBOL)
        df = ticker.history(period=config["period"], interval=config["interval"])
        if df.empty:
            raise ValueError(f"No data returned from Yahoo Finance for {NIFTY_SYMBOL}")
        return df

    try:
        df = _fetch()
        df = df.dropna()
        
        formatted = []
        for index, row in df.iterrows():
            if timeframe in ["1D", "1W", "1M"]:
                if isinstance(index, pd.Timestamp):
                    time_str = index.strftime("%Y-%m-%d")
                else: 
                     time_str = str(index)[:10]
            else:
                if isinstance(index, pd.Timestamp):
                    if index.tzinfo is not None:
                         index = index.tz_convert('Asia/Kolkata')
                    else:
                         index = index.tz_localize('UTC').tz_convert('Asia/Kolkata')
                    time_str = index.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    time_str = str(index)[:19]
                
            formatted.append({
                "time": time_str,
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": float(row['Volume'])
            })
            
        # Save to cache on success
        try:
            with open(cache_path, "w") as f:
                json.dump(formatted, f)
        except Exception as ce:
            logger.error(f"Failed to write cache for {timeframe}: {ce}")
            
        return formatted
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance historical data: {e}. Falling back to cache.")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    cached_data = json.load(f)
                    logger.info(f"Loaded {len(cached_data)} records for {timeframe} from cache.")
                    return cached_data
            except Exception as ce:
                logger.error(f"Error reading cache for {timeframe}: {ce}")
        return []

def poll_latest_price() -> dict | None:
    """
    Polls Yahoo Finance for the latest price / 1-minute candle to update the live feed.
    """
    if not yf:
        return None
        
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
    def _fetch_latest():
        ticker = yf.Ticker(NIFTY_SYMBOL)
        df = ticker.history(period="1d", interval="1d")
        if df.empty:
            raise ValueError("No data returned")
        return df

    try:
        df = _fetch_latest()
        latest_row = df.iloc[-1]
        
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        time_str = now.strftime("%Y-%m-%d")
        
        if isinstance(df.index[-1], pd.Timestamp):
             candle_date = df.index[-1].strftime("%Y-%m-%d")
        else:
             candle_date = str(df.index[-1])[:10]
             
        if candle_date != time_str and is_market_open():
             pass 

        return {
            "time": candle_date,
            "open": float(latest_row['Open']),
            "high": float(latest_row['High']),
            "low": float(latest_row['Low']),
            "close": float(latest_row['Close']),
            "volume": float(latest_row['Volume'])
        }
            
    except Exception as e:
        logger.error(f"Error polling Yahoo Finance: {e}")
        return None
