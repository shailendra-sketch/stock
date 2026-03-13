import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, CrosshairMode } from 'lightweight-charts';

const MainChart = ({ data, handleTimeframeChange, activeTimeframe, onLoadMore }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const ema50SeriesRef = useRef(null);
    const ema200SeriesRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;
        if (chartRef.current) return; // ensure chart is only created once

        // Create Chart
        chartRef.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 450,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#d1d5db',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
            },
        });

        // Add Candles (v4 API)
        candleSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#EF4444',
            borderDownColor: '#EF4444',
            borderUpColor: '#10B981',
            wickDownColor: '#EF4444',
            wickUpColor: '#10B981',
        });

        // Add EMA 50
        ema50SeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: '#3A6BFF',
            lineWidth: 2,
            title: '50 EMA'
        });

        // Add EMA 200
        ema200SeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: '#F59E0B',
            lineWidth: 2,
            title: '200 EMA'
        });

        // Add Volume
        volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '', // set as an overlay by setting a blank priceScaleId
            scaleMargins: {
                top: 0.8, // highest point of the series will be at 80% of chart
                bottom: 0,
            },
        });

        // Resize handler
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            const newRect = entries[0].contentRect;
            if (chartRef.current && newRect.width > 0) {
                chartRef.current.applyOptions({ width: newRect.width });
            }
        });

        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []);

    // Update data
    useEffect(() => {
        if (data && data.length > 0 && candleSeriesRef.current) {
            try {
                const parseTime = (t) => {
                    if (typeof t === 'string' && t.includes(':')) {
                        // Return unit timestamp in seconds for lightweight-charts
                        return Math.floor(new Date(t.replace(' ', 'T') + '+05:30').getTime() / 1000);
                    }
                    return t;
                };
                
                const uniqueData = {};
                data.forEach(d => {
                    uniqueData[d.time] = d; 
                });
                
                const sortedData = Object.values(uniqueData).map(d => ({
                    ...d,
                    parsedTime: parseTime(d.time)
                })).sort((a,b) => a.parsedTime - b.parsedTime);

                const formattedData = sortedData.map(d => ({
                    time: d.parsedTime,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));

                const volData = sortedData.map(d => ({
                    time: d.parsedTime,
                    value: d.volume,
                    color: d.close >= d.open ? '#10B98188' : '#EF444488'
                }));

                const e50 = sortedData.map(d => ({ time: d.parsedTime, value: d.ema50 || 0 }));
                const e200 = sortedData.map(d => ({ time: d.parsedTime, value: d.ema200 || 0 }));

                candleSeriesRef.current.setData(formattedData);
                volumeSeriesRef.current.setData(volData);
                ema50SeriesRef.current.setData(e50);
                ema200SeriesRef.current.setData(e200);
            } catch (e) {
                console.error("Error setting chart data", e);
            }
        }
    }, [data]);

    useEffect(() => {
        if (!chartRef.current) return;
        let isHandlingScroll = false;

        const handleVisibleLogicalRangeChange = (newVisibleLogicalRange) => {
            if (!newVisibleLogicalRange) return;
            if (isHandlingScroll) return;

            // If the user scrolled to the beginning of the local data
            if (newVisibleLogicalRange.from <= 10 && onLoadMore) {
                isHandlingScroll = true;
                onLoadMore().finally(() => {
                    setTimeout(() => { isHandlingScroll = false; }, 500);
                });
            }
        };

        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

        return () => {
            if (chartRef.current) {
                chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
            }
        };
    }, [onLoadMore]);

    return (
        <div className="glass-pane area-chart" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header flex-row justify-between" style={{ alignItems: 'center' }}>
                <div className="font-bold" style={{ color: '#fff', fontSize: '1.1rem' }}>| NIFTY 50 - Technical Analysis</div>
                <div className="flex-row gap-sm">
                    {['1m', '5m', '15m', '1D', '1W', '1M'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => handleTimeframeChange(tf)}
                            style={{
                                padding: '4px 12px',
                                background: activeTimeframe === tf ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                                border: '1px solid ' + (activeTimeframe === tf ? 'var(--accent-blue)' : 'var(--border-light)'),
                                color: '#fff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={chartContainerRef} style={{ flexGrow: 1, marginTop: '16px', position: 'relative', minHeight: '400px', width: '100%' }} />

            {/* Footer / Info ribbon inside chart like reference */}
            <div className="flex-row justify-between glass-pane" style={{ padding: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.02)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <div className="flex-row gap-sm text-sm" style={{ color: '#60A5FA', fontWeight: 600 }}>
                    <span>v AI Insights: Bullish Breakout Signal</span>
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>Volume</div>
            </div>
            <div className="text-sm" style={{ padding: '0 12px 12px 12px', color: 'var(--bullish)' }}>✔ Breakout Detected - Potential Upside Ahead</div>
        </div>
    );
};

export default MainChart;
