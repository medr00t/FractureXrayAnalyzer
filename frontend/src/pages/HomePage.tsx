import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import { Activity, Upload, BarChart2, History, Shield, Database } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'patient') {
      navigate('/my-reports', { replace: true });
    }
  }, [user, navigate]);

  // Render nothing or a loading spinner while redirecting
  if (user?.role === 'patient') {
    return null; 
  }

  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      {/* Hero section */}
      <PageContainer className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-primary-100 rounded-full">
              <Activity className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Fracture Detection for Medical Professionals
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            RadioFracture AI helps doctors and radiologists instantly analyze X-ray images to detect fractures with clinical-grade accuracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/upload"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Upload an X-ray
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Features section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides powerful tools to enhance the diagnostic process and improve patient outcomes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-gray-600">
                Simply drag & drop or select X-ray images for immediate analysis. Supports JPEG, PNG, TIFF, and DICOM formats.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Accurate Analysis</h3>
              <p className="text-gray-600">
                Our AI algorithm identifies fractures with over 90% accuracy, providing location, type, and severity information.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete History</h3>
              <p className="text-gray-600">
                Access all previous analyses with detailed results, allowing for easy case comparison and follow-ups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Trust RadioFracture AI</h2>
              <p className="text-lg text-gray-600">
                Built with security, accuracy, and clinical validation at its core.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical-Grade Security</h3>
                  <p className="text-gray-600">
                    All patient data is encrypted end-to-end and stored securely in compliance with healthcare regulations.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Trained on 20,000+ X-rays</h3>
                  <p className="text-gray-600">
                    Our algorithm has been trained on a diverse dataset of X-rays from multiple hospitals around the world.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinically Validated</h3>
                  <p className="text-gray-600">
                    Independently verified by radiologists at top medical institutions with 74.3%  overall precision.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <BarChart2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Continuous Improvement</h3>
                  <p className="text-gray-600">
                    Our AI model is constantly updated with new data and the latest research to improve accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform Your Diagnostic Workflow?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of medical professionals already using RadioFracture AI to improve patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/upload"
                  className="px-6 py-3 bg-white text-primary-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
                >
                  Upload an X-ray
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-3 border border-white text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;