import { useState, useEffect, useRef } from 'react';
import { getStock } from '../services/api';
import {
  createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, BarSeries, HistogramSeries, LineStyle, CrosshairMode
} from 'lightweight-charts';
import {
  TrendingUp, TrendingDown, Eye, Sliders, Maximize2, Minimize2, RefreshCw, Layers, Target, ChevronRight,
  MousePointer, Minus, ArrowUpRight, Square, ArrowRight, Pencil, RotateCcw, RotateCw, Trash2, Activity, BarChart2
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

export type ChartType = 'candle' | 'bar' | 'line' | 'area' | 'heikin_ashi';

export type DrawingTool =
  | 'select'
  | 'trendline'
  | 'horizontal'
  | 'vertical'
  | 'ray'
  | 'rectangle'
  | 'arrow'
  | 'fibonacci'
  | 'measure'
  | 'freehand';

interface Drawing {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
}

function computeHeikinAshi(ohlcv: any[]) {
  if (!ohlcv || !ohlcv.length) return [];
  const haData: any[] = [];
  let prevOpen = ohlcv[0].open;
  let prevClose = ohlcv[0].close;

  for (let i = 0; i < ohlcv.length; i++) {
    const curr = ohlcv[i];
    const haClose = (curr.open + curr.high + curr.low + curr.close) / 4;
    const haOpen = i === 0 ? (curr.open + curr.close) / 2 : (prevOpen + prevClose) / 2;
    const haHigh = Math.max(curr.high, haOpen, haClose);
    const haLow = Math.min(curr.low, haOpen, haClose);

    haData.push({
      time: curr.time,
      open: Number(haOpen.toFixed(2)),
      high: Number(haHigh.toFixed(2)),
      low: Number(haLow.toFixed(2)),
      close: Number(haClose.toFixed(2)),
    });

    prevOpen = haOpen;
    prevClose = haClose;
  }
  return haData;
}

function computeSMA(data: any[], period: number) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, item) => sum + item.close, 0) / period;
    result.push({ time: data[i].time, value: Number(avg.toFixed(2)) });
  }
  return result;
}

