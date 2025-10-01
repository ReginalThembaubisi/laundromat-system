import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuickLaundryForm = () => {
  const [studentId, setStudentId] = useState('');
  const [profile, setProfile] = useState(null);
  const [clothesCount, setClothesCount] = useState('');
  const [photos, setPhotos] = useState([]);
  const [savedPhotos, setSavedPhotos] = useState([]);
  const [useSavedPhotos, setUseSavedPhotos] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load profile when student ID is entered
  useEffect(() => {
    if (studentId.length >= 3) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [studentId]);

  // Load saved photos when profile is loaded
  useEffect(() => {
    if (profile) {
      loadSavedPhotos();
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`/api/profile/${studentId}`);
      setProfile(response.data);
      setMessage('✅ Profile loaded! You can now submit quickly.');
    } catch (error) {
      if (error.response?.status === 404) {
        setProfile(null);
        setMessage('❌ Profile not found. Please create a profile first.');
      } else {
        setMessage('❌ Error loading profile');
      }
    }
  };

  const loadSavedPhotos = async () => {
    try {
      const response = await axios.get(`/api/profile/${studentId}/photos`);
      setSavedPhotos(response.data);
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
  };

  const handleSavedPhotoToggle = (photoId) => {
    if (selectedPhotoIds.includes(photoId)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(id => id !== photoId));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, photoId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile) {
      setMessage('❌ Please load your profile first');
      return;
    }

    if (!clothesCount) {
      setMessage('❌ Please enter the number of clothes');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('student_id', studentId);
      formData.append('clothes_count', clothesCount);
      formData.append('use_saved_photos', useSavedPhotos.toString());
      
      if (useSavedPhotos && selectedPhotoIds.length > 0) {
        formData.append('selected_photo_ids', JSON.stringify(selectedPhotoIds));
      } else if (photos.length > 0) {
        photos.forEach(photo => {
          formData.append('photos', photo);
        });
      }

      const response = await axios.post('/api/laundry/quick', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(`✅ ${response.data.message}`);
      setClothesCount('');
      setPhotos([]);
      setSelectedPhotoIds([]);
      setUseSavedPhotos(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            ⚡ Quick Laundry Submission
          </h2>
          
          <p className="text-gray-600 mb-6">
            Enter your student ID to load your saved profile and submit laundry quickly!
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded-md text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your student ID (e.g., 202057420)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Profile Display */}
            {profile && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Your Profile</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {profile.name} {profile.surname}</div>
                  <div><strong>Contact:</strong> {profile.contact}</div>
                  <div><strong>Location:</strong> {profile.room && profile.commune ? `${profile.room}, ${profile.commune}` : (profile.room || profile.commune || 'Not specified')}</div>
                </div>
              </div>
            )}

            {/* Clothes Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Clothes
              </label>
              <input
                type="number"
                value={clothesCount}
                onChange={(e) => setClothesCount(e.target.value)}
                placeholder="How many clothes are you dropping off?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>

            {/* Photo Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              
              {/* Toggle between saved photos and new photos */}
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="photoOption"
                    checked={!useSavedPhotos}
                    onChange={() => setUseSavedPhotos(false)}
                    className="mr-2"
                  />
                  Take New Photos
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="photoOption"
                    checked={useSavedPhotos}
                    onChange={() => setUseSavedPhotos(true)}
                    className="mr-2"
                  />
                  Use Saved Photos
                </label>
              </div>

              {/* New Photos Upload */}
              {!useSavedPhotos && (
                <div>
                  <label htmlFor="quick-photo-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-blue-600">Tap to take photos</span> or select from gallery
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                    </div>
                    <input
                      id="quick-photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {photos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      📸 {photos.length} photo(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Saved Photos Gallery */}
              {useSavedPhotos && savedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {savedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`border-2 rounded-lg p-2 cursor-pointer transition-colors ${
                        selectedPhotoIds.includes(photo.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSavedPhotoToggle(photo.id)}
                    >
                      <img
                        src={photo.path}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {photo.name}
                      </p>
                      {selectedPhotoIds.includes(photo.id) && (
                        <div className="text-center text-blue-600 text-xs mt-1">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {useSavedPhotos && savedPhotos.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No saved photos found. Take new photos or save some photos first.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !profile}
              className={`w-full py-3 px-4 rounded-md font-medium ${
                loading || !profile
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '⏳ Submitting...' : '⚡ Quick Submit Laundry'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 How it works:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• First time? Create a profile with your details</li>
              <li>• Next time, just enter your student ID and clothes count</li>
              <li>• Reuse photos from previous submissions</li>
              <li>• Submit in seconds instead of minutes!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLaundryForm;
