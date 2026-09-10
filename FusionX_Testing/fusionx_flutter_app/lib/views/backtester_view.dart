import 'package:flutter/material.dart';
import '../services/api_service.dart';

class BacktesterView extends StatefulWidget {
  const BacktesterView({super.key});
  @override
  State<BacktesterView> createState() => _BacktesterViewState();
}

class _BacktesterViewState extends State<BacktesterView> {
  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);
  static const Color kBg = Color(0xFFF0F5FC);

  String selectedStrategy = 'RSI Oversold + MACD Cross';
  String startDate = '2022-01-01';
  String endDate = '2024-12-31';
  String capital = '100000';
  String takeProfitPct = '15';
  String stopLossPct = '7';

  bool running = false;
  Map<String, dynamic>? results;

  final List<String> strategies = [
    'RSI Oversold + MACD Cross',
    'EMA Golden Cross (9/21)',
    'Volume Breakout',
    'Support Rebound',
    'Bollinger Band Squeeze',
    'MACD Histogram Divergence',
  ];

  Future<void> runBacktest() async {
    setState(() { running = true; results = null; });
    final r = await ApiService.runBacktest({
      "strategy": selectedStrategy,
      "start_date": startDate,
      "end_date": endDate,
      "initial_capital": double.tryParse(capital) ?? 100000,
      "take_profit_pct": double.tryParse(takeProfitPct) ?? 15,
      "stop_loss_pct": double.tryParse(stopLossPct) ?? 7,
    });
    if (mounted) setState(() { results = r; running = false; });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => setState(() {}),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF1E3A5F), Color(0xFF0369A1)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Backtesting Lab 🧪', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                SizedBox(height: 4),
                Text('Test your strategy on 15+ years of NEPSE historical data', style: TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Strategy Selector
          _sectionLabel('Select Strategy'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: strategies.map((s) => GestureDetector(
              onTap: () => setState(() => selectedStrategy = s),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: selectedStrategy == s ? kPrimary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: selectedStrategy == s ? kPrimary : kBorder),
                ),
                child: Text(s, style: TextStyle(color: selectedStrategy == s ? Colors.white : kDark, fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            )).toList(),
          ),
          const SizedBox(height: 20),

          // Date Range
          _sectionLabel('Date Range'),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: _dateField('Start Date', startDate, (v) => setState(() => startDate = v))),
            const SizedBox(width: 12),
            Expanded(child: _dateField('End Date', endDate, (v) => setState(() => endDate = v))),
          ]),
          const SizedBox(height: 16),

          // Capital + TP/SL
          _sectionLabel('Capital & Risk Settings'),
          const SizedBox(height: 8),
          _inputField('Starting Capital (NPR)', capital, (v) => capital = v, false),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _inputField('Take Profit %', takeProfitPct, (v) => takeProfitPct = v, true)),
            const SizedBox(width: 12),
            Expanded(child: _inputField('Stop Loss %', stopLossPct, (v) => stopLossPct = v, true)),
          ]),
          const SizedBox(height: 24),

          // Run Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: running
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.play_arrow),
              label: Text(running ? 'Running Backtest...' : 'Run Backtest'),
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              onPressed: running ? null : runBacktest,
            ),
          ),
          const SizedBox(height: 24),

          // Results
          if (results != null && results!.isNotEmpty) ...[
            _sectionLabel('Results'),
            const SizedBox(height: 10),

            // Summary Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.2,
              children: [
                _resultCard('Total Trades', '${results!['total_trades'] ?? '-'}', kDark),
                _resultCard('Win Rate', '${results!['win_rate'] ?? '-'}%', kGreen),
                _resultCard('Max Drawdown', '${results!['max_drawdown'] ?? '-'}%', kRed),
                _resultCard('Sharpe Ratio', '${results!['sharpe_ratio'] ?? '-'}', kPrimary),
              ],
            ),
            const SizedBox(height: 16),

            // Final Capital
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kGreen.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Starting Capital', style: TextStyle(color: kSub, fontSize: 12)),
                    Text('रु ${results!['initial_capital'] ?? capital}', style: const TextStyle(color: kDark, fontWeight: FontWeight.bold, fontSize: 16)),
                  ]),
                  const Icon(Icons.arrow_forward, color: kSub),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    const Text('Final Capital', style: TextStyle(color: kSub, fontSize: 12)),
                    Text('रु ${results!['final_capital'] ?? '-'}', style: const TextStyle(color: kGreen, fontWeight: FontWeight.w900, fontSize: 18)),
                  ]),
                ],
              ),
            ),

            if ((results!['trades'] as List?)?.isNotEmpty == true) ...[
              const SizedBox(height: 16),
              _sectionLabel('Trade Log'),
              const SizedBox(height: 8),
              ...(results!['trades'] as List).take(20).map((t) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder),
                ),
                child: Row(children: [
                  Text(t['symbol'] ?? '', style: const TextStyle(color: kPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                  const Spacer(),
                  Text(t['entry_date'] ?? '', style: const TextStyle(color: kSub, fontSize: 11)),
                  const SizedBox(width: 8),
                  Text(
                    '${(t['pnl'] ?? 0) >= 0 ? '+' : ''}${t['pnl'] ?? '-'}%',
                    style: TextStyle(color: (t['pnl'] ?? 0) >= 0 ? kGreen : kRed, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ]),
              )),
            ],
          ] else if (results != null && results!.isEmpty) ...[
            const Center(child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No results returned. Check backend connection.', style: TextStyle(color: kSub, fontSize: 14), textAlign: TextAlign.center),
            )),
          ],
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(text, style: const TextStyle(color: kDark, fontSize: 15, fontWeight: FontWeight.bold));

  Widget _resultCard(String label, String val, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(label, style: const TextStyle(color: kSub, fontSize: 10.5, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900)),
      ]),
    );
  }

  Widget _dateField(String label, String value, Function(String) onChanged) {
    final ctrl = TextEditingController(text: value);
    return TextField(
      controller: ctrl,
      onChanged: onChanged,
      style: const TextStyle(color: kDark, fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: kSub, fontSize: 12),
        hintText: 'YYYY-MM-DD',
        hintStyle: const TextStyle(color: kBorder),
        enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: kBorder)),
        focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: kPrimary)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      ),
    );
  }

  Widget _inputField(String label, String initialVal, Function(String) onChanged, bool isNum) {
    final ctrl = TextEditingController(text: initialVal);
    return TextField(
      controller: ctrl,
      keyboardType: isNum ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.number,
      onChanged: onChanged,
      style: const TextStyle(color: kDark, fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: kSub, fontSize: 12),
        enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: kBorder)),
        focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: kPrimary)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      ),
    );
  }
}
