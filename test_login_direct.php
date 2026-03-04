<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Auth;

// Test password verification
$user = App\Models\User::where('email', 'admin@cjbrew.com')->first();

if ($user) {
    echo "Found user: " . $user->email . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Password hash: " . substr($user->password, 0, 60) . "...\n";
    
    // Test if password matches
    $passwordToTest = 'password123';
    $isValid = Hash::check($passwordToTest, $user->password);
    
    echo "Testing password '$passwordToTest': " . ($isValid ? "VALID" : "INVALID") . "\n";
    
    // Try to login
    if (Auth::attempt(['email' => 'admin@cjbrew.com', 'password' => 'password123'])) {
        echo "LOGIN SUCCESSFUL!\n";
    } else {
        echo "LOGIN FAILED!\n";
    }
} else {
    echo "User not found!\n";
}
