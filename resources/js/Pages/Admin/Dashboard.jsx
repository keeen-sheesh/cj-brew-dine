import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChartBar,
    CreditCard,
    DollarSign,
    Package,
    ShoppingBag,
    TriangleAlert,
    UtensilsCrossed,
    Clock,
    Flame,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const formatPeso = (amount = 0) => {
    const safeAmount = Number(amount) || 0;
    return `₱${safeAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatCount = (value = 0) => {
    const safeValue = Number(value) || 0;
    return safeValue.toLocaleString('en-PH');
};

const getStatusStyle = (status) => {
    const styles = {
        completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        ready:     'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
        preparing: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        pending:   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
        cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    };
    return styles[status] || 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
};

/* ── Module Card ─────────────────────────────────────────── */
const ModuleCard = ({ href, icon: Icon, title, description, metric, helper, accentClass }) => (
    <Link
        href={href}
        className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
        {/* top accent bar */}
        <div className={`h-1 w-full ${accentClass}`} />

        <div className="flex flex-col flex-1 p-6">
            <div className="mb-5 flex items-start justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                    <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-all duration-150 group-hover:translate-x-1 group-hover:text-gray-500" />
            </div>

            <h3 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>

            <div className="mt-auto pt-5 border-t border-gray-50">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{metric}</p>
                <p className="mt-0.5 text-xs text-gray-400">{helper}</p>
            </div>
        </div>
    </Link>
);

/* ── Stat Card ───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, hint, iconClass, valueClass = 'text-gray-900' }) => (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</p>
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
);

/* ── Main ────────────────────────────────────────────────── */
export default function Dashboard({
    auth,
    stats = {},
    recentSales = { data: [] },
    topItems = [],
    filters = {},
}) {
    const recentTransactions = (recentSales?.data || []).slice(0, 8);
    const bestSellers = (topItems || []).slice(0, 6);
    const maxRevenue = bestSellers.length > 0 ? Math.max(...bestSellers.map(i => Number(i.revenue) || 0)) : 1;

    const modules = [
        {
            href: '/cashier/pos',
            icon: CreditCard,
            title: 'Point of Sale',
            description: 'Take orders, process payments, and manage active tickets.',
            metric: `${formatCount(stats.pendingOrders)} active`,
            helper: 'Pending and preparing orders right now',
            accentClass: 'bg-gradient-to-r from-sky-400 to-blue-500',
        },
        {
            href: '/admin/inventory',
            icon: Package,
            title: 'Inventory',
            description: 'Track ingredient levels and reorder before stock runs out.',
            metric: `${formatCount(stats.lowStockItems)} low stock`,
            helper: `${formatCount(stats.outOfStockItems)} items out of stock`,
            accentClass: 'bg-gradient-to-r from-amber-400 to-orange-400',
        },
        {
            href: '/admin/foods',
            icon: UtensilsCrossed,
            title: 'Food Menu',
            description: 'Update categories, item details, and menu availability.',
            metric: `${formatCount(bestSellers.length)} top sellers`,
            helper: 'Based on selected report range',
            accentClass: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        },
    ];

    return (
        <AdminLayout auth={auth}>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">

                {/* ── Hero Header ───────────────────────────── */}
                <section className="relative overflow-hidden rounded-2xl bg-gray-900 px-8 py-7 shadow-lg">
                    {/* subtle dot-grid texture */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    />
                    {/* warm glow */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
                    />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70 ring-1 ring-white/10">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Operations Overview</h1>
                            <p className="mt-1 text-sm text-white/50">
                                {filters?.label || 'Today'} — restaurant performance snapshot
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-white/40 uppercase tracking-widest">Total Sales</p>
                            <p className="text-3xl font-bold text-white tabular-nums">{formatPeso(stats.totalSales)}</p>
                            <p className="text-xs text-white/40 mt-0.5">{formatCount(stats.completedOrders)} completed orders</p>
                        </div>
                    </div>
                </section>

                {/* ── Stat Strip ────────────────────────────── */}
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        icon={DollarSign}
                        label="Revenue"
                        value={formatPeso(stats.totalSales)}
                        hint="Completed orders only"
                        iconClass="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={ShoppingBag}
                        label="Orders"
                        value={formatCount(stats.totalOrders)}
                        hint={`${formatCount(stats.completedOrders)} completed`}
                        iconClass="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                        icon={ChartBar}
                        label="Avg Ticket"
                        value={formatPeso(stats.averageOrderValue)}
                        hint="Per completed order"
                        iconClass="bg-violet-50 text-violet-600"
                    />
                    <StatCard
                        icon={TriangleAlert}
                        label="Stock Alerts"
                        value={formatCount(stats.lowStockItems)}
                        hint={`${formatCount(stats.outOfStockItems)} out of stock`}
                        iconClass="bg-amber-50 text-amber-600"
                        valueClass={Number(stats.lowStockItems) > 0 ? 'text-amber-600' : 'text-gray-900'}
                    />
                </section>

                {/* ── Module Cards ──────────────────────────── */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {modules.map((module) => (
                        <ModuleCard key={module.title} {...module} />
                    ))}
                </section>

                {/* ── Tables ────────────────────────────────── */}
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">

                    {/* Recent Transactions */}
                    <div className="xl:col-span-3 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
                            </div>
                            <Link
                                href="/admin/transactions"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{sale.order_number}</p>
                                            <p className="text-xs text-gray-400 truncate">{sale.customer_name || '—'}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                                            {formatPeso(sale.total_amount)}
                                        </p>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${getStatusStyle(sale.status)}`}>
                                            {sale.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="px-6 py-8 text-sm text-gray-400 text-center">No transactions for this range.</p>
                            )}
                        </div>
                    </div>

                    {/* Top Menu Items */}
                    <div className="xl:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                            <Flame className="h-4 w-4 text-orange-400" />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Top Menu Items</h2>
                                <p className="text-xs text-gray-400">By revenue · {filters?.label || 'Today'}</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {bestSellers.length > 0 ? (
                                bestSellers.map((item, index) => {
                                    const pct = Math.round((Number(item.revenue) / maxRevenue) * 100);
                                    return (
                                        <div key={item.item_id} className="px-6 py-3.5">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0 tabular-nums">
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-sm font-medium text-gray-900 truncate">{item.item_name}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 tabular-nums shrink-0 ml-2">
                                                    {formatPeso(item.revenue)}
                                                </p>
                                            </div>
                                            <div className="ml-6 flex items-center gap-2">
                                                <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400 shrink-0">{formatCount(item.quantity)} sold</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="px-6 py-8 text-sm text-gray-400 text-center">No top sellers yet.</p>
                            )}
                        </div>
                    </div>

                </section>
            </div>
        </AdminLayout>
    );
}