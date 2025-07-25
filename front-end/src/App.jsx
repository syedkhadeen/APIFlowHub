import { useState } from 'react';
import axios from 'axios';
import './App.css';
import FlowCanvas from './FlowCanvas';

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [curlInput, setCurlInput] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      // Adjust the base URL/port if your backend runs elsewhere
      const response = await axios.get('http://localhost:5227/api/Status');
      setStatus(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching status');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCurl = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const response = await axios.post('http://localhost:5227/api/Curl/import', curlInput, {
        headers: { 'Content-Type': 'text/plain' },
      });
      
      // Check if we have multiple endpoints or a single one
      if (response.data.endpoints) {
        // Multiple endpoints
        const endpoints = response.data.endpoints.map(endpoint => ({
          ...endpoint,
          headers: endpoint.headersJson ? JSON.parse(endpoint.headersJson) : {},
        }));
        setImportResult(endpoints);
      } else {
        // Single endpoint
        const endpoint = response.data.endpoint;
        setImportResult({
          ...endpoint,
          headers: endpoint.headersJson ? JSON.parse(endpoint.headersJson) : {},
        });
      }
    } catch (err) {
      setImportError(err.response?.data?.message || err.message || 'Error importing cURL');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>APIFlowHub</h1>
      <button className="status-btn" onClick={fetchStatus} disabled={loading}>
        {loading ? 'Checking...' : 'Check API Status'}
      </button>
      {status && (
        <div className="status-box">
          <strong>Status:</strong> {status.status} <br />
          <strong>Timestamp:</strong> {status.timestamp}
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      <div style={{ width: '100%', marginTop: '2em' }}>
        {/* Import cURL Section */}
        <div className="import-curl-section" style={{ marginTop: 0 }}>
          <h2>Import cURL</h2>
          <textarea
            className="curl-textarea"
            rows={8}
            placeholder="Paste your cURL command here..."
            value={curlInput}
            onChange={e => setCurlInput(e.target.value)}
            style={{ width: '100%', fontSize: '1.1em', marginBottom: '1em' }}
          />
          <button
            className="import-curl-btn"
            onClick={handleImportCurl}
            disabled={importLoading || !curlInput.trim()}
          >
            {importLoading ? 'Importing...' : 'Import cURL'}
          </button>
          {importError && <div className="error-box">{importError}</div>}
        </div>
      </div>

      {importResult && (
        <div className="import-result-box" style={{ marginTop: '1em', textAlign: 'left', width: '100%' }}>
          <h3>Last Import Result:</h3>
          <pre>{JSON.stringify(importResult, null, 2)}</pre>
        </div>
      )}

      {/* Visual Flow Builder (React Flow) */}
      <FlowCanvas importedApiBlock={importResult} />
    </div>
  );
}

export default App;
