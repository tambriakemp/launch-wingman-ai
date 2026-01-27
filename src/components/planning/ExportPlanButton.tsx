import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectTaskData {
  taskId: string;
  inputData?: Record<string, unknown>;
}

interface OfferData {
  id: string;
  title: string | null;
  offer_type: string | null;
  slot_type: string | null;
}

interface ExportPlanButtonProps {
  projectName: string;
  projectTasks: ProjectTaskData[];
  offers: OfferData[];
  selectedFunnelType: string | null;
}

const FUNNEL_TYPE_LABELS: Record<string, string> = {
  content_to_offer: 'Content → Offer',
  freebie_email_offer: 'Freebie → Email → Offer',
  live_training_offer: 'Live Training → Offer',
  application_call: 'Application → Call',
  membership: 'Membership',
  challenge: 'Challenge',
  launch: 'Launch',
};

export function ExportPlanButton({ projectName, projectTasks, offers, selectedFunnelType }: ExportPlanButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    try {
      // Extract data from project tasks
      const audienceTask = projectTasks.find(t => t.taskId === 'planning_define_audience');
      const audience = (audienceTask?.inputData as Record<string, unknown>)?.audience_description as string || null;

      const problemTask = projectTasks.find(t => t.taskId === 'planning_define_problem');
      const problem = (problemTask?.inputData as Record<string, unknown>)?.primary_problem as string || null;

      const outcomeTask = projectTasks.find(t => t.taskId === 'planning_define_dream_outcome');
      const outcome = (outcomeTask?.inputData as Record<string, unknown>)?.dream_outcome as string || null;

      const timeEffortTask = projectTasks.find(t => t.taskId === 'planning_time_effort_perception');
      const timeEffortData = timeEffortTask?.inputData as Record<string, unknown> || {};
      const timeEffort = {
        quickWins: timeEffortData.quick_wins as string || null,
        frictionReducers: timeEffortData.friction_reducers as string || null,
        effortReframe: timeEffortData.effort_reframe as string || null,
      };

      const beliefTask = projectTasks.find(t => t.taskId === 'planning_perceived_likelihood');
      const beliefData = beliefTask?.inputData as Record<string, unknown> || {};
      const trustFactors = {
        beliefBlockers: beliefData.belief_blockers as string || null,
        beliefBuilders: beliefData.belief_builders as string || null,
        pastAttempts: beliefData.past_attempts as string || null,
      };

      const configuredOffers = offers.filter(o => o.offer_type?.trim()).map(o => ({
        slotType: o.slot_type,
        title: o.title || o.offer_type,
      }));

      const launchPath = selectedFunnelType ? FUNNEL_TYPE_LABELS[selectedFunnelType] || selectedFunnelType : null;

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

      const renderOffers = () => {
        if (configuredOffers.length === 0) {
          return renderSection('Offer Stack', null);
        }
        
        const offersHtml = configuredOffers.map(o => `
          <div class="offer-item">
            <span class="offer-slot">${o.slotType?.replace('_', ' ') || 'Offer'}:</span>
            <span class="offer-title">${o.title}</span>
          </div>
        `).join('');
        
        return `
          <div class="section">
            <div class="section-label">Offer Stack</div>
            <div class="section-content">${offersHtml}</div>
          </div>
        `;
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Planning Foundation - ${projectName}</title>
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
              color: #3b82f6; 
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
            }
            
            .offer-item {
              padding: 8px 0;
              border-bottom: 1px dashed #e5e7eb;
            }
            .offer-item:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .offer-item:first-child {
              padding-top: 0;
            }
            .offer-slot {
              font-weight: 600;
              text-transform: capitalize;
              color: #1f2937;
            }
            .offer-title {
              color: #4b5563;
              margin-left: 4px;
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
            <h2>Planning Foundation</h2>
            <div class="date">Exported ${date}</div>
          </div>
          
          ${renderSection('Target Audience', audience)}
          ${renderSection('Main Problem', problem)}
          ${renderSection('Dream Outcome', outcome)}
          
          ${renderMultiSection('Time & Effort Perception', [
            { sublabel: 'Quick Wins', content: timeEffort.quickWins },
            { sublabel: 'Friction Reducers', content: timeEffort.frictionReducers },
            { sublabel: 'Effort Reframe', content: timeEffort.effortReframe },
          ])}
          
          ${renderMultiSection('Trust Factors', [
            { sublabel: 'Belief Blockers', content: trustFactors.beliefBlockers },
            { sublabel: 'Belief Builders', content: trustFactors.beliefBuilders },
            { sublabel: 'Past Attempts', content: trustFactors.pastAttempts },
          ])}
          
          ${renderOffers()}
          ${renderSection('Launch Path', launchPath)}
          
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
      toast.error("Failed to export plan");
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
      Export Plan PDF
    </Button>
  );
}
