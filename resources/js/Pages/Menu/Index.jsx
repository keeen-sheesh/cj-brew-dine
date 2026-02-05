// resources/js/Pages/Menu/Index.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ auth, menuItems = [] }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                            <p className="text-gray-600 mb-8">
                                <span className="font-semibold text-blue-600">Super Admin</span>
                            </p>

                            {/* Menu Items Section */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Menu Items</h2>
                                
                                {menuItems.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                        <p className="text-gray-500 mb-2">No menu items yet</p>
                                        <p className="text-gray-500 mb-6">Get started by adding your first menu item</p>
                                        <Link
                                            href={route('menu.create')}  // FIXED: 'menu.create' not 'menu-items.create'
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                            </svg>
                                            + Add Your First Item
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {menuItems.map((item) => (
                                            <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-medium">{item.name}</h3>
                                                        <p className="text-sm text-gray-500">{item.url}</p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('menu.edit', item.id)}  // FIXED: 'menu.edit' not 'menu-items.edit'
                                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <Link
                                                            method="delete"
                                                            href={route('menu.destroy', item.id)}  // FIXED: 'menu.destroy'
                                                            as="button"
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                            onBefore={() => confirm('Are you sure you want to delete this menu item?')}
                                                        >
                                                            Delete
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add New Item Button (if items exist) */}
                            {menuItems.length > 0 && (
                                <div className="mt-8">
                                    <Link
                                        href={route('menu.create')}  // FIXED: 'menu.create' not 'menu-items.create'
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                        </svg>
                                        Add New Menu Item
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}