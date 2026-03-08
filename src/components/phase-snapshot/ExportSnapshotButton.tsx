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

      const blockIndex = { count: 0 };

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Launch Brief — ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      line-height: 1.65;
      color: #18181b;
      background: #fff;
      padding: 48px 56px;
      max-width: 820px;
      margin: 0 auto;
    }

    /* ── Document Header ── */
    .doc-header {
      border-bottom: 3px solid #18181b;
      padding-bottom: 16px;
      margin-bottom: 40px;
    }
    .doc-brand {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #f5c842;
      background: #18181b;
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      margin-bottom: 10px;
    }
    .doc-title {
      font-size: 26px;
      font-weight: 700;
      color: #18181b;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .doc-meta {
      font-size: 12px;
      color: #71717a;
      margin-top: 4px;
    }

    /* ── Phase Section ── */
    .phase-section {
      margin-bottom: 44px;
    }
    .phase-heading {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #18181b;
      padding-bottom: 8px;
      border-bottom: 2px solid #18181b;
      margin-bottom: 0;
    }

    /* ── Block Row ── */
    .block {
      border-bottom: 1px solid #e4e4e7;
      padding: 18px 0;
    }
    .block:last-child {
      border-bottom: none;
    }
    .block-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 10px;
    }
    .block-num {
      font-size: 10px;
      font-weight: 700;
      color: #a1a1aa;
      min-width: 22px;
      font-variant-numeric: tabular-nums;
    }
    .block-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #18181b;
    }
    .block-body {
      padding-left: 32px;
      font-size: 13px;
      color: #3f3f46;
    }

    /* ── Content Types ── */
    p { margin-bottom: 0; line-height: 1.7; }

    blockquote {
      border-left: 3px solid #f5c842;
      background: #fffbeb;
      padding: 10px 16px;
      border-radius: 0 5px 5px 0;
      font-style: italic;
      font-size: 14px;
      color: #18181b;
      line-height: 1.65;
    }

    ol.num-list { list-style: none; padding: 0; }
    ol.num-list li {
      display: flex;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px solid #f4f4f5;
      color: #3f3f46;
    }
    ol.num-list li:last-child { border-bottom: none; }
    .li-num { font-weight: 700; color: #18181b; min-width: 18px; font-size: 12px; }

    .kv-table { width: 100%; border-collapse: collapse; }
    .kv-table tr td:first-child {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #a1a1aa;
      padding: 7px 16px 7px 0;
      vertical-align: top;
      width: 130px;
    }
    .kv-table tr td:last-child {
      padding: 7px 0;
      color: #18181b;
      border-bottom: 1px solid #f4f4f5;
      vertical-align: top;
    }
    .kv-table tr:last-child td:last-child { border-bottom: none; }

    .offer-table { width: 100%; border-collapse: collapse; }
    .offer-table th {
      background: #18181b;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 7px 12px;
      text-align: left;
    }
    .offer-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e4e4e7;
      font-size: 12px;
      color: #3f3f46;
      vertical-align: top;
    }
    .offer-table tr:last-child td { border-bottom: none; }
    .offer-table tr:nth-child(even) td { background: #fafafa; }
    .price-tag {
      display: inline-block;
      padding: 2px 8px;
      background: #18181b;
      color: #f5c842;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
    }

    ul.checklist { list-style: none; padding: 0; }
    ul.checklist li {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 5px 0;
      border-bottom: 1px solid #f4f4f5;
      color: #3f3f46;
    }
    ul.checklist li:last-child { border-bottom: none; }
    .check-mark {
      width: 15px;
      height: 15px;
      background: #0ea572;
      border-radius: 50%;
      flex-shrink: 0;
      color: white;
      font-size: 8px;
      font-weight: 900;
      text-align: center;
      line-height: 15px;
    }

    .metrics-table { width: 100%; border-collapse: collapse; }
    .metrics-table th {
      background: #18181b;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 7px 12px;
      text-align: left;
    }
    .metrics-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e4e4e7;
      font-size: 13px;
    }
    .metrics-table tr:last-child td { border-bottom: none; }
    .metrics-table tr:nth-child(even) td { background: #fafafa; }
    .metric-val { font-size: 16px; font-weight: 700; color: #18181b; }

    .dates-table { width: 100%; border-collapse: collapse; }
    .dates-table th {
      background: #18181b;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 7px 12px;
      text-align: left;
    }
    .dates-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e4e4e7;
      font-size: 13px;
    }
    .dates-table tr:last-child td { border-bottom: none; }
    .dates-table tr:nth-child(even) td { background: #fafafa; }
    .dates-table td:last-child { font-weight: 600; color: #18181b; }

    .badge-list { display: flex; flex-wrap: wrap; gap: 7px; }
    .badge {
      padding: 4px 12px;
      background: #18181b;
      color: #f5c842;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .color-swatches { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .color-swatch { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #3f3f46; }
    .swatch-circle {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.12);
      flex-shrink: 0;
    }
    .font-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a1a1aa;
      margin-bottom: 6px;
    }
    .font-table { width: 100%; border-collapse: collapse; }
    .font-table td {
      padding: 6px 0;
      border-bottom: 1px solid #f4f4f5;
      font-size: 12px;
    }
    .font-table tr:last-child td { border-bottom: none; }
    .font-table td:first-child { color: #a1a1aa; text-transform: capitalize; width: 80px; }
    .font-table td:last-child { font-weight: 600; color: #18181b; }

    .bio-block { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f4f4f5; }
    .bio-block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .bio-platform-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a1a1aa;
      margin-bottom: 4px;
    }
    .bio-text { line-height: 1.65; color: #18181b; }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 56px;
      padding-top: 16px;
      border-top: 1px solid #e4e4e7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #a1a1aa;
    }
    .footer-brand { font-weight: 700; color: #18181b; }

    @media print {
      body { padding: 24px 32px; }
      .phase-section { page-break-inside: avoid; }
      .block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-brand">Launchely</div>
    <div class="doc-title">${projectName} — Launch Brief</div>
    <div class="doc-meta">Exported ${date}</div>
  </div>
`;

      phases.forEach((phaseData) => {
        if (!phaseData.hasContent) return;

        const phaseLabel = PHASE_LABELS[phaseData.phase as Phase] || phaseData.phase;

        html += `<div class="phase-section">
    <div class="phase-heading">${phaseLabel}</div>`;

        phaseData.blocks.forEach((block) => {
          blockIndex.count++;
          const num = String(blockIndex.count).padStart(2, '0');
          const items = block.structuredContent?.items || [];
          let contentHtml = '';

          switch (block.contentType) {

            case 'paragraph':
              contentHtml = items.map(item => `<p>${item.value}</p>`).join('');
              break;

            case 'quote':
              contentHtml = items.map(item => `<blockquote>${item.value}</blockquote>`).join('');
              break;

            case 'numbered-list':
              contentHtml = `<ol class="num-list">${items.map((item, idx) =>
                `<li><span class="li-num">${idx + 1}.</span>${item.value}</li>`
              ).join('')}</ol>`;
              break;

            case 'key-value':
              contentHtml = `<table class="kv-table">${items.map(item =>
                `<tr><td>${item.label || ''}</td><td>${item.value}</td></tr>`
              ).join('')}</table>`;
              break;

            case 'offer-stack':
              contentHtml = `<table class="offer-table">
          <tr><th>Offer</th><th>Description</th><th>Price</th></tr>
          ${items.map(item =>
                `<tr>
              <td>${item.label || ''}</td>
              <td>${item.value || '—'}</td>
              <td>${item.secondary ? `<span class="price-tag">${item.secondary}</span>` : '—'}</td>
            </tr>`
              ).join('')}
        </table>`;
              break;

            case 'checklist':
              contentHtml = `<ul class="checklist">${items.map(item =>
                `<li><span class="check-mark">✓</span>${item.value}</li>`
              ).join('')}</ul>`;
              break;

            case 'metrics':
              contentHtml = `<table class="metrics-table">
          <tr><th>Metric</th><th>Value</th></tr>
          ${items.map(item =>
                `<tr><td>${item.label}</td><td class="metric-val">${item.value}</td></tr>`
              ).join('')}
        </table>`;
              break;

            case 'dates':
              contentHtml = `<table class="dates-table">
          <tr><th>Milestone</th><th>Date</th></tr>
          ${items.map(item =>
                `<tr><td>${item.label}</td><td>${item.value}</td></tr>`
              ).join('')}
        </table>`;
              break;

            case 'badge':
              contentHtml = `<div class="badge-list">${items.map(item =>
                `<span class="badge">${item.value}</span>`
              ).join('')}</div>`;
              break;

            case 'visual-palette': {
              const colors = items.filter(i => i.label === 'color');
              const fonts = items.filter(i => i.label !== 'color');
              if (colors.length > 0) {
                contentHtml += `<div class="color-swatches">${colors.map(c =>
                  `<div class="color-swatch">
                    <div class="swatch-circle" style="background:${c.color || c.value}"></div>
                    ${c.value || c.color || ''}
                  </div>`
                ).join('')}</div>`;
              }
              if (fonts.length > 0) {
                contentHtml += `<div class="font-section-label">Fonts</div>
              <table class="font-table">
                ${fonts.map(f =>
                    `<tr><td>${f.label}</td><td>${f.value}</td></tr>`
                  ).join('')}
              </table>`;
              }
              break;
            }

            case 'social-bio':
              contentHtml = items.map(item =>
                `<div class="bio-block">
                  <div class="bio-platform-label">${item.label}</div>
                  <div class="bio-text">${item.value}</div>
                </div>`
              ).join('');
              break;

            default:
              contentHtml = items.map(item => `<p>${item.value}</p>`).join('');
          }

          html += `<div class="block">
      <div class="block-header">
        <span class="block-num">${num}</span>
        <span class="block-label">${block.label}</span>
      </div>
      <div class="block-body">${contentHtml}</div>
    </div>`;
        });

        html += `</div>`;
      });

      html += `
  <div class="doc-footer">
    <span class="footer-brand">Launchely</span>
    <span>Launch Brief · ${date}</span>
  </div>
</body>
</html>`;

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
