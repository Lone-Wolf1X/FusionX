import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PortfolioManagerView extends StatefulWidget {
  const PortfolioManagerView({super.key});
  @override
  State<PortfolioManagerView> createState() => _PortfolioManagerViewState();
}

class _PortfolioManagerViewState extends State<PortfolioManagerView> {
  List<dynamic> portfolios = [];
  Map<int, List<dynamic>> tradesMap = {};
  bool loading = true;
  int? selectedPortfolioId;

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBg = Color(0xFFF0F5FC);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() => loading = true);
    final p = await ApiService.getPortfolios();
    final Map<int, List<dynamic>> tm = {};
    for (final port in p) {
      final id = port['id'] as int;
      tm[id] = await ApiService.getPortfolioTrades(id);
    }
    if (mounted) {
      setState(() {
        portfolios = p;
        tradesMap = tm;
        if (p.isNotEmpty && selectedPortfolioId == null) {
          selectedPortfolioId = p[0]['id'] as int;
        }
        loading = false;
      });
    }
  }

  double _portfolioPnl(int portfolioId) {
    final trades = tradesMap[portfolioId] ?? [];
    double pnl = 0;
    for (final t in trades) {
      final qty = (t['quantity'] ?? 0).toDouble();
      final buy = (t['buy_price'] ?? 0).toDouble();
      final ltp = (t['ltp'] ?? t['buy_price'] ?? 0).toDouble();
      pnl += (ltp - buy) * qty;
    }
    return pnl;
  }

  void _showCreatePortfolioDialog() {
    final nameCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('New Portfolio', style: TextStyle(color: kDark, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: nameCtrl,
          style: const TextStyle(color: kDark),
          decoration: const InputDecoration(
            labelText: 'Portfolio Name',
            labelStyle: TextStyle(color: kSub),
            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: kBorder)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: kSub))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: () async {
              if (nameCtrl.text.isNotEmpty) {
                await ApiService.createPortfolio(nameCtrl.text.trim());
                if (ctx.mounted) Navigator.pop(ctx);
                loadData();
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _showAddTradeDialog(int portfolioId) {
    final symCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final ltpCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Trade', style: TextStyle(color: kDark, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _dialogField(symCtrl, 'Stock Symbol (e.g. NABIL)', false),
              const SizedBox(height: 10),
              _dialogField(qtyCtrl, 'Quantity (Shares)', true),
              const SizedBox(height: 10),
              _dialogField(priceCtrl, 'Buy Price (NPR)', true),
              const SizedBox(height: 10),
              _dialogField(ltpCtrl, 'Current LTP (NPR)', true),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: kSub))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: () async {
              if (symCtrl.text.isNotEmpty && priceCtrl.text.isNotEmpty && qtyCtrl.text.isNotEmpty) {
                await ApiService.addTrade(portfolioId, {
                  "symbol": symCtrl.text.trim().toUpperCase(),
                  "quantity": int.tryParse(qtyCtrl.text) ?? 1,
                  "buy_price": double.tryParse(priceCtrl.text) ?? 0,
                  "ltp": double.tryParse(ltpCtrl.text) ?? double.tryParse(priceCtrl.text) ?? 0,
                });
                if (ctx.mounted) Navigator.pop(ctx);
                loadData();
              }
            },
            child: const Text('Add Trade'),
          ),
        ],
      ),
    );
  }

  TextField _dialogField(TextEditingController ctrl, String label, bool isNum) {
    return TextField(
      controller: ctrl,
      keyboardType: isNum ? TextInputType.number : TextInputType.text,
      style: const TextStyle(color: kDark),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: kSub),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: kBorder)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kPrimary));

    final selectedPortfolio = portfolios.firstWhere(
      (p) => p['id'] == selectedPortfolioId,
      orElse: () => null,
    );
    final trades = selectedPortfolioId != null ? (tradesMap[selectedPortfolioId] ?? []) : [];
    final totalPnl = selectedPortfolioId != null ? _portfolioPnl(selectedPortfolioId!) : 0.0;

    return Column(
      children: [
        // Portfolio tabs
        Container(
          height: 50,
          color: Colors.white,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: [
              ...portfolios.map((p) => GestureDetector(
                onTap: () => setState(() => selectedPortfolioId = p['id'] as int),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: selectedPortfolioId == p['id'] ? kPrimary : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: selectedPortfolioId == p['id'] ? kPrimary : kBorder),
                  ),
                  child: Text(
                    p['name'] ?? 'Portfolio',
                    style: TextStyle(
                      color: selectedPortfolioId == p['id'] ? Colors.white : kSub,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              )),
              GestureDetector(
                onTap: _showCreatePortfolioDialog,
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kBorder),
                  ),
                  child: const Row(
                    children: [Icon(Icons.add, size: 14, color: kPrimary), SizedBox(width: 4), Text('New', style: TextStyle(color: kPrimary, fontWeight: FontWeight.w600, fontSize: 13))],
                  ),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: RefreshIndicator(
            onRefresh: loadData,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (selectedPortfolio != null) ...[
                  // P&L Summary Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: totalPnl >= 0 ? [const Color(0xFF059669), const Color(0xFF10B981)] : [const Color(0xFFDC2626), const Color(0xFFEF4444)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(selectedPortfolio['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                            Text('${trades.length} Positions', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Unrealized P&L', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(
                          '${totalPnl >= 0 ? '+' : ''}रु ${totalPnl.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Add Trade Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('+ Add Trade'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => _showAddTradeDialog(selectedPortfolioId!),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Trades List
                  if (trades.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            Icon(Icons.show_chart, size: 48, color: kSub.withOpacity(0.4)),
                            const SizedBox(height: 12),
                            const Text('No trades yet.\nTap "+ Add Trade" to start.', textAlign: TextAlign.center, style: TextStyle(color: kSub, fontSize: 14)),
                          ],
                        ),
                      ),
                    )
                  else
                    ...trades.map((t) {
                      final qty = (t['quantity'] ?? 0).toDouble();
                      final buy = (t['buy_price'] ?? 0).toDouble();
                      final ltp = (t['ltp'] ?? buy).toDouble();
                      final pnl = (ltp - buy) * qty;
                      final pnlPct = buy > 0 ? ((ltp - buy) / buy * 100) : 0.0;
                      return Card(
                        color: Colors.white,
                        elevation: 1,
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: pnl >= 0 ? kGreen.withOpacity(0.3) : kRed.withOpacity(0.3)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(t['symbol'] ?? '', style: const TextStyle(color: kPrimary, fontWeight: FontWeight.w900, fontSize: 16)),
                                  Row(children: [
                                    Text(
                                      '${pnl >= 0 ? '+' : ''}रु ${pnl.toStringAsFixed(0)}',
                                      style: TextStyle(color: pnl >= 0 ? kGreen : kRed, fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: () async {
                                        await ApiService.deleteTrade(selectedPortfolioId!, t['id'] as int);
                                        loadData();
                                      },
                                      child: const Icon(Icons.delete_outline, color: kRed, size: 18),
                                    ),
                                  ]),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(children: [
                                _tradeChip('Qty: ${t['quantity']}', kDark),
                                const SizedBox(width: 8),
                                _tradeChip('Buy: रु $buy', kSub),
                                const SizedBox(width: 8),
                                _tradeChip('LTP: रु $ltp', kPrimary),
                                const Spacer(),
                                Text('${pnlPct.toStringAsFixed(1)}%', style: TextStyle(color: pnl >= 0 ? kGreen : kRed, fontSize: 12, fontWeight: FontWeight.bold)),
                              ]),
                            ],
                          ),
                        ),
                      );
                    }),
                ] else ...[
                  const Center(child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Text('Create a portfolio to get started.', style: TextStyle(color: kSub, fontSize: 15)),
                  )),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _tradeChip(String text, Color color) {
    return Text(text, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w600));
  }
}
