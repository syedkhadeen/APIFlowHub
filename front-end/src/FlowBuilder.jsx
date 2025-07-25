import React, { useState } from 'react';
import ApiBlock from './ApiBlock';

function FlowBuilder({ importedBlock }) {
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [responses, setResponses] = useState({});

  // Add imported block to flow
  React.useEffect(() => {
    if (importedBlock && importedBlock.url) {
      setBlocks(prev => [...prev, { ...importedBlock, id: Date.now() + Math.random() }]);
    }
  }, [importedBlock]);

  // Drag and drop reorder
  const onDragStart = (e, id) => {
    e.dataTransfer.setData('blockId', id);
  };
  const onDrop = (e, idx) => {
    const id = e.dataTransfer.getData('blockId');
    const fromIdx = blocks.findIndex(b => b.id == id);
    if (fromIdx === -1) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIdx, 1);
    newBlocks.splice(idx, 0, moved);
    setBlocks(newBlocks);
  };
  const onDragOver = e => e.preventDefault();

  // Run flow in order
  const runFlow = async () => {
    setResponses({});
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      try {
        const fetchOptions = {
          method: block.method,
          headers: { ...block.headers },
        };
        // Only set body for methods that allow it
        if (block.body && !['GET', 'HEAD'].includes(block.method.toUpperCase())) {
          fetchOptions.body = block.body;
        }
        // Remove Content-Type for GET/HEAD
        if (['GET', 'HEAD'].includes(block.method.toUpperCase()) && fetchOptions.headers['Content-Type']) {
          delete fetchOptions.headers['Content-Type'];
        }
        const res = await fetch(block.url, fetchOptions);
        const text = await res.text();
        setResponses(r => ({ ...r, [block.id]: text }));
      } catch (e) {
        setResponses(r => ({ ...r, [block.id]: 'Error: ' + e.message }));
      }
    }
  };

  // Save/load to localStorage
  const saveFlow = () => {
    localStorage.setItem('apiflowhub_flow', JSON.stringify(blocks));
    alert('Flow saved!');
  };
  const loadFlow = () => {
    const data = localStorage.getItem('apiflowhub_flow');
    if (data) setBlocks(JSON.parse(data));
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Visual Flow Builder</h2>
      <button onClick={runFlow} disabled={blocks.length === 0}>Run Flow</button>
      <button onClick={saveFlow} style={{ marginLeft: 8 }}>Save Flow</button>
      <button onClick={loadFlow} style={{ marginLeft: 8 }}>Load Flow</button>
      <div style={{ marginTop: 24 }}>
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            onDrop={e => onDrop(e, idx)}
            onDragOver={onDragOver}
          >
            <ApiBlock
              block={block}
              onDragStart={onDragStart}
              onDragEnd={() => {}}
              onClick={setSelected}
              isSelected={selected === block.id}
            />
            {responses[block.id] && (
              <div style={{
                background: '#fff',
                border: '1.5px solid #007bff',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '12px 0',
                fontFamily: 'monospace',
                fontSize: '1em',
                color: '#222',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#007bff' }}>API Response:</div>
                <pre style={{ margin: 0, background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{responses[block.id]}</pre>
              </div>
            )}
          </div>
        ))}
        {blocks.length === 0 && <div style={{ color: '#888', marginTop: 16 }}>No API blocks. Import a cURL to get started.</div>}
      </div>
    </div>
  );
}

export default FlowBuilder; 