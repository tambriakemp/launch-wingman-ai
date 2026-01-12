import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Upload, 
  AlertTriangle,
  Palette,
  Type,
  Image as ImageIcon,
  Eye
} from 'lucide-react';

interface BrandSettings {
  id: string;
  brand_name: string;
  tagline: string;
  subtext: string | null;
  primary_color: string;
  secondary_color: string;
  neutral_color: string;
  header_font: string;
  body_font: string;
  logo_url: string | null;
  icon_url: string | null;
  highlight_labels: string[];
}

interface BrandSourceSectionProps {
  brandSettings: BrandSettings | null | undefined;
  isLoading: boolean;
  onSettingsSaved: () => void;
}

// Website brand colors from index.css
// Primary: hsl(40 6% 10%) - Dark charcoal
// Secondary: hsl(168 76% 42%) - Teal/mint
// Accent: hsl(47 96% 53%) - Gold/yellow
const DEFAULT_SETTINGS = {
  brand_name: 'Launchely',
  tagline: 'A calmer way to plan and launch digital products.',
  subtext: 'Calm guidance. Clear next steps.',
  primary_color: '#1a1918', // hsl(40 6% 10%) - Dark charcoal from website
  secondary_color: '#1ab8a3', // hsl(168 76% 42%) - Teal from website
  neutral_color: '#f5c243', // hsl(47 96% 53%) - Gold accent from website
  header_font: 'Plus Jakarta Sans',
  body_font: 'Plus Jakarta Sans',
  highlight_labels: ['Start Here', 'How It Works', 'Launching', 'Tech Clarity', 'Templates', 'Wins'],
};

