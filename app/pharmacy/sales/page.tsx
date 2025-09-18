'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Calculator,
  Scan,
  Receipt
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  genericName: string;
  price: number;
  mrp: number;
  quantity: number;
  stock: number;
  category: string;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Sale {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  timestamp: Date;
  receiptNumber: string;
}

// Mock medicines available for sale (added `barcode` for scanning)
const initialMedicines = [
  { id: '1', name: 'Crocin 500mg', genericName: 'Paracetamol', price: 2.5, mrp: 3.0, stock: 150, category: 'Pain Relief', barcode: '8901030300011' },
  { id: '2', name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', price: 5.25, mrp: 6.5, stock: 75, category: 'Antibiotics', barcode: '8901030300028' },
  { id: '3', name: 'Omeprazole 20mg', genericName: 'Omeprazole', price: 1.75, mrp: 2.25, stock: 89, category: 'Gastro', barcode: '8901030300035' },
  { id: '4', name: 'Metformin 500mg', genericName: 'Metformin', price: 3.0, mrp: 4.0, stock: 85, category: 'Diabetes', barcode: '8901030300042' },
  { id: '5', name: 'Cetirizine 10mg', genericName: 'Cetirizine', price: 0.75, mrp: 1.0, stock: 200, category: 'Antihistamine', barcode: '8901030300059' },
  { id: '6', name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', price: 1.2, mrp: 1.5, stock: 120, category: 'Pain Relief', barcode: '8901030300066' },
  { id: '7', name: 'Vitamin D3 60K', genericName: 'Cholecalciferol', price: 15.0, mrp: 18.5, stock: 60, category: 'Vitamins', barcode: '8901030300073' },
  { id: '8', name: 'Azithromycin 500mg', genericName: 'Azithromycin', price: 12.5, mrp: 15.0, stock: 45, category: 'Antibiotics', barcode: '8901030300080' }
];

export default function SalesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'insurance'>('cash');
  const [discount, setDiscount] = useState(0);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [medicines, setMedicines] = useState<typeof initialMedicines>(initialMedicines);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  // show a quick visual success indicator when a scan is accepted
  const [scannerSuccess, setScannerSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: typeof initialMedicines[0]) => {
    const existingItem = cart.find(item => item.id === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity < medicine.stock) {
        setCart(cart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
      return;
    }
    const medicine = medicines.find(m => m.id === id);
    if (medicine && quantity <= medicine.stock) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  const proceedToPayment = () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }
    if (!customer.name || !customer.phone) {
      setShowCustomerForm(true);
      return;
    }
    setShowPayment(true);
  };

  const completeSale = () => {
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const sale: Sale = {
      id: Date.now().toString(),
      customer,
      items: cart,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      paymentMethod,
      timestamp: new Date(),
      receiptNumber
    };

    setCurrentSale(sale);
    
    // Clear cart and customer info
    setCart([]);
    setCustomer({ name: '', phone: '' });
    setDiscount(0);
    setShowPayment(false);
    setShowCustomerForm(false);
    
    // Reduce inventory counts based on sold items
    setMedicines(prev => {
      const copy = prev.map((m) => ({ ...m }));
      sale.items.forEach((sold) => {
        const idx = copy.findIndex(cm => cm.id === sold.id);
        if (idx !== -1) {
          copy[idx].stock = Math.max(0, copy[idx].stock - sold.quantity);
        }
      });
      return copy;
    });

    setScannerMessage(`Sale completed. Receipt: ${receiptNumber}`);
    alert(`Sale completed successfully! Receipt: ${receiptNumber}`);
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
    }
  };

  // Handle barcode result - find medicine by barcode and add to cart
  const handleBarcodeResult = (code: string) => {
    const found = medicines.find(m => m.barcode === code || m.id === code);
    if (found) {
      addToCart(found);
      setScannerMessage(`Added ${found.name} to cart`);
      // show success indicator briefly
      setScannerSuccess(true);
      // play a short beep
      try {
        // Create a short beep using AudioContext. Narrow window type for legacy webkit support.
        const w = window as Window & { webkitAudioContext?: typeof AudioContext };
        const C = w.AudioContext ?? w.webkitAudioContext;
        if (C) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ctx: AudioContext = new (C as any)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 1000;
          o.connect(g as AudioNode);
          g.connect(ctx.destination);
          o.start();
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
          setTimeout(() => {
            try { o.stop(); ctx.close(); } catch { /* ignore */ }
          }, 200);
        }
      } catch {
        // ignore audio errors (user gesture or unsupported)
      }

      // automatically close the scanner after a short delay to allow user to see feedback
      setTimeout(() => {
        setShowScanner(false);
        setScannerSuccess(false);
        setScannerMessage(null);
      }, 700);
    } else {
      setScannerMessage(`No medicine found for barcode ${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link 
                href="/pharmacy/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                <p className="text-sm text-gray-500">Process sales and manage transactions</p>
              </div>
            </div>

              <div className="flex items-center space-x-3">
              <button onClick={() => setShowScanner(true)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Check if running on HTTPS or localhost
                    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                    if (!isSecure) {
                      alert('⚠️ Camera requires HTTPS or localhost. Current: ' + window.location.protocol);
                      return;
                    }
                    
                    // Test ZXing library support
                    try {
                      const { BrowserMultiFormatReader } = await import('@zxing/library');
                      new BrowserMultiFormatReader(); // Test instantiation
                      console.log('✅ ZXing library loaded successfully');
                    } catch {
                      alert('❌ ZXing library failed to load. Please refresh the page.');
                      return;
                    }
                    
                    console.log('🧪 Testing camera access...');
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();
                    
                    stream.getTracks().forEach(track => track.stop()); // Stop the test stream
                    
                    alert(`✅ Camera test successful!\n\nCamera: ${videoTrack.label}\nResolution: ${settings.width}x${settings.height}\nProtocol: ${window.location.protocol}\nScanner: ZXing Library Ready`);
                  } catch (error) {
                    const err = error as Error;
                    console.error('Camera test failed:', err);
                    alert(`❌ Camera test failed: ${err.message}\n\nTroubleshooting:\n• Allow camera permissions\n• Use HTTPS or localhost\n• Close other camera apps\n• Use Chrome/Edge browser`);
                  }
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📷 Test Camera
              </button>
              <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Receipt className="h-4 w-4 mr-2" />
                View Sales
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Select Medicines</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredMedicines.map((medicine) => (
                    <div key={medicine.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                          <p className="text-sm text-gray-600">{medicine.genericName}</p>
                          <p className="text-xs text-gray-500">{medicine.category}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Stock: {medicine.stock}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-semibold text-gray-900">₹{medicine.price}</span>
                          <span className="text-sm text-gray-500 line-through ml-2">₹{medicine.mrp}</span>
                        </div>
                        <button
                          onClick={() => addToCart(medicine)}
                          disabled={medicine.stock === 0}
                          className="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredMedicines.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try a different search term.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Cart ({cart.length})</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Cart is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Add medicines to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.genericName}</p>
                          <p className="text-sm font-semibold text-gray-900">₹{item.price} each</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium min-w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bill Summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Bill Summary</h2>
                </div>
                
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="text-gray-900">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                      />
                      <span className="text-gray-500">%</span>
                      <span className="text-red-600">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={proceedToPayment}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customer.email || ''}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCustomerForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customer.name && customer.phone) {
                    setShowCustomerForm(false);
                    setShowPayment(true);
                  }
                }}
                disabled={!customer.name || !customer.phone}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            
            <div className="space-y-3">
              {[
                { value: 'cash', label: 'Cash', icon: '💵' },
                { value: 'card', label: 'Card', icon: '💳' },
                { value: 'upi', label: 'UPI', icon: '📱' },
                { value: 'insurance', label: 'Insurance', icon: '🏥' }
              ].map((method) => (
                <label key={method.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="mr-3"
                  />
                  <span className="mr-3">{method.icon}</span>
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={completeSale}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <button 
                onClick={() => { 
                  setShowScanner(false); 
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
                <p>🔧 If camera doesn&apos;t start, try the &quot;Test Camera&quot; button first</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 relative">
                <BarcodeScannerUI onDetected={(code: string) => { handleBarcodeResult(code); }} />
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
                <div className={`text-sm p-3 rounded-lg ${
                  scannerMessage.includes('found') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {scannerMessage}
                </div>
              )}
              
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

// Allow legacy webkitAudioContext to be recognized by TypeScript
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    AudioContext?: typeof AudioContext;
  }
}

