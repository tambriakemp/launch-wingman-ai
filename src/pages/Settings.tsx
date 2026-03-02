import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTikTokEnvironment } from "@/contexts/TikTokEnvironmentContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { CheckInSettings } from "@/components/check-in";
import { ToneSettings } from "@/components/settings/ToneSettings";
import { AnnualReviewView } from "@/components/settings/AnnualReviewView";
import { EmailPreferencesSettings } from "@/components/settings/EmailPreferencesSettings";
import { AiSettingsCard } from "@/components/settings/AiSettingsCard";
import { ExportMyDataDialog } from "@/components/settings/ExportMyDataDialog";
import { DeleteMyAccountDialog } from "@/components/settings/DeleteMyAccountDialog";
import { FacebookPageSelector } from "@/components/settings/FacebookPageSelector";
import { useAnnualReview } from "@/hooks/useAnnualReview";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { usePinterestSandboxToken } from "@/hooks/usePinterestSandboxToken";
import { useIsMobile } from "@/hooks/use-mobile";
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
  FlaskConical,
  Zap,
  Package,
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
  avatar_url: string | null;
  created_at: string;
  token_expires_at: string | null;
}

const SETTINGS_TABS = [
  { value: "profile", label: "Profile", icon: User },
  { value: "billing", label: "Billing", icon: CreditCard },
  { value: "integrations", label: "Integrations", icon: Link2 },
  { value: "projects", label: "Projects", icon: FolderOpen },
  { value: "notifications", label: "Notifications", icon: Bell },
] as const;

