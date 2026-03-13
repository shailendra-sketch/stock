import React from 'react';
import { Check, ArrowUp, Zap } from 'lucide-react';

export const AlertsWidget = ({ alerts }) => {
    return (
        <div className="glass-pane" style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
            <div className="card-header font-bold" style={{ color: '#fff', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Recent Alerts</div>
            <div className="flex-col gap-md" style={{ marginTop: '16px' }}>

                {alerts && alerts.length > 0 ? (
                    alerts.map((alert, i) => (
                        <div key={i} className="flex-row justify-between text-sm">
                            <div className="flex-row gap-sm">
                                {alert.type === 'bullish' ? <ArrowUp size={16} className="text-green" /> : alert.type === 'bearish' ? <ArrowUp size={16} className="text-red" style={{ transform: 'rotate(180deg)' }} /> : <Zap size={16} className="text-muted" />}
                                <span className={alert.type === 'bullish' ? 'text-green' : alert.type === 'bearish' ? 'text-red' : ''}>{alert.message}</span>
                            </div>
                            <div className="flex-row gap-sm text-muted">{alert.time} <Check size={14} className={alert.type === 'bullish' ? 'text-green' : alert.type === 'bearish' ? 'text-red' : 'text-muted'} /></div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-center text-muted" style={{ padding: '12px' }}>Waiting for signals...</div>
                )}

            </div>
        </div>
    );
};

export const TechnicalsWidget = ({ lastCandle }) => {
    if (!lastCandle) return null;
    const isMacdBullish = lastCandle.macd_hist > 0;
    
    // Determine RSI text based on thresholds
    let rsiText = 'Neutral';
    let rsiColor = 'text-muted';
    if (lastCandle.rsi < 30) {
         rsiText = 'Oversold';
         rsiColor = 'text-green';
    } else if (lastCandle.rsi > 70) {
         rsiText = 'Overbought';
         rsiColor = 'text-red';
    }
    
    const isStochBullish = lastCandle.stoch_k > lastCandle.stoch_d;
    
    let cciText = 'Neutral';
    let cciColor = 'text-muted';
    if (lastCandle.cci > 100) {
        cciText = 'Bullish';
        cciColor = 'text-green';
    } else if (lastCandle.cci < -100) {
        cciText = 'Bearish';
        cciColor = 'text-red';
    }

    return (
        <div className="glass-pane" style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
            <div className="card-header font-bold" style={{ color: '#fff', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Technical Indicators</div>

            <div className="flex-col gap-sm" style={{ marginTop: '16px' }}>
                <div className="flex-row gap-sm text-sm">
                    <Check size={16} className={isMacdBullish ? "text-green" : "text-red"} />
                    <span>MACD: <span className={isMacdBullish ? 'text-green' : 'text-red'}>{isMacdBullish ? 'Bullish' : 'Bearish'}</span></span>
                </div>

                <div className="flex-row gap-sm text-sm">
                    <Check size={16} className={rsiColor} />
                    <span>RSI: {Math.round(lastCandle.rsi)} <span className={rsiColor}>({rsiText})</span></span>
                </div>

                <div className="flex-row gap-sm text-sm">
                    <Check size={16} className={isStochBullish ? "text-green" : "text-red"} />
                    <span>Stochastic: <span className={isStochBullish ? 'text-green' : 'text-red'}>{isStochBullish ? 'Bullish' : 'Bearish'}</span></span>
                </div>

                <div className="flex-row gap-sm text-sm">
                    <Check size={16} className={cciColor} />
                    <span>CCI: {Math.round(lastCandle.cci)} <span className={cciColor}>({cciText})</span></span>
                </div>
            </div>
        </div>
    );
};
