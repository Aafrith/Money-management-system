import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/parser_models.dart';
import '../../data/models/category_model.dart';
import '../../data/services/parser_service.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../core/widgets/loading_widget.dart';

class AddReceiptScreen extends ConsumerStatefulWidget {
  const AddReceiptScreen({super.key});

  @override
  ConsumerState<AddReceiptScreen> createState() => _AddReceiptScreenState();
}

class _AddReceiptScreenState extends ConsumerState<AddReceiptScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _image;
  bool _isParsing = false;
  ParsedExpenseData? _parsedData;
  
  // Edit controllers
  final _formKey = GlobalKey<FormState>();
  final _merchantController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  Category? _selectedCategory;
  bool _isSaving = false;

  @override
  void dispose() {
    _merchantController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final XFile? pickedFile = await _picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
        _parsedData = null;
      });
      _parseReceipt();
    }
  }

  Future<void> _parseReceipt() async {
    if (_image == null) return;
    setState(() => _isParsing = true);

    try {
      final data = await ref.read(parserServiceProvider).parseReceipt(_image!);
      setState(() {
        _parsedData = data;
        _merchantController.text = data.merchant ?? '';
        _amountController.text = data.amount?.toString() ?? '';
        _descriptionController.text = data.description ?? '';
        _selectedDate = data.date ?? DateTime.now();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error parsing receipt: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isParsing = false);
    }
  }

  Future<void> _saveExpense() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final expense = ExpenseCreate(
        merchant: _merchantController.text,
        amount: double.parse(_amountController.text),
        category: _selectedCategory!.name,
        date: _selectedDate,
        description: _descriptionController.text.isEmpty ? null : _descriptionController.text,
        source: 'receipt',
      );

      await ref.read(expensesProvider.notifier).addExpense(expense);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense saved successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving expense: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Receipt'),
      ),
      body: categoriesAsync.when(
        data: (categories) {
          // Initialize selected category if needed
          if (_selectedCategory == null && categories.isNotEmpty) {
             if (_parsedData?.category != null) {
               _selectedCategory = categories.firstWhere(
                 (c) => c.name.toLowerCase() == _parsedData!.category!.toLowerCase(),
                 orElse: () => categories.firstWhere(
                   (c) => c.name.toLowerCase() == 'other',
                   orElse: () => categories.first,
                 ),
               );
             } else {
               _selectedCategory = categories.firstWhere(
                 (c) => c.name.toLowerCase() == 'other',
                 orElse: () => categories.first,
               );
             }
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_image == null) ...[
                  const Icon(Icons.receipt_long, size: 100, color: Colors.grey),
                  const SizedBox(height: 24),
                  const Text(
                    'Scan your receipt to automatically extract details',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  const SizedBox(height: 48),
                  ElevatedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Take Photo'),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Choose from Gallery'),
                    style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(16)),
                  ),
                ] else ...[
                  Center(
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_image!, height: 200, width: double.infinity, fit: BoxFit.cover),
                        ),
                        Positioned(
                          right: 8,
                          top: 8,
                          child: CircleAvatar(
                            backgroundColor: Colors.black54,
                            child: IconButton(
                              icon: const Icon(Icons.refresh, color: Colors.white),
                              onPressed: () => setState(() => _image = null),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (_isParsing) ...[
                    const Center(child: AppLoadingWidget()),
                    const SizedBox(height: 16),
                    const Text('Analyzing receipt...', textAlign: TextAlign.center),
                  ] else if (_parsedData != null) ...[
                    Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _merchantController,
                            decoration: const InputDecoration(labelText: 'Merchant', prefixIcon: Icon(Icons.store)),
                            validator: (value) => value == null || value.isEmpty ? 'Please enter merchant' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _amountController,
                            decoration: const InputDecoration(labelText: 'Amount', prefixIcon: Icon(Icons.attach_money)),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Please enter amount';
                              if (double.tryParse(value) == null) return 'Please enter a valid number';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<Category>(
                            value: _selectedCategory,
                            decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category)),
                            items: categories.map((c) => DropdownMenuItem(value: c, child: Text('${c.icon} ${c.name}'))).toList(),
                            onChanged: (v) => setState(() => _selectedCategory = v),
                          ),
                          const SizedBox(height: 16),
                          InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _selectedDate,
                                firstDate: DateTime(2000),
                                lastDate: DateTime.now(),
                              );
                              if (picked != null) setState(() => _selectedDate = picked);
                            },
                            child: InputDecorator(
                              decoration: const InputDecoration(labelText: 'Date', prefixIcon: Icon(Icons.calendar_today)),
                              child: Text(DateFormat('MMMM dd, yyyy').format(_selectedDate)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _descriptionController,
                            decoration: const InputDecoration(labelText: 'Description', prefixIcon: Icon(Icons.description)),
                            maxLines: 2,
                          ),
                          const SizedBox(height: 32),
                          ElevatedButton(
                            onPressed: _isSaving ? null : _saveExpense,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              minimumSize: const Size(double.infinity, 50),
                            ),
                            child: _isSaving
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text('Confirm & Save'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ],
            ),
          );
        },
        loading: () => const Center(child: AppLoadingWidget()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
