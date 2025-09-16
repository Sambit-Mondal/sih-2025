'use client';

import Link from 'next/link';
import { Video, Shield, Heart } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">PureCure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Video Consultations
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Connect patients and doctors through secure, high-quality video conferencing. 
            Experience seamless healthcare communication with our production-ready WebRTC platform.
          </p>

          {/* Login Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Patient Login */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-4 rounded-full">
                  <Heart className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Patient Portal</h3>
              <p className="text-gray-600 mb-8">
                Book and join video consultations with your healthcare providers securely and easily.
              </p>
              <Link
                href="/login/patient"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
              >
                Login as Patient
              </Link>
            </div>

            {/* Doctor Login */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Shield className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Doctor Portal</h3>
              <p className="text-gray-600 mb-8">
                Manage appointments and conduct video consultations with your patients professionally.
              </p>
              <Link
                href="/login/doctor"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Login as Doctor
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">HD Video Quality</h4>
              <p className="text-gray-600">Crystal clear video conferencing with optimized WebRTC technology</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Secure & Private</h4>
              <p className="text-gray-600">End-to-end encrypted communications ensuring patient privacy</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Easy to Use</h4>
              <p className="text-gray-600">Intuitive interface designed for both patients and healthcare providers</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;