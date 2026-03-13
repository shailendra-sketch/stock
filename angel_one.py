import os
import pyotp
import logging
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv

# Try to import the SmartAPI libraries, fallback safely if unavailable
try:
    from SmartApi import SmartConnect
    from SmartApi.smartWebSocketV2 import SmartWebSocketV2
except ImportError:
    logging.warning("SmartApi not installed properly. Demo mode will be forced if used.")
    SmartConnect = None
    SmartWebSocketV2 = None

load_dotenv()

# Setup Logging
logger = logging.getLogger(__name__)

# Config
API_KEY = os.getenv("ANGEL_API_KEY")
CLIENT_CODE = os.getenv("ANGEL_CLIENT_CODE")
PASSWORD = os.getenv("ANGEL_PASSWORD")
TOTP_SECRET = os.getenv("ANGEL_TOTP_SECRET")

NIFTY_TOKEN = os.getenv("NIFTY_TOKEN", "26000")
EXCHANGE = os.getenv("NIFTY_EXCHANGE", "NSE")

# Singleton references
_smart_api = None
_auth_token = None
_feed_token = None
_jwt_token = None
_ws = None

# Global state to track live OHLC
# Note: For production, this should be a robust TimeSeries DB or Redis.
live_nifty_state = {
    "1D": None,
    "last_update": None
}

def is_market_open() -> bool:
    """
    Check if the current time is within NSE market hours.
    NSE Market Hours: Monday to Friday, 09:15 to 15:30 IST.
    Doesn't account for specific holiday dates in this pure logic version,
    but provides the core gating mechanism.
    """
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    
    # Check if weekend (0=Mon, 6=Sun)
    if now.weekday() >= 5:
        return False
        
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    return market_open <= now <= market_close

def get_totp():
    if not TOTP_SECRET:
        return ""
    try:
        totp = pyotp.TOTP(TOTP_SECRET).now()
        return totp
    except Exception as e:
        logger.error(f"Failed to generate TOTP: {e}")
        return ""

def initialize_angel_one():
    global _smart_api, _auth_token, _feed_token, _jwt_token
    
    if not all([API_KEY, CLIENT_CODE, PASSWORD, TOTP_SECRET]):
        logger.error("Missing Angel One credentials in .env")
        return False
        
    if not SmartConnect:
        return False

    try:
        _smart_api = SmartConnect(api_key=API_KEY)
        totp = get_totp()
        
        # Login
        data = _smart_api.generateSession(CLIENT_CODE, PASSWORD, totp)
        if data['status'] == False:
            logger.error(f"Angel One Login Failed: {data['message']}")
            return False
            
        _auth_token = data['data']['jwtToken']
        _feed_token = _smart_api.getfeedToken()
        _jwt_token = data['data']['jwtToken']
        
        logger.info("Successfully connected to Angel One SmartAPI")
        return True
        
    except Exception as e:
        logger.error(f"Angel One Initialization Error: {e}")
        return False

def get_historical_data(timeframe: str, points: int = 100) -> list[dict]:
    """
    Fetch historical data from Angel One or simulate if unavailable.
    """
    if not _smart_api:
        logger.error("SmartAPI not initialized for historical data call")
        return []
        
    interval_map = {
        "1D": "ONE_DAY",
        "1W": "ONE_DAY", # We would aggregate days to weeks manually in a real setup if ONE_WEEK unavailable
        "1M": "ONE_DAY"  # Same for months
    }
    
    ist = pytz.timezone('Asia/Kolkata')
    to_date = datetime.now(ist)
    
    if timeframe == '1D':
        from_date = to_date - timedelta(days=points * 1.5) # Buffer for weekends
    elif timeframe == '1W':
        from_date = to_date - timedelta(days=points * 7 * 1.5)
    else:
        from_date = to_date - timedelta(days=points * 30 * 1.5)
        
    try:
        historicParam = {
            "exchange": EXCHANGE,
            "symboltoken": NIFTY_TOKEN,
            "interval": interval_map.get(timeframe, "ONE_DAY"),
            "fromdate": from_date.strftime("%Y-%m-%d %H:%M"),
            "todate": to_date.strftime("%Y-%m-%d %H:%M")
        }
        response = _smart_api.getCandleData(historicParam)
        
        if response['status'] and response['data']:
            formatted = []
            for candle in response['data'][-points:]:
                formatted.append({
                    "time": candle[0][:10], # Truncate to YYYY-MM-DD
                    "open": candle[1],
                    "high": candle[2],
                    "low": candle[3],
                    "close": candle[4],
                    "volume": candle[5]
                })
            return formatted
        else:
            logger.error(f"Failed to fetch historical data: {response}")
            return []
            
    except Exception as e:
        logger.error(f"Error fetching Angel One historical data: {e}")
        return []

