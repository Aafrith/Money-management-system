import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/loading_widget.dart';
import '../../core/widgets/error_widget.dart';
import '../../providers/category_provider.dart';
    

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Categories')),
      body: categoriesAsync.when(
        data: (categories) {
          if (categories.isEmpty) {
            return EmptyStateWidget(
              icon: Icons.category_outlined,
              title: 'No Categories',
              subtitle: 'Create categories to easily track your spending',
              action: ElevatedButton.icon(
                onPressed: () => _showAddCategoryDialog(context, ref),
                icon: const Icon(Icons.add),
                label: const Text('Add Category'),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async =>
                ref.read(categoriesProvider.notifier).refresh(),
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.1,
              ),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final bgColor = Color(
                  int.parse(category.color.replaceFirst('#', '0xFF')),
                );

                return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          // Navigate to expenses filtered by this category
                          // context.push('/expenses?category=${category.name}');
                        },
                        child: Stack(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: bgColor.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      category.icon,
                                      style: const TextStyle(fontSize: 24),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    category.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${category.count} transactions',
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
                            // Add Edit/Delete dropdown menu
                            Positioned(
                              top: 4,
                              right: 4,
                              child: PopupMenuButton<String>(
                                icon: const Icon(Icons.more_vert, size: 20),
                                onSelected: (value) {
                                  if (value == 'edit') {
                                    // show edit dialog
                                  } else if (value == 'delete') {
                                    _confirmDeleteCategory(
                                      context,
                                      ref,
                                      category.id,
                                    );
                                  }
                                },
                                itemBuilder: (context) => [
                                  const PopupMenuItem(
                                    value: 'edit',
                                    child: Text('Edit'),
                                  ),
                                  const PopupMenuItem(
                                    value: 'delete',
                                    child: Text(
                                      'Delete',
                                      style: TextStyle(color: Colors.red),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    .animate(delay: Duration(milliseconds: 50 * index))
                    .fadeIn()
                    .scale(begin: const Offset(0.9, 0.9));
              },
            ),
          );
        },
        loading: () => const AppLoadingWidget(),
        error: (error, _) => AppErrorWidget(
          message: 'Failed to load categories',
          onRetry: () => ref.read(categoriesProvider.notifier).refresh(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddCategoryDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddCategoryDialog(BuildContext context, WidgetRef ref) {
    // Basic dialog implementation - complete later with form
  }

  void _confirmDeleteCategory(BuildContext context, WidgetRef ref, String id) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Delete Category"),
          content: const Text(
            "Are you sure? Expenses in this category will not be deleted but will default to 'Other'.",
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("CANCEL"),
            ),
            TextButton(
              onPressed: () {
                ref.read(categoriesProvider.notifier).deleteCategory(id);
                Navigator.of(context).pop();
              },
              child: const Text("DELETE", style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }
}
