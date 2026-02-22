import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trackLogin, trackSignup, trackLogout, setUserId, clearUserId } from "@/lib/analytics";
import { SubscriptionTier } from "@/lib/subscriptionTiers";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  subscriptionTier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  isImpersonating: boolean;
  impersonatedUserEmail: string | null;
  checkSubscription: () => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, skipNavigation?: boolean) => Promise<{ error: Error | null }>;
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
const EXPLICIT_LOGOUT_KEY = 'launchely_explicit_logout';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing impersonation on mount - with validation
  useEffect(() => {
    const validateImpersonation = async () => {
      const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
      const adminSessionData = localStorage.getItem(ADMIN_SESSION_KEY);
      
      if (!impersonationData || !adminSessionData) {
        // No impersonation data or incomplete - clear everything
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
        return;
      }
      
      try {
        const { email, startedAt } = JSON.parse(impersonationData);
        
        // Check if impersonation is stale (older than 4 hours)
        const startTime = new Date(startedAt).getTime();
        const MAX_IMPERSONATION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
        if (Date.now() - startTime > MAX_IMPERSONATION_DURATION) {
          console.warn('[AuthContext] Stale impersonation data detected, clearing...');
          localStorage.removeItem(IMPERSONATION_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          localStorage.removeItem(ADMIN_INFO_KEY);
          return;
        }
        
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Validate current session matches impersonated user
        if (sessionData?.session?.user?.email === email) {
          setIsImpersonating(true);
          setImpersonatedUserEmail(email);
        } else {
          // Session doesn't match - clear stale impersonation data
          console.warn('[AuthContext] Impersonation session mismatch, clearing...');
          localStorage.removeItem(IMPERSONATION_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          localStorage.removeItem(ADMIN_INFO_KEY);
        }
      } catch (err) {
        console.error('[AuthContext] Error validating impersonation:', err);
        // On any error, clear impersonation data
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
      }
    };
    
    validateImpersonation();
  }, []);

  // Track previous subscription state to detect changes
  const prevSubscribedRef = useRef<boolean | null>(null);
  const hasCheckedInitialSubscription = useRef(false);

  const notifyAdminOfSubscriptionChange = useCallback(async (type: 'pro_signup' | 'pro_cancellation', userEmail: string, userName?: string, userId?: string) => {
    try {
      // Notify admin
      await supabase.functions.invoke('admin-notify', {
        body: {
          type,
          user_email: userEmail,
          details: {
            user_name: userName,
          },
        },
      });
      console.log(`[AuthContext] Admin notified of ${type} for ${userEmail}`);

    } catch (error) {
      console.error('[AuthContext] Failed to notify admin:', error);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setIsSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setSubscriptionLoading(false);
      prevSubscribedRef.current = null;
      hasCheckedInitialSubscription.current = false;
      return;
    }

    setSubscriptionLoading(true);
    try {
    const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setSubscriptionLoading(false);
        return;
      }
      
      const newSubscribed = data?.subscribed ?? false;
      const previousSubscribed = prevSubscribedRef.current;
      
      // Only check for changes after the initial subscription check
      if (hasCheckedInitialSubscription.current && previousSubscribed !== null) {
        const userEmail = user?.email || session.user?.email;
        const userId = user?.id || session.user?.id;
        const userName = user?.user_metadata?.first_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
          : undefined;
        
        // Detect Pro signup: was not subscribed, now is subscribed
        if (!previousSubscribed && newSubscribed && userEmail) {
          notifyAdminOfSubscriptionChange('pro_signup', userEmail, userName, userId);
        }
        
        // Detect Pro cancellation: was subscribed, now is not subscribed
        if (previousSubscribed && !newSubscribed && userEmail) {
          notifyAdminOfSubscriptionChange('pro_cancellation', userEmail, userName, userId);
        }
      }
      
      prevSubscribedRef.current = newSubscribed;
      hasCheckedInitialSubscription.current = true;
      
      setIsSubscribed(newSubscribed);
      setSubscriptionTier(data?.subscription_tier || null);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session, user, notifyAdminOfSubscriptionChange]);

  // Refs to prevent unnecessary re-renders on token refresh
  const isInitialized = useRef(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        const newUserId = newSession?.user?.id ?? null;
        
        // Token refresh - don't trigger re-renders if same user
        if (event === 'TOKEN_REFRESHED') {
          if (currentUserId.current === newUserId && isInitialized.current) {
            // Same user, just token refresh - skip state update to prevent re-renders
            return;
          }
        }
        
        // Detect unexpected session loss (not explicit logout)
        if (event === 'SIGNED_OUT') {
          const wasExplicitLogout = localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
          localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
          
          if (!wasExplicitLogout && currentUserId.current) {
            console.warn('[AuthContext] Unexpected session loss detected, attempting recovery...');
            
            // Attempt to recover session after a brief delay
            setTimeout(async () => {
              try {
                const { data } = await supabase.auth.getSession();
                if (!data.session) {
                  // Session truly expired - notify user
                  toast.warning('Your session expired. Please log in again.');
                }
              } catch (err) {
                console.error('[AuthContext] Session recovery failed:', err);
              }
            }, 1000);
          }
        }
        
        // Only update state if user ID changed or this is initial load
        if (currentUserId.current !== newUserId || !isInitialized.current) {
          currentUserId.current = newUserId;
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // If user changed unexpectedly, clear any stale impersonation data
          const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
          if (impersonationData && newSession?.user) {
            try {
              const { email } = JSON.parse(impersonationData);
              if (newSession.user.email !== email) {
                // Current user doesn't match impersonation - clear it
                console.warn('[AuthContext] User changed, clearing impersonation state');
                localStorage.removeItem(IMPERSONATION_KEY);
                localStorage.removeItem(ADMIN_SESSION_KEY);
                localStorage.removeItem(ADMIN_INFO_KEY);
                setIsImpersonating(false);
                setImpersonatedUserEmail(null);
              }
            } catch (err) {
              console.error('[AuthContext] Error parsing impersonation data:', err);
            }
          }
        }
        
        // Mark as initialized after first auth event
        if (!isInitialized.current) {
          isInitialized.current = true;
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isInitialized.current) {
        if (initialSession) {
          // Validate the session is actually valid by attempting a refresh
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshed.session) {
            // Session is stale, treat as logged out
            console.warn('[AuthContext] Stale session detected, clearing');
            currentUserId.current = null;
            setSession(null);
            setUser(null);
            setSubscriptionLoading(false);
          } else {
            currentUserId.current = refreshed.session.user.id;
            setSession(refreshed.session);
            setUser(refreshed.session.user);
          }
        } else {
          currentUserId.current = null;
          setSession(null);
          setUser(null);
          setSubscriptionLoading(false);
        }
        isInitialized.current = true;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || subscriptionLoading) {
        console.warn('[AuthContext] Loading timeout - forcing completion');
        setLoading(false);
        setSubscriptionLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [loading, subscriptionLoading]);

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
      navigate(`/projects/${projects[0].id}/dashboard`);
    } else {
      navigate("/projects");
    }
  };

  // Capture UTM params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmCampaign = params.get('utm_campaign');
    if (utmCampaign) {
      localStorage.setItem('launchely_utm_campaign', utmCampaign);
    }
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, skipNavigation?: boolean) => {
    const redirectUrl = `${window.location.origin}/projects`;
    
    const { data: signUpData, error } = await supabase.auth.signUp({
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
    
    if (!error && signUpData?.user) {
      // Track signup activity and notify admins
      await trackActivity('signup', true);
      
      // Track signup with Google Analytics
      trackSignup('email');
      setUserId(signUpData.user.id);
      
      // Send welcome email (fire and forget)
      supabase.functions.invoke("send-notification-email", {
        body: {
          email_type: "welcome",
          user_id: signUpData.user.id,
        },
      }).catch((err) => console.error("Failed to send welcome email:", err));

      // Forward stored UTM campaign to surecontact-webhook for lead attribution
      const storedUtmCampaign = localStorage.getItem('launchely_utm_campaign');
      if (storedUtmCampaign) {
        supabase.functions.invoke("surecontact-webhook", {
          body: {
            action: "sync_new_signup",
            email,
            first_name: firstName || '',
            last_name: lastName || '',
            utm_campaign: storedUtmCampaign,
          },
        }).catch((err) => console.error("Failed to sync UTM campaign tag:", err));
        localStorage.removeItem('launchely_utm_campaign');
      }

      
      // Only navigate if not explicitly skipped (e.g., for Pro checkout flow)
      if (!skipNavigation) {
        await navigateToProject();
      }
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Track login activity
      await trackActivity('login');
      
      // Track login with Google Analytics
      trackLogin('email');
      setUserId(data.user.id);
      
      await navigateToProject();
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Track logout with Google Analytics
    trackLogout();
    clearUserId();
    
    // Mark this as an explicit logout to prevent recovery attempts
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
    
    // Clear impersonation data if exists
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    // Clear admin cache on logout
    localStorage.removeItem('launchely_admin_status_cache');
    setIsImpersonating(false);
    setImpersonatedUserEmail(null);
    setIsSubscribed(false);
    setSubscriptionTier(null);
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
        setSubscriptionTier(subData?.subscription_tier || null);
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
        // Clean up all impersonation data
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
        setIsImpersonating(false);
        setImpersonatedUserEmail(null);
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
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error || !data.session) {
        // Admin session expired - need to re-login
        console.warn('[AuthContext] Admin session expired');
        toast.error('Your admin session has expired. Please log in again.');
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
        setIsImpersonating(false);
        setImpersonatedUserEmail(null);
        navigate('/auth');
        return;
      }

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
      // Clean up all impersonation data on failure
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      setIsImpersonating(false);
      setImpersonatedUserEmail(null);
      // Force sign out on failure
      await signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading: loading || subscriptionLoading, 
      isSubscribed, 
      subscriptionTier,
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
