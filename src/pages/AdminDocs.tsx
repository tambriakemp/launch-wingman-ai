import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, Shield, Code, Users } from "lucide-react";

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

      <main className="container mx-auto px-4 py-8">
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
                <CardTitle>Manager Documentation</CardTitle>
                <CardDescription>
                  Learn how to manage users and support your team effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="getting-started">
                    <AccordionTrigger>Getting Started with the Platform</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>Overview</h4>
                      <p>
                        The admin panel provides managers with tools to monitor user activity, 
                        support users, and manage content. As a manager, you have access to:
                      </p>
                      <ul>
                        <li>User list and activity monitoring</li>
                        <li>User impersonation for support purposes</li>
                        <li>Content Vault management</li>
                        <li>Platform statistics and metrics</li>
                      </ul>
                      <h4>Navigation</h4>
                      <p>
                        The admin dashboard is divided into sections: Platform Stats at the top,
                        followed by the Users table where you can search, filter, and manage users.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="user-management">
                    <AccordionTrigger>User Management Basics</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>Viewing Users</h4>
                      <p>
                        The users table displays all registered users with their subscription status,
                        last active date, and project count. Use the search bar to find specific users
                        by email or name.
                      </p>
                      <h4>Filtering Users</h4>
                      <p>
                        Filter users by subscription status (Free/Pro) or date range to narrow down
                        the list. You can also sort by different columns.
                      </p>
                      <h4>Viewing User Activity</h4>
                      <p>
                        Click the "Activity" button on any user row to see their recent activity,
                        including page visits, feature usage, and actions taken within the app.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="content-vault">
                    <AccordionTrigger>Content Vault Management</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>Accessing Content Vault Admin</h4>
                      <p>
                        Click "Manage Content Vault" in the Quick Actions section to access the
                        Content Vault administration panel.
                      </p>
                      <h4>Managing Categories</h4>
                      <p>
                        Categories organize resources into logical groups. You can create, edit,
                        and reorder categories. Each category has a name, description, and optional
                        cover image.
                      </p>
                      <h4>Managing Resources</h4>
                      <p>
                        Resources are individual items (videos, templates, guides) within categories.
                        Each resource has a title, description, resource URL, and optional tags.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="impersonation">
                    <AccordionTrigger>How to Use Impersonation for Support</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>What is Impersonation?</h4>
                      <p>
                        Impersonation allows you to view the app as a specific user sees it.
                        This is essential for debugging issues and providing support.
                      </p>
                      <h4>Starting Impersonation</h4>
                      <ol>
                        <li>Find the user in the users table</li>
                        <li>Click the "Impersonate" button on their row</li>
                        <li>You'll see a banner indicating you're impersonating</li>
                        <li>Navigate the app as that user would see it</li>
                      </ol>
                      <h4>Ending Impersonation</h4>
                      <p>
                        Click "Stop Impersonating" in the yellow banner at the top of the screen
                        to return to your admin account.
                      </p>
                      <h4>Important Notes</h4>
                      <ul>
                        <li>All impersonation sessions are logged for security</li>
                        <li>Be careful not to make changes to user data while impersonating</li>
                        <li>Impersonation is meant for viewing only</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="common-issues">
                    <AccordionTrigger>Common User Support Issues</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>User Can't Log In</h4>
                      <p>
                        Common causes: incorrect email, password reset needed, or account not verified.
                        Direct users to use the "Forgot Password" link on the login page.
                      </p>
                      <h4>Missing Content or Data</h4>
                      <p>
                        Use impersonation to view the user's account. Check if they have created
                        a project and if data is actually missing or just not visible due to filters.
                      </p>
                      <h4>Subscription Issues</h4>
                      <p>
                        Check the user's subscription status in the admin panel. If they should have
                        Pro access but don't, escalate to an admin for subscription management.
                      </p>
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
                  <CardTitle>Admin Documentation</CardTitle>
                  <CardDescription>
                    Full platform administration and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="platform-admin">
                      <AccordionTrigger>Full Platform Administration</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Admin Capabilities</h4>
                        <p>
                          As an admin, you have full access to all platform features including:
                        </p>
                        <ul>
                          <li>All manager capabilities</li>
                          <li>Subscription and billing management</li>
                          <li>User role assignment (Admin/Manager)</li>
                          <li>Revenue and churn analytics</li>
                          <li>System configuration</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="subscription-management">
                      <AccordionTrigger>Subscription & Billing Management</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Granting Pro Access</h4>
                        <p>
                          To grant a user Pro access without payment (e.g., for partners or team members):
                        </p>
                        <ol>
                          <li>Find the user in the users table</li>
                          <li>Click the subscription action button</li>
                          <li>Select "Grant Pro Access"</li>
                          <li>This creates a non-Stripe subscription that doesn't charge the user</li>
                        </ol>
                        <h4>Canceling Subscriptions</h4>
                        <p>
                          You can cancel both Stripe and manually granted subscriptions. Stripe
                          subscriptions will cancel at the end of the billing period.
                        </p>
                        <h4>Bulk Actions</h4>
                        <p>
                          Select multiple users using the checkboxes to perform bulk subscription
                          actions like granting or canceling Pro access for multiple users at once.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="role-management">
                      <AccordionTrigger>User Role Assignment</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Available Roles</h4>
                        <ul>
                          <li><strong>User:</strong> Standard user with access to the main app</li>
                          <li><strong>Manager:</strong> Can access admin panel with limited capabilities</li>
                          <li><strong>Admin:</strong> Full access to all admin features</li>
                        </ul>
                        <h4>Assigning Roles</h4>
                        <p>
                          Click the "Edit" button on a user row and use the role toggle to assign
                          or remove admin/manager roles. Changes take effect immediately.
                        </p>
                        <h4>Security Considerations</h4>
                        <p>
                          Only grant admin access to trusted team members. All role changes are
                          logged for security purposes.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="analytics">
                      <AccordionTrigger>Platform Analytics & Metrics</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Revenue Chart</h4>
                        <p>
                          The revenue/churn chart shows monthly recurring revenue trends and
                          cancellation rates. This helps identify growth patterns and potential issues.
                        </p>
                        <h4>Platform Stats</h4>
                        <p>
                          The stats cards show key metrics like total projects, content items,
                          engagement metrics, and onboarding funnel conversion rates.
                        </p>
                        <h4>Feature Usage Heatmap</h4>
                        <p>
                          The heatmap shows which features are most used by users, helping
                          prioritize development and identify underutilized features.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="impersonation-logs">
                      <AccordionTrigger>Impersonation Activity Logs</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Viewing Logs</h4>
                        <p>
                          The Impersonation Activity section at the bottom of the admin dashboard
                          shows all impersonation sessions with timestamps, admin email, and target user.
                        </p>
                        <h4>Audit Trail</h4>
                        <p>
                          All impersonation sessions are logged for security and compliance.
                          Logs include start and end times for each session.
                        </p>
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
                  <CardTitle>Developer Documentation</CardTitle>
                  <CardDescription>
                    Technical documentation for developers and integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="architecture">
                      <AccordionTrigger>Architecture Overview</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Tech Stack</h4>
                        <ul>
                          <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
                          <li><strong>Styling:</strong> Tailwind CSS + shadcn/ui components</li>
                          <li><strong>State Management:</strong> TanStack Query + React Context</li>
                          <li><strong>Backend:</strong> Lovable Cloud (Supabase)</li>
                          <li><strong>Database:</strong> PostgreSQL with Row Level Security</li>
                          <li><strong>Auth:</strong> Supabase Auth with email/password</li>
                        </ul>
                        <h4>Project Structure</h4>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── integrations/   # External service integrations
