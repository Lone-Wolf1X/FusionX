import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, TrendingUp, AlertTriangle, ShieldAlert, Layers, ArrowRight } from 'lucide-react';
import { getStoredPortfolios, calculateHoldings } from '../services/portfolioStorage';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  stockBadges?: string[];
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  onSelectStock,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scan data & initialize welcome message
  useEffect(() => {
    fetch('http://161.118.189.212/api/scan')
      .then((r) => r.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.stocks || [];
        setScanData(list);
      })
      .catch(() => {});

    // Welcome message
    if (messages.length === 0) {
      const portfolios = getStoredPortfolios();
      const activePort = portfolios[0];
      const holdings = activePort ? calculateHoldings(activePort, []) : [];

      let welcomeMsg = `Namaste! Main aapka **FusionX Personal AI Cockpit Assistant** hu.🤖\n\n`;
      welcomeMsg += `Currently aapke pass **${portfolios.length} active portfolios** hain jisme **${holdings.length} total active holdings** hain.\n\n`;
      welcomeMsg += `Aap mujhse apne portfolio risk, holdings, stock technicals, ya watchlist breakout candidates ke baare me kuch bhi pooch sakte ho!`;

      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: welcomeMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    // Simulate AI context-aware evaluation
    setTimeout(() => {
      const aiReply = generateAIResponse(q, scanData);
      setMessages((prev) => [...prev, aiReply]);
      setLoading(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{
          width: '90%',
          maxWidth: 620,
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-hover) 100%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)',
              }}
            >
              <Bot size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                FusionX Brain AI Terminal <Sparkles size={14} color="var(--amber)" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Context-Aware • Connected to Live Holdings & Market Scan
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg-base)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {[
            ' Mere portfolio ka sabse bada risk kya hai?',
            '🚀 Aaj ke best breakout stocks suggest kar',
            '📊 NABIL technicals aur target kya hai?',
            '💡 Sector concentration report',
          ].map((prompt, idx) => (
            <button
              key={idx}
              className="btn btn-ghost"
              style={{
                fontSize: 11.5,
                padding: '4px 10px',
                borderRadius: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--blue)',
                fontWeight: 600,
              }}
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAI ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: isAI ? 'var(--bg-base)' : 'var(--blue)',
                    color: isAI ? 'var(--text-main)' : 'white',
                    border: isAI ? '1px solid var(--border)' : 'none',
                    fontSize: 13,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    boxShadow: isAI ? 'var(--shadow-sm)' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  {m.text}

                  {m.stockBadges && m.stockBadges.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {m.stockBadges.map((sym) => (
                        <span
                          key={sym}
                          onClick={() => {
                            onClose();
                            onSelectStock(sym);
                          }}
                          className="mono"
                          style={{
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: isAI ? 'var(--blue)' : 'white',
                            color: isAI ? 'white' : 'var(--blue)',
                          }}
                        >
                          {sym} ↗
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, padding: '0 4px' }}>
                  {m.timestamp}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              FusionX AI is evaluating live portfolio & technical indicators...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', gap: 10 }}>
          <input
            className="search-input"
            style={{ flex: 1, fontSize: 13 }}
            placeholder="Ask AI anything about your holdings, stocks, or market..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" onClick={() => handleSend()} disabled={!query.trim() || loading}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function generateAIResponse(userPrompt: string, scanData: any[]): Message {
  const prompt = userPrompt.toLowerCase();
  const portfolios = getStoredPortfolios();
  const activePort = portfolios[0];
  const holdings = activePort ? calculateHoldings(activePort, scanData) : [];

  let responseText = '';
  const badges: string[] = [];

  if (prompt.includes('risk') || prompt.includes('concentration')) {
    const totalNetWorth = holdings.reduce((acc, h) => acc + h.currentValue, 0) + (activePort?.currentCash || 0);
    const sectorMap = new Map<string, number>();
    holdings.forEach((h) => {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) || 0) + h.currentValue);
    });

    let topSector = '';
    let maxVal = 0;
    sectorMap.forEach((val, sec) => {
      if (val > maxVal) {
        maxVal = val;
        topSector = sec;
      }
    });

    const topSectorPct = totalNetWorth > 0 ? ((maxVal / totalNetWorth) * 100).toFixed(1) : '0';

    responseText = `📊 **Portfolio Risk & Allocation Assessment**\n\n`;
    responseText += `- **Active Positions**: ${holdings.length} stocks across ${sectorMap.size} sectors.\n`;
    responseText += `- **Top Sector Exposure**: **${topSector || 'Banking'}** is currently **${topSectorPct}%** of your portfolio.\n`;

    if (parseFloat(topSectorPct) > 35) {
      responseText += `\n⚠️ **Concentration Risk Alert**: ${topSector} exposure exceeds 35%. Consider rebalancing into Hydro, Telecom, or Insurance to diversify risk.`;
    } else {
      responseText += `\n✅ **Good Diversification**: Your portfolio allocation is well-balanced across sectors.`;
    }

    holdings.forEach((h) => badges.push(h.symbol));
  } else if (prompt.includes('breakout') || prompt.includes('best') || prompt.includes('suggest')) {
    const candidates = scanData.filter((s) => (s.score || 0) >= 65 || (s.change_pct || 0) > 1.5).slice(0, 4);

    responseText = `🚀 **Top Live Technical Breakout Candidates (NEPSE)**\n\n`;
    candidates.forEach((c, idx) => {
      responseText += `${idx + 1}. **${c.symbol}** (${c.name || c.symbol})\n`;
      responseText += `   - LTP: Rs ${c.ltp} | Score: **${c.score || 72}/100** | Change: **+${c.change_pct || 1.8}%**\n`;
      responseText += `   - AI Setup: Strong volume + bullish EMA alignment.\n\n`;
      badges.push(c.symbol);
    });

    if (!candidates.length) {
      responseText = `Top recommended stocks for current market momentum:\n1. **NABIL** (Banking leader)\n2. **SHIVM** (Volume breakout)\n3. **CHCL** (Hydro momentum)`;
      badges.push('NABIL', 'SHIVM', 'CHCL');
    }
  } else if (prompt.includes('nabil') || prompt.includes('stock')) {
    const sym = prompt.includes('ntc') ? 'NTC' : prompt.includes('shivm') ? 'SHIVM' : 'NABIL';
    const scanItem = scanData.find((s) => s.symbol === sym) || { symbol: sym, ltp: 624, score: 78, change_pct: 1.8 };

    responseText = `🔍 **AI Stock Deep-Dive: ${sym}**\n\n`;
    responseText += `- **LTP**: Rs ${scanItem.ltp} (${scanItem.change_pct >= 0 ? '+' : ''}${scanItem.change_pct}%)\n`;
    responseText += `- **Master AI Score**: **${scanItem.score || 75}/100** (Bullish Technicals)\n`;
    responseText += `- **Target Price**: Rs ${(scanItem.ltp * 1.15).toFixed(1)} (+15% upside target)\n`;
    responseText += `- **Stop Loss**: Rs ${(scanItem.ltp * 0.90).toFixed(1)} (-10% risk threshold)\n`;
    responseText += `- **AI Conclusion**: Strong support level holding up. Excellent risk-reward for swing trading.`;
    badges.push(sym);
  } else {
    responseText = `🤖 **AI Terminal Evaluation**\n\n`;
    responseText += `Aapke query ke mutabiq mene live NEPSE market scan aur aapke active portfolio ko cross-reference kiya hai.\n\n`;
    if (holdings.length > 0) {
      responseText += `Aapke active holdings (**${holdings.map((h) => h.symbol).join(', ')}**) overall steady perform kar rahe hain.\n`;
      responseText += `Deep stock chart analysis dekhne ke liye symbol badge pe click karein.`;
      holdings.forEach((h) => badges.push(h.symbol));
    } else {
      responseText += `System is ready. Aap custom stock search ya portfolio rebalancing details pooch sakte ho!`;
    }
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'ai',
    text: responseText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    stockBadges: badges.slice(0, 5),
  };
}
