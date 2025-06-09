import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const RegisterForm: React.FC = () => {
  const { register, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'radiologist'>('doctor');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ 
      name, 
      email, 
      password, 
      role,
      specialty: specialty || undefined,
      hospital: hospital || undefined
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create an Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Dr. Jane Smith"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="doctor@hospital.com"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
            required
            minLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="doctor"
                checked={role === 'doctor'}
                onChange={() => setRole('doctor')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Doctor</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="radiologist"
                checked={role === 'radiologist'}
                onChange={() => setRole('radiologist')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Radiologist</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
            Specialty (optional)
          </label>
          <input
            id="specialty"
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Orthopedics, Diagnostic Radiology"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-1">
            Hospital/Institution (optional)
          </label>
          <input
            id="hospital"
            type="text"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., City General Hospital"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md font-medium ${
            loading 
              ? 'opacity-70 cursor-not-allowed' 
              : 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;