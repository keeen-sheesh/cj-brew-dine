<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@cjbrew.com')->first();

if ($user) {
    echo "User found: " . $user->email . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Password hash: " . $user->password . "\n";
    
    $check = Hash::check('password123', $user->password);
    echo "Password 'password123' check: " . ($check ? "CORRECT" : "INCORRECT") . "\n";
} else {
    echo "User not found!\n";
}
