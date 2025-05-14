import React, { useState } from 'react';
import { Shield, Loader } from 'lucide-react';

/**
 * TrackProofButton Component
 * Button to create a proof for a track directly from the tracks list or track details page
 */
function TrackProofButton({ trackId, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createProof = async () => {
    try {
      setLoading(true);
      setError('');

      // Make the API call to create a proof
      const response = await fetch(`http://localhost:5001/api/tracks/${trackId}/proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Proof creation response:', data);
        
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(data.data);
        }
      } else {
        setError(data.message || 'Failed to create proof');
        console.error('Error creating proof:', data.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to create proof');
      console.error('Error creating proof:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={createProof}
        disabled={loading}
        className="flex items-center space-x-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
        title="Create blockchain timestamp proof"
      >
        {loading ? (
          <Loader size={16} className="animate-spin" />
        ) : (
          <Shield size={16} />
        )}
        <span>Create Proof</span>
      </button>
      
      {error && (
        <div className="text-red-400 text-xs mt-1">{error}</div>
      )}
    </>
  );
}

export default TrackProofButton;