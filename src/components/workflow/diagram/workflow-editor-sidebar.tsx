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
  AlertCircle,
} from "lucide-react";

const WorkflowEditorSidebar = ({ 
  addNode, 
  fullscreen, 
  setFullscreen,
  isConditionDisabled,
  latestFillFormNode 
}) => {
  const [extended, setExtended] = useState(false);

  const nodeButtons = [
    { 
      type: "start", 
      icon: CirclePlay, 
      label: "شروع", 
      color: "bg-green-500" 
    },
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
    { 
      type: "condition", 
      icon: Filter, 
      label: "شرط", 
      color: "bg-orange-500",
      disabled: isConditionDisabled
    },
    {
      type: "change-status",
      icon: RefreshCw,
      label: "تغییر وضعیت",
      color: "bg-indigo-500",
    },
    { 
      type: "end", 
      icon: Square, 
      label: "پایان", 
      color: "bg-red-500" 
    },
  ];

  return (
    <div
      className={`absolute left-0 top-0 z-10 bg-white dark:bg-gray-800 shadow-md border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-full ${
        extended ? "w-48" : "w-12"
      }`}
    >
      <div className="flex flex-col h-full p-2">
        <div className="flex-1 space-y-2">
          {nodeButtons.map(({ type, icon: Icon, label, color, disabled = false }) => (
            <button
              key={type}
              onClick={() => !disabled && addNode(type)}
              disabled={disabled}
              className={`w-full p-2 rounded-md flex items-center justify-center ${
                extended ? "justify-start space-x-2" : ""
              } ${color} text-white hover:opacity-90 transition-opacity ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title={disabled ? "ابتدا یک گره \"تکمیل فرم\" اضافه کنید" : label}
            >
              <Icon className="w-5 h-5" />
              {extended && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm">{label}</span>
                  {disabled && (
                    <AlertCircle className="w-4 h-4 text-white/70" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Status information */}
        {extended && isConditionDisabled && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">شرط غیرفعال:</div>
              <div>برای افزودن شرط، ابتدا یک گره "تکمیل فرم" اضافه کنید.</div>
            </div>
          </div>
        )}

        {extended && latestFillFormNode && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">فرم فعال:</div>
              <div>
                فرم: {latestFillFormNode.data.form?.title || "انتخاب نشده"}
              </div>
              <div className="text-xs opacity-75 mt-1">
                شرط‌ها بر اساس این فرم تعریف می‌شوند.
              </div>
            </div>
          </div>
        )}

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