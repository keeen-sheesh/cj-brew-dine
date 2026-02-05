import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    CreditCard, 
    ChefHat, 
    Utensils, 
    BarChart3, 
    Users,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Calendar,
    RefreshCw,
    Bell
} from 'lucide-react';

export default function AdminLayout({ children, auth }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    
    const { url } = usePage();
    const currentPage = url.split('/').pop() || 'dashboard';
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        // Check localStorage for sidebar state
        const savedState = localStorage.getItem('sidebarState');
        if (savedState === 'hidden' && !isMobile) {
            setSidebarOpen(false);
        }
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    useEffect(() => {
        localStorage.setItem('sidebarState', sidebarOpen ? 'visible' : 'hidden');
        
        // Update content margin
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper && !isMobile) {
            contentWrapper.style.marginLeft = sidebarOpen ? '280px' : '0';
        }
    }, [sidebarOpen, isMobile]);
    
    const navItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, text: 'Dashboard', active: currentPage === 'dashboard' },
        { href: '/cashier', icon: CreditCard, text: 'POS System', external: true },
        { href: '/kitchen', icon: ChefHat, text: 'Kitchen', external: true },
        { href: '/admin/foods', icon: Utensils, text: 'Food Menu', active: currentPage === 'foods' },
        { href: '/admin/reports', icon: BarChart3, text: 'Reports', active: currentPage === 'reports' },
        { href: '/admin/roles', icon: Users, text: 'Roles & Users', active: currentPage === 'roles' },
        { href: '/admin/inventory', icon: Package, text: 'Inventory', active: currentPage === 'inventory' },
        { href: '/admin/settings', icon: Settings, text: 'Settings', active: currentPage === 'settings' },
    ];
    
    // Get page title safely
    const getPageTitle = () => {
        try {
            // Check if children is a valid React element with props
            if (React.isValidElement(children) && children.props && children.props.title) {
                return children.props.title;
            }
            return 'Dashboard';
        } catch (error) {
            console.error('Error getting page title:', error);
            return 'Dashboard';
        }
    };
    
    // Format currency in Philippine Peso
    const formatPeso = (amount) => {
        return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };
    
    // Logout handler
    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Burger Menu Button */}
            {!sidebarOpen && (
                <button
                    className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
            )}
            
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                    <img 
                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYUteUe3lwXg8rWMlGEClnEzLyOfZJQao43A&s" 
                                        alt="CJ Brew & Dine"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg text-gray-900">CJ BREW & DINE</h1>
                                    <p className="text-xs text-gray-500">Restobar System</p>
                                </div>
                            </div>
                            <button
                                className="lg:hidden p-1 hover:bg-gray-100 rounded"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        
                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                                {auth?.user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{auth?.user?.name || 'Admin'}</p>
                                <p className="text-sm text-gray-500 capitalize">{auth?.user?.role || 'Administrator'}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    {item.external ? (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                                item.active
                                                    ? 'bg-yellow-50 text-yellow-600 border-l-4 border-yellow-500'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.text}</span>
                                        </a>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                                item.active
                                                    ? 'bg-yellow-50 text-yellow-600 border-l-4 border-yellow-500'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.text}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>
                    
                    {/* Logout */}
                    <div className="p-4 border-t">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            {/* Mobile Overlay */}
            {sidebarOpen && isMobile && (
                <div 
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Main Content */}
            <div className="content-wrapper min-h-screen">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {getPageTitle()}
                                </h2>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date().toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <RefreshCw className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                                    <Bell className="w-5 h-5 text-gray-600" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}