import React from 'react';

const KpiCards = ({ snapshot }) => {
    if (!snapshot) return <div className="area-kpis flex-row justify-between">Loading KPIs...</div>;

    const { ltp, change, change_pct, support, resistance } = snapshot;
    const isBullish = change >= 0;

    return (
        <div className="area-kpis">
            {/* NIFTY 50 Index Card */}
            <div className="glass-pane" style={{ flex: 1.5, padding: '16px' }}>
                <div className="card-header">NIFTY 50 Index</div>
                <div className="flex-row gap-md">
                    <h2 style={{ fontSize: '2rem', margin: 0 }}>{ltp.toLocaleString('en-IN')}</h2>
                    <span className={`text-sm ${isBullish ? 'text-green' : 'text-red'}`} style={{ alignSelf: 'flex-end', paddingBottom: '6px' }}>
                        {isBullish ? '+' : ''}{change} ({isBullish ? '+' : ''}{change_pct}%)
                    </span>
                </div>
            </div>

            {/* Trend Signal Card */}
            <div className="glass-pane" style={{ flex: 1, padding: '16px' }}>
                <div className="card-header">Trend Signal</div>
                <div className="flex-row gap-sm" style={{ alignItems: 'center', height: '100%', paddingBottom: '16px' }}>
                    <span style={{ fontSize: '1.8rem', color: isBullish ? 'var(--bullish)' : 'var(--bearish)' }}>
                        {isBullish ? '↑' : '↓'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 600, color: isBullish ? 'var(--bullish)' : 'var(--bearish)' }}>
                        {isBullish ? 'Bullish' : 'Bearish'}
                    </span>
                </div>
            </div>

            {/* Support Card */}
            <div className="glass-pane" style={{ flex: 1, padding: '16px' }}>
                <div className="card-header">Key Support</div>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginTop: '8px' }}>{support.toLocaleString('en-IN')}</h2>
            </div>

            {/* Resistance Card */}
            <div className="glass-pane" style={{ flex: 1, padding: '16px' }}>
                <div className="card-header">Key Resistance</div>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginTop: '8px' }}>{resistance.toLocaleString('en-IN')}</h2>
            </div>

        </div>
    );
};

export default KpiCards;
