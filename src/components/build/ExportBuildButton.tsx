import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectTaskData {
  taskId: string;
  inputData?: Record<string, unknown>;
  status?: string;
}

interface ExportBuildButtonProps {
  projectName: string;
  projectTasks: ProjectTaskData[];
}

export function ExportBuildButton({ projectName, projectTasks }: ExportBuildButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    try {
      // Extract data from project tasks - new delivery asset tasks
      const deliveryAssetTask = projectTasks.find(t => t.taskId === 'build_choose_delivery_asset');
      const deliveryAssetData = deliveryAssetTask?.inputData as Record<string, unknown> || {};
      const deliveryType = deliveryAssetData.selectedOption as string || null;
      
      const deliveryLabels: Record<string, string> = {
        'live_session': 'Live session or workshop',
        'downloadable': 'Downloadable resource',
        'access_page': 'Access page or portal',
        'curated_bundle': 'Curated bundle',
        'affiliate_product': 'Affiliate product',
        'mrr_plr_product': 'MRR/PLR product',
      };

      const createAssetTask = projectTasks.find(t => t.taskId === 'build_create_asset');
      const createAssetData = createAssetTask?.inputData as Record<string, unknown> || {};
      const assetName = createAssetData.asset_name as string || null;
      const assetDescription = createAssetData.asset_description as string || null;

      const accessMomentTask = projectTasks.find(t => t.taskId === 'build_define_access_moment');
      const accessMomentData = accessMomentTask?.inputData as Record<string, unknown> || {};
      const accessMethod = accessMomentData.selectedOption as string || null;
      
      const accessLabels: Record<string, string> = {
        'email_delivery': 'Email delivery',
        'download_link': 'Download link',
        'access_page': 'Access page',
        'live_session_confirmation': 'Live session confirmation',
        'affiliate_redirect': 'Affiliate redirect',
      };

      // Existing build tasks
      const launchPageTask = projectTasks.find(t => t.taskId === 'build_simple_launch_page');
      const launchPageStatus = launchPageTask?.status === 'completed' ? 'Completed' : 'In progress';

      const emailTask = projectTasks.find(t => t.taskId === 'build_email_platform');
      const emailData = emailTask?.inputData as Record<string, unknown> || {};
      const emailPlatform = emailData.email_platform as string || null;
      const emailTestSent = emailData.email_test_sent as string || null;

      const paymentsTask = projectTasks.find(t => t.taskId === 'build_payments_setup');
      const paymentsData = paymentsTask?.inputData as Record<string, unknown> || {};
      const paymentProvider = paymentsData.payment_provider as string || null;
      const testPaymentComplete = paymentsData.test_payment_complete as string || null;

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

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Build Foundation - ${projectName}</title>
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
              color: #10b981; 
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
            <h2>Build Foundation</h2>
            <div class="date">Exported ${date}</div>
          </div>
          
          ${renderSection('Delivery Asset', deliveryType ? (deliveryLabels[deliveryType] || deliveryType) : null)}
          
          ${renderMultiSection('Asset Details', [
            { sublabel: 'Name', content: assetName },
            { sublabel: 'Description', content: assetDescription },
          ])}
          
          ${renderSection('First Access Method', accessMethod ? (accessLabels[accessMethod] || accessMethod) : null)}
          
          ${renderSection('Launch Page', launchPageStatus)}
          
          ${renderMultiSection('Email Platform', [
            { sublabel: 'Platform', content: emailPlatform },
            { sublabel: 'Test email sent', content: emailTestSent },
          ])}
          
          ${renderMultiSection('Payment Setup', [
            { sublabel: 'Provider', content: paymentProvider },
            { sublabel: 'Test payment complete', content: testPaymentComplete },
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
      toast.error("Failed to export build setup");
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
      Export Build PDF
    </Button>
  );
}
