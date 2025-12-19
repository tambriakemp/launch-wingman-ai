import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  subscriptionEnd: string | null;
  isImpersonating: boolean;
  impersonatedUserEmail: string | null;
  checkSubscription: () => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  startImpersonation: (targetUserId: string, targetEmail: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const ADMIN_SESSION_KEY = 'coach_hub_admin_session';
const IMPERSONATION_KEY = 'coach_hub_impersonation';
const ADMIN_INFO_KEY = 'coach_hub_admin_info';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing impersonation on mount
  useEffect(() => {
    const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
    if (impersonationData) {
      const { email } = JSON.parse(impersonationData);
      setIsImpersonating(true);
      setImpersonatedUserEmail(email);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setIsSubscribed(false);
      setSubscriptionEnd(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      setIsSubscribed(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [session]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session, checkSubscription]);

  const navigateToProject = async () => {
    // Fetch most recent project and redirect to it
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (projects && projects.length > 0) {
      navigate(`/projects/${projects[0].id}/offer`);
    } else {
      navigate("/projects");
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/projects`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    
    if (!error) {
      // Track signup activity and notify admins
      await trackActivity('signup', true);
      await navigateToProject();
    }
    
    return { error: error as Error | null };
  };

  const trackActivity = async (eventType: string = 'login', isNewSignup: boolean = false) => {
    try {
      await supabase.functions.invoke('track-activity', {
        body: { event_type: eventType, is_new_signup: isNewSignup }
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      // Track login activity
      await trackActivity('login');
      await navigateToProject();
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear impersonation data if exists
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    setIsImpersonating(false);
    setImpersonatedUserEmail(null);
    setIsSubscribed(false);
    setSubscriptionEnd(null);
    
    // Navigate first, then sign out to prevent race conditions
    navigate("/", { replace: true });
    
    await supabase.auth.signOut();
  };

  const startImpersonation = async (targetUserId: string, targetEmail: string) => {
    if (!session) {
      toast.error('No active session');
      return;
    }

    try {
      // Store the current admin session and info before impersonating
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }));
      localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify({
        userId: user?.id,
        email: user?.email,
      }));

      // Call edge function to get impersonation token
      const { data, error } = await supabase.functions.invoke('admin-impersonate-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { targetUserId },
      });

      if (error) throw error;

      if (!data.email_otp) {
        throw new Error('Failed to generate impersonation session');
      }

      // Store impersonation state
      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
        email: targetEmail,
        startedAt: new Date().toISOString(),
      }));

      // Use the OTP to sign in as the target user
      const { error: signInError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: data.email_otp,
        type: 'email',
      });

      if (signInError) throw signInError;

      setIsImpersonating(true);
      setImpersonatedUserEmail(targetEmail);

      // Explicitly check subscription for the impersonated user's new session
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      if (subError) {
        console.error('Error checking subscription during impersonation:', subError);
      } else {
        console.log('Subscription check for impersonated user:', subData);
        setIsSubscribed(subData?.subscribed ?? false);
        setSubscriptionEnd(subData?.subscription_end ?? null);
      }

      toast.success(`Now viewing as ${targetEmail}`);
      
      // Navigate to app
      navigate('/app');
    } catch (error: any) {
      console.error('Impersonation error:', error);
      toast.error(error.message || 'Failed to start impersonation');
      // Clean up on failure
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(IMPERSONATION_KEY);
    }
  };

  const stopImpersonation = async () => {
    try {
      const adminSessionData = localStorage.getItem(ADMIN_SESSION_KEY);
      const adminInfoData = localStorage.getItem(ADMIN_INFO_KEY);
      const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
      
      if (!adminSessionData) {
        toast.error('No admin session to return to');
        await signOut();
        return;
      }

      const { access_token, refresh_token } = JSON.parse(adminSessionData);

      // Log the impersonation end event
      if (adminInfoData && impersonationData) {
        const adminInfo = JSON.parse(adminInfoData);
        const impersonation = JSON.parse(impersonationData);
        
        // Call edge function to log end event (fire and forget)
        supabase.functions.invoke('log-impersonation-end', {
          body: {
            adminUserId: adminInfo.userId,
            adminEmail: adminInfo.email,
            targetUserId: user?.id,
            targetEmail: impersonation.email,
          },
        }).catch(err => console.error('Failed to log impersonation end:', err));
      }

      // Sign out of impersonated user
      await supabase.auth.signOut();

      // Restore admin session
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) throw error;

      // Clear impersonation data
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      localStorage.removeItem(IMPERSONATION_KEY);
      setIsImpersonating(false);
      setImpersonatedUserEmail(null);

      toast.success('Returned to admin account');
      navigate('/admin');
    } catch (error: any) {
      console.error('Stop impersonation error:', error);
      toast.error('Failed to return to admin account');
      // Force sign out on failure
      await signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isSubscribed, 
      subscriptionEnd,
      isImpersonating,
      impersonatedUserEmail,
      checkSubscription,
      signUp, 
      signIn, 
      signOut,
      startImpersonation,
      stopImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
