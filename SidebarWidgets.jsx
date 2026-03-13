import React from 'react';
import { CheckCircle2, ChevronUp } from 'lucide-react';

export const AiSignalsWidget = ({ reasons, isMarketOpen }) => {
    return (
        <div className="glass-pane" style={{ padding: '16px', flex: 1 }}>
            <div className="card-header font-bold" style={{ color: '#fff', fontSize: '1rem' }}>
                {isMarketOpen === false ? 'Next Session Forecast' : 'Next Close Forecast'}
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: '16px' }}>
                {reasons && reasons.map((r, i) => (
                    <div key={i} className="flex-row gap-sm glass-pane" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}>
                        <CheckCircle2 size={16} className="text-green" />
                        <span className="text-sm">{r}</span>
                        <CheckCircle2 size={16} className="text-green" style={{ marginLeft: 'auto', opacity: 0.8 }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PatternDetectionWidget = ({ patterns }) => {
    // Patterns is now an object: { pattern: "Name", confidence: 0.xx }
    // We default to "No Active Pattern" if nothing passed
    const topPattern = patterns && patterns.pattern ? patterns.pattern : 'No Active Pattern';
    const confidenceLabel = patterns && patterns.confidence ? ` ${(patterns.confidence * 100).toFixed(0)}% Match` : '';

    return (
        <div className="glass-pane" style={{ padding: '16px', flex: 1.2 }}>
            <div className="card-header font-bold" style={{ color: '#fff', fontSize: '1rem' }}>Pattern Detection</div>
            <div className="glass-pane" style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ marginBottom: '12px' }}>
                    <span className={topPattern !== 'No Active Pattern' ? 'text-green font-bold' : 'text-muted'}>{topPattern}</span>
                    <span className="text-xs text-muted block" style={{ marginTop: '4px' }}>{confidenceLabel}</span>
                </div>
                {/* Simple SVG mimicking ascending triangle */}
                <svg width="100%" height="60" viewBox="0 0 200 60">
                    <line x1="20" y1="10" x2="180" y2="10" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
                    <line x1="20" y1="50" x2="180" y2="10" stroke="#F59E0B" strokeWidth="2" />

                    {/* simple candles indicating uptrend into resistance */}
                    <rect x="30" y="30" width="4" height="15" fill="#10B981" />
                    <rect x="50" y="25" width="4" height="20" fill="#EF4444" />
                    <rect x="70" y="20" width="4" height="20" fill="#10B981" />
                    <rect x="90" y="15" width="4" height="15" fill="#10B981" />

                    <circle cx="180" cy="10" r="4" fill="#F59E0B" />
                </svg>
            </div>
        </div>
    );
};

export const SentimentWidget = ({ sentiment }) => {
    if (!sentiment) return null;
    return (
        <div className="glass-pane" style={{ padding: '16px', flex: 0.8 }}>
            <div className="card-header font-bold" style={{ color: '#fff', fontSize: '1rem' }}>Sentiment Analysis</div>
            <div className="flex-row justify-between text-sm" style={{ marginTop: '16px', marginBottom: '8px' }}>
                <span>Market Sentiment: <span className={sentiment.positive_pct >= 50 ? "text-green font-bold" : "text-red font-bold"}>{sentiment.positive_pct}% Positive</span></span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${sentiment.positive_pct}%`, height: '100%', background: sentiment.positive_pct >= 50 ? 'var(--bullish)' : 'var(--bearish)' }}></div>
            </div>

            <div style={{ marginTop: '16px' }} className="text-xs text-muted">Latest Market News</div>
            
            <div className="flex-col gap-sm" style={{ marginTop: '8px' }}>
                {sentiment.news && sentiment.news.length > 0 ? (
                    sentiment.news.map((item, idx) => (
                        <div key={idx} className="text-xs glass-pane" style={{ padding: '8px', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="flex-row gap-sm" style={{ alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#e2e8f0', marginBottom: '4px', lineHeight: '1.4' }}>
                                        {item.title}
                                    </div>
                                    <div className="flex-row justify-between text-muted" style={{ fontSize: '0.65rem' }}>
                                        {item.publisher && <span>{item.publisher}</span>}
                                        {item.time && <span>{new Date((item.time || 0) * 1000).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-muted text-center">Market news currently unavailable</div>
                )}
            </div>
        </div>
    );
};
