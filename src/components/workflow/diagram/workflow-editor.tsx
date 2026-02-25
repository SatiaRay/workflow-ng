// In WorkflowEditorContent component
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
import Start from './nodes/start';
import End from './nodes/end';
import AssignTask from './nodes/assign-task';
import FillForm from './nodes/fill-form';
import Condition from './nodes/condition';
import ChangeStatus from './nodes/change-status';
import WorkflowEditorSidebar from './workflow-editor-sidebar';
import NodeDetails from './node-details';

// Define node types
const nodeTypes = {
  start: Start,
  end: End,
  'assign-task': AssignTask,
  'fill-form': FillForm,
  condition: Condition,
  'change-status': ChangeStatus,
};

// Initial nodes with a start node
const initialNodes = [
  {
    id: '1',
    type: 'start',
    position: { x: 50, y: 250 },
    data: {
      label: 'شروع',
      description: 'نقطه شروع فرآیند',
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
  const [isConditionDisabled, setIsConditionDisabled] = useState(true);
  const [latestFillFormNode, setLatestFillFormNode] = useState(null);

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

  // Update condition nodes based on their connected fill-form nodes
  useEffect(() => {
    // Update condition nodes based on their connected fill-form nodes
    if (nodes.length > 0 && edges.length > 0) {
      const updatedNodes = nodes.map(node => {
        // Only process condition nodes
        if (node.type !== 'condition') return node;

        // Find incoming edges to this condition node
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        // If there are incoming edges, find the source nodes
        if (incomingEdges.length > 0) {
          // Get the source node (should be a fill-form node)
          const sourceNodeId = incomingEdges[0].source;
          const sourceNode = nodes.find(n => n.id === sourceNodeId);
          
          // If source node is a fill-form node with a form, update the condition node
          if (sourceNode?.type === 'fill-form' && sourceNode.data.form) {
            const form = sourceNode.data.form;
            
            // Only update if the form is different from current
            if (node.data.selectedFormId !== form.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  selectedFormId: form.id,
                  selectedForm: form,
                  // Keep existing condition rules or initialize empty array
                  conditionRules: node.data.conditionRules || []
                }
              };
            }
          }
        } else {
          // No incoming edges, clear the form reference
          if (node.data.selectedFormId || node.data.selectedForm) {
            return {
              ...node,
              data: {
                ...node.data,
                selectedFormId: null,
                selectedForm: null,
                conditionRules: node.data.conditionRules || []
              }
            };
          }
        }
        
        return node;
      });

      // Check if any nodes were updated
      const hasChanges = JSON.stringify(updatedNodes) !== JSON.stringify(nodes);
      if (hasChanges) {
        setNodes(updatedNodes);
      }
    }
  }, [nodes, edges]);

  // Check if condition node should be enabled in sidebar
  useEffect(() => {
    // Find the last fill-form node in the nodes array (for sidebar display)
    const fillFormNodes = nodes.filter(node => node.type === 'fill-form');
    const lastFillFormNode = fillFormNodes[fillFormNodes.length - 1];
    
    setLatestFillFormNode(lastFillFormNode || null);
    
    // Condition node is enabled only if there's at least one fill-form node in the diagram
    setIsConditionDisabled(fillFormNodes.length === 0);
  }, [nodes]);

  // Handle connections
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);

      // Validate condition node connections
      if (sourceNode?.type === 'condition') {
        const conditionIndex = params.sourceHandle?.replace('condition-', '');
        if (!conditionIndex || !sourceNode.data.conditionRules[conditionIndex]) {
          console.warn(`Invalid condition handle: ${params.sourceHandle}`);
          return;
        }
      }

      // Prevent multiple outgoing connections from non-condition nodes
      if (sourceNode?.type !== 'condition') {
        const existingOutgoingEdges = edges.filter(
          (edge) => edge.source === params.source
        );
        if (existingOutgoingEdges.length > 0) {
          console.warn(
            'Only condition nodes can have multiple outgoing connections'
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
              },
            };
          }
          return node;
        })
      );
    },
    []
  );

  // Add new node
  const addNode = useCallback((type) => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = -x + (window.innerWidth / 2 / zoom) + 200;
    const centerY = -y + window.innerHeight / 2 / zoom;

    const defaultData = {
      label: '',
      description: '',
    };

    switch (type) {
      case 'start':
        defaultData.label = 'شروع';
        defaultData.description = 'نقطه شروع فرآیند';
        break;
      case 'assign-task':
        defaultData.label = 'تخصیص وظیفه';
        defaultData.description = 'واگذاری کار به نقش مشخص';
        defaultData.role = null;
        defaultData.form = null;
        break;
      case 'fill-form':
        defaultData.label = 'تکمیل فرم';
        defaultData.description = 'تکمیل فرم توسط کاربر';
        defaultData.form = null;
        break;
      case 'condition':
        // When adding a new condition node, don't pre-select any form
        // The form will be set when connected to a fill-form node
        defaultData.label = 'شرط';
        defaultData.description = 'بررسی شرط بر اساس فرم‌های قبلی';
        defaultData.selectedFormId = null;
        defaultData.selectedForm = null;
        defaultData.conditionRules = [];
        break;
      case 'change-status':
        defaultData.label = 'تغییر وضعیت';
        defaultData.description = 'تغییر وضعیت وظیفه';
        defaultData.status = '';
        defaultData.statusLabel = '';
        defaultData.statusColor = '#3b82f6';
        defaultData.assignToRole = null;
        defaultData.shouldReassign = false;
        break;
      case 'end':
        defaultData.label = 'پایان';
        defaultData.description = 'پایان فرآیند';
        break;
    }

    const newNode = {
      id: uuidv4(),
      type,
      position: {
        x: centerX,
        y: centerY,
      },
      data: defaultData,
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
        isConditionDisabled={isConditionDisabled}
        latestFillFormNode={latestFillFormNode}
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
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        connectionLineType="smoothstep"
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
          latestFillFormNode={latestFillFormNode}
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