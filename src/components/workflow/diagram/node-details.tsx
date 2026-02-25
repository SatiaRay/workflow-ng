import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, FileText } from "lucide-react"; // Added FileText import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormService } from "@/services/supabase/form-services";
import { RoleService } from "@/services/supabase/role-service";
import { supabaseService } from "@/services/supabase";
import type { Workflow } from "@/types/workflow";

const NodeDetails = ({
  workflow,
  node,
  onUpdate,
  onClose,
  onDelete,
  latestFillFormNode,
} : {
  workflow: Workflow,
  node: any,
  onUpdate: () => void,
  onClose: () => void,
  onDelete: () => void,
  latestFillFormNode: any
}) => {
  // Added latestFillFormNode prop
  const [label, setLabel] = useState(node.data.label || "");
  const [description, setDescription] = useState(node.data.description || "");

  // For assign-task node
  const [selectedRole, setSelectedRole] = useState(node.data.role || null);
  const [selectedForm, setSelectedForm] = useState(node.data.form || null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableForms, setAvailableForms] = useState([]);

  // For condition node
  const [conditionRules, setConditionRules] = useState([]);
  const [formFields, setFormFields] = useState({}); // { formId: [fields] }
  const [selectedFormId, setSelectedFormId] = useState(
    node.data.selectedFormId || latestFillFormNode?.data?.form?.id || null
  );
  const [selectedFormData, setSelectedFormData] = useState(
    node.data.selectedForm || latestFillFormNode?.data?.form || null
  );

  // Initialize condition rules from saved data
  useEffect(() => {
    if (node.type === "condition" && node.data.conditionRules) {
      // Transform saved rules to component format
      const transformedRules = node.data.conditionRules.map((rule) => ({
        selectedField: rule.fieldId || "none",
        operator: rule.operator || "none",
        value: rule.value || "",
        fieldType: rule.fieldType || "text",
        fieldInfo: null, // Will be populated when fields are loaded
      }));
      setConditionRules(transformedRules);
    } else if (node.type === "condition") {
      // Initialize with empty rule if no saved rules
      setConditionRules([
        {
          selectedField: "none",
          operator: "none",
          value: "",
          fieldType: "text",
          fieldInfo: null,
        },
      ]);
    }
  }, [node.type, node.data.conditionRules]);

  // Load data based on node type
  useEffect(() => {
    const loadData = async () => {
      if (node.type === "assign-task" || node.type === "fill-form") {
        const forms = await supabaseService.getWorkflowForms(workflow.id)
        setAvailableForms(forms);

        if (node.type === "assign-task") {
          const roleService = new RoleService();
          const roles = await roleService.getRoles();
          setAvailableRoles(roles);
        }
      }

      // For condition node, load fields for the selected form
      if (node.type === "condition") {
        const formIdToUse = selectedFormId;

        if (formIdToUse) {
          try {
            const formService = new FormService();
            const form = await formService.getFormById(formIdToUse);

            if (form && form.schema) {
              const schema =
                typeof form.schema === "string"
                  ? JSON.parse(form.schema)
                  : form.schema;

              const fields = schema?.fields || [];
              
              setFormFields({
                [formIdToUse]: fields,
              });

              // Update fieldInfo for existing rules
              if (conditionRules.length > 0) {
                const updatedRules = conditionRules.map((rule) => {
                  if (rule.selectedField && rule.selectedField !== "none") {
                    const field = fields.find(
                      (f) => f.id.toString() === rule.selectedField
                    );
                    if (field) {
                      return {
                        ...rule,
                        fieldType: field.type || "text",
                        fieldInfo: {
                          ...field,
                          options: normalizeOptions(field.options),
                        },
                      };
                    }
                  }
                  return rule;
                });
                setConditionRules(updatedRules);
              }
            }
          } catch (error) {
            console.error("Error loading form fields:", error);
            setFormFields({});
          }
        }
      }
    };

    loadData();
  }, [node.type, selectedFormId, latestFillFormNode]);

  const handleSave = () => {
    const updates = {
      label,
      description,
    };

    switch (node.type) {
      case "assign-task":
        updates.role = selectedRole?.id === "none" ? null : selectedRole;
        updates.form = selectedForm?.id === "none" ? null : selectedForm;
        break;
      case "fill-form":
        updates.form = selectedForm?.id === "none" ? null : selectedForm;
        break;
      case "condition":
        // Save selected form info
        updates.selectedFormId = selectedFormId;
        updates.selectedForm = selectedFormData;

        // Filter out invalid rules and format them properly
        const validConditionRules = conditionRules
          .filter(
            (rule) =>
              rule.selectedField &&
              rule.selectedField !== "none" &&
              rule.operator &&
              rule.operator !== "none" &&
              (["is_empty", "is_not_empty"].includes(rule.operator) ||
                rule.value !== undefined),
          )
          .map((rule) => {
            const fieldInfo = getFieldById(selectedFormId, rule.selectedField);

            return {
              fieldId: rule.selectedField,
              fieldLabel: fieldInfo?.label || "",
              fieldType: rule.fieldType || "text",
              operator: rule.operator,
              value: rule.value || "",
            };
          });

        console.log("Saving condition rules:", {
          originalCount: conditionRules.length,
          validCount: validConditionRules.length,
          rules: validConditionRules,
        });

        updates.conditionRules = validConditionRules;
        break;
      case "change-status":
        updates.status = statusValue || statusLabel;
        updates.statusLabel = statusLabel;
        updates.statusColor = statusColor;
        updates.assignToRole = assignToRole;
        updates.shouldReassign = shouldReassign;
        break;
    }

    console.log("Final updates to save:", updates);
    onUpdate(node.id, updates);
    onClose();
  };

  const addConditionRule = () => {
    const newRule = {
      selectedField: "none",
      operator: "none",
      value: "",
      fieldType: "text",
      fieldInfo: null,
    };
    setConditionRules([...conditionRules, newRule]);
  };

  const updateConditionRule = (index, field, value) => {
    const newRules = [...conditionRules];

    if (field === "selectedField" && value !== "none") {
      const selectedField = getFieldById(selectedFormId, value);
      const fieldType = selectedField?.type || "text";

      // Normalize options if they exist
      const fieldInfo = selectedField
        ? {
            ...selectedField,
            options: normalizeOptions(selectedField.options),
          }
        : null;

      newRules[index] = {
        ...newRules[index],
        [field]: value,
        fieldType: fieldType,
        operator: "none", // Reset operator when field changes
        value: "", // Reset value when field changes
        fieldInfo: fieldInfo,
      };
    } else {
      newRules[index] = {
        ...newRules[index],
        [field]: value,
      };
    }

    setConditionRules(newRules);
  };

  const removeConditionRule = (index) => {
    const newRules = conditionRules.filter((_, i) => i !== index);
    setConditionRules(newRules);
  };

  const getOperatorsForFieldType = (fieldType) => {
    const baseOperators = [
      { value: "equals", label: "برابر با" },
      { value: "not_equals", label: "مخالف با" },
      { value: "is_empty", label: "خالی باشد" },
      { value: "is_not_empty", label: "خالی نباشد" },
    ];

    const textOperators = [
      { value: "contains", label: "شامل" },
      { value: "not_contains", label: "شامل نباشد" },
      { value: "starts_with", label: "شروع شود با" },
      { value: "ends_with", label: "پایان یابد با" },
    ];

    const numberOperators = [
      { value: "greater_than", label: "بزرگتر از" },
      { value: "greater_than_or_equals", label: "بزرگتر یا مساوی با" },
      { value: "less_than", label: "کوچکتر از" },
      { value: "less_than_or_equals", label: "کوچکتر یا مساوی با" },
    ];

    const dateOperators = [
      { value: "before", label: "قبل از" },
      { value: "after", label: "بعد از" },
      { value: "on", label: "در تاریخ" },
      { value: "not_on", label: "غیر از تاریخ" },
    ];

    const selectOperators = [
      { value: "in", label: "شامل یکی از" },
      { value: "not_in", label: "شامل هیچ یک از" },
    ];

    // Map field types to operator sets
    const operatorMap = {
      // Text-based fields
      text: [...baseOperators, ...textOperators],
      textarea: [...baseOperators, ...textOperators],
      email: [...baseOperators, ...textOperators],

      // Number-based fields
      number: [...baseOperators, ...numberOperators],

      // Date-based fields
      date: [...baseOperators, ...dateOperators],

      // Selection-based fields
      select: [...baseOperators, ...selectOperators],
      radio: [...baseOperators, ...selectOperators],
      checkbox: [...baseOperators, ...selectOperators],

      // Relation fields
      relation: [...baseOperators, ...selectOperators],

      // Default for unknown types
      default: baseOperators,
    };

    return operatorMap[fieldType] || operatorMap.default;
  };

  const getSelectedFormFields = (formId) => {
    if (!formId) return [];
    const fields = formFields[formId] || [];
    return fields;
  };

  const normalizeOptions = (options) => {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    return options.map((option) => {
      if (typeof option === "string") {
        return { value: option, label: option };
      }
      if (typeof option === "object" && option.value !== undefined) {
        return option;
      }
      // If it's an object without value, use the whole object as string
      return { value: JSON.stringify(option), label: JSON.stringify(option) };
    });
  };

  const getFieldById = (formId, fieldId) => {
    if (!formId || !fieldId || fieldId === "none") {
      return null;
    }

    const fields = getSelectedFormFields(formId);
    const field = fields.find((f) => f.id.toString() === fieldId);

    if (!field) return null;

    return {
      ...field,
      options: normalizeOptions(field.options),
    };
  };

  const getValueInputLabel = (operator, fieldType) => {
    if (["in", "not_in"].includes(operator)) {
      return "مقادیر (با کاما جدا کنید)";
    }

    if (fieldType === "date") {
      return "تاریخ (YYYY-MM-DD)";
    }

    if (fieldType === "number") {
      return "عدد";
    }

    return "مقدار";
  };

  const renderValueInput = (rule, index) => {
    const fieldType = rule.fieldType || "text";

    // For select/radio/checkbox with options
    if (
      ["select", "radio", "checkbox"].includes(fieldType) &&
      rule.fieldInfo?.options
    ) {
      const options = rule.fieldInfo.options;

      // Handle both string arrays and object arrays
      const normalizedOptions = Array.isArray(options)
        ? options.map((option) => {
            if (typeof option === "string") {
              return { value: option, label: option };
            }
            return option;
          })
        : [];

      return (
        <Select
          value={rule.value || ""}
          onValueChange={(value) => {
            updateConditionRule(index, "value", value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتخاب گزینه" />
          </SelectTrigger>
          <SelectContent>
            {normalizedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For date fields
    if (fieldType === "date") {
      return (
        <Input
          type="date"
          value={rule.value || ""}
          onChange={(e) => {
            updateConditionRule(index, "value", e.target.value);
          }}
          placeholder="YYYY-MM-DD"
        />
      );
    }

    // For number fields
    if (fieldType === "number") {
      return (
        <Input
          type="number"
          value={rule.value || ""}
          onChange={(e) => {
            updateConditionRule(index, "value", e.target.value);
          }}
          placeholder="عدد"
        />
      );
    }

    // For text fields (default)
    return (
      <Input
        value={rule.value || ""}
        onChange={(e) => {
          updateConditionRule(index, "value", e.target.value);
        }}
        placeholder={
          ["in", "not_in"].includes(rule.operator)
            ? "value1,value2,value3"
            : "مقدار شرط"
        }
      />
    );
  };

  // For change-status node (add these state variables at the top)
  const [statusLabel, setStatusLabel] = useState(node.data.statusLabel || "");
  const [statusValue, setStatusValue] = useState(node.data.status || "");
  const [statusColor, setStatusColor] = useState(
    node.data.statusColor || "#3b82f6",
  );
  const [assignToRole, setAssignToRole] = useState(
    node.data.assignToRole || null,
  );
  const [shouldReassign, setShouldReassign] = useState(
    node.data.shouldReassign || false,
  );

  return (
    <div className="absolute right-4 top-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-[80vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {node.type === "start"
              ? "شروع"
              : node.type === "end"
                ? "پایان"
                : node.type === "assign-task"
                  ? "تخصیص وظیفه"
                  : node.type === "fill-form"
                    ? "تکمیل فرم"
                    : node.type === "change-status"
                      ? "تغییر وضعیت"
                      : "شرط"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="node-label">عنوان</Label>
            <Input
              id="node-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="عنوان گره"
            />
          </div>

          <div>
            <Label htmlFor="node-description">توضیحات</Label>
            <Textarea
              id="node-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح عملکرد این گره"
              rows={2}
            />
          </div>

          {/* Assign Task Node Fields */}
          {node.type === "assign-task" && (
            <>
              <div>
                <Label>نقش مسئول</Label>
                <Select
                  value={selectedRole?.id?.toString() || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setSelectedRole(null);
                    } else {
                      const role = availableRoles.find(
                        (r) => r.id.toString() === value,
                      );
                      setSelectedRole(role);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">انتخاب نقش</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Fill Form Node Fields */}
          {node.type === "fill-form" && (
            <div>
              <Label>فرم</Label>
              <Select
                value={selectedForm?.id?.toString() || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedForm(null);
                  } else {
                    const form = availableForms.find(
                      (f) => f.id.toString() === value,
                    );
                    setSelectedForm(form);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب فرم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">انتخاب فرم</SelectItem>
                  {availableForms.map((form) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Condition Node Fields */}
          {node.type === "condition" && (
            <div>
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
                  <FileText className="w-4 h-4 ml-2" />
                  <div>
                    <div className="font-medium">فرم مرتبط:</div>
                    <div>
                      {selectedFormData?.title || "فرم انتخاب نشده"}
                    </div>
                    {latestFillFormNode && (
                      <div className="text-xs opacity-75 mt-1">
                        این شرط بر اساس فرم "
                        {latestFillFormNode.data.form?.title || "آخرین فرم"}"
                        تعریف می‌شود.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Label className="mb-2 block">شرط‌ها</Label>
              <div className="space-y-3">
                {conditionRules.map((rule, index) => {
                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          شرط {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeConditionRule(index);
                          }}
                          disabled={conditionRules.length <= 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      {/* Step 1: Select Field from the latest form */}
                      {selectedFormId && (
                        <div>
                          <Label className="text-xs mb-1 block">فیلد</Label>
                          <Select
                            value={rule.selectedField || "none"}
                            onValueChange={(value) => {
                              updateConditionRule(
                                index,
                                "selectedField",
                                value,
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب فیلد" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">انتخاب فیلد</SelectItem>
                              {getSelectedFormFields(
                                selectedFormId,
                              ).map((field) => {
                                return (
                                  <SelectItem key={field.id} value={field.id.toString()}>
                                    {field.label}
                                    {field.type && (
                                      <span className="text-xs text-gray-500 mr-2">
                                        {" "}
                                        ({field.type})
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Step 2: Select Operator */}
                      {rule.selectedField && rule.selectedField !== "none" && (
                        <div>
                          <Label className="text-xs mb-1 block">عملگر</Label>
                          <Select
                            value={rule.operator || "none"}
                            onValueChange={(value) => {
                              updateConditionRule(index, "operator", value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب عملگر" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">انتخاب عملگر</SelectItem>
                              {getOperatorsForFieldType(
                                rule.fieldType || "text",
                              ).map((operator) => (
                                <SelectItem
                                  key={operator.value}
                                  value={operator.value}
                                >
                                  {operator.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Step 3: Enter Value (if applicable) */}
                      {rule.operator &&
                        rule.operator !== "none" &&
                        !["is_empty", "is_not_empty"].includes(
                          rule.operator,
                        ) && (
                          <div>
                            <Label className="text-xs mb-1 block">
                              {getValueInputLabel(
                                rule.operator,
                                rule.fieldType,
                              )}
                            </Label>

                            {renderValueInput(rule, index)}
                          </div>
                        )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addConditionRule();
                  }}
                  className="w-full"
                  disabled={!selectedFormId}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  افزودن شرط جدید
                </Button>
              </div>
            </div>
          )}

          {/* Change Status Node Fields - Add this section */}
          {node.type === "change-status" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status-label">برچسب وضعیت</Label>
                <Input
                  id="status-label"
                  value={statusLabel}
                  onChange={(e) => setStatusLabel(e.target.value)}
                  placeholder="مثلاً: در حال بررسی"
                />
              </div>

              <div>
                <Label htmlFor="status-value">مقدار وضعیت (اختیاری)</Label>
                <Input
                  id="status-value"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  placeholder="مثلاً: in_review"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  مقدار انگلیسی برای استفاده در کد (اگر خالی باشد از برچسب فارسی
                  استفاده می‌شود)
                </p>
              </div>

              <div>
                <Label className="mb-2 block">رنگ وضعیت</Label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: statusColor }}
                      onClick={() =>
                        document.getElementById("color-picker").click()
                      }
                    />
                    <input
                      id="color-picker"
                      type="color"
                      value={statusColor}
                      onChange={(e) => setStatusColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={statusColor}
                      onChange={(e) => setStatusColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                    "#ec4899",
                    "#06b6d4",
                    "#84cc16",
                    "#f97316",
                    "#6366f1",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                      style={{ backgroundColor: color }}
                      onClick={() => setStatusColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(node.id);
                onClose();
              }}
              className="flex-1"
            >
              حذف گره
            </Button>
            <Button onClick={handleSave} className="flex-1">
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;