export default function ProTradingViewChart({
  initialSymbol = 'NABIL',
  onSelect,
}: {
  initialSymbol?: string;
  onSelect: (symbol: string) => void;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [period, setPeriod] = useState(9999);
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Indicators
  const [showEMA, setShowEMA] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  // Price Lines (NepseAlpha style)
  const [showHighLowLines, setShowHighLowLines] = useState(true);
  const [showSRLines, setShowSRLines] = useState(true);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [undoStack, setUndoStack] = useState<Drawing[][]>([]);
  const [redoStack, setRedoStack] = useState<Drawing[][]>([]);
  const [drawingColor, setDrawingColor] = useState('#0284C7');
  const [currentDraft, setCurrentDraft] = useState<Drawing | null>(null);

  // Hover Crosshair Info State
  const [hoverInfo, setHoverInfo] = useState<{
    date?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
  } | null>(null);

  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);

  // Sync initialSymbol if changed
  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    setLoading(true);
    getStock(symbol, period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol, period]);

  // Main Chart Rendering
  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';
    if (rsiContainerRef.current) rsiContainerRef.current.innerHTML = '';
    if (macdContainerRef.current) macdContainerRef.current.innerHTML = '';

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#1E293B' : '#F1F5F9';
    const bgColor = isDark ? '#0F172A' : '#FFFFFF';

    const mainChartHeight = isFullscreen ? 680 : 540;

    const chartOptions = {
      width: chartContainerRef.current.clientWidth,
      height: mainChartHeight,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);

    let mainSeries: any = null;
    const ohlcv = data.ohlcv || [];

    // Series Generation
    if (chartType === 'candle') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      mainSeries.setData(ohlcv);
    } else if (chartType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
      });
      mainSeries.setData(ohlcv);
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#0284C7',
        lineWidth: 2,
      });
      mainSeries.setData(ohlcv.map((d: any) => ({ time: d.time, value: d.close })));
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(2, 132, 199, 0.4)',
        bottomColor: 'rgba(2, 132, 199, 0.02)',
        lineColor: '#0284C7',
        lineWidth: 2,
      });
      mainSeries.setData(ohlcv.map((d: any) => ({ time: d.time, value: d.close })));
    } else if (chartType === 'heikin_ashi') {
      const haData = computeHeikinAshi(ohlcv);
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      mainSeries.setData(haData);
    }

    // Technical EMAs
    if (showEMA && data.indicators) {
      if (data.indicators.ema9?.length) {
        const ema9 = chart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, title: 'EMA9' });
        ema9.setData(data.indicators.ema9);
      }
      if (data.indicators.ema21?.length) {
        const ema21 = chart.addSeries(LineSeries, { color: '#06B6D4', lineWidth: 1, title: 'EMA21' });
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

    // Technical SMAs
    if (showSMA && ohlcv.length) {
      const sma20Data = computeSMA(ohlcv, 20);
      const sma50Data = computeSMA(ohlcv, 50);
      if (sma20Data.length) {
        const sma20 = chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 1, title: 'SMA20' });
        sma20.setData(sma20Data);
      }
      if (sma50Data.length) {
        const sma50 = chart.addSeries(LineSeries, { color: '#10B981', lineWidth: 2, title: 'SMA50' });
        sma50.setData(sma50Data);
      }
    }

    // Bollinger Bands
    if (showBB && data.indicators?.bb_upper?.length) {
      const bbU = chart.addSeries(LineSeries, { color: 'rgba(2, 132, 199, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      bbU.setData(data.indicators.bb_upper);
      const bbL = chart.addSeries(LineSeries, { color: 'rgba(2, 132, 199, 0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed });
      bbL.setData(data.indicators.bb_lower);
    }

    // Volume Histogram
    if (showVolume && ohlcv.length) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#3B82F6',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
      });
      volumeSeries.setData(
        ohlcv.map((d: any) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }))
      );
    }

    // Price Overlay Lines (High/Low and Support/Resistance)
    if (ohlcv.length > 0 && mainSeries) {
      const highs = ohlcv.map((d: any) => d.high);
      const lows = ohlcv.map((d: any) => d.low);
      const maxHigh = Math.max(...highs);
      const minLow = Math.min(...lows);
      const ltp = data.analysis?.ltp ?? ohlcv[ohlcv.length - 1].close;

      if (showHighLowLines) {
        mainSeries.createPriceLine({
          price: maxHigh,
          color: '#10B981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `52W High: Rs ${maxHigh.toFixed(2)}`,
        });
        mainSeries.createPriceLine({
          price: minLow,
          color: '#EF4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `52W Low: Rs ${minLow.toFixed(2)}`,
        });
      }

      if (showSRLines && data.analysis) {
        const support = data.analysis.support ?? ltp * 0.95;
        const resistance = data.analysis.resistance ?? ltp * 1.1;

        mainSeries.createPriceLine({
          price: support,
          color: '#0284C7',
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Support: Rs ${support.toFixed(2)}`,
        });
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

    // Crosshair Movement Handler for TradingView Bar Info
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.get(mainSeries)) {
        const d: any = param.seriesData.get(mainSeries);
        const ohlcMatch = ohlcv.find((item: any) => item.time === param.time);
        const open = d.open ?? ohlcMatch?.open ?? d.value;
        const high = d.high ?? ohlcMatch?.high ?? d.value;
        const low = d.low ?? ohlcMatch?.low ?? d.value;
        const close = d.close ?? ohlcMatch?.close ?? d.value;
        const change = open ? ((close - open) / open) * 100 : 0;

        setHoverInfo({
          date: String(param.time),
          open,
          high,
          low,
          close,
          volume: ohlcMatch?.volume ?? 0,
          change,
        });
      }
    });

    chart.timeScale().fitContent();

    // RSI Sub-chart Panel
    if (showRSI && rsiContainerRef.current && data.indicators?.rsi?.length) {
      const rsiChart = createChart(rsiContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 120,
        layout: { background: { type: ColorType.Solid, color: bgColor }, textColor },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        timeScale: { visible: false },
      });
      const rsiLine = rsiChart.addSeries(LineSeries, { color: '#D97706', lineWidth: 2 });
      rsiLine.setData(data.indicators.rsi);
      const ob = rsiChart.addSeries(LineSeries, { color: '#DC2626', lineWidth: 1, lineStyle: LineStyle.Dashed });
      ob.setData(data.indicators.rsi.map((d: any) => ({ time: d.time, value: 70 })));
      const os = rsiChart.addSeries(LineSeries, { color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dashed });
      os.setData(data.indicators.rsi.map((d: any) => ({ time: d.time, value: 30 })));
      rsiChart.timeScale().fitContent();
    }

    // MACD Sub-chart Panel
    if (showMACD && macdContainerRef.current && data.indicators?.macd?.length) {
      const macdChart = createChart(macdContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 120,
        layout: { background: { type: ColorType.Solid, color: bgColor }, textColor },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        timeScale: { visible: false },
      });
      const macdLine = macdChart.addSeries(LineSeries, { color: '#0284C7', lineWidth: 1.5 });
      macdLine.setData(data.indicators.macd.map((d: any) => ({ time: d.time, value: d.macd })));
      const sigLine = macdChart.addSeries(LineSeries, { color: '#DC2626', lineWidth: 1 });
      sigLine.setData(data.indicators.macd.map((d: any) => ({ time: d.time, value: d.signal })));
      const hist = macdChart.addSeries(HistogramSeries, { priceFormat: { type: 'price' } });
      hist.setData(
        data.indicators.macd.map((d: any) => ({
          time: d.time,
          value: d.histogram,
          color: d.histogram >= 0 ? '#10B981' : '#DC2626',
        }))
      );
      macdChart.timeScale().fitContent();
    }

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
  }, [
    data,
    chartType,
    showEMA,
    showSMA,
    showBB,
    showVolume,
    showHighLowLines,
    showSRLines,
    showRSI,
    showMACD,
    isFullscreen,
  ]);

  // Drawing Handlers
  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select') return;
    const rect = svgOverlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'horizontal' || activeTool === 'vertical') {
      const newDrawing: Drawing = {
        id: String(Date.now()),
        tool: activeTool,
        points: [{ x, y }],
        color: drawingColor,
      };
      saveDrawings([...drawings, newDrawing]);
      setActiveTool('select');
      return;
    }

    setCurrentDraft({
      id: String(Date.now()),
      tool: activeTool,
      points: [{ x, y }],
      color: drawingColor,
    });
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!currentDraft) return;
    const rect = svgOverlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentDraft.tool === 'freehand') {
      setCurrentDraft({
        ...currentDraft,
        points: [...currentDraft.points, { x, y }],
      });
    } else {
      setCurrentDraft({
        ...currentDraft,
        points: [currentDraft.points[0], { x, y }],
      });
    }
  };

  const handleSVGMouseUp = () => {
    if (!currentDraft) return;
    saveDrawings([...drawings, currentDraft]);
    setCurrentDraft(null);
    if (activeTool !== 'freehand') setActiveTool('select');
  };

  const saveDrawings = (next: Drawing[]) => {
    setUndoStack([...undoStack, drawings]);
    setRedoStack([]);
    setDrawings(next);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack([...redoStack, drawings]);
    setDrawings(prev);
    setUndoStack(undoStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack([...undoStack, drawings]);
    setDrawings(next);
    setRedoStack(redoStack.slice(0, -1));
  };

  const handleClearDrawings = () => {
    if (!drawings.length) return;
    saveDrawings([]);
  };

  const a = data?.analysis;
  const ohlcv = data?.ohlcv || [];
  const highs = ohlcv.map((d: any) => d.high);
  const lows = ohlcv.map((d: any) => d.low);
  const maxHigh = highs.length ? Math.max(...highs) : 0;
  const minLow = lows.length ? Math.min(...lows) : 0;
  const latestClose = ohlcv.length ? ohlcv[ohlcv.length - 1].close : 0;

  return (
    <div
      ref={chartWrapperRef}
      className={`card ${isFullscreen ? 'fullscreen-chart-modal' : ''}`}
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 1,
        background: 'var(--bg-card)',
        borderRadius: isFullscreen ? 0 : 16,
      }}
    >
      {/* ── Top Bar: Search, Quick Stock Tags, Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 220 }}>
            <SearchBar onSelect={(s) => setSymbol(s)} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600 }}>Hot:</span>
            {QUICK_STOCKS.map((s) => (
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'TradingView Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onSelect(symbol)}>
            <Eye size={13} /> Full Detail <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── TradingView Bar Info Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--bg-base)',
          padding: '10px 16px',
          borderRadius: 10,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 19, fontWeight: 900, color: 'var(--blue)' }}>
                {symbol}
              </span>
              <span className={`chip ${(a?.change_pct ?? 0) >= 0 ? 'chip-buy' : 'chip-sell'}`}>
                {(a?.change_pct ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {(a?.change_pct ?? 0) >= 0 ? '+' : ''}
                {a?.change_pct?.toFixed(2)}%
              </span>
              {data?.sector && <span className="chip chip-sector">{data.sector}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{data?.name || symbol}</div>
          </div>
        </div>

        {/* Live Hover Crosshair Bar Info */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, flexWrap: 'wrap' }}>
          {hoverInfo ? (
            <>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>O </span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {hoverInfo.open?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>H </span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                  {hoverInfo.high?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>L </span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--red)' }}>
                  {hoverInfo.low?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>C </span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--blue)' }}>
                  {hoverInfo.close?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>Vol </span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {hoverInfo.volume?.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>LTP </span>
                <span className="mono" style={{ fontWeight: 800, fontSize: 16 }}>
                  Rs {latestClose?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>52W High </span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                  Rs {maxHigh?.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>52W Low </span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--red)' }}>
                  Rs {minLow?.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Secondary Controls: Chart Types, Indicators, NepseAlpha Overlay Toggles ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Chart Style Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 8, padding: 2 }}>
            {[
              { type: 'candle', label: '🕯️ Candle' },
              { type: 'bar', label: '📊 Bar' },
              { type: 'line', label: '📈 Line' },
              { type: 'area', label: '🏔️ Area' },
              { type: 'heikin_ashi', label: '☯️ Heikin Ashi' },
            ].map((item) => (
              <button
                key={item.type}
                className={`btn btn-sm ${chartType === item.type ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 9px', fontSize: 11.5 }}
                onClick={() => setChartType(item.type as ChartType)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

          {/* Indicator Toggles */}
          <button
            className={`btn btn-sm ${showEMA ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowEMA(!showEMA)}
          >
            EMA (9/21/50/200)
          </button>
          <button
            className={`btn btn-sm ${showSMA ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowSMA(!showSMA)}
          >
            SMA (20/50)
          </button>
          <button
            className={`btn btn-sm ${showBB ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowBB(!showBB)}
          >
            Bollinger
          </button>
          <button
            className={`btn btn-sm ${showVolume ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowVolume(!showVolume)}
          >
            Volume
          </button>
          <button
            className={`btn btn-sm ${showRSI ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowRSI(!showRSI)}
          >
            RSI Sub-chart
          </button>
          <button
            className={`btn btn-sm ${showMACD ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowMACD(!showMACD)}
          >
            MACD Sub-chart
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

          {/* NepseAlpha Overlay Price Lines */}
          <button
            className={`btn btn-sm ${showHighLowLines ? 'btn-success' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowHighLowLines(!showHighLowLines)}
          >
            High/Low Lines
          </button>
          <button
            className={`btn btn-sm ${showSRLines ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '4px 9px', fontSize: 11.5 }}
            onClick={() => setShowSRLines(!showSRLines)}
          >
            S/R Lines
          </button>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', borderRadius: 8, padding: 2 }}>
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.label}
              className={`btn btn-sm ${period === p.days ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 9px', fontSize: 11.5 }}
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Workspace: Left Drawing Toolbar + Chart Canvas Overlay ── */}
      <div style={{ display: 'flex', gap: 8, width: '100%', position: 'relative' }}>
        {/* TradingView Left Drawing Tools Panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: 'var(--bg-base)',
            padding: '8px 5px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          {[
            { tool: 'select', label: 'Select / Move', icon: MousePointer },
            { tool: 'trendline', label: 'Trendline', icon: ArrowUpRight },
            { tool: 'horizontal', label: 'Horizontal Line', icon: Minus },
            { tool: 'vertical', label: 'Vertical Line', icon: Minus },
            { tool: 'ray', label: 'Ray Line', icon: ArrowRight },
            { tool: 'rectangle', label: 'Rectangle Box', icon: Square },
            { tool: 'fibonacci', label: 'Fibonacci Retracement', icon: Activity },
            { tool: 'measure', label: 'Price Measure', icon: BarChart2 },
            { tool: 'freehand', label: 'Pencil Draw', icon: Pencil },
          ].map((item) => {
            const IconComponent = item.icon;
            const active = activeTool === item.tool;
            return (
              <button
                key={item.tool}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '7px', borderRadius: 8 }}
                onClick={() => setActiveTool(item.tool as DrawingTool)}
                title={item.label}
              >
                <IconComponent size={14} />
              </button>
            );
          })}

          <div style={{ width: 16, height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={handleUndo} title="Undo Drawing">
            <RotateCcw size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={handleRedo} title="Redo Drawing">
            <RotateCw size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '6px', color: 'var(--red)' }} onClick={handleClearDrawings} title="Clear All Drawings">
            <Trash2 size={13} />
          </button>

          {/* Color Picker */}
          <input
            type="color"
            value={drawingColor}
            onChange={(e) => setDrawingColor(e.target.value)}
            style={{ width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', marginTop: 4 }}
            title="Drawing Color"
          />
        </div>

        {/* Chart Canvas and SVG Overlay Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: isFullscreen ? 680 : 540 }}>
          {loading && (
            <div className="loader-wrap" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 20 }}>
              <div className="spinner" />
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading NEPSE Chart Data…</div>
            </div>
          )}

          {/* Lightweight Charts Render Target */}
          <div ref={chartContainerRef} style={{ width: '100%' }} />

          {/* Sub-chart Render Targets (RSI & MACD) */}
          {showRSI && <div ref={rsiContainerRef} style={{ width: '100%', marginTop: 8 }} />}
          {showMACD && <div ref={macdContainerRef} style={{ width: '100%', marginTop: 8 }} />}

          {/* Interactive SVG Drawing Layer Overlay */}
          <svg
            ref={svgOverlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: activeTool === 'select' ? 'none' : 'auto',
              cursor: activeTool === 'select' ? 'default' : 'crosshair',
              zIndex: 10,
            }}
            onMouseDown={handleSVGMouseDown}
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
          >
            {/* Render Saved Drawings */}
            {[...drawings, ...(currentDraft ? [currentDraft] : [])].map((d) => {
              if (d.points.length === 0) return null;

              if (d.tool === 'trendline' || d.tool === 'arrow' || d.tool === 'ray') {
                if (d.points.length < 2) return null;
                const p1 = d.points[0];
                const p2 = d.points[1];
                return (
                  <g key={d.id}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color} strokeWidth={2} strokeDasharray={d.tool === 'ray' ? '4 4' : undefined} />
                    <circle cx={p1.x} cy={p1.y} r={3} fill={d.color} />
                    <circle cx={p2.x} cy={p2.y} r={3} fill={d.color} />
                  </g>
                );
              }

              if (d.tool === 'horizontal') {
                const p = d.points[0];
                return (
                  <g key={d.id}>
                    <line x1={0} y1={p.y} x2="100%" y2={p.y} stroke={d.color} strokeWidth={2} strokeDasharray="5 5" />
                    <circle cx={p.x} cy={p.y} r={3} fill={d.color} />
                  </g>
                );
              }

              if (d.tool === 'vertical') {
                const p = d.points[0];
                return (
                  <g key={d.id}>
                    <line x1={p.x} y1={0} x2={p.x} y2="100%" stroke={d.color} strokeWidth={2} strokeDasharray="5 5" />
                    <circle cx={p.x} cy={p.y} r={3} fill={d.color} />
                  </g>
                );
              }

              if (d.tool === 'rectangle') {
                if (d.points.length < 2) return null;
                const p1 = d.points[0];
                const p2 = d.points[1];
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const width = Math.abs(p2.x - p1.x);
                const height = Math.abs(p2.y - p1.y);
                return (
                  <rect
                    key={d.id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={`${d.color}22`}
                    stroke={d.color}
                    strokeWidth={2}
                  />
                );
              }

              if (d.tool === 'fibonacci') {
                if (d.points.length < 2) return null;
                const p1 = d.points[0];
                const p2 = d.points[1];
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                const h = maxY - minY;

                const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
                return (
                  <g key={d.id}>
                    {levels.map((lvl) => {
                      const y = minY + h * lvl;
                      return (
                        <g key={lvl}>
                          <line x1={0} y1={y} x2="100%" y2={y} stroke={d.color} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
                          <text x={10} y={y - 3} fill={d.color} fontSize={10} fontWeight="bold">
                            {(lvl * 100).toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }

              if (d.tool === 'measure') {
                if (d.points.length < 2) return null;
                const p1 = d.points[0];
                const p2 = d.points[1];
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const width = Math.abs(p2.x - p1.x);
                const height = Math.abs(p2.y - p1.y);
                return (
                  <g key={d.id}>
                    <rect x={x} y={y} width={width} height={height} fill={`${d.color}20`} stroke={d.color} strokeWidth={1.5} strokeDasharray="4 4" />
                    <text x={x + width / 2 - 25} y={y + height / 2} fill={d.color} fontSize={11} fontWeight="bold">
                      Measure Box
                    </text>
                  </g>
                );
              }

              if (d.tool === 'freehand') {
                const pathData = d.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                return <path key={d.id} d={pathData} fill="none" stroke={d.color} strokeWidth={2} strokeLinecap="round" />;
              }

              return null;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
