'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import styles from './GraphViewer.module.css';

const NODE_COLORS = {
  service: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
  application: { bg: '#e8f5e9', border: '#388e3c', text: '#1b5e20' },
  ci: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' },
};

const CENTER_COLOR = { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' };

const EDGE_COLORS = {
  depends_on: '#c8102e',
  hosted_on: '#1976d2',
  owned_by: '#7b1fa2',
  part_of: '#f57c00',
  connects_to: '#388e3c',
  uses: '#6d4c41',
};

const EDGE_LABELS = {
  depends_on: 'depends on',
  hosted_on: 'hosted on',
  owned_by: 'owned by',
  part_of: 'part of',
  connects_to: 'connects to',
  uses: 'uses',
  related_to: 'related to',
};

function layoutNodes(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    const width = node.level === 0 ? 220 : node.level === 1 ? 180 : 150;
    g.setNode(node.id, { width, height: 60 });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - (node.level === 0 ? 110 : node.level === 1 ? 90 : 75),
        y: pos.y - 30,
      },
      type: 'custom',
      data: {
        label: node.name,
        entityType: node.type,
        level: node.level,
        isCenter: node.isCenter,
        colors: node.isCenter ? CENTER_COLOR : (NODE_COLORS[node.type] || NODE_COLORS.service),
        onClick: node.onClick,
      },
    };
  });
}

function CustomNode({ data }) {
  const { label, entityType, level, isCenter, colors } = data;
  return (
    <div
      className={`${styles.node} ${isCenter ? styles.nodeCenter : ''} ${level === 2 ? styles.nodeDim : ''}`}
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <Handle type="target" position={Position.Top} id="t" />
      <span className={styles.nodeType}>{entityType}</span>
      <span className={styles.nodeLabel}>{label}</span>
      <Handle type="source" position={Position.Bottom} id="s" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function GraphViewer({ data, onNodeClick, compact }) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!data || !data.nodes?.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const n = data.nodes.map(n => ({ ...n, onClick: onNodeClick }));
    const laidOut = layoutNodes(n, data.edges || []);
    const styledEdges = (data.edges || []).map((e, i) => {
      const color = EDGE_COLORS[e.type] || '#666';
      const isL1 = e.level === 1;
      const isL2 = e.level === 2;
      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        sourceHandle: 's',
        targetHandle: 't',
        type: 'smoothstep',
        animated: isL1,
        label: EDGE_LABELS[e.type] || e.type,
        style: {
          stroke: color,
          strokeWidth: isL1 ? 3 : isL2 ? 1.5 : 2,
          opacity: isL2 ? 0.4 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color,
          width: isL1 ? 20 : 14,
          height: isL1 ? 20 : 14,
        },
      };
    });
    setNodes(laidOut);
    setEdges(styledEdges);
  }, [data, onNodeClick, setNodes, setEdges]);

  const onNodeClickHandler = useCallback((event, node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data?.entityType);
    } else {
      router.push(`/portal/graph/${node.data?.entityType}/${node.id}`);
    }
  }, [onNodeClick, router]);

  if (!data || !data.nodes?.length) {
    return (
      <div className={styles.empty}>
        No relationships found for this entity.
      </div>
    );
  }

  const height = compact ? 300 : 'calc(100vh - 120px)';

  return (
    <div className={styles.container} style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          nodeColor={(n) => (n.data?.isCenter ? CENTER_COLOR.bg : (NODE_COLORS[n.data?.entityType] || NODE_COLORS.service).bg)}
          maskColor="var(--background, #fff)"
          style={{ background: 'var(--card, #fff)' }}
        />
        <Controls />
        <Background color="var(--muted, #ccc)" gap={20} />
      </ReactFlow>
      {!compact && (
        <div className={styles.legend}>
          <div className={styles.legendTitle}>Legend</div>
          {Object.entries(NODE_COLORS).map(([type, c]) => (
            <div key={type} className={styles.legendItem}>
              <span className={styles.legendColor} style={{ background: c.border }} />
              {type}
            </div>
          ))}
          <div className={styles.legendItem}>
            <span className={styles.legendColor} style={{ background: CENTER_COLOR.border }} />
            <span style={{ fontWeight: 600 }}>&#9733; Selected item</span>
          </div>
        </div>
      )}
    </div>
  );
}
