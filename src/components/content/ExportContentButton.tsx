import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectTaskData {
  taskId: string;
  inputData?: Record<string, unknown>;
}

interface ExportContentButtonProps {
  projectName: string;
  projectTasks: ProjectTaskData[];
}

export function ExportContentButton({ projectName, projectTasks }: ExportContentButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    try {
      // Extract data from project tasks
      const platformsTask = projectTasks.find(t => t.taskId === 'content_choose_platforms');
      const platforms = (platformsTask?.inputData as Record<string, unknown>)?.platforms as string || null;

      const themesTask = projectTasks.find(t => t.taskId === 'content_define_themes');
      const themesData = themesTask?.inputData as Record<string, unknown> || {};
      const themes: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const theme = themesData[`theme_${i}`];
        if (theme) themes.push(String(theme));
      }

      const planTask = projectTasks.find(t => t.taskId === 'content_plan_launch_window');
      const planData = planTask?.inputData as Record<string, unknown> || {};
      const launchWindowDays = planData.launch_window_days as string || null;
      const plannedPostsSummary = planData.planned_posts_summary as string || null;

      const captionsTask = projectTasks.find(t => t.taskId === 'content_write_captions');
      const captionsData = captionsTask?.inputData as Record<string, unknown> || {};
      const captionsWritten = captionsData.captions_written as string || null;
      const sampleCaption = captionsData.sample_caption as string || null;

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

      const renderMultiSection = (label: string, items: { sublabel: string; content: string | null }[]) => {
        const hasContent = items.some(i => i.content);
        if (!hasContent) {
          return renderSection(label, null);
        }
        
        const itemsHtml = items
          .filter(i => i.content)
          .map(i => `
            <div class="sub-item">
              <div class="sub-label">${i.sublabel}</div>
              <div class="sub-content">${i.content}</div>
            </div>
          `)
          .join('');
        
        return `
          <div class="section">
            <div class="section-label">${label}</div>
            <div class="section-content">${itemsHtml}</div>
          </div>
        `;
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Content Foundation - ${projectName}</title>
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
              color: #f59e0b; 
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
              white-space: pre-wrap;
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
            
            .sub-item {
              margin-bottom: 16px;
            }
            .sub-item:last-child {
              margin-bottom: 0;
            }
            .sub-label { 
              font-weight: 600; 
              color: #1f2937; 
              font-size: 13px;
              margin-bottom: 4px;
            }
            .sub-content { 
              color: #4b5563;
              font-size: 15px;
              white-space: pre-wrap;
            }
            
            .not-defined {
              font-style: italic;
              color: #9ca3af;
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
            <h2>Content Foundation</h2>
            <div class="date">Exported ${date}</div>
          </div>
          
          ${renderSection('Platforms', platforms)}
          ${renderListSection('Content Themes', themes)}
          
          ${renderMultiSection('Launch Content Plan', [
            { sublabel: 'Launch window', content: launchWindowDays ? `${launchWindowDays} days` : null },
            { sublabel: 'Planned posts', content: plannedPostsSummary },
          ])}
          
          ${renderMultiSection('Captions', [
            { sublabel: 'Status', content: captionsWritten },
            { sublabel: 'Sample caption', content: sampleCaption },
          ])}
          
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
      toast.error("Failed to export content");
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
      Export Content PDF
    </Button>
  );
}
