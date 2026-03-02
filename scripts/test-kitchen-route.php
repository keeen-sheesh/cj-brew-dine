<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

// set the current user directly (avoid session/guard initialization issues)
$user = \App\Models\User::where('role','admin')->first();
Auth::setUser($user);

$request = Request::create('/admin/kitchen', 'GET');
$response = $kernel->handle($request);

echo "status: " . $response->getStatusCode() . "\n";
$content = $response->getContent();
echo substr($content,0,500) . "\n";

$kernel->terminate($request, $response);
