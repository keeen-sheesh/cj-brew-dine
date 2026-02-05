<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RestobarSeeder::class,  // First create restobar
            RolesSeeder::class,      // Then create roles
            UserSeeder::class,       // Finally create users with roles
        ]);
    }
}