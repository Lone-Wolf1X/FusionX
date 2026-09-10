import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiService {
  static String baseUrl = "http://192.168.1.6:8001";
  static List<String> fallbackUrls = [
    "http://192.168.1.6:8001",
    "http://127.0.0.1:8001",
    "http://10.0.2.2:8001",
    "http://161.118.189.212",
  ];

  static Future<http.Response?> _getWithFallback(String endpoint) async {
    for (String url in fallbackUrls) {
      try {
        final res = await http.get(Uri.parse("$url$endpoint")).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          baseUrl = url;
          return res;
        }
      } catch (_) {}
    }
    return null;
  }

  // ─── FINANCE: Summary, Assets, Liabilities, Transactions ─────────────────

  static Future<Map<String, dynamic>> getFinanceSummary() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/finance/summary"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return {};
  }

  static Future<List<dynamic>> getFinanceAssets() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/finance/assets"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<List<dynamic>> getFinanceLiabilities() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/finance/liabilities"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<List<dynamic>> getFinanceTransactions() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/finance/transactions"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<bool> addAsset(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/finance/assets"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> updateAsset(int id, Map<String, dynamic> data) async {
    try {
      final res = await http.put(
        Uri.parse("$baseUrl/api/finance/assets/$id"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteAsset(int id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/finance/assets/$id"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> addLiability(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/finance/liabilities"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> updateLiability(int id, Map<String, dynamic> data) async {
    try {
      final res = await http.put(
        Uri.parse("$baseUrl/api/finance/liabilities/$id"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteLiability(int id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/finance/liabilities/$id"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> addTransaction(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/finance/transactions"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteTransaction(int id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/finance/transactions/$id"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  // ─── DASHBOARD & SCANNER ──────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final res = await _getWithFallback("/api/dashboard");
      if (res != null && res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return {};
  }

  static Future<Map<String, dynamic>> getScanResults() async {
    try {
      final res = await _getWithFallback("/api/scan");
      if (res != null && res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return {"count": 0, "stocks": []};
  }

  static Future<List<dynamic>> getSuggestions() async {
    try {
      final res = await _getWithFallback("/api/suggestions");
      if (res != null && res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return (data['strong_buy'] as List<dynamic>?) ?? [];
      }
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<Map<String, dynamic>> getStockDetail(String symbol) async {
    try {
      final res = await _getWithFallback("/api/stock/$symbol");
      if (res != null && res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error fetching stock detail: $e"); }
    return {};
  }

  // ─── PORTFOLIO MANAGER ────────────────────────────────────────────────────

  static Future<List<dynamic>> getPortfolios() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/portfolios"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<Map<String, dynamic>?> createPortfolio(String name) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/portfolios"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"name": name}),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return null;
  }

  static Future<bool> deletePortfolio(int id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/portfolios/$id"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<List<dynamic>> getPortfolioTrades(int portfolioId) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/portfolios/$portfolioId/trades"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<bool> addTrade(int portfolioId, Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/portfolios/$portfolioId/trades"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteTrade(int portfolioId, int tradeId) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/portfolios/$portfolioId/trades/$tradeId"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  // ─── TRADING JOURNAL ──────────────────────────────────────────────────────

  static Future<List<dynamic>> getJournalEntries() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/journal"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<bool> addJournalEntry(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/journal"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> deleteJournalEntry(int id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/journal/$id"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  // ─── BACKTESTING ──────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> runBacktest(Map<String, dynamic> params) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/backtest"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(params),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return {};
  }

  // ─── WATCHLIST ────────────────────────────────────────────────────────────

  static Future<List<dynamic>> getWatchlist() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/watchlist-detail"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return [];
  }

  static Future<bool> addToWatchlist(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/api/watchlist"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(data),
      );
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> removeFromWatchlist(String symbol) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/api/watchlist/$symbol"));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  // ─── PORTFOLIO ANALYTICS ─────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getPortfolioAnalytics() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/api/portfolio-analytics"));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) { debugPrint("Error: $e"); }
    return {};
  }
}
