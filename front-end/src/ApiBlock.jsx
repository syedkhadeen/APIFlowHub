import React from 'react';

function ApiBlock({ block, onDragStart, onDragEnd, onClick, isSelected }) {
  return (
    <div
      className={`api-block${isSelected ? ' selected' : ''}`}
      draggable
      onDragStart={e => onDragStart(e, block.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick && onClick(block.id)}
      style={{
        border: '2px solid #007bff',
        borderRadius: 8,
        padding: '1em',
        margin: '1em 0',
        background: isSelected ? '#e6f0ff' : '#fff',
        cursor: 'grab',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div><strong>{block.method}</strong> <span style={{ color: '#555' }}>{block.url}</span></div>
      {block.headers && Object.keys(block.headers).length > 0 && (
        <div style={{ fontSize: '0.9em', color: '#888', marginTop: 4 }}>
          Headers: {JSON.stringify(block.headers)}
        </div>
      )}
      {block.body && (
        <div style={{ fontSize: '0.9em', color: '#888', marginTop: 4 }}>
          Body: {block.body}
        </div>
      )}
    </div>
  );
}

export default ApiBlock; 