'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
  Package,
  Users,
  ShoppingCart,
  FileText,
  BarChart,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  User
} from 'lucide-react';

// Mock data
const mockStats = {
  totalMedicines: 1247,
  lowStockItems: 23,
  todaySales: 18750,
  averageStock: 85.2
};

const mockLowStockItems = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', currentStock: 5, minStock: 20 },
  { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', currentStock: 8, minStock: 15 },
  { id: 3, name: 'Metformin 500mg', category: 'Diabetes', currentStock: 12, minStock: 25 }
];

const mockRecentSales = [
  { id: 1, customerName: 'John Doe', items: 3, total: 450, time: '10:30 AM', type: 'prescription' },
  { id: 2, customerName: 'Jane Smith', items: 1, total: 120, time: '11:15 AM', type: 'otc' },
  { id: 3, customerName: 'Mike Johnson', items: 2, total: 280, time: '12:45 PM', type: 'prescription' }
];

const salesTrendData = [
  { day: 'Mon', sales: 12500, prescriptions: 25 },
  { day: 'Tue', sales: 15200, prescriptions: 32 },
  { day: 'Wed', sales: 18750, prescriptions: 28 },
  { day: 'Thu', sales: 14300, prescriptions: 30 },
  { day: 'Fri', sales: 19800, prescriptions: 35 },
  { day: 'Sat', sales: 22100, prescriptions: 42 },
  { day: 'Sun', sales: 16900, prescriptions: 29 }
];

