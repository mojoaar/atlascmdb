'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { unwrap } from '@/lib/unwrap';
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
import styles from './OrgChartViewer.module.css';

const CENTER_COLOR = { bg: 'var(--primary-foreground, #fff)', border: 'var(--primary, #003d7a)', text: 'var(--primary, #003d7a)', isCenter: true };
const MANAGER_COLOR = { bg: 'var(--muted, #f4f6f9)', border: 'var(--border, #d4dbe4)', text: 'var(--foreground, #0f1823)' };
const REPORT_COLOR = { bg: 'var(--success-bg, #e8f5e9)', border: 'var(--success, #2e7d32)', text: 'var(--success, #2e7d32)' };

function layoutNodes(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 20, marginy: 20 });

  for (const node of nodes) {
    g.setNode(node.id, { width: 200, height: 65 });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id) || { x: 0, y: 0 };
    let colors = MANAGER_COLOR;
    if (node.isCenter) {
      colors = CENTER_COLOR;
    } else if (node.level > 0) {
      colors = REPORT_COLOR;
    }

    return {
      ...node,
      position: {
        x: pos.x - 100,
        y: pos.y - 32.5,
      },
      type: 'custom',
      data: {
        label: node.name,
        email: node.email,
        level: node.level,
        isCenter: node.isCenter,
        colors,
      },
    };
  });
}

function CustomNode({ data }) {
  const { label, email, isCenter, colors } = data;
  return (
    <div
      className={`${styles.node} ${isCenter ? styles.nodeCenter : ''}`}
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <Handle type="target" position={Position.Top} id="t" />
      <span className={styles.nodeLabel}>{label}</span>
      <span className={styles.nodeEmail}>{email}</span>
      <Handle type="source" position={Position.Bottom} id="s" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function OrgChartViewer({ userId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/users/${userId}/orgchart`)
      .then(r => r.json())
      .then(res => {
        const d = unwrap(res);
        setData(d || null);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!data || !data.nodes?.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const laidOut = layoutNodes(data.nodes, data.edges || []);
    const styledEdges = (data.edges || []).map((e, i) => {
      const color = 'var(--border, #d4dbe4)';
      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        sourceHandle: 's',
        targetHandle: 't',
        type: 'smoothstep',
        style: {
          stroke: color,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--border, #d4dbe4)',
          width: 14,
          height: 14,
        },
      };
    });

    setNodes(laidOut);
    setEdges(styledEdges);
  }, [data, setNodes, setEdges]);

  const onNodeClickHandler = useCallback((event, node) => {
    router.push(`/admin/users/${node.id}`);
  }, [router]);

  if (loading) {
    return (
      <div className={styles.empty}>
        Loading organisation chart...
      </div>
    );
  }

  if (!data || data.nodes?.length <= 1) {
    return (
      <div className={styles.empty}>
        No manager or direct reports configured for this user.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background color="var(--border, #ccc)" gap={15} />
      </ReactFlow>
    </div>
  );
}
