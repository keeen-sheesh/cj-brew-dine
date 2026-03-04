import React from 'react';
import { Head } from '@inertiajs/react';
import { Utensils, Bell, ListCheck, PlayCircle, LogOut } from 'lucide-react';

export default function KitchenDashboard() {
  return (
    <>
      <Head title="Kitchen Dashboard" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Kitchen Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome to the kitchen interface</p>
            </div>
            <button
              onClick={() => (window.location.href = '/logout')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/kitchen/board"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Utensils className="w-7 h-7 text-blue-600" />
                </div>
                <PlayCircle className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Open Kitchen Board</h3>
              <p className="text-gray-600 mt-1">View and manage active orders</p>
            </a>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Bell className="w-7 h-7 text-amber-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <p className="text-gray-600 mt-1">Alarm rings on new orders</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ListCheck className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Tips</h3>
              <ul className="text-gray-600 mt-2 list-disc list-inside space-y-1">
                <li>Start orders when you begin preparing</li>
                <li>Mark orders ready for pickup on completion</li>
                <li>Keep the board open for live updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
