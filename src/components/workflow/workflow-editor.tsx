import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import Decision from './nodes/descision';
import End from './nodes/end';
import Process from './nodes/process';
import Start from './nodes/start';
import WorkflowEditorSidebar from './workflow-editor-sidebar';
import NodeDetails from './node-details';

// Define node types
const nodeTypes = {
  start: Start,
  process: Process,
  decision: Decision,
  end: End,
};

// Initial nodes with a start node
const initialNodes = [
  {
    id: '1',
    type: 'start',
    position: { x: 250, y: 25 },
    data: {
      label: 'شروع',
      description: 'نقطه شروع فرآیند',
      conditions: [],
    },
  },
];

const WorkflowEditorContent = ({
  onChange,
  workflowData = null,
}) => {
  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflowData?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflowData?.edges || []
  );
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Refs to track previous state and prevent infinite loops
  const previousNodesRef = useRef(nodes);
  const previousEdgesRef = useRef(edges);
  const isInitialMount = useRef(true);

  const reactFlowInstance = useReactFlow();

  // Update parent when flow changes, but only when there's an actual change
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check if nodes or edges actually changed
    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(previousNodesRef.current);
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(previousEdgesRef.current);

    if ((nodesChanged || edgesChanged) && onChange) {
      onChange({ nodes, edges });
      
      // Update refs after calling onChange
      previousNodesRef.current = nodes;
      previousEdgesRef.current = edges;
    }
  }, [nodes, edges, onChange]);

  // Handle connections
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);

      // Set default handle for start nodes
      if (sourceNode?.type === 'start') {
        params.sourceHandle = 'right';
      }

      // Validate decision node connections
      if (sourceNode?.type === 'decision') {
        if (
          !params.sourceHandle ||
          !sourceNode.data.conditions.includes(params.sourceHandle)
        ) {
          console.warn(`Invalid sourceHandle: ${params.sourceHandle}`);
          return;
        }
      }

      // Prevent multiple outgoing connections from non-decision nodes
      if (sourceNode?.type !== 'decision') {
        const existingOutgoingEdges = edges.filter(
          (edge) => edge.source === params.source
        );
        if (existingOutgoingEdges.length > 0) {
          console.warn(
            'Only decision nodes can have multiple outgoing connections'
          );
          return;
        }
      }

      // Add new edge
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `${params.source}-${params.sourceHandle}-${
              params.target
            }-${Date.now()}`,
            type: 'step',
            animated: true,
            style: { stroke: '#3b82f6' },
          },
          eds
        )
      );
    },
    [nodes, edges]
  );

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Update node data
  const onNodeUpdate = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
                conditions:
                  newData.conditions?.filter((c) => c && c.trim() !== '') || [],
              },
            };
          }
          return node;
        })
      );

      // Handle edge management for decision nodes
      if (newData.type === 'decision') {
        setEdges((eds) => {
          const otherEdges = eds.filter((edge) => edge.source !== nodeId);
          const newConditions =
            newData.conditions?.filter((c) => c && c.trim() !== '') || [];
          const validEdges = eds.filter(
            (edge) =>
              edge.source === nodeId &&
              newConditions.includes(edge.sourceHandle)
          );
          const newEdges = newConditions
            .filter(
              (condition) =>
                !validEdges.some((edge) => edge.sourceHandle === condition)
            )
            .map((condition, index) => ({
              id: `${nodeId}-${condition}-${index}`,
              source: nodeId,
              target: null,
              sourceHandle: condition,
              type: 'step',
              animated: true,
              style: { stroke: '#3b82f6' },
            }));
          return [...otherEdges, ...validEdges, ...newEdges];
        });
      }
    },
    []
  );

  // Add new node
  const addNode = useCallback((type) => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = -x + window.innerWidth / 2 / zoom;
    const centerY = -y + window.innerHeight / 2 / zoom;

    const newNode = {
      id: uuidv4(),
      type,
      position: {
        x: centerX,
        y: centerY,
      },
      data: {
        label:
          type === 'start'
            ? 'شروع'
            : type === 'process'
            ? 'فرآیند'
            : type === 'decision'
            ? 'تصمیم'
            : 'پایان',
        description: '',
        conditions: type === 'decision' ? ['شرط پیش‌فرض'] : [],
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance]);

  // Delete node
  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    []
  );

  // Clear selection
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode.id);
        setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);

  return (
    <div
      className={`w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative h-[600px]'
      }`}
    >
      <WorkflowEditorSidebar
        addNode={addNode}
        fullscreen={fullscreen}
        setFullscreen={setFullscreen}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          onUpdate={onNodeUpdate}
          onClose={() => setSelectedNode(null)}
          onDelete={deleteNode}
        />
      )}
    </div>
  );
};

const WorkflowEditor = ({ onChange, workflowData = null }) => {
  // Memoize the onChange handler to prevent unnecessary re-renders
  const handleChange = useCallback((data) => {
    if (onChange) {
      onChange(data);
    }
  }, [onChange]);

  return (
    <ReactFlowProvider>
      <WorkflowEditorContent
        onChange={handleChange}
        workflowData={workflowData}
      />
    </ReactFlowProvider>
  );
};

export default WorkflowEditor;