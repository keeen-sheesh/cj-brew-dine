import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { LayoutDashboard, Users, Package, ShoppingCart, Utensils, BarChart, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <Head title="Jedlian Holdings" />

            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <ApplicationLogo className="h-8 w-auto" />
                        <span className="ml-2 text-xl font-bold text-gray-800">Jedlian Holdings</span>
                    </div>
                    <div className="mt-8 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            <Link
                                href={route('dashboard')}
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700"
                            >
                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                Dashboard
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Users className="mr-3 h-5 w-5" />
                                Staff Management
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Package className="mr-3 h-5 w-5" />
                                Menu & Inventory
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <ShoppingCart className="mr-3 h-5 w-5" />
                                POS System
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Utensils className="mr-3 h-5 w-5" />
                                Kitchen Display
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <BarChart className="mr-3 h-5 w-5" />
                                Reports & Analytics
                            </Link>
                            
                            <Link
                                href="#"
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Settings className="mr-3 h-5 w-5" />
                                Settings
                            </Link>
                        </nav>
                    </div>
                    
                    {/* User Profile */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">Super Admin</p>
                                <p className="text-xs text-gray-500">admin@jedlian.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}