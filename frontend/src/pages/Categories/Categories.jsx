import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Save, X } from 'lucide-react';
import { categoryService } from '../../services';
import { useCategoryStore } from '../../store';
import toast from 'react-hot-toast';

const Categories = () => {
  const { categories, setCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#0ea5e9', icon: '📦' });

  const defaultCategories = [
    { id: 1, name: 'Food & Dining', color: '#0ea5e9', icon: '🍔', count: 24 },
    { id: 2, name: 'Transportation', color: '#a855f7', icon: '🚗', count: 18 },
    { id: 3, name: 'Shopping', color: '#f59e0b', icon: '🛍️', count: 15 },
    { id: 4, name: 'Entertainment', color: '#10b981', icon: '🎬', count: 12 },
    { id: 5, name: 'Bills & Utilities', color: '#ef4444', icon: '📄', count: 8 },
    { id: 6, name: 'Healthcare', color: '#ec4899', icon: '⚕️', count: 5 },
    { id: 7, name: 'Education', color: '#8b5cf6', icon: '📚', count: 3 },
    { id: 8, name: 'Travel', color: '#06b6d4', icon: '✈️', count: 2 },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories: ' + (error.response?.data?.detail || error.message));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await categoryService.update(editingId, formData);
        updateCategory(editingId, updated);
        toast.success('Category updated successfully');
        fetchCategories(); // Refresh the list
      } else {
        const newCategory = await categoryService.create(formData);
        addCategory(newCategory);
        toast.success('Category added successfully');
        fetchCategories(); // Refresh the list
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', color: '#0ea5e9', icon: '📦' });
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + (error.response?.data?.detail || error.message));
      setShowAddModal(false);
      setEditingId(null);
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, color: category.color, icon: category.icon });
    setEditingId(category._id || category.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryService.delete(id);
      deleteCategory(id);
      fetchCategories(); // Refresh the list
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category: ' + (error.response?.data?.detail || error.message));
    }
  };

  const colorOptions = [
    '#0ea5e9', '#a855f7', '#f59e0b', '#10b981', '#ef4444',
    '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  ];

  const iconOptions = ['📦', '🍔', '🚗', '🛍️', '🎬', '📄', '⚕️', '📚', '✈️', '💡', '🏠', '🎮', '💰', '🎵', '📱'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  const displayCategories = categories;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your expense categories</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingId(null);
            setFormData({ name: '', color: '#0ea5e9', icon: '📦' });
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayCategories.map((category) => (
          <motion.div
            key={category._id || category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{category.count || 0} transactions</p>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
              ></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Food & Dining"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        formData.icon === icon
                          ? 'bg-primary-100 ring-2 ring-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === color
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Categories;
