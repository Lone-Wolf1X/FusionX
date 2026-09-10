import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WatchlistView extends StatefulWidget {
  const WatchlistView({super.key});
  @override
  State<WatchlistView> createState() => _WatchlistViewState();
}

class _WatchlistViewState extends State<WatchlistView> {
  List<dynamic> watchlist = [];
  bool loading = true;

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);

  final List<String> categories = ['🔥 Breakouts', '💎 Long-Term Core', '🚀 High Growth', '🛡️ Defensive', '📊 Swing Trade', '🎯 Watchlist'];

  @override
  void initState() { super.initState(); loadData(); }

  Future<void> loadData() async {
    setState(() => loading = true);
    final w = await ApiService.getWatchlist();
    if (mounted) setState(() { watchlist = w; loading = false; });
  }

  void _showAddDialog() {
    final symCtrl = TextEditingController();
    String selectedCategory = categories[0];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add to Watchlist', style: TextStyle(color: kDark, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: symCtrl,
                style: const TextStyle(color: kDark),
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Stock Symbol (e.g. NABIL, CHCL)',
                  labelStyle: TextStyle(color: kSub),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: kBorder)),
                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: kPrimary)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Category', style: TextStyle(color: kSub, fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: categories.map((c) => GestureDetector(
                  onTap: () => setS(() => selectedCategory = c),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: selectedCategory == c ? kPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: selectedCategory == c ? kPrimary : kBorder),
                    ),
                    child: Text(c, style: TextStyle(color: selectedCategory == c ? Colors.white : kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 20),
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
                      await ApiService.addToWatchlist({
                        "symbol": symCtrl.text.trim().toUpperCase(),
                        "category": selectedCategory,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      loadData();
                    }
                  },
                  child: const Text('Add'),
                )),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Map<String, List<dynamic>> _groupByCategory() {
    final Map<String, List<dynamic>> grouped = {};
    for (final item in watchlist) {
      final cat = item['category'] ?? '🎯 Watchlist';
      grouped.putIfAbsent(cat, () => []).add(item);
    }
    return grouped;
  }

  Color _changeColor(dynamic change) {
    final c = (change ?? 0).toDouble();
    if (c > 0) return kGreen;
    if (c < 0) return kRed;
    return kSub;
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kPrimary));

    final grouped = _groupByCategory();

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: loadData,
          child: watchlist.isEmpty
              ? ListView(children: [Center(child: Padding(
                  padding: const EdgeInsets.all(60),
                  child: Column(children: [
                    Icon(Icons.bookmark_border, size: 48, color: kSub.withOpacity(0.4)),
                    const SizedBox(height: 12),
                    const Text('Your watchlist is empty.\nTap + to add stocks.', textAlign: TextAlign.center, style: TextStyle(color: kSub, fontSize: 14)),
                  ]),
                ))])
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...grouped.entries.map((entry) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8, top: 8),
                          child: Text(entry.key, style: const TextStyle(color: kDark, fontSize: 15, fontWeight: FontWeight.bold)),
                        ),
                        ...entry.value.map((item) {
                          final change = (item['change_pct'] ?? 0).toDouble();
                          final aiScore = item['ai_score'] ?? item['score'] ?? 0;
                          return Card(
                            color: Colors.white,
                            elevation: 1,
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kBorder)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              leading: CircleAvatar(
                                backgroundColor: kPrimary.withOpacity(0.1),
                                child: Text(
                                  (item['symbol'] ?? '?').toString().substring(0, item['symbol']?.length > 2 ? 2 : (item['symbol']?.length ?? 1)),
                                  style: const TextStyle(color: kPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                              title: Text(item['symbol'] ?? '', style: const TextStyle(color: kDark, fontWeight: FontWeight.w800, fontSize: 15)),
                              subtitle: Row(children: [
                                if (aiScore > 0) Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: kGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                  child: Text('AI: $aiScore/100', style: const TextStyle(color: kGreen, fontSize: 10.5, fontWeight: FontWeight.bold)),
                                ),
                                if (item['rsi'] != null) ...[const SizedBox(width: 6), Text('RSI: ${item['rsi']}', style: const TextStyle(color: kSub, fontSize: 10.5))],
                              ]),
                              trailing: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('रु ${item['ltp'] ?? item['close'] ?? '-'}', style: const TextStyle(color: kDark, fontWeight: FontWeight.bold, fontSize: 15)),
                                  Text('${change >= 0 ? '+' : ''}${change.toStringAsFixed(2)}%', style: TextStyle(color: _changeColor(change), fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              onLongPress: () => showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  backgroundColor: Colors.white,
                                  title: Text('Remove ${item['symbol']}?', style: const TextStyle(color: kDark)),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                    TextButton(
                                      onPressed: () async {
                                        await ApiService.removeFromWatchlist(item['symbol']);
                                        if (ctx.mounted) Navigator.pop(ctx);
                                        loadData();
                                      },
                                      child: const Text('Remove', style: TextStyle(color: kRed)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 8),
                      ],
                    )),
                    const SizedBox(height: 80),
                  ],
                ),
        ),
        Positioned(
          right: 16,
          bottom: 16,
          child: FloatingActionButton(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            child: const Icon(Icons.add),
            onPressed: _showAddDialog,
          ),
        ),
      ],
    );
  }
}
