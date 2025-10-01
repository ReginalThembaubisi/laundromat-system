import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerRecords = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('reference'); // 'reference', 'contact', 'all'

  useEffect(() => {
    fetchMyCollections();
  }, []);

  const fetchMyCollections = async () => {
    try {
      const response = await axios.get('/api/collections/my');
      setCollections(response.data);
    } catch (error) {
      console.error('Error fetching my collections:', error);
      setMessage('❌ Error loading your collection records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredCollections = (collections || []).filter(collection => {
    if (!searchTerm) return true; // Show all if no search term
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (filterBy) {
      case 'reference':
        return collection.reference_number.toLowerCase().includes(searchLower);
      case 'contact':
        return collection.contact.toLowerCase().includes(searchLower);
      case 'name':
        return (collection.name + ' ' + collection.surname).toLowerCase().includes(searchLower);
      case 'all':
      default:
        return collection.reference_number.toLowerCase().includes(searchLower) ||
               collection.contact.toLowerCase().includes(searchLower) ||
               (collection.name + ' ' + collection.surname).toLowerCase().includes(searchLower);
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading your collection records...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📋 My Collection Records
          </h2>

          {message && (
            <div className={`mb-4 p-3 rounded-md text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={
                    filterBy === 'reference' ? 'Enter your reference number...' :
                    filterBy === 'contact' ? 'Enter your phone number...' :
                    filterBy === 'name' ? 'Enter your name...' :
                    'Search by reference, phone, or name...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="reference">Reference Number</option>
                  <option value="contact">Phone Number</option>
                  <option value="name">Name</option>
                  <option value="all">All Fields</option>
                </select>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              💡 <strong>Tip:</strong> Use your reference number to find your specific collections, or search by phone number/name.
            </div>
          </div>

          {filteredCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">
                {searchTerm ? 'No Collections Found' : 'No Collections Yet'}
              </p>
              <p className="text-sm">
                {searchTerm ? 
                  `No collections match your search for "${searchTerm}". Try a different search term or check your reference number.` : 
                  'Your collection records will appear here once you collect your laundry. Use the search above to find your collections by reference number, phone, or name.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Show All Collections
                </button>
              )}
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
                      Items
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
                  {filteredCollections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {collection.reference_number}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {collection.clothes_count} pieces
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
              {searchTerm ? `Showing ${filteredCollections.length} of ${(collections || []).length} collections` : `Total Collections: ${(collections || []).length}`}
            </div>
            <button
              onClick={fetchMyCollections}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRecords;
