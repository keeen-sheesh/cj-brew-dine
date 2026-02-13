// resources/js/Pages/Cashier/Dashboard.jsx
import React from 'react';
import { Head } from '@inertiajs/react';
import { ShoppingCart, Clock, DollarSign, Users } from 'lucide-react';

export default function CashierDashboard() {
    return (
        <>
            <Head title="Cashier Dashboard" />
            
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Cashier Dashboard</h1>
                        <p className="text-gray-600 mt-2">Welcome to the cashier interface</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Today's Sales</p>
                                    <p className="text-2xl font-bold text-gray-800">₱0.00</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Orders</p>
                                    <p className="text-2xl font-bold text-gray-800">0</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Tables Occupied</p>
                                    <p className="text-2xl font-bold text-gray-800">0/0</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Ready Orders</p>
                                    <p className="text-2xl font-bold text-gray-800">0</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <a 
                                href="/cashier/pos"
                                className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-center"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Open POS</h3>
                                <p className="text-gray-600">Start taking orders and payments</p>
                            </a>

                            <a 
                                href="/admin/reports"
                                className="p-6 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-center"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">View Reports</h3>
                                <p className="text-gray-600">Check sales and performance</p>
                            </a>

                            <div className="p-6 border-2 border-gray-200 rounded-xl text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <Clock className="w-8 h-8 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order History</h3>
                                <p className="text-gray-600">View past orders and transactions</p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Getting Started</h3>
                        <ul className="space-y-2 text-blue-700">
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-3 mt-0.5">
                                    1
                                </span>
                                Click "Open POS" to start taking orders
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-3 mt-0.5">
                                    2
                                </span>
                                Add menu items to the order cart
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-3 mt-0.5">
                                    3
                                </span>
                                Adjust people count and discount cards
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-3 mt-0.5">
                                    4
                                </span>
                                Select table for dine-in orders
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full mr-3 mt-0.5">
                                    5
                                </span>
                                Place order and process payment
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}