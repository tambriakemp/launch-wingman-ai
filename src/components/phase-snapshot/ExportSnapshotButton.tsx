import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PHASE_LABELS, Phase } from "@/types/tasks";
import type { PhaseData } from "@/hooks/usePhaseSnapshot";

interface ExportSnapshotButtonProps {
  phases: PhaseData[];
  projectName?: string;
}

export function ExportSnapshotButton({ phases, projectName = "Project" }: ExportSnapshotButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    try {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Build HTML content for printing
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Phase Snapshot - ${projectName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e5e5;
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: 600;
              margin-bottom: 8px;
            }
            .header .date { 
              color: #666; 
              font-size: 14px;
            }
            .phase { 
              margin-bottom: 32px;
              page-break-inside: avoid;
            }
            .phase-title { 
              font-size: 18px; 
              font-weight: 600;
              color: #333;
              padding: 8px 0;
              border-bottom: 1px solid #e5e5e5;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .block { 
              margin-bottom: 20px;
              padding: 16px;
              background: #fafafa;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .block-title { 
              font-size: 14px; 
              font-weight: 600;
              color: #333;
              margin-bottom: 10px;
            }
            .block-content { 
              font-size: 13px;
              color: #444;
            }
            .block-content p { margin-bottom: 8px; }
            .block-content .label { 
              font-weight: 600; 
              color: #333;
              display: block;
              margin-top: 8px;
            }
            .block-content .value { 
              display: block;
              margin-left: 0;
            }
            .block-content ul { 
              list-style: none;
              padding: 0;
            }
            .block-content li { 
              padding: 4px 0;
              padding-left: 20px;
              position: relative;
            }
            .block-content li.numbered::before {
              content: attr(data-num) ".";
              position: absolute;
              left: 0;
              font-weight: 600;
              color: #666;
            }
            .block-content li.checked::before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #22c55e;
            }
            .quote { 
              font-style: italic;
              border-left: 3px solid #ddd;
              padding-left: 16px;
              color: #555;
            }
            .badge {
              display: inline-block;
              padding: 6px 16px;
              background: #f0f0f0;
              border-radius: 20px;
              font-weight: 500;
            }
            .offer {
              padding: 12px 0;
              border-bottom: 1px dashed #e5e5e5;
            }
            .offer:last-child { border-bottom: none; }
            .offer-title { font-weight: 600; }
            .offer-price { color: #666; font-size: 12px; margin-top: 4px; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body { padding: 20px; }
              .phase { page-break-inside: avoid; }
              .block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Phase Snapshot</h1>
            <div class="date">Exported on ${date}</div>
          </div>
      `;

      phases.forEach((phaseData) => {
        if (!phaseData.hasContent) return;

        const phaseLabel = PHASE_LABELS[phaseData.phase as Phase] || phaseData.phase;
        html += `<div class="phase"><div class="phase-title">${phaseLabel}</div>`;

        phaseData.blocks.forEach((block) => {
          const items = block.structuredContent?.items || [];
          let contentHtml = "";

          switch (block.contentType) {
            case "numbered-list":
              contentHtml = `<ul>${items.map((item, idx) => 
                `<li class="numbered" data-num="${idx + 1}">${item.value}</li>`
              ).join("")}</ul>`;
              break;

            case "key-value":
              contentHtml = items.map((item) => 
                `<p><span class="label">${item.label}</span><span class="value">${item.value}</span></p>`
              ).join("");
              break;

            case "offer-stack":
              contentHtml = items.map((item) => 
                `<div class="offer"><div class="offer-title">${item.label}</div>${item.value ? `<div>${item.value}</div>` : ""}${item.secondary ? `<div class="offer-price">${item.secondary}</div>` : ""}</div>`
              ).join("");
              break;

            case "checklist":
              contentHtml = `<ul>${items.map((item) => 
                `<li class="checked">${item.value}</li>`
              ).join("")}</ul>`;
              break;

            case "dates":
            case "metrics":
              contentHtml = items.map((item) => 
                `<p><span class="label">${item.label}:</span> ${item.value}</p>`
              ).join("");
              break;

            case "quote":
              contentHtml = items.map((item) => 
                `<p class="quote">"${item.value}"</p>`
              ).join("");
              break;

            case "social-bio":
              contentHtml = items.map((item) => 
                `<p><span class="label">${item.label}</span><span class="value">${item.value}</span></p>`
              ).join("");
              break;

            case "badge":
              contentHtml = items.map((item) => 
                `<span class="badge">${item.value}</span>`
              ).join(" ");
              break;

            case "visual-palette":
              const colors = items.filter(i => i.label === "color");
              const fonts = items.filter(i => i.label !== "color");
              if (colors.length > 0) {
                contentHtml += `<p><span class="label">Colors</span></p><ul>${colors.map((c) => 
                  `<li>${c.color || c.value}${c.value && c.color ? ` (${c.value})` : ""}</li>`
                ).join("")}</ul>`;
              }
              if (fonts.length > 0) {
                contentHtml += `<p><span class="label">Fonts</span></p><ul>${fonts.map((f) => 
                  `<li>${f.label}: ${f.value}</li>`
                ).join("")}</ul>`;
              }
              break;

            default:
              contentHtml = items.map((item) => 
                `<p>${item.value}</p>`
              ).join("");
          }

          html += `<div class="block"><div class="block-title">${block.label}</div><div class="block-content">${contentHtml}</div></div>`;
        });

        html += `</div>`;
      });

      html += `
          <div class="footer">Generated by Launchbox</div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        
        toast.success("PDF export ready - use Save as PDF in print dialog");
      } else {
        toast.error("Please allow popups to export PDF");
      }
    } catch (error) {
      toast.error("Failed to export snapshot");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const hasContent = phases.some((p) => p.hasContent);

  if (!hasContent) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isExporting}
      onClick={handleExportPDF}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export PDF
    </Button>
  );
}
