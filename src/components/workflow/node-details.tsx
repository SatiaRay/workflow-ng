// components/workflow/NodeDetails.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const NodeDetails = ({ node, onUpdate, onClose, onDelete }) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [conditions, setConditions] = useState(node.data.conditions || ['']);

  const handleSave = () => {
    const updates: any = { label, description };
    
    if (node.type === 'decision') {
      updates.conditions = conditions.filter(c => c.trim() !== '');
    }
    
    onUpdate(node.id, updates);
    onClose();
  };

  const handleAddCondition = () => {
    setConditions([...conditions, '']);
  };

  const handleConditionChange = (index, value) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="absolute right-4 top-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {node.type === 'start' ? 'شروع' : 
             node.type === 'process' ? 'فرآیند' : 
             node.type === 'decision' ? 'تصمیم' : 'پایان'}
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
              rows={3}
            />
          </div>

          {node.type === 'decision' && (
            <div>
              <Label className="mb-2 block">شرایط</Label>
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={condition}
                      onChange={(e) => handleConditionChange(index, e.target.value)}
                      placeholder={`شرط ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveCondition(index)}
                      disabled={conditions.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCondition}
                  className="w-full"
                >
                  افزودن شرط جدید
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
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
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;