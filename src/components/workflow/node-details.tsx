import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormService } from "@/services/supabase/form-services";
import { RoleService } from "@/services/supabase/role-service";

const NodeDetails = ({ node, onUpdate, onClose, onDelete }) => {
  const [label, setLabel] = useState(node.data.label || "");
  const [description, setDescription] = useState(node.data.description || "");

  // For assign-task node
  const [selectedRole, setSelectedRole] = useState(node.data.role || null);
  const [selectedForm, setSelectedForm] = useState(node.data.form || null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableForms, setAvailableForms] = useState([]);

  // For condition node
  const [conditionRules, setConditionRules] = useState(
    node.data.conditionRules || [],
  );
  const [availableFormsForCondition, setAvailableFormsForCondition] = useState(
    [],
  );
  const [formFields, setFormFields] = useState({}); // { formId: [fields] }

  // Load data based on node type
  useEffect(() => {
    const loadData = async () => {
      const formService = new FormService();

      if (node.type === "assign-task" || node.type === "fill-form") {
        const forms = await formService.getForms();
        setAvailableForms(forms);

        if (node.type === "assign-task") {
          const roleService = new RoleService();
          const roles = await roleService.getRoles();
          setAvailableRoles(roles);
        }
      }

      // Load available forms for condition node
      if (node.type === "condition") {
        const forms = await formService.getForms();
        setAvailableFormsForCondition(forms);

        // Load fields for each form
        const fieldsMap = {};
        for (const form of forms) {
          try {
            const schema =
              typeof form.schema === "string"
                ? JSON.parse(form.schema)
                : form.schema;
            fieldsMap[form.id] = schema?.fields || [];
          } catch (error) {
            fieldsMap[form.id] = [];
          }
        }
        setFormFields(fieldsMap);

        // Initialize condition rules from existing data
        if (node.data.conditionRules) {
          setConditionRules(
            node.data.conditionRules.map((rule) => ({
              ...rule,
              selectedFormId: rule.formId || null,
              selectedField: rule.field || "",
              fieldType: rule.fieldType || "text",
            })),
          );
        }
      }
    };

    loadData();
  }, [node.type, node.data.conditionRules]);

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
        // Filter out invalid rules and format them properly
        updates.conditionRules = conditionRules
          .filter(
            (rule) =>
              rule.selectedFormId &&
              rule.selectedField &&
              rule.selectedField !== "none" &&
              rule.operator &&
              rule.operator !== "none" &&
              (["is_empty", "is_not_empty"].includes(rule.operator) ||
                rule.value !== undefined),
          )
          .map((rule) => ({
            formId: rule.selectedFormId,
            field: rule.selectedField,
            operator: rule.operator,
            value: rule.value || "",
            fieldType: rule.fieldType || "text",
          }));
        break;
    }

    onUpdate(node.id, updates);
    onClose();
  };

  // Condition node functions
  const addConditionRule = () => {
    const newRule = {
      selectedFormId: null,
      selectedField: "none",
      operator: "none",
      value: "",
      fieldType: "text",
    };
    setConditionRules([...conditionRules, newRule]);
  };

  const updateConditionRule = (index, field, value) => {
    const newRules = [...conditionRules];
    const updatedRule = {
      ...newRules[index],
      [field]: value,
      // Reset dependent fields when form changes
      ...(field === "selectedFormId" &&
        value !== "none" && {
          selectedField: "none",
          operator: "none",
          value: "",
          fieldType: "text",
        }),
      // Reset operator when field changes
      ...(field === "selectedField" &&
        value !== "none" && {
          operator: "none",
          value: "",
          fieldType: getFieldType(newRules[index].selectedFormId, value),
        }),
    };
    newRules[index] = updatedRule;
    setConditionRules(newRules);
  };

  const removeConditionRule = (index) => {
    const newRules = conditionRules.filter((_, i) => i !== index);
    setConditionRules(newRules);
  };

  const getAvailableOperators = (fieldType) => {
    const operators = [
      { value: "equals", label: "برابر با" },
      { value: "not_equals", label: "مخالف با" },
      { value: "contains", label: "شامل" },
      { value: "not_contains", label: "شامل نباشد" },
      { value: "greater_than", label: "بزرگتر از" },
      { value: "less_than", label: "کوچکتر از" },
      { value: "is_empty", label: "خالی باشد" },
      { value: "is_not_empty", label: "خالی نباشد" },
    ];

    if (fieldType === "number") {
      return operators.filter((op) =>
        [
          "equals",
          "not_equals",
          "greater_than",
          "less_than",
          "is_empty",
          "is_not_empty",
        ].includes(op.value),
      );
    }

    if (fieldType === "text" || fieldType === "textarea") {
      return operators.filter((op) =>
        [
          "equals",
          "not_equals",
          "contains",
          "not_contains",
          "is_empty",
          "is_not_empty",
        ].includes(op.value),
      );
    }

    if (
      fieldType === "select" ||
      fieldType === "radio" ||
      fieldType === "checkbox"
    ) {
      return operators.filter((op) =>
        ["equals", "not_equals", "is_empty", "is_not_empty"].includes(op.value),
      );
    }

    return operators;
  };

  const getSelectedFormFields = (formId) => {
    if (!formId) return [];
    const fields = formFields[formId] || [];
    console.log(fields);
    
    return fields;
  };

  const getFieldType = (formId, fieldName) => {
    if (!formId || !fieldName || fieldName === "none") {
      return "text";
    }

    const fields = getSelectedFormFields(formId);
    const field = fields.find((f) => f.name === fieldName);
    return field?.type || "text";
  };

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

                      {/* Step 1: Select Form */}
                      <div>
                        <Label className="text-xs mb-1 block">فرم</Label>
                        <Select
                          value={rule.selectedFormId?.toString() || "none"}
                          onValueChange={(value) => {
                            if (value === "none") {
                              updateConditionRule(
                                index,
                                "selectedFormId",
                                null,
                              );
                            } else {
                              updateConditionRule(
                                index,
                                "selectedFormId",
                                parseInt(value),
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب فرم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">انتخاب فرم</SelectItem>
                            {availableFormsForCondition.map((form) => (
                              <SelectItem
                                key={form.id}
                                value={form.id.toString()}
                              >
                                {form.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Step 2: Select Field from chosen form */}
                      {rule.selectedFormId && (
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
                              <SelectGroup>
                                <SelectItem value="none">
                                  انتخاب فیلد
                                </SelectItem>
                                {getSelectedFormFields(rule.selectedFormId).map(
                                  (field) => {
                                    return (
                                      <SelectItem
                                        key={field.id}
                                        value={field.id}
                                      >
                                        {field.label}
                                        {field.type && (
                                          <span className="text-xs text-gray-500 mr-2">
                                            {" "}
                                            ({field.type})
                                          </span>
                                        )}
                                      </SelectItem>
                                    );
                                  },
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Step 3: Select Operator */}
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
                              {getAvailableOperators(
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

                      {/* Step 4: Enter Value (if applicable) */}
                      {rule.operator &&
                        rule.operator !== "none" &&
                        rule.operator !== "is_empty" &&
                        rule.operator !== "is_not_empty" && (
                          <div>
                            <Label className="text-xs mb-1 block">مقدار</Label>
                            <Input
                              value={rule.value || ""}
                              onChange={(e) => {
                                updateConditionRule(
                                  index,
                                  "value",
                                  e.target.value,
                                );
                              }}
                              placeholder="مقدار شرط"
                            />
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
                >
                  <Plus className="w-4 h-4 ml-1" />
                  افزودن شرط جدید
                </Button>
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