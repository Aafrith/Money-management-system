import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/parser_models.dart';
import '../../data/models/category_model.dart';
import '../../data/services/parser_service.dart';
import '../../providers/expense_provider.dart';
import '../../providers/category_provider.dart';
import '../../core/widgets/loading_widget.dart';

class AddVoiceScreen extends ConsumerStatefulWidget {
  const AddVoiceScreen({super.key});

  @override
  ConsumerState<AddVoiceScreen> createState() => _AddVoiceScreenState();
}

class _AddVoiceScreenState extends ConsumerState<AddVoiceScreen> {
  stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  String _text = '';
  double _confidence = 1.0;
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
  void initState() {
    super.initState();
    _initSpeech();
  }

  @override
  void dispose() {
    _merchantController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _initSpeech() async {
    try {
      bool available = await _speech.initialize(
        onError: (val) => print('Speech Error: $val'),
        onStatus: (val) => print('Speech Status: $val'),
      );
      if (mounted) setState(() {});
    } catch (e) {
      print('Speech Init Error: $e');
    }
  }

  void _listen() async {
    if (!_isListening) {
      // Direct request for microphone permission
      final status = await Permission.microphone.request();

      if (status.isGranted) {
        bool available = await _speech.initialize(
          onError: (val) => print('Speech Error: $val'),
          onStatus: (val) => print('Speech Status: $val'),
        );
        
        if (available) {
          setState(() => _isListening = true);
          _speech.listen(
            onResult: (val) => setState(() {
              _text = val.recognizedWords;
              if (val.hasConfidenceRating && val.confidence > 0) {
                _confidence = val.confidence;
              }
            }),
          );
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Speech recognition is not available or was rejected by the system.')),
            );
          }
        }
      } else if (status.isPermanentlyDenied) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Microphone permission permanently denied. Please enable it in Settings.'),
              action: SnackBarAction(label: 'Settings', onPressed: openAppSettings),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Microphone permission is required to record voice notes.')),
          );
        }
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
      if (_text.isNotEmpty) {
        _parseVoiceText(_text);
      }
    }
  }

  Future<void> _parseVoiceText(String text) async {
    setState(() => _isParsing = true);

    try {
      final data = await ref.read(parserServiceProvider).parseVoiceText(text);
      setState(() {
        _parsedData = data;
        _merchantController.text = data.merchant ?? '';
        _amountController.text = data.amount?.toString() ?? '';
        _descriptionController.text = data.description ?? text; // Use original text as description if none parsed
        _selectedDate = data.date ?? DateTime.now();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error parsing voice text: $e')),
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
        source: 'voice',
      );

      await ref.read(expensesProvider.notifier).addExpense(expense);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense saved successfully')),
        );
        if (context.mounted) {
          context.go('/expenses');
        }
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
        title: const Text('Voice Note'),
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
                Center(
                  child: GestureDetector(
                    onTap: _listen,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: _isListening ? Colors.red.withValues(alpha: 0.1) : Colors.blue.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isListening ? Colors.red : Colors.blue,
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        _isListening ? Icons.stop : Icons.mic,
                        size: 60,
                        color: _isListening ? Colors.red : Colors.blue,
                      ),
                    ),
                  ).animate(onPlay: (controller) => _isListening ? controller.repeat(reverse: true) : controller.stop())
                     .scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 600.ms),
                ),
                const SizedBox(height: 24),
                Text(
                  _isListening ? 'Listening...' : 'Tap to start recording',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _isListening ? Colors.red : Colors.blue,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Say something like "Spent 45 dollars on lunch at Subway today"',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),
                if (_text.isNotEmpty) ...[
                  const Text('Recognized Text:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_text, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(height: 24),
                ],

                if (_isParsing) ...[
                  const Center(child: AppLoadingWidget()),
                  const SizedBox(height: 16),
                  const Text('Analyzing voice note...', textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  const Text(
                    'This may take up to 2 minutes. Please wait.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
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
            ),
          );
        },
        loading: () => const Center(child: AppLoadingWidget()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
