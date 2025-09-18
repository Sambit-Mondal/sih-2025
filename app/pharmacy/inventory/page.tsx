'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  Filter,
  Download,
  Upload,
  Scan,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  minStock: number;
  price: number;
  mrp: number;
  location: string;
  barcode: string;
  status: 'available' | 'low-stock' | 'expired' | 'out-of-stock';
}

const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Crocin 500mg',
    genericName: 'Paracetamol',
    category: 'Pain Relief',
    manufacturer: 'GSK',
    batchNumber: 'CR5001',
    expiryDate: '2025-12-31',
    stock: 150,
    minStock: 50,
    price: 2.50,
    mrp: 3.00,
    location: 'A1-01',
    barcode: '8901030789456',
    status: 'available'
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    manufacturer: 'Cipla',
    batchNumber: 'AM2501',
    expiryDate: '2025-08-15',
    stock: 3,
    minStock: 30,
    price: 5.25,
    mrp: 6.50,
    location: 'B2-05',
    barcode: '8901030789457',
    status: 'low-stock'
  },
  {
    id: '3',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Gastro',
    manufacturer: 'Sun Pharma',
    batchNumber: 'OM2001',
    expiryDate: '2025-06-30',
    stock: 12,
    minStock: 40,
    price: 1.75,
    mrp: 2.25,
    location: 'C3-02',
    barcode: '8901030789458',
    status: 'low-stock'
  },
  {
    id: '4',
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    category: 'Diabetes',
    manufacturer: 'Lupin',
    batchNumber: 'MF5001',
    expiryDate: '2026-03-20',
    stock: 85,
    minStock: 60,
    price: 3.00,
    mrp: 4.00,
    location: 'D1-08',
    barcode: '8901030789459',
    status: 'available'
  },
  {
    id: '5',
    name: 'Aspirin 75mg',
    genericName: 'Acetylsalicylic Acid',
    category: 'Cardiovascular',
    manufacturer: 'Bayer',
    batchNumber: 'AS7501',
    expiryDate: '2024-12-31',
    stock: 0,
    minStock: 25,
    price: 1.20,
    mrp: 1.80,
    location: 'E2-03',
    barcode: '8901030789460',
    status: 'out-of-stock'
  }
];

// Define BarcodeDetector interface for proper typing
interface BarcodeDetectorResult {
  rawValue: string;
}

interface BarcodeDetector {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): BarcodeDetector;
    };
  }
}