├── lib/            # Utility functions
├── data/           # Static data and configurations
└── types/          # TypeScript type definitions`}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edge-functions">
                      <AccordionTrigger>Edge Functions Reference</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Location</h4>
                        <p>Edge functions are located in <code>supabase/functions/</code></p>
                        
                        <h4>Key Functions</h4>
                        <ul>
                          <li><code>check-admin</code> - Validates admin/manager role</li>
                          <li><code>admin-list-users</code> - Fetches user list for admin panel</li>
                          <li><code>admin-manage-subscription</code> - Handles subscription changes</li>
                          <li><code>admin-impersonate-user</code> - Handles user impersonation</li>
                          <li><code>check-subscription</code> - Validates user subscription status</li>
                          <li><code>create-checkout</code> - Creates Stripe checkout sessions</li>
                          <li><code>generate-*</code> - AI content generation functions</li>
                          <li><code>task-ai-assist</code> - AI assistance for tasks</li>
                        </ul>

                        <h4>Creating New Functions</h4>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Your logic here
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})`}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="database">
                      <AccordionTrigger>Database Schema Overview</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Key Tables</h4>
                        <ul>
                          <li><code>projects</code> - User projects with settings and status</li>
                          <li><code>project_tasks</code> - Task progress for each project</li>
                          <li><code>funnels</code> - Funnel configuration and audience data</li>
                          <li><code>offers</code> - Offer stack for each project</li>
                          <li><code>content_planner</code> - Scheduled content items</li>
                          <li><code>profiles</code> - User profile information</li>
                          <li><code>user_roles</code> - Admin/manager role assignments</li>
                        </ul>

                        <h4>Row Level Security</h4>
                        <p>
                          All tables use RLS policies to ensure users can only access their own data.
                          The <code>user_roles</code> table uses a security definer function for role checks.
                        </p>

                        <h4>Important: Role Checking</h4>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`-- Use the has_role function for role checks