const Settings = () => {
  const { user, isSubscribed, subscriptionEnd, checkSubscription } = useAuth();
  const { environment: tiktokEnvironment } = useTikTokEnvironment();
  const { environment: pinterestEnvironment } = usePinterestEnvironmentSetting();
  const { token: pinterestSandboxToken, saveToken: savePinterestSandboxToken, isSaving: isSavingPinterestToken } = usePinterestSandboxToken();
  const [sandboxTokenInput, setSandboxTokenInput] = useState("");
  const { hasAdminAccess, tier } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
  const isMobile = useIsMobile();

  // Platforms that are gated (not approved for production yet)
  // Only admins can access these
  const GATED_PLATFORMS = ['instagram', 'facebook', 'threads', 'tiktok'];

  // Helper to check if a platform is accessible
  const isPlatformAccessible = (platform: string): boolean => {
    // Admins have full access to all platforms
    if (hasAdminAccess) return true;
    // Non-admins only have access to non-gated platforms (pinterest)
    return !GATED_PLATFORMS.includes(platform);
  };
  const navigate = useNavigate();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Determine active tab from URL params
  const tabParam = searchParams.get("tab");
  const defaultTab = SETTINGS_TABS.some(t => t.value === tabParam) ? tabParam! : "profile";
  
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
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [isDisconnectingTikTok, setIsDisconnectingTikTok] = useState(false);
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
        .select("id, platform, account_name, avatar_url, created_at, token_expires_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SocialConnection[];
    },
    enabled: !!user,
  });

  // State for refreshing tokens
  const [isRefreshingInstagram, setIsRefreshingInstagram] = useState(false);

  const pinterestConnection = socialConnections.find(c => c.platform === 'pinterest');
  const pinterestSandboxConnection = socialConnections.find(c => c.platform === 'pinterest_sandbox');
  const instagramConnection = socialConnections.find(c => c.platform === 'instagram');
  const facebookConnection = socialConnections.find(c => c.platform === 'facebook');
  const threadsConnection = socialConnections.find(c => c.platform === 'threads');
  const tiktokConnection = socialConnections.find(c => c.platform === 'tiktok');
  const tiktokSandboxConnection = socialConnections.find(c => c.platform === 'tiktok_sandbox');

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

  // Handle success/cancel redirects from Stripe, Pinterest, and credit purchases
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success("Subscription successful! Welcome to Pro.");
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info("Checkout canceled.");
    }

    // Handle credit purchase success
    const sessionId = searchParams.get('session_id');
    if (searchParams.get('credits_success') === 'true' && sessionId) {
      const fulfillCredits = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('fulfill-video-credits', {
            body: { sessionId },
          });
          if (error) throw error;
          if (data?.alreadyFulfilled) {
            toast.info("Credits already added to your account.");
          } else {
            toast.success(`${data?.credits || ''} video credits added to your account!`);
          }
          queryClient.invalidateQueries({ queryKey: ["video-credits"] });
        } catch (err: any) {
          console.error("Failed to fulfill credits:", err);
          toast.error("Failed to add credits. Please contact support.");
        }
      };
      fulfillCredits();
    } else if (searchParams.get('credits_canceled') === 'true') {
      toast.info("Credit purchase canceled.");
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
    
    // Handle TikTok OAuth callback
    if (searchParams.get('tiktok_connected') === 'true') {
      toast.success("TikTok connected successfully!");
      refetchConnections();
    } else if (searchParams.get('error') && searchParams.get('error')?.includes('tiktok')) {
      const error = searchParams.get('error');
      toast.error(`Failed to connect TikTok: ${error}`);
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

  const handleUpgrade = () => {
    navigate("/checkout?upgrade=true");
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
          redirect_url: '/settings',
          environment: "production"
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

  const handleConnectTikTok = async () => {
    if (!user) return;
    
    setIsConnectingTikTok(true);
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-auth-start', {
        body: { 
          redirect_url: new URL('/settings', window.location.origin).toString(),
          environment: tiktokEnvironment
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        // Open in same tab for seamless return to Settings
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('TikTok connect error:', error);
      toast.error("Failed to connect TikTok. Please try again.");
      setIsConnectingTikTok(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    const platform = tiktokEnvironment === "sandbox" ? "tiktok_sandbox" : "tiktok";
    const connection = tiktokEnvironment === "sandbox" ? tiktokSandboxConnection : tiktokConnection;
    if (!user || !connection) return;
    
    setIsDisconnectingTikTok(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in again");
        return;
      }

      // Call the revoke endpoint to properly revoke token with TikTok
      const { data, error } = await supabase.functions.invoke('tiktok-revoke-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { platform }
      });
      
      if (error) throw error;
      
      toast.success(`TikTok ${tiktokEnvironment === "sandbox" ? "Sandbox " : ""}disconnected`);
      refetchConnections();
    } catch (error) {
      console.error('TikTok disconnect error:', error);
      toast.error("Failed to disconnect TikTok");
    } finally {
      setIsDisconnectingTikTok(false);
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

  // Generic helper to check token status for any connection
  // hasAutoRefresh = true for platforms that auto-refresh tokens (Pinterest, TikTok)
  // For those platforms, only show warning if truly expired (auto-refresh failed)
  const getTokenStatus = (connection: SocialConnection | undefined, hasAutoRefresh: boolean = false) => {
    if (!connection?.token_expires_at) return null;
    
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const msUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = msUntilExpiry / (1000 * 60 * 60);
    const daysUntilExpiry = Math.floor(hoursUntilExpiry / 24);
    
    // For platforms with auto-refresh, only show warning if actually expired
    if (hasAutoRefresh) {
      if (msUntilExpiry < 0) {
        return { status: 'expired' as const, message: 'Connection issue - please reconnect', daysUntilExpiry: -1 };
      }
      // Otherwise, auto-refresh is working - don't show any warning
      return null;
    }
    
    // For platforms without auto-refresh, show expiration warnings
    if (msUntilExpiry < 0) {
      return { status: 'expired' as const, message: 'Expired', daysUntilExpiry };
    } else if (hoursUntilExpiry < 24) {
      // Less than 24 hours - show hours instead of "0 days"
      const hours = Math.ceil(hoursUntilExpiry);
      return { status: 'expiring_soon' as const, message: `Expires in ${hours}h`, daysUntilExpiry: 0 };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring_soon' as const, message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`, daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'valid' as const, message: `Expires in ${daysUntilExpiry} days`, daysUntilExpiry };
    } else {
      return { status: 'valid' as const, message: null, daysUntilExpiry }; // Don't show if > 30 days
    }
  };

  // Instagram - long-lived token, no auto-refresh in our system
  const instagramTokenStatus = getTokenStatus(instagramConnection, false);
  // Pinterest - HAS auto-refresh via refresh_token
  const pinterestTokenStatus = getTokenStatus(pinterestConnection, true);
  const pinterestSandboxTokenStatus = getTokenStatus(pinterestSandboxConnection, true);
  // Facebook - long-lived token (60 days), no auto-refresh
  const facebookTokenStatus = getTokenStatus(facebookConnection, false);
  // Threads - short-lived, needs manual reconnection
  const threadsTokenStatus = getTokenStatus(threadsConnection, false);
  // TikTok - HAS auto-refresh via refresh_token
  const tiktokTokenStatus = getTokenStatus(tiktokConnection, true);
  const tiktokSandboxTokenStatus = getTokenStatus(tiktokSandboxConnection, true);

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
      <div className="max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences.
          </p>
        </motion.div>

        <Tabs defaultValue={defaultTab} orientation={isMobile ? "horizontal" : "vertical"} className="flex flex-col md:flex-row gap-6">
          {/* Tab Navigation */}
          <TabsList className={`${
            isMobile 
              ? "flex flex-row overflow-x-auto w-full h-auto p-1 shrink-0" 
              : "flex flex-col h-fit w-[200px] shrink-0 sticky top-4 p-1"
          } bg-muted/50 rounded-xl`}>
            {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={`${
                  isMobile 
                    ? "flex-1 min-w-fit px-3 py-2" 
                    : "w-full justify-start gap-2 px-3 py-2.5"
                } data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg text-sm`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={isMobile ? "hidden sm:inline" : ""}>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-6">
              {/* Account Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                        <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter your last name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                    {hasProfileChanges && (
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : "Save Profile"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Change Password Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
                      <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                      </div>
                    </div>
                    <Button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
                      {isChangingPassword ? (<><Loader2 className="w-4 h-4 animate-spin" />Updating...</>) : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Writing Style Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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

              {/* Danger Zone Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Export My Data</h4>
                      <p className="text-sm text-muted-foreground">Download a copy of all your data including projects, content, and settings.</p>
                      <ExportMyDataDialog />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Delete Account
                      </h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                      <DeleteMyAccountDialog />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-0 space-y-6">
              {/* Subscription Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                          <Button variant="outline" onClick={handleManageSubscription} disabled={isOpeningPortal}>
                            {isOpeningPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                            Manage Subscription
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">Free Plan</span>
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">Current</span>
                            </div>
                            <p className="text-sm text-muted-foreground">1 active project included</p>
                          </div>
                        </div>
                        <Separator className="my-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border-2 border-green-500/20 rounded-lg bg-green-500/5">
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-foreground">Content Vault</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-bold text-foreground">$7</span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Access exclusive templates, swipe files, and resources.</p>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate("/checkout?tier=content_vault")}>
                              Get Vault Access <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                            <div className="flex items-center gap-2 mb-3">
                              <Crown className="w-5 h-5 text-primary" />
                              <span className="font-semibold text-foreground">Pro Plan</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                              <span className="text-3xl font-bold text-foreground">$25</span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Full access to all features including Content Vault.</p>
                            <Button className="w-full" onClick={() => navigate("/checkout?tier=pro")}>
                              Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Settings Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <AiSettingsCard />
              </motion.div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="mt-0 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                      {/* Pinterest Connection - Always Production */}
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          {pinterestConnection?.avatar_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-[#E60023]/20">
                              <img 
                                src={pinterestConnection.avatar_url} 
                                alt={pinterestConnection.account_name || 'Pinterest User'} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.classList.add('bg-[#E60023]/10', 'flex', 'items-center', 'justify-center');
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#E60023]/10 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#E60023]" fill="currentColor">
                                <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.38.04-3.4l1.43-6.05s-.36-.73-.36-1.8c0-1.69.98-2.95 2.2-2.95 1.04 0 1.54.78 1.54 1.71 0 1.04-.66 2.6-1 4.05-.29 1.2.6 2.19 1.79 2.19 2.14 0 3.79-2.26 3.79-5.52 0-2.89-2.08-4.91-5.04-4.91-3.43 0-5.45 2.57-5.45 5.23 0 1.04.4 2.15.9 2.75a.36.36 0 0 1 .08.35l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.44-2.88-2.44-4.64 0-3.78 2.74-7.24 7.91-7.24 4.15 0 7.38 2.96 7.38 6.92 0 4.13-2.6 7.45-6.22 7.45-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">Pinterest</p>
                              {hasAdminAccess && (
                                <Badge variant={pinterestEnvironment === "sandbox" ? "default" : "secondary"} className="text-xs">
                                  {pinterestEnvironment === "sandbox" ? "Sandbox" : "Production"}
                                </Badge>
                              )}
                            </div>
                            {pinterestConnection ? (
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm text-muted-foreground">Connected as @{pinterestConnection.account_name || 'Pinterest User'}</p>
                                {pinterestTokenStatus?.message && (
                                  <p className={`text-xs flex items-center gap-1 ${
                                    pinterestTokenStatus.status === 'expired' ? 'text-destructive' 
                                    : pinterestTokenStatus.status === 'expiring_soon' ? 'text-yellow-600 dark:text-yellow-500'
                                    : 'text-muted-foreground'
                                  }`}>
                                    {pinterestTokenStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                    {pinterestTokenStatus.message}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not connected</p>
                            )}
                          </div>
                        </div>
                        {pinterestConnection ? (
                          <Button variant="outline" size="sm" onClick={handleDisconnectPinterest} disabled={isDisconnectingPinterest} className="text-destructive hover:text-destructive">
                            {isDisconnectingPinterest ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                          </Button>
                        ) : isSubscribed ? (
                          <Button size="sm" onClick={handleConnectPinterest} disabled={isConnectingPinterest}>
                            {isConnectingPinterest ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Connect</>}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setShowUpgradeDialog(true)} className="gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-primary" />Pro
                          </Button>
                        )}
                      </div>

                      {/* Pinterest Sandbox Token Input */}
                      {hasAdminAccess && pinterestEnvironment === "sandbox" && (
                        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Pinterest Sandbox Token</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            In sandbox mode, you need a token from the{" "}
                            <a href="https://developers.pinterest.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                              Pinterest Developer Portal
                            </a>. Go to your app → Generate Token.
                          </p>
                          <div className="flex gap-2">
                            <Input type="password" placeholder="Enter your sandbox token" value={sandboxTokenInput || pinterestSandboxToken} onChange={(e) => setSandboxTokenInput(e.target.value)} className="flex-1 font-mono text-sm" />
                            <Button size="sm" onClick={() => savePinterestSandboxToken(sandboxTokenInput || pinterestSandboxToken)} disabled={isSavingPinterestToken || (!sandboxTokenInput && !pinterestSandboxToken)}>
                              {isSavingPinterestToken ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </Button>
                          </div>
                          {pinterestSandboxToken && (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" />Sandbox token saved
                            </p>
                          )}
                        </div>
                      )}

                      {/* Instagram Connection */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${!isPlatformAccessible('instagram') ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          {instagramConnection?.avatar_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-[#E4405F]/20">
                              <img src={instagramConnection.avatar_url} alt={instagramConnection.account_name || 'Instagram User'} className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-[#833AB4]', 'via-[#E4405F]', 'to-[#FCAF45]', 'flex', 'items-center', 'justify-center'); }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45] flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">Instagram</p>
                              {!isPlatformAccessible('instagram') && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                            </div>
                            {isPlatformAccessible('instagram') ? (
                              instagramConnection ? (
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-sm text-muted-foreground">Connected as @{instagramConnection.account_name || 'Instagram User'}</p>
                                  {instagramTokenStatus && (
                                    <p className={`text-xs flex items-center gap-1 ${instagramTokenStatus.status === 'expired' ? 'text-destructive' : instagramTokenStatus.status === 'expiring_soon' ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
                                      {instagramTokenStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                      {instagramTokenStatus.message}
                                    </p>
                                  )}
                                </div>
                              ) : <p className="text-sm text-muted-foreground">Not connected</p>
                            ) : <p className="text-sm text-muted-foreground">Not connected</p>}
                          </div>
                        </div>
                        {isPlatformAccessible('instagram') ? (
                          instagramConnection ? (
                            <div className="flex items-center gap-2">
                              {instagramTokenStatus?.status === 'expired' ? (
                                <Button size="sm" onClick={handleConnectInstagram} disabled={isConnectingInstagram}>
                                  {isConnectingInstagram ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Reconnect</>}
                                </Button>
                              ) : instagramTokenStatus?.status === 'expiring_soon' ? (
                                <Button variant="outline" size="sm" onClick={handleRefreshInstagram} disabled={isRefreshingInstagram}>
                                  {isRefreshingInstagram ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1" />Refresh</>}
                                </Button>
                              ) : null}
                              <Button variant="outline" size="sm" onClick={handleDisconnectInstagram} disabled={isDisconnectingInstagram} className="text-destructive hover:text-destructive">
                                {isDisconnectingInstagram ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                              </Button>
                            </div>
                          ) : isSubscribed ? (
                            <Button size="sm" onClick={handleConnectInstagram} disabled={isConnectingInstagram}>
                              {isConnectingInstagram ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Connect</>}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setShowUpgradeDialog(true)} className="gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-primary" />Pro
                            </Button>
                          )
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                        )}
                      </div>

                      {/* Facebook Connection */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${!isPlatformAccessible('facebook') ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          {facebookConnection?.avatar_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden ring-2 ring-[#1877F2]/20">
                              <img src={facebookConnection.avatar_url} alt={facebookConnection.account_name || 'Facebook Page'} className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-[#1877F2]', 'flex', 'items-center', 'justify-center'); }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">Facebook</p>
                              {!isPlatformAccessible('facebook') && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                            </div>
                            {isPlatformAccessible('facebook') ? (
                              facebookConnection ? (
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-sm text-muted-foreground">Connected: {facebookConnection.account_name || 'Facebook Page'}</p>
                                  {facebookTokenStatus?.message && (
                                    <p className={`text-xs flex items-center gap-1 ${facebookTokenStatus.status === 'expired' ? 'text-destructive' : facebookTokenStatus.status === 'expiring_soon' ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
                                      {facebookTokenStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                      {facebookTokenStatus.message}
                                    </p>
                                  )}
                                </div>
                              ) : <p className="text-sm text-muted-foreground">Not connected</p>
                            ) : <p className="text-sm text-muted-foreground">Not connected</p>}
                          </div>
                        </div>
                        {isPlatformAccessible('facebook') ? (
                          facebookConnection ? (
                            <div className="flex items-center gap-2">
                              <FacebookPageSelector 
                                currentPageName={facebookConnection?.account_name || null}
                                currentPageId={null}
                                onPageChange={() => refetchConnections()}
                              />
                              <Button variant="outline" size="sm" onClick={handleDisconnectFacebook} disabled={isDisconnectingFacebook} className="text-destructive hover:text-destructive">
                                {isDisconnectingFacebook ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                              </Button>
                            </div>
                          ) : isSubscribed ? (
                            <Button size="sm" onClick={handleConnectFacebook} disabled={isConnectingFacebook}>
                              {isConnectingFacebook ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Connect</>}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setShowUpgradeDialog(true)} className="gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-primary" />Pro
                            </Button>
                          )
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                        )}
                      </div>

                      {/* Threads Connection */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${!isPlatformAccessible('threads') ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white dark:text-black" fill="currentColor">
                              <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.024.842-.7 2.005-1.122 3.455-1.26.958-.09 1.96-.034 2.987.16-.062-1.081-.345-1.89-.864-2.406-.6-.597-1.526-.893-2.756-.882l-.075.002c-1.14.03-2.099.4-2.772 1.075l-1.39-1.49C7.836 5.138 9.26 4.588 10.934 4.54l.11-.002c1.81-.03 3.28.483 4.369 1.527.96.92 1.527 2.2 1.69 3.803.493.168.95.38 1.365.64 1.09.687 1.926 1.636 2.42 2.745.762 1.707.842 4.532-1.347 6.68-1.872 1.836-4.152 2.63-7.394 2.066z"/>
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">Threads</p>
                              {!isPlatformAccessible('threads') && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                            </div>
                            {isPlatformAccessible('threads') ? (
                              threadsConnection ? (
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-sm text-muted-foreground">Connected as @{threadsConnection.account_name || 'Threads User'}</p>
                                  {threadsTokenStatus?.message && (
                                    <p className={`text-xs flex items-center gap-1 ${threadsTokenStatus.status === 'expired' ? 'text-destructive' : threadsTokenStatus.status === 'expiring_soon' ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
                                      {threadsTokenStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                      {threadsTokenStatus.message}
                                    </p>
                                  )}
                                </div>
                              ) : <p className="text-sm text-muted-foreground">Not connected</p>
                            ) : <p className="text-sm text-muted-foreground">Not connected</p>}
                          </div>
                        </div>
                        {isPlatformAccessible('threads') ? (
                          threadsConnection ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectThreads} disabled={isDisconnectingThreads} className="text-destructive hover:text-destructive">
                              {isDisconnectingThreads ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                            </Button>
                          ) : isSubscribed ? (
                            <Button size="sm" onClick={handleConnectThreads} disabled={isConnectingThreads}>
                              {isConnectingThreads ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Connect</>}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setShowUpgradeDialog(true)} className="gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-primary" />Pro
                            </Button>
                          )
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                        )}
                      </div>

                      {/* TikTok Connection */}
                      {(() => {
                        const isSandbox = tiktokEnvironment === "sandbox";
                        const activeConnection = isSandbox ? tiktokSandboxConnection : tiktokConnection;
                        const platformAccessible = isPlatformAccessible('tiktok');
                        
                        return (
                          <div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${isSandbox ? 'border-dashed' : ''} ${!platformAccessible ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-3">
                              {activeConnection?.avatar_url ? (
                                <div className={`w-10 h-10 rounded-lg overflow-hidden ring-2 ${isSandbox ? 'ring-gray-400/20' : 'ring-black/20 dark:ring-white/20'}`}>
                                  <img src={activeConnection.avatar_url} alt={activeConnection.account_name || 'TikTok User'} className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add(isSandbox ? 'bg-gray-700' : 'bg-black', 'flex', 'items-center', 'justify-center'); }}
                                  />
                                </div>
                              ) : (
                                <div className={`w-10 h-10 rounded-lg ${isSandbox ? 'bg-gray-700' : 'bg-black'} flex items-center justify-center`}>
                                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                  </svg>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">TikTok</p>
                                  {!platformAccessible && <Badge variant="secondary" className="text-xs">Coming Soon</Badge>}
                                  {platformAccessible && hasAdminAccess && (
                                    <Badge variant={isSandbox ? "secondary" : "default"} className="text-xs flex items-center gap-1">
                                      {isSandbox ? <><FlaskConical className="w-3 h-3" />Sandbox</> : <><Zap className="w-3 h-3" />Production</>}
                                    </Badge>
                                  )}
                                </div>
                                {platformAccessible ? (
                                  activeConnection ? (
                                    <div className="flex flex-col gap-0.5">
                                      <p className="text-sm text-muted-foreground">Connected: @{activeConnection.account_name || (isSandbox ? 'Test Account' : 'Your Account')}</p>
                                      {(() => {
                                        const tokenStatus = isSandbox ? tiktokSandboxTokenStatus : tiktokTokenStatus;
                                        return tokenStatus?.message ? (
                                          <p className={`text-xs flex items-center gap-1 ${tokenStatus.status === 'expired' ? 'text-destructive' : tokenStatus.status === 'expiring_soon' ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
                                            {tokenStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                            {tokenStatus.message}
                                          </p>
                                        ) : null;
                                      })()}
                                    </div>
                                  ) : <p className="text-sm text-muted-foreground">{isSandbox ? 'For testing only' : 'Not connected (video only)'}</p>
                                ) : <p className="text-sm text-muted-foreground">Not connected</p>}
                              </div>
                            </div>
                            {platformAccessible ? (
                              activeConnection ? (
                                <Button variant="outline" size="sm" onClick={handleDisconnectTikTok} disabled={isDisconnectingTikTok} className="text-destructive hover:text-destructive">
                                  {isDisconnectingTikTok ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlink className="w-4 h-4 mr-1" />Disconnect</>}
                                </Button>
                              ) : isSubscribed ? (
                                <Button size="sm" variant={isSandbox ? "outline" : "default"} onClick={handleConnectTikTok} disabled={isConnectingTikTok}>
                                  {isConnectingTikTok ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-1" />Connect</>}
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setShowUpgradeDialog(true)} className="gap-1.5">
                                  <Crown className="w-3.5 h-3.5 text-primary" />Pro
                                </Button>
                              )
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-0 space-y-6">
              {/* Manage Projects Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                          <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                                {project.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{project.name}</p>
                                <p className="text-xs text-muted-foreground">Created {new Date(project.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(project.status)}
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setProjectToDelete(project)}>
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

              {/* Annual Review Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
                    <p className="text-sm text-muted-foreground mb-4">This isn't a performance review — just a moment to reflect.</p>
                    <Button variant="outline" onClick={() => setShowAnnualReview(true)} disabled={!annualReviewData?.isEligible}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {annualReviewData?.isEligible ? "View Your Year in Review" : `Complete ${2 - (annualReviewData?.totalCompleted || 0)} more projects to unlock`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-0 space-y-6">
              {/* Check-In Preferences Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

              {/* Email Notifications Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <EmailPreferencesSettings />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
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