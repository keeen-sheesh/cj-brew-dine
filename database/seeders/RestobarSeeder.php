<?php

namespace Database\Seeders;

use App\Models\Restobar;
use Illuminate\Database\Seeder;

class RestobarSeeder extends Seeder
{
    public function run(): void
    {
        // Check if restobar already exists
        if (!Restobar::where('code', 'JED-MAIN')->exists()) {
            Restobar::create([
                'name' => 'Jedlian Holdings Main',
                'code' => 'JED-MAIN',
                'address' => '123 Main Street, Manila',
                'contact_phone' => '09123456789',
                'is_active' => true,
            ]);
            echo "Restobar created successfully.\n";
        } else {
            echo "Restobar already exists. Skipping...\n";
        }
    }
}