import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:telephony/telephony.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/parser_models.dart';
import '../../data/models/category_model.dart';
import '../../data/services/parser_service.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../core/widgets/loading_widget.dart';

class AddSMSScreen extends ConsumerStatefulWidget {
  const AddSMSScreen({super.key});

  @override
  ConsumerState<AddSMSScreen> createState() => _AddSMSScreenState();
}

class _AddSMSScreenState extends ConsumerState<AddSMSScreen> {
  final Telephony telephony = Telephony.instance;
  bool _isListening = false;
  bool _isParsing = false;
  ParsedExpenseData? _parsedData;
  String? _lastSmsText;

  // Edit controllers
  final _formKey = GlobalKey<FormState>();
  final _merchantController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  Category? _selectedCategory;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _initSMSListener();
  }

  @override
  void dispose() {
    _merchantController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _initSMSListener() async {
    bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;
    if (permissionsGranted != null && permissionsGranted) {
      setState(() => _isListening = true);
      telephony.listenIncomingSms(
        onNewMessage: (SmsMessage message) {
          if (mounted) {
            setState(() {
              _lastSmsText = message.body;
            });
            _parseSMS(message.body ?? "");
          }
        },
        listenInBackground: false,
      );
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('SMS permissions are required for this feature')),
        );
      }
    }
  }

  Future<void> _parseSMS(String text) async {
    if (text.isEmpty) return;
    setState(() => _isParsing = true);

    try {
      final data = await ref.read(parserServiceProvider).parseSms(text);
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
          SnackBar(content: Text('Error parsing SMS: $e')),
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
        source: 'sms',
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
        title: const Text('Automated SMS Parsing'),
      ),
      body: categoriesAsync.when(
        data: (categories) {
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
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.monitor_heart, color: _isListening ? Colors.green : Colors.grey),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _isListening 
                              ? 'Listening for incoming bank SMS...' 
                              : 'Waiting for SMS permissions...',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _isListening ? Colors.green : Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                if (_lastSmsText != null) ...[
                  const Text('Last SMS Captured:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                    ),
                    child: Text(_lastSmsText!, style: const TextStyle(fontStyle: FontStyle.italic)),
                  ),
                  const SizedBox(height: 24),
                ],

                if (_isParsing) ...[
                  const Center(child: AppLoadingWidget()),
                  const SizedBox(height: 16),
                  const Text('Extracting details from SMS...', textAlign: TextAlign.center),
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
                ] else ...[
                  const SizedBox(height: 48),
                  const Icon(Icons.sms, size: 80, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    'Waiting for an incoming SMS to process...\nNo action required from your side.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  // Fallback to paste if needed
                  TextButton.icon(
                    onPressed: () {
                      _showPasteDialog(context);
                    },
                    icon: const Icon(Icons.paste),
                    label: const Text('Paste manually if needed'),
                  ),
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

  void _showPasteDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Paste SMS Text'),
        content: TextField(
          controller: controller,
          maxLines: 5,
          decoration: const InputDecoration(hintText: 'Paste the SMS text here...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              if (controller.text.isNotEmpty) {
                setState(() => _lastSmsText = controller.text);
                _parseSMS(controller.text);
              }
            },
            child: const Text('Parse'),
          ),
        ],
      ),
    );
  }
}
