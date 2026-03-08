import { useState } from "react";
import { Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PHASE_LABELS, Phase } from "@/types/tasks";
import type { PhaseData } from "@/hooks/usePhaseSnapshot";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";

interface ExportSnapshotButtonProps {
  phases: PhaseData[];
  projectName?: string;
}

export function ExportSnapshotButton({ phases, projectName = "Project" }: ExportSnapshotButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasAccess } = useFeatureAccess();

  const canExport = hasAccess('export_snapshot');

  const handleExportPDF = () => {
    if (!canExport) {
      setShowUpgrade(true);
      return;
    }
    
    setIsExporting(true);
    
    try {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Launch Brief - ${projectName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              color: #18181b;
              background: #ffffff;
              font-size: 13px;
              line-height: 1.6;
            }

            .cover {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 60px;
              background: #18181b;
              color: #ffffff;
              page-break-after: always;
            }
            .cover-label {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: #f5c842;
              margin-bottom: 24px;
            }
            .cover-title {
              font-size: 48px;
              font-weight: 700;
              line-height: 1.1;
              margin-bottom: 16px;
              color: #ffffff;
            }
            .cover-subtitle {
              font-size: 18px;
              color: rgba(255,255,255,0.6);
              margin-bottom: 48px;
              max-width: 480px;
              line-height: 1.5;
            }
            .cover-meta {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .cover-meta-item {
              font-size: 13px;
              color: rgba(255,255,255,0.5);
            }
            .cover-meta-item strong {
              color: rgba(255,255,255,0.85);
              font-weight: 500;
            }
            .cover-accent {
              width: 48px;
              height: 4px;
              background: #f5c842;
              border-radius: 2px;
              margin-bottom: 32px;
            }

            .content {
              padding: 48px 56px;
              max-width: 800px;
              margin: 0 auto;
            }

            .phase-section {
              margin-bottom: 48px;
              page-break-inside: avoid;
            }
            .phase-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #18181b;
            }
            .phase-dot {
              width: 10px;
              height: 10px;
              background: #f5c842;
              border-radius: 50%;
              flex-shrink: 0;
            }
            .phase-title {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #18181b;
            }

            .block {
              margin-bottom: 16px;
              padding: 20px 24px;
              border: 1px solid #e4e4e7;
              border-radius: 10px;
              page-break-inside: avoid;
              background: #fafafa;
            }
            .block-label {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: #71717a;
              margin-bottom: 10px;
            }
            .block-content { font-size: 13px; color: #3f3f46; }

            .paragraph { line-height: 1.7; }

            .quote {
              font-style: italic;
              font-size: 15px;
              line-height: 1.65;
              color: #18181b;
              padding: 12px 20px;
              border-left: 3px solid #f5c842;
              background: #fffbeb;
              border-radius: 0 6px 6px 0;
            }
            .quote::before { content: open-quote; }
            .quote::after { content: close-quote; }

            .numbered-list { padding: 0; list-style: none; }
            .numbered-list li {
              display: flex;
              gap: 12px;
              padding: 6px 0;
              border-bottom: 1px solid #f4f4f5;
            }
            .numbered-list li:last-child { border-bottom: none; }
            .num {
              font-weight: 700;
              color: #18181b;
              min-width: 20px;
              font-size: 12px;
            }

            .kv-row { margin-bottom: 12px; }
            .kv-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #a1a1aa;
              margin-bottom: 3px;
            }
            .kv-value { color: #18181b; line-height: 1.6; }

            .offer-item {
              padding: 14px 0;
              border-bottom: 1px solid #e4e4e7;
            }
            .offer-item:first-child { padding-top: 0; }
            .offer-item:last-child { border-bottom: none; padding-bottom: 0; }
            .offer-name { font-weight: 600; font-size: 14px; color: #18181b; }
            .offer-desc { color: #71717a; margin-top: 3px; font-size: 12px; }
            .offer-price {
              display: inline-block;
              margin-top: 6px;
              padding: 3px 10px;
              background: #18181b;
              color: #f5c842;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            }

            .checklist { padding: 0; list-style: none; }
            .checklist li {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 5px 0;
              font-size: 13px;
              color: #3f3f46;
            }
            .check-icon {
              width: 16px;
              height: 16px;
              background: #0ea572;
              border-radius: 50%;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 9px;
              font-weight: 700;
            }

            .badge-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .badge {
              padding: 6px 14px;
              background: #18181b;
              color: #f5c842;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }

            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .metric-cell {
              padding: 12px;
              background: #f4f4f5;
              border-radius: 6px;
            }
            .metric-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #a1a1aa;
              margin-bottom: 4px;
            }
            .metric-value { font-size: 18px; font-weight: 700; color: #18181b; }

            .dates-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f4f4f5;
              font-size: 13px;
            }
            .dates-row:last-child { border-bottom: none; }
            .date-label { color: #71717a; }
            .date-value { font-weight: 600; color: #18181b; }

            .color-swatches { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
            .color-swatch {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              color: #3f3f46;
            }
            .swatch-dot {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 1px solid rgba(0,0,0,0.1);
              flex-shrink: 0;
            }
            .font-row {
              padding: 6px 0;
              border-bottom: 1px solid #f4f4f5;
              display: flex;
              gap: 8px;
              font-size: 13px;
            }
            .font-row:last-child { border-bottom: none; }
            .font-category { color: #a1a1aa; font-size: 11px; min-width: 60px; text-transform: capitalize; margin-top: 2px; }

            .bio-platform {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #a1a1aa;
              margin-bottom: 4px;
            }
            .bio-content { line-height: 1.6; margin-bottom: 12px; }

            .page-footer {
              margin-top: 64px;
              padding-top: 24px;
              border-top: 1px solid #e4e4e7;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              color: #a1a1aa;
            }
            .footer-brand { font-weight: 600; color: #18181b; }

            @media print {
              .cover { min-height: 100vh; }
              .phase-section { page-break-inside: avoid; }
              .block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="cover">
            <div class="cover-label">Launchely</div>
            <div class="cover-accent"></div>
            <div class="cover-title">${projectName}</div>
            <div class="cover-subtitle">Your complete launch brief — everything you've built, phase by phase.</div>
            <div class="cover-meta">
              <div class="cover-meta-item"><strong>Document:</strong> Launch Brief</div>
              <div class="cover-meta-item"><strong>Exported:</strong> ${date}</div>
            </div>
          </div>
          <div class="content">
      `;

      phases.forEach((phaseData) => {
        if (!phaseData.hasContent) return;

        const phaseLabel = PHASE_LABELS[phaseData.phase as Phase] || phaseData.phase;
        
        html += `<div class="phase-section"><div class="phase-header"><div class="phase-dot"></div><div class="phase-title">${phaseLabel}</div></div>`;

        phaseData.blocks.forEach((block) => {
          const items = block.structuredContent?.items || [];
          let contentHtml = "";

          switch (block.contentType) {
            case "numbered-list":
              contentHtml = `<ul class="numbered-list">${items.map((item, idx) => 
                `<li><span class="num">${idx + 1}</span>${item.value}</li>`
              ).join("")}</ul>`;
              break;

            case "key-value":
              contentHtml = items.map((item) => 
                `<div class="kv-row"><div class="kv-label">${item.label || ""}</div><div class="kv-value">${item.value}</div></div>`
              ).join("");
              break;

            case "offer-stack":
              contentHtml = items.map((item) => 
                `<div class="offer-item"><div class="offer-name">${item.label || ""}</div>${item.value ? `<div class="offer-desc">${item.value}</div>` : ""}${item.secondary ? `<span class="offer-price">${item.secondary}</span>` : ""}</div>`
              ).join("");
              break;

            case "checklist":
              contentHtml = `<ul class="checklist">${items.map((item) => 
                `<li><span class="check-icon">✓</span>${item.value}</li>`
              ).join("")}</ul>`;
              break;

            case "dates":
              contentHtml = items.map((item) => 
                `<div class="dates-row"><span class="date-label">${item.label}</span><span class="date-value">${item.value}</span></div>`
              ).join("");
              break;

            case "metrics":
              contentHtml = `<div class="metrics-grid">${items.map((item) => 
                `<div class="metric-cell"><div class="metric-label">${item.label}</div><div class="metric-value">${item.value}</div></div>`
              ).join("")}</div>`;
              break;

            case "quote":
              contentHtml = items.map((item) => 
                `<div class="quote">${item.value}</div>`
              ).join("");
              break;

            case "social-bio":
              contentHtml = items.map((item) => 
                `<div class="bio-platform">${item.label}</div><div class="bio-content">${item.value}</div>`
              ).join("");
              break;

            case "badge":
              contentHtml = `<div class="badge-list">${items.map((item) => 
                `<span class="badge">${item.value}</span>`
              ).join("")}</div>`;
              break;

            case "visual-palette":
              const colors = items.filter(i => i.label === "color");
              const fonts = items.filter(i => i.label !== "color");
              if (colors.length > 0) {
                contentHtml += `<div class="color-swatches">${colors.map((c) => 
                  `<div class="color-swatch"><div class="swatch-dot" style="background:${c.color || c.value}"></div>${c.value || c.color}</div>`
                ).join("")}</div>`;
              }
              if (fonts.length > 0) {
                contentHtml += fonts.map((f) => 
                  `<div class="font-row"><span class="font-category">${f.label}</span>${f.value}</div>`
                ).join("");
              }
              break;

            default:
              contentHtml = items.map((item) => 
                `<p class="paragraph">${item.value}</p>`
              ).join("");
          }

          html += `<div class="block"><div class="block-label">${block.label}</div><div class="block-content">${contentHtml}</div></div>`;
        });

        html += `</div>`;
      });

      html += `
            <div class="page-footer">
              <span class="footer-brand">Launchely</span>
              <span>Launch Brief · Exported ${date}</span>
            </div>
          </div>
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
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={handleExportPDF}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export PDF
        {!canExport && <Crown className="w-3 h-3 text-primary" />}
      </Button>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature="Export Phase Snapshot" />
    </>
  );
}
