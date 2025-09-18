'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Download,
  BarChart3,
  Activity,
  AlertCircle,
  Target
} from 'lucide-react';
import Link from 'next/link';

// Types for reporting data
interface SalesData {
  date: string;
  totalSales: number;
  prescriptionSales: number;
  otcSales: number;
  transactions: number;
}

interface MedicinePerformance {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

interface CustomerInsights {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
  topCustomers: Array<{
    name: string;
    totalSpent: number;
    visits: number;
  }>;
}

// Mock data
const mockSalesData: SalesData[] = [
  { date: '2024-09-01', totalSales: 15420, prescriptionSales: 9250, otcSales: 6170, transactions: 89 },
  { date: '2024-09-02', totalSales: 18750, prescriptionSales: 11300, otcSales: 7450, transactions: 95 },
  { date: '2024-09-03', totalSales: 16890, prescriptionSales: 10100, otcSales: 6790, transactions: 87 },
  { date: '2024-09-04', totalSales: 21500, prescriptionSales: 13200, otcSales: 8300, transactions: 102 },
  { date: '2024-09-05', totalSales: 19800, prescriptionSales: 12400, otcSales: 7400, transactions: 98 },
  { date: '2024-09-06', totalSales: 23100, prescriptionSales: 14600, otcSales: 8500, transactions: 115 },
  { date: '2024-09-07', totalSales: 17650, prescriptionSales: 10950, otcSales: 6700, transactions: 91 }
];

const mockTopMedicines: MedicinePerformance[] = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', totalSold: 450, revenue: 1125, profitMargin: 25, trend: 'up' },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', totalSold: 120, revenue: 1800, profitMargin: 35, trend: 'up' },
  { id: '3', name: 'Omeprazole 20mg', category: 'Gastro', totalSold: 200, revenue: 1750, profitMargin: 30, trend: 'stable' },
  { id: '4', name: 'Metformin 500mg', category: 'Diabetes', totalSold: 180, revenue: 2160, profitMargin: 28, trend: 'down' },
  { id: '5', name: 'Vitamin D3', category: 'Vitamins', totalSold: 300, revenue: 1200, profitMargin: 40, trend: 'up' }
];

const mockCustomerInsights: CustomerInsights = {
  totalCustomers: 1248,
  newCustomers: 89,
  returningCustomers: 156,
  averageOrderValue: 187.50,
  topCustomers: [
    { name: 'John Smith', totalSpent: 3450, visits: 12 },
    { name: 'Sarah Wilson', totalSpent: 2890, visits: 8 },
    { name: 'Mike Johnson', totalSpent: 2650, visits: 10 }
  ]
};

