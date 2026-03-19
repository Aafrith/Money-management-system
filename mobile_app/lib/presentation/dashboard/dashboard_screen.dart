import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/loading_widget.dart';
import '../../core/widgets/error_widget.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/expense_provider.dart';
import '../../providers/theme_provider.dart';
import '../../data/models/dashboard_models.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final timeRange = ref.watch(timeRangeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          PopupMenuButton<String>(
            initialValue: timeRange,
            icon: const Icon(Icons.calendar_today_outlined),
            onSelected: (value) {
              ref.read(timeRangeProvider.notifier).state = value;
            },
            itemBuilder: (context) => AppConstants.timeRangeLabels.entries
                .map((e) => PopupMenuItem(value: e.key, child: Text(e.value)))
                .toList(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: statsAsync.when(
        data: (stats) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardStatsProvider);
            ref.invalidate(expensesProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSummaryCards(context, ref, stats)
                  .animate()
                  .fadeIn(duration: 400.ms, curve: Curves.easeOut)
                  .slideY(begin: 0.1, end: 0),

              const SizedBox(height: 24),

              if (stats.trendData.isNotEmpty) ...[
                Text(
                  'Expense Trends',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildTrendChart(
                  context,
                  ref,
                  stats.trendData,
                ).animate(delay: 100.ms).fadeIn().slideY(begin: 0.1, end: 0),
                const SizedBox(height: 24),
              ],

              if (stats.categoryBreakdown.isNotEmpty) ...[
                Text(
                  'Spending by Category',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildCategoryChart(
                  context,
                  ref,
                  stats.categoryBreakdown,
                ).animate(delay: 200.ms).fadeIn().slideY(begin: 0.1, end: 0),
                const SizedBox(height: 24),
              ],

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Transactions',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.go('/expenses'),
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _buildRecentList(
                context,
                ref,
                stats.recentTransactions,
              ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.1, end: 0),
            ],
          ),
        ),
        loading: () => const AppLoadingWidget(),
        error: (error, _) => AppErrorWidget(
          message: 'Failed to load dashboard',
          onRetry: () => ref.invalidate(dashboardStatsProvider),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddExpenseOptions(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddExpenseOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Add Expense',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              _buildOptionTile(
                context,
                icon: Icons.edit_note,
                title: 'Manual Entry',
                subtitle: 'Type details manually',
                color: Colors.orange,
                onTap: () {
                  Navigator.pop(context);
                  context.go('/expenses/add/manual');
                },
              ),
              _buildOptionTile(
                context,
                icon: Icons.receipt_long,
                title: 'Scan Receipt',
                subtitle: 'Take a photo of your receipt',
                color: Colors.green,
                onTap: () {
                  Navigator.pop(context);
                  context.go('/expenses/add/receipt');
                },
              ),
              _buildOptionTile(
                context,
                icon: Icons.sms,
                title: 'Automated SMS',
                subtitle: 'Capture bank SMS messages',
                color: Colors.blue,
                onTap: () {
                  Navigator.pop(context);
                  context.go('/expenses/add/sms');
                },
              ),
              _buildOptionTile(
                context,
                icon: Icons.mic,
                title: 'Voice Note',
                subtitle: 'Record expense details',
                color: Colors.purple,
                onTap: () {
                  Navigator.pop(context);
                  context.go('/expenses/add/voice');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.1),
        child: Icon(icon, color: color),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle),
      onTap: onTap,
    );
  }

  Widget _buildSummaryCards(
    BuildContext context,
    WidgetRef ref,
    DashboardStats stats,
  ) {
    final currency = ref.watch(currencyProvider);
    final format =
        AppConstants.currencies[currency] ?? AppConstants.currencies['USD']!;

    final isIncrease = stats.monthlyChange > 0;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 2,
            child: Card(
              margin: EdgeInsets.zero,
              color: Theme.of(context).colorScheme.primary,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Total Expenses',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        format.format(stats.totalExpenses),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 1,
            child: Column(
              children: [
                Expanded(
                  child: Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isIncrease
                                ? Icons.trending_up
                                : Icons.trending_down,
                            color: isIncrease ? Colors.red : Colors.green,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${stats.monthlyChange.abs().toStringAsFixed(1)}%',
                            style: TextStyle(
                              color: isIncrease ? Colors.red : Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${stats.transactionCount}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Trans',
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendChart(
    BuildContext context,
    WidgetRef ref,
    List<TrendData> data,
  ) {
    if (data.isEmpty) return const SizedBox.shrink();

    final maxVal = data.map((e) => e.amount).reduce((a, b) => a > b ? a : b);

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: maxVal > 0 ? maxVal / 4 : 1,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.5),
                  strokeWidth: 1,
                  dashArray: [5, 5],
                ),
              ),
              titlesData: FlTitlesData(
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      if (value.toInt() < 0 || value.toInt() >= data.length) {
                        return const SizedBox.shrink();
                      }
                      // Show sparse dates if many items
                      if (data.length > 10 &&
                          value.toInt() % (data.length ~/ 5) != 0) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          data[value.toInt()].date,
                          style: TextStyle(
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            fontSize: 10,
                          ),
                        ),
                      );
                    },
                    reservedSize: 24,
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) {
                      if (value == 0) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          _compactFormat(value),
                          style: TextStyle(
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            fontSize: 10,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: data.asMap().entries.map((e) {
                    return FlSpot(e.key.toDouble(), e.value.amount);
                  }).toList(),
                  isCurved: true,
                  color: Theme.of(context).colorScheme.primary,
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withValues(alpha: 0.1),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _compactFormat(double value) {
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}m';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}k';
    return value.toStringAsFixed(0);
  }

  Widget _buildCategoryChart(
    BuildContext context,
    WidgetRef ref,
    List<CategoryStat> data,
  ) {
    if (data.isEmpty) return const SizedBox.shrink();

    final currency = ref.watch(currencyProvider);
    final format =
        AppConstants.currencies[currency] ?? AppConstants.currencies['USD']!;

    final total = data.map((e) => e.value).reduce((a, b) => a + b);

    // Sort and take top 5 + Others
    final sortedData = List<CategoryStat>.from(data)
      ..sort((a, b) => b.value.compareTo(a.value));

    final displayData = sortedData.take(5).toList();
    if (sortedData.length > 5) {
      final othersValue = sortedData
          .skip(5)
          .map((e) => e.value)
          .reduce((a, b) => a + b);
      final othersCount = sortedData
          .skip(5)
          .map((e) => e.count)
          .reduce((a, b) => a + b);
      displayData.add(
        CategoryStat(
          name: 'Others',
          value: othersValue,
          color: '#9CA3AF',
          count: othersCount,
        ),
      );
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 60,
                      sections: displayData.map((stat) {
                        final color = Color(
                          int.parse(stat.color.replaceFirst('#', '0xFF')),
                        );
                        return PieChartSectionData(
                          color: color,
                          value: stat.value,
                          title: '',
                          radius: 20,
                        );
                      }).toList(),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Total',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        format.format(total),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ...displayData.map((stat) {
              final color = Color(
                int.parse(stat.color.replaceFirst('#', '0xFF')),
              );
              final percentage = (stat.value / total * 100).toStringAsFixed(1);

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        stat.name,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '$percentage%',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 80,
                      child: Text(
                        format.format(stat.value),
                        textAlign: TextAlign.right,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentList(
    BuildContext context,
    WidgetRef ref,
    List<RecentTransaction> data,
  ) {
    if (data.isEmpty) {
      return const Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.receipt_long, size: 48, color: Colors.grey),
              SizedBox(height: 16),
              Text(
                'No recent transactions',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    final currency = ref.watch(currencyProvider);
    final format =
        AppConstants.currencies[currency] ?? AppConstants.currencies['USD']!;

    return Card(
      margin: EdgeInsets.zero,
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: data.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final tx = data[index];

          IconData sourceIcon;
          Color sourceColor;
          switch (tx.source) {
            case 'sms':
              sourceIcon = Icons.textsms;
              sourceColor = Colors.blue;
              break;
            case 'receipt':
              sourceIcon = Icons.receipt;
              sourceColor = Colors.green;
              break;
            case 'voice':
              sourceIcon = Icons.mic;
              sourceColor = Colors.purple;
              break;
            default:
              sourceIcon = Icons.edit;
              sourceColor = Colors.orange;
          }

          return ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Icon(sourceIcon, color: sourceColor, size: 20),
            ),
            title: Text(
              tx.merchant,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${tx.category} • ${DateFormat('MMM d').format(tx.date)}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
            trailing: Text(
              format.format(tx.amount),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          );
        },
      ),
    );
  }
}
