import { Coffee, Utensils } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-linear-to-br from-primary-50 to-secondary-50">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <Coffee className="w-16 h-16 text-primary-500" />
                        <Utensils className="w-16 h-16 text-secondary-500" />
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        CJ Brew & Dine
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Professional Restobar Management System
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-4xl mx-auto mt-12">
                        <RoleCard title="Admin" description="System Management" color="bg-red-100" />
                        <RoleCard title="Resto Admin" description="Branch Management" color="bg-blue-100" />
                        <RoleCard title="Resto" description="POS & Orders" color="bg-green-100" />
                        <RoleCard title="Kitchen" description="Food Preparation" color="bg-yellow-100" />
                        <RoleCard title="Customer" description="Menu & Reservations" color="bg-purple-100" />
                    </div>
                    
                    <div className="mt-12 space-x-4">
                        <Link 
                            href="/login" 
                            className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
                        >
                            Login
                        </Link>
                        <Link 
                            href="/register" 
                            className="inline-block border border-primary-500 text-primary-500 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoleCard({ title, description, color }) {
    return (
        <div className={`p-4 rounded-lg ${color} border border-gray-200`}>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
    );
}