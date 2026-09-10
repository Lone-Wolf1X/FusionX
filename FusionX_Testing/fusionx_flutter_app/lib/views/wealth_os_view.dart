import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WealthOsView extends StatefulWidget {
  const WealthOsView({super.key});

  @override
  State<WealthOsView> createState() => _WealthOsViewState();
}

class _WealthOsViewState extends State<WealthOsView> {
  Map<String, dynamic>? summary;
  List<dynamic> assets = [];
  List<dynamic> liabilities = [];
  List<dynamic> transactions = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() => loading = true);
    final sumRes = await ApiService.getFinanceSummary();
    final assRes = await ApiService.getFinanceAssets();
    final liabRes = await ApiService.getFinanceLiabilities();
    final txRes = await ApiService.getFinanceTransactions();

    if (mounted) {
      setState(() {
        summary = sumRes;
        assets = assRes;
        liabilities = liabRes;
        transactions = txRes;
        loading = false;
      });
    }
  }

  void _showAddAssetDialog() {
    final nameController = TextEditingController();
    final valueController = TextEditingController();
    String category = 'Bank';
    bool isLiquid = true;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Add Asset', style: TextStyle(color: Color(0xFF0C1929), fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: Color(0xFF0C1929)),
              decoration: const InputDecoration(
                labelText: 'Asset Name (e.g. NABIL Bank)',
                labelStyle: TextStyle(color: Color(0xFF7A94B0)),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFD9E5F5))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: valueController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Color(0xFF0C1929)),
              decoration: const InputDecoration(
                labelText: 'Value (NPR)',
                labelStyle: TextStyle(color: Color(0xFF7A94B0)),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFD9E5F5))),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF7A94B0))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              if (nameController.text.isNotEmpty && valueController.text.isNotEmpty) {
                await ApiService.addAsset({
                  "name": nameController.text,
                  "category": category,
                  "value": double.tryParse(valueController.text) ?? 0.0,
                  "is_liquid": isLiquid
                });
                if (ctx.mounted) Navigator.pop(ctx);
                loadData();
              }
            },
            child: const Text('Save Asset', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showAddLiabilityDialog() {
    final nameController = TextEditingController();
    final amountController = TextEditingController();
    final rateController = TextEditingController(text: "12.0");
    final emiController = TextEditingController(text: "0");
    String category = 'Overdraft (OD)';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Add Loan / Overdraft (OD)', style: TextStyle(color: Color(0xFF0C1929), fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: Color(0xFF0C1929)),
              decoration: const InputDecoration(
                labelText: 'Facility / Loan Title',
                labelStyle: TextStyle(color: Color(0xFF7A94B0)),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFD9E5F5))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Color(0xFF0C1929)),
              decoration: const InputDecoration(
                labelText: 'Amount Owed / OD Utilized (NPR)',
                labelStyle: TextStyle(color: Color(0xFF7A94B0)),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFD9E5F5))),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: rateController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Color(0xFF0C1929)),
              decoration: const InputDecoration(
                labelText: 'Interest Rate (% p.a.)',
                labelStyle: TextStyle(color: Color(0xFF7A94B0)),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFD9E5F5))),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF7A94B0))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              if (nameController.text.isNotEmpty && amountController.text.isNotEmpty) {
                await ApiService.addLiability({
                  "name": nameController.text,
                  "category": category,
                  "amount_owed": double.tryParse(amountController.text) ?? 0.0,
                  "interest_rate": double.tryParse(rateController.text) ?? 0.0,
                  "min_monthly_payment": double.tryParse(emiController.text) ?? 0.0,
                });
                if (ctx.mounted) Navigator.pop(ctx);
                loadData();
              }
            },
            child: const Text('Save Loan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading || summary == null) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)));
    }

    final netWorth = summary!['net_worth'] ?? 0;
    final totalAssets = summary!['total_assets'] ?? 0;
    final totalLiabilities = summary!['total_liabilities'] ?? 0;
    final healthScore = summary!['health_score'] ?? 85;

    return RefreshIndicator(
      onRefresh: loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card: Net Worth & Health Score
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEBF5FF), Color(0xFFF4F8FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBAD0EE)),
              boxShadow: const [
                BoxShadow(color: Color(0x080C1929), blurRadius: 10, offset: Offset(0, 4))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('NET WORTH', style: TextStyle(color: Color(0xFF4A6080), fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981)),
                      ),
                      child: Text('Doctor Score: $healthScore/100', style: const TextStyle(color: Color(0xFF059669), fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'रु ${netWorth.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                  style: TextStyle(
                    color: netWorth >= 0 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _statItem('Total Assets', 'रु $totalAssets', const Color(0xFF059669)),
                    ),
                    Container(width: 1, height: 30, color: const Color(0xFFD9E5F5)),
                    Expanded(
                      child: _statItem('Total Debts', 'रु $totalLiabilities', const Color(0xFFDC2626)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons Bar
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('+ Asset'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: _showAddAssetDialog,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('+ Loan / OD'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: _showAddLiabilityDialog,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Assets Section Header
          const Text('Your Assets', style: TextStyle(color: Color(0xFF0C1929), fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...assets.map((a) => Card(
            color: Colors.white,
            elevation: 1,
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFD9E5F5)),
            ),
            child: ListTile(
              title: Text(a['name'] ?? '', style: const TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text(a['category'] ?? '', style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 12)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'रु ${a['value']}',
                    style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444), size: 18),
                    onPressed: () async {
                      await ApiService.deleteAsset(a['id']);
                      loadData();
                    },
                  ),
                ],
              ),
            ),
          )),

          const SizedBox(height: 20),

          // Liabilities / Overdraft Section Header
          const Text('Loans & Overdraft Facilities', style: TextStyle(color: Color(0xFF0C1929), fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...liabilities.map((l) => Card(
            color: Colors.white,
            elevation: 1,
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFD9E5F5)),
            ),
            child: ListTile(
              title: Text(l['name'] ?? '', style: const TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text(
                '${l['category']} • Rate: ${l['interest_rate']}% p.a.',
                style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 12),
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'रु ${l['amount_owed']}',
                    style: const TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444), size: 18),
                    onPressed: () async {
                      await ApiService.deleteLiability(l['id']);
                      loadData();
                    },
                  ),
                ],
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _statItem(String title, String val, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 11, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 16)),
      ],
    );
  }
}
