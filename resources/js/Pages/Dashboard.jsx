import React from 'react';
import { Head, Link } from '@inertiajs/react'; // Added Link import
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Jedlian Holdings Dashboard" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">🍽️ Jedlian Holdings</h1>
                        <p className="text-gray-600 mt-2">Restobar Management System - Super Admin Panel</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <span className="text-blue-600 font-bold">🏪</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Restobars</p>
                                    <p className="text-2xl font-semibold text-gray-900">1</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <span className="text-green-600 font-bold">👥</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Staff Users</p>
                                    <p className="text-2xl font-semibold text-gray-900">4</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <span className="text-yellow-600 font-bold">💰</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                                    <p className="text-2xl font-semibold text-gray-900">₱0.00</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <span className="text-purple-600 font-bold">📦</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Menu Items</p>
                                    <p className="text-2xl font-semibold text-gray-900">0</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - UPDATED WITH MENU LINK */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link
                                href={route('menu.index')} // Added menu route
                                className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition text-center"
                            >
                                🍽️ Manage Menu
                            </Link>
                            <button className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition">
                                View Reports
                            </button>
                            <button className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition">
                                Manage Users
                            </button>
                            <button className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition">
                                System Settings
                            </button>
                        </div>
                    </div>

                    {/* Role Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 System Overview</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>Database Status</span>
                                    <span className="text-green-600 font-bold">✓ Connected</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>User Authentication</span>
                                    <span className="text-green-600 font-bold">✓ Active</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>POS System</span>
                                    <span className="text-yellow-600 font-bold">🔄 In Development</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>Kitchen Display</span>
                                    <span className="text-yellow-600 font-bold">🔄 In Development</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>Menu Management</span>
                                    <Link 
                                        href={route('menu.index')}
                                        className="text-blue-600 font-bold hover:text-blue-800"
                                    >
                                        🍽️ Go to Menu →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 User Roles</h2>
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 rounded">
                                    <span className="font-medium">Super Admin</span>
                                    <p className="text-sm text-gray-600">Full system access</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded">
                                    <span className="font-medium">Restobar Admin</span>
                                    <p className="text-sm text-gray-600">Manage sales, void transactions, stock</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded">
                                    <span className="font-medium">Restobar Staff</span>
                                    <p className="text-sm text-gray-600">POS access, sales monitoring</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded">
                                    <span className="font-medium">Kitchen Staff</span>
                                    <p className="text-sm text-gray-600">Order receipts, sound notifications</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}