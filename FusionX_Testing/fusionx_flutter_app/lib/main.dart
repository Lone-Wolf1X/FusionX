import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'views/dashboard_view.dart';
import 'views/stock_scanner_view.dart';
import 'views/portfolio_manager_view.dart';
import 'views/trading_journal_view.dart';
import 'views/backtester_view.dart';
import 'views/watchlist_view.dart';
import 'views/portfolio_analytics_view.dart';
import 'views/wealth_os_view.dart';
import 'views/transactions_view.dart';

void main() {
  runApp(const FusionXApp());
}

class FusionXApp extends StatelessWidget {
  const FusionXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FusionX Trading & Wealth OS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF0F5FC),
        primaryColor: const Color(0xFF0284C7),
        cardColor: Colors.white,
        fontFamily: GoogleFonts.inter().fontFamily,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF0284C7),
          secondary: Color(0xFF10B981),
          surface: Colors.white,
          background: Color(0xFFF0F5FC),
        ),
        useMaterial3: false,
      ),
      home: const MainHomeScreen(),
    );
  }
}

class MainHomeScreen extends StatefulWidget {
  const MainHomeScreen({super.key});

  @override
  State<MainHomeScreen> createState() => _MainHomeScreenState();
}

class _MainHomeScreenState extends State<MainHomeScreen> {
  int _selectedIndex = 0;
  int _wealthSubIndex = 0; // sub-tab inside Wealth section

  static const Color kPrimary = Color(0xFF0284C7);
  static const Color kDark = Color(0xFF0C1929);
  static const Color kSub = Color(0xFF7A94B0);
  static const Color kBorder = Color(0xFFD9E5F5);

  // Top-level nav sections
  final List<_NavItem> _navItems = const [
    _NavItem('Dashboard', Icons.dashboard_outlined, Icons.dashboard),
    _NavItem('Scanner', Icons.manage_search, Icons.manage_search),
    _NavItem('Portfolio', Icons.show_chart, Icons.show_chart),
    _NavItem('Journal', Icons.book_outlined, Icons.book),
    _NavItem('Wealth', Icons.account_balance_wallet_outlined, Icons.account_balance_wallet),
    _NavItem('More', Icons.grid_view_outlined, Icons.grid_view),
  ];

  bool _showMore = false;

  // "More" grid items
  final List<_MoreItem> _moreItems = const [
    _MoreItem('Watchlist', Icons.bookmark_outlined, Color(0xFF0284C7)),
    _MoreItem('Backtester', Icons.science_outlined, Color(0xFF7C3AED)),
    _MoreItem('Analytics', Icons.analytics_outlined, Color(0xFF0891B2)),
  ];

  String get _currentTitle {
    switch (_selectedIndex) {
      case 0: return 'FusionX Dashboard';
      case 1: return 'AI Stock Scanner';
      case 2: return 'Portfolio Manager';
      case 3: return 'Trading Journal';
      case 4:
        switch (_wealthSubIndex) {
          case 0: return 'Personal Wealth OS';
          case 1: return 'Transactions';
          default: return 'Personal Wealth OS';
        }
      case 5: return 'More Tools';
      case 10: return 'Watchlist';
      case 11: return 'Backtesting Lab';
      case 12: return 'Portfolio Analytics';
      default: return 'FusionX';
    }
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0: return const DashboardView();
      case 1: return const StockScannerView();
      case 2: return const PortfolioManagerView();
      case 3: return const TradingJournalView();
      case 4: return _buildWealthSection();
      case 5: return _buildMoreGrid();
      case 10: return const WatchlistView();
      case 11: return const BacktesterView();
      case 12: return const PortfolioAnalyticsView();
      default: return const DashboardView();
    }
  }

  Widget _buildWealthSection() {
    return Column(
      children: [
        // Wealth sub-tabs
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _wealthTab('Wealth OS', 0, Icons.account_balance_wallet_outlined),
              const SizedBox(width: 8),
              _wealthTab('Transactions', 1, Icons.receipt_long_outlined),
            ],
          ),
        ),
        Expanded(
          child: IndexedStack(
            index: _wealthSubIndex,
            children: const [
              WealthOsView(),
              TransactionsView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _wealthTab(String label, int idx, IconData icon) {
    final selected = _wealthSubIndex == idx;
    return GestureDetector(
      onTap: () => setState(() => _wealthSubIndex = idx),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? kPrimary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? kPrimary : kBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: selected ? Colors.white : kSub),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: selected ? Colors.white : kSub, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildMoreGrid() {
    return GridView.count(
      crossAxisCount: 2,
      padding: const EdgeInsets.all(20),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        ..._moreItems.asMap().entries.map((entry) {
          final idx = entry.key;
          final item = entry.value;
          return GestureDetector(
            onTap: () => setState(() => _selectedIndex = 10 + idx),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: kBorder),
                boxShadow: const [BoxShadow(color: Color(0x080C1929), blurRadius: 8, offset: Offset(0, 3))],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: item.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(item.icon, color: item.color, size: 28),
                  ),
                  const SizedBox(height: 12),
                  Text(item.label, style: const TextStyle(color: kDark, fontWeight: FontWeight.bold, fontSize: 15)),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  int get _bottomNavIndex {
    if (_selectedIndex >= 10) return 5; // show "More" as active
    return _selectedIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF38BDF8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.bolt, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                _currentTitle,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: Color(0xFF0C1929),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          if (_selectedIndex >= 10)
            IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: kPrimary, size: 18),
              tooltip: 'Back to More',
              onPressed: () => setState(() => _selectedIndex = 5),
            ),
          IconButton(
            icon: const Icon(Icons.refresh, color: kPrimary),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFD9E5F5))),
          boxShadow: [BoxShadow(color: Color(0x0D0C1929), blurRadius: 10, offset: Offset(0, -3))],
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex,
          onTap: (index) => setState(() {
            _selectedIndex = index;
            if (index == 5) _showMore = false; // show More grid
          }),
          backgroundColor: Colors.white,
          selectedItemColor: kPrimary,
          unselectedItemColor: kSub,
          selectedFontSize: 10.5,
          unselectedFontSize: 10.5,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: _navItems.map((n) => BottomNavigationBarItem(
            icon: Icon(n.icon),
            activeIcon: Icon(n.activeIcon),
            label: n.label,
          )).toList(),
        ),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  const _NavItem(this.label, this.icon, this.activeIcon);
}

class _MoreItem {
  final String label;
  final IconData icon;
  final Color color;
  const _MoreItem(this.label, this.icon, this.color);
}
