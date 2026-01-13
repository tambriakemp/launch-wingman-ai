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
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { CheckInSettings } from "@/components/check-in";
import { ToneSettings } from "@/components/settings/ToneSettings";
import { AnnualReviewView } from "@/components/settings/AnnualReviewView";
import { EmailPreferencesSettings } from "@/components/settings/EmailPreferencesSettings";
import { AiUsageCard } from "@/components/settings/AiUsageCard";
import { ExportMyDataDialog } from "@/components/settings/ExportMyDataDialog";
import { DeleteMyAccountDialog } from "@/components/settings/DeleteMyAccountDialog";
import { useAnnualReview } from "@/hooks/useAnnualReview";
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
  Pen,
  BookOpen,
  RefreshCw,
  AlertTriangle,
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
  token_expires_at: string | null;
}

const Settings = () => {
  const { user, isSubscribed, subscriptionEnd, checkSubscription } = useAuth();
  const { hasAdminAccess, tier } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
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
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const [isConnectingFacebook, setIsConnectingFacebook] = useState(false);
  const [isDisconnectingFacebook, setIsDisconnectingFacebook] = useState(false);
  const [isConnectingThreads, setIsConnectingThreads] = useState(false);
  const [isDisconnectingThreads, setIsDisconnectingThreads] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Annual Review state
  const [showAnnualReview, setShowAnnualReview] = useState(false);
  const { data: annualReviewData } = useAnnualReview();

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
        .select("id, platform, account_name, created_at, token_expires_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SocialConnection[];
    },
    enabled: !!user,
  });

  // State for refreshing tokens
  const [isRefreshingInstagram, setIsRefreshingInstagram] = useState(false);

  const pinterestConnection = socialConnections.find(c => c.platform === 'pinterest');
  const instagramConnection = socialConnections.find(c => c.platform === 'instagram');
  const facebookConnection = socialConnections.find(c => c.platform === 'facebook');
  const threadsConnection = socialConnections.find(c => c.platform === 'threads');

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
    
    // Handle Instagram OAuth callback
    if (searchParams.get('instagram_connected') === 'true') {
      toast.success("Instagram connected successfully!");
      refetchConnections();
    } else if (searchParams.get('instagram_error')) {
      const error = searchParams.get('instagram_error');
      toast.error(`Failed to connect Instagram: ${error}`);
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

  const handleConnectInstagram = async () => {
    if (!user) return;
    
    setIsConnectingInstagram(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-auth-start', {
        body: { 
          redirect_url: '/settings' 
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        // Open in new tab since OAuth can't run in iframes
        window.open(data.url, '_blank');
        toast.info("Instagram login opened in a new tab. Complete the authorization there.");
        setIsConnectingInstagram(false);
      }
    } catch (error) {
      console.error('Instagram connect error:', error);
      toast.error("Failed to connect Instagram. Please try again.");
      setIsConnectingInstagram(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!user || !instagramConnection) return;
    
    setIsDisconnectingInstagram(true);
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', instagramConnection.id);
      
      if (error) throw error;
      
      toast.success("Instagram disconnected");
      refetchConnections();
    } catch (error) {
      console.error('Instagram disconnect error:', error);
      toast.error("Failed to disconnect Instagram");
    } finally {
      setIsDisconnectingInstagram(false);
    }
  };

  const handleConnectFacebook = async () => {
    if (!user) return;
    
    setIsConnectingFacebook(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-auth-start', {
        body: { 
          redirect_url: '/settings' 
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.info("Facebook login opened in a new tab. Complete the authorization there.");
        setIsConnectingFacebook(false);
      }
    } catch (error) {
      console.error('Facebook connect error:', error);
      toast.error("Failed to connect Facebook. Please try again.");
      setIsConnectingFacebook(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!user || !facebookConnection) return;
    
    setIsDisconnectingFacebook(true);
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', facebookConnection.id);
      
      if (error) throw error;
      
      toast.success("Facebook disconnected");
      refetchConnections();
    } catch (error) {
      console.error('Facebook disconnect error:', error);
      toast.error("Failed to disconnect Facebook");
    } finally {
      setIsDisconnectingFacebook(false);
    }
  };

  const handleConnectThreads = async () => {
    if (!user) return;
    
    setIsConnectingThreads(true);
    try {
      const { data, error } = await supabase.functions.invoke('threads-auth-start', {
        body: { 
          redirect_url: '/settings' 
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.info("Threads login opened in a new tab. Complete the authorization there.");
        setIsConnectingThreads(false);
      }
    } catch (error) {
      console.error('Threads connect error:', error);
      toast.error("Failed to connect Threads. Please try again.");
      setIsConnectingThreads(false);
    }
  };

  const handleDisconnectThreads = async () => {
    if (!user || !threadsConnection) return;
    
    setIsDisconnectingThreads(true);
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', threadsConnection.id);
      
      if (error) throw error;
      
      toast.success("Threads disconnected");
      refetchConnections();
    } catch (error) {
      console.error('Threads disconnect error:', error);
      toast.error("Failed to disconnect Threads");
    } finally {
      setIsDisconnectingThreads(false);
    }
  };

  const handleRefreshInstagram = async () => {
    if (!user || !instagramConnection) return;
    
    setIsRefreshingInstagram(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in again");
        return;
      }
      
      const response = await supabase.functions.invoke('instagram-refresh-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      
      if (data.needs_reconnect) {
        toast.error(data.message || "Token expired. Please reconnect your account.");
        return;
      }
      
      toast.success("Instagram connection refreshed!");
      refetchConnections();
    } catch (error) {
      console.error('Instagram refresh error:', error);
      toast.error("Failed to refresh Instagram connection. Try reconnecting.");
    } finally {
      setIsRefreshingInstagram(false);
    }
  };

  // Helper to check Instagram token status
  const getInstagramTokenStatus = () => {
    if (!instagramConnection?.token_expires_at) return null;
    
    const expiresAt = new Date(instagramConnection.token_expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', message: 'Expired', daysUntilExpiry };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring_soon', message: `Expires in ${daysUntilExpiry} days`, daysUntilExpiry };
    } else {
      return { status: 'valid', message: `Expires in ${daysUntilExpiry} days`, daysUntilExpiry };
    }
  };

  const instagramTokenStatus = getInstagramTokenStatus();

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

  // If showing annual review, render that instead
  if (showAnnualReview) {
    return (
      <ProjectLayout>
        <AnnualReviewView onClose={() => setShowAnnualReview(false)} />
      </ProjectLayout>
    );
  }

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
              {hasFullAccess ? (
                /* Pro or Admin Plan - Full Access */
                <div className="space-y-4">
                  <div className={`flex items-start justify-between p-4 rounded-lg ${hasAdminAccess ? 'bg-purple-500/10 border-2 border-purple-500/20' : 'bg-primary/5 border-2 border-primary/20'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className={`w-5 h-5 ${hasAdminAccess ? 'text-purple-500' : 'text-primary'}`} />
                        <span className="font-semibold text-foreground">
                          {hasAdminAccess ? 'Staff Access' : 'Pro Plan'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${hasAdminAccess ? 'bg-purple-500/20 text-purple-600' : 'bg-primary/20 text-primary'}`}>
                          {hasAdminAccess ? 'Full Access' : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hasAdminAccess ? 'Full access to all features' : 'Unlimited projects included'}
                      </p>
                      {!hasAdminAccess && subscriptionEnd && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!hasAdminAccess && (
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
                  )}
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
                      <span className="text-3xl font-bold text-foreground">$25</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[
                        "Unlimited projects",
                        "Unlimited AI content ideas",
                        "Unlimited saved drafts",
                        "Full sales copy builder",
                        "Relaunch mode",
                        "Insights & analytics",
                        "Export phase snapshot",
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
                  ) : isSubscribed ? (
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
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5 text-primary" />
                      Pro
                    </Button>
                  )}
                </div>

                {/* Instagram Connection */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Instagram</p>
                      {instagramConnection ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-muted-foreground">
                            Connected as @{instagramConnection.account_name || 'Instagram User'}
                          </p>
                          {instagramTokenStatus && (
                            <p className={`text-xs flex items-center gap-1 ${
                              instagramTokenStatus.status === 'expired' 
                                ? 'text-destructive' 
                                : instagramTokenStatus.status === 'expiring_soon'
                                ? 'text-yellow-600 dark:text-yellow-500'
                                : 'text-muted-foreground'
                            }`}>
                              {instagramTokenStatus.status === 'expired' && (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {instagramTokenStatus.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {instagramConnection ? (
                    <div className="flex items-center gap-2">
                      {/* Show Refresh button if token is expiring soon or Reconnect if expired */}
                      {instagramTokenStatus?.status === 'expired' ? (
                        <Button
                          size="sm"
                          onClick={handleConnectInstagram}
                          disabled={isConnectingInstagram}
                        >
                          {isConnectingInstagram ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="w-4 h-4 mr-1" />
                              Reconnect
                            </>
                          )}
                        </Button>
                      ) : instagramTokenStatus?.status === 'expiring_soon' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshInstagram}
                          disabled={isRefreshingInstagram}
                        >
                          {isRefreshingInstagram ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Refresh
                            </>
                          )}
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectInstagram}
                        disabled={isDisconnectingInstagram}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDisconnectingInstagram ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="w-4 h-4 mr-1" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    </div>
                  ) : isSubscribed ? (
                    <Button
                      size="sm"
                      onClick={handleConnectInstagram}
                      disabled={isConnectingInstagram}
                    >
                      {isConnectingInstagram ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5 text-primary" />
                      Pro
                    </Button>
                  )}
                </div>

                {/* Facebook Connection */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Facebook Page</p>
                      {facebookConnection ? (
                        <p className="text-sm text-muted-foreground">
                          Connected: {facebookConnection.account_name || 'Your Page'}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {facebookConnection ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectFacebook}
                      disabled={isDisconnectingFacebook}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDisconnectingFacebook ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="w-4 h-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : isSubscribed ? (
                    <Button
                      size="sm"
                      onClick={handleConnectFacebook}
                      disabled={isConnectingFacebook}
                    >
                      {isConnectingFacebook ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5 text-primary" />
                      Pro
                    </Button>
                  )}
                </div>

                {/* Threads Connection */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                      <svg viewBox="0 0 192 192" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.68 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.014 16.94c23.001.173 40.574 7.576 52.232 22.005 5.565 6.882 9.746 15.087 12.508 24.382l15.015-4.065c-3.271-11.017-8.327-20.907-15.171-29.362C146.97 11.794 125.597 3.146 97.064 2.94h-.085c-28.464.207-49.72 8.87-63.196 25.762-12.73 15.962-19.265 38.05-19.482 65.704v1.187c.217 27.654 6.752 49.742 19.482 65.704 13.475 16.892 34.732 25.555 63.196 25.763h.085c24.346-.163 41.608-6.497 55.918-20.531 18.79-18.418 18.362-41.087 12.118-55.65-4.481-10.45-12.896-18.99-24.563-25.091Zm-64.768 44.538c-10.455.57-21.327-4.108-21.872-14.329-.408-7.65 5.41-16.186 25.16-17.323 2.2-.127 4.35-.19 6.451-.19 6.274 0 12.15.513 17.519 1.493-1.994 24.134-15.667 29.764-27.258 30.349Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Threads</p>
                      {threadsConnection ? (
                        <p className="text-sm text-muted-foreground">
                          Connected: @{threadsConnection.account_name || 'Your Account'}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {threadsConnection ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectThreads}
                      disabled={isDisconnectingThreads}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDisconnectingThreads ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="w-4 h-4 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : isSubscribed ? (
                    <Button
                      size="sm"
                      onClick={handleConnectThreads}
                      disabled={isConnectingThreads}
                    >
                      {isConnectingThreads ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5 text-primary" />
                      Pro
                    </Button>
                  )}
                </div>

                {/* Future platforms placeholder */}
                <p className="text-xs text-muted-foreground pt-2">
                  More platforms coming soon: TikTok, LinkedIn
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

        {/* AI Writing Style Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/50 rounded-xl flex items-center justify-center">
                  <Pen className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>AI Writing Style</CardTitle>
                  <CardDescription>Customize how AI-generated content sounds</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ToneSettings />
            </CardContent>
          </Card>
        </motion.div>

        {/* Check-In Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Check-In Preferences</CardTitle>
                  <CardDescription>Control how often you're invited to reflect</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CheckInSettings />
            </CardContent>
          </Card>
        </motion.div>

        {/* Annual Review Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.29 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>Annual Review</CardTitle>
                  <CardDescription>A moment to reflect on your journey</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This isn't a performance review — just a moment to reflect.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowAnnualReview(true)}
                disabled={!annualReviewData?.isEligible}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {annualReviewData?.isEligible
                  ? "View Your Year in Review"
                  : `Complete ${2 - (annualReviewData?.totalCompleted || 0)} more projects to unlock`}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <EmailPreferencesSettings />
        </motion.div>

        {/* AI Usage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <AiUsageCard />
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
            <CardContent className="space-y-6">
              {/* Export My Data */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Export My Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your data including projects, content, and settings.
                </p>
                <ExportMyDataDialog />
              </div>

              <Separator />

              {/* Delete Account */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <DeleteMyAccountDialog />
              </div>
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

      {/* Upgrade Dialog for Pro Features */}
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
        feature="Social Media Connections"
      />
    </ProjectLayout>
  );
};

export default Settings;