import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TextOverlay, TextAlign } from './types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Bold, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  overlays: TextOverlay[];
  onSave: (overlays: TextOverlay[]) => void;
}

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#FF2D55'];
const BG_OPTIONS: (string | null)[] = [null, 'rgba(0,0,0,0.6)', 'rgba(255,255,255,0.8)', 'rgba(0,0,0,0.9)'];

const FONTS = [
  'Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
  'Palatino', 'Garamond', 'Bookman', 'Tahoma',
  'Lucida Console', 'Brush Script MT',
];

const ALIGN_OPTIONS: { value: TextAlign; icon: React.ReactNode }[] = [
  { value: 'left', icon: <AlignLeft className="h-4 w-4" /> },
  { value: 'center', icon: <AlignCenter className="h-4 w-4" /> },
  { value: 'right', icon: <AlignRight className="h-4 w-4" /> },
];

const TextOverlayEditor: React.FC<Props> = ({ open, onClose, imageUrl, overlays: initial, onSave }) => {
  const [items, setItems] = useState<TextOverlay[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; origWidth: number } | null>(null);

  useEffect(() => { setItems(initial); }, [initial]);

  const selected = items.find(i => i.id === selectedId);

  const addText = () => {
    const id = crypto.randomUUID();
    const newItem: TextOverlay = {
      id, text: 'Tap to edit', x: 10, y: 50, width: 40,
      fontSize: 24, fontWeight: 'normal', fontFamily: 'Inter', textAlign: 'left',
      color: '#FFFFFF', bgColor: 'rgba(0,0,0,0.6)',
    };
    setItems(prev => [...prev, newItem]);
    setSelectedId(id);
  };

  const updateItem = (id: string, patch: Partial<TextOverlay>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    setSelectedId(id);
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [items]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - resizeRef.current.startX) / rect.width) * 100;
      const newWidth = Math.max(10, Math.min(100, resizeRef.current.origWidth + dx));
      updateItem(resizeRef.current.id, { width: newWidth });
      return;
    }
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const newX = Math.max(0, Math.min(90, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(90, dragRef.current.origY + dy));
    updateItem(dragRef.current.id, { x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
  }, []);

  const handleResizeDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    resizeRef.current = { id, startX: e.clientX, origWidth: item.width };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [items]);

  const handleSave = () => { onSave(items); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card flex-wrap">
          <Button size="sm" variant="outline" onClick={addText}>
            <Plus className="h-4 w-4 mr-1" /> Add Text
          </Button>

          {selected && (
            <>
              <div className="h-6 w-px bg-border mx-1" />
              {/* Font family */}
              <Select value={selected.fontFamily} onValueChange={(v) => updateItem(selected.id, { fontFamily: v })}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => (
                    <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Font size */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Size</span>
                <Slider
                  value={[selected.fontSize]}
                  onValueChange={([v]) => updateItem(selected.id, { fontSize: v })}
                  min={12} max={72} step={1}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground w-6">{selected.fontSize}</span>
              </div>
              {/* Bold */}
              <button
                onClick={() => updateItem(selected.id, { fontWeight: selected.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`p-1.5 rounded border ${selected.fontWeight === 'bold' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                <Bold className="h-4 w-4" />
              </button>
              {/* Alignment */}
              <div className="flex items-center border border-border rounded overflow-hidden">
                {ALIGN_OPTIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => updateItem(selected.id, { textAlign: a.value })}
                    className={`p-1.5 ${selected.textAlign === a.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>
              {/* Width */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">W</span>
                <Slider
                  value={[selected.width]}
                  onValueChange={([v]) => updateItem(selected.id, { width: v })}
                  min={10} max={100} step={1}
                  className="w-16"
                />
                <span className="text-xs text-muted-foreground w-8">{Math.round(selected.width)}%</span>
              </div>
              {/* Colors */}
              <div className="flex items-center gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateItem(selected.id, { color: c })}
                    className={`w-5 h-5 rounded-full border-2 ${selected.color === c ? 'border-primary scale-110' : 'border-border'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="h-6 w-px bg-border mx-1" />
              {/* Background */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">BG</span>
                {BG_OPTIONS.map((bg, i) => (
                  <button
                    key={i}
                    onClick={() => updateItem(selected.id, { bgColor: bg })}
                    className={`w-5 h-5 rounded border-2 ${selected.bgColor === bg ? 'border-primary' : 'border-border'}`}
                    style={{ backgroundColor: bg || 'transparent', backgroundImage: bg ? undefined : 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)', backgroundSize: '6px 6px', backgroundPosition: '0 0, 3px 3px' }}
                  />
                ))}
              </div>
              <button onClick={() => deleteItem(selected.id)} className="p-1.5 rounded border border-destructive/50 text-destructive hover:bg-destructive/10 ml-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Done</Button>
          </div>
        </div>

        {/* Image canvas */}
        <div className="relative overflow-auto bg-black/90 flex items-center justify-center p-4" style={{ maxHeight: 'calc(95vh - 60px)' }}>
          <div
            ref={containerRef}
            className="relative inline-block select-none"
            onClick={() => setSelectedId(null)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img src={imageUrl} alt="Scene" className="max-w-full max-h-[75vh] object-contain rounded" draggable={false} crossOrigin="anonymous" />
            {items.map(item => (
              <div
                key={item.id}
                className={`absolute cursor-move group ${selectedId === item.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.width}%`,
                  fontSize: `${item.fontSize}px`,
                  fontWeight: item.fontWeight,
                  fontFamily: item.fontFamily,
                  textAlign: item.textAlign,
                  color: item.color,
                  backgroundColor: item.bgColor || 'transparent',
                  padding: item.bgColor ? '4px 8px' : '2px',
                  borderRadius: item.bgColor ? '4px' : undefined,
                  lineHeight: 1.3,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  touchAction: 'none',
                  userSelect: 'none',
                }}
                onPointerDown={(e) => handlePointerDown(e, item.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              >
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateItem(item.id, { text: e.currentTarget.textContent || '' })}
                  onPointerDown={(e) => { if (selectedId === item.id) e.stopPropagation(); }}
                  className="outline-none min-w-[2ch]"
                  style={{ cursor: selectedId === item.id ? 'text' : 'move' }}
                >
                  {item.text}
                </div>
                {selectedId === item.id && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Resize handle */}
                    <div
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-primary/80 rounded-full cursor-ew-resize hover:bg-primary"
                      onPointerDown={(e) => handleResizeDown(e, item.id)}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextOverlayEditor;