export default function InventoryManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>(mockMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [scannerSuccess, setScannerSuccess] = useState(false);
  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({});

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || medicine.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || medicine.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(medicines.map(m => m.category))];
  const statuses = [
    { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
    { value: 'low-stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
    { value: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-800' }
  ];

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj?.color || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteMedicine = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const handleSaveMedicine = () => {
    if (editingMedicine) {
      // Update existing medicine
      setMedicines(medicines.map(m => 
        m.id === editingMedicine.id ? { ...editingMedicine } : m
      ));
      setEditingMedicine(null);
    } else if (newMedicine.name) {
      // Add new medicine
      const medicine: Medicine = {
        id: Date.now().toString(),
        name: newMedicine.name || '',
        genericName: newMedicine.genericName || '',
        category: newMedicine.category || 'Other',
        manufacturer: newMedicine.manufacturer || '',
        batchNumber: newMedicine.batchNumber || '',
        expiryDate: newMedicine.expiryDate || '',
        stock: newMedicine.stock || 0,
        minStock: newMedicine.minStock || 10,
        price: newMedicine.price || 0,
        mrp: newMedicine.mrp || 0,
        location: newMedicine.location || '',
        barcode: newMedicine.barcode || '',
        status: (newMedicine.stock || 0) === 0 ? 'out-of-stock' : 
                (newMedicine.stock || 0) < (newMedicine.minStock || 10) ? 'low-stock' : 'available'
      };
      setMedicines([...medicines, medicine]);
      setNewMedicine({});
    }
    setShowAddModal(false);
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Check if medicine with this barcode exists
    const existingMedicine = medicines.find(med => med.barcode === barcode);
    
    if (existingMedicine) {
      setScannerMessage(`Found: ${existingMedicine.name} - ${existingMedicine.genericName}`);
      setScannerSuccess(true);
      
      // Auto-close scanner after showing success
      setTimeout(() => {
        setShowBarcodeScanner(false);
        setScannerSuccess(false);
        setScannerMessage(null);
        // Optionally open edit modal for existing medicine
        setEditingMedicine(existingMedicine);
        setNewMedicine(existingMedicine);
        setShowAddModal(true);
      }, 1500);
    } else {
      // Mock barcode data lookup for new medicine
      const mockData = {
        name: `Medicine-${barcode.slice(-4)}`,
        genericName: 'Generic Name',
        manufacturer: 'Manufacturer',
        barcode: barcode
      };
      
      setScannerMessage(`New barcode detected: ${barcode}`);
      setScannerSuccess(true);
      
      setTimeout(() => {
        setNewMedicine(mockData);
        setShowBarcodeScanner(false);
        setScannerSuccess(false);
        setScannerMessage(null);
        setShowAddModal(true);
      }, 1500);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
              <Link 
                href="/pharmacy/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2 sm:mb-0 sm:mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="sm:ml-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-sm text-gray-500">Manage medicines and stock levels</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button 
                onClick={() => setShowBarcodeScanner(true)}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </button>
              <button 
                onClick={async () => {
                  try {
                    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                    if (!isSecure) {
                      alert('⚠️ Camera requires HTTPS or localhost. Current: ' + window.location.protocol);
                      return;
                    }
                    
                    if (!window.BarcodeDetector) {
                      alert('❌ BarcodeDetector not supported. Please use Chrome, Edge, or Chromium-based browser.');
                      return;
                    }
                    
                    console.log('🧪 Testing camera access...');
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();
                    
                    stream.getTracks().forEach(track => track.stop());
                    
                    alert(`✅ Camera test successful!\n\nCamera: ${videoTrack.label}\nResolution: ${settings.width}x${settings.height}\nProtocol: ${window.location.protocol}\nBarcodeDetector: Supported`);
                  } catch (error) {
                    const err = error as Error;
                    console.error('Camera test failed:', err);
                    alert(`❌ Camera test failed: ${err.message}\n\nTroubleshooting:\n• Allow camera permissions\n• Use HTTPS or localhost\n• Close other camera apps\n• Use Chrome/Edge browser`);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📷 Test Camera
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{medicines.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {medicines.filter(m => m.status === 'low-stock').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {medicines.filter(m => m.status === 'out-of-stock').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-purple-600">
                  {medicines.filter(m => calculateDaysUntilExpiry(m.expiryDate) <= 90 && calculateDaysUntilExpiry(m.expiryDate) > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search medicines by name, generic name, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medicine Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicines.map((medicine) => {
                  const daysUntilExpiry = calculateDaysUntilExpiry(medicine.expiryDate);
                  
                  return (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                          <div className="text-sm text-gray-500">{medicine.genericName}</div>
                          <div className="text-xs text-gray-400">{medicine.manufacturer}</div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">{medicine.category}</div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {medicine.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medicine.stock} units</div>
                        <div className="text-xs text-gray-500">Min: {medicine.minStock}</div>
                        <div className="text-xs text-gray-400">Location: {medicine.location}</div>
                        <div className="md:hidden text-xs text-gray-500 mt-1">₹{medicine.price} (MRP: ₹{medicine.mrp})</div>
                        <div className="lg:hidden text-xs text-gray-400 mt-1">
                          Expires: {medicine.expiryDate}
                          <span className={`ml-2 ${daysUntilExpiry <= 90 ? 'text-red-500' : 'text-green-500'}`}>
                            ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'})
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{medicine.price}</div>
                        <div className="text-xs text-gray-500">MRP: ₹{medicine.mrp}</div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medicine.expiryDate}</div>
                        <div className={`text-xs ${daysUntilExpiry <= 90 ? 'text-red-500' : 'text-green-500'}`}>
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(medicine.status)}`}>
                          {medicine.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingMedicine(medicine)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(medicine.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMedicine(null);
                    setNewMedicine({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                  <input
                    type="text"
                    value={editingMedicine?.name || newMedicine.name || ''}
                    onChange={(e) => {
                      if (editingMedicine) {
                        setEditingMedicine({...editingMedicine, name: e.target.value});
                      } else {
                        setNewMedicine({...newMedicine, name: e.target.value});
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter medicine name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generic Name</label>
                  <input
                    type="text"
                    value={editingMedicine?.genericName || newMedicine.genericName || ''}
                    onChange={(e) => {
                      if (editingMedicine) {
                        setEditingMedicine({...editingMedicine, genericName: e.target.value});
                      } else {
                        setNewMedicine({...newMedicine, genericName: e.target.value});
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter generic name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={editingMedicine?.category || newMedicine.category || ''}
                      onChange={(e) => {
                        if (editingMedicine) {
                          setEditingMedicine({...editingMedicine, category: e.target.value});
                        } else {
                          setNewMedicine({...newMedicine, category: e.target.value});
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Category"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      value={editingMedicine?.stock || newMedicine.stock || ''}
                      onChange={(e) => {
                        if (editingMedicine) {
                          setEditingMedicine({...editingMedicine, stock: parseInt(e.target.value) || 0});
                        } else {
                          setNewMedicine({...newMedicine, stock: parseInt(e.target.value) || 0});
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Stock"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingMedicine?.price || newMedicine.price || ''}
                      onChange={(e) => {
                        if (editingMedicine) {
                          setEditingMedicine({...editingMedicine, price: parseFloat(e.target.value) || 0});
                        } else {
                          setNewMedicine({...newMedicine, price: parseFloat(e.target.value) || 0});
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Price"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingMedicine?.mrp || newMedicine.mrp || ''}
                      onChange={(e) => {
                        if (editingMedicine) {
                          setEditingMedicine({...editingMedicine, mrp: parseFloat(e.target.value) || 0});
                        } else {
                          setNewMedicine({...newMedicine, mrp: parseFloat(e.target.value) || 0});
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="MRP"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMedicine(null);
                    setNewMedicine({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMedicine}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingMedicine ? 'Update' : 'Add'} Medicine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <button 
                onClick={() => { 
                  setShowBarcodeScanner(false); 
                  setScannerMessage(null); 
                  setScannerSuccess(false);
                }} 
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>📱 Position the barcode within the camera frame</p>
                <p>💡 Ensure good lighting and steady hands</p>
                <p>🔍 This will search for existing medicines or add new ones</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 relative">
                <BarcodeScannerUI onDetected={(code: string) => { handleBarcodeScanned(code); }} />
                {scannerSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/80 rounded-lg">
                    <div className="bg-green-500 text-white rounded-lg p-6 shadow-lg flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-green-500 text-lg">✓</span>
                      </div>
                      <div className="font-medium">Barcode Scanned Successfully!</div>
                    </div>
                  </div>
                )}
              </div>

              {scannerMessage && (
                <div className="bg-blue-50 text-blue-700 border border-blue-200 text-sm p-3 rounded-lg">
                  {scannerMessage}
                </div>
              )}
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Or enter barcode manually"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleBarcodeScanned(e.currentTarget.value);
                    }
                  }}
                />
                <button
                  onClick={() => handleBarcodeScanned('8901030789999')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Simulate Scan
                </button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Camera not working? Check permissions or try HTTPS if on localhost
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Barcode Scanner UI Component with Camera Support
function BarcodeScannerUI({ onDetected }: { onDetected: (code: string) => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastDetectedRef = useRef<string | null>(null);

  useEffect(() => {
    let detector: BarcodeDetector | null = null;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;

    const start = async () => {
      if (typeof window === 'undefined') return;
      
      setIsLoading(true);
      setCameraError(null);
      
      console.log('🔍 Starting inventory barcode scanner...');

      // Check if BarcodeDetector is supported
      if (!window.BarcodeDetector) {
        console.error('❌ BarcodeDetector not supported');
        setSupported(false);
        setCameraError('BarcodeDetector API not supported in this browser. Please use Chrome, Edge, or other Chromium-based browsers.');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ BarcodeDetector API supported');

      try {
        // Initialize BarcodeDetector
        detector = new window.BarcodeDetector({ 
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_e', 'upc_a', 'code_93'] 
        });
        console.log('✅ BarcodeDetector initialized');
        
        // Request camera permissions
        console.log('📷 Requesting camera access...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
          console.log('✅ Camera access granted');
        } catch (cameraErr: unknown) {
          console.log('⚠️ Back camera failed, trying any camera...');
          const error = cameraErr as Error;
          if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: true,
              audio: false
            });
            console.log('✅ Camera access granted (any camera)');
          } else {
            throw cameraErr;
          }
        }
        
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setSupported(true);
                setIsLoading(false);
                
                // Start detection loop
                const tick = async () => {
                  try {
                    if (!videoRef.current || !detector) return;
                    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
                      rafId = requestAnimationFrame(tick);
                      return;
                    }
                    
                    const detections = await detector.detect(videoRef.current);
                    if (detections && detections.length > 0) {
                      const code = detections[0].rawValue;
                      if (lastDetectedRef.current !== code) {
                        lastDetectedRef.current = code;
                        onDetected(code);
                        setTimeout(() => {
                          lastDetectedRef.current = null;
                        }, 2000);
                      }
                    }
                  } catch (detectionError) {
                    console.log('Detection error (normal):', detectionError);
                  }
                  rafId = requestAnimationFrame(tick);
                };
                tick();
              }).catch(playErr => {
                setCameraError(`Failed to play video: ${playErr.message}. Please check camera permissions.`);
                setIsLoading(false);
              });
            }
          };
          
          videoRef.current.onerror = (videoErr) => {
            setCameraError(`Video error: ${videoErr}. Please check camera permissions.`);
            setIsLoading(false);
          };
        }
      } catch (error: unknown) {
        const err = error as Error & { name: string };
        let errorMessage = 'Failed to access camera';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and refresh the page.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application. Please close other apps and try again.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked by security settings. Please ensure you\'re using HTTPS.';
        } else {
          errorMessage = `Camera error: ${err.message}`;
        }
        
        setCameraError(errorMessage);
        setSupported(false);
        setIsLoading(false);
      }
    };

    start();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      try { 
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        }
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Starting camera...</p>
          <p className="text-xs text-gray-500 mt-2">Please allow camera permissions if prompted</p>
        </div>
      </div>
    );
  }

  if (cameraError || supported === false) {
    return (
      <div className="w-full h-64 bg-red-50 rounded overflow-hidden flex items-center justify-center border-2 border-red-200">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">📷</div>
          <p className="text-sm text-red-600 font-medium">Camera Error</p>
          <p className="text-xs text-red-500 mt-2">{cameraError || 'BarcodeDetector not supported'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-black rounded overflow-hidden flex items-center justify-center relative">
      <video 
        ref={(el) => { if (el) videoRef.current = el; }} 
        className="w-full h-full object-cover" 
        playsInline 
        muted
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-3/4 h-3/4 border-2 border-dashed border-white rounded-lg opacity-60" />
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Position barcode within the frame
        </div>
      </div>
    </div>
  );
}