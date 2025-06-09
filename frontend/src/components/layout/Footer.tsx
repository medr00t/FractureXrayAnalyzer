import React from 'react';
import { Activity, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and about */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-primary-800">RadioFracture AI</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Advanced AI technology for accurate and rapid fracture detection in radiological images.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:info@radiofracture.ai" className="text-gray-500 hover:text-primary-600 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Features</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Technology</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Research</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Partners</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">API Reference</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} RadioFracture AI. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 flex items-center mt-2 md:mt-0">
              Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> for medical professionals
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;