<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class FixKitchenCategories extends Migration
{
    public function up()
    {
        // List of categories that should be marked as kitchen categories
        $kitchenCategories = [
            'Main Dish',
            'Burgers & Sandwiches',
            'Pasta',
            'Salad',
            'Appetizers',
            'Appetizer',
            'Soup',
            'Pork',
            'Chicken',
            'Fish & Seafoods',
            'Seafood',
            'Vegetables',
            'Rice in a bowl',
            'Set Meals',
            'American Breakfast',
            'Filipino Breakfast',
            'Breakfast Side dish',
            'Rice (4-5 persons)',
            'Soup and Salad',
            'Casa Jedliana Soup',
            'Side dish',
            'Noodles',
        ];

        // Update each category to be a kitchen category
        foreach ($kitchenCategories as $categoryName) {
            DB::table('categories')
                ->where('name', 'like', '%' . $categoryName . '%')
                ->update(['is_kitchen_category' => true]);
        }

        // Also make sure categories with items that don't have parent kitchen category are marked
        $categories = DB::table('categories')->get();
        
        foreach ($categories as $category) {
            // Check if category has items
            $itemCount = DB::table('items')->where('category_id', $category->id)->count();
            
            if ($itemCount > 0 && !$category->is_kitchen_category) {
                // Check if this looks like a food category based on name
                $foodKeywords = ['dish', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'pork', 'chicken', 'beef', 'fish', 'seafood', 'vegetable', 'salad', 'soup', 'pasta', 'noodle', 'rice', 'burger', 'sandwich', 'appetizer', 'side'];
                
                $isLikelyFood = false;
                foreach ($foodKeywords as $keyword) {
                    if (stripos($category->name, $keyword) !== false) {
                        $isLikelyFood = true;
                        break;
                    }
                }
                
                if ($isLikelyFood) {
                    DB::table('categories')
                        ->where('id', $category->id)
                        ->update(['is_kitchen_category' => true]);
                        
                    echo "Updated kitchen category: {$category->name}\n";
                }
            }
        }

        // Display results
        echo "\n=== Kitchen Categories Updated ===\n";
        $kitchenCats = DB::table('categories')
            ->where('is_kitchen_category', true)
            ->get();
        
        foreach ($kitchenCats as $cat) {
            echo "- {$cat->name}\n";
        }
        echo "Total: " . count($kitchenCats) . " categories\n";
    }

    public function down()
    {
        // Optionally reset all categories to not kitchen
        // DB::table('categories')->update(['is_kitchen_category' => false]);
    }
}
