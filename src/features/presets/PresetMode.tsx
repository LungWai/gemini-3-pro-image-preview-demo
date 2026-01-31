import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X, Check, RotateCcw, Sparkles } from 'lucide-react';
import { presetsConfig, type Preset } from './presetsConfig';

interface PresetModeProps {
  onSelectPreset: (prompt: string) => void;
  disabled?: boolean;
}

export function PresetMode({ onSelectPreset, disabled }: PresetModeProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formIcon, setFormIcon] = useState('');

  const refreshPresets = useCallback(() => {
    setPresets(presetsConfig.getPresets());
  }, []);

  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormName('');
    setFormPrompt('');
    setFormIcon('📌');
  };

  const handleEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setFormName(preset.name);
    setFormPrompt(preset.prompt);
    setFormIcon(preset.icon || '📌');
  };

  const handleSaveNew = () => {
    if (formName.trim() && formPrompt.trim()) {
      presetsConfig.addPreset(formName, formPrompt, formIcon);
      refreshPresets();
      setIsAddingNew(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingPreset && formName.trim() && formPrompt.trim()) {
      presetsConfig.updatePreset(editingPreset.id, {
        name: formName,
        prompt: formPrompt,
        icon: formIcon,
      });
      refreshPresets();
      setEditingPreset(null);
    }
  };

  const handleDelete = (id: string) => {
    presetsConfig.removePreset(id);
    refreshPresets();
    setDeleteConfirm(null);
  };

  const handleReset = () => {
    presetsConfig.reset();
    refreshPresets();
  };

  const handlePresetClick = (preset: Preset) => {
    if (!disabled) {
      onSelectPreset(preset.prompt);
    }
  };

  const closeDialog = () => {
    setIsAddingNew(false);
    setEditingPreset(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Preset Prompts</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleReset}
            title="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-primary"
            onClick={handleAddNew}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <div key={preset.id} className="group relative">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-3 flex flex-col items-start gap-1 text-left ios-pressable hover:bg-primary/5"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{preset.icon || '📌'}</span>
                <span className="font-medium text-sm truncate flex-1">{preset.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                {preset.prompt.slice(0, 60)}...
              </p>
            </Button>

            {/* Edit/Delete buttons on hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); handleEdit(preset); }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(preset.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddingNew || !!editingPreset} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[480px] ios-card">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Add New Preset' : 'Edit Preset'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-3">
              <div className="space-y-2 w-16">
                <Label htmlFor="preset-icon">Icon</Label>
                <Input
                  id="preset-icon"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="📌"
                  className="ios-input text-center text-lg"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="preset-name">Name</Label>
                <Input
                  id="preset-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="My Preset"
                  className="ios-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-prompt">Prompt</Label>
              <Textarea
                id="preset-prompt"
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                placeholder="Enter the prompt that will be sent with the image..."
                className="ios-input min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={isAddingNew ? handleSaveNew : handleSaveEdit}
              disabled={!formName.trim() || !formPrompt.trim()}
              className="ios-pressable"
            >
              <Check className="mr-2 h-4 w-4" />
              {isAddingNew ? 'Add Preset' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] ios-card">
          <DialogHeader>
            <DialogTitle>Delete Preset?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this preset? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="ios-pressable"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

