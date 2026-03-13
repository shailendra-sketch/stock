import React, { useEffect, useState, useRef, useCallback } from 'react';
import KpiCards from './KpiCards';
import MainChart from './MainChart';
import { AiSignalsWidget, PatternDetectionWidget, SentimentWidget } from './SidebarWidgets';
import { AlertsWidget, TechnicalsWidget } from './BottomWidgets';

const Dashboard = () => {
    const [activeTimeframe, setActiveTimeframe] = useState('1D');
    const [chartData, setChartData] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [connectionState, setConnectionState] = useState('Disconnected');
    const [statusMessage, setStatusMessage] = useState('Click CONNECT to load market data.');
    const [isChartVisible, setIsChartVisible] = useState(false);
    const [analysisInfo, setAnalysisInfo] = useState({
        snapshot: null,
        ai_forecast: null,
        patterns: [],
        sentiment: null,
        is_market_open: true,
        provider_status: ''
    });
    const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
    const wsRef = useRef(null);
    const lastTickRef = useRef(null);
    const throttleTimeoutRef = useRef(null);

    // Dynamically fetch NIFTY data for the specified timeframe
    const fetchNiftyData = async (tf) => {
        try {
            setStatusMessage("Loading Market Data...");
            // Use the general historical endpoint mapped to the dynamic timeframe
            const res = await fetch(`http://localhost:7860/api/historical/${tf}?limit=250`);
            
            if (!res.ok) {
                throw new Error("Backend unavailable or returned error.");
            }
            
            const data = await res.json();
            if (data && data.length > 0) {
                setChartData(data);
                setIsChartVisible(true);
                setHasMoreData(data.length >= 250);
            } else {
                 setStatusMessage("No data available from backend.");
                 setIsChartVisible(false);
            }
            
            // Still fetch analysis separately for sidebars (now correctly maps to current tf)
            try {
                const analysisRes = await fetch('http://localhost:7860/api/analysis');
                if (analysisRes.ok) {
                    const aData = await analysisRes.json();
                    setAnalysisInfo(aData);
                    const t = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    setLastUpdatedTime(t);
                }
            } catch (e) {
                console.error("Failed to fetch analysis info", e);
            }
            
        } catch (e) {
            console.error("Failed to fetch NIFTY data.", e);
            setStatusMessage("Error: Failed to fetch market data from backend.");
            setIsChartVisible(false);
        }
    };

    // Load more generic function logic unchanged, but points to old endpoint which allows paging.
    // The user requested /nifty-data for the main fetch
    const fetchData = async (tf, isLoadMore = false) => {
        try {
            let url = `http://localhost:7860/api/historical/${tf}?limit=250`;
            if (isLoadMore && chartData.length > 0) {
                // Get the timestamp of the oldest candle currently loaded
                const oldestTime = chartData[0].time;
                url += `&until_date=${oldestTime}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Backend unavailable");
            const data = await res.json();

            if (data.length < 250) {
                setHasMoreData(false);
            }

            if (isLoadMore) {
                setChartData(prev => [...data, ...prev]);
            }
        } catch (e) {
            console.error("Failed to fetch older REST data.", e);
        }
    };

    // Auto-fetch data on mount and when timeframe changes
    useEffect(() => {
        // Refetch analysis when timeframe changes, handle chart separately
        // We do NOT completely reset chart data to [] here anymore so Lightweight Charts
        // just sees an update via setChartData() within fetchNiftyData.
        setHasMoreData(true);
        setIsChartVisible(false);
        fetchNiftyData(activeTimeframe);
        
        const intervalId = setInterval(() => {
            fetchNiftyData(activeTimeframe);
        }, 10000);
        return () => clearInterval(intervalId);
    }, [activeTimeframe]);

    const loadMoreData = useCallback(async () => {
        if (isLoadingMore || !hasMoreData) return;
        setIsLoadingMore(true);
        await fetchData(activeTimeframe, true);
        setIsLoadingMore(false);
    }, [isLoadingMore, hasMoreData, activeTimeframe, chartData]);

    useEffect(() => {
        let reconnectTimeout;

        const connectWs = () => {
            setConnectionState('Connecting');
            try {
                const ws = new WebSocket("ws://localhost:7860/ws");
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnectionState('Live');
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);

                        if (msg.type === "status") {
                            setConnectionState('Live');
                            setAnalysisInfo(prev => ({
                                ...prev,
                                provider_status: msg.provider,
                                is_market_open: msg.is_market_open !== undefined ? msg.is_market_open : prev.is_market_open
                            }));
                        }

                        if (msg.type === "tick") {
                            lastTickRef.current = msg;

                            if (!throttleTimeoutRef.current) {
                                throttleTimeoutRef.current = setTimeout(() => {
                                    const flushedMsg = lastTickRef.current;
                                    if (flushedMsg) {
                                        const { data, snapshot, timestamp } = flushedMsg;

                                        // Update the chart if we are on 1D timeframe (tick data is daily OHLC)
                                        if (activeTimeframe === '1D') {
                                            setChartData(prev => {
                                                const copy = [...prev];
                                                if (copy.length > 0 && copy[copy.length - 1].time === data.time) {
                                                    copy[copy.length - 1] = {
                                                        time: data.time,
                                                        open: data.open,
                                                        high: data.high,
                                                        low: data.low,
                                                        close: data.close
                                                    }; // Update existing candle map to Nifty payload structure
                                                } else {
                                                    copy.push({
                                                        time: data.time,
                                                        open: data.open,
                                                        high: data.high,
                                                        low: data.low,
                                                        close: data.close
                                                    }); // Append new candle
                                                }
                                                return copy;
                                            });
                                        } else {
                                            // For intraday timeframes, we can just update the LTP snapshot 
                                            // and let the user manually refresh or wait for the next cycle.
                                            // Alternatively, a more complex logic would map the daily tick to intraday logic.
                                        }

                                        setAnalysisInfo(prev => ({ ...prev, snapshot }));
                                        if (timestamp) setLastUpdatedTime(timestamp);
                                    }
                                    throttleTimeoutRef.current = null;
                                }, 1000); // 1-second throttle to avoid UI re-render thrash
                            }
                        }
                        
                        // New 30-second interval dynamic analysis update
                        if (msg.type === "analysis") {
                            setAnalysisInfo(prev => ({
                                ...prev,
                                ...msg.data
                            }));
                        }
                    } catch (err) {
                        console.error("WS Parse Error", err);
                    }
                };

                ws.onclose = () => {
                    setConnectionState('Disconnected');
                    setStatusMessage("Live data feed disconnected. Click CONNECT to re-establish.");
                    setIsChartVisible(false);
                    // Removed reconnect timeout as user wanted explicit connection control
                };

                ws.onerror = (err) => {
                    console.error("WebSocket connection error");
                    setStatusMessage("WebSocket connection error. Click CONNECT to retry.");
                    ws.close();
                };
            } catch (e) {
                console.error("WebSocket initialization failed", e);
                setConnectionState('Disconnected');
            }
        };

        // Attach connectWs to a ref so we can call it on click
        wsRef.connectFn = connectWs;
        
        // Auto-connect to receive Live Feed and 30s analysis payloads
        connectWs();

        return () => {
            clearTimeout(reconnectTimeout);
            if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
            if (wsRef.current && typeof wsRef.current.close === 'function') {
                try { wsRef.current.close(); } catch(e) {}
            }
        };
    }, [activeTimeframe]);

    const lastCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;

    return (
        <>
            <div className="area-header" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ flex: 1 }}></div>
                    <div style={{ flex: 2, textAlign: 'center' }}>
                        <h1 className="title-glow">Market Matrix</h1>
                        <p className="subtitle" style={{ marginBottom: '16px' }}>AI-Powered Candlestick Analysis for NIFTY 50</p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={() => {
                                        if (connectionState === 'Disconnected') {
                                            // Call fetch AND start WS on explicit connect button click
                                            fetchNiftyData(activeTimeframe);
                                            if (wsRef.connectFn) {
                                                wsRef.connectFn();
                                            }
                                        } else if (analysisInfo.provider_status === 'Disconnected' || analysisInfo.provider_status === 'Market Closed · Showing last available data') {
                                            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'start' }));
                                        } else {
                                            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ action: 'stop' }));
                                        }
                                    }}
                                    disabled={analysisInfo.is_market_open === false}
                                    title={analysisInfo.is_market_open === false ? "Live feed available during market hours" : ""}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: analysisInfo.is_market_open === false ? 'rgba(255,255,255,0.3)' : '#fff',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        cursor: analysisInfo.is_market_open === false ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => { if (analysisInfo.is_market_open !== false) e.target.style.background = 'rgba(255,255,255,0.1)' }}
                                    onMouseOut={(e) => { if (analysisInfo.is_market_open !== false) e.target.style.background = 'transparent' }}
                                >
                                    {(analysisInfo.provider_status === 'Disconnected' || analysisInfo.provider_status === 'Market Closed · Showing last available data' || connectionState === 'Disconnected') ? 'CONNECT' : 'DISCONNECT'}
                                </button>
                                <div style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: connectionState === 'Live' ? '#10B981' : connectionState === 'Connecting' ? '#F59E0B' : '#EF4444',
                                        boxShadow: `0 0 8px ${connectionState === 'Live' ? '#10B981' : connectionState === 'Connecting' ? '#F59E0B' : '#EF4444'}`
                                    }}></div>
                                    {connectionState === 'Connecting' ? 'Connecting...' : connectionState === 'Disconnected' ? 'Disconnected' : (analysisInfo.provider_status || 'Live Feed')}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                {lastUpdatedTime ? `Last updated ${lastUpdatedTime} IST` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="top-divider"></div>
            </div>

            {analysisInfo.snapshot ? (
                <KpiCards snapshot={analysisInfo.snapshot} />
            ) : (
                <div className="area-kpis flex-row justify-between" style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#60A5FA' }}>Waiting for connection...</div>
            )}

            {isLoadingMore && <div style={{ textAlign: 'center', color: '#60A5FA', fontSize: '0.8rem', marginTop: '8px' }}>Fetching older data...</div>}
            
            {!isChartVisible && (
                <div className="area-chart flex items-center justify-center min-h-[400px]" style={{
                    background: 'rgba(10, 20, 40, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    color: statusMessage.includes('Error') ? '#EF4444' : '#60A5FA',
                    fontSize: '1.2rem',
                    fontWeight: 500
                }}>
                    {statusMessage}
                </div>
            )}

            {isChartVisible && (
                <MainChart
                    data={chartData}
                    handleTimeframeChange={setActiveTimeframe}
                    activeTimeframe={activeTimeframe}
                    onLoadMore={hasMoreData ? loadMoreData : null}
                />
            )}

            <div className="area-sidebar">
                <AiSignalsWidget reasons={analysisInfo.ai_forecast?.reasons} isMarketOpen={analysisInfo.is_market_open} />
                <PatternDetectionWidget patterns={analysisInfo.patterns} />
                <SentimentWidget sentiment={analysisInfo.sentiment} />
            </div>

            <div className="area-bottom">
                <AlertsWidget alerts={analysisInfo.alerts} />
                <TechnicalsWidget lastCandle={lastCandle} />
            </div>
        </>
    );
};

export default Dashboard;
