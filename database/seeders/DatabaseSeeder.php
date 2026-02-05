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

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@cjbrew.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        
        // Create cashier user
        User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@cjbrew.com',
            'password' => Hash::make('password123'),
            'role' => 'resto',
            'email_verified_at' => now(),
        ]);
        
        // Create kitchen user
        User::create([
            'name' => 'Kitchen User',
            'email' => 'kitchen@cjbrew.com',
            'password' => Hash::make('password123'),
            'role' => 'kitchen',
            'email_verified_at' => now(),
        ]);
        
        // Create customer user
        User::create([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);
        
        // Create sample items
        $burger = Item::create([
            'name' => 'Classic Burger',
            'description' => 'Juicy beef patty with cheese and veggies',
            'price' => 12.99,
            'category' => 'main',
            'is_available' => true,
        ]);
        
        $salad = Item::create([
            'name' => 'Caesar Salad',
            'description' => 'Fresh romaine lettuce with Caesar dressing',
            'price' => 9.99,
            'category' => 'appetizer',
            'is_available' => true,
        ]);
        
        $pizza = Item::create([
            'name' => 'Pepperoni Pizza',
            'description' => 'Classic pizza with pepperoni and cheese',
            'price' => 15.99,
            'category' => 'main',
            'is_available' => true,
        ]);
        
        // Create sample customer
        $customer = Customer::create([
            'name' => 'John Doe',
            'phone' => '123-456-7890',
            'email' => 'john@example.com',
        ]);
        
        // Create sample sale
        $sale = Sale::create([
            'customer_id' => $customer->id,
            'total_amount' => 38.97,
            'status' => 'completed',
        ]);
        
        // Create sale items
        SaleItem::create([
            'sale_id' => $sale->id,
            'item_id' => $burger->id,
            'quantity' => 1,
            'unit_price' => 12.99,
            'total_price' => 12.99,
        ]);
        
        SaleItem::create([
            'sale_id' => $sale->id,
            'item_id' => $salad->id,
            'quantity' => 2,
            'unit_price' => 9.99,
            'total_price' => 19.98,
        ]);
        
        SaleItem::create([
            'sale_id' => $sale->id,
            'item_id' => $pizza->id,
            'quantity' => 1,
            'unit_price' => 15.99,
            'total_price' => 15.99,
        ]);
        
        // Create sample ingredients
        $beef = Ingredient::create([
            'name' => 'Beef Patty',
            'unit' => 'pcs',
            'quantity' => 50,
            'min_stock' => 10,
            'cost_per_unit' => 2.50,
        ]);
        
        $lettuce = Ingredient::create([
            'name' => 'Lettuce',
            'unit' => 'kg',
            'quantity' => 5,
            'min_stock' => 2,
            'cost_per_unit' => 1.20,
        ]);
        
        $cheese = Ingredient::create([
            'name' => 'Cheese',
            'unit' => 'kg',
            'quantity' => 8,
            'min_stock' => 3,
            'cost_per_unit' => 4.50,
        ]);
        
        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin Login: admin@cjbrew.com / password123');
        $this->command->info('Cashier Login: cashier@cjbrew.com / password123');
        $this->command->info('Kitchen Login: kitchen@cjbrew.com / password123');
    }
}