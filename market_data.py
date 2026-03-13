import pandas as pd

def df_from_mock_data(data: list[dict]) -> pd.DataFrame:
    # Kept for compatibility if needed elsewhere, but ideally remove if not used elsewhere.
    # Actually, we can just use pd.DataFrame directly where needed, but let's keep it for now.
    df = pd.DataFrame(data)
    if not df.empty and 'time' in df.columns:
        df['time'] = pd.to_datetime(df['time'])
    return df
