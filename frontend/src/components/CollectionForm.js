import React, { useState } from 'react';
import axios from 'axios';

const CollectionForm = () => {
  const [formData, setFormData] = useState({
    reference_number: '',
    name: '',
    contact: '',
    signature: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVerifyReference = async () => {
    if (!formData.reference_number) {
      setMessage('❌ Please enter a reference number');
      return;
    }

    try {
      const response = await axios.get(`/api/laundry/verify/${formData.reference_number}`);
      setVerificationResult(response.data);
      
      // Autofill form data with verified details
      setFormData(prevData => ({
        ...prevData,
        name: `${response.data.name} ${response.data.surname}`,
        contact: response.data.contact,
        signature: `${response.data.name} ${response.data.surname}` // Pre-fill signature with full name
      }));
      
      setMessage('✅ Reference number verified! Form has been auto-filled. Please review and complete collection.');
    } catch (error) {
      setMessage('❌ Invalid reference number or laundry not ready for collection');
      setVerificationResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!verificationResult) {
      setMessage('❌ Please verify your reference number first');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/laundry/collect', {
        ...formData,
        laundry_id: verificationResult.id
      });
      
      setMessage('✅ Collection completed successfully! Your laundry has been handed over.');
      setFormData({ reference_number: '', name: '', contact: '', signature: '' });
      setVerificationResult(null);
    } catch (error) {
      setMessage('❌ Error completing collection. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        📦 Collect Your Laundry
      </h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Collection Process:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Enter your reference number</li>
          <li>2. Verify your details</li>
          <li>3. Complete the collection form</li>
          <li>4. Sign to confirm receipt</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reference Number Verification */}
        <div>
          <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-1">
            Reference Number *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="reference_number"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., LAU123456"
            />
            <button
              type="button"
              onClick={handleVerifyReference}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">✅ Verified Details:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Name:</strong> {verificationResult.name} {verificationResult.surname}</p>
              <p><strong>Items:</strong> {verificationResult.clothes_count} pieces</p>
              <p><strong>Status:</strong> {verificationResult.status}</p>
              <p><strong>Submitted:</strong> {new Date(verificationResult.date_submitted).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Collection Form Fields */}
        {verificationResult && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 012 345 6789"
              />
            </div>


            <div>
              <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                Digital Signature *
              </label>
              <input
                type="text"
                id="signature"
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your full name as signature"
              />
              <p className="text-xs text-gray-500 mt-1">Type your full name to confirm receipt</p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> By signing this form, you confirm that you have received your laundry in good condition and that all items are accounted for.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing Collection...' : 'Complete Collection'}
            </button>
          </>
        )}
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-center ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 text-center">
        <p>✍️ Digital signature required for collection</p>
        <p>📞 Contact us if you have any issues</p>
      </div>
    </div>
  );
};

export default CollectionForm;