# --- WebSocket V2 Implementation ---

def _on_ws_data(ws, message):
    """
    Callback when a tick is received from SmartWebSocketV2
    message structure depends on the subscription mode. For mode 1 (LTP):
    {'type': 1, 'exchange_type': 1, 'token': '26000', 'sequence_number': 1234, 'exchange_timestamp': 1234567890, 'last_traded_price': 1750000}
    (Note: prices are usually implicitly multiplied by 100)
    """
    global live_nifty_state
    
    try:
        # Debug raw tick for identifying the structure
        # logger.info(f"Raw tick: {message}")
        
        # Depending on the SmartAPI version and subscription mode, the 'last_traded_price' 
        # is given in raw integer format (e.g. 1750000 means 17500.00)
        
        ltp_raw = message.get('last_traded_price', None)
        if ltp_raw is not None:
            ltp = float(ltp_raw) / 100.0
            
            # Update the global tracking candle
            ist = pytz.timezone('Asia/Kolkata')
            current_date_str = datetime.now(ist).strftime("%Y-%m-%d")
            
            if live_nifty_state["1D"] is None or live_nifty_state["1D"]["time"] != current_date_str:
                # Need to initialize a new daily candle
                live_nifty_state["1D"] = {
                    "time": current_date_str,
                    "open": ltp,
                    "high": ltp,
                    "low": ltp,
                    "close": ltp,
                    "volume": 0
                }
            else:
                # Update existing candle
                live_nifty_state["1D"]["close"] = ltp
                if ltp > live_nifty_state["1D"]["high"]:
                    live_nifty_state["1D"]["high"] = ltp
                if ltp < live_nifty_state["1D"]["low"]:
                    live_nifty_state["1D"]["low"] = ltp
                    
            live_nifty_state["last_update"] = datetime.now().timestamp()
            
    except Exception as e:
        logger.error(f"Error parsing Angel One tick: {e}")

def _on_ws_open(ws):
    logger.info("Angel One SmartWebSocketV2 Connected")
    token_list = [{
        "exchangeType": 1, # 1 for NSE
        "tokens": [NIFTY_TOKEN]
    }]
    # Subscribe to LTP (mode: 1), Quote (mode: 2), or SnapQuote (mode: 3)
    ws.subscribe("my_correlation_id", 1, token_list)

def _on_ws_error(ws, error):
    logger.error(f"Angel One SmartWebSocketV2 Error: {error}")

def _on_ws_close(ws, close_status_code, close_msg):
    logger.warning(f"Angel One SmartWebSocketV2 Closed: {close_msg}")

def start_websocket_feed():
    global _ws
    
    if not all([API_KEY, CLIENT_CODE, _feed_token, _jwt_token]):
        logger.error("Cannot start WebSocket. Credentials or Tokens missing.")
        return False
        
    if not SmartWebSocketV2:
        return False
        
    try:
        _ws = SmartWebSocketV2(_jwt_token, API_KEY, CLIENT_CODE, _feed_token)
        
        # Assign callbacks
        _ws.on_open = _on_ws_open
        _ws.on_data = _on_ws_data
        _ws.on_error = _on_ws_error
        _ws.on_close = _on_ws_close
        
        # Connect in a blocking way, so this needs to be run in a thread
        _ws.connect()
        return True
    except Exception as e:
        logger.error(f"Failed to start Angel One WS: {e}")
        return False
