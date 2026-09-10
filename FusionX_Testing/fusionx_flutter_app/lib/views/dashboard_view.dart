import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import 'stock_detail_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? dashboardData;
  List<dynamic> suggestions = [];
  List<dynamic> allStocks = [];
  bool loading = true;
  String selectedTimeframe = '1W';
  late TabController _tabController;

  final Map<String, List<FlSpot>> indexData = {
    '1D': const [FlSpot(0, 2720), FlSpot(1, 2728), FlSpot(2, 2715), FlSpot(3, 2735), FlSpot(4, 2740), FlSpot(5, 2748.52)],
    '1W': const [FlSpot(0, 2680), FlSpot(1, 2710), FlSpot(2, 2695), FlSpot(3, 2730), FlSpot(4, 2715), FlSpot(5, 2748.52)],
    '1M': const [FlSpot(0, 2550), FlSpot(1, 2610), FlSpot(2, 2590), FlSpot(3, 2670), FlSpot(4, 2700), FlSpot(5, 2748.52)],
    '1Y': const [FlSpot(0, 2100), FlSpot(1, 2250), FlSpot(2, 2400), FlSpot(3, 2350), FlSpot(4, 2600), FlSpot(5, 2748.52)],
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    loadDashboard();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> loadDashboard() async {
    setState(() => loading = true);
    final dash = await ApiService.getDashboard();
    final sugg = await ApiService.getSuggestions();
    final scan = await ApiService.getScanResults();

    if (mounted) {
      setState(() {
        dashboardData = dash;
        suggestions = sugg;
        allStocks = (scan['stocks'] as List<dynamic>?) ?? [];
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
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)));
    }

    final totalStocks = dashboardData?['total_stocks'] ?? (allStocks.isNotEmpty ? allStocks.length : 357);
    final bullishCount = dashboardData?['bullish_count'] ?? 42;
    final bearishCount = dashboardData?['bearish_count'] ?? 18;

    // Filter Top Gainers and Top Losers
    final sortedStocks = List<dynamic>.from(allStocks);
    sortedStocks.sort((a, b) {
      final ca = (a['change_pct'] ?? a['change'] ?? 0.0) as num;
      final cb = (b['change_pct'] ?? b['change'] ?? 0.0) as num;
      return cb.compareTo(ca);
    });

    final topGainers = sortedStocks.take(5).toList();
    final topLosers = sortedStocks.reversed.take(5).toList();

    return RefreshIndicator(
      onRefresh: loadDashboard,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Welcome Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0C1929), Color(0xFF0284C7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [BoxShadow(color: Color(0x330284C7), blurRadius: 12, offset: Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('NEPSE Live Dashboard Studio', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.fiber_manual_record, color: Color(0xFF10B981), size: 10),
                          SizedBox(width: 4),
                          Text('LIVE MARKET', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: const [
                    Text('2,748.52', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                    SizedBox(width: 10),
                    Text('+34.20 (+1.26%)', style: TextStyle(color: Color(0xFF34D399), fontSize: 15, fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('Daily High: 2,755.10  •  Daily Low: 2,712.40', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // NEPSE Interactive Line Chart Studio
          _buildChartCard(),

          const SizedBox(height: 20),

          // Top Gainers, Top Losers & Live Floorsheet Tabbed Container
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFD9E5F5)),
              boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
            ),
            child: Column(
              children: [
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF0284C7),
                  unselectedLabelColor: const Color(0xFF7A94B0),
                  indicatorColor: const Color(0xFF0284C7),
                  indicatorWeight: 3,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  tabs: const [
                    Tab(text: '🟢 Top Gainers'),
                    Tab(text: '🔴 Top Losers'),
                    Tab(text: '📜 Live Floorsheet'),
                  ],
                ),
                SizedBox(
                  height: 320,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildStockTable(topGainers, isGainer: true),
                      _buildStockTable(topLosers, isGainer: false),
                      _buildFloorsheetList(),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Market Stats Summary Grid
          const Text('Market Indicators & Statistics', style: TextStyle(color: Color(0xFF0C1929), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _statMetricCard('Turnover', 'रु 8.42B', Icons.bar_chart, const Color(0xFF0284C7))),
              const SizedBox(width: 10),
              Expanded(child: _statMetricCard('Volume', '18.5M', Icons.show_chart, const Color(0xFF8B5CF6))),
              const SizedBox(width: 10),
              Expanded(child: _statMetricCard('Total Trades', '112.4K', Icons.swap_horiz, const Color(0xFFF59E0B))),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _marketCard('Total Tracked', '$totalStocks', const Color(0xFF0C1929), Colors.white)),
              const SizedBox(width: 10),
              Expanded(child: _marketCard('Bullish Signals', '$bullishCount', const Color(0xFF059669), const Color(0xFFE6F9F3))),
              const SizedBox(width: 10),
              Expanded(child: _marketCard('Bearish Signals', '$bearishCount', const Color(0xFFDC2626), const Color(0xFFFEE2E2))),
            ],
          ),

          const SizedBox(height: 20),

          // Market Breadth (Advances / Declines)
          _buildMarketBreadthCard(),

          const SizedBox(height: 20),

          // Volume Distribution Bar Chart
          _buildVolumeChartCard(),

          const SizedBox(height: 20),

          // Top Sectors Performance
          const Text('Sector Performance Overview', style: TextStyle(color: Color(0xFF0C1929), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _sectorChip('Hydropower', '+3.4%', const Color(0xFF059669), const Color(0xFFE6F9F3)),
                _sectorChip('Banking', '+1.8%', const Color(0xFF059669), const Color(0xFFE6F9F3)),
                _sectorChip('Life Insurance', '+2.1%', const Color(0xFF059669), const Color(0xFFE6F9F3)),
                _sectorChip('Microfinance', '-0.5%', const Color(0xFFDC2626), const Color(0xFFFEE2E2)),
                _sectorChip('Hotels & Tourism', '+0.9%', const Color(0xFF059669), const Color(0xFFE6F9F3)),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // AI Buy Suggestions Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('Top AI Buy Candidates', style: TextStyle(color: Color(0xFF0C1929), fontSize: 16, fontWeight: FontWeight.bold)),
              Text('Tap Stock for Details', style: TextStyle(color: Color(0xFF0284C7), fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 10),
          ...suggestions.take(5).map((item) {
            final sym = item['symbol'] ?? 'STOCK';
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
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFF10B981).withOpacity(0.15),
                  child: const Text('BUY', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 11)),
                ),
                title: Text(sym, style: const TextStyle(color: Color(0xFF0284C7), fontWeight: FontWeight.w800, fontSize: 15)),
                subtitle: Text('Score: ${item['score'] ?? 85}/100 • ${item['reason'] ?? "RSI Oversold & MACD Crossover"}', style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 11.5)),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('रु ${item['close'] ?? item['price'] ?? '-'}', style: const TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right, color: Color(0xFF7A94B0), size: 18),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // NEPSE Interactive Line Chart Card
  Widget _buildChartCard() {
    final spots = indexData[selectedTimeframe] ?? indexData['1W']!;

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
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('NEPSE Index Trend Studio', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('Technical Moving Trend', style: TextStyle(color: Color(0xFF7A94B0), fontSize: 11)),
                ],
              ),
              Row(
                children: ['1D', '1W', '1M', '1Y'].map((tf) {
                  final isSelected = selectedTimeframe == tf;
                  return GestureDetector(
                    onTap: () => setState(() => selectedTimeframe = tf),
                    child: Container(
                      margin: const EdgeInsets.only(left: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        tf,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF64748B),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => const FlLine(color: Color(0xFFF1F5F9), strokeWidth: 1),
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
                    dotData: const FlDotData(show: true),
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
        ],
      ),
    );
  }

  Widget _buildStockTable(List<dynamic> stocks, {required bool isGainer}) {
    if (stocks.isEmpty) {
      return const Center(child: Text('No stock data available'));
    }

    return ListView.separated(
      itemCount: stocks.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (ctx, idx) {
        final item = stocks[idx];
        final sym = item['symbol'] ?? 'STOCK';
        final ltp = (item['close'] ?? item['ltp'] ?? item['price'] ?? 0.0).toDouble();
        final changePct = ((item['change_pct'] ?? item['change'] ?? 0.0) as num).toDouble();

        return ListTile(
          onTap: () => _openStockDetail(sym),
          leading: CircleAvatar(
            backgroundColor: isGainer ? const Color(0xFFE6F9F3) : const Color(0xFFFEE2E2),
            child: Text(
              '#${idx + 1}',
              style: TextStyle(
                color: isGainer ? const Color(0xFF059669) : const Color(0xFFDC2626),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          title: Text(sym, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0284C7), fontSize: 14)),
          subtitle: Text('RSI: ${(item['rsi'] ?? 50).toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 11)),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('रु ${ltp.toStringAsFixed(1)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0C1929), fontSize: 14)),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isGainer ? const Color(0xFFE6F9F3) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${changePct >= 0 ? '+' : ''}${changePct.toStringAsFixed(2)}%',
                  style: TextStyle(
                    color: isGainer ? const Color(0xFF059669) : const Color(0xFFDC2626),
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFloorsheetList() {
    final mockFloorsheet = [
      {'time': '14:59:12', 'sym': 'UPPER', 'buy': '58', 'sell': '34', 'qty': '1,200', 'rate': '542.10'},
      {'time': '14:58:05', 'sym': 'CHCL', 'buy': '42', 'sell': '19', 'qty': '500', 'rate': '485.00'},
      {'time': '14:56:40', 'sym': 'NICA', 'buy': '17', 'sell': '58', 'qty': '850', 'rate': '420.50'},
      {'time': '14:52:15', 'sym': 'HDHPC', 'buy': '34', 'sell': '49', 'qty': '2,000', 'rate': '210.00'},
      {'time': '14:49:00', 'sym': 'EBL', 'buy': '12', 'sell': '38', 'qty': '400', 'rate': '615.00'},
    ];

    return ListView.separated(
      itemCount: mockFloorsheet.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (ctx, idx) {
        final f = mockFloorsheet[idx];
        return ListTile(
          onTap: () => _openStockDetail(f['sym']!),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
            child: Text(f['sym']!, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0284C7), fontSize: 12)),
          ),
          title: Text('Buy #${f['buy']} ➔ Sell #${f['sell']}', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
          subtitle: Text('Time: ${f['time']} • Qty: ${f['qty']}', style: const TextStyle(fontSize: 11, color: Color(0xFF7A94B0))),
          trailing: Text('रु ${f['rate']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0C1929), fontSize: 13.5)),
        );
      },
    );
  }

  // Market Breadth Card (Advances vs Declines)
  Widget _buildMarketBreadthCard() {
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
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Market Breadth (Advances / Declines)', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
              Text('72% Bullish', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Row(
              children: [
                Expanded(flex: 168, child: Container(height: 10, color: const Color(0xFF10B981))),
                Expanded(flex: 10, child: Container(height: 10, color: const Color(0xFF94A3B8))),
                Expanded(flex: 64, child: Container(height: 10, color: const Color(0xFFEF4444))),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('🟢 168 Advanced', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 12)),
              Text('⚪ 10 Unchanged', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 12)),
              Text('🔴 64 Declined', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  // Volume Bar Chart Card
  Widget _buildVolumeChartCard() {
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
          const Text('Sector Volume Distribution (in Millions)', style: TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          SizedBox(
            height: 150,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, meta) {
                        const style = TextStyle(color: Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.w600);
                        switch (val.toInt()) {
                          case 0: return const Text('Hydro', style: style);
                          case 1: return const Text('Bank', style: style);
                          case 2: return const Text('Insur', style: style);
                          case 3: return const Text('Micro', style: style);
                          case 4: return const Text('Other', style: style);
                          default: return const Text('');
                        }
                      },
                    ),
                  ),
                ),
                barGroups: [
                  BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 6.8, color: const Color(0xFF0284C7), width: 18, borderRadius: BorderRadius.circular(4))]),
                  BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 4.5, color: const Color(0xFF0EA5E9), width: 18, borderRadius: BorderRadius.circular(4))]),
                  BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 3.2, color: const Color(0xFF8B5CF6), width: 18, borderRadius: BorderRadius.circular(4))]),
                  BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 2.4, color: const Color(0xFFF59E0B), width: 18, borderRadius: BorderRadius.circular(4))]),
                  BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 1.6, color: const Color(0xFF10B981), width: 18, borderRadius: BorderRadius.circular(4))]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statMetricCard(String title, String value, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD9E5F5)),
        boxShadow: const [BoxShadow(color: Color(0x080C1929), blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: accentColor),
              const SizedBox(width: 4),
              Text(title, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(color: const Color(0xFF0C1929), fontWeight: FontWeight.w900, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _marketCard(String title, String val, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD9E5F5)),
        boxShadow: const [BoxShadow(color: Color(0x080C1929), blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF7A94B0), fontSize: 10.5, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(val, style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 17)),
        ],
      ),
    );
  }

  Widget _sectorChip(String name, String change, Color textColor, Color bgColor) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Text(name, style: const TextStyle(color: Color(0xFF0C1929), fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 6),
          Text(change, style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 12)),
        ],
      ),
    );
  }
}
