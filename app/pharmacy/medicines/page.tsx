'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus,
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Scan,
  Download,
  Upload,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
  price: number;
  mrp: number;
  stock: number;
  minStock: number;
  barcode: string;
  description: string;
  sideEffects: string;
  dosageForm: string;
  strength: string;
  status: 'active' | 'discontinued' | 'out-of-stock';
  createdAt: Date;
  updatedAt: Date;
}

// Mock medicines data
const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Pain Relief',
    manufacturer: 'PharmaCorp',
    batchNumber: 'PC2024001',
    expiryDate: new Date('2025-12-31'),
    price: 2.50,
    mrp: 3.00,
    stock: 500,
    minStock: 100,
    barcode: '1234567890123',
    description: 'Pain and fever relief medication',
    sideEffects: 'Nausea, skin rash (rare)',
    dosageForm: 'Tablet',
    strength: '500mg',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-15')
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    manufacturer: 'MediLife',
    batchNumber: 'ML2024002',
    expiryDate: new Date('2025-06-30'),
    price: 15.00,
    mrp: 18.00,
    stock: 25,
    minStock: 50,
    barcode: '2345678901234',
    description: 'Broad-spectrum antibiotic',
    sideEffects: 'Diarrhea, nausea, allergic reactions',
    dosageForm: 'Capsule',
    strength: '250mg',
    status: 'active',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-09-10')
  },
  {
    id: '3',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Gastro',
    manufacturer: 'HealthGen',
    batchNumber: 'HG2024003',
    expiryDate: new Date('2026-03-31'),
    price: 8.75,
    mrp: 10.50,
    stock: 150,
    minStock: 75,
    barcode: '3456789012345',
    description: 'Proton pump inhibitor for acid reflux',
    sideEffects: 'Headache, stomach pain, diarrhea',
    dosageForm: 'Capsule',
    strength: '20mg',
    status: 'active',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-09-05')
  }
];

const categories = [
  'Pain Relief', 'Antibiotics', 'Gastro', 'Diabetes', 'Hypertension', 
  'Vitamins', 'Supplements', 'Dermatology', 'Cardiology', 'Neurology'
];

export default function MedicinesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>(mockMedicines);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>(mockMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
      return;
    }
  }, [user, router]);

  // Filter medicines based on search and category
  useEffect(() => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.barcode.includes(searchTerm)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(medicine => medicine.category === selectedCategory);
    }

    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, selectedCategory]);

  const handleAddMedicine = (medicineData: Partial<Medicine>) => {
    const newMedicine: Medicine = {
      ...medicineData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      barcode: generateBarcode()
    } as Medicine;

    setMedicines(prev => [...prev, newMedicine]);
    setShowAddModal(false);
  };

  const handleUpdateMedicine = (id: string, medicineData: Partial<Medicine>) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, ...medicineData, updatedAt: new Date() } : med
    ));
    setEditingMedicine(null);
  };

  const handleDeleteMedicine = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      setMedicines(prev => prev.filter(med => med.id !== id));
    }
  };

  const generateBarcode = () => {
    return Math.random().toString().slice(2, 15);
  };

  const startBarcodeScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowBarcodeScanner(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for barcode scanning');
    }
  };

  const stopBarcodeScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowBarcodeScanner(false);
  };

  const lowStockMedicines = medicines.filter(med => med.stock <= med.minStock);
  const expiringSoon = medicines.filter(med => {
    const daysUntilExpiry = (med.expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/pharmacy/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medicine Management</h1>
                <p className="text-sm text-gray-600">Manage inventory, add new medicines, and track stock levels</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={startBarcodeScanner}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {(lowStockMedicines.length > 0 || expiringSoon.length > 0) && (
          <div className="mb-6 space-y-3">
            {lowStockMedicines.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">
                    {lowStockMedicines.length} medicine{lowStockMedicines.length > 1 ? 's' : ''} running low on stock
                  </span>
                </div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    {expiringSoon.length} medicine{expiringSoon.length > 1 ? 's' : ''} expiring within 90 days
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, generic name, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={(med) => setEditingMedicine(med)}
              onDelete={handleDeleteMedicine}
            />
          ))}
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Get started by adding your first medicine'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Medicine
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {(showAddModal || editingMedicine) && (
        <MedicineModal
          medicine={editingMedicine}
          isOpen={showAddModal || !!editingMedicine}
          onClose={() => {
            setShowAddModal(false);
            setEditingMedicine(null);
          }}
          onSave={editingMedicine ? 
            (data) => handleUpdateMedicine(editingMedicine.id, data) : 
            handleAddMedicine
          }
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Barcode</h3>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={stopBarcodeScanner}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Capture frame and process barcode
                    stopBarcodeScanner();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Medicine Card Component
function MedicineCard({ 
  medicine, 
  onEdit, 
  onDelete 
}: { 
  medicine: Medicine; 
  onEdit: (medicine: Medicine) => void; 
  onDelete: (id: string) => void; 
}) {
  const isLowStock = medicine.stock <= medicine.minStock;
  const isExpiringSoon = (medicine.expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 90;

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">{medicine.name}</h3>
              <p className="text-sm text-gray-600">{medicine.genericName}</p>
            </div>
          </div>
          <div className="relative">
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{medicine.category}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stock:</span>
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {medicine.stock} units
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">₹{medicine.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expiry:</span>
            <span className={`font-medium ${isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
              {medicine.expiryDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        {(isLowStock || isExpiringSoon) && (
          <div className="mb-4 space-y-1">
            {isLowStock && (
              <div className="flex items-center text-red-600 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </div>
            )}
            {isExpiringSoon && (
              <div className="flex items-center text-yellow-600 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expiring Soon
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(medicine)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(medicine.id)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Medicine Modal Component
function MedicineModal({ 
  medicine, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  medicine?: Medicine | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: Partial<Medicine>) => void; 
}) {
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: medicine?.name || '',
    genericName: medicine?.genericName || '',
    category: medicine?.category || categories[0],
    manufacturer: medicine?.manufacturer || '',
    batchNumber: medicine?.batchNumber || '',
    expiryDate: medicine?.expiryDate || new Date(),
    price: medicine?.price || 0,
    mrp: medicine?.mrp || 0,
    stock: medicine?.stock || 0,
    minStock: medicine?.minStock || 10,
    description: medicine?.description || '',
    sideEffects: medicine?.sideEffects || '',
    dosageForm: medicine?.dosageForm || 'Tablet',
    strength: medicine?.strength || '',
    status: medicine?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generic Name
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate?.toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, expiryDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock *
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock Level *
                </label>
                <input
                  type="number"
                  required
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage Form
                </label>
                <select
                  value={formData.dosageForm}
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strength
                </label>
                <input
                  type="text"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side Effects
              </label>
              <textarea
                value={formData.sideEffects}
                onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {medicine ? 'Update' : 'Add'} Medicine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}