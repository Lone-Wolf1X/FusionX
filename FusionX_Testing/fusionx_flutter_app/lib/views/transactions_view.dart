import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TransactionsView extends StatefulWidget {
  const TransactionsView({super.key});
  @override
  State<TransactionsView> createState() => _TransactionsViewState();
}

class _TransactionsViewState extends State<TransactionsView> {
  List<dynamic> transactions = [];
  bool loading = true;
  String filterType = 'All';

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);

  final List<String> incomeCategories = ['Salary', 'Business', 'Dividend', 'Rental', 'Freelance', 'Interest', 'Gift', 'Other Income'];
  final List<String> expenseCategories = ['Groceries', 'Rent', 'Utilities', 'Transport', 'Healthcare', 'Education', 'Entertainment', 'Loan EMI', 'Insurance', 'Investment', 'Other Expense'];

  @override
  void initState() { super.initState(); loadData(); }

  Future<void> loadData() async {
    setState(() => loading = true);
    final t = await ApiService.getFinanceTransactions();
    if (mounted) setState(() { transactions = t; loading = false; });
  }

  List<dynamic> get filtered {
    if (filterType == 'All') return transactions;
    return transactions.where((t) => (t['type'] ?? '').toLowerCase() == filterType.toLowerCase()).toList();
  }

  double get totalIncome => transactions.where((t) => t['type'] == 'income').fold(0.0, (s, t) => s + (t['amount'] ?? 0).toDouble());
  double get totalExpense => transactions.where((t) => t['type'] == 'expense').fold(0.0, (s, t) => s + (t['amount'] ?? 0).toDouble());

  void _showAddDialog() {
    final amtCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    String type = 'expense';
    String category = 'Groceries';
    String date = DateTime.now().toIso8601String().split('T')[0];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          final cats = type == 'income' ? incomeCategories : expenseCategories;
          if (!cats.contains(category)) category = cats[0];

          return Padding(
            padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Add Transaction', style: TextStyle(color: kDark, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  // Type Toggle
                  Row(children: [
                    Expanded(child: GestureDetector(
                      onTap: () => setS(() { type = 'income'; category = incomeCategories[0]; }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: type == 'income' ? kGreen : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: type == 'income' ? kGreen : kBorder),
                        ),
                        child: Center(child: Text('Income ↑', style: TextStyle(color: type == 'income' ? Colors.white : kSub, fontWeight: FontWeight.bold))),
                      ),
                    )),
                    const SizedBox(width: 10),
                    Expanded(child: GestureDetector(
                      onTap: () => setS(() { type = 'expense'; category = expenseCategories[0]; }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: type == 'expense' ? kRed : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: type == 'expense' ? kRed : kBorder),
                        ),
                        child: Center(child: Text('Expense ↓', style: TextStyle(color: type == 'expense' ? Colors.white : kSub, fontWeight: FontWeight.bold))),
                      ),
                    )),
                  ]),
                  const SizedBox(height: 14),
                  TextField(
                    controller: amtCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: kDark),
                    decoration: const InputDecoration(labelText: 'Amount (NPR)', labelStyle: TextStyle(color: kSub), enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: kBorder))),
                  ),
                  const SizedBox(height: 12),
                  const Text('Category', style: TextStyle(color: kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6, runSpacing: 6,
                    children: cats.map((c) => GestureDetector(
                      onTap: () => setS(() => category = c),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: category == c ? (type == 'income' ? kGreen : kRed) : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: category == c ? (type == 'income' ? kGreen : kRed) : kBorder),
                        ),
                        child: Text(c, style: TextStyle(color: category == c ? Colors.white : kSub, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: noteCtrl,
                    style: const TextStyle(color: kDark),
                    decoration: const InputDecoration(labelText: 'Description (optional)', labelStyle: TextStyle(color: kSub), enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: kBorder))),
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
                      style: ElevatedButton.styleFrom(backgroundColor: type == 'income' ? kGreen : kRed, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                      onPressed: () async {
                        if (amtCtrl.text.isNotEmpty) {
                          await ApiService.addTransaction({
                            "type": type,
                            "category": category,
                            "amount": double.tryParse(amtCtrl.text) ?? 0,
                            "description": noteCtrl.text,
                            "date": date,
                          });
                          if (ctx.mounted) Navigator.pop(ctx);
                          loadData();
                        }
                      },
                      child: const Text('Save'),
                    )),
                  ]),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kPrimary));

    final balance = totalIncome - totalExpense;

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: loadData,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary Cards
              Row(children: [
                Expanded(child: _summaryCard('Income', '↑ रु ${totalIncome.toStringAsFixed(0)}', kGreen, const Color(0xFFE6F9F3))),
                const SizedBox(width: 10),
                Expanded(child: _summaryCard('Expenses', '↓ रु ${totalExpense.toStringAsFixed(0)}', kRed, const Color(0xFFFEE2E2))),
                const SizedBox(width: 10),
                Expanded(child: _summaryCard('Balance', '= रु ${balance.toStringAsFixed(0)}', balance >= 0 ? kGreen : kRed, Colors.white)),
              ]),
              const SizedBox(height: 16),

              // Filter Chips
              Row(children: ['All', 'Income', 'Expense'].map((t) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => filterType = t),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: filterType == t ? kPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: filterType == t ? kPrimary : kBorder),
                    ),
                    child: Text(t, style: TextStyle(color: filterType == t ? Colors.white : kSub, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ),
              )).toList()),
              const SizedBox(height: 16),

              if (filtered.isEmpty)
                Center(child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(children: [
                    Icon(Icons.receipt_long_outlined, size: 48, color: kSub.withOpacity(0.4)),
                    const SizedBox(height: 12),
                    const Text('No transactions yet.\nTap + to record one.', textAlign: TextAlign.center, style: TextStyle(color: kSub, fontSize: 14)),
                  ]),
                ))
              else
                ...filtered.map((t) {
                  final isIncome = t['type'] == 'income';
                  final amt = (t['amount'] ?? 0).toDouble();
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
                    child: Row(children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: (isIncome ? kGreen : kRed).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                        child: Icon(isIncome ? Icons.arrow_upward : Icons.arrow_downward, color: isIncome ? kGreen : kRed, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t['category'] ?? '', style: const TextStyle(color: kDark, fontWeight: FontWeight.w700, fontSize: 14)),
                        if ((t['description'] ?? '').isNotEmpty)
                          Text(t['description'], style: const TextStyle(color: kSub, fontSize: 11.5)),
                        Text(t['date'] ?? '', style: const TextStyle(color: kSub, fontSize: 11)),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text(
                          '${isIncome ? '+' : '-'}रु ${amt.toStringAsFixed(0)}',
                          style: TextStyle(color: isIncome ? kGreen : kRed, fontWeight: FontWeight.w900, fontSize: 15),
                        ),
                        GestureDetector(
                          onTap: () async { await ApiService.deleteTransaction(t['id']); loadData(); },
                          child: const Icon(Icons.delete_outline, color: kRed, size: 16),
                        ),
                      ]),
                    ]),
                  );
                }),
              const SizedBox(height: 80),
            ],
          ),
        ),
        Positioned(
          right: 16, bottom: 16,
          child: FloatingActionButton.extended(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add),
            label: const Text('+ Transaction'),
            onPressed: _showAddDialog,
          ),
        ),
      ],
    );
  }

  Widget _summaryCard(String label, String val, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: kSub, fontSize: 10.5, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 12.5), overflow: TextOverflow.ellipsis),
      ]),
    );
  }
}