export default function PharmacyReports() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [activeTab, setActiveTab] = useState('overview');
  const [salesData] = useState<SalesData[]>(mockSalesData);
  const [medicinePerformance] = useState<MedicinePerformance[]>(mockTopMedicines);
  const [customerInsights] = useState<CustomerInsights>(mockCustomerInsights);

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
      return;
    }
  }, [user, router]);

  const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0);
  const totalTransactions = salesData.reduce((sum, day) => sum + day.transactions, 0);
  const averageDailySales = totalSales / salesData.length;
  const growthRate = salesData.length > 1 
    ? ((salesData[salesData.length - 1].totalSales - salesData[0].totalSales) / salesData[0].totalSales) * 100 
    : 0;

  const exportReport = (type: 'pdf' | 'excel') => {
    // Mock export functionality
    alert(`Exporting ${type.toUpperCase()} report...`);
  };

  const tabOptions = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'sales', name: 'Sales Analytics', icon: TrendingUp },
    { id: 'inventory', name: 'Inventory Reports', icon: Package },
    { id: 'customers', name: 'Customer Insights', icon: Users },
    { id: 'performance', name: 'Performance', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/pharmacy/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                <p className="text-sm text-gray-600">Comprehensive business intelligence and insights</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => exportReport('pdf')}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabOptions.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
                    <p className="text-3xl font-bold text-green-600">₹{totalSales.toLocaleString()}</p>
                    <p className={`text-sm mt-1 flex items-center ${
                      growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {growthRate >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(growthRate).toFixed(1)}% vs previous period
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
                    <p className="text-3xl font-bold text-blue-600">{totalTransactions}</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Avg: {Math.round(totalTransactions / salesData.length)} per day
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Daily Average</h3>
                    <p className="text-3xl font-bold text-purple-600">₹{Math.round(averageDailySales).toLocaleString()}</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Sales per day
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Avg Order Value</h3>
                    <p className="text-3xl font-bold text-orange-600">₹{customerInsights.averageOrderValue}</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Per transaction
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Total Sales</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Prescriptions</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">OTC</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                {salesData.map((data, index) => (
                  <div key={data.date} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="relative">
                        <div className="bg-gray-200 rounded-full h-8">
                          <div
                            className="bg-blue-500 h-8 rounded-full relative overflow-hidden"
                            style={{ width: `${(data.totalSales / Math.max(...salesData.map(d => d.totalSales))) * 100}%` }}
                          >
                            <div
                              className="bg-green-500 h-full"
                              style={{ width: `${(data.prescriptionSales / data.totalSales) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-sm font-medium text-right">
                      ₹{data.totalSales.toLocaleString()}
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right ml-4">
                      {data.transactions} txn
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Sales Breakdown</h3>
                <div className="space-y-4">
                  {salesData.map((data) => (
                    <div key={data.date} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {new Date(data.date).toLocaleDateString()}
                        </span>
                        <span className="text-lg font-bold">₹{data.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Prescriptions:</span>
                          <span className="ml-2 font-medium">₹{data.prescriptionSales.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">OTC:</span>
                          <span className="ml-2 font-medium">₹{data.otcSales.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Medicines */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Top Performing Medicines</h3>
                <div className="space-y-4">
                  {medicinePerformance.map((medicine, index) => (
                    <div key={medicine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{medicine.name}</h4>
                          <p className="text-sm text-gray-600">{medicine.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-green-600">₹{medicine.revenue}</span>
                          {medicine.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 ml-1" />}
                          {medicine.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 ml-1" />}
                        </div>
                        <p className="text-sm text-gray-600">{medicine.totalSold} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Stock Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Inventory Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-green-900">Well Stocked</h4>
                        <p className="text-sm text-green-600">Above minimum levels</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">1,180</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Low Stock</h4>
                        <p className="text-sm text-yellow-600">Below minimum levels</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">23</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-red-900">Out of Stock</h4>
                        <p className="text-sm text-red-600">No units available</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600">8</span>
                  </div>
                </div>
              </div>

              {/* Expiry Tracking */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Expiry Tracking</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Expired</span>
                      <span className="text-red-600 font-bold">5 items</span>
                    </div>
                    <p className="text-sm text-gray-600">Remove from inventory immediately</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Expiring in 30 days</span>
                      <span className="text-orange-600 font-bold">12 items</span>
                    </div>
                    <p className="text-sm text-gray-600">Priority for sales and discounts</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Expiring in 90 days</span>
                      <span className="text-yellow-600 font-bold">28 items</span>
                    </div>
                    <p className="text-sm text-gray-600">Monitor for sales planning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Statistics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Customer Statistics</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Total Customers</h4>
                      <p className="text-2xl font-bold text-gray-900">{customerInsights.totalCustomers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">New Customers (This Month)</h4>
                      <p className="text-2xl font-bold text-green-600">{customerInsights.newCustomers}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Returning Customers</h4>
                      <p className="text-2xl font-bold text-purple-600">{customerInsights.returningCustomers}</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Top Customers</h3>
                <div className="space-y-4">
                  {customerInsights.topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{customer.name}</h4>
                          <p className="text-sm text-gray-600">{customer.visits} visits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">₹{customer.totalSpent.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Sales Target</h3>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                    <p className="text-sm text-gray-600">Achievement this month</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Inventory Turnover</h3>
                    <p className="text-2xl font-bold text-blue-600">4.2x</p>
                    <p className="text-sm text-gray-600">Times per year</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Profit Margin</h3>
                    <p className="text-2xl font-bold text-purple-600">28.5%</p>
                    <p className="text-sm text-gray-600">Average margin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Category Performance</h3>
              <div className="space-y-4">
                {[
                  { name: 'Pain Relief', sales: 45200, margin: 25, trend: 'up' },
                  { name: 'Antibiotics', sales: 38900, margin: 35, trend: 'up' },
                  { name: 'Vitamins', sales: 32100, margin: 40, trend: 'stable' },
                  { name: 'Gastro', sales: 28750, margin: 30, trend: 'down' },
                  { name: 'Diabetes', sales: 25600, margin: 28, trend: 'up' }
                ].map((category) => (
                  <div key={category.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.margin}% margin</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-green-600 mr-2">₹{category.sales.toLocaleString()}</span>
                      {category.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {category.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {category.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}