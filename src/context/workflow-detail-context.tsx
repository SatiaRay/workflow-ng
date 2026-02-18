import { supabaseService } from "@/services/supabase";
import type { Workflow } from "@/types/workflow";
import React, { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Define the type for the context value
type WorkflowDetailContextType = {
  workflow: Workflow;
  updateWorkflow: (updatedWorkflow: Workflow) => void;
  toggleWorkflowStatus: () => Promise<boolean>;
  deleteWorkflow: () => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
};

export const WorkflowDetailContext = createContext<
  WorkflowDetailContextType | undefined
>(undefined);

export function WorkflowDetailProvider({
  children,
  workflow: initialWorkflow,
}: {
  children: React.ReactNode;
  workflow: Workflow;
}) {
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [activeTab, setActiveTab] = useState("information");

  const updateWorkflow = (updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow);
  };

  const toggleWorkflowStatus = async () => {
    try {
      const updatedWorkflow = await supabaseService.toggleWorkflowStatus(workflow);
      setWorkflow(updatedWorkflow);
      return true;
    } catch (error: any) {
      console.error("Error toggling workflow status:", error);
      return false;
    }
  };

  const deleteWorkflow = async () => {
    try {
      await supabaseService.deleteWorkflow(workflow.id);
      toast.success("گردش‌کار با موفقیت حذف شد");
      navigate("/workflows");
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      toast.error(`حذف گردش‌کار ناموفق بود: ${error.message}`);
    }
  };

  const value: WorkflowDetailContextType = {
    workflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    activeTab,
    setActiveTab,
  };

  return (
    <WorkflowDetailContext.Provider value={value}>
      {children}
    </WorkflowDetailContext.Provider>
  );
}

export function useWorkflowDetail(): WorkflowDetailContextType {
  const context = useContext(WorkflowDetailContext);

  if (context === undefined) {
    throw new Error(
      "useWorkflowDetail must be used within a WorkflowDetailProvider",
    );
  }

  return context;
}