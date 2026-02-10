import React, { useState } from "react";
import {
  CirclePlay,
  Square,
  Fullscreen,
  Minimize,
  PanelLeft,
  PanelLeftClose,
  UserCog,
  FileEdit,
  Filter,
  RefreshCw,
} from "lucide-react";

const WorkflowEditorSidebar = ({ addNode, fullscreen, setFullscreen }) => {
  const [extended, setExtended] = useState(false);

  const nodeButtons = [
    { type: "start", icon: CirclePlay, label: "شروع", color: "bg-green-500" },
    {
      type: "assign-task",
      icon: UserCog,
      label: "تخصیص وظیفه",
      color: "bg-purple-500",
    },
    {
      type: "fill-form",
      icon: FileEdit,
      label: "تکمیل فرم",
      color: "bg-cyan-500",
    },
    { type: "condition", icon: Filter, label: "شرط", color: "bg-orange-500" },
    {
      type: "change-status",
      icon: RefreshCw,
      label: "تغییر وضعیت",
      color: "bg-indigo-500",
    },
    { type: "end", icon: Square, label: "پایان", color: "bg-red-500" },
  ];

  return (
    <div
      className={`absolute left-0 top-0 z-10 bg-white dark:bg-gray-800 shadow-md border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-full ${
        extended ? "w-48" : "w-12"
      }`}
    >
      <div className="flex flex-col h-full p-2">
        <div className="flex-1 space-y-2">
          {nodeButtons.map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className={`w-full p-2 rounded-md flex items-center justify-center ${
                extended ? "justify-start space-x-2" : ""
              } ${color} text-white hover:opacity-90 transition-opacity`}
              title={label}
            >
              <Icon className="w-5 h-5" />
              {extended && <span className="text-sm">{label}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="w-full p-2 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            title={fullscreen ? "خروج از حالت تمام صفحه" : "حالت تمام صفحه"}
          >
            {fullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Fullscreen className="w-5 h-5" />
            )}
            {extended && (
              <span className="mr-2 text-sm">
                {fullscreen ? "خروج از تمام صفحه" : "تمام صفحه"}
              </span>
            )}
          </button>

          <button
            onClick={() => setExtended(!extended)}
            className="w-full p-2 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            title={extended ? "بستن نوار کناری" : "باز کردن نوار کناری"}
          >
            {extended ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditorSidebar;
