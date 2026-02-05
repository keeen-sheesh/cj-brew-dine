<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->format('Y-m-d');
        
        // Today's sales
        $todaySales = DB::table('sales')
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('total_amount') ?: 0;
        
        // Today's orders
        $todayOrders = DB::table('sales')
            ->whereDate('created_at', $today)
            ->count();
        
        // Pending orders
        $pendingOrders = DB::table('sales')
            ->whereIn('status', ['pending', 'preparing'])
            ->count();
        
        // Low stock items (assuming ingredients table exists)
        $lowStockItems = DB::table('ingredients')
            ->whereColumn('quantity', '<=', 'min_stock')
            ->count();
        
        // Weekly sales data
        $weeklyData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $sales = DB::table('sales')
                ->whereDate('created_at', $date)
                ->where('status', 'completed')
                ->sum('total_amount') ?: 0;
            
            $weeklyData[] = [
                'date' => $date,
                'sales' => $sales,
                'day' => now()->subDays($i)->format('D')
            ];
        }
        
        // Recent sales
        $recentSales = DB::table('sales as s')
            ->select('s.id', 's.total_amount', 's.created_at', 'c.name as customer_name')
            ->leftJoin('customers as c', 's.customer_id', '=', 'c.id')
            ->orderBy('s.created_at', 'desc')
            ->limit(8)
            ->get();
        
        // Top selling items for today
        $topItems = DB::table('sale_items as si')
            ->select(
                'si.item_id',
                'i.name as item_name',
                DB::raw('COUNT(si.id) as quantity'),
                DB::raw('SUM(si.total_price) as revenue')
            )
            ->join('items as i', 'si.item_id', '=', 'i.id')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->whereDate('s.created_at', $today)
            ->groupBy('si.item_id', 'i.name')
            ->orderBy('revenue', 'desc')
            ->limit(5)
            ->get();
        
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'todaySales' => (float) $todaySales,
                'todayOrders' => (int) $todayOrders,
                'pendingOrders' => (int) $pendingOrders,
                'lowStockItems' => (int) $lowStockItems,
            ],
            'recentSales' => $recentSales,
            'weeklyData' => $weeklyData,
            'topItems' => $topItems,
        ]);
    }
}