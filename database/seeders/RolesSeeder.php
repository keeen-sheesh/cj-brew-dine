<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'super-admin',
            'restobar-admin', 
            'restobar-staff',
            'kitchen-staff',
            'customer'
        ];

        $timestamp = now();
        
        foreach ($roles as $role) {
            // Check if role exists first
            if (!DB::table('roles')->where('name', $role)->exists()) {
                DB::table('roles')->insert([
                    'name' => $role,
                    'guard_name' => 'web',
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp
                ]);
                echo "Role '$role' created.\n";
            } else {
                echo "Role '$role' already exists. Skipping...\n";
            }
        }
    }
}