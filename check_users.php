<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$users = App\Models\User::all();

echo "Total Users: " . $users->count() . "\n";

foreach ($users as $user) {
    echo $user->email . " - " . $user->role . "\n";
}
