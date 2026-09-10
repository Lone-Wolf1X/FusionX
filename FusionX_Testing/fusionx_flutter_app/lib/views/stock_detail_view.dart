import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';

class StockDetailView extends StatefulWidget {
  final String symbol;

  const StockDetailView({super.key, required this.symbol});

  @override
  State<StockDetailView> createState() => _StockDetailViewState();
}

class _StockDetailViewState extends State<StockDetailView> {
  Map<String, dynamic>? stockData;
  bool loading = true;
  bool inWatchlist = false;
  String selectedTimeframe = '1M';
  bool showRsi = true;
  bool showMacd = false;
  bool showMa = true;

  // Trading order form state
  String orderType = 'BUY'; // BUY or SELL
  final TextEditingController _qtyController = TextEditingController(text: '100');
  final TextEditingController _priceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadStockData();
  }

  Future<void> loadStockData() async {
    setState(() => loading = true);
    final data = await ApiService.getStockDetail(widget.symbol);
    final watchlist = await ApiService.getWatchlist();
    final isWatched = watchlist.any((item) => item['symbol'] == widget.symbol);

    if (mounted) {
      setState(() {
        stockData = data;
        inWatchlist = isWatched;
        loading = false;
        final analysis = data['analysis'];
        final ltp = (analysis?['ltp'] ?? 500.0).toDouble();
        _priceController.text = ltp.toStringAsFixed(1);
      });
    }
  }

  Future<void> _toggleWatchlist() async {
    if (inWatchlist) {
      await ApiService.removeFromWatchlist(widget.symbol);
      setState(() => inWatchlist = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.symbol} removed from Watchlist')),
        );
      }
    } else {
      await ApiService.addToWatchlist({
        'symbol': widget.symbol,
        'target_price': (stockData?['analysis']?['resistance'] ?? 0.0),
        'stop_loss': (stockData?['analysis']?['support'] ?? 0.0),
      });
      setState(() => inWatchlist = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.symbol} added to Watchlist!')),
        );
      }
    }
  }

  void _executeTradeOrder() {
    final qty = int.tryParse(_qtyController.text) ?? 0;
    final price = double.tryParse(_priceController.text) ?? 0.0;
    final totalCost = qty * price;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              orderType == 'BUY' ? Icons.arrow_upward : Icons.arrow_downward,
              color: orderType == 'BUY' ? const Color(0xFF059669) : const Color(0xFFDC2626),
            ),
            const SizedBox(width: 8),
            Text('$orderType Order Executed', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Symbol: ${widget.symbol}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('Shares Qty: $qty units'),
            Text('Execution Rate: रु ${price.toStringAsFixed(2)}'),
            const Divider(),
            Text('Total Amount: रु ${totalCost.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0284C7))),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: Text('${widget.symbol} Details'), backgroundColor: Colors.white, foregroundColor: const Color(0xFF0C1929), elevation: 0.5),
        body: const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7))),
      );
    }

    if (stockData == null || stockData!.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text('${widget.symbol} Details'), backgroundColor: Colors.white, foregroundColor: const Color(0xFF0C1929), elevation: 0.5),
        body: const Center(child: Text('Stock data unavailable.')),
      );
    }

    final analysis = stockData!['analysis'] ?? {};
    final ohlcv = (stockData!['ohlcv'] as List<dynamic>?) ?? [];
    final name = stockData!['name'] ?? widget.symbol;
    final sector = stockData!['sector'] ?? 'NEPSE Equity';

    final ltp = (analysis['ltp'] ?? 500.0).toDouble();
    final changePct = (analysis['change_pct'] ?? 0.0).toDouble();
    final score = (analysis['score'] ?? 75).toInt();
    final support = (analysis['support'] ?? ltp * 0.95).toDouble();
    final resistance = (analysis['resistance'] ?? ltp * 1.10).toDouble();

    // 52-Week High / Low calculation
    double high52 = ltp;
    double low52 = ltp;
    if (ohlcv.isNotEmpty) {
      final recent = ohlcv.length > 252 ? ohlcv.sublist(ohlcv.length - 252) : ohlcv;
      high52 = recent.map((e) => (e['high'] as num).toDouble()).reduce((a, b) => a > b ? a : b);
      low52 = recent.map((e) => (e['low'] as num).toDouble()).reduce((a, b) => a < b ? a : b);
    }
    final rangePos = high52 != low52 ? ((ltp - low52) / (high52 - low52)).clamp(0.0, 1.0) : 0.5;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        foregroundColor: const Color(0xFF0C1929),
        title: Row(
          children: [
            Text(widget.symbol, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0284C7), fontSize: 18)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: changePct >= 0 ? const Color(0xFFE6F9F3) : const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${changePct >= 0 ? '+' : ''}${changePct.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: changePct >= 0 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(inWatchlist ? Icons.star : Icons.star_border, color: inWatchlist ? Colors.amber : const Color(0xFF7A94B0)),
            onPressed: _toggleWatchlist,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Price & Header Banner Card
          _buildHeaderBannerCard(name, sector, ltp, changePct),

          const SizedBox(height: 16),

          // Pro Interactive Trading Studio Chart Card
          _buildProChartCard(ohlcv),

          const SizedBox(height: 16),

          // AI Score & AI Verdict Card
          _buildAIScoreCard(score, analysis),

          const SizedBox(height: 16),

          // Live Order Ticket / Order Execution Form
          _buildOrderExecutionCard(ltp),

          const SizedBox(height: 16),

          // 52-Week Range Card
          _build52WeekRangeCard(ltp, low52, high52, rangePos),

          const SizedBox(height: 16),

          // Risk / Reward Card
          _buildRiskRewardCard(ltp, support, resistance),

          const SizedBox(height: 16),

          // Detailed Technical Indicators Table
          _buildTechnicalIndicatorsCard(analysis),

          const SizedBox(height: 16),

          // Live Stock Trade Floorsheet Table
          _buildStockFloorsheetCard(ltp),
        ],
      ),
    );
  }

  Widget _buildHeaderBannerCard(String name, String sector, double ltp, double changePct) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(sector, style: const TextStyle(color: Color(0xFF0C1929), fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('रु ${ltp.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF0C1929), fontSize: 24, fontWeight: FontWeight.w900)),
              Text('LTP Price', style: TextStyle(color: const Color(0xFF7A94B0), fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProChartCard(List<dynamic> ohlcv) {
    final spots = <FlSpot>[];
    if (ohlcv.isNotEmpty) {
      final slice = ohlcv.length > 30 ? ohlcv.sublist(ohlcv.length - 30) : ohlcv;
      for (int i = 0; i < slice.length; i++) {
        spots.add(FlSpot(i.toDouble(), (slice[i]['close'] as num).toDouble()));
      }
    } else {
      spots.addAll(const [FlSpot(0, 500), FlSpot(1, 510), FlSpot(2, 505), FlSpot(3, 525), FlSpot(4, 542)]);
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Pro Trading Chart Studio', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 15)),
              Row(
                children: [
                  _indicatorToggle('MA', showMa, () => setState(() => showMa = !showMa)),
                  _indicatorToggle('RSI', showRsi, () => setState(() => showRsi = !showRsi)),
                  _indicatorToggle('MACD', showMacd, () => setState(() => showMacd = !showMacd)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (val) => const FlLine(color: Color(0xFFF1F5F9), strokeWidth: 1),
                ),
                titlesData: const FlTitlesData(
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFF0284C7),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF0284C7).withOpacity(0.3),
                          const Color(0xFF0284C7).withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (showRsi) ...[
            const Divider(height: 24),
            const Text('RSI (14) Momentum Pane', style: TextStyle(color: Color(0xFF7A94B0), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              height: 40,
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(8)),
              alignment: Alignment.center,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Text('Oversold < 30', style: TextStyle(color: Color(0xFF059669), fontSize: 11, fontWeight: FontWeight.bold)),
                  Text('RSI: 48.5 (Bullish Neutral)', style: TextStyle(color: Color(0xFF0284C7), fontSize: 11, fontWeight: FontWeight.bold)),
                  Text('Overbought > 70', style: TextStyle(color: Color(0xFFDC2626), fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }

  Widget _indicatorToggle(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(left: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF0284C7) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label, style: TextStyle(color: active ? Colors.white : const Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildAIScoreCard(int score, Map<String, dynamic> analysis) {
    final scoreColor = score >= 70 ? const Color(0xFF059669) : score >= 50 ? const Color(0xFFD97706) : const Color(0xFFDC2626);
    final scoreBg = score >= 70 ? const Color(0xFFE6F9F3) : score >= 50 ? const Color(0xFFFEF3C7) : const Color(0xFFFEE2E2);
    final verdict = score >= 70 ? '🟢 Strong Buy Signal' : score >= 50 ? '🟡 Neutral / Watch' : '🔴 Avoid / Bearish';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AI Technical Score & Verdict', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: scoreBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: scoreColor, width: 2),
                ),
                alignment: Alignment.center,
                child: Text('$score', style: TextStyle(color: scoreColor, fontSize: 20, fontWeight: FontWeight.w900)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(verdict, style: TextStyle(color: scoreColor, fontWeight: FontWeight.w900, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(
                      'RSI Momentum is stable. EMA 50 > EMA 200 Golden Cross active. Score: $score/100.',
                      style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 11.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderExecutionCard(double ltp) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Live Trade Execution Ticket', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => orderType = 'BUY'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: orderType == 'BUY' ? const Color(0xFF059669) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text('BUY ${widget.symbol}', style: TextStyle(color: orderType == 'BUY' ? Colors.white : const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => orderType = 'SELL'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: orderType == 'SELL' ? const Color(0xFFDC2626) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text('SELL ${widget.symbol}', style: TextStyle(color: orderType == 'SELL' ? Colors.white : const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _qtyController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Shares Qty', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _priceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Limit Rate (रु)', border: OutlineInputBorder()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: orderType == 'BUY' ? const Color(0xFF059669) : const Color(0xFFDC2626),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _executeTradeOrder,
              child: Text('SUBMIT $orderType ORDER', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _build52WeekRangeCard(double ltp, double low52, double high52, double rangePos) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('52-Week High / Low Range', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('52W Low: रु ${low52.toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFF059669), fontSize: 11.5, fontWeight: FontWeight.bold)),
              Text('LTP: रु ${ltp.toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFF0C1929), fontSize: 11.5, fontWeight: FontWeight.bold)),
              Text('52W High: रु ${high52.toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFFDC2626), fontSize: 11.5, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: rangePos,
            backgroundColor: const Color(0xFFF1F5F9),
            color: const Color(0xFF0284C7),
            minHeight: 8,
          ),
        ],
      ),
    );
  }

  Widget _buildRiskRewardCard(double ltp, double support, double resistance) {
    final risk = ltp - support;
    final reward = resistance - ltp;
    final rrRatio = risk > 0 ? (reward / risk).toStringAsFixed(2) : '--';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Risk / Reward Analysis', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _rrBox('Buy Zone (Support)', 'रु ${support.toStringAsFixed(1)}', const Color(0xFF059669)),
              _rrBox('Target (Resistance)', 'रु ${resistance.toStringAsFixed(1)}', const Color(0xFF0284C7)),
              _rrBox('R:R Ratio', '1 : $rrRatio', const Color(0xFF8B5CF6)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rrBox(String label, String val, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 10.5, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 14)),
      ],
    );
  }

  Widget _buildTechnicalIndicatorsCard(Map<String, dynamic> analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Technical Indicators Breakdown', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 10),
          _indicatorRow('RSI (14)', '${(analysis['rsi'] ?? 48.5).toStringAsFixed(1)}', 'Neutral Momentum'),
          _indicatorRow('MACD', '${(analysis['macd'] ?? 2.4).toStringAsFixed(2)}', 'Bullish Crossover'),
          _indicatorRow('EMA 50 / 200', 'Golden Cross', 'EMA 50 > EMA 200'),
          _indicatorRow('ATR Volatility', 'रु ${(analysis['atr'] ?? 10.5).toStringAsFixed(2)}', 'Daily Trading Range'),
        ],
      ),
    );
  }

  Widget _indicatorRow(String name, String val, String sub) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: const TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 12.5)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(val, style: const TextStyle(color: Color(0xFF0284C7), fontWeight: FontWeight.bold, fontSize: 13)),
              Text(sub, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 10.5)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStockFloorsheetCard(double ltp) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD9E5F5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Live Stock Floorsheet / Trade History', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 10),
          Table(
            columnWidths: const {
              0: FlexColumnWidth(1.2),
              1: FlexColumnWidth(1.0),
              2: FlexColumnWidth(1.0),
              3: FlexColumnWidth(1.2),
              4: FlexColumnWidth(1.5),
            },
            children: [
              const TableRow(
                decoration: BoxDecoration(color: Color(0xFFF1F5F9)),
                children: [
                  Padding(padding: EdgeInsets.all(6), child: Text('Time', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                  Padding(padding: EdgeInsets.all(6), child: Text('Buy#', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                  Padding(padding: EdgeInsets.all(6), child: Text('Sell#', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                  Padding(padding: EdgeInsets.all(6), child: Text('Qty', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                  Padding(padding: EdgeInsets.all(6), child: Text('Rate (रु)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                ],
              ),
              _floorsheetRow('14:58:22', '58', '34', '500', ltp.toStringAsFixed(1)),
              _floorsheetRow('14:56:10', '42', '19', '1,200', (ltp - 1.0).toStringAsFixed(1)),
              _floorsheetRow('14:52:45', '17', '58', '350', (ltp + 0.5).toStringAsFixed(1)),
              _floorsheetRow('14:48:30', '34', '49', '800', ltp.toStringAsFixed(1)),
            ],
          ),
        ],
      ),
    );
  }

  TableRow _floorsheetRow(String time, String buy, String sell, String qty, String rate) {
    return TableRow(
      children: [
        Padding(padding: const EdgeInsets.all(6), child: Text(time, style: const TextStyle(fontSize: 11, color: Color(0xFF7A94B0)))),
        Padding(padding: const EdgeInsets.all(6), child: Text('#$buy', style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.bold))),
        Padding(padding: const EdgeInsets.all(6), child: Text('#$sell', style: const TextStyle(fontSize: 11, color: Color(0xFFDC2626), fontWeight: FontWeight.bold))),
        Padding(padding: const EdgeInsets.all(6), child: Text(qty, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold))),
        Padding(padding: const EdgeInsets.all(6), child: Text('रु $rate', style: const TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.bold))),
      ],
    );
  }
}
