// Example: resources/js/Pages/Admin/Foods.jsx
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Foods({ auth }) {
    return (
        <AdminLayout
            user={auth.user}
            header="Food Menu Management"
        >
            <Head title="Food Menu" />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Food Menu Management</h3>
                    <p className="text-gray-500">This page is under development</p>
                </div>
            </div>
        </AdminLayout>
    );
}