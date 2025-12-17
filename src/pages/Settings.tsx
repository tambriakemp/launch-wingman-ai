import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Crown,
  Check,
  ArrowRight,
  Loader2,
  Settings2,
  Lock,
  FolderOpen,
  Trash2,
  Link2,
  Unlink,
} from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  account_name: string | null;
  created_at: string;
}

const Settings = () => {
  const { user, isSubscribed, subscriptionEnd, checkSubscription } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Profile state
  const [profile, setProfile] = useState<Profile>({ first_name: null, last_name: null });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete project state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Social connections state
  const [isConnectingPinterest, setIsConnectingPinterest] = useState(false);
  const [isDisconnectingPinterest, setIsDisconnectingPinterest] = useState(false);

  // Fetch projects for management
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["all-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  // Fetch social connections
  const { data: socialConnections = [], isLoading: isLoadingConnections, refetch: refetchConnections } = useQuery({
    queryKey: ["social-connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, platform, account_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SocialConnection[];
    },
    enabled: !!user,
  });

  const pinterestConnection = socialConnections.find(c => c.platform === 'pinterest');

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-selector"] });
      toast.success("Project deleted successfully");
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete project");
      console.error("Delete error:", error);
    },
  });

  // Fetch profile on mount (create if doesn't exist for legacy users)
  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
      } else if (error?.code === 'PGRST116') {
        // No profile exists for this user, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, first_name: null, last_name: null });
        
        if (insertError) {
          console.error('Failed to create profile:', insertError);
        }
      }
    };
    
    fetchOrCreateProfile();
  }, [user]);

  // Handle success/cancel redirects from Stripe and Pinterest
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success("Subscription successful! Welcome to Pro.");
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info("Checkout canceled.");
    }
    
    // Handle Pinterest OAuth callback
    if (searchParams.get('pinterest_connected') === 'true') {
      toast.success("Pinterest connected successfully!");
      refetchConnections();
    } else if (searchParams.get('pinterest_error')) {
      const error = searchParams.get('pinterest_error');
      toast.error(`Failed to connect Pinterest: ${error}`);
    }
  }, [searchParams, checkSubscription, refetchConnections]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('user_id', user.id);
    
    setIsSavingProfile(false);
    
    if (error) {
      toast.error("Failed to update profile");
    } else {
      setProfile({ first_name: firstName, last_name: lastName });
      toast.success("Profile updated successfully");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    
    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });
    
    if (signInError) {
      setIsChangingPassword(false);
      toast.error("Current password is incorrect");
      return;
    }
    
    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    setIsChangingPassword(false);
    
    if (updateError) {
      toast.error(updateError.message || "Failed to update password");
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error("Failed to open subscription management. Please try again.");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleConnectPinterest = async () => {
    if (!user) return;
    
    setIsConnectingPinterest(true);
    try {
      const { data, error } = await supabase.functions.invoke('pinterest-auth-start', {
        body: { 
          redirect_url: '/settings' 
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        // Open in new tab since OAuth can't run in iframes
        window.open(data.url, '_blank');
        toast.info("Pinterest login opened in a new tab. Complete the authorization there.");
        setIsConnectingPinterest(false);
      }
    } catch (error) {
      console.error('Pinterest connect error:', error);
      toast.error("Failed to connect Pinterest. Please try again.");
      setIsConnectingPinterest(false);
    }
  };

  const handleDisconnectPinterest = async () => {
    if (!user || !pinterestConnection) return;
    
    setIsDisconnectingPinterest(true);
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', pinterestConnection.id);
      
      if (error) throw error;
      
      toast.success("Pinterest disconnected");
      refetchConnections();
    } catch (error) {
      console.error('Pinterest disconnect error:', error);
      toast.error("Failed to disconnect Pinterest");
    } finally {
      setIsDisconnectingPinterest(false);
    }
  };

  const hasProfileChanges = firstName !== (profile.first_name || "") || lastName !== (profile.last_name || "");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600/50">Active</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-amber-600 border-amber-600/50">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ProjectLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences.
          </p>
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              {hasProfileChanges && (
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Manage your plan and billing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isSubscribed ? (
                /* Pro Plan - Active Subscription */
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">Pro Plan</span>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Unlimited projects included</p>
                      {subscriptionEnd && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Settings2 className="w-4 h-4" />
                    )}
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                /* Free Plan - Show Upgrade */
                <>
                  <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Free Plan</span>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                          Current
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">1 active project included</p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">Upgrade to Pro</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-foreground">$15</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[
                        "Unlimited projects",
                        "AI transformation generator",
                        "Advanced calendar",
                        "Priority support",
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      onClick={handleUpgrade}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Accounts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Connect social media accounts for content posting</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Pinterest Connection */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E60023]/10 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#E60023]" fill="currentColor">
                        <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.38.04-3.4l1.43-6.05s-.36-.73-.36-1.8c0-1.69.98-2.95 2.2-2.95 1.04 0 1.54.78 1.54 1.71 0 1.04-.66 2.6-1 4.05-.29 1.2.6 2.19 1.79 2.19 2.14 0 3.79-2.26 3.79-5.52 0-2.89-2.08-4.91-5.04-4.91-3.43 0-5.45 2.57-5.45 5.23 0 1.04.4 2.15.9 2.75a.36.36 0 0 1 .08.35l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.44-2.88-2.44-4.64 0-3.78 2.74-7.24 7.91-7.24 4.15 0 7.38 2.96 7.38 6.92 0 4.13-2.6 7.45-6.22 7.45-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Pinterest</p>
                      {pinterestConnection ? (
                        <p className="text-sm text-muted-foreground">
                          Connected as {pinterestConnection.account_name || 'Pinterest User'}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {pinterestConnection ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectPinterest}
                      disabled={isDisconnectingPinterest}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDisconnectingPinterest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="w-4 h-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleConnectPinterest}
                      disabled={isConnectingPinterest}
                    >
                      {isConnectingPinterest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Future platforms placeholder */}
                <p className="text-xs text-muted-foreground pt-2">
                  More platforms coming soon: Twitter/X, Instagram, Facebook
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Manage Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>Manage Projects</CardTitle>
                  <CardDescription>View and delete your projects</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(project.status)}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setProjectToDelete(project)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-info" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification preferences coming soon.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="outline" className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => toast.error("Account deletion is disabled.")}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Project Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        onConfirm={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete.id)}
        title="Delete Project"
        description={`This will permanently delete "${projectToDelete?.name}" and all its data including tasks, content, and launch events. This action cannot be undone.`}
        isDeleting={deleteProjectMutation.isPending}
      />
    </ProjectLayout>
  );
};

export default Settings;