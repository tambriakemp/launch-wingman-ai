import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectTaskData {
  taskId: string;
  inputData?: Record<string, unknown>;
  status?: string;
}

interface ExportMessagingButtonProps {
  projectId: string;
  projectName: string;
  projectTasks: ProjectTaskData[];
}

export function ExportMessagingButton({ projectId, projectName, projectTasks }: ExportMessagingButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch social bios for export
  const { data: socialBios = [] } = useQuery({
    queryKey: ["social-bios-export", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_bios")
        .select("id, platform, bio_content")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Fetch brand colors for export
  const { data: brandColors = [] } = useQuery({
    queryKey: ["brand-colors-export", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_colors")
        .select("id, hex_color, name")
        .eq("project_id", projectId)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  // Fetch brand fonts for export
  const { data: brandFonts = [] } = useQuery({
    queryKey: ["brand-fonts-export", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_fonts")
        .select("id, font_family, font_category")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    
    try {
      // Extract data from project tasks
      const coreMessageTask = projectTasks.find(t => t.taskId === 'messaging_core_message');
      const coreMessage = (coreMessageTask?.inputData as Record<string, unknown>)?.core_message as string || null;

      const transformationTask = projectTasks.find(t => t.taskId === 'messaging_transformation_statement');
      const transformation = (transformationTask?.inputData as Record<string, unknown>)?.transformation_statement as string || null;

      const talkingPointsTask = projectTasks.find(t => t.taskId === 'messaging_talking_points');
      const talkingPointsData = talkingPointsTask?.inputData as Record<string, unknown> || {};
      const talkingPoints: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const point = talkingPointsData[`talking_point_${i}`];
        if (point) talkingPoints.push(String(point));
      }

      const objectionsTask = projectTasks.find(t => t.taskId === 'messaging_common_objections');
      const objectionsData = objectionsTask?.inputData as Record<string, unknown> || {};
      const objections: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const objection = objectionsData[`objection_${i}`];
        if (objection) objections.push(String(objection));
      }

      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Build HTML content
      const renderSection = (label: string, content: string | null) => {
        const displayContent = content || '<span class="not-defined">Not yet defined</span>';
        return `
          <div class="section">
            <div class="section-label">${label}</div>
            <div class="section-content">${displayContent}</div>
          </div>
        `;
      };

      const renderListSection = (label: string, items: string[]) => {
        if (items.length === 0) {
          return renderSection(label, null);
        }
        
        const itemsHtml = items.map(item => `<li>${item}</li>`).join('');
        
        return `
          <div class="section">
            <div class="section-label">${label}</div>
            <div class="section-content">
              <ul class="item-list">${itemsHtml}</ul>
            </div>
          </div>
        `;
      };

      const renderSocialBiosSection = () => {
        if (socialBios.length === 0) {
          return renderSection('Social Media Bios', null);
        }
        
        const biosHtml = socialBios.map(bio => `
          <div class="bio-item">
            <div class="bio-platform">${bio.platform}</div>
            <div class="bio-content">${bio.bio_content}</div>
          </div>
        `).join('');
        
        return `
          <div class="section">
            <div class="section-label">Social Media Bios</div>
            <div class="section-content">${biosHtml}</div>
          </div>
        `;
      };

      const renderVisualDirectionSection = () => {
        const hasColors = brandColors.length > 0;
        const hasFonts = brandFonts.length > 0;
        
        if (!hasColors && !hasFonts) {
          return renderSection('Visual Direction', null);
        }
        
        let colorsHtml = '';
        if (hasColors) {
          const swatches = brandColors.map(color => `
            <div class="color-swatch">
              <div class="swatch" style="background-color: ${color.hex_color};"></div>
              <span class="color-name">${color.name || color.hex_color}</span>
            </div>
          `).join('');
          colorsHtml = `
            <div class="visual-subsection">
              <strong>Colors:</strong>
              <div class="color-swatches">${swatches}</div>
            </div>
          `;
        }
        
        let fontsHtml = '';
        if (hasFonts) {
          const fontList = brandFonts.map(f => `${f.font_family} (${f.font_category})`).join(', ');
          fontsHtml = `
            <div class="visual-subsection">
              <strong>Fonts:</strong> ${fontList}
            </div>
          `;
        }
        
        return `
          <div class="section">
            <div class="section-label">Visual Direction</div>
            <div class="section-content">${colorsHtml}${fontsHtml}</div>
          </div>
        `;
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Messaging Foundation - ${projectName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              max-width: 700px; 
              margin: 0 auto; 
              padding: 48px 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 48px; 
              padding-bottom: 24px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 { 
              font-size: 26px; 
              font-weight: 700; 
              margin-bottom: 6px;
              color: #111827;
            }
            .header h2 { 
              font-size: 16px; 
              color: #6b7280; 
              font-weight: 400;
              margin-bottom: 0;
            }
            .header .date { 
              font-size: 13px; 
              color: #9ca3af; 
              margin-top: 14px;
            }
            
            .section { 
              margin-bottom: 28px; 
              page-break-inside: avoid;
            }
            .section-label { 
              font-size: 11px; 
              font-weight: 600; 
              text-transform: uppercase; 
              letter-spacing: 0.08em;
              color: #8b5cf6; 
              margin-bottom: 10px;
            }
            .section-content { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0;
              border-radius: 10px; 
              padding: 18px 22px;
              font-size: 15px;
              line-height: 1.75;
              color: #374151;
            }
            
            .item-list {
              margin: 0;
              padding-left: 20px;
            }
            .item-list li {
              margin-bottom: 8px;
            }
            .item-list li:last-child {
              margin-bottom: 0;
            }
            
            .not-defined {
              font-style: italic;
              color: #9ca3af;
            }
            
            .bio-item {
              margin-bottom: 12px;
            }
            .bio-item:last-child {
              margin-bottom: 0;
            }
            .bio-platform {
              font-weight: 600;
              text-transform: capitalize;
              margin-bottom: 4px;
              color: #1f2937;
            }
            .bio-content {
              color: #374151;
            }
            
            .visual-subsection {
              margin-bottom: 12px;
            }
            .visual-subsection:last-child {
              margin-bottom: 0;
            }
            .color-swatches {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              margin-top: 8px;
            }
            .color-swatch {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .swatch {
              width: 24px;
              height: 24px;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
            }
            .color-name {
              font-size: 13px;
              color: #6b7280;
            }
            
            .footer { 
              margin-top: 52px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb;
              text-align: center; 
              font-size: 12px; 
              color: #9ca3af;
            }
            
            @media print {
              body { padding: 24px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectName}</h1>
            <h2>Messaging Foundation</h2>
            <div class="date">Exported ${date}</div>
          </div>
          
          ${renderSection('Core Message', coreMessage)}
          ${renderSection('Transformation Statement', transformation)}
          ${renderListSection('Talking Points', talkingPoints)}
          ${renderListSection('Common Objections', objections)}
          ${renderSocialBiosSection()}
          ${renderVisualDirectionSection()}
          
          <div class="footer">Generated by Launchely</div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        
        toast.success("PDF export ready - use Save as PDF in print dialog");
      } else {
        toast.error("Please allow popups to export PDF");
      }
    } catch (error) {
      toast.error("Failed to export messaging");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isExporting}
      onClick={handleExportPDF}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export Messaging PDF
    </Button>
  );
}