SELECT public.has_role(auth.uid(), 'admin');
SELECT public.has_role(auth.uid(), 'manager');`}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="authentication">
                      <AccordionTrigger>Authentication Flow</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Auth Context</h4>
                        <p>
                          Authentication is managed by <code>AuthContext</code> in 
                          <code>src/contexts/AuthContext.tsx</code>. It provides:
                        </p>
                        <ul>
                          <li><code>user</code> - Current authenticated user</li>
                          <li><code>session</code> - Current session with access token</li>
                          <li><code>signIn/signUp/signOut</code> - Auth methods</li>
                          <li><code>subscriptionStatus</code> - User subscription tier</li>
                          <li><code>isImpersonating</code> - Impersonation state</li>
                        </ul>

                        <h4>Protected Routes</h4>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`// Regular protected route
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

// Admin protected route
<ProtectedAdminRoute>
  <AdminPage />
</ProtectedAdminRoute>`}
                        </pre>

                        <h4>Admin Hook</h4>
                        <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`import { useAdmin } from "@/hooks/useAdmin";

const { isAdmin, isManager, hasAdminAccess, role, loading } = useAdmin();`}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="integrations">
                      <AccordionTrigger>External Integrations</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Stripe Integration</h4>
                        <p>
                          Stripe is used for subscription billing. Key components:
                        </p>
                        <ul>
                          <li><code>create-checkout</code> - Creates checkout sessions</li>
                          <li><code>customer-portal</code> - Customer billing portal</li>
                          <li><code>check-subscription</code> - Validates subscription status</li>
                        </ul>

                        <h4>Social Media Integrations</h4>
                        <ul>
                          <li><code>instagram-*</code> - Instagram API integration</li>
                          <li><code>pinterest-*</code> - Pinterest API integration</li>
                        </ul>

                        <h4>AI Services</h4>
                        <p>
                          AI features use Lovable AI which provides access to multiple models
                          without requiring API keys. See <code>generate-*</code> functions.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="secrets">
                      <AccordionTrigger>Environment Variables & Secrets</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Frontend Environment</h4>
                        <p>
                          The <code>.env</code> file is auto-generated and contains:
                        </p>
                        <ul>
                          <li><code>VITE_SUPABASE_URL</code> - Backend URL</li>
                          <li><code>VITE_SUPABASE_PUBLISHABLE_KEY</code> - Anon key</li>
                          <li><code>VITE_SUPABASE_PROJECT_ID</code> - Project ID</li>
                        </ul>

                        <h4>Edge Function Secrets</h4>
                        <p>
                          Secrets for edge functions are managed through the Lovable Cloud
                          secrets manager. Common secrets include:
                        </p>
                        <ul>
                          <li><code>STRIPE_SECRET_KEY</code> - Stripe API key</li>
                          <li><code>OPENAI_API_KEY</code> - OpenAI API key (if not using Lovable AI)</li>
                          <li><code>ELEVENLABS_API_KEY</code> - ElevenLabs TTS</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="troubleshooting">
                      <AccordionTrigger>Troubleshooting Guide</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <h4>Common Issues</h4>
                        
                        <p><strong>Edge function errors:</strong></p>
                        <ul>
                          <li>Check function logs in Lovable Cloud</li>
                          <li>Verify required secrets are configured</li>
                          <li>Check CORS headers are properly set</li>
                        </ul>

                        <p><strong>RLS policy issues:</strong></p>
                        <ul>
                          <li>Ensure user is authenticated</li>
                          <li>Check policy conditions match user context</li>
                          <li>Use <code>supabase.auth.getUser()</code> to verify auth state</li>
                        </ul>

                        <p><strong>Type errors:</strong></p>
                        <ul>
                          <li>Types are auto-generated from database schema</li>
                          <li>Run database migrations to update types</li>
                          <li>Check <code>src/integrations/supabase/types.ts</code></li>
                        </ul>
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
