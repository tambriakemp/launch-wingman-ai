import { demoLinks } from "../campaignDemoData";

interface Props {
  campaignId: string;
}

export default function LinksTab({ campaignId }: Props) {
  const links = demoLinks.filter((l) => l.campaign_id === campaignId);

  return (
    <div className="mt-4">
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No links attached to this campaign yet.</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source / Medium</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Clicks</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">CVR</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{l.utm_source} / {l.utm_medium}</td>
                  <td className="p-3 text-right">{l.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right">{l.leads.toLocaleString()}</td>
                  <td className="p-3 text-right">${l.revenue.toLocaleString()}</td>
                  <td className="p-3 text-right">{l.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