export const BrandSourceSection = ({ 
  brandSettings, 
  isLoading, 
  onSettingsSaved 
}: BrandSourceSectionProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    brand_name: DEFAULT_SETTINGS.brand_name,
    tagline: DEFAULT_SETTINGS.tagline,
    subtext: DEFAULT_SETTINGS.subtext,
    primary_color: DEFAULT_SETTINGS.primary_color,
    secondary_color: DEFAULT_SETTINGS.secondary_color,
    neutral_color: DEFAULT_SETTINGS.neutral_color,
    header_font: DEFAULT_SETTINGS.header_font,
    body_font: DEFAULT_SETTINGS.body_font,
    highlight_labels: DEFAULT_SETTINGS.highlight_labels,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // Populate form when settings load
  useEffect(() => {
    if (brandSettings) {
      setFormData({
        brand_name: brandSettings.brand_name,
        tagline: brandSettings.tagline,
        subtext: brandSettings.subtext || '',
        primary_color: brandSettings.primary_color,
        secondary_color: brandSettings.secondary_color,
        neutral_color: brandSettings.neutral_color,
        header_font: brandSettings.header_font,
        body_font: brandSettings.body_font,
        highlight_labels: Array.isArray(brandSettings.highlight_labels) 
          ? brandSettings.highlight_labels 
          : DEFAULT_SETTINGS.highlight_labels,
      });
      setLogoPreview(brandSettings.logo_url);
      setIconPreview(brandSettings.icon_url);
    }
  }, [brandSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let logoUrl = brandSettings?.logo_url || null;
      let iconUrl = brandSettings?.icon_url || null;

      // Upload logo if changed
      if (logoFile) {
        const logoPath = `brand-kit/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(logoPath, logoFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(logoPath);
        logoUrl = publicUrl;
      }

      // Upload icon if changed
      if (iconFile) {
        const iconPath = `brand-kit/icon-${Date.now()}.${iconFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(iconPath, iconFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(iconPath);
        iconUrl = publicUrl;
      }

      const settingsData = {
        brand_name: formData.brand_name,
        tagline: formData.tagline,
        subtext: formData.subtext || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        neutral_color: formData.neutral_color,
        header_font: formData.header_font,
        body_font: formData.body_font,
        highlight_labels: formData.highlight_labels,
        logo_url: logoUrl,
        icon_url: iconUrl,
        updated_by: user?.id,
      };

      if (brandSettings?.id) {
        const { error } = await supabase
          .from('brand_kit_settings')
          .update(settingsData)
          .eq('id', brandSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_kit_settings')
          .insert(settingsData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Brand settings saved successfully');
      setLogoFile(null);
      setIconFile(null);
      onSettingsSaved();
    },
    onError: (error) => {
      console.error('Error saving brand settings:', error);
      toast.error('Failed to save brand settings');
    },
  });

  const handleReset = () => {
    setFormData({
      brand_name: DEFAULT_SETTINGS.brand_name,
      tagline: DEFAULT_SETTINGS.tagline,
      subtext: DEFAULT_SETTINGS.subtext,
      primary_color: DEFAULT_SETTINGS.primary_color,
      secondary_color: DEFAULT_SETTINGS.secondary_color,
      neutral_color: DEFAULT_SETTINGS.neutral_color,
      header_font: DEFAULT_SETTINGS.header_font,
      body_font: DEFAULT_SETTINGS.body_font,
      highlight_labels: DEFAULT_SETTINGS.highlight_labels,
    });
    setLogoFile(null);
    setIconFile(null);
    setLogoPreview(null);
    setIconPreview(null);
    toast.info('Reset to website defaults');
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'logo' | 'icon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setIconFile(file);
        setIconPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHighlightLabelChange = (index: number, value: string) => {
    const newLabels = [...formData.highlight_labels];
    newLabels[index] = value;
    setFormData({ ...formData, highlight_labels: newLabels });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isMissingCritical = !formData.brand_name || !formData.primary_color;

  return (
    <div className="space-y-6">
      {/* Warning if missing critical settings */}
      {isMissingCritical && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="text-sm">
                Some brand settings are missing. Complete the form below to generate assets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Brand Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Brand Identity
            </CardTitle>
            <CardDescription>
              Core brand information used across all assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand Name</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="Launchely"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A calmer way to plan and launch digital products."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtext">Subtext (optional)</Label>
              <Input
                id="subtext"
                value={formData.subtext}
                onChange={(e) => setFormData({ ...formData, subtext: e.target.value })}
                placeholder="Calm guidance. Clear next steps."
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colors
            </CardTitle>
            <CardDescription>
              Brand color palette for generated assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="neutral_color">Neutral</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="neutral_color"
                    value={formData.neutral_color}
                    onChange={(e) => setFormData({ ...formData, neutral_color: e.target.value })}
                    className="w-10 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    value={formData.neutral_color}
                    onChange={(e) => setFormData({ ...formData, neutral_color: e.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </CardTitle>
            <CardDescription>
              Fonts used in text overlays
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="header_font">Header Font</Label>
                <Input
                  id="header_font"
                  value={formData.header_font}
                  onChange={(e) => setFormData({ ...formData, header_font: e.target.value })}
                  placeholder="Plus Jakarta Sans"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_font">Body Font</Label>
                <Input
                  id="body_font"
                  value={formData.body_font}
                  onChange={(e) => setFormData({ ...formData, body_font: e.target.value })}
                  placeholder="Plus Jakarta Sans"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Icon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo & Icon
            </CardTitle>
            <CardDescription>
              Upload logo and icon for asset generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Logo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  {logoPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-16 mx-auto object-contain"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload PNG/SVG</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'logo')}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon/Mark</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  {iconPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={iconPreview} 
                        alt="Icon preview" 
                        className="max-h-16 mx-auto object-contain"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIconFile(null);
                          setIconPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload PNG/SVG</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'icon')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlight Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram Highlight Cover Labels</CardTitle>
          <CardDescription>
            6 labels for Instagram highlight covers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {formData.highlight_labels.map((label, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cover {index + 1}</Label>
                <Input
                  value={label}
                  onChange={(e) => handleHighlightLabelChange(index, e.target.value)}
                  placeholder={`Label ${index + 1}`}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Brand Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg p-6 flex items-center justify-between"
            style={{ backgroundColor: formData.neutral_color }}
          >
            <div className="flex items-center gap-4">
              {iconPreview ? (
                <img src={iconPreview} alt="Icon" className="w-12 h-12 object-contain" />
              ) : (
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  {formData.brand_name.charAt(0)}
                </div>
              )}
              <div>
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: formData.primary_color, fontFamily: formData.header_font }}
                >
                  {formData.brand_name}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: formData.secondary_color, fontFamily: formData.body_font }}
                >
                  {formData.tagline}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: formData.primary_color }} 
                title="Primary"
              />
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: formData.secondary_color }} 
                title="Secondary"
              />
              <div 
                className="w-8 h-8 rounded-full border-2 border-border shadow-sm" 
                style={{ backgroundColor: formData.neutral_color }} 
                title="Neutral"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Brand Settings
        </Button>
      </div>
    </div>
  );
};
