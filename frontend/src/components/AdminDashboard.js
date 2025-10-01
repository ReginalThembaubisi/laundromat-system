import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    fetchRequests();
    fetchCollections();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/laundry');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage('❌ Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/api/collections');
      setCollections(response.data);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setMessage('❌ Error loading collection records');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/laundry/${id}`, { status: newStatus });
      setMessage(`✅ Request ${id} updated to ${newStatus}`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating request:', error);
      setMessage('❌ Error updating request');
    }
  };


  const sendWhatsApp = async (id, messageType) => {
    try {
      const response = await axios.get(`/api/whatsapp/link/${id}?messageType=${messageType}`);
      
      if (response.data.success) {
        // Open WhatsApp link in new tab
        window.open(response.data.whatsapp_link, '_blank');
        setMessage(`✅ WhatsApp link opened! Send the message to notify the student.`);
      } else {
        setMessage(`❌ Error generating WhatsApp link`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(`❌ Error generating WhatsApp link: ${errorMessage}`);
      console.error('Error generating WhatsApp link:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🏠 Admin Dashboard
          </h2>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Laundry Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✅ Collection Records ({collections.length})
              </button>
            </nav>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-md text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Laundry Requests Tab */}
          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No laundry requests found</p>
              <p className="text-sm">Requests will appear here when students submit them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clothes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ref #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{request.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.name} {request.surname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.commune}
                        {request.photos && request.photos.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-600">📸 {request.photos.length} photos</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.clothes_count} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {request.reference_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.date_submitted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          {/* Status Actions */}
                          <div className="flex space-x-1">
                            {request.status === 'Pending' && (
                              <button
                                onClick={() => updateStatus(request.id, 'In Progress')}
                                className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {request.status === 'In Progress' && (
                              <button
                                onClick={() => updateStatus(request.id, 'Completed')}
                                className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs transition-colors"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                          
                          
                          {/* WhatsApp Actions */}
                          <div className="flex space-x-1">
                            {request.status === 'Completed' && (
                              <button
                                onClick={() => sendWhatsApp(request.id, 'collection')}
                                className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs transition-colors"
                                title="Send collection notification"
                              >
                                📱 Collect
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Total requests: {requests.length}
                </div>
                <button
                  onClick={fetchRequests}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
            </>
          )}

          {/* Collection Records Tab */}
          {activeTab === 'collections' && (
            <>
              {collections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-lg">No Collections Yet</p>
                  <p className="text-sm">Collection records will appear here once customers collect their laundry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collected By
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collection Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {collections.map((collection) => (
                        <tr key={collection.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              {collection.reference_number}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {collection.name} {collection.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {collection.contact}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {collection.clothes_count} pieces
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {collection.collection_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {collection.collection_contact}
                            </div>
                            <div className="text-xs text-gray-400">
                              Signed: {collection.collection_signature}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(collection.collection_date)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ Collected
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Total Collections: {collections.length}
                </div>
                <button
                  onClick={() => { fetchRequests(); fetchCollections(); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 Refresh All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
