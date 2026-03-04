import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Package, 
    BarChart3, 
    History, 
    ClipboardList,
    ArrowRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export default function Inventory({ auth }) {
    const { get, loading } = useApi();
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        recentTransactions: 0
    });

    useEffect(() => {
        fetchInventoryStats();
    }, []);

    const fetchInventoryStats = async () => {
        try {
            // Fetch items to calculate stats
            const itemsResponse = await get('/items?per_page=1000');
            const items = itemsResponse.data || [];
            
            const lowStock = items.filter(item => 
                item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0
            ).length;
            
            const outOfStock = items.filter(item => 
                item.stock_quantity === 0
            ).length;

            // Fetch recent transactions
            const transactionsResponse = await get('/transactions?per_page=1');
            
            setStats({
                totalItems: items.length,
                lowStockItems: lowStock,
                outOfStockItems: outOfStock,
                recentTransactions: transactionsResponse.meta?.total || 0
            });
        } catch (error) {
            console.error('Failed to fetch inventory stats:', error);
        }
    };

    const inventoryModules = [
        {
            title: 'Inventory Management',
            description: 'Manage items, categories, and stock levels',
            icon: Package,
            href: '/admin/inventory/management',
            color: 'bg-blue-500',
            available: true
        },
        {
            title: 'Inventory Dashboard',
            description: 'View real-time inventory analytics and reports',
            icon: BarChart3,
            href: '/admin/inventory/dashboard',
            color: 'bg-green-500',
            available: true
        },
        {
            title: 'Stock Reports',
            description: 'Generate detailed stock and valuation reports',
            icon: ClipboardList,
            href: '/admin/inventory/reports',
            color: 'bg-purple-500',
            available: true
        },
        {
            title: 'Transaction History',
            description: 'View all stock adjustments and transactions',
            icon: History,
            href: '/admin/inventory/transactions',
            color: 'bg-orange-500',
            available: true
        }
    ];

    return (
        <AdminLayout user={auth.user}>
            <Head title="Inventory" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
                        <p className="text-gray-600 mt-1">Manage your restaurant inventory and stock levels</p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <AlertCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="text-2xl font-bold text-green-600">{stats.recentTransactions}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inventoryModules.map((module) => (
                        <Link
                            key={module.title}
                            href={module.href}
                            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`p-3 ${module.color} rounded-lg`}>
                                    <module.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                                        {module.title}
                                    </h3>
                                    <p className="text-gray-600 mt-1">{module.description}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/admin/inventory/management"
                            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Manage Items
                        </Link>
                        <Link
                            href="/admin/inventory/transactions"
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <History className="w-4 h-4 mr-2" />
                            View Transactions
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
