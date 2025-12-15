export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brand_colors: {
        Row: {
          created_at: string
          hex_color: string
          id: string
          name: string | null
          position: number
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hex_color: string
          id?: string
          name?: string | null
          position?: number
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hex_color?: string
          id?: string
          name?: string | null
          position?: number
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_fonts: {
        Row: {
          created_at: string
          custom_font_path: string | null
          font_category: string
          font_family: string
          font_source: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_font_path?: string | null
          font_category: string
          font_family: string
          font_source?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_font_path?: string | null
          font_category?: string
          font_family?: string
          font_source?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_logos: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_photos: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_planner: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          day_number: number
          description: string | null
          id: string
          labels: string[] | null
          phase: string
          project_id: string
          status: string
          time_of_day: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          labels?: string[] | null
          phase: string
          project_id: string
          status?: string
          time_of_day?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          labels?: string[] | null
          phase?: string
          project_id?: string
          status?: string
          time_of_day?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_planner_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_copy: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_copy_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_asset_completions: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          is_completed: boolean
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_asset_completions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          community_platform: string | null
          created_at: string
          desired_outcome: string | null
          email_platform: string | null
          funnel_platform: string | null
          funnel_type: string
          id: string
          niche: string | null
          primary_pain_point: string | null
          problem_statement: string | null
          project_id: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_platform?: string | null
          created_at?: string
          desired_outcome?: string | null
          email_platform?: string | null
          funnel_platform?: string | null
          funnel_type: string
          id?: string
          niche?: string | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_platform?: string | null
          created_at?: string
          desired_outcome?: string | null
          email_platform?: string | null
          funnel_platform?: string | null
          funnel_type?: string
          id?: string
          niche?: string | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_events: {
        Row: {
          content_creation_start: string | null
          created_at: string
          enrollment_closes: string | null
          enrollment_opens: string | null
          event_type: string
          id: string
          prelaunch_start: string | null
          program_delivery_end: string | null
          program_delivery_start: string | null
          program_weeks: number | null
          project_id: string
          rest_period_end: string | null
          rest_period_start: string | null
          rest_weeks: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_creation_start?: string | null
          created_at?: string
          enrollment_closes?: string | null
          enrollment_opens?: string | null
          event_type?: string
          id?: string
          prelaunch_start?: string | null
          program_delivery_end?: string | null
          program_delivery_start?: string | null
          program_weeks?: number | null
          project_id: string
          rest_period_end?: string | null
          rest_period_start?: string | null
          rest_weeks?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_creation_start?: string | null
          created_at?: string
          enrollment_closes?: string | null
          enrollment_opens?: string | null
          event_type?: string
          id?: string
          prelaunch_start?: string | null
          program_delivery_end?: string | null
          program_delivery_start?: string | null
          program_weeks?: number | null
          project_id?: string
          rest_period_end?: string | null
          rest_period_start?: string | null
          rest_weeks?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          community_platform: string | null
          created_at: string
          description: string | null
          desired_outcome: string | null
          email_platform: string | null
          funnel_id: string | null
          funnel_platform: string | null
          funnel_type: string | null
          id: string
          is_required: boolean
          main_deliverables: string[] | null
          niche: string
          offer_category: string
          offer_type: string
          price: number | null
          price_type: string | null
          primary_pain_point: string | null
          problem_statement: string | null
          project_id: string
          slot_position: number
          slot_type: string
          target_audience: string | null
          title: string | null
          transformation_statement: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_platform?: string | null
          created_at?: string
          description?: string | null
          desired_outcome?: string | null
          email_platform?: string | null
          funnel_id?: string | null
          funnel_platform?: string | null
          funnel_type?: string | null
          id?: string
          is_required?: boolean
          main_deliverables?: string[] | null
          niche: string
          offer_category: string
          offer_type: string
          price?: number | null
          price_type?: string | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id: string
          slot_position?: number
          slot_type?: string
          target_audience?: string | null
          title?: string | null
          transformation_statement?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_platform?: string | null
          created_at?: string
          description?: string | null
          desired_outcome?: string | null
          email_platform?: string | null
          funnel_id?: string | null
          funnel_platform?: string | null
          funnel_type?: string | null
          id?: string
          is_required?: boolean
          main_deliverables?: string[] | null
          niche?: string
          offer_category?: string
          offer_type?: string
          price?: number | null
          price_type?: string | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id?: string
          slot_position?: number
          slot_type?: string
          target_audience?: string | null
          title?: string | null
          transformation_statement?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          funnel_type_snapshot: string | null
          id: string
          launch_date: string | null
          name: string
          project_type: string
          status: string
          transformation_statement: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          funnel_type_snapshot?: string | null
          id?: string
          launch_date?: string | null
          name: string
          project_type?: string
          status?: string
          transformation_statement?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          funnel_type_snapshot?: string | null
          id?: string
          launch_date?: string | null
          name?: string
          project_type?: string
          status?: string
          transformation_statement?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_page_copy: {
        Row: {
          created_at: string
          deliverable_id: string
          id: string
          project_id: string
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
          project_id: string
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
          project_id?: string
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_page_copy_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_bios: {
        Row: {
          bio_content: string
          created_at: string
          field_data: Json
          formula_id: string
          id: string
          platform: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio_content: string
          created_at?: string
          field_data?: Json
          formula_id: string
          id?: string
          platform: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio_content?: string
          created_at?: string
          field_data?: Json
          formula_id?: string
          id?: string
          platform?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_bios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          position: number
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          position?: number
          task_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          position?: number
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          column_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          labels: string[] | null
          phase: string | null
          position: number
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          phase?: string | null
          position?: number
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          column_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          phase?: string | null
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