// Inline scanner component using ZXing library for better browser compatibility
function BarcodeScannerUI({ onDetected }: { onDetected: (code: string) => void }) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastDetectedRef = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readerRef = useRef<any>(null); // Use any for ZXing reader to avoid type conflicts

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isComponentMounted = true;
    const videoElement = videoRef.current; // Capture ref for cleanup

    const initializeScanner = async () => {
      if (typeof window === 'undefined') return;
      
      setIsLoading(true);
      setCameraError(null);
      
      try {
        // Dynamically import ZXing library
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        
        if (!isComponentMounted) return;
        
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        
        console.log('🔍 ZXing scanner initialized');
        setIsSupported(true);
        
        // Get camera stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment', // Prefer back camera
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          console.log('✅ Camera access granted (back camera)');
        } catch (cameraErr: unknown) {
          // Fallback to any available camera
          console.log('⚠️ Back camera failed, trying any camera...');
          const error = cameraErr as Error;
          if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('✅ Camera access granted (any camera)');
          } else {
            throw cameraErr;
          }
        }
        
        if (videoRef.current && stream && isComponentMounted) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && isComponentMounted) {
              videoRef.current.play().then(async () => {
                setIsLoading(false);
                
                // Start barcode detection
                try {
                  await reader.decodeFromVideoDevice(
                    null, // Use default camera
                    videoRef.current!,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (result?: any) => {
                      if (result && isComponentMounted) {
                        const code = result.getText();
                        // Debounce identical results
                        if (lastDetectedRef.current !== code) {
                          lastDetectedRef.current = code;
                          onDetected(code);
                          console.log('📱 Barcode detected:', code);
                          
                          // Reset after 2 seconds to allow re-scanning
                          setTimeout(() => {
                            if (isComponentMounted) {
                              lastDetectedRef.current = null;
                            }
                          }, 2000);
                        }
                      }
                      // Ignore errors during normal scanning
                    }
                  );
                } catch (scanError) {
                  console.error('Scanning error:', scanError);
                  setCameraError('Failed to start barcode scanning');
                }
              }).catch((playError: Error) => {
                setCameraError(`Failed to play video: ${playError.message}`);
                setIsLoading(false);
              });
            }
          };
          
          videoRef.current.onerror = () => {
            setCameraError('Video error. Please check camera permissions.');
            setIsLoading(false);
          };
        }
      } catch (error: unknown) {
        const err = error as Error & { name: string };
        let errorMessage = 'Failed to initialize barcode scanner';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera blocked by security settings. Ensure you\'re using HTTPS.';
        } else if (err.message?.includes('ZXing')) {
          errorMessage = 'ZXing library failed to load. Please refresh the page.';
        } else {
          errorMessage = `Scanner error: ${err.message || 'Unknown error'}`;
        }
        
        setCameraError(errorMessage);
        setIsSupported(false);
        setIsLoading(false);
      }
    };

    initializeScanner();

    return () => {
      isComponentMounted = false;
      
      // Clean up ZXing reader
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch (error) {
          console.log('Reader cleanup error (ignored):', error);
        }
        readerRef.current = null;
      }
      
      // Clean up media stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up video element using captured reference
      if (videoElement) {
        try {
          videoElement.pause();
          videoElement.srcObject = null;
        } catch (error) {
          console.log('Video cleanup error (ignored):', error);
        }
      }
    };
  }, [onDetected]);

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

  if (cameraError || isSupported === false) {
    return (
      <div className="w-full h-64 bg-red-50 rounded overflow-hidden flex items-center justify-center border-2 border-red-200">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">📷</div>
          <p className="text-sm text-red-600 font-medium">Scanner Error</p>
          <p className="text-xs text-red-500 mt-2 max-w-xs">{cameraError || 'Scanner not supported'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
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
        ref={videoRef}
        className="w-full h-full object-cover" 
        playsInline 
        muted
        style={{ transform: 'scaleX(-1)' }} // Mirror video for better UX
      />
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-3/4 h-3/4 border-2 border-dashed border-white rounded-lg opacity-60">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 opacity-75 animate-pulse" />
        </div>
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Position barcode within frame
        </div>
        <div className="absolute bottom-4 right-4 bg-green-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center">
          <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse" />
          ZXing Ready
        </div>
      </div>
    </div>
  );
}