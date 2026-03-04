import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Crown,
    Mail,
    Phone,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    User,
    UserCircle,
    Building2,
    Coffee,
    Utensils,
    ChefHat,
    ShoppingBag,
    X,
    Save,
    Shield
} from 'lucide-react';

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Role icons and colors
const roleConfig = {
    admin: {
        icon: Crown,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        label: 'Admin',
        description: 'Full system access'
    },
    resto_admin: {
        icon: Building2,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        label: 'Resto Admin',
        description: 'Restaurant management'
    },
    resto: {
        icon: Coffee,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        label: 'Resto Staff',
        description: 'POS operations'
    },
    kitchen: {
        icon: ChefHat,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        label: 'Kitchen Staff',
        description: 'Kitchen display'
    },
    customer: {
        icon: UserCircle,
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        label: 'Customer',
        description: 'Customer account'
    }
};

// Status badge
const StatusBadge = ({ status }) => {
    const isActive = status === 'active' || status === true || status === 1;
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isActive 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
            {isActive ? (
                <>
                    <CheckCircle className="w-3 h-3" />
                    Active
                </>
            ) : (
                <>
                    <XCircle className="w-3 h-3" />
                    Inactive
                </>
            )}
        </span>
    );
};

// Role badge
const RoleBadge = ({ role }) => {
    const config = roleConfig[role] || roleConfig.customer;
    const Icon = config.icon;
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

// Create/Edit User Modal
const UserFormModal = ({ isOpen, onClose, user, roles }) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'customer',
        phone: user?.phone || '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setData({
                name: user?.name || '',
                email: user?.email || '',
                role: user?.role || 'customer',
                phone: user?.phone || '',
                password: '',
                password_confirmation: '',
            });
        }
    }, [isOpen, user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (user) {
            // Edit mode
            put(`/admin/users/${user.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                }
            });
        } else {
            // Create mode
            post('/admin/users', {
                onSuccess: () => {
                    onClose();
                    reset();
                }
            });
        }
    };

    if (!isOpen) return null;

    const config = roleConfig[data.role] || roleConfig.customer;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${config.color} text-white sticky top-0 z-10`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <UserPlus className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {user ? 'Edit User' : 'Create New User'}
                                </h2>
                                <p className="text-white/80 text-sm mt-1">
                                    {user ? 'Update user information' : 'Add a new user to the system'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-800">
                                    Please fix the following errors:
                                </span>
                            </div>
                            <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                                {Object.values(errors).map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter full name"
                                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="Enter email address"
                                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                User Role <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <select
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="resto_admin">Resto Admin</option>
                                    <option value="resto">Resto Staff</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>
                            {errors.role && (
                                <p className="mt-1 text-xs text-red-600">{errors.role}</p>
                            )}
                        </div>

                        {/* Password - Only show for new users or when editing with option to change */}
                        {!user && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Enter password"
                                            className={`w-full pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                                errors.password ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Role Info */}
                    <div className={`p-4 ${config.bgColor} rounded-lg border ${config.borderColor}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                <Shield className={`w-4 h-4 ${config.textColor}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${config.textColor}`}>
                                    {config.label} Access
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {config.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {processing ? 'Saving...' : user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, user, onConfirm, isLoading }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-rose-100 rounded-full">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                </div>
                
                <p className="text-gray-600 mb-2">
                    Are you sure you want to delete <span className="font-bold text-gray-900">{user.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    This action cannot be undone. All data associated with this user will be permanently removed.
                </p>
                
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// View User Modal
const ViewUserModal = ({ isOpen, onClose, user, onEdit, onDelete, onToggleStatus }) => {
    if (!isOpen || !user) return null;

    const role = roleConfig[user.role] || roleConfig.customer;
    const RoleIcon = role.icon;
    const isActive = user.is_active ?? true;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${role.color} text-white sticky top-0 z-10`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <RoleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-white/80 mt-1">{user.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Role & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Role</p>
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${role.bgColor}`}>
                                    <RoleIcon className={`w-4 h-4 ${role.textColor}`} />
                                </div>
                                <span className="font-medium text-gray-900">{role.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{role.description}</p>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <StatusBadge status={isActive} />
                            <p className="text-xs text-gray-500 mt-2">
                                {isActive ? 'Account is active' : 'Account is disabled'}
                            </p>
                        </div>
                    </div>
                    
                    {/* User Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">User Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{user.phone || 'Not set'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Member Since</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Last Updated</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(user.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(user);
                                }}
                                className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all flex flex-col items-center gap-2"
                            >
                                <Edit className="w-5 h-5" />
                                <span className="text-xs font-medium">Edit User</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    onClose();
                                    onToggleStatus(user);
                                }}
                                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                                    isActive
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }`}
                            >
                                {isActive ? (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        <span className="text-xs font-medium">Disable</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-5 h-5" />
                                        <span className="text-xs font-medium">Enable</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={() => {
                                    onClose();
                                    onDelete(user);
                                }}
                                className="p-3 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 transition-all flex flex-col items-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="text-xs font-medium">Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Roles({ auth, users: initialUsers = [], filters = {} }) {
    const [users, setUsers] = useState(initialUsers.data || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const usersPerPage = 10;
    
    // Filter users
    const filteredUsers = users.filter(user => {
        // Search filter
        const matchesSearch = searchQuery === '' || 
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id?.toString().includes(searchQuery);
        
        // Role filter
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        
        // Status filter
        const userStatus = user.is_active ?? true;
        const matchesStatus = selectedStatus === 'all' || 
            (selectedStatus === 'active' && userStatus) ||
            (selectedStatus === 'inactive' && !userStatus);
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, selectedStatus]);
    
    // Handle view user
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };
    
    // Handle edit user
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };
    
    // Handle delete user
    const handleDeleteUser = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };
    
    // Handle toggle status
    const handleToggleStatus = (user) => {
        router.post(`/admin/users/${user.id}/toggle-status`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Refresh user list
                router.reload({ only: ['users'] });
            }
        });
    };
    
    // Confirm delete
    const confirmDelete = () => {
        if (!selectedUser) return;
        
        setIsLoading(true);
        router.delete(`/admin/users/${selectedUser.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedUser(null);
                setIsLoading(false);
                router.reload({ only: ['users'] });
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };
    
    // Handle refresh
    const handleRefresh = () => {
        router.reload({ only: ['users'] });
    };
    
    // Handle add user
    const handleAddUser = () => {
        setSelectedUser(null);
        setShowCreateModal(true);
    };
    
    // Export users
    const handleExport = () => {
        const data = filteredUsers.map(user => ({
            ID: user.id,
            Name: user.name,
            Email: user.email,
            Role: roleConfig[user.role]?.label || user.role,
            Status: user.is_active ? 'Active' : 'Inactive',
            'Created At': formatDate(user.created_at),
            'Last Updated': formatDate(user.updated_at)
        }));
        
        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    
    // Stats
    const stats = [
        {
            title: 'Total Users',
            value: users.length,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200'
        },
        {
            title: 'Active Users',
            value: users.filter(u => u.is_active).length,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200'
        },
        {
            title: 'Admins',
            value: users.filter(u => u.role === 'admin').length,
            icon: Crown,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200'
        },
        {
            title: 'Staff',
            value: users.filter(u => ['resto_admin', 'resto', 'kitchen'].includes(u.role)).length,
            icon: Users,
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700',
            borderColor: 'border-amber-200'
        }
    ];
    
    // Role options for filter
    const roleOptions = [
        { value: 'all', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'resto_admin', label: 'Resto Admin' },
        { value: 'resto', label: 'Resto Staff' },
        { value: 'kitchen', label: 'Kitchen Staff' },
        { value: 'customer', label: 'Customer' }
    ];
    
    // Pagination Component
    const Pagination = () => {
        if (totalPages <= 1) return null;
        
        return (
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{indexOfFirstUser + 1}</span> to{' '}
                    <span className="font-medium text-gray-700">{Math.min(indexOfLastUser, filteredUsers.length)}</span>{' '}
                    of <span className="font-medium text-gray-700">{filteredUsers.length}</span> users
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                        {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };
    
    return (
        <AdminLayout auth={auth}>
            <Head title="User Management" />
            
            {/* Modals */}
            <ViewUserModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                user={selectedUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
            />
            
            <UserFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                user={null}
                roles={roleOptions}
            />
            
            <UserFormModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={selectedUser}
                roles={roleOptions}
            />
            
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                user={selectedUser}
                onConfirm={confirmDelete}
                isLoading={isLoading}
            />
            
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage system users, roles, and permissions
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Export</span>
                        </button>
                        
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {/* Add User Button */}
                        <button
                            onClick={handleAddUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add User</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-white rounded-xl shadow-lg border ${stat.borderColor} p-6 hover:shadow-xl transition-shadow`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                                    <Icon className={`w-5 h-5 ${stat.textColor}`} />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Filter className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {showFilters ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, ID..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Role Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {roleOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentUsers.length > 0 ? (
                                currentUsers.map((user) => {
                                    const role = roleConfig[user.role] || roleConfig.customer;
                                    const RoleIcon = role.icon;
                                    const isActive = user.is_active ?? true;
                                    
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewUser(user)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">ID: #{user.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${role.bgColor}`}>
                                                        <RoleIcon className={`w-3 h-3 ${role.textColor}`} />
                                                    </div>
                                                    <span className={`text-sm font-medium ${role.textColor}`}>
                                                        {role.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <Phone className="w-3 h-3" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={isActive} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleViewUser(user)}
                                                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isActive
                                                                ? 'hover:bg-amber-50 text-amber-600'
                                                                : 'hover:bg-green-50 text-green-600'
                                                        }`}
                                                        title={isActive ? 'Disable User' : 'Enable User'}
                                                    >
                                                        {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No users found</p>
                                            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <Pagination />
                </div>
            </div>
        </AdminLayout>
    );
}