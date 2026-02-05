<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Restobar;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $restobar = Restobar::first();

        $users = [
            [
                'name' => 'Jedlian Super Admin',
                'email' => 'superadmin@jedlian.com',
                'password' => 'password123',
                'note' => 'Will assign role later'
            ],
            [
                'name' => 'Maria Santos',
                'email' => 'manager@jedlian.com',
                'password' => 'password123',
                'note' => 'Restobar Manager'
            ],
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'staff@jedlian.com',
                'password' => 'password123',
                'note' => 'POS Staff'
            ],
            [
                'name' => 'Pedro Reyes',
                'email' => 'kitchen@jedlian.com',
                'password' => 'password123',
                'note' => 'Kitchen Staff'
            ],
        ];

        foreach ($users as $userData) {
            if (!User::where('email', $userData['email'])->exists()) {
                User::create([
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'password' => Hash::make($userData['password']),
                    'restobar_id' => $restobar->id,
                ]);
                echo "User '{$userData['name']}' created.\n";
            } else {
                echo "User '{$userData['email']}' already exists. Skipping...\n";
            }
        }
    }
}