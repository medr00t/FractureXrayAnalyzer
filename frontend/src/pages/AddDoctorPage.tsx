import React, { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

// This is a new API function we will create next
// For now, we'll mock it to build the form.
const addDoctor = async (doctorData: any, token: string) => {
    console.log("Adding doctor:", doctorData, "with token:", token);
    // Mock a successful response
    // In the next step, we'll replace this with a real API call.
    const response = await fetch('http://localhost:3000/api/chef/add-doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(doctorData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to add doctor');
    }
    return data;
};


const AddDoctorPage: React.FC = () => {
    const { token } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!token) {
            setError("Authentication error. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await addDoctor({ fullName, email, password }, token);
            setSuccess(response.message || 'Doctor account created successfully!');
            // Clear form
            setFullName('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer title="Add a New Doctor" subtitle="Create a new account for a doctor in the system.">
            <div className="max-w-xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    {success && (
                         <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating Account...' : 'Add Doctor'}
                        </button>
                    </div>
                </form>
            </div>
        </PageContainer>
    );
};

export default AddDoctorPage; 