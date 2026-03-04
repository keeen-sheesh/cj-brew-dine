import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import {
    Calendar,
    Download,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Package,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    LineChart as LineChartIcon,
    Coffee,
    Utensils,
    Beer,
    Wine,
    Pizza,
    Sandwich,
    User,
    Hash,
    Building2,
    Heart
} from 'lucide-react';

// Format currency in Philippine Peso
const formatPeso = (amount) => {
    if (amount === null || amount === undefined) return '₱0.00';
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format number with commas
const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get item icon based on name
const getItemIcon = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('coffee')) return <Coffee className="w-4 h-4" />;
    if (name.includes('pizza')) return <Pizza className="w-4 h-4" />;
    if (name.includes('sandwich') || name.includes('burger')) return <Sandwich className="w-4 h-4" />;
    if (name.includes('beer')) return <Beer className="w-4 h-4" />;
    if (name.includes('wine')) return <Wine className="w-4 h-4" />;
    return <Utensils className="w-4 h-4" />;
};

export default function Reports({ auth, salesData = [], expensesData = [], salesRecordsData = [], topItems = [], stockAlerts = [], startDate, endDate, totals }) {
    const { data, setData, post, processing, errors } = useForm({
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
    });

    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customDateFrom, setCustomDateFrom] = useState(startDate || '');
    const [customDateTo, setCustomDateTo] = useState(endDate || '');
    const [chartView, setChartView] = useState('revenue');

    // Prepare chart data
    const profitChartData = salesData.map((sale, index) => {
        const expenseDay = expensesData.find(e => e.date === sale.date);
        return {
            date: formatDate(sale.date),
            revenue: parseFloat(sale.revenue) || 0,
            expenses: expenseDay ? parseFloat(expenseDay.total_expenses) : 0,
        };
    });

    const ordersChartData = salesData.map(sale => ({
        date: formatDate(sale.date),
        orders: parseInt(sale.orders) || 0,
    }));

    // Prepare pie chart data for payment methods
    const paymentMethodData = salesRecordsData.reduce((acc, sale) => {
        const method = sale.payment_method || 'Cash';
        const existing = acc.find(item => item.name === method);
        if (existing) {
            existing.value += sale.final_amount;
            existing.count += 1;
        } else {
            acc.push({ 
                name: method, 
                value: sale.final_amount,
                count: 1,
                formatted: formatPeso(sale.final_amount)
            });
        }
        return acc;
    }, []);

    // Prepare pie chart data for order types
    const orderTypeData = salesRecordsData.reduce((acc, sale) => {
        let type = 'dine_in';
        if (sale.customer_name?.includes('[HOTEL]')) type = 'hotel';
        else if (sale.customer_name?.includes('[PERSONAL]')) type = 'personal';
        else if (sale.order_type) type = sale.order_type;
        
        const typeLabels = {
            'dine_in': 'Dine In',
            'takeout': 'Takeout',
            'delivery': 'Delivery',
            'hotel': 'Hotel',
            'personal': 'Personal'
        };
        const typeName = typeLabels[type] || type;
        const existing = acc.find(item => item.name === typeName);
        if (existing) {
            existing.value += sale.final_amount;
            existing.count += 1;
        } else {
            acc.push({ 
                name: typeName, 
                value: sale.final_amount,
                count: 1
            });
        }
        return acc;
    }, []);

    // Top items chart data
    const topItemsChartData = topItems.slice(0, 5).map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        revenue: parseFloat(item.total_revenue) || 0,
        quantity: parseInt(item.total_quantity) || 0,
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

    // Date range options
    const dateRangeOptions = [
        { value: 'today', label: 'Today', icon: Calendar },
        { value: 'yesterday', label: 'Yesterday', icon: Calendar },
        { value: 'this_week', label: 'This Week', icon: Calendar },
        { value: 'last_week', label: 'Last Week', icon: Calendar },
        { value: 'this_month', label: 'This Month', icon: Calendar },
        { value: 'last_month', label: 'Last Month', icon: Calendar },
        { value: 'custom', label: 'Custom Range', icon: Calendar },
    ];

    const handleDateRangeChange = (range) => {
        setShowDateDropdown(false);
        
        if (range === 'custom') {
            setShowCustomDatePicker(true);
            return;
        }

        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                start = new Date();
                end = new Date();
                break;
            case 'yesterday':
                start = new Date();
                start.setDate(start.getDate() - 1);
                end = new Date(start);
                break;
            case 'this_week':
                start = new Date();
                start.setDate(start.getDate() - start.getDay() + 1);
                end = new Date();
                break;
            case 'last_week':
                start = new Date();
                start.setDate(start.getDate() - start.getDay() - 6);
                end = new Date();
                end.setDate(end.getDate() - end.getDay());
                break;
            case 'this_month':
                start = new Date(start.getFullYear(), start.getMonth(), 1);
                end = new Date();
                break;
            case 'last_month':
                start = new Date(start.getFullYear(), start.getMonth() - 1, 1);
                end = new Date(start.getFullYear(), start.getMonth(), 0);
                break;
        }

        setData('start_date', start.toISOString().split('T')[0]);
        setData('end_date', end.toISOString().split('T')[0]);
        
        router.get('/admin/reports', {
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
        }, {
            preserveState: true,
        });
    };

    const handleDateFilter = (e) => {
        e.preventDefault();
        router.get('/admin/reports', {
            start_date: data.start_date,
            end_date: data.end_date,
        }, {
            preserveState: true,
        });
    };

    const resetFilters = () => {
        router.get('/admin/reports', {}, {
            preserveState: true,
        });
    };

    const applyCustomDateRange = () => {
        if (customDateFrom && customDateTo) {
            setShowCustomDatePicker(false);
            setData('start_date', customDateFrom);
            setData('end_date', customDateTo);
            
            router.get('/admin/reports', {
                start_date: customDateFrom,
                end_date: customDateTo,
            }, {
                preserveState: true,
            });
        }
    };

    const generatePDF = () => {
        alert('PDF generation would be implemented here. For now, use browser print (Ctrl+P).');
    };

    // Calculate metrics
    const metrics = [
        {
            title: "Total Revenue",
            value: formatPeso(totals?.revenue || 0),
            change: `${formatNumber(totals?.orders || 0)} Orders`,
            icon: DollarSign,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700"
        },
        {
            title: "Total Expenses",
            value: formatPeso(totals?.expenses || 0),
            change: `${expensesData.length} expense days`,
            icon: TrendingDown,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-700"
        },
        {
            title: "Net Profit",
            value: formatPeso(totals?.netProfit || 0),
            change: `${(totals?.profitMargin || 0).toFixed(1)}% margin`,
            icon: TrendingUp,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-700"
        },
        {
            title: "Avg. Order Value",
            value: formatPeso(totals?.avgOrderValue || 0),
            change: `${formatNumber(totals?.orders || 0)} orders`,
            icon: ShoppingBag,
            color: "from-amber-500 to-amber-600",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            textColor: "text-amber-700"
        }
    ];

    return (
        <AdminLayout auth={auth}>
            <Head title="Reports & Analytics" />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Business performance insights and analytics
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    {startDate} to {endDate}
                                </span>
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                            </button>

                            {showDateDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 py-1">
                                    {dateRangeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleDateRangeChange(option.value)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                        >
                                            <option.icon className="w-4 h-4" />
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Date Picker */}
                        {showCustomDatePicker && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                            <input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                            <input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setShowCustomDatePicker(false)}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={applyCustomDateRange}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Export Button */}
                        <button
                            onClick={generatePDF}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {stockAlerts.length > 0 && (
                <div className="mb-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-amber-800">
                                {stockAlerts.length} {stockAlerts.length === 1 ? 'item' : 'items'} low in stock
                            </p>
                            <p className="text-sm text-amber-600 mt-1">Restock soon to avoid running out</p>
                        </div>
                        <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
                            View Inventory
                        </button>
                    </div>
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <div key={index} className={`bg-white rounded-xl shadow-lg border ${metric.borderColor} p-6 hover:shadow-xl transition-shadow`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 ${metric.bgColor} rounded-lg`}>
                                    <Icon className={`w-5 h-5 ${metric.textColor}`} />
                                </div>
                                <span className={`text-xs font-medium ${metric.textColor} ${metric.bgColor} px-2 py-1 rounded-full`}>
                                    {metric.change.split(' ')[0]}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</p>
                            <div className="flex items-center text-sm">
                                <span className="text-gray-500">{metric.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue vs Expenses Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChartIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
                        </div>
                    </div>
                    
                    <div className="w-full" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis 
                                    tickFormatter={(value) => `₱${value}`}
                                    domain={[0, 'auto']}
                                    stroke="#888"
                                />
                                <Tooltip 
                                    formatter={(value, name) => {
                                        const label = name === 'revenue' ? 'Revenue' : 'Expenses';
                                        return [`₱${parseFloat(value).toLocaleString()}`, label];
                                    }}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#a855f7" name="Expenses" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <LineChartIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Order Volume</h3>
                        </div>
                    </div>
                    
                    <div className="w-full" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ordersChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#888" />
                                <YAxis 
                                    domain={[0, 'auto']}
                                    stroke="#888"
                                />
                                <Tooltip 
                                    formatter={(value) => [`${value} orders`, 'Orders']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="orders" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#10b981' }}
                                    activeDot={{ r: 6, fill: '#10b981' }}
                                    name="Orders"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Pie Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Payment Methods Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <PieChartIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                    </div>
                    
                    {paymentMethodData.length > 0 ? (
                        <>
                            <div className="w-full" style={{ height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentMethodData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {paymentMethodData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                return [formatPeso(value), props.payload.name];
                                            }}
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {paymentMethodData.map((method, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-gray-600">{method.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">{formatPeso(method.value)}</span>
                                            <span className="text-xs text-gray-500">({method.count})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <PieChartIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No payment data</p>
                        </div>
                    )}
                </div>

                {/* Order Types Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Order Types</h3>
                    </div>
                    
                    {orderTypeData.length > 0 ? (
                        <>
                            <div className="w-full" style={{ height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={orderTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {orderTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                return [formatPeso(value), props.payload.name];
                                            }}
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {orderTypeData.map((type, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-gray-600">{type.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">{formatPeso(type.value)}</span>
                                            <span className="text-xs text-gray-500">({type.count})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No order type data</p>
                        </div>
                    )}
                </div>

                {/* Top Items Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Top Items Revenue</h3>
                    </div>
                    
                    {topItemsChartData.length > 0 ? (
                        <>
                            <div className="w-full" style={{ height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={topItemsChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="revenue"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {topItemsChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                return [formatPeso(value), props.payload.name];
                                            }}
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {topItemsChartData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-gray-600">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">{formatPeso(item.revenue)}</span>
                                            <span className="text-xs text-gray-500">({item.quantity})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No items sold</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sales Records Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Sales Records</h3>
                        </div>
                        <span className="text-sm text-gray-500">
                            {startDate} to {endDate}
                        </span>
                    </div>
                </div>
                
                <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 mb-1">Total Sales</p>
                            <p className="text-2xl font-bold text-blue-700">{formatNumber(totals?.salesRecordsCount || 0)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-600 mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-green-700">{formatPeso(totals?.salesRecordsTotal || 0)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-600 mb-1">Average Sale</p>
                            <p className="text-2xl font-bold text-purple-700">{formatPeso(totals?.avgSaleAmount || 0)}</p>
                        </div>
                    </div>
                    
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Cashier</th>
                                    <th className="px-6 py-4">Items Ordered</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {salesRecordsData.length > 0 ? (
                                    salesRecordsData.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-medium text-gray-900">
                                                    {record.invoice_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{record.sale_date}</div>
                                                    <div className="text-xs text-gray-500">{record.sale_time}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        {record.is_hotel && <Building2 className="w-3 h-3 text-amber-600" />}
                                                        {record.is_personal && <Heart className="w-3 h-3 text-pink-600" />}
                                                        <span className={`text-sm font-medium ${
                                                            record.is_personal ? 'text-pink-600' : 
                                                            record.is_hotel ? 'text-amber-600' : 'text-gray-900'
                                                        }`}>
                                                            {record.customer_name}
                                                        </span>
                                                    </div>
                                                    {record.room_number && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                            <Hash className="w-3 h-3" />
                                                            <span>Room #{record.room_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{record.cashier_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <p className="text-sm text-gray-600 line-clamp-2" title={record.items_list}>
                                                        {record.items_list}
                                                    </p>
                                                    <span className="text-xs text-gray-500 mt-1 block">
                                                        {record.items_count} {record.items_count === 1 ? 'item' : 'items'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="font-bold text-gray-900">
                                                        {formatPeso(record.final_amount)}
                                                    </span>
                                                    {record.discount_amount > 0 && (
                                                        <div className="text-xs text-red-500">
                                                            -{formatPeso(record.discount_amount)} discount
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {record.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                                                <p className="text-gray-500 font-medium">No sales records found</p>
                                                <p className="text-sm text-gray-400 mt-1">Try adjusting your date range</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Top Items Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
                    </div>
                </div>
                
                <div className="p-6">
                    {topItems.length > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                    <p className="text-sm text-amber-600 mb-1">Total Items Sold</p>
                                    <p className="text-2xl font-bold text-amber-700">
                                        {formatNumber(topItems.reduce((sum, item) => sum + parseInt(item.total_quantity), 0))}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-sm text-green-600 mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {formatPeso(topItems.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0))}
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-sm text-blue-600 mb-1">Unique Items</p>
                                    <p className="text-2xl font-bold text-blue-700">{topItems.length}</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            <th className="px-6 py-4">Rank</th>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Revenue</th>
                                            <th className="px-6 py-4">Avg. Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {topItems.map((item, index) => (
                                            <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        index === 1 ? 'bg-gray-100 text-gray-800' :
                                                        index === 2 ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    } font-bold text-sm`}>
                                                        #{index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-100 rounded-lg">
                                                            {getItemIcon(item.name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">ID: #{item.id.toString().padStart(4, '0')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.category || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900">{formatNumber(item.total_quantity)}</span>
                                                    <span className="text-xs text-gray-500 ml-1">units</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-green-600">
                                                        {formatPeso(item.total_revenue)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-700">
                                                        {formatPeso(item.avg_price)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No sales data available</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your date range</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}