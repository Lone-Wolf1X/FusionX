import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PortfolioAnalyticsView extends StatefulWidget {
  const PortfolioAnalyticsView({super.key});
  @override
  State<PortfolioAnalyticsView> createState() => _PortfolioAnalyticsViewState();
}

class _PortfolioAnalyticsViewState extends State<PortfolioAnalyticsView> {
  Map<String, dynamic>? analyticsData;
  bool loading = true;

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kGreen = Color(0xFF10B981);
  static const Color kRed = Color(0xFFEF4444);
  static const Color kBorder = Color(0xFFD9E5F5);
  static const Color kSub = Color(0xFF7A94B0);
  static const Color kAmber = Color(0xFFF59E0B);

  @override
  void initState() { super.initState(); loadData(); }

  Future<void> loadData() async {
    setState(() => loading = true);
    final data = await ApiService.getPortfolioAnalytics();
    if (mounted) setState(() { analyticsData = data; loading = false; });
  }

  Color _sharpeColor(double sharpe) {
    if (sharpe >= 1.5) return kGreen;
    if (sharpe >= 0.5) return kAmber;
    return kRed;
  }

  Color _kellyColor(double kelly) {
    if (kelly >= 15) return kGreen;
    if (kelly >= 5) return kAmber;
    return kRed;
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: kPrimary));

    final holdings = (analyticsData?['holdings'] as List?) ?? [];
    final portfolioSharpe = (analyticsData?['portfolio_sharpe'] ?? 0.0).toDouble();
    final portfolioVolatility = (analyticsData?['portfolio_volatility'] ?? 0.0).toDouble();
    final maxDrawdown = (analyticsData?['max_drawdown'] ?? 0.0).toDouble();
    final riskLevel = analyticsData?['risk_level'] ?? 'Moderate';

    return RefreshIndicator(
      onRefresh: loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF1E1B4B), Color(0xFF4338CA)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Portfolio Analytics 📊', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                const Text('Sharpe Ratio · Kelly Criterion · Risk Analysis', style: TextStyle(color: Colors.white60, fontSize: 12)),
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _headerStat('Portfolio Sharpe', portfolioSharpe.toStringAsFixed(2), _sharpeColor(portfolioSharpe)),
                  _vDivider(),
                  _headerStat('Volatility', '${portfolioVolatility.toStringAsFixed(1)}%', kAmber),
                  _vDivider(),
                  _headerStat('Max Drawdown', '${maxDrawdown.toStringAsFixed(1)}%', kRed),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Risk Level Meter
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Overall Risk Level', style: TextStyle(color: kDark, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: riskLevel == 'Low' ? kGreen.withOpacity(0.1) : riskLevel == 'High' ? kRed.withOpacity(0.1) : kAmber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: riskLevel == 'Low' ? kGreen : riskLevel == 'High' ? kRed : kAmber),
                  ),
                  child: Text(
                    riskLevel,
                    style: TextStyle(color: riskLevel == 'Low' ? kGreen : riskLevel == 'High' ? kRed : kAmber, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: riskLevel == 'Low' ? 0.25 : riskLevel == 'Moderate' ? 0.5 : riskLevel == 'High' ? 0.75 : 1.0,
                    backgroundColor: kBorder,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      riskLevel == 'Low' ? kGreen : riskLevel == 'High' ? kRed : kAmber,
                    ),
                    minHeight: 8,
                  ),
                )),
              ]),
            ]),
          ),
          const SizedBox(height: 16),

          // Per-Stock Analytics
          if (holdings.isNotEmpty) ...[
            const Text('Per-Stock Analytics', style: TextStyle(color: kDark, fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ...holdings.map((h) {
              final sharpe = (h['sharpe_ratio'] ?? 0.0).toDouble();
              final kelly = (h['kelly_pct'] ?? 0.0).toDouble();
              final weight = (h['weight_pct'] ?? 0.0).toDouble();
              final correlation = (h['avg_correlation'] ?? 0.0).toDouble();

              return Card(
                color: Colors.white,
                elevation: 1,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: kBorder)),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text(h['symbol'] ?? '', style: const TextStyle(color: kPrimary, fontWeight: FontWeight.w900, fontSize: 16)),
                      const Spacer(),
                      Text('Weight: ${weight.toStringAsFixed(1)}%', style: const TextStyle(color: kSub, fontSize: 12)),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      _metricBox('Sharpe Ratio', sharpe.toStringAsFixed(2), _sharpeColor(sharpe)),
                      const SizedBox(width: 8),
                      _metricBox('Kelly %', '${kelly.toStringAsFixed(1)}%', _kellyColor(kelly)),
                      const SizedBox(width: 8),
                      _metricBox('Correlation', correlation.toStringAsFixed(2), correlation.abs() < 0.3 ? kGreen : correlation.abs() < 0.7 ? kAmber : kRed),
                    ]),
                  ]),
                ),
              );
            }),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder)),
              child: const Column(children: [
                Icon(Icons.analytics_outlined, size: 48, color: kSub),
                SizedBox(height: 12),
                Text('No portfolio data available.\nAdd trades in Portfolio Manager to see analytics.', textAlign: TextAlign.center, style: TextStyle(color: kSub, fontSize: 14)),
              ]),
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _headerStat(String label, String val, Color color) {
    return Column(children: [
      Text(val, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10.5)),
    ]);
  }

  Widget _vDivider() => Container(width: 1, height: 36, color: Colors.white24);

  Widget _metricBox(String label, String val, Color color) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: color.withOpacity(0.07), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
        Text(val, style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: kSub, fontSize: 9.5, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
      ]),
    ));
  }
}
