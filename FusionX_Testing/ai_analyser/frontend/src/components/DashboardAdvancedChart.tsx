import { useState, useEffect, useRef } from 'react';
import { getStock } from '../services/api';
import {
  createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries, LineStyle
} from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, Eye, Sliders, Layers, Target, ChevronRight
} from 'lucide-react';
import SearchBar from './SearchBar';

const QUICK_STOCKS = ['NABIL', 'NICA', 'HBL', 'UPPER', 'CHCL', 'NTC', 'GBIME', 'CIT'];

const PERIOD_OPTIONS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
  { label: 'MAX', days: 9999 },
];

export default function DashboardAdvancedChart({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [symbol, setSymbol] = useState('NABIL');
  const [period, setPeriod] = useState(365);
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Overlay Feature Toggles (NepseAlpha style)
  const [showHighLowLines, setShowHighLowLines] = useState(true);
  const [showSRLines, setShowSRLines] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getStock(symbol, period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol, period]);

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#1E293B' : '#F1F5F9';
    const bgColor = isDark ? '#0F172A' : '#FFFFFF';

    const chartHeight = showVolume ? 360 : 400;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
    });

    // ── Main Series Selection (Candle / Line / Area) ──────────────────
    let mainSeries: any = null;

    if (chartType === 'candle') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      mainSeries.setData(data.ohlcv);
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#0284C7',
        lineWidth: 2,
      });
      mainSeries.setData(data.ohlcv.map((d: any) => ({ time: d.time, value: d.close })));
    } else {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(2, 132, 199, 0.4)',
        bottomColor: 'rgba(2, 132, 199, 0.0)',
        lineColor: '#0284C7',
        lineWidth: 2,
      });
      mainSeries.setData(data.ohlcv.map((d: any) => ({ time: d.time, value: d.close })));
    }

    // ── Technical EMAs ──────────────────────────────────────────────
    if (showEMA && data.indicators) {
      if (data.indicators.ema21?.length) {
        const ema21 = chart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, title: 'EMA21' });
        ema21.setData(data.indicators.ema21);
      }
      if (data.indicators.ema50?.length) {
        const ema50 = chart.addSeries(LineSeries, { color: '#8B5CF6', lineWidth: 2, title: 'EMA50' });
        ema50.setData(data.indicators.ema50);
      }
      if (data.indicators.ema200?.length) {
        const ema200 = chart.addSeries(LineSeries, { color: '#EC4899', lineWidth: 2, title: 'EMA200' });
        ema200.setData(data.indicators.ema200);
      }
    }

    // ── Bollinger Bands ─────────────────────────────────────────────
    if (showBB && data.indicators?.bb_upper?.length) {
      const bbU = chart.addSeries(LineSeries, { color: 'rgba(2, 132, 199, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      bbU.setData(data.indicators.bb_upper);
      const bbL = chart.addSeries(LineSeries, { color: 'rgba(2, 132, 199, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      bbL.setData(data.indicators.bb_lower);
    }

    // ── Volume Histogram ────────────────────────────────────────────
    if (showVolume && data.ohlcv?.length) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#3B82F6',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.ohlcv.map((d: any) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }))
      );
    }

    // ── NepseAlpha Style High/Low & Support/Resistance Lines ─────────
    const ohlcv = data.ohlcv || [];
    if (ohlcv.length > 0) {
      const highs = ohlcv.map((d: any) => d.high);
      const lows = ohlcv.map((d: any) => d.low);
      const maxHigh = Math.max(...highs);
      const minLow = Math.min(...lows);
      const ltp = data.analysis?.ltp ?? ohlcv[ohlcv.length - 1].close;

      if (showHighLowLines && mainSeries) {
        // High Line
        mainSeries.createPriceLine({
          price: maxHigh,
          color: '#10B981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Highest High: Rs ${maxHigh.toFixed(2)}`,
        });

        // Low Line
        mainSeries.createPriceLine({
          price: minLow,
          color: '#EF4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Lowest Low: Rs ${minLow.toFixed(2)}`,
        });
      }

      if (showSRLines && mainSeries && data.analysis) {
        const support = data.analysis.support ?? ltp * 0.95;
        const resistance = data.analysis.resistance ?? ltp * 1.1;

        // Support Line
        mainSeries.createPriceLine({
          price: support,
          color: '#0284C7',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Support: Rs ${support.toFixed(2)}`,
        });

        // Resistance Line
        mainSeries.createPriceLine({
          price: resistance,
          color: '#F59E0B',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Resistance: Rs ${resistance.toFixed(2)}`,
        });
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, chartType, showHighLowLines, showSRLines, showEMA, showBB, showVolume]);

  const a = data?.analysis;
  const highs = data?.ohlcv?.map((d: any) => d.high) || [];
  const lows = data?.ohlcv?.map((d: any) => d.low) || [];
  const maxHigh = highs.length ? Math.max(...highs) : 0;
  const minLow = lows.length ? Math.min(...lows) : 0;

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Top Header: Controls & Stock Details ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Stock Search Input */}
          <div style={{ width: 220 }}>
            <SearchBar onSelect={s => setSymbol(s)} />
          </div>

          {/* Quick Select Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600 }}>Popular:</span>
            {QUICK_STOCKS.map(s => (
              <button
                key={s}
                className={`btn btn-sm ${symbol === s ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: 11.5, borderRadius: 16 }}
                onClick={() => setSymbol(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Action button to open full stock page */}
        <button className="btn btn-secondary btn-sm" onClick={() => onSelect(symbol)}>
          <Eye size={13} /> Open Full Stock Detail <ChevronRight size={13} />
        </button>
      </div>

      {/* ── Stock Title & Price Banner ── */}
      {data && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', padding: '12px 18px', borderRadius: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 20, fontWeight: 900, color: 'var(--blue)' }}>{symbol}</span>
                <span className={`chip ${(a?.change_pct ?? 0) >= 0 ? 'chip-buy' : 'chip-sell'}`}>
                  {(a?.change_pct ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {(a?.change_pct ?? 0) >= 0 ? '+' : ''}{a?.change_pct?.toFixed(2)}%
                </span>
                {data.sector && <span className="chip chip-sector">{data.sector}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{data.name || symbol}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>LTP</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>Rs {a?.ltp?.toFixed(2) ?? '--'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Period High</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>Rs {maxHigh.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Period Low</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>Rs {minLow.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>AI Score</div>
              <span className={`chip ${a?.score >= 70 ? 'chip-buy' : a?.score >= 50 ? 'chip-watch' : 'chip-sell'}`} style={{ fontWeight: 800 }}>
                {a?.score ?? '--'} / 100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar: Chart Types, Timeframe, NepseAlpha High/Low Line Toggles ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {/* Left: Chart Type & Indicators */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Chart Type Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 8, padding: 2 }}>
            <button
              className={`btn btn-sm ${chartType === 'candle' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11.5 }}
              onClick={() => setChartType('candle')}
            >
              🕯️ Candles
            </button>
            <button
              className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11.5 }}
              onClick={() => setChartType('line')}
            >
              📈 Line
            </button>
            <button
              className={`btn btn-sm ${chartType === 'area' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11.5 }}
              onClick={() => setChartType('area')}
            >
              🏔️ Area
            </button>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

          {/* NepseAlpha Feature Toggles */}
          <button
            className={`btn btn-sm ${showHighLowLines ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
            onClick={() => setShowHighLowLines(!showHighLowLines)}
            title="Toggle High/Low horizontal price lines on chart"
          >
            <Sliders size={12} /> High / Low Lines
          </button>
          <button
            className={`btn btn-sm ${showSRLines ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
            onClick={() => setShowSRLines(!showSRLines)}
            title="Toggle Support & Resistance target lines"
          >
            <Target size={12} /> Support / Resistance
          </button>
          <button
            className={`btn btn-sm ${showEMA ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
            onClick={() => setShowEMA(!showEMA)}
          >
            <Layers size={12} /> EMAs (21/50/200)
          </button>
          <button
            className={`btn btn-sm ${showBB ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
            onClick={() => setShowBB(!showBB)}
          >
            BB
          </button>
          <button
            className={`btn btn-sm ${showVolume ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: 11.5 }}
            onClick={() => setShowVolume(!showVolume)}
          >
            Volume
          </button>
        </div>

        {/* Right: Period Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', borderRadius: 8, padding: 2 }}>
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p.label}
              className={`btn btn-sm ${period === p.days ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11.5 }}
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart Container ── */}
      <div style={{ position: 'relative', width: '100%', minHeight: 360 }}>
        {loading && (
          <div className="loader-wrap" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <div className="spinner" />
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading NEPSE Chart Data…</div>
          </div>
        )}
        <div ref={chartContainerRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
