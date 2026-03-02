<?php
// app/Http/Controllers/Admin/InventoryReportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryReportController extends Controller
{
    /**
     * Get inventory usage report
     */
    public function usageReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

        // Get all sale items with their ingredients
        $sales = SaleItem::with(['item.ingredients'])
            ->whereHas('sale', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })
            ->get();

        $usage = [];
        $totalRevenue = 0;
        $totalCost = 0;

        foreach ($sales as $sale) {
            $totalRevenue += $sale->total_price;
            
            foreach ($sale->item->ingredients as $ingredient) {
                $usedQuantity = $ingredient->pivot->quantity_required * $sale->quantity;
                $cost = $usedQuantity * $ingredient->cost_per_unit;
                $totalCost += $cost;

                if (!isset($usage[$ingredient->id])) {
                    $usage[$ingredient->id] = [
                        'name' => $ingredient->name,
                        'unit' => $ingredient->unit,
                        'total_used' => 0,
                        'total_cost' => 0,
                        'current_stock' => $ingredient->quantity,
                        'min_stock' => $ingredient->min_stock
                    ];
                }

                $usage[$ingredient->id]['total_used'] += $usedQuantity;
                $usage[$ingredient->id]['total_cost'] += $cost;
            }
        }

        // Get top selling items
        $topItems = SaleItem::select(
                'item_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total_price) as total_revenue')
            )
            ->whereHas('sale', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })
            ->with('item')
            ->groupBy('item_id')
            ->orderBy('total_quantity', 'desc')
            ->limit(10)
            ->get();

        // Get purchase orders in period
        $purchases = PurchaseOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', 'received')
            ->with('items.ingredient')
            ->get();

        $purchaseTotal = $purchases->sum('total');

        return response()->json([
            'success' => true,
            'report' => [
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d')
                ],
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'total_cost' => $totalCost,
                    'gross_profit' => $totalRevenue - $totalCost,
                    'profit_margin' => $totalRevenue > 0 ? (($totalRevenue - $totalCost) / $totalRevenue) * 100 : 0,
                    'total_purchases' => $purchaseTotal,
                    'total_sales_count' => $sales->count()
                ],
                'ingredient_usage' => array_values($usage),
                'top_items' => $topItems,
                'purchases' => $purchases
            ]
        ]);
    }

    /**
     * Get waste report (ingredients that expired or were written off)
     */
    public function wasteReport(Request $request)
    {
        // This would track waste events - you'd need a waste tracking table
        // For now, return low stock that might need attention
        
        $criticalStock = Ingredient::whereRaw('quantity <= min_stock * 0.5')
            ->orderByRaw('(quantity / min_stock) asc')
            ->get();

        return response()->json([
            'success' => true,
            'critical_stock' => $criticalStock
        ]);
    }

    /**
     * Get inventory valuation
     */
    public function valuation()
    {
        $ingredients = Ingredient::all();
        
        $totalValue = 0;
        $items = [];

        foreach ($ingredients as $ingredient) {
            $value = $ingredient->quantity * $ingredient->cost_per_unit;
            $totalValue += $value;
            
            $items[] = [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'quantity' => $ingredient->quantity,
                'unit' => $ingredient->unit,
                'cost_per_unit' => $ingredient->cost_per_unit,
                'total_value' => $value,
                'percentage' => 0 // Will calculate after total
            ];
        }

        // Calculate percentages
        foreach ($items as &$item) {
            $item['percentage'] = $totalValue > 0 ? ($item['total_value'] / $totalValue) * 100 : 0;
        }

        return response()->json([
            'success' => true,
            'valuation' => [
                'total_value' => $totalValue,
                'total_items' => count($items),
                'items' => $items,
                'as_of' => now()->format('Y-m-d H:i:s')
            ]
        ]);
    }

    /**
     * Get forecasting report (projected usage based on sales)
     */
    public function forecasting(Request $request)
    {
        $daysToForecast = $request->get('days', 7);
        
        // Get average daily usage from last 30 days
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        $sales = SaleItem::with('item.ingredients')
            ->whereHas('sale', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })
            ->get();

        $dailyUsage = [];
        $totalDays = 30;

        foreach ($sales as $sale) {
            foreach ($sale->item->ingredients as $ingredient) {
                $usedQuantity = $ingredient->pivot->quantity_required * $sale->quantity;
                
                if (!isset($dailyUsage[$ingredient->id])) {
                    $dailyUsage[$ingredient->id] = [
                        'name' => $ingredient->name,
                        'unit' => $ingredient->unit,
                        'total_used' => 0,
                        'current_stock' => $ingredient->quantity,
                        'min_stock' => $ingredient->min_stock
                    ];
                }
                
                $dailyUsage[$ingredient->id]['total_used'] += $usedQuantity;
            }
        }

        $forecast = [];
        foreach ($dailyUsage as $id => $data) {
            $avgDaily = $data['total_used'] / $totalDays;
            $projectedUsage = $avgDaily * $daysToForecast;
            $daysRemaining = $data['current_stock'] / $avgDaily;
            
            $forecast[] = [
                'id' => $id,
                'name' => $data['name'],
                'unit' => $data['unit'],
                'current_stock' => $data['current_stock'],
                'avg_daily_usage' => round($avgDaily, 2),
                'projected_usage' => round($projectedUsage, 2),
                'days_remaining' => round($daysRemaining, 1),
                'will_run_out' => $daysRemaining < $daysToForecast,
                'recommended_order' => $daysRemaining < $daysToForecast ? 
                    round(($projectedUsage - $data['current_stock']) + $data['min_stock'], 2) : 0
            ];
        }

        // Sort by days remaining (lowest first)
        usort($forecast, function($a, $b) {
            return $a['days_remaining'] <=> $b['days_remaining'];
        });

        return response()->json([
            'success' => true,
            'forecast' => [
                'period_days' => $daysToForecast,
                'items' => $forecast,
                'generated_at' => now()->format('Y-m-d H:i:s')
            ]
        ]);
    }
}