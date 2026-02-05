<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Restobar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('restobar')
            ->orderBy('username')
            ->get();
            
        $restobars = Restobar::orderBy('name')->get();
        
        // FIX: Make sure you're returning Inertia response
        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'restobars' => $restobars
        ]);
    }
    
    public function create()
    {
        $restobars = Restobar::orderBy('name')->get();
        return Inertia::render('Admin/Users/Create', [
            'restobars' => $restobars
        ]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|unique:users|max:255',
            'password' => 'required|min:6',
            'email' => 'nullable|email',
            'restobar_id' => 'required|exists:restobars,id'
        ]);
        
        User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'email' => $request->email,
            'restobar_id' => $request->restobar_id,
            'is_active' => true
        ]);
        
        return redirect()->route('admin.users.index')
            ->with('success', 'User added successfully');
    }
}