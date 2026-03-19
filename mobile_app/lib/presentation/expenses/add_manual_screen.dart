import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/category_model.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../core/widgets/loading_widget.dart';

class AddManualScreen extends ConsumerStatefulWidget {
  const AddManualScreen({super.key});

  @override
  ConsumerState<AddManualScreen> createState() => _AddManualScreenState();
}

class _AddManualScreenState extends ConsumerState<AddManualScreen> {
  final _formKey = GlobalKey<FormState>();
  final _merchantController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  Category? _selectedCategory;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _merchantController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final expense = ExpenseCreate(
        merchant: _merchantController.text,
        amount: double.parse(_amountController.text),
        category: _selectedCategory!.name,
        date: _selectedDate,
        description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
        source: 'manual',
      );

      await ref.read(expensesProvider.notifier).addExpense(expense);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense added successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding expense: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Manual Expense'),
      ),
      body: categoriesAsync.when(
        data: (categories) {
          if (_selectedCategory == null && categories.isNotEmpty) {
            // Set default category if none selected
            // Try to find 'Other' or just pick first
            _selectedCategory = categories.firstWhere(
              (c) => c.name.toLowerCase() == 'other',
              orElse: () => categories.first,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _merchantController,
                    decoration: const InputDecoration(
                      labelText: 'Merchant',
                      hintText: 'Where did you spend?',
                      prefixIcon: Icon(Icons.store),
                    ),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Please enter merchant' : null,
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _amountController,
                    decoration: const InputDecoration(
                      labelText: 'Amount',
                      hintText: '0.00',
                      prefixIcon: Icon(Icons.attach_money),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Please enter amount';
                      if (double.tryParse(value) == null) return 'Please enter a valid number';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  DropdownButtonFormField<Category>(
                    value: _selectedCategory,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      prefixIcon: Icon(Icons.category),
                    ),
                    items: categories.map((category) {
                      return DropdownMenuItem(
                        value: category,
                        child: Row(
                          children: [
                            Text(category.icon),
                            const SizedBox(width: 8),
                            Text(category.name),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _selectedCategory = value);
                    },
                  ),
                  const SizedBox(height: 20),
                  InkWell(
                    onTap: () => _selectDate(context),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date',
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        DateFormat('MMMM dd, yyyy').format(_selectedDate),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description (Optional)',
                      prefixIcon: Icon(Icons.description),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 40),
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save Expense', style: TextStyle(fontSize: 16)),
                  ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: AppLoadingWidget()),
        error: (error, stack) => Center(child: Text('Error loading categories: $error')),
      ),
    );
  }
}
