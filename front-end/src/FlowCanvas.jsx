import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from 'react-flow-renderer';
import './App.css';
import axios from 'axios';

const initialNodes = [];
const initialEdges = [];

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE'];

// Custom node component to show data (delete button removed)
function ApiNode({ id, data, selected }) {
  return (
    <div
      style={{
        background: selected ? '#e6f0ff' : '#fff',
        border: '2px solid #007bff',
        borderRadius: 14,
        padding: '1.3em',
        minWidth: 220,
        minHeight: 80,
        position: 'relative',
        boxShadow: selected ? '0 4px 16px rgba(0,123,255,0.10)' : '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'grab',
        fontFamily: 'monospace',
        transition: 'all 0.3s ease, transform 0.1s ease, box-shadow 0.2s, border 0.2s',
      }}
      onMouseOver={e => (e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,123,255,0.18)')}
      onMouseOut={e => (e.currentTarget.style.boxShadow = selected ? '0 4px 16px rgba(0,123,255,0.10)' : '0 2px 8px rgba(0,0,0,0.08)')}
    >
      <Handle type="target" position="top" style={{ background: '#007bff', transition: 'all 0.2s ease' }} />
      <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: 4 }}>{data.method || 'GET'}</div>
      <div style={{ fontSize: '0.95em', color: '#333', marginBottom: 4, wordBreak: 'break-all' }}>{data.url || <span style={{ color: '#aaa' }}>[No URL]</span>}</div>
      {data.headers && data.headers.length > 0 && (
        <div style={{ fontSize: '0.85em', color: '#888', marginBottom: 2 }}>
          Headers: {data.headers.map(h => h.key ? `${h.key}: ${h.value}` : '').filter(Boolean).join(', ')}
        </div>
      )}
      {data.body && (
        <div style={{ fontSize: '0.85em', color: '#888', marginBottom: 2 }}>
          Body: {data.body.length > 40 ? data.body.slice(0, 40) + '...' : data.body}
        </div>
      )}
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (data.onDelete) {
            data.onDelete(id);
          }
        }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: '#ff4d4f',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          fontSize: '1em',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          zIndex: 10,
          transition: 'transform 0.15s ease, background 0.15s ease',
        }}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)', e.currentTarget.style.background = '#ff3333')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.background = '#ff4d4f')}
        title="Delete Node"
      >
        ×
      </button>
      <Handle type="source" position="bottom" style={{ background: '#007bff', transition: 'all 0.2s ease' }} />
      {data.response && (
        <div style={{
          background: '#f4f4f4',
          border: '1px solid #bbb',
          borderRadius: 6,
          padding: '8px 6px',
          marginTop: 10,
          fontSize: '0.92em',
          color: '#222',
          maxHeight: 120,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: 2 }}>Response:</div>
          <div>{data.response.length > 500 ? data.response.slice(0, 500) + '...' : data.response}</div>
        </div>
      )}
    </div>
  );
}

