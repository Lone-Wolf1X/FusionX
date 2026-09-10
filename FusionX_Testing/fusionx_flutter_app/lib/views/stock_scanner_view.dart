import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'stock_detail_view.dart';

class StockScannerView extends StatefulWidget {
  const StockScannerView({super.key});

  @override
  State<StockScannerView> createState() => _StockScannerViewState();
}

class _StockScannerViewState extends State<StockScannerView> {
  List<dynamic> stocks = [];
  bool loading = true;
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    runScan();
  }

  Future<void> runScan() async {
    setState(() => loading = true);
    final res = await ApiService.getScanResults();
    if (mounted) {
      setState(() {
        stocks = res['stocks'] ?? [];
        loading = false;
      });
    }
  }

  void _openStockDetail(String symbol) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => StockDetailView(symbol: symbol)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = stocks.where((s) {
      final sym = (s['symbol'] ?? '').toString().toLowerCase();
      return sym.contains(searchQuery.toLowerCase());
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            onChanged: (val) => setState(() => searchQuery = val),
            style: const TextStyle(color: Color(0xFF0C1929)),
            decoration: InputDecoration(
              hintText: 'Search Stock Symbol (e.g. NIFRA, NABIL)...',
              hintStyle: const TextStyle(color: Color(0xFFA0B4CB)),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF7A94B0)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFD9E5F5)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
              ),
            ),
          ),
        ),

        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
              : RefreshIndicator(
                  onRefresh: runScan,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) {
                      final item = filtered[i];
                      final sym = item['symbol'] ?? '';
                      final signal = item['signal'] ?? 'NEUTRAL';
                      final isBullish = signal == 'BUY' || signal == 'STRONG BUY';
                      final isBearish = signal == 'SELL';

                      return Card(
                        color: Colors.white,
                        elevation: 1,
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFFD9E5F5)),
                        ),
                        child: ListTile(
                          onTap: () => _openStockDetail(sym),
                          title: Text(sym, style: const TextStyle(color: Color(0xFF0284C7), fontWeight: FontWeight.w800, fontSize: 15)),
                          subtitle: Text(
                            'Close: रु ${item['close']} • RSI: ${item['rsi'] ?? '-'}',
                            style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 12),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isBullish
                                      ? const Color(0xFF10B981).withOpacity(0.12)
                                      : isBearish
                                          ? const Color(0xFFEF4444).withOpacity(0.12)
                                          : const Color(0xFFF4F8FF),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isBullish
                                        ? const Color(0xFF10B981)
                                        : isBearish
                                            ? const Color(0xFFEF4444)
                                            : const Color(0xFFD9E5F5),
                                  ),
                                ),
                                child: Text(
                                  signal,
                                  style: TextStyle(
                                    color: isBullish
                                        ? const Color(0xFF059669)
                                        : isBearish
                                            ? const Color(0xFFDC2626)
                                            : const Color(0xFF4A6080),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.chevron_right, color: Color(0xFF7A94B0), size: 18),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}
