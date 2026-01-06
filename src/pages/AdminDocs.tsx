import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, BookOpen, Shield, Code, Users, 
  CheckCircle2, AlertTriangle, Info, Search,
  MousePointerClick, Eye, UserCog, CreditCard,
  BarChart3, Database, Key, Zap, Settings,
  Activity, FileText, Lock, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

// Step component for numbered instructions
const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
      {number}
    </div>
    <div className="flex-1 pt-0.5">
      <h5 className="font-semibold text-foreground mb-2">{title}</h5>
      <div className="text-muted-foreground text-sm space-y-2">{children}</div>
    </div>
  </div>
);

// Feature card for highlighting capabilities
const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex gap-3 p-4 rounded-lg bg-muted/50 border">
    <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Visual placeholder for screenshots
const ScreenshotPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <div className="my-4 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  </div>
);

// Code block component
const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="my-4 rounded-lg overflow-hidden border">
    {title && (
      <div className="px-4 py-2 bg-muted border-b">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      </div>
    )}
    <pre className="p-4 bg-muted/50 text-xs overflow-x-auto">
      <code>{children}</code>
    </pre>
  </div>
);

// Tip/Warning callout
const Callout = ({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) => {
  const styles = {
    tip: { icon: CheckCircle2, bg: 'bg-green-500/10 border-green-500/30', iconColor: 'text-green-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/30', iconColor: 'text-amber-600' },
    info: { icon: Info, bg: 'bg-blue-500/10 border-blue-500/30', iconColor: 'text-blue-600' },
  };
  const { icon: Icon, bg, iconColor } = styles[type];
  
  return (
    <div className={cn("my-4 p-4 rounded-lg border flex gap-3", bg)}>
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColor)} />
      <div className="text-sm">{children}</div>
    </div>
  );
};

