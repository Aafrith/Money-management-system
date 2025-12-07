import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, Filter, MoreVertical, Mail, Phone,
  UserCheck, UserX, Ban, Edit, Trash2, Eye, Download,
  Plus, Calendar, DollarSign, Shield, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { adminService } from '../../services';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMenu, setShowMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    role: 'user'
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    role: 'user'
  });
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(null);
      }
    };

    if (showMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        status_filter: statusFilter,
        search: searchTerm || undefined,
      };
      
      const usersData = await adminService.getUsers(params);
      
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role,
        expenses: user.expenses || 0,
        totalAmount: user.totalAmount || 0,
        joinDate: new Date(user.joinDate).toLocaleDateString(),
        lastActive: user.lastActive ? formatRelativeTime(new Date(user.lastActive)) : 'Never',
        avatar: user.avatar,
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUser(userId, { status: newStatus });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      toast.success(`User ${newStatus} successfully`);
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };
  
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success(`User role updated to ${newRole}`);
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      setShowMenu(null);
      setShowUserModal(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };
  
  const handleViewUser = async (userId) => {
    try {
      const userDetails = await adminService.getUserDetails(userId);
      setSelectedUser({
        id: userDetails.id,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        status: userDetails.status,
        role: userDetails.role,
        expenses: userDetails.expenses || 0,
        totalAmount: userDetails.totalAmount || 0,
        joinDate: new Date(userDetails.joinDate).toLocaleDateString(),
        lastActive: userDetails.lastActive ? formatRelativeTime(new Date(userDetails.lastActive)) : 'Never',
        avatar: userDetails.avatar,
      });
      setShowUserModal(true);
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to fetch user details');
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const userDetails = await adminService.getUserDetails(userId);
      setSelectedUser(userDetails);
      setEditFormData({
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone || '',
        status: userDetails.status,
        role: userDetails.role
      });
      setShowEditModal(true);
      setShowMenu(null);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to fetch user details');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!editFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!editFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    try {
      await adminService.updateUser(selectedUser.id, editFormData);
      
      // Update local users list
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...editFormData }
          : user
      ));
      
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Refresh users list to get latest data
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!addFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!addFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!addFormData.password || addFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await adminService.createUser(addFormData);
      
      toast.success('User created successfully');
      setShowAddModal(false);
      
      // Reset form
      setAddFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 'active',
        role: 'user'
      });
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };
  
  const handleSearch = () => {
    fetchUsers();
  };

  const exportUsers = () => {
    // Export users to CSV
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Role', 'Expenses', 'Total Amount', 'Join Date'].join(','),
      ...users.map(user => 
        [user.name, user.email, user.phone || 'N/A', user.status, user.role, user.expenses, user.totalAmount, user.joinDate].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully!');
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor all users</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Suspended</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.suspended}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-11 w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-11 w-full appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="btn-primary whitespace-nowrap"
          >
            Search
          </button>

          {/* Export */}
          <button
            onClick={exportUsers}
            className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">User</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Contact</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Role</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Expenses</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Total Amount</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden xl:table-cell">Join Date</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden xl:table-cell">Last Active</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">{user.expenses}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell">{formatCurrency(user.totalAmount)}</td>
                    <td className="py-4 px-4 hidden xl:table-cell">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {user.joinDate}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">{user.lastActive}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        user.status === 'inactive' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {user.status === 'active' && <UserCheck className="w-3 h-3" />}
                        {user.status === 'inactive' && <UserX className="w-3 h-3" />}
                        {user.status === 'suspended' && <Ban className="w-3 h-3" />}
                        <span className="hidden sm:inline">{user.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative" ref={showMenu === user.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(showMenu === user.id ? null : user.id);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {showMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                              Edit User
                            </button>
                            {user.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                            )}
                            {user.status === 'suspended' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                              >
                                <UserCheck className="w-4 h-4" />
                                Activate
                              </button>
                            )}
                            {user.role === 'user' && (
                              <button
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                              >
                                <Shield className="w-4 h-4" />
                                Make Admin
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <button
                                onClick={() => handleRoleChange(user.id, 'user')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <User className="w-4 h-4" />
                                Make User
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border-t border-gray-200 dark:border-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                  {selectedUser.name.charAt(0)}
                </div>
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{selectedUser.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 truncate">{selectedUser.email}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedUser.phone}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{selectedUser.expenses}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{formatCurrency(selectedUser.totalAmount)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">User ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{selectedUser.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Role</span>
                  <span className={`font-medium ${selectedUser.role === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-medium ${
                    selectedUser.status === 'active' ? 'text-green-600 dark:text-green-400' :
                    selectedUser.status === 'inactive' ? 'text-gray-600 dark:text-gray-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Join Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedUser.joinDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Last Active</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedUser.lastActive}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={async () => {
                    try {
                      const expenses = await adminService.getUserExpenses(selectedUser.id, { limit: 10 });
                      console.log('User expenses:', expenses);
                      toast.success(`Found ${expenses.length} expenses`);
                    } catch (error) {
                      console.error('Failed to fetch user expenses:', error);
                      toast.error('Failed to fetch user expenses');
                    }
                  }}
                  className="flex-1 btn-primary"
                >
                  View Expenses
                </button>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Add New User
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      status: 'active',
                      role: 'user'
                    });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-600 dark:text-gray-400">&times;</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter email address"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addFormData.phone}
                  onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Admins have full access to all system features
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Status
                </label>
                <select
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set the initial status for this user account
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      status: 'active',
                      role: 'user'
                    });
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Edit User
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-600 dark:text-gray-400">&times;</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {/* User Avatar & ID */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {editFormData.name.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">#{selectedUser.id}</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter email address"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Admins have full access to all system features
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editFormData.status === 'active' && 'User can log in and use all features'}
                  {editFormData.status === 'inactive' && 'User account is temporarily disabled'}
                  {editFormData.status === 'suspended' && 'User account is suspended and cannot log in'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;
