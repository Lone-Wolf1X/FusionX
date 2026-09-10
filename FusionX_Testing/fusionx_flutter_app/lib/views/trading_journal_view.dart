import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class TradingJournalView extends StatefulWidget {
  const TradingJournalView({super.key});
  @override
  State<TradingJournalView> createState() => _TradingJournalViewState();
}

class _TradingJournalViewState extends State<TradingJournalView> {
  List<dynamic> entries = [];
  bool loading = true;

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);

  final List<String> setups = ['Volume Breakout', 'EMA Golden Cross', 'Support Rebound', 'RSI Oversold', 'MACD Crossover', 'Trendline Break', 'News Play', 'Custom'];
  final List<String> mindsets = ['Disciplined Plan', 'FOMO Entry', 'Revenge Trade', 'Panic Exit', 'Overconfident', 'Calculated Risk'];

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() => loading = true);
    final e = await ApiService.getJournalEntries();
    if (mounted) setState(() { entries = e; loading = false; });
  }

  void _showAddDialog() {
    final symCtrl = TextEditingController();
    final entryCtrl = TextEditingController();
    final exitCtrl = TextEditingController();
    final targetCtrl = TextEditingController();
    final slCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String setup = setups[0];
    String mindset = mindsets[0];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Log New Trade', style: TextStyle(color: kDark, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _field(symCtrl, 'Stock Symbol', false),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: _field(entryCtrl, 'Entry Price', true)),
                  const SizedBox(width: 10),
                  Expanded(child: _field(exitCtrl, 'Exit Price', true)),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: _field(targetCtrl, 'Target', true)),
                  const SizedBox(width: 10),
                  Expanded(child: _field(slCtrl, 'Stop Loss', true)),
                ]),
                const SizedBox(height: 12),
                const Text('Setup Strategy', style: TextStyle(color: kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: setups.map((s) => GestureDetector(
                  onTap: () => setS(() => setup = s),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: setup == s ? kPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: setup == s ? kPrimary : kBorder),
                    ),
                    child: Text(s, style: TextStyle(color: setup == s ? Colors.white : kSub, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                )).toList()),
                const SizedBox(height: 12),
                const Text('Trader Mindset', style: TextStyle(color: kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: mindsets.map((m) => GestureDetector(
                  onTap: () => setS(() => mindset = m),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: mindset == m ? const Color(0xFFF59E0B) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: mindset == m ? const Color(0xFFF59E0B) : kBorder),
                    ),
                    child: Text(m, style: TextStyle(color: mindset == m ? Colors.white : kSub, fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                )).toList()),
                const SizedBox(height: 10),
                _field(notesCtrl, 'Notes / Learnings', false),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(foregroundColor: kSub, side: const BorderSide(color: kBorder), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    child: const Text('Cancel'),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    onPressed: () async {
                      if (symCtrl.text.isNotEmpty) {
                        await ApiService.addJournalEntry({
                          "symbol": symCtrl.text.trim().toUpperCase(),
                          "entry_price": double.tryParse(entryCtrl.text) ?? 0,
                          "exit_price": double.tryParse(exitCtrl.text) ?? 0,
                          "target": double.tryParse(targetCtrl.text) ?? 0,
                          "stop_loss": double.tryParse(slCtrl.text) ?? 0,
                          "setup": setup,
                          "mindset": mindset,
                          "notes": notesCtrl.text,
                          "date": DateFormat('yyyy-MM-dd').format(DateTime.now()),
                        });
                        if (ctx.mounted) Navigator.pop(ctx);
                        loadData();
                      }
                    },
                    child: const Text('Log Trade'),
                  )),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }

  TextField _field(TextEditingController ctrl, String label, bool isNum) {
    return TextField(
      controller: ctrl,
      keyboardType: isNum ? TextInputType.number : TextInputType.text,
      style: const TextStyle(color: kDark, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: kSub, fontSize: 13),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: kBorder)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: kPrimary)),
      ),
    );
  }

  Color _mindsetColor(String mindset) {
    if (['Disciplined Plan', 'Calculated Risk'].contains(mindset)) return kGreen;
    if (['FOMO Entry', 'Revenge Trade', 'Panic Exit'].contains(mindset)) return kRed;
    return const Color(0xFFF59E0B);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kPrimary));

    final winCount = entries.where((e) {
      final entry = (e['entry_price'] ?? 0).toDouble();
      final exit = (e['exit_price'] ?? 0).toDouble();
      return exit > entry;
    }).length;
    final winRate = entries.isEmpty ? 0 : (winCount / entries.length * 100).round();

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: loadData,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Stats Banner
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF1E3A5F), Color(0xFF0284C7)]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statBanner('Total Trades', '${entries.length}'),
                    _divider(),
                    _statBanner('Wins', '$winCount', kGreen),
                    _divider(),
                    _statBanner('Win Rate', '$winRate%', winRate >= 50 ? kGreen : kRed),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (entries.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.book_outlined, size: 48, color: kSub.withOpacity(0.4)),
                        const SizedBox(height: 12),
                        const Text('No journal entries yet.\nTap + to log your first trade.', textAlign: TextAlign.center, style: TextStyle(color: kSub, fontSize: 14)),
                      ],
                    ),
                  ),
                )
              else
                ...entries.map((e) {
                  final entry = (e['entry_price'] ?? 0).toDouble();
                  final exit = (e['exit_price'] ?? 0).toDouble();
                  final isWin = exit > entry;
                  final pnlPct = entry > 0 ? ((exit - entry) / entry * 100) : 0.0;
                  return Card(
                    color: Colors.white,
                    elevation: 1,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(color: isWin ? kGreen.withOpacity(0.3) : kRed.withOpacity(0.3)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(child: Text(e['symbol'] ?? '', style: const TextStyle(color: kPrimary, fontSize: 17, fontWeight: FontWeight.w900))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: (isWin ? kGreen : kRed).withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: isWin ? kGreen : kRed)),
                              child: Text(isWin ? '✅ WIN' : '❌ LOSS', style: TextStyle(color: isWin ? kGreen : kRed, fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () async { await ApiService.deleteJournalEntry(e['id']); loadData(); },
                              child: const Icon(Icons.delete_outline, color: kRed, size: 18),
                            ),
                          ]),
                          const SizedBox(height: 8),
                          Row(children: [
                            _chip('Entry: रु $entry', kDark),
                            const SizedBox(width: 6),
                            _chip('Exit: रु $exit', kDark),
                            const SizedBox(width: 6),
                            _chip('${pnlPct >= 0 ? '+' : ''}${pnlPct.toStringAsFixed(1)}%', isWin ? kGreen : kRed),
                          ]),
                          const SizedBox(height: 8),
                          Row(children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: kPrimary.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
                              child: Text(e['setup'] ?? '', style: const TextStyle(color: kPrimary, fontSize: 10.5, fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: _mindsetColor(e['mindset'] ?? '').withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                              child: Text(e['mindset'] ?? '', style: TextStyle(color: _mindsetColor(e['mindset'] ?? ''), fontSize: 10.5, fontWeight: FontWeight.w600)),
                            ),
                          ]),
                          if ((e['notes'] ?? '').isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(e['notes'], style: const TextStyle(color: kSub, fontSize: 12)),
                          ],
                        ],
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 80),
            ],
          ),
        ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton.extended(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add),
            label: const Text('Log Trade'),
            onPressed: _showAddDialog,
          ),
        ),
      ],
    );
  }

  Widget _statBanner(String label, String val, [Color valColor = Colors.white]) {
    return Column(
      children: [
        Text(val, style: TextStyle(color: valColor, fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
      ],
    );
  }

  Widget _divider() => Container(width: 1, height: 36, color: Colors.white24);

  Widget _chip(String text, Color color) {
    return Text(text, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w600));
  }
}