const stockDistribution = [
  { category: 'Pain Relief', count: 156, percentage: 12.5, color: '#3B82F6' },
  { category: 'Antibiotics', count: 89, percentage: 7.1, color: '#EF4444' },
  { category: 'Diabetes', count: 134, percentage: 10.7, color: '#10B981' },
  { category: 'Hypertension', count: 98, percentage: 7.9, color: '#F59E0B' },
  { category: 'Vitamins', count: 203, percentage: 16.3, color: '#8B5CF6' },
  { category: 'Others', count: 567, percentage: 45.5, color: '#6B7280' }
];

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
    }
  }, [user, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login/pharmacy');
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/pharmacy/dashboard', icon: BarChart, active: true },
    { name: 'Inventory', href: '/pharmacy/inventory', icon: Package, active: false },
    { name: 'Sales', href: '/pharmacy/sales', icon: ShoppingCart, active: false },
    { name: 'Prescriptions', href: '/pharmacy/prescriptions', icon: FileText, active: false },
    { name: 'Customers', href: '/pharmacy/customers', icon: Users, active: false },
    { name: 'Reports', href: '/pharmacy/reports', icon: BarChart, active: false },
    { name: 'Settings', href: '/pharmacy/settings', icon: Settings, active: false }
  ];

  if (!user || user.role !== 'pharmacist') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex items-center justify-center h-16 xl:h-20 bg-blue-600 text-white">
          <Package className="h-8 w-8 xl:h-10 xl:w-10 mr-2 xl:mr-3" />
          <span className="text-xl xl:text-2xl font-bold">PharmaCare</span>
        </div>

        <nav className="mt-8 xl:mt-10">
          <div className="px-4 xl:px-6 mb-6 xl:mb-8">
            <div className="flex items-center p-3 xl:p-4 bg-gray-50 rounded-lg xl:rounded-xl">
              <User className="h-10 w-10 xl:h-12 xl:w-12 bg-blue-100 p-2 xl:p-3 rounded-full text-blue-600" />
              <div className="ml-3 xl:ml-4">
                <p className="text-sm xl:text-base font-medium text-gray-900">{user.name}</p>
                <p className="text-xs xl:text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 xl:space-y-2 px-4 xl:px-6">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 xl:px-4 py-2 xl:py-3 text-sm xl:text-base font-medium rounded-md xl:rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5 xl:h-6 xl:w-6 mr-3 xl:mr-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-4 xl:bottom-6 left-4 xl:left-6 right-4 xl:right-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 xl:px-4 py-2 xl:py-3 text-sm xl:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md xl:rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 xl:h-6 xl:w-6 mr-3 xl:mr-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 xl:ml-72">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 xl:px-8 py-6 xl:py-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="ml-4 lg:ml-0 text-white">
                <h1 className="text-3xl xl:text-4xl font-extrabold">Pharmacy Dashboard</h1>
                <p className="text-sm xl:text-base opacity-90">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} - {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 xl:space-x-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 xl:h-5 xl:w-5" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  className="pl-10 xl:pl-12 pr-4 py-2 xl:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent w-48 xl:w-64 xl:text-lg bg-white/10 text-white placeholder:text-white/80"
                />
              </div>
              
              <button className="relative p-2 xl:p-3 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
                <Bell className="h-6 w-6 xl:h-7 xl:w-7" />
                <span className="absolute -top-1 -right-1 h-4 w-4 xl:h-5 xl:w-5 bg-red-500 text-white text-xs xl:text-sm rounded-full flex items-center justify-center font-medium">
                  {mockStats.lowStockItems}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 xl:p-8 2xl:p-12 max-w-8xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 mb-8 xl:mb-12">
            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Medicines</p>
                  <p className="text-3xl xl:text-4xl font-bold text-gray-900">{mockStats.totalMedicines.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 xl:p-4 rounded-full">
                  <Package className="h-8 w-8 xl:h-10 xl:w-10 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12 new this week
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Low Stock Items</p>
                  <p className="text-3xl xl:text-4xl font-bold text-red-600">{mockStats.lowStockItems}</p>
                </div>
                <div className="bg-red-100 p-3 xl:p-4 rounded-full">
                  <AlertTriangle className="h-8 w-8 xl:h-10 xl:w-10 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Needs attention
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Today&apos;s Sales</p>
                  <p className="text-3xl xl:text-4xl font-bold text-green-600">₹{mockStats.todaySales.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 xl:p-4 rounded-full">
                  <DollarSign className="h-8 w-8 xl:h-10 xl:w-10 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.5% from yesterday
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Average Stock %</p>
                  <p className="text-3xl xl:text-4xl font-bold text-blue-600">{mockStats.averageStock}%</p>
                </div>
                <div className="bg-blue-100 p-3 xl:p-4 rounded-full">
                  <TrendingUp className="h-8 w-8 xl:h-10 xl:w-10 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Healthy stock levels</p>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 mb-8 xl:mb-12">
            {/* Sales Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6 xl:mb-8">
                <h2 className="text-xl xl:text-2xl font-semibold text-gray-900">Sales Trend (7 Days)</h2>
                <TrendingUp className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />
              </div>
              
              <div className="relative h-64 xl:h-80">
                <div className="absolute inset-0 flex items-end justify-between px-2">
                  {salesTrendData.map((data) => {
                    const maxSales = Math.max(...salesTrendData.map(d => d.sales));
                    const height = (data.sales / maxSales) * 100;
                    
                    return (
                      <div key={data.day} className="flex flex-col items-center flex-1">
                        <div 
                          className="bg-blue-500 rounded-t-md w-8 xl:w-10 mx-1 transition-all duration-500 hover:bg-blue-600 cursor-pointer relative group"
                          style={{ height: `${height}%` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs xl:text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            ₹{data.sales.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-sm xl:text-base text-gray-600 mt-2 xl:mt-3">{data.day}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs xl:text-sm text-gray-500 -ml-12 xl:-ml-14">
                  <span>₹25k</span>
                  <span>₹20k</span>
                  <span>₹15k</span>
                  <span>₹10k</span>
                  <span>₹5k</span>
                  <span>₹0</span>
                </div>
              </div>
              
              <div className="mt-4 xl:mt-6 flex items-center justify-center">
                <div className="flex items-center space-x-4 xl:space-x-6 text-sm xl:text-base">
                  <div className="flex items-center">
                    <div className="w-3 h-3 xl:w-4 xl:h-4 bg-blue-500 rounded mr-2" />
                    <span className="text-gray-600">Daily Sales</span>
                  </div>
                  <div className="text-gray-500">
                    Avg: ₹{Math.round(salesTrendData.reduce((sum, d) => sum + d.sales, 0) / salesTrendData.length).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Distribution Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6 xl:mb-8">
                <h2 className="text-xl xl:text-2xl font-semibold text-gray-900">Stock Distribution</h2>
                <Package className="h-6 w-6 xl:h-7 xl:w-7 text-purple-500" />
              </div>
              
              <div className="relative">
                {/* Simple pie chart representation */}
                <div className="w-48 h-48 xl:w-56 xl:h-56 mx-auto relative">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {stockDistribution.map((segment, index) => {
                      const radius = 40;
                      const circumference = 2 * Math.PI * radius;
                      const offset = stockDistribution.slice(0, index).reduce((sum, s) => sum + s.percentage, 0);
                      const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((offset / 100) * circumference);
                      
                      return (
                        <circle
                          key={segment.category}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="8"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-width-10 cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl xl:text-3xl font-bold text-gray-900">{mockStats.totalMedicines}</div>
                      <div className="text-sm xl:text-base text-gray-500">Total Items</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-4 xl:mt-6 space-y-2 xl:space-y-3">
                  {stockDistribution.map((segment) => (
                    <div key={segment.category} className="flex items-center justify-between text-sm xl:text-base">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 xl:w-4 xl:h-4 rounded mr-2 xl:mr-3"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-gray-700">{segment.category}</span>
                      </div>
                      <span className="text-gray-500 font-medium">{segment.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6 xl:mb-8">
                <h2 className="text-xl xl:text-2xl font-semibold text-gray-900">Low Stock Alert</h2>
                <AlertTriangle className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />
              </div>
              
              <div className="space-y-4 xl:space-y-5">
                {mockLowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 xl:p-4 bg-red-50 rounded-lg xl:rounded-xl border-l-4 border-red-500">
                    <div>
                      <p className="font-medium text-gray-900 xl:text-lg">{item.name}</p>
                      <p className="text-sm xl:text-base text-gray-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm xl:text-base font-medium text-red-600">
                        {item.currentStock}/{item.minStock} units
                      </p>
                      <p className="text-xs xl:text-sm text-red-500">Reorder needed</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 xl:mt-6 bg-red-600 text-white py-2 xl:py-3 px-4 xl:px-6 rounded-lg xl:rounded-xl hover:bg-red-700 transition-colors xl:text-lg font-medium">
                View All Low Stock Items
              </button>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6 xl:mb-8">
                <h2 className="text-xl xl:text-2xl font-semibold text-gray-900">Recent Sales</h2>
                <ShoppingCart className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />
              </div>
              
              <div className="space-y-4 xl:space-y-5">
                {mockRecentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 xl:p-4 bg-gray-50 rounded-lg xl:rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 xl:w-4 xl:h-4 rounded-full mr-3 ${
                        sale.type === 'prescription' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 xl:text-lg">{sale.customerName}</p>
                        <p className="text-sm xl:text-base text-gray-600">{sale.items} items • {sale.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 xl:text-lg">₹{sale.total}</p>
                      <p className="text-xs xl:text-sm text-gray-500 capitalize">{sale.type}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 xl:mt-6 bg-green-600 text-white py-2 xl:py-3 px-4 xl:px-6 rounded-lg xl:rounded-xl hover:bg-green-700 transition-colors xl:text-lg font-medium">
                View All Sales
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 xl:mt-12 bg-white rounded-xl shadow-sm p-6 xl:p-8 border border-gray-100 hover:shadow-md transition-all duration-200">
            <h2 className="text-xl xl:text-2xl font-semibold text-gray-900 mb-6 xl:mb-8">Quick Actions</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6">
              <button className="flex flex-col items-center p-4 xl:p-6 bg-blue-50 hover:bg-blue-100 rounded-lg xl:rounded-xl transition-colors group">
                <Package className="h-8 w-8 xl:h-10 xl:w-10 text-blue-600 mb-2 xl:mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm xl:text-base font-medium text-blue-600">Add Medicine</span>
              </button>
              
              <button className="flex flex-col items-center p-4 xl:p-6 bg-green-50 hover:bg-green-100 rounded-lg xl:rounded-xl transition-colors group">
                <ShoppingCart className="h-8 w-8 xl:h-10 xl:w-10 text-green-600 mb-2 xl:mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm xl:text-base font-medium text-green-600">New Sale</span>
              </button>
              
              <button className="flex flex-col items-center p-4 xl:p-6 bg-purple-50 hover:bg-purple-100 rounded-lg xl:rounded-xl transition-colors group">
                <FileText className="h-8 w-8 xl:h-10 xl:w-10 text-purple-600 mb-2 xl:mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm xl:text-base font-medium text-purple-600">Process Prescription</span>
              </button>
              
              <button className="flex flex-col items-center p-4 xl:p-6 bg-orange-50 hover:bg-orange-100 rounded-lg xl:rounded-xl transition-colors group">
                <TrendingUp className="h-8 w-8 xl:h-10 xl:w-10 text-orange-600 mb-2 xl:mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm xl:text-base font-medium text-orange-600">View Reports</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}