<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Item;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Ingredient;
use App\Models\Category;
use App\Models\Table;
use App\Models\PaymentMethod;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ========== CREATE USERS (only if they don't exist) ==========
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@cjbrew.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Cashier User',
                'email' => 'cashier@cjbrew.com',
                'password' => Hash::make('password123'),
                'role' => 'resto',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Kitchen User',
                'email' => 'kitchen@cjbrew.com',
                'password' => Hash::make('password123'),
                'role' => 'kitchen',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Customer User',
                'email' => 'customer@example.com',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ],
        ];
        
        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
        
        // ========== CREATE CATEGORIES (only if they don't exist) ==========
        $categories = [
            ['name' => 'Main Dish', 'is_active' => true, 'sort_order' => 1],
            ['name' => 'Burgers & Sandwiches', 'is_active' => true, 'sort_order' => 2],
            ['name' => 'Pasta', 'is_active' => true, 'sort_order' => 3],
            ['name' => 'Salad', 'is_active' => true, 'sort_order' => 4],
            ['name' => 'Appetizers', 'is_active' => true, 'sort_order' => 5],
            ['name' => 'Coffee Based', 'is_active' => true, 'sort_order' => 6],
            ['name' => 'Milk Based', 'is_active' => true, 'sort_order' => 7],
            ['name' => 'Frappe', 'is_active' => true, 'sort_order' => 8],
            ['name' => 'Soda', 'is_active' => true, 'sort_order' => 9],
            ['name' => 'Add ons', 'is_active' => true, 'sort_order' => 10],
            ['name' => 'Soup', 'is_active' => true, 'sort_order' => 11],
            ['name' => 'Drinks', 'is_active' => true, 'sort_order' => 12],
            ['name' => 'Non Based Coffee', 'is_active' => true, 'sort_order' => 13],
        ];
        
        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name']],
                $cat
            );
        }
        
        // ========== CREATE TABLES (only if they don't exist) ==========
        $tables = [
            ['table_number' => '1', 'capacity' => 4, 'status' => 'available', 'is_active' => true],
            ['table_number' => '2', 'capacity' => 4, 'status' => 'available', 'is_active' => true],
            ['table_number' => '3', 'capacity' => 6, 'status' => 'available', 'is_active' => true],
            ['table_number' => '4', 'capacity' => 6, 'status' => 'available', 'is_active' => true],
            ['table_number' => '5', 'capacity' => 2, 'status' => 'available', 'is_active' => true],
            ['table_number' => '6', 'capacity' => 2, 'status' => 'available', 'is_active' => true],
            ['table_number' => '7', 'capacity' => 8, 'status' => 'available', 'is_active' => true],
            ['table_number' => '8', 'capacity' => 8, 'status' => 'available', 'is_active' => true],
        ];
        
        foreach ($tables as $table) {
            Table::firstOrCreate(
                ['table_number' => $table['table_number']],
                $table
            );
        }
        
        // ========== CREATE PAYMENT METHODS (only if they don't exist) ==========
        $paymentMethods = [
            ['name' => 'Cash', 'is_active' => true],
            ['name' => 'Credit Card', 'is_active' => true],
            ['name' => 'Debit Card', 'is_active' => true],
            ['name' => 'GCash', 'is_active' => true],
            ['name' => 'Maya', 'is_active' => true],
        ];
        
        foreach ($paymentMethods as $method) {
            PaymentMethod::firstOrCreate(
                ['name' => $method['name']],
                $method
            );
        }
        
        // ========== CREATE SAMPLE MENU ITEMS (only if they don't exist) ==========
        $items = [
            // ========== MAIN DISHES (Category ID: 1) ==========
            [
                'name' => 'Grilled Chicken Steak',
                'description' => 'Juicy grilled chicken with side vegetables and mashed potatoes',
                'price' => 350.00,
                'category_id' => 1,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 20,
                'low_stock_threshold' => 5,
                'sort_order' => 1,
            ],
            [
                'name' => 'Beef Tapa',
                'description' => 'Traditional Filipino beef tapa with garlic rice and egg',
                'price' => 280.00,
                'category_id' => 1,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 15,
                'low_stock_threshold' => 5,
                'sort_order' => 2,
            ],
            [
                'name' => 'Pork Sinigang',
                'description' => 'Sour soup with pork, vegetables, and steamed rice',
                'price' => 320.00,
                'category_id' => 1,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 12,
                'low_stock_threshold' => 5,
                'sort_order' => 3,
            ],
            [
                'name' => 'Salmon Teriyaki',
                'description' => 'Grilled salmon with teriyaki sauce and vegetables',
                'price' => 420.00,
                'category_id' => 1,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 10,
                'low_stock_threshold' => 3,
                'sort_order' => 4,
            ],
            
            // ========== BURGERS & SANDWICHES (Category ID: 2) ==========
            [
                'name' => 'Classic Cheeseburger',
                'description' => 'Beef patty with cheese, lettuce, tomato, and special sauce',
                'price' => 180.00,
                'category_id' => 2,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 25,
                'low_stock_threshold' => 8,
                'sort_order' => 1,
            ],
            [
                'name' => 'Chicken Sandwich',
                'description' => 'Grilled chicken breast with mayo, lettuce, and tomato',
                'price' => 160.00,
                'category_id' => 2,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 18,
                'low_stock_threshold' => 6,
                'sort_order' => 2,
            ],
            [
                'name' => 'BBQ Bacon Burger',
                'description' => 'Beef patty with bacon, BBQ sauce, and onion rings',
                'price' => 220.00,
                'category_id' => 2,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 15,
                'low_stock_threshold' => 5,
                'sort_order' => 3,
            ],
            
            // ========== PASTA (Category ID: 3) ==========
            [
                'name' => 'Carbonara Pasta',
                'description' => 'Creamy pasta with bacon, cheese, and black pepper',
                'price' => 180.00,
                'category_id' => 3,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 180.00,
                'price_whole' => 320.00,
                'stock_quantity' => 15,
                'low_stock_threshold' => 5,
                'sort_order' => 1,
            ],
            [
                'name' => 'Spaghetti Bolognese',
                'description' => 'Classic spaghetti with rich meat sauce',
                'price' => 160.00,
                'category_id' => 3,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 160.00,
                'price_whole' => 280.00,
                'stock_quantity' => 20,
                'low_stock_threshold' => 7,
                'sort_order' => 2,
            ],
            [
                'name' => 'Seafood Marinara',
                'description' => 'Pasta with mixed seafood in tomato sauce',
                'price' => 250.00,
                'category_id' => 3,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 250.00,
                'price_whole' => 450.00,
                'stock_quantity' => 10,
                'low_stock_threshold' => 3,
                'sort_order' => 3,
            ],
            
            // ========== SALAD (Category ID: 4) ==========
            [
                'name' => 'Caesar Salad',
                'description' => 'Romaine lettuce with Caesar dressing, croutons, and parmesan',
                'price' => 150.00,
                'category_id' => 4,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 150.00,
                'price_whole' => 250.00,
                'stock_quantity' => 12,
                'low_stock_threshold' => 4,
                'sort_order' => 1,
            ],
            [
                'name' => 'Garden Salad',
                'description' => 'Mixed greens with vegetables and vinaigrette',
                'price' => 130.00,
                'category_id' => 4,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 130.00,
                'price_whole' => 220.00,
                'stock_quantity' => 15,
                'low_stock_threshold' => 5,
                'sort_order' => 2,
            ],
            
            // ========== APPETIZERS (Category ID: 5) ==========
            [
                'name' => 'French Fries',
                'description' => 'Crispy golden fries with ketchup',
                'price' => 80.00,
                'category_id' => 5,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 80.00,
                'price_whole' => 140.00,
                'stock_quantity' => 30,
                'low_stock_threshold' => 10,
                'sort_order' => 1,
            ],
            [
                'name' => 'Nachos Supreme',
                'description' => 'Tortilla chips with cheese, salsa, jalapeños, and sour cream',
                'price' => 120.00,
                'category_id' => 5,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 120.00,
                'price_whole' => 200.00,
                'stock_quantity' => 18,
                'low_stock_threshold' => 6,
                'sort_order' => 2,
            ],
            [
                'name' => 'Chicken Wings',
                'description' => 'Crispy chicken wings with buffalo sauce',
                'price' => 150.00,
                'category_id' => 5,
                'is_available' => true,
                'pricing_type' => 'dual',
                'price_solo' => 150.00,
                'price_whole' => 280.00,
                'stock_quantity' => 20,
                'low_stock_threshold' => 7,
                'sort_order' => 3,
            ],
            
            // ========== COFFEE BASED (Category ID: 6) ==========
            [
                'name' => 'Brewed Coffee',
                'description' => 'Hot freshly brewed coffee',
                'price' => 80.00,
                'category_id' => 6,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 50,
                'low_stock_threshold' => 15,
                'sort_order' => 1,
            ],
            [
                'name' => 'Cappuccino',
                'description' => 'Espresso with steamed milk foam',
                'price' => 120.00,
                'category_id' => 6,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 40,
                'low_stock_threshold' => 12,
                'sort_order' => 2,
            ],
            [
                'name' => 'Latte',
                'description' => 'Espresso with steamed milk',
                'price' => 130.00,
                'category_id' => 6,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 35,
                'low_stock_threshold' => 10,
                'sort_order' => 3,
            ],
            [
                'name' => 'Americano',
                'description' => 'Espresso shots with hot water',
                'price' => 100.00,
                'category_id' => 6,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 45,
                'low_stock_threshold' => 12,
                'sort_order' => 4,
            ],
            
            // ========== MILK BASED (Category ID: 7) ==========
            [
                'name' => 'Chocolate Milkshake',
                'description' => 'Creamy chocolate milkshake',
                'price' => 140.00,
                'category_id' => 7,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 25,
                'low_stock_threshold' => 8,
                'sort_order' => 1,
            ],
            [
                'name' => 'Strawberry Milkshake',
                'description' => 'Sweet strawberry milkshake',
                'price' => 140.00,
                'category_id' => 7,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 22,
                'low_stock_threshold' => 7,
                'sort_order' => 2,
            ],
            
            // ========== FRAPPE (Category ID: 8) ==========
            [
                'name' => 'Caramel Frappe',
                'description' => 'Coffee frappe with caramel syrup',
                'price' => 160.00,
                'category_id' => 8,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 30,
                'low_stock_threshold' => 10,
                'sort_order' => 1,
            ],
            [
                'name' => 'Mocha Frappe',
                'description' => 'Coffee frappe with chocolate',
                'price' => 160.00,
                'category_id' => 8,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 28,
                'low_stock_threshold' => 9,
                'sort_order' => 2,
            ],
            
            // ========== SODA (Category ID: 9) ==========
            [
                'name' => 'Coca-Cola',
                'description' => 'Cold Coca-Cola',
                'price' => 50.00,
                'category_id' => 9,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 100,
                'low_stock_threshold' => 30,
                'sort_order' => 1,
            ],
            [
                'name' => 'Sprite',
                'description' => 'Cold Sprite',
                'price' => 50.00,
                'category_id' => 9,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 90,
                'low_stock_threshold' => 25,
                'sort_order' => 2,
            ],
            [
                'name' => 'Royal',
                'description' => 'Cold Royal',
                'price' => 50.00,
                'category_id' => 9,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 85,
                'low_stock_threshold' => 25,
                'sort_order' => 3,
            ],
            
            // ========== DRINKS (Category ID: 12) ==========
            [
                'name' => 'Iced Tea',
                'description' => 'Freshly brewed iced tea',
                'price' => 60.00,
                'category_id' => 12,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 40,
                'low_stock_threshold' => 12,
                'sort_order' => 1,
            ],
            [
                'name' => 'Orange Juice',
                'description' => 'Fresh orange juice',
                'price' => 70.00,
                'category_id' => 12,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 35,
                'low_stock_threshold' => 10,
                'sort_order' => 2,
            ],
            [
                'name' => 'Lemonade',
                'description' => 'Fresh lemonade',
                'price' => 65.00,
                'category_id' => 12,
                'is_available' => true,
                'pricing_type' => 'single',
                'stock_quantity' => 30,
                'low_stock_threshold' => 8,
                'sort_order' => 3,
            ],
        ];
        
        foreach ($items as $item) {
            Item::firstOrCreate(
                ['name' => $item['name']],
                $item
            );
        }
        
        // ========== CREATE SAMPLE CUSTOMER ==========
        $customer = Customer::firstOrCreate(
            ['email' => 'john@example.com'],
            [
                'name' => 'John Doe',
                'phone' => '123-456-7890',
                'email' => 'john@example.com',
            ]
        );
        
        // ========== CREATE SAMPLE SALES (only if needed) ==========
        // Check if we have existing sales, if not create some
        if (Sale::count() == 0) {
            $sale = Sale::create([
                'customer_id' => $customer->id,
                'user_id' => 2, // Cashier user
                'subtotal' => 380.00,
                'tax_amount' => 30.40,
                'discount_amount' => 0,
                'total_amount' => 410.40,
                'status' => 'completed',
                'order_type' => 'dine_in',
                'table_id' => 1,
                'people_count' => 2,
                'cards_presented' => 0,
                'payment_method_id' => 1,
                'paid_at' => now(),
            ]);
            
            SaleItem::create([
                'sale_id' => $sale->id,
                'item_id' => 1, // Grilled Chicken Steak
                'quantity' => 1,
                'unit_price' => 350.00,
                'total_price' => 350.00,
            ]);
            
            SaleItem::create([
                'sale_id' => $sale->id,
                'item_id' => 19, // Coca-Cola
                'quantity' => 2,
                'unit_price' => 50.00,
                'total_price' => 100.00,
            ]);
            
            // Create more sales for testing
            $sale2 = Sale::create([
                'customer_id' => $customer->id,
                'user_id' => 2,
                'subtotal' => 520.00,
                'tax_amount' => 41.60,
                'discount_amount' => 52.00,
                'total_amount' => 509.60,
                'status' => 'ready',
                'order_type' => 'dine_in',
                'table_id' => 2,
                'people_count' => 5,
                'cards_presented' => 2,
                'payment_method_id' => null,
            ]);
            
            SaleItem::create([
                'sale_id' => $sale2->id,
                'item_id' => 2, // Beef Tapa
                'quantity' => 2,
                'unit_price' => 280.00,
                'total_price' => 560.00,
            ]);
        }
        
        // ========== CREATE SAMPLE INGREDIENTS ==========
        $ingredients = [
            [
                'name' => 'Beef Patty',
                'unit' => 'pcs',
                'quantity' => 50,
                'min_stock' => 10,
                'cost_per_unit' => 2.50,
            ],
            [
                'name' => 'Lettuce',
                'unit' => 'kg',
                'quantity' => 5,
                'min_stock' => 2,
                'cost_per_unit' => 1.20,
            ],
            [
                'name' => 'Coffee Beans',
                'unit' => 'kg',
                'quantity' => 10,
                'min_stock' => 3,
                'cost_per_unit' => 15.00,
            ],
        ];
        
        foreach ($ingredients as $ingredient) {
            Ingredient::firstOrCreate(
                ['name' => $ingredient['name']],
                $ingredient
            );
        }
        
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('🔐 Admin Login: admin@cjbrew.com / password123');
        $this->command->info('💵 Cashier Login: cashier@cjbrew.com / password123');
        $this->command->info('👨‍🍳 Kitchen Login: kitchen@cjbrew.com / password123');
        $this->command->info('👤 Customer Login: customer@example.com / password123');
        $this->command->info('📱 POS URL: /cashier/pos or /admin/pos');
        $this->command->info('📊 Foods Management: /admin/foods');
        $this->command->info('🍽️  Created/Updated ' . count($items) . ' menu items');
        $this->command->info('📂 Created/Updated ' . count($categories) . ' categories');
        $this->command->info('🪑 Created/Updated ' . count($tables) . ' tables');
        $this->command->info('💳 Created/Updated ' . count($paymentMethods) . ' payment methods');
    }
}