function LoadFlowModal({ isOpen, onClose, onSelectFlow }) {
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/flow/list').then(res => {
        setFlows(res.data);
      }).catch(err => {
        console.error("Failed to fetch flows:", err);
        alert("Could not load saved flows. Check the console for details.");
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 2000,
    }}>
      <div style={{ 
        background: '#ffffff', borderRadius: 12, padding: '2em', 
        width: '90%', maxWidth: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        maxHeight: '80vh', overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Load a Saved Flow</h3>
        {flows.length === 0 ? (
          <p style={{ color: '#555' }}>No saved flows found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {flows.map(flow => (
              <li key={flow.id} onClick={() => onSelectFlow(flow.id)}
                  style={{ 
                    padding: '0.9em 1.2em', margin: '0.5em 0', background: '#f8f9fa', 
                    borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s',
                    border: '1px solid #dee2e6'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#e9ecef'}
                  onMouseOut={e => e.currentTarget.style.background = '#f8f9fa'}
              >
                {flow.name} (ID: {flow.id})
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} style={{ 
          marginTop: '1.5em', width: '100%', background: '#6c757d', 
          color: 'white', border: 'none', padding: '0.8em', borderRadius: 8, cursor: 'pointer'
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Sidebar({ node, onChange, onClose }) {
  const [local, setLocal] = useState(node ? { ...node.data } : {});

  useEffect(() => {
    setLocal(node ? { ...node.data } : {});
  }, [node]);

  if (!node) return null;

  const handleHeaderChange = (idx, key, value) => {
    const headers = [...(local.headers || [])];
    headers[idx] = { ...headers[idx], [key]: value };
    setLocal({ ...local, headers });
  };

  const addHeader = () => {
    setLocal({ ...local, headers: [...(local.headers || []), { key: '', value: '' }] });
  };

  const removeHeader = idx => {
    const headers = [...(local.headers || [])];
    headers.splice(idx, 1);
    setLocal({ ...local, headers });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 300,
      height: '100vh',
      background: '#fff',
      boxShadow: '-2px 0 16px rgba(0,0,0,0.08)',
      zIndex: 100,
      padding: 24,
      overflowY: 'auto',
    }}>
      <h3>Edit API Node</h3>
      <label>Method:</label>
      <select
        value={local.method}
        onChange={e => setLocal({ ...local, method: e.target.value })}
        style={{ width: '100%', marginBottom: 12 }}
      >
        {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <label>URL:</label>
      <input
        type="text"
        value={local.url}
        onChange={e => setLocal({ ...local, url: e.target.value })}
        style={{ width: '100%', marginBottom: 12 }}
      />
      <label>Headers:</label>
      {(local.headers || []).map((h, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <input
            type="text"
            placeholder="Key"
            value={h.key}
            onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder="Value"
            value={h.value}
            onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={() => removeHeader(idx)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>x</button>
        </div>
      ))}
      <button onClick={addHeader} style={{ marginBottom: 12 }}>Add Header</button>
      <label>Body (JSON):</label>
      <textarea
        value={local.body || ''}
        onChange={e => setLocal({ ...local, body: e.target.value })}
        style={{ width: '100%', minHeight: 60, marginBottom: 16 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { onChange(local); onClose(); }} style={{ flex: 1 }}>Save</button>
        <button onClick={onClose} style={{ flex: 1, background: '#eee' }}>Cancel</button>
      </div>
    </div>
  );
}

function FlowCanvasContent({ importedApiBlock }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [responses, setResponses] = useState({});
  const [isLoadModalOpen, setLoadModalOpen] = useState(false);
  const idRef = useRef(1);
  const { project } = useReactFlow();

  // Add a new API node
  const addApiNode = useCallback((block) => {
    const id = `api-${idRef.current++}`;
    setNodes(nds => [
      ...nds,
      {
        id,
        type: 'apiNode',
        position: project({ x: 100 + (nds.length % 5) * 250, y: 100 + Math.floor(nds.length / 5) * 150 }),
        data: block || { method: 'GET', url: '', headers: [], body: '' },
      },
    ]);
  }, [setNodes, project]);
  
  // This is the robust delete handler.
  const handleDeleteNode = (idToDelete) => {
    // Use functional updates to guarantee the latest state is used.
    setNodes((currentNodes) => currentNodes.filter((n) => n.id !== idToDelete));
    setEdges((currentEdges) =>
      currentEdges.filter((e) => e.source !== idToDelete && e.target !== idToDelete)
    );
    setResponses((currentResponses) => {
      const newResponses = { ...currentResponses };
      delete newResponses[idToDelete];
      return newResponses;
    });

    // If the deleted node was selected, close the sidebar.
    setSelectedNode((currentNode) => {
      if (currentNode && currentNode.id === idToDelete) {
        setSidebarOpen(false);
        return null; // Deselect
      }
      return currentNode;
    });
  };

  // Add node when importedApiBlock changes
  useEffect(() => {
    if (!importedApiBlock) return;

    const blocksToAdd = Array.isArray(importedApiBlock) ? importedApiBlock : [importedApiBlock];

    blocksToAdd.forEach(block => {
      if (block && block.url) {
        addApiNode({
          method: block.method,
          url: block.url,
          headers: block.headers ? Object.entries(block.headers).map(([key, value]) => ({ key, value })) : [],
          body: block.body || '',
        });
      }
    });
    // eslint-disable-next-line
  }, [importedApiBlock]);

  // Handle node click to open sidebar
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  }, []);

  const handlePaneClick = () => {
    setSelectedNode(null);
    setSidebarOpen(false);
  }

  // Save node changes
  const handleSidebarSave = useCallback((data) => {
    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data } : n));
  }, [selectedNode, setNodes]);

  // Save flow to backend
  const saveFlow = async () => {
    const flowName = prompt("Enter a name for your flow:");
    if (!flowName) return; // User cancelled

    const flowData = {
      nodes: nodes.map(({ id, position, data }) => ({ id, position, data: { ...data, response: undefined, onDelete: undefined }})),
      edges,
    };
    await axios.post('/api/flow/save', { name: flowName, flowData });
    alert('Flow saved!');
  };

  // Load flows from backend
  const handleLoadFlow = async (flowId) => {
    const res = await axios.get(`/api/flow/${flowId}`);
    const flowData = res.data;
    if (flowData.nodes && flowData.edges) {
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
      setResponses({});
    }
    setLoadModalOpen(false);
  };

  // Run Flow logic
  const runFlow = async () => {
    // Topological sort to get execution order
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const inDegree = {};
    nodes.forEach(n => { inDegree[n.id] = 0; });
    edges.forEach(e => { inDegree[e.target]++; });
    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const order = [];
    const visited = new Set();
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      order.push(id);
      visited.add(id);
      edges.filter(e => e.source === id).forEach(e => {
        inDegree[e.target]--;
        if (inDegree[e.target] === 0) queue.push(e.target);
      });
    }
    // Execute in order
    let newResponses = {};
    for (const id of order) {
      const node = nodeMap[id];
      if (!node) continue;
      try {
        const headers = {};
        (node.data.headers || []).forEach(h => { if (h.key) headers[h.key] = h.value; });
        const fetchOptions = {
          method: node.data.method,
          headers,
        };
        if (node.data.body && !['GET', 'HEAD'].includes(node.data.method.toUpperCase())) {
          fetchOptions.body = node.data.body;
        }
        if (['GET', 'HEAD'].includes(node.data.method.toUpperCase()) && fetchOptions.headers['Content-Type']) {
          delete fetchOptions.headers['Content-Type'];
        }
        const res = await fetch(node.data.url, fetchOptions);
        const text = await res.text();
        newResponses[id] = text;
      } catch (e) {
        newResponses[id] = 'Error: ' + e.message;
      }
    }
    setResponses(newResponses);
  };

  return (
    <>
      <div style={{ width: '80vw', maxWidth: 1200, height: '80vh', background: '#f6f8fa', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', margin: '2rem auto', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 24, top: 24, zIndex: 10 }}>
          <button onClick={() => addApiNode()} style={{ marginRight: 8 }}>Add API Node</button>
          <button onClick={saveFlow} style={{ marginRight: 8 }}>Save Flow</button>
          <button onClick={() => setLoadModalOpen(true)} style={{ marginRight: 8 }}>Load Flows</button>
          <button onClick={runFlow} style={{ background: '#28a745', color: '#fff' }}>Run Flow</button>
        </div>
        // In the FlowCanvasContent component, update the ReactFlow component:
        
        <ReactFlow
          nodes={nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              response: responses[n.id],
              onDelete: handleDeleteNode,
            },
            // Add smooth animation for node position changes
            style: { transition: 'transform 0.3s ease' },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={params => setEdges(eds => addEdge({...params, animated: true}, eds))}
          onNodeClick={onNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
          nodeTypes={{ apiNode: ApiNode }}
          snapToGrid={true}
          snapGrid={[10, 10]}  // Smaller grid for finer control
          panOnDrag={true}
          zoomOnScroll={true}
          defaultZoom={1.1}
          minZoom={0.5}
          maxZoom={2.5}
          nodesDraggable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}  // Prevents accidental selection during drag
          defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
          // Add smooth connection lines
          connectionLineStyle={{ stroke: '#007bff', strokeWidth: 2, animation: 'ease' }}
          connectionLineType="smoothstep"
          // Improve edge appearance
          defaultEdgeOptions={{
            style: { stroke: '#007bff', strokeWidth: 2 },
            type: 'smoothstep',
            animated: true,
          }}
        >
          <MiniMap 
            nodeStrokeColor="#007bff"
            nodeColor={node => (node.selected ? '#e6f0ff' : '#ffffff')}
            nodeBorderRadius={14}
          />
          <Controls />
          <Background color="#e0e7ef" gap={20} variant="lines" />
        </ReactFlow>
        {sidebarOpen && selectedNode && (
          <Sidebar
            node={selectedNode}
            onChange={handleSidebarSave}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
      <LoadFlowModal
        isOpen={isLoadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onSelectFlow={handleLoadFlow}
      />
      {/* Output summary panel */}
      <div style={{
        width: '100%',
        maxWidth: 900,
        margin: '0 auto 2rem auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '1.5em',
        fontFamily: 'monospace',
      }}>
        <h3 style={{ color: '#007bff', marginTop: 0 }}>Flow Output Summary</h3>
        {nodes.length === 0 ? (
          <div style={{ color: '#888' }}>No nodes to show output for.</div>
        ) : (
          nodes.map(n => (
            <div key={n.id} style={{ marginBottom: 18 }}>
              <div><b>{n.data.method}</b> <span style={{ color: '#555' }}>{n.data.url}</span></div>
              <div style={{ color: '#888', fontSize: '0.95em', marginBottom: 2 }}>Node ID: {n.id}</div>
              <div style={{ background: '#f4f4f4', borderRadius: 6, padding: 8, fontSize: '0.97em', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#222' }}>
                {responses[n.id] ? (responses[n.id].length > 1000 ? responses[n.id].slice(0, 1000) + '...' : responses[n.id]) : <span style={{ color: '#aaa' }}>[No response]</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function FlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}

export default FlowCanvas;