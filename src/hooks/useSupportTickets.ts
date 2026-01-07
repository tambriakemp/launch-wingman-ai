import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  subject: string;
  status: 'open' | 'in_progress' | 'awaiting_user' | 'awaiting_agent' | 'resolved';
  priority: 'low' | 'normal' | 'high';
  user_tier: 'free' | 'pro';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent';
  sender_name: string | null;
  message: string;
  created_at: string;
}

// Fetch user's own tickets
export function useUserTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["support-tickets", "user", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });
}

// Fetch all tickets (admin/manager)
export function useAllTickets(filters?: {
  status?: string;
  priority?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["support-tickets", "all", filters],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

// Fetch single ticket
export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["support-tickets", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (error) throw error;
      return data as SupportTicket;
    },
    enabled: !!ticketId,
  });
}

// Fetch messages for a ticket
export function useTicketMessages(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["support-ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SupportTicketMessage[];
    },
    enabled: !!ticketId,
  });
}

// Create a new ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user, isSubscribed } = useAuth();

  return useMutation({
    mutationFn: async (data: { subject: string; message: string; priority?: string }) => {
      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user?.id)
        .single();

      const userName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : null;

      const userTier = isSubscribed ? "pro" : "free";

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user?.id,
          user_email: user?.email || "",
          user_name: userName,
          subject: data.subject,
          priority: data.priority || "normal",
          user_tier: userTier,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message
      const { error: messageError } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: user?.id,
          sender_type: "user",
          sender_name: userName,
          message: data.message,
        });

      if (messageError) throw messageError;

      // Send notification to support team
      try {
        await supabase.functions.invoke("send-ticket-notification", {
          body: {
            type: "new_ticket",
            ticketId: ticket.id,
            userEmail: user?.email,
            userName: userName || "User",
            subject: data.subject,
            message: data.message,
            userTier,
          },
        });
      } catch (e) {
        console.error("Failed to send new ticket notification:", e);
      }

      return ticket as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket submitted successfully");
    },
    onError: (error) => {
      console.error("Error creating ticket:", error);
      toast.error("Failed to submit ticket");
    },
  });
}

// Add a message to a ticket (user)
export function useAddUserMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user?.id)
        .single();

      const userName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : null;

      // Add message
      const { error: messageError } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: data.ticketId,
          sender_id: user?.id,
          sender_type: "user",
          sender_name: userName,
          message: data.message,
        });

      if (messageError) throw messageError;

      // Update ticket status to awaiting_agent
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .update({ status: "awaiting_agent" })
        .eq("id", data.ticketId);

      if (ticketError) throw ticketError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-messages", variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Reply sent");
    },
    onError: (error) => {
      console.error("Error adding message:", error);
      toast.error("Failed to send reply");
    },
  });
}

// Add a message to a ticket (agent)
export function useAddAgentMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { ticketId: string; message: string; userEmail: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user?.id)
        .single();

      const agentName = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Support Agent"
        : "Support Agent";

      // Add message
      const { error: messageError } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: data.ticketId,
          sender_id: user?.id,
          sender_type: "agent",
          sender_name: agentName,
          message: data.message,
        });

      if (messageError) throw messageError;

      // Update ticket status to awaiting_user
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .update({ 
          status: "awaiting_user",
          assigned_to: user?.id 
        })
        .eq("id", data.ticketId);

      if (ticketError) throw ticketError;

      // Send notification email
      try {
        await supabase.functions.invoke("send-ticket-notification", {
          body: {
            ticketId: data.ticketId,
            userEmail: data.userEmail,
            agentName,
            message: data.message,
          },
        });
      } catch (e) {
        console.error("Failed to send notification email:", e);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-messages", variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Reply sent to user");
    },
    onError: (error) => {
      console.error("Error adding message:", error);
      toast.error("Failed to send reply");
    },
  });
}

// Update ticket status
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; status: string }) => {
      const updateData: Record<string, unknown> = { status: data.status };
      
      if (data.status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", data.ticketId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", variables.ticketId] });
      toast.success("Ticket status updated");
    },
    onError: (error) => {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    },
  });
}

// Update ticket priority
export function useUpdateTicketPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { ticketId: string; priority: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ priority: data.priority })
        .eq("id", data.ticketId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets", variables.ticketId] });
      toast.success("Ticket priority updated");
    },
    onError: (error) => {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update priority");
    },
  });
}
