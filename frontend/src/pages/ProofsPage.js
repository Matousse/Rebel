import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Download, ExternalLink, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

/**
 * ProofsPage Component
 * Displays and manages all proofs of creation for the user
 */
function ProofsPage({ user, onBack }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);
  const [verificationFile, setVerificationFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/proofs/user/me', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProofs(data.data.proofs || []);
      } else {
        setError(data.message || 'Failed to fetch proofs');
      }
    } catch (error) {
      console.error('Error fetching proofs:', error);
      setError(error.message || 'Failed to fetch proofs');
    } finally {
      setLoading(false);
    }
  };

  const createProofForTrack = async (trackId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`http://localhost:5001/api/tracks/${trackId}/proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Proof created successfully for track ${trackId}`);
        fetchProofs(); // Refresh the proofs list
      } else {
        setError(data.message || 'Failed to create proof');
      }
    } catch (error) {
      console.error('Error creating proof:', error);
      setError(error.message || 'Failed to create proof');
    } finally {
      setLoading(false);
    }
  };

  const payForProof = async (proofId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`http://localhost:5001/api/proofs/pay/${proofId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Payment successful! Your proof is being processed.');
        fetchProofs(); // Refresh the proofs list
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadProof = async (proofId) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:5001/api/proofs/download/${proofId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download proof');
      }
      
      // Get the proof data
      const proofData = await response.json();
      
      // Create a blob with the JSON data
      const blob = new Blob([JSON.stringify(proofData.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `proof_${proofId}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Proof downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      setError(error.message || 'Failed to download proof');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (proof) => {
    setSelectedProof(proof);
    setVerificationFile(null);
    setVerifyResult(null);
    setShowVerifyModal(true);
  };

  const handleFileChange = (e) => {
    setVerificationFile(e.target.files[0]);
  };

  const verifyProof = async (e) => {
    e.preventDefault();
    
    if (!selectedProof || !verificationFile) {
      setError('Please select a file to verify');
      return;
    }
    
    try {
      setVerifying(true);
      setError('');
      
      const formData = new FormData();
      formData.append('audioFile', verificationFile);
      
      const response = await fetch(`http://localhost:5001/api/proofs/verify/${selectedProof._id}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerifyResult(data.data);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // Get the appropriate status color based on proof status
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-600/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  // Format timestamp to a readable date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-violet-500">Proof of Creation</h1>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-300 hover:text-red-100"
          >
            &times;
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle size={20} className="mr-2" />
          <span>{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="ml-auto text-green-300 hover:text-green-100"
          >
            &times;
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-violet-600"></div>
        </div>
      ) : proofs.length > 0 ? (
        <div className="space-y-6">
          {proofs.map(proof => (
            <div key={proof._id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex items-center mb-4 lg:mb-0">
                    <div className="bg-violet-600/20 rounded-lg p-3 mr-4">
                      <Shield size={24} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium">{proof.title}</h2>
                      <div className="flex items-center mt-1 text-sm text-gray-400">
                        <span>Created: {formatDate(proof.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>Version {proof.version}</span>
                        <span className="mx-2">•</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            proof.status
                          )}`}
                        >
                          {proof.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {proof.status === 'CONFIRMED' && proof.payment?.isPaid && (
                      <button
                        onClick={() => downloadProof(proof._id)}
                        className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded flex items-center text-sm"
                      >
                        <Download size={16} className="mr-2" />
                        Download Proof
                      </button>
                    )}
                    
                    <button
                      onClick={() => openVerifyModal(proof)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center text-sm"
                    >
                      <Shield size={16} className="mr-2" />
                      Verify
                    </button>
                    
                    {proof.blockchain?.transactionId && (
                      <a
                        href={`https://explorer.solana.com/tx/${proof.blockchain.transactionId}?cluster=${proof.blockchain.network || 'devnet'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center text-sm"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        View on Explorer
                      </a>
                    )}
                    
                    {!proof.payment?.isPaid && (
                      <button
                        onClick={() => payForProof(proof._id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center text-sm"
                      >
                        Pay {proof.payment?.cost || 10} RP
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-1">Content Hash</div>
                  <div className="bg-gray-900 p-3 rounded font-mono text-xs overflow-x-auto">
                    {proof.contentHash}
                  </div>
                </div>
                
                {proof.blockchain?.pdaAddress && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-1">Blockchain Address</div>
                    <div className="bg-gray-900 p-3 rounded font-mono text-xs overflow-x-auto">
                      {proof.blockchain.pdaAddress}
                    </div>
                  </div>
                )}
                
                {proof.status === 'PENDING' && proof.payment?.isPaid && (
                  <div className="mt-4 flex items-center text-yellow-400 text-sm">
                    <Clock size={16} className="mr-2" />
                    Your proof is being processed on the blockchain...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="bg-violet-600/20 rounded-full p-4 inline-flex mb-4">
            <Shield size={40} className="text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Proofs Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't created any proofs of creation for your tracks yet.
          </p>
          <button
            onClick={() => window.location.href = '/tracks'}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Create Your First Proof
          </button>
        </div>
      )}
      
      {/* Verification Modal */}
      {showVerifyModal && selectedProof && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Verify Proof</h2>
              
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  Upload the original audio file to verify its authenticity against the proof.
                </p>
                <div className="text-sm text-gray-400 mb-1">Proof Hash</div>
                <div className="bg-gray-900 p-2 rounded font-mono text-xs overflow-x-auto mb-4">
                  {selectedProof.contentHash}
                </div>
                
                <form onSubmit={verifyProof}>
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Audio File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={verifying || !verificationFile}
                      className="bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-white mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield size={16} className="mr-2" />
                          Verify
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                
                {verifyResult && (
                  <div className={`mt-4 p-4 rounded ${verifyResult.isValid ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
                    <div className="flex items-center font-medium mb-2">
                      {verifyResult.isValid ? (
                        <>
                          <CheckCircle size={20} className="text-green-400 mr-2" />
                          <span className="text-green-300">Verification Successful</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={20} className="text-red-400 mr-2" />
                          <span className="text-red-300">Verification Failed</span>
                        </>
                      )}
                    </div>
                    <p className={`text-sm ${verifyResult.isValid ? 'text-green-300' : 'text-red-300'}`}>
                      {verifyResult.details}
                    </p>
                    {verifyResult.onChain && (
                      <p className="text-sm text-green-300 mt-2">
                        This proof is verified on the blockchain.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProofsPage;