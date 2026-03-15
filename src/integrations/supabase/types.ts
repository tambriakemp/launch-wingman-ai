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
      admin_action_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_email: string
          admin_user_id: string
          created_at: string | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_email: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_studio_environment_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_studio_environments: {
        Row: {
          created_at: string
          file_path: string
          group_id: string | null
          id: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          group_id?: string | null
          id?: string
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          group_id?: string | null
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_studio_environments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ai_studio_environment_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_studio_projects: {
        Row: {
          character_preview_url: string | null
          config: Json
          created_at: string
          final_look_preview_url: string | null
          generated_media: Json | null
          id: string
          mode: string
          name: string
          status: string
          storyboard: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_preview_url?: string | null
          config?: Json
          created_at?: string
          final_look_preview_url?: string | null
          generated_media?: Json | null
          id?: string
          mode?: string
          name?: string
          status?: string
          storyboard?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          character_preview_url?: string | null
          config?: Json
          created_at?: string
          final_look_preview_url?: string | null
          generated_media?: Json | null
          id?: string
          mode?: string
          name?: string
          status?: string
          storyboard?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_studio_saved_looks: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          function_name: string
          id: string
          model: string
          project_id: string | null
          success: boolean
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          model: string
          project_id?: string | null
          success?: boolean
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          model?: string
          project_id?: string | null
          success?: boolean
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brain_dump_items: {
        Row: {
          content: string
          created_at: string
          id: string
          processed_as: string | null
          processed_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          processed_as?: string | null
          processed_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          processed_as?: string | null
          processed_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
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
      brand_kit_assets: {
        Row: {
          asset_name: string
          asset_type: string
          brand_settings_version: string | null
          created_at: string
          created_by: string | null
          file_path: string
          file_url: string
          height: number
          id: string
          platform: string
          width: number
        }
        Insert: {
          asset_name: string
          asset_type: string
          brand_settings_version?: string | null
          created_at?: string
          created_by?: string | null
          file_path: string
          file_url: string
          height: number
          id?: string
          platform: string
          width: number
        }
        Update: {
          asset_name?: string
          asset_type?: string
          brand_settings_version?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_url?: string
          height?: number
          id?: string
          platform?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_kit_assets_brand_settings_version_fkey"
            columns: ["brand_settings_version"]
            isOneToOne: false
            referencedRelation: "brand_kit_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kit_settings: {
        Row: {
          body_font: string
          brand_name: string
          created_at: string
          header_font: string
          highlight_labels: Json | null
          icon_url: string | null
          id: string
          logo_url: string | null
          neutral_color: string
          primary_color: string
          secondary_color: string
          subtext: string | null
          tagline: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_font?: string
          brand_name?: string
          created_at?: string
          header_font?: string
          highlight_labels?: Json | null
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          neutral_color?: string
          primary_color?: string
          secondary_color?: string
          subtext?: string | null
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_font?: string
          brand_name?: string
          created_at?: string
          header_font?: string
          highlight_labels?: Json | null
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          neutral_color?: string
          primary_color?: string
          secondary_color?: string
          subtext?: string | null
          tagline?: string
          updated_at?: string
          updated_by?: string | null
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
      campaign_conversions: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          ip_hash: string | null
          product: string | null
          referrer: string | null
          revenue: number | null
          step: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          product?: string | null
          referrer?: string | null
          revenue?: number | null
          step?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          product?: string | null
          referrer?: string | null
          revenue?: number | null
          step?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_conversions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          auto_utm: boolean
          budget: number | null
          created_at: string
          end_date: string | null
          funnel_id: string | null
          goal: string
          goal_target: number
          id: string
          name: string
          platforms: string[] | null
          start_date: string
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_utm?: boolean
          budget?: number | null
          created_at?: string
          end_date?: string | null
          funnel_id?: string | null
          goal: string
          goal_target?: number
          id?: string
          name: string
          platforms?: string[] | null
          start_date: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_utm?: boolean
          budget?: number | null
          created_at?: string
          end_date?: string | null
          funnel_id?: string | null
          goal?: string
          goal_target?: number
          id?: string
          name?: string
          platforms?: string[] | null
          start_date?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_preferences: {
        Row: {
          cadence: string
          created_at: string
          id: string
          last_check_in_at: string | null
          snoozed_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          id?: string
          last_check_in_at?: string | null
          snoozed_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cadence?: string
          created_at?: string
          id?: string
          last_check_in_at?: string | null
          snoozed_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          id: string
          orientation_choice: string | null
          reflection_prompt: string | null
          reflection_response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          orientation_choice?: string | null
          reflection_prompt?: string | null
          reflection_response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          orientation_choice?: string | null
          reflection_prompt?: string | null
          reflection_response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_drafts: {
        Row: {
          content: string
          content_idea_id: string | null
          content_type: string
          created_at: string
          funnel_type: string | null
          id: string
          phase: string | null
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_idea_id?: string | null
          content_type?: string
          created_at?: string
          funnel_type?: string | null
          id?: string
          phase?: string | null
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_idea_id?: string | null
          content_type?: string
          created_at?: string
          funnel_type?: string | null
          id?: string
          phase?: string | null
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_content_idea_id_fkey"
            columns: ["content_idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          funnel_type: string | null
          id: string
          is_saved: boolean
          phase: string | null
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          description?: string | null
          funnel_type?: string | null
          id?: string
          is_saved?: boolean
          phase?: string | null
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          funnel_type?: string | null
          id?: string
          is_saved?: boolean
          phase?: string | null
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          media_type: string | null
          media_url: string | null
          phase: string
          project_id: string
          publish_results: Json | null
          scheduled_at: string | null
          scheduled_platforms: string[] | null
          status: string
          thread_posts: Json | null
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
          media_type?: string | null
          media_url?: string | null
          phase: string
          project_id: string
          publish_results?: Json | null
          scheduled_at?: string | null
          scheduled_platforms?: string[] | null
          status?: string
          thread_posts?: Json | null
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
          media_type?: string | null
          media_url?: string | null
          phase?: string
          project_id?: string
          publish_results?: Json | null
          scheduled_at?: string | null
          scheduled_platforms?: string[] | null
          status?: string
          thread_posts?: Json | null
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
      content_vault_categories: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      content_vault_resources: {
        Row: {
          cover_image_fit: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          download_count: number
          id: string
          position: number
          preview_url: string | null
          resource_type: string
          resource_url: string
          subcategory_id: string
          tags: string[] | null
          title: string
        }
        Insert: {
          cover_image_fit?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          id?: string
          position?: number
          preview_url?: string | null
          resource_type?: string
          resource_url: string
          subcategory_id: string
          tags?: string[] | null
          title: string
        }
        Update: {
          cover_image_fit?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          id?: string
          position?: number
          preview_url?: string | null
          resource_type?: string
          resource_url?: string
          subcategory_id?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_vault_resources_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "content_vault_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_vault_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_vault_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_vault_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_pages: {
        Row: {
          created_at: string
          evening_reflection: string | null
          gratitude: string | null
          id: string
          intention: string | null
          mood: string | null
          notes: string | null
          page_date: string
          priority_1: string | null
          priority_1_done: boolean
          priority_2: string | null
          priority_2_done: boolean
          priority_3: string | null
          priority_3_done: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evening_reflection?: string | null
          gratitude?: string | null
          id?: string
          intention?: string | null
          mood?: string | null
          notes?: string | null
          page_date: string
          priority_1?: string | null
          priority_1_done?: boolean
          priority_2?: string | null
          priority_2_done?: boolean
          priority_3?: string | null
          priority_3_done?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evening_reflection?: string | null
          gratitude?: string | null
          id?: string
          intention?: string | null
          mood?: string | null
          notes?: string | null
          page_date?: string
          priority_1?: string | null
          priority_1_done?: boolean
          priority_2?: string | null
          priority_2_done?: boolean
          priority_3?: string | null
          priority_3_done?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      email_logs: {
        Row: {
          email_type: string
          id: string
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          email_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          email_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          check_in_emails_enabled: boolean
          created_at: string
          id: string
          product_emails_enabled: boolean
          relaunch_emails_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_emails_enabled?: boolean
          created_at?: string
          id?: string
          product_emails_enabled?: boolean
          relaunch_emails_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_emails_enabled?: boolean
          created_at?: string
          id?: string
          product_emails_enabled?: boolean
          relaunch_emails_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          likelihood_elements: Json | null
          main_objections: string | null
          niche: string | null
          pain_symptoms: Json | null
          primary_pain_point: string | null
          problem_statement: string | null
          project_id: string
          specificity_score: number | null
          sub_audiences: Json | null
          target_audience: string | null
          time_effort_elements: Json | null
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
          likelihood_elements?: Json | null
          main_objections?: string | null
          niche?: string | null
          pain_symptoms?: Json | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id: string
          specificity_score?: number | null
          sub_audiences?: Json | null
          target_audience?: string | null
          time_effort_elements?: Json | null
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
          likelihood_elements?: Json | null
          main_objections?: string | null
          niche?: string | null
          pain_symptoms?: Json | null
          primary_pain_point?: string | null
          problem_statement?: string | null
          project_id?: string
          specificity_score?: number | null
          sub_audiences?: Json | null
          target_audience?: string | null
          time_effort_elements?: Json | null
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
      generated_posts: {
        Row: {
          carousel_slides: Json | null
          created_at: string
          created_by: string | null
          file_path: string
          file_url: string
          generated_content: Json
          id: string
          platform: string
          status: string
          template_id: string | null
          topic: string
        }
        Insert: {
          carousel_slides?: Json | null
          created_at?: string
          created_by?: string | null
          file_path: string
          file_url: string
          generated_content?: Json
          id?: string
          platform: string
          status?: string
          template_id?: string | null
          topic: string
        }
        Update: {
          carousel_slides?: Json | null
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_url?: string
          generated_content?: Json
          id?: string
          platform?: string
          status?: string
          template_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_posts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "post_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          created_at: string
          due_date: string | null
          goal_id: string
          id: string
          is_done: boolean
          position: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          goal_id: string
          id?: string
          is_done?: boolean
          position?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          goal_id?: string
          id?: string
          is_done?: boolean
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          id: string
          quarter: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
          why_statement: string | null
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          quarter?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
          why_statement?: string | null
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          quarter?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          why_statement?: string | null
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed_date: string
          created_at?: string
          habit_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          frequency: string
          frequency_days: string[] | null
          icon: string
          id: string
          is_archived: boolean
          name: string
          target_per_week: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          frequency?: string
          frequency_days?: string[] | null
          icon?: string
          id?: string
          is_archived?: boolean
          name: string
          target_per_week?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          frequency?: string
          frequency_days?: string[] | null
          icon?: string
          id?: string
          is_archived?: boolean
          name?: string
          target_per_week?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      impersonation_logs: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          id: string
          target_email: string
          target_user_id: string
        }
        Insert: {
          action?: string
          admin_email: string
          admin_user_id: string
          created_at?: string
          id?: string
          target_email: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          target_email?: string
          target_user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
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
      launch_snapshots: {
        Row: {
          confidence_level: string | null
          created_at: string
          email_list_growth: number | null
          email_list_size: number | null
          facebook_followers: number | null
          id: string
          instagram_followers: number | null
          last_metric_update: string | null
          launch_revenue: number | null
          monthly_revenue: number | null
          new_followers: number | null
          project_id: string
          reflection_note: string | null
          sales_count: number | null
          snapshot_type: string
          tiktok_followers: number | null
          updated_at: string
          user_id: string
          ytd_revenue: number | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          email_list_growth?: number | null
          email_list_size?: number | null
          facebook_followers?: number | null
          id?: string
          instagram_followers?: number | null
          last_metric_update?: string | null
          launch_revenue?: number | null
          monthly_revenue?: number | null
          new_followers?: number | null
          project_id: string
          reflection_note?: string | null
          sales_count?: number | null
          snapshot_type: string
          tiktok_followers?: number | null
          updated_at?: string
          user_id: string
          ytd_revenue?: number | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          email_list_growth?: number | null
          email_list_size?: number | null
          facebook_followers?: number | null
          id?: string
          instagram_followers?: number | null
          last_metric_update?: string | null
          launch_revenue?: number | null
          monthly_revenue?: number | null
          new_followers?: number | null
          project_id?: string
          reflection_note?: string | null
          sales_count?: number | null
          snapshot_type?: string
          tiktok_followers?: number | null
          updated_at?: string
          user_id?: string
          ytd_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      library_article_order: {
        Row: {
          article_id: string
          id: string
          position: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          article_id: string
          id?: string
          position?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          article_id?: string
          id?: string
          position?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      linkinbio_cards: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          card_type: string
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          highlight: boolean
          id: string
          image_url: string | null
          is_visible: boolean
          position: number
          price_current: string | null
          price_note: string | null
          price_original: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          card_type?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          highlight?: boolean
          id?: string
          image_url?: string | null
          is_visible?: boolean
          position?: number
          price_current?: string | null
          price_note?: string | null
          price_original?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          card_type?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          highlight?: boolean
          id?: string
          image_url?: string | null
          is_visible?: boolean
          position?: number
          price_current?: string | null
          price_note?: string | null
          price_original?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      linkinbio_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      linkinbio_social_links: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          is_visible: boolean
          platform: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          is_visible?: boolean
          platform: string
          position?: number
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          is_visible?: boolean
          platform?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      metric_updates: {
        Row: {
          created_at: string
          email_list_size: number | null
          facebook_followers: number | null
          id: string
          instagram_followers: number | null
          monthly_revenue: number | null
          notes: string | null
          project_id: string
          recorded_at: string
          tiktok_followers: number | null
          user_id: string
          ytd_revenue: number | null
        }
        Insert: {
          created_at?: string
          email_list_size?: number | null
          facebook_followers?: number | null
          id?: string
          instagram_followers?: number | null
          monthly_revenue?: number | null
          notes?: string | null
          project_id: string
          recorded_at?: string
          tiktok_followers?: number | null
          user_id: string
          ytd_revenue?: number | null
        }
        Update: {
          created_at?: string
          email_list_size?: number | null
          facebook_followers?: number | null
          id?: string
          instagram_followers?: number | null
          monthly_revenue?: number | null
          notes?: string | null
          project_id?: string
          recorded_at?: string
          tiktok_followers?: number | null
          user_id?: string
          ytd_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_state: {
        Row: {
          code_verifier: string
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
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
      payment_config: {
        Row: {
          created_at: string
          id: string
          key: string
          provider: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          provider: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          provider?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      post_templates: {
        Row: {
          created_at: string
          dimensions: Json
          id: string
          layout_description: string
          name: string
          platform: string
          style_elements: Json | null
          template_type: string
        }
        Insert: {
          created_at?: string
          dimensions?: Json
          id?: string
          layout_description: string
          name: string
          platform: string
          style_elements?: Json | null
          template_type: string
        }
        Update: {
          created_at?: string
          dimensions?: Json
          id?: string
          layout_description?: string
          name?: string
          platform?: string
          style_elements?: Json | null
          template_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banned_until: string | null
          created_at: string
          dismissed_celebrations: Json
          first_name: string | null
          id: string
          last_active: string | null
          last_name: string | null
          onboarding_completed_at: string | null
          ref_source: string | null
          seen_intros: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          dismissed_celebrations?: Json
          first_name?: string | null
          id?: string
          last_active?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          ref_source?: string | null
          seen_intros?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          dismissed_celebrations?: Json
          first_name?: string | null
          id?: string
          last_active?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          ref_source?: string | null
          seen_intros?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_memory: {
        Row: {
          created_at: string
          id: string
          memory_key: string
          needs_review: boolean
          project_id: string
          reviewed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_key: string
          needs_review?: boolean
          project_id: string
          reviewed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_key?: string
          needs_review?: boolean
          project_id?: string
          reviewed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          input_data: Json | null
          project_id: string
          skip_reason: string | null
          started_at: string | null
          status: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          project_id: string
          skip_reason?: string | null
          started_at?: string | null
          status?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          project_id?: string
          skip_reason?: string | null
          started_at?: string | null
          status?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_phase: string | null
          created_at: string
          description: string | null
          funnel_type_snapshot: string | null
          id: string
          is_relaunch: boolean
          launch_date: string | null
          name: string
          parent_project_id: string | null
          phase_statuses: Json | null
          project_type: string
          relaunch_invite_sent_at: string | null
          relaunch_kept_sections: string[] | null
          relaunch_nudge_dismissed: boolean
          relaunch_revisit_sections: string[] | null
          sales_copy_funnel_snapshot: string | null
          selected_funnel_type: string | null
          skip_memory: boolean
          status: string
          transformation_locked: boolean | null
          transformation_statement: string | null
          transformation_style: string | null
          transformation_versions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_phase?: string | null
          created_at?: string
          description?: string | null
          funnel_type_snapshot?: string | null
          id?: string
          is_relaunch?: boolean
          launch_date?: string | null
          name: string
          parent_project_id?: string | null
          phase_statuses?: Json | null
          project_type?: string
          relaunch_invite_sent_at?: string | null
          relaunch_kept_sections?: string[] | null
          relaunch_nudge_dismissed?: boolean
          relaunch_revisit_sections?: string[] | null
          sales_copy_funnel_snapshot?: string | null
          selected_funnel_type?: string | null
          skip_memory?: boolean
          status?: string
          transformation_locked?: boolean | null
          transformation_statement?: string | null
          transformation_style?: string | null
          transformation_versions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_phase?: string | null
          created_at?: string
          description?: string | null
          funnel_type_snapshot?: string | null
          id?: string
          is_relaunch?: boolean
          launch_date?: string | null
          name?: string
          parent_project_id?: string | null
          phase_statuses?: Json | null
          project_type?: string
          relaunch_invite_sent_at?: string | null
          relaunch_kept_sections?: string[] | null
          relaunch_nudge_dismissed?: boolean
          relaunch_revisit_sections?: string[] | null
          sales_copy_funnel_snapshot?: string | null
          selected_funnel_type?: string | null
          skip_memory?: boolean
          status?: string
          transformation_locked?: boolean | null
          transformation_statement?: string | null
          transformation_style?: string | null
          transformation_versions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      scheduled_posts: {
        Row: {
          content_item_id: string | null
          created_at: string
          id: string
          platform: string
          post_data: Json
          posted_at: string | null
          project_id: string
          result: Json | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string
          id?: string
          platform: string
          post_data?: Json
          posted_at?: string | null
          project_id: string
          result?: Json | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_item_id?: string | null
          created_at?: string
          id?: string
          platform?: string
          post_data?: Json
          posted_at?: string | null
          project_id?: string
          result?: Json | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_planner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_project_id_fkey"
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
      social_connections: {
        Row: {
          access_token: string
          account_id: string | null
          account_name: string | null
          avatar_url: string | null
          created_at: string
          id: string
          page_id: string | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_id?: string | null
          account_name?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string | null
          account_name?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_name: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_name?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
          user_tier: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name?: string | null
          user_tier?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
          user_tier?: string
        }
        Relationships: []
      }
      surecontact_config: {
        Row: {
          config_type: string
          created_at: string
          id: string
          metadata: Json | null
          name: string
          surecontact_uuid: string
          updated_at: string
        }
        Insert: {
          config_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          surecontact_uuid: string
          updated_at?: string
        }
        Update: {
          config_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          surecontact_uuid?: string
          updated_at?: string
        }
        Relationships: []
      }
      surecontact_incoming_webhooks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          list_id: string | null
          name: string
          tag_ids: string[] | null
          trigger_event: string
          updated_at: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          list_id?: string | null
          name: string
          tag_ids?: string[] | null
          trigger_event?: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          list_id?: string | null
          name?: string
          tag_ids?: string[] | null
          trigger_event?: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      surecontact_webhook_logs: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          event_type: string
          id: string
          response_status: number | null
          subscription_status: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          event_type: string
          id?: string
          response_status?: number | null
          subscription_status?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          event_type?: string
          id?: string
          response_status?: number | null
          subscription_status?: string | null
          success?: boolean
        }
        Relationships: []
      }
      task_video_instructions: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
          updated_by: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          updated_by?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          column_id: string
          created_at: string
          description: string | null
          due_at: string | null
          due_date: string | null
          end_at: string | null
          id: string
          labels: string[] | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          location: string | null
          phase: string | null
          position: number
          project_id: string
          recurrence_exception_dates: string[] | null
          recurrence_parent_id: string | null
          recurrence_rule: Json | null
          start_at: string | null
          task_origin: string
          task_scope: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          column_id?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          end_at?: string | null
          id?: string
          labels?: string[] | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          location?: string | null
          phase?: string | null
          position?: number
          project_id: string
          recurrence_exception_dates?: string[] | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          start_at?: string | null
          task_origin?: string
          task_scope?: string
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          column_id?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          end_at?: string | null
          id?: string
          labels?: string[] | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          location?: string | null
          phase?: string | null
          position?: number
          project_id?: string
          recurrence_exception_dates?: string[] | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          start_at?: string | null
          task_origin?: string
          task_scope?: string
          task_type?: string
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
          {
            foreignKeyName: "tasks_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_suggestions: {
        Row: {
          content_type: string
          created_at: string
          day_number: number
          description: string
          id: string
          phase: string
          project_id: string
          template_type: string
          time_of_day: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          day_number: number
          description: string
          id?: string
          phase: string
          project_id: string
          template_type: string
          time_of_day: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          day_number?: number
          description?: string
          id?: string
          phase?: string
          project_id?: string
          template_type?: string
          time_of_day?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          service: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          service: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          service?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_tone_profiles: {
        Row: {
          avoided_phrases: string[]
          cooldown_until: string | null
          created_at: string
          directness: number
          emoji_usage: number
          energy: number
          evidence_directness: number
          evidence_emoji_usage: number
          evidence_energy: number
          evidence_formality: number
          evidence_salesy_tolerance: number
          evidence_sentence_length: number
          evidence_warmth: number
          formality: number
          id: string
          last_updated_source: string | null
          preferred_phrases: string[]
          salesy_tolerance: number
          sentence_length: number
          tone_learning_enabled: boolean
          updated_at: string
          user_id: string
          version: number
          warmth: number
          writing_style: string
        }
        Insert: {
          avoided_phrases?: string[]
          cooldown_until?: string | null
          created_at?: string
          directness?: number
          emoji_usage?: number
          energy?: number
          evidence_directness?: number
          evidence_emoji_usage?: number
          evidence_energy?: number
          evidence_formality?: number
          evidence_salesy_tolerance?: number
          evidence_sentence_length?: number
          evidence_warmth?: number
          formality?: number
          id?: string
          last_updated_source?: string | null
          preferred_phrases?: string[]
          salesy_tolerance?: number
          sentence_length?: number
          tone_learning_enabled?: boolean
          updated_at?: string
          user_id: string
          version?: number
          warmth?: number
          writing_style?: string
        }
        Update: {
          avoided_phrases?: string[]
          cooldown_until?: string | null
          created_at?: string
          directness?: number
          emoji_usage?: number
          energy?: number
          evidence_directness?: number
          evidence_emoji_usage?: number
          evidence_energy?: number
          evidence_formality?: number
          evidence_salesy_tolerance?: number
          evidence_sentence_length?: number
          evidence_warmth?: number
          formality?: number
          id?: string
          last_updated_source?: string | null
          preferred_phrases?: string[]
          salesy_tolerance?: number
          sentence_length?: number
          tone_learning_enabled?: boolean
          updated_at?: string
          user_id?: string
          version?: number
          warmth?: number
          writing_style?: string
        }
        Relationships: []
      }
      utm_base_urls: {
        Row: {
          created_at: string
          id: string
          label: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      utm_click_events: {
        Row: {
          clicked_at: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          utm_link_id: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_link_id: string
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utm_click_events_utm_link_id_fkey"
            columns: ["utm_link_id"]
            isOneToOne: false
            referencedRelation: "utm_links"
            referencedColumns: ["id"]
          },
        ]
      }
      utm_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      utm_links: {
        Row: {
          base_url: string
          campaign_id: string | null
          channel: string
          click_count: number
          created_at: string
          folder_id: string | null
          full_url: string
          id: string
          label: string
          short_code: string
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          base_url: string
          campaign_id?: string | null
          channel?: string
          click_count?: number
          created_at?: string
          folder_id?: string | null
          full_url: string
          id?: string
          label: string
          short_code: string
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          base_url?: string
          campaign_id?: string | null
          channel?: string
          click_count?: number
          created_at?: string
          folder_id?: string | null
          full_url?: string
          id?: string
          label?: string
          short_code?: string
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utm_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "utm_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      video_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      video_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          monthly_free_remaining: number
          monthly_reset_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          monthly_free_remaining?: number
          monthly_reset_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          monthly_free_remaining?: number
          monthly_reset_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          provider: string
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider: string
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          status?: string | null
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          created_at: string
          didnt_finish: string | null
          energy_level: number | null
          id: string
          lessons: string | null
          next_week_focus: string | null
          next_week_priorities: string | null
          overall_rating: number | null
          updated_at: string
          user_id: string
          week_start: string
          wins: string | null
        }
        Insert: {
          created_at?: string
          didnt_finish?: string | null
          energy_level?: number | null
          id?: string
          lessons?: string | null
          next_week_focus?: string | null
          next_week_priorities?: string | null
          overall_rating?: number | null
          updated_at?: string
          user_id: string
          week_start: string
          wins?: string | null
        }
        Update: {
          created_at?: string
          didnt_finish?: string | null
          energy_level?: number | null
          id?: string
          lessons?: string | null
          next_week_focus?: string | null
          next_week_priorities?: string | null
          overall_rating?: number | null
          updated_at?: string
          user_id?: string
          week_start?: string
          wins?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      social_connections_decrypted: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string | null
          id: string | null
          page_id: string | null
          platform: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrypt_token: { Args: { encrypted_token: string }; Returns: string }
      encrypt_token: { Args: { plain_token: string }; Returns: string }
      get_social_connections_for_user: {
        Args: { p_user_id: string }
        Returns: {
          access_token: string
          account_id: string
          account_name: string
          avatar_url: string
          created_at: string
          id: string
          page_id: string
          platform: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_social_connections: {
        Args: never
        Returns: {
          access_token: string
          account_id: string
          account_name: string
          created_at: string
          id: string
          page_id: string
          platform: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_resource_download: {
        Args: { resource_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
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
      app_role: ["admin", "user", "manager"],
    },
  },
} as const