const AdminDocs = () => {
  const { isAdmin } = useAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Training & Documentation</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="manager" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manager</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="developer" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Developer</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Manager Documentation */}
          <TabsContent value="manager" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Manager Documentation</CardTitle>
                    <CardDescription>
                      Learn how to manage users and support your team effectively
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="getting-started">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Getting Started with the Platform
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-muted-foreground mb-6">
                        Welcome to the admin panel! As a manager, you have access to powerful tools 
                        for monitoring user activity and providing support.
                      </p>
                      
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Your Manager Capabilities
                      </h4>
                      
                      <div className="grid gap-3 mb-6">
                        <FeatureCard 
                          icon={Users} 
                          title="User Management" 
                          description="View all users, search by email/name, and monitor activity"
                        />
                        <FeatureCard 
                          icon={Eye} 
                          title="User Impersonation" 
                          description="View the app as any user sees it for troubleshooting"
                        />
                        <FeatureCard 
                          icon={FileText} 
                          title="Content Vault" 
                          description="Manage resources, templates, and educational content"
                        />
                        <FeatureCard 
                          icon={BarChart3} 
                          title="Platform Stats" 
                          description="View engagement metrics and user statistics"
                        />
                      </div>

                      <ScreenshotPlaceholder 
                        title="Admin Dashboard Overview" 
                        description="The main dashboard shows platform stats at the top, followed by the users table"
                      />

                      <Callout type="tip">
                        <strong>Quick Navigation:</strong> Use the search bar at the top of the users table 
                        to quickly find any user by their email address or name.
                      </Callout>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="user-management">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-primary" />
                        User Management Basics
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-muted-foreground mb-6">
                        The users table is your primary tool for managing and supporting users. 
                        Here's how to use it effectively.
                      </p>

                      <h4 className="font-semibold mb-4">Finding Users</h4>
                      
                      <Step number={1} title="Use the Search Bar">
                        <p>Type any part of a user's email or name in the search field. 
                        Results filter in real-time as you type.</p>
                      </Step>

                      <Step number={2} title="Apply Filters">
                        <p>Click the filter button to narrow results by:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li><Badge variant="outline" className="text-xs">Free</Badge> or <Badge variant="outline" className="text-xs">Pro</Badge> subscription status</li>
                          <li>Date range for account creation</li>
                          <li>Last active date</li>
                        </ul>
                      </Step>

                      <Step number={3} title="Sort the Table">
                        <p>Click any column header to sort. Click again to reverse the order.</p>
                      </Step>

                      <ScreenshotPlaceholder 
                        title="Users Table with Filters" 
                        description="Search bar at top, filter options, and sortable columns"
                      />

                      <h4 className="font-semibold mb-4 mt-8">Understanding User Information</h4>
                      
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Pro</Badge>
                          <span className="text-muted-foreground">User has an active paid subscription</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Free</Badge>
                          <span className="text-muted-foreground">User is on the free tier</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">Admin</Badge>
                          <span className="text-muted-foreground">User has administrator privileges</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">Manager</Badge>
                          <span className="text-muted-foreground">User has manager privileges</span>
                        </div>
                      </div>

                      <Callout type="info">
                        <strong>Project Count:</strong> The number shown indicates how many projects 
                        the user has created. This helps identify power users vs. new signups.
                      </Callout>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="content-vault">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Content Vault Management
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-muted-foreground mb-6">
                        The Content Vault stores resources, templates, and educational materials 
                        available to all users.
                      </p>

                      <Step number={1} title="Access Content Vault Admin">
                        <p>From the admin dashboard, click the <strong>"Manage Content Vault"</strong> button 
                        in the Quick Actions section at the top.</p>
                      </Step>

                      <Step number={2} title="Navigate Categories">
                        <p>Content is organized into categories and subcategories. Click any category 
                        to view and manage its resources.</p>
                      </Step>

                      <Step number={3} title="Add New Resources">
                        <p>Within a category, click <strong>"Add Resource"</strong> to create a new item. 
                        Fill in the title, description, and resource URL.</p>
                      </Step>

                      <Step number={4} title="Reorder Content">
                        <p>Drag and drop categories or resources to change their display order. 
                        Changes save automatically.</p>
                      </Step>

                      <ScreenshotPlaceholder 
                        title="Content Vault Admin Interface" 
                        description="Category list on the left, resources grid on the right with add/edit controls"
                      />

                      <Callout type="tip">
                        <strong>Resource Types:</strong> You can add videos, PDFs, templates, 
                        and external links. Use descriptive titles and add relevant tags for 
                        better discoverability.
                      </Callout>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="impersonation">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Using Impersonation for Support
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <p className="text-muted-foreground mb-6">
                        Impersonation lets you see exactly what a user sees, making it invaluable 
                        for troubleshooting issues and providing support.
                      </p>

                      <h4 className="font-semibold mb-4">Starting an Impersonation Session</h4>

                      <Step number={1} title="Find the User">
                        <p>Search for the user you need to help in the users table.</p>
                      </Step>

                      <Step number={2} title="Click Impersonate">
                        <p>Click the <strong>"Impersonate"</strong> button on their row. 
                        A confirmation dialog will appear.</p>
                      </Step>

                      <Step number={3} title="Navigate as the User">
                        <p>You'll be redirected to the app, seeing exactly what the user sees. 
                        A yellow banner at the top confirms you're impersonating.</p>
                      </Step>

                      <ScreenshotPlaceholder 
                        title="Impersonation Banner" 
                        description="Yellow warning banner showing 'Viewing as [user email]' with Stop button"
                      />

                      <h4 className="font-semibold mb-4 mt-8">Ending Impersonation</h4>

                      <Step number={1} title="Click Stop Impersonating">
                        <p>Click the <strong>"Stop Impersonating"</strong> button in the yellow banner 
                        at the top of any page.</p>
                      </Step>

                      <Step number={2} title="Return to Admin">
                        <p>You'll be returned to your admin account and can continue your work.</p>
                      </Step>

                      <Callout type="warning">
                        <strong>Important Guidelines:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All impersonation sessions are logged for security</li>
                          <li>Avoid making changes to user data while impersonating</li>
                          <li>Use impersonation for viewing and troubleshooting only</li>
                          <li>End your session when done to prevent accidental changes</li>
                        </ul>
                      </Callout>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="common-issues">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        Common Support Issues & Solutions
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-6">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-3 border-b">
                            <h5 className="font-semibold flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              User Can't Log In
                            </h5>
                          </div>
                          <div className="p-4 space-y-3 text-sm">
                            <p className="text-muted-foreground"><strong>Common Causes:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Incorrect email address (check for typos)</li>
                              <li>Wrong password (suggest password reset)</li>
                              <li>Account not verified (check email spam folder)</li>
                            </ul>
                            <p className="text-muted-foreground mt-3"><strong>Solution:</strong></p>
                            <p className="text-muted-foreground">
                              Direct the user to click <strong>"Forgot Password"</strong> on the login page. 
                              This will send a reset link to their email.
                            </p>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-3 border-b">
                            <h5 className="font-semibold flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Missing Content or Data
                            </h5>
                          </div>
                          <div className="p-4 space-y-3 text-sm">
                            <p className="text-muted-foreground"><strong>Troubleshooting Steps:</strong></p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                              <li>Use impersonation to view the user's account</li>
                              <li>Check if they have created a project</li>
                              <li>Verify data isn't hidden by filters or view settings</li>
                              <li>Check if they're looking in the correct section</li>
                            </ol>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-3 border-b">
                            <h5 className="font-semibold flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Subscription Issues
                            </h5>
                          </div>
                          <div className="p-4 space-y-3 text-sm">
                            <p className="text-muted-foreground"><strong>Common Scenarios:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>User paid but shows as "Free" → Check payment processed correctly</li>
                              <li>Features locked despite Pro status → May need to refresh session</li>
                              <li>Billing questions → Direct to Settings → Subscription</li>
                            </ul>
                            <Callout type="info">
                              If a user should have Pro access but doesn't, escalate to an admin 
                              who can manually grant or verify the subscription.
                            </Callout>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Documentation - Admin Only */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Admin Documentation</CardTitle>
                      <CardDescription>
                        Full platform administration and configuration
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="platform-admin">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-primary" />
                          Full Platform Administration
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-muted-foreground mb-6">
                          As an admin, you have complete control over the platform. This includes 
                          all manager capabilities plus advanced features.
                        </p>

                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Admin-Exclusive Capabilities
                        </h4>

                        <div className="grid gap-3 mb-6">
                          <FeatureCard 
                            icon={CreditCard} 
                            title="Subscription Management" 
                            description="Grant, modify, or cancel user subscriptions directly"
                          />
                          <FeatureCard 
                            icon={UserCog} 
                            title="Role Assignment" 
                            description="Promote users to Admin or Manager roles"
                          />
                          <FeatureCard 
                            icon={BarChart3} 
                            title="Revenue Analytics" 
                            description="View MRR, churn rates, and financial metrics"
                          />
                          <FeatureCard 
                            icon={Activity} 
                            title="System Monitoring" 
                            description="Track platform health and usage patterns"
                          />
                        </div>

                        <ScreenshotPlaceholder 
                          title="Admin Dashboard - Full View" 
                          description="Revenue chart, expanded stats, and full user management controls"
                        />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="subscription-management">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Subscription & Billing Management
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Granting Pro Access Manually</h4>
                        <p className="text-muted-foreground mb-4">
                          Use this for partners, team members, or special cases where you want to 
                          provide Pro access without payment.
                        </p>

                        <Step number={1} title="Find the User">
                          <p>Search for the user in the users table.</p>
                        </Step>

                        <Step number={2} title="Open Subscription Actions">
                          <p>Click the crown icon or subscription action button on their row.</p>
                        </Step>

                        <Step number={3} title="Grant Pro Access">
                          <p>Select <strong>"Grant Pro Access"</strong> from the menu. 
                          This creates a non-Stripe subscription.</p>
                        </Step>

                        <ScreenshotPlaceholder 
                          title="Subscription Action Menu" 
                          description="Dropdown showing 'Grant Pro', 'Cancel Subscription' options"
                        />

                        <h4 className="font-semibold mb-4 mt-8">Bulk Subscription Actions</h4>

                        <Step number={1} title="Select Multiple Users">
                          <p>Use the checkboxes on the left side of each user row to select 
                          multiple users.</p>
                        </Step>

                        <Step number={2} title="Use Bulk Actions">
                          <p>Click the bulk action button that appears to grant or cancel 
                          subscriptions for all selected users at once.</p>
                        </Step>

                        <Callout type="warning">
                          <strong>Stripe Subscriptions:</strong> Canceling a Stripe-managed subscription 
                          will cancel at the end of the current billing period. The user retains access 
                          until then.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="role-management">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-primary" />
                          User Role Assignment
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Available Roles</h4>

                        <div className="space-y-4 mb-6">
                          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="mt-0.5">User</Badge>
                            <div>
                              <p className="font-medium text-sm">Standard User</p>
                              <p className="text-xs text-muted-foreground">
                                Access to the main app, projects, and features based on subscription tier.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Badge className="bg-blue-500/20 text-blue-700 mt-0.5">Manager</Badge>
                            <div>
                              <p className="font-medium text-sm">Manager Access</p>
                              <p className="text-xs text-muted-foreground">
                                Can access admin panel with limited capabilities: user viewing, 
                                impersonation, content vault management.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Badge className="bg-purple-500/20 text-purple-700 mt-0.5">Admin</Badge>
                            <div>
                              <p className="font-medium text-sm">Full Administrator</p>
                              <p className="text-xs text-muted-foreground">
                                Complete access to all platform features, subscription management, 
                                role assignment, and analytics.
                              </p>
                            </div>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Assigning Roles</h4>

                        <Step number={1} title="Find the User">
                          <p>Locate the user you want to modify in the users table.</p>
                        </Step>

                        <Step number={2} title="Open Edit Dialog">
                          <p>Click the <strong>"Edit"</strong> (pencil icon) button on their row.</p>
                        </Step>

                        <Step number={3} title="Toggle Role">
                          <p>Use the role toggle to assign or remove admin/manager privileges. 
                          Changes take effect immediately.</p>
                        </Step>

                        <Callout type="warning">
                          <strong>Security Best Practice:</strong> Only grant admin access to trusted 
                          team members who need full platform control. All role changes are logged 
                          for security auditing.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="analytics">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Platform Analytics & Metrics
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Revenue Dashboard</h4>
                        <p className="text-muted-foreground mb-4">
                          The revenue chart (visible only to admins) shows key financial metrics.
                        </p>

                        <div className="grid gap-3 mb-6">
                          <FeatureCard 
                            icon={BarChart3} 
                            title="Monthly Recurring Revenue (MRR)" 
                            description="Track revenue trends over time, identify growth patterns"
                          />
                          <FeatureCard 
                            icon={Activity} 
                            title="Churn Rate" 
                            description="Monitor subscription cancellations and identify at-risk segments"
                          />
                        </div>

                        <ScreenshotPlaceholder 
                          title="Revenue & Churn Chart" 
                          description="Line graph showing MRR trend and bar chart for monthly churn"
                        />

                        <h4 className="font-semibold mb-4 mt-8">Platform Statistics</h4>
                        <p className="text-muted-foreground mb-4">
                          The stats cards provide real-time insights into platform usage.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold">Projects</p>
                            <p className="text-xs text-muted-foreground">Total created</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold">Content</p>
                            <p className="text-xs text-muted-foreground">Items created</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold">Engagement</p>
                            <p className="text-xs text-muted-foreground">Active sessions</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-2xl font-bold">Offers</p>
                            <p className="text-xs text-muted-foreground">Configured</p>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Feature Usage Heatmap</h4>
                        <p className="text-muted-foreground mb-4">
                          The heatmap visualization shows which features are most and least used, 
                          helping prioritize development efforts.
                        </p>

                        <Callout type="tip">
                          <strong>Using Analytics:</strong> Low feature usage might indicate the 
                          feature needs better discoverability, documentation, or improvement. 
                          High usage on free features might be upgrade opportunities.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="impersonation-logs">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Impersonation Activity Logs
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-muted-foreground mb-6">
                          All impersonation sessions are logged for security and compliance. 
                          Review these logs to monitor admin/manager activity.
                        </p>

                        <h4 className="font-semibold mb-4">Viewing the Logs</h4>

                        <Step number={1} title="Scroll to Bottom">
                          <p>The Impersonation Activity section is located at the bottom of the 
                          admin dashboard, below the users table.</p>
                        </Step>

                        <Step number={2} title="Review Sessions">
                          <p>Each log entry shows:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Admin/manager who initiated the session</li>
                            <li>Target user being impersonated</li>
                            <li>Timestamp when the session started</li>
                            <li>Session duration (if ended)</li>
                          </ul>
                        </Step>

                        <ScreenshotPlaceholder 
                          title="Impersonation Logs Table" 
                          description="Table showing admin email, target email, action type, and timestamp"
                        />

                        <Callout type="info">
                          <strong>Audit Trail:</strong> These logs cannot be deleted and serve as 
                          a permanent record for security auditing purposes.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Developer Documentation - Admin Only */}
          {isAdmin && (
            <TabsContent value="developer" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Developer Documentation</CardTitle>
                      <CardDescription>
                        Technical documentation for developers and integrations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="architecture">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Architecture Overview
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Technology Stack</h4>
                        
                        <div className="grid gap-3 mb-6">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline">Frontend</Badge>
                            <span className="text-sm">React + TypeScript + Vite</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline">Styling</Badge>
                            <span className="text-sm">Tailwind CSS + shadcn/ui components</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline">State</Badge>
                            <span className="text-sm">TanStack Query + React Context</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline">Backend</Badge>
                            <span className="text-sm">Lovable Cloud (PostgreSQL + Edge Functions)</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline">Auth</Badge>
                            <span className="text-sm">Email/Password with JWT sessions</span>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Project Structure</h4>
                        
                        <CodeBlock title="Directory Layout">{`src/
├── components/     # Reusable UI components
│   ├── ui/         # Base shadcn/ui components
│   ├── admin/      # Admin-specific components
│   └── ...         # Feature-specific components
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── pages/          # Page components (routes)
├── integrations/   # External service clients
├── lib/            # Utility functions
├── data/           # Static data & configurations
└── types/          # TypeScript type definitions

supabase/
└── functions/      # Edge functions (Deno)`}</CodeBlock>

                        <Callout type="info">
                          <strong>Component Patterns:</strong> Components follow a co-location pattern 
                          where related files are grouped together. Feature-specific components live 
                          in their own directories.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edge-functions">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Edge Functions Reference
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <p className="text-muted-foreground mb-4">
                          Edge functions handle server-side logic, API integrations, and secure operations.
                        </p>

                        <h4 className="font-semibold mb-4">Key Functions</h4>
                        
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">check-admin</code>
                            <p className="text-xs text-muted-foreground mt-1">Validates admin/manager role for protected operations</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">admin-list-users</code>
                            <p className="text-xs text-muted-foreground mt-1">Fetches user list with subscription data for admin panel</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">admin-manage-subscription</code>
                            <p className="text-xs text-muted-foreground mt-1">Handles granting/canceling subscriptions</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">check-subscription</code>
                            <p className="text-xs text-muted-foreground mt-1">Validates user subscription status</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">generate-*</code>
                            <p className="text-xs text-muted-foreground mt-1">AI content generation (uses Lovable AI)</p>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Creating a New Function</h4>
                        
                        <CodeBlock title="supabase/functions/my-function/index.ts">{`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )
    
    // Your logic here
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})`}</CodeBlock>

                        <Callout type="tip">
                          <strong>Auto-Deploy:</strong> Edge functions deploy automatically when 
                          code is saved. No manual deployment step required.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="database">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Database Schema Overview
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Core Tables</h4>
                        
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">projects</code>
                            <p className="text-xs text-muted-foreground mt-1">User projects with settings, status, and funnel configuration</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">project_tasks</code>
                            <p className="text-xs text-muted-foreground mt-1">Task completion progress for each project</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">funnels</code>
                            <p className="text-xs text-muted-foreground mt-1">Funnel configuration and audience research data</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">offers</code>
                            <p className="text-xs text-muted-foreground mt-1">Offer stack items for each project</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">profiles</code>
                            <p className="text-xs text-muted-foreground mt-1">User profile information (name, last active)</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono text-primary">user_roles</code>
                            <p className="text-xs text-muted-foreground mt-1">Admin/manager role assignments (separate table for security)</p>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Row Level Security (RLS)</h4>
                        <p className="text-muted-foreground mb-4">
                          All tables use RLS policies. Users can only access their own data.
                        </p>

                        <CodeBlock title="Role Checking Pattern">{`-- Use the security definer function for role checks
-- This prevents recursive RLS issues

SELECT public.has_role(auth.uid(), 'admin');
SELECT public.has_role(auth.uid(), 'manager');

-- Example RLS policy using the function
CREATE POLICY "Admins can view all users"
ON public.some_table
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));`}</CodeBlock>

                        <Callout type="warning">
                          <strong>Security Note:</strong> Roles are stored in a separate 
                          <code className="mx-1">user_roles</code> table, NOT on the profiles table. 
                          This prevents privilege escalation attacks.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="authentication">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-primary" />
                          Authentication Flow
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Auth Context</h4>
                        <p className="text-muted-foreground mb-4">
                          Authentication state is managed by <code>AuthContext</code> and provides:
                        </p>
                        
                        <CodeBlock title="Using Auth Context">{`import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { 
    user,              // Current authenticated user
    session,           // Session with access token
    loading,           // Auth loading state
    subscriptionStatus,// 'free' | 'pro'
    isImpersonating,   // Impersonation state
    signIn,            // Sign in function
    signUp,            // Sign up function
    signOut,           // Sign out function
  } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" />;
  
  return <div>Welcome, {user.email}</div>;
};`}</CodeBlock>

                        <h4 className="font-semibold mb-4 mt-6">Protected Routes</h4>
                        
                        <CodeBlock title="Route Protection">{`// Regular protected route (requires login)
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

// Admin protected route (requires admin/manager role)
<ProtectedAdminRoute>
  <AdminPage />
</ProtectedAdminRoute>`}</CodeBlock>

                        <h4 className="font-semibold mb-4 mt-6">Admin Hook</h4>
                        
                        <CodeBlock title="Using Admin Hook">{`import { useAdmin } from "@/hooks/useAdmin";

const AdminComponent = () => {
  const { 
    isAdmin,         // Has admin role
    isManager,       // Has manager role
    hasAdminAccess,  // Either admin or manager
    role,            // 'admin' | 'manager' | null
    loading,         // Loading state
  } = useAdmin();
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      {isAdmin && <AdminOnlyFeature />}
      {hasAdminAccess && <ManagerFeature />}
    </div>
  );
};`}</CodeBlock>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="integrations">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-primary" />
                          External Integrations
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Stripe Integration</h4>
                        <p className="text-muted-foreground mb-4">
                          Stripe handles subscription billing. Key edge functions:
                        </p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono">create-checkout</code>
                            <span className="text-xs text-muted-foreground ml-2">Creates checkout sessions</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono">customer-portal</code>
                            <span className="text-xs text-muted-foreground ml-2">Opens billing portal</span>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Social Media</h4>
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono">instagram-*</code>
                            <span className="text-xs text-muted-foreground ml-2">Instagram Graph API</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <code className="text-sm font-mono">pinterest-*</code>
                            <span className="text-xs text-muted-foreground ml-2">Pinterest API</span>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">AI Services</h4>
                        <p className="text-muted-foreground mb-4">
                          AI features use Lovable AI, which provides access to multiple models 
                          without requiring separate API keys.
                        </p>

                        <Callout type="info">
                          <strong>Lovable AI:</strong> Supports Gemini and GPT models. Use for 
                          content generation, analysis, and AI-powered features without managing 
                          API keys.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="secrets">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-primary" />
                          Environment Variables & Secrets
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <h4 className="font-semibold mb-4">Frontend Environment</h4>
                        <p className="text-muted-foreground mb-4">
                          The <code>.env</code> file is auto-generated and contains:
                        </p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                            <span className="text-muted-foreground">VITE_SUPABASE_URL</span>
                            <span className="text-xs text-muted-foreground ml-2">= Backend URL</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                            <span className="text-muted-foreground">VITE_SUPABASE_PUBLISHABLE_KEY</span>
                            <span className="text-xs text-muted-foreground ml-2">= Anon key</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                            <span className="text-muted-foreground">VITE_SUPABASE_PROJECT_ID</span>
                            <span className="text-xs text-muted-foreground ml-2">= Project ID</span>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-4">Edge Function Secrets</h4>
                        <p className="text-muted-foreground mb-4">
                          Secrets for edge functions are managed through Lovable Cloud:
                        </p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                            <span className="text-muted-foreground">STRIPE_SECRET_KEY</span>
                            <span className="text-xs text-muted-foreground ml-2">— Stripe API</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                            <span className="text-muted-foreground">ELEVENLABS_API_KEY</span>
                            <span className="text-xs text-muted-foreground ml-2">— Text-to-speech</span>
                          </div>
                        </div>

                        <Callout type="warning">
                          <strong>Never commit secrets:</strong> The <code>.env</code> file is 
                          gitignored. Never hardcode API keys in source code.
                        </Callout>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="troubleshooting">
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-primary" />
                          Troubleshooting Guide
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-6">
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-destructive/10 px-4 py-3 border-b border-destructive/20">
                              <h5 className="font-semibold text-destructive">Edge Function Errors</h5>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                              <p className="font-medium">Debugging Steps:</p>
                              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Check function logs in Lovable Cloud console</li>
                                <li>Verify all required secrets are configured</li>
                                <li>Ensure CORS headers are properly set</li>
                                <li>Check request payload format matches expected schema</li>
                              </ol>
                            </div>
                          </div>

                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20">
                              <h5 className="font-semibold text-amber-700">RLS Policy Issues</h5>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                              <p className="font-medium">Common Causes:</p>
                              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>User not authenticated when making request</li>
                                <li>Policy conditions don't match user context</li>
                                <li>Missing policy for specific operation (SELECT/INSERT/etc.)</li>
                              </ul>
                              <CodeBlock>{`// Verify auth state in console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);`}</CodeBlock>
                            </div>
                          </div>

                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-500/10 px-4 py-3 border-b border-blue-500/20">
                              <h5 className="font-semibold text-blue-700">Type Errors</h5>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                              <p className="font-medium">Resolution:</p>
                              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Types are auto-generated from database schema</li>
                                <li>Run database migrations to update types</li>
                                <li>Check <code>src/integrations/supabase/types.ts</code></li>
                                <li>Types file is read-only — changes come from schema</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDocs;
