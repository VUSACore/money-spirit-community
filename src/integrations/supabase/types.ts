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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount_pence: number
          commission_paid: boolean
          created_at: string
          id: string
          paid_at: string | null
          paid_by: string | null
          signed_up_at: string
          user_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount_pence?: number
          commission_paid?: boolean
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          signed_up_at?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount_pence?: number
          commission_paid?: boolean
          created_at?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          signed_up_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          active: boolean
          code: string
          commission_percent: number
          created_at: string
          created_by: string
          discount_percent: number
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          commission_percent?: number
          created_at?: string
          created_by: string
          discount_percent?: number
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          commission_percent?: number
          created_at?: string
          created_by?: string
          discount_percent?: number
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          color: string
          description: string | null
          emoji: string
          icon_slug: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          description?: string | null
          emoji?: string
          icon_slug?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          description?: string | null
          emoji?: string
          icon_slug?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          moderator_note: string | null
          reason: string
          reporter_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          moderator_note?: string | null
          reason: string
          reporter_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          moderator_note?: string | null
          reason?: string
          reporter_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          published: boolean
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          published?: boolean
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          published?: boolean
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          event_id: string
          id: string
          purchased_at: string
          status: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlist: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          id: string
          is_virtual: boolean
          location: string | null
          price_pence: number
          published: boolean
          requires_recording_consent: boolean
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          virtual_link: string | null
          waitlist_enabled: boolean
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          price_pence?: number
          published?: boolean
          requires_recording_consent?: boolean
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          virtual_link?: string | null
          waitlist_enabled?: boolean
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          price_pence?: number
          published?: boolean
          requires_recording_consent?: boolean
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          virtual_link?: string | null
          waitlist_enabled?: boolean
        }
        Relationships: []
      }
      family_circle_members: {
        Row: {
          circle_id: string
          id: string
          invited_at: string | null
          joined_at: string | null
          member_id: string
          role: string
        }
        Insert: {
          circle_id: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          member_id: string
          role: string
        }
        Update: {
          circle_id?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          member_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "family_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_circles: {
        Row: {
          circle_name: string
          circle_type: string
          created_at: string | null
          creator_id: string
          id: string
        }
        Insert: {
          circle_name: string
          circle_type: string
          created_at?: string | null
          creator_id: string
          id?: string
        }
        Update: {
          circle_name?: string
          circle_type?: string
          created_at?: string | null
          creator_id?: string
          id?: string
        }
        Relationships: []
      }
      family_ritual_completions: {
        Row: {
          completed_at: string | null
          completed_by: string
          family_ritual_id: string
          id: string
          reflection: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by: string
          family_ritual_id: string
          id?: string
          reflection?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string
          family_ritual_id?: string
          id?: string
          reflection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_ritual_completions_family_ritual_id_fkey"
            columns: ["family_ritual_id"]
            isOneToOne: false
            referencedRelation: "family_rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      family_rituals: {
        Row: {
          created_at: string | null
          description: string | null
          family_circle_id: string
          id: string
          reflection_prompt: string | null
          ritual_id: string | null
          title: string
          week_of: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          family_circle_id: string
          id?: string
          reflection_prompt?: string | null
          ritual_id?: string | null
          title: string
          week_of: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          family_circle_id?: string
          id?: string
          reflection_prompt?: string | null
          ritual_id?: string | null
          title?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_rituals_family_circle_id_fkey"
            columns: ["family_circle_id"]
            isOneToOne: false
            referencedRelation: "family_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_rituals_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          description: string | null
          id: string
          is_finance: boolean
          requires_member: boolean
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_finance?: boolean
          requires_member?: boolean
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          is_finance?: boolean
          requires_member?: boolean
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      legacy_goals: {
        Row: {
          created_at: string | null
          currency: string | null
          goal_type: string
          id: string
          notes: string | null
          target_amount: number | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          goal_type: string
          id?: string
          notes?: string | null
          target_amount?: number | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          target_amount?: number | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string | null
          id: string
          lesson_id: string
          updated_at: string | null
          user_id: string
          watch_position: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          id?: string
          lesson_id: string
          updated_at?: string | null
          user_id: string
          watch_position?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          id?: string
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
          watch_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          id: string
          resource_url: string | null
          sort_order: number
          title: string
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          course_id: string
          id?: string
          resource_url?: string | null
          sort_order?: number
          title: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          course_id?: string
          id?: string
          resource_url?: string | null
          sort_order?: number
          title?: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          plan: Database["public"]["Enums"]["membership_plan"]
          status: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan: Database["public"]["Enums"]["membership_plan"]
          status: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id: string
          stripe_subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["membership_plan"]
          status?: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id?: string
          stripe_subscription_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          badges_enabled: boolean | null
          comments_enabled: boolean | null
          event_reminders_enabled: boolean | null
          id: string
          mentions_enabled: boolean | null
          reactions_enabled: boolean | null
          ritual_reminders_enabled: boolean | null
          system_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges_enabled?: boolean | null
          comments_enabled?: boolean | null
          event_reminders_enabled?: boolean | null
          id?: string
          mentions_enabled?: boolean | null
          reactions_enabled?: boolean | null
          ritual_reminders_enabled?: boolean | null
          system_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges_enabled?: boolean | null
          comments_enabled?: boolean | null
          event_reminders_enabled?: boolean | null
          id?: string
          mentions_enabled?: boolean | null
          reactions_enabled?: boolean | null
          ritual_reminders_enabled?: boolean | null
          system_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pathway_steps: {
        Row: {
          id: string
          link_id: string
          link_type: Database["public"]["Enums"]["link_type"]
          pathway_id: string
          sort_order: number
          title: string
        }
        Insert: {
          id?: string
          link_id: string
          link_type: Database["public"]["Enums"]["link_type"]
          pathway_id: string
          sort_order?: number
          title: string
        }
        Update: {
          id?: string
          link_id?: string
          link_type?: Database["public"]["Enums"]["link_type"]
          pathway_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_steps_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathways: {
        Row: {
          accent_colour: string | null
          description: string | null
          icon_slug: string | null
          id: string
          pathway_type: Database["public"]["Enums"]["pathway_type"]
          sort_order: number | null
          title: string
        }
        Insert: {
          accent_colour?: string | null
          description?: string | null
          icon_slug?: string | null
          id?: string
          pathway_type: Database["public"]["Enums"]["pathway_type"]
          sort_order?: number | null
          title: string
        }
        Update: {
          accent_colour?: string | null
          description?: string | null
          icon_slug?: string | null
          id?: string
          pathway_type?: Database["public"]["Enums"]["pathway_type"]
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          post_id: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          hidden: boolean
          id: string
          media_url: string | null
          pinned: boolean
          post_type: Database["public"]["Enums"]["post_type"]
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          hidden?: boolean
          id?: string
          media_url?: string | null
          pinned?: boolean
          post_type: Database["public"]["Enums"]["post_type"]
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          hidden?: boolean
          id?: string
          media_url?: string | null
          pinned?: boolean
          post_type?: Database["public"]["Enums"]["post_type"]
        }
        Relationships: []
      }
      profile_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliate_discount_percent: number | null
          archetype_score: Json | null
          avatar_url: string | null
          bio: string | null
          country_of_origin: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          employment_type: string | null
          facebook_url: string | null
          financial_goals: string[] | null
          fms_confidence: string | null
          fms_last_scored_at: string | null
          fms_lead_type: string | null
          fms_rationale: string | null
          fms_referral_dismissed: boolean | null
          fms_referral_eligible: boolean | null
          fms_score: number | null
          fms_signal_type: string | null
          id: string
          instagram_url: string | null
          interests: string[] | null
          is_legacy_enabled: boolean | null
          life_stage: string | null
          linkedin_url: string | null
          location: string | null
          marital_status: string | null
          number_of_children: number | null
          onboarding_complete: boolean
          pathway_type: Database["public"]["Enums"]["pathway_type"] | null
          post_count: number | null
          profile_complete: boolean | null
          referred_by_affiliate_id: string | null
          ritual_streak: number
          role: Database["public"]["Enums"]["user_role"]
          show_bio: boolean
          show_children: boolean | null
          show_location: boolean
          show_marital_status: boolean | null
          show_social_links: boolean | null
          snapchat_username: string | null
          suspended_at: string | null
          suspended_reason: string | null
          tiktok_url: string | null
          user_id: string
          visible_in_directory: boolean
          website_url: string | null
          years_in_australia: string | null
        }
        Insert: {
          affiliate_discount_percent?: number | null
          archetype_score?: Json | null
          avatar_url?: string | null
          bio?: string | null
          country_of_origin?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          employment_type?: string | null
          facebook_url?: string | null
          financial_goals?: string[] | null
          fms_confidence?: string | null
          fms_last_scored_at?: string | null
          fms_lead_type?: string | null
          fms_rationale?: string | null
          fms_referral_dismissed?: boolean | null
          fms_referral_eligible?: boolean | null
          fms_score?: number | null
          fms_signal_type?: string | null
          id?: string
          instagram_url?: string | null
          interests?: string[] | null
          is_legacy_enabled?: boolean | null
          life_stage?: string | null
          linkedin_url?: string | null
          location?: string | null
          marital_status?: string | null
          number_of_children?: number | null
          onboarding_complete?: boolean
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          post_count?: number | null
          profile_complete?: boolean | null
          referred_by_affiliate_id?: string | null
          ritual_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          show_bio?: boolean
          show_children?: boolean | null
          show_location?: boolean
          show_marital_status?: boolean | null
          show_social_links?: boolean | null
          snapchat_username?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tiktok_url?: string | null
          user_id: string
          visible_in_directory?: boolean
          website_url?: string | null
          years_in_australia?: string | null
        }
        Update: {
          affiliate_discount_percent?: number | null
          archetype_score?: Json | null
          avatar_url?: string | null
          bio?: string | null
          country_of_origin?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          employment_type?: string | null
          facebook_url?: string | null
          financial_goals?: string[] | null
          fms_confidence?: string | null
          fms_last_scored_at?: string | null
          fms_lead_type?: string | null
          fms_rationale?: string | null
          fms_referral_dismissed?: boolean | null
          fms_referral_eligible?: boolean | null
          fms_score?: number | null
          fms_signal_type?: string | null
          id?: string
          instagram_url?: string | null
          interests?: string[] | null
          is_legacy_enabled?: boolean | null
          life_stage?: string | null
          linkedin_url?: string | null
          location?: string | null
          marital_status?: string | null
          number_of_children?: number | null
          onboarding_complete?: boolean
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          post_count?: number | null
          profile_complete?: boolean | null
          referred_by_affiliate_id?: string | null
          ritual_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          show_bio?: boolean
          show_children?: boolean | null
          show_location?: boolean
          show_marital_status?: boolean | null
          show_social_links?: boolean | null
          snapchat_username?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tiktok_url?: string | null
          user_id?: string
          visible_in_directory?: boolean
          website_url?: string | null
          years_in_australia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_affiliate_id_fkey"
            columns: ["referred_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_consents: {
        Row: {
          consented_at: string
          event_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consented_at?: string
          event_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consented_at?: string
          event_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_consents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_completions: {
        Row: {
          completed_at: string
          id: string
          reflection: string | null
          ritual_id: string
          shared_to_feed: boolean
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          reflection?: string | null
          ritual_id: string
          shared_to_feed?: boolean
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          reflection?: string | null
          ritual_id?: string
          shared_to_feed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      rituals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          published: boolean
          reflection_prompt: string | null
          title: string
          week_of: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          reflection_prompt?: string | null
          title: string
          week_of: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          published?: boolean
          reflection_prompt?: string | null
          title?: string
          week_of?: string
        }
        Relationships: []
      }
      thread_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          thread_id: string
          upvotes: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          thread_id: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          thread_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "thread_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_reply_upvotes: {
        Row: {
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_reply_upvotes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "thread_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          body: string
          created_at: string
          forum_id: string
          hidden: boolean
          id: string
          last_reply_at: string | null
          locked: boolean
          pinned: boolean
          reply_count: number
          title: string
          view_count: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          forum_id: string
          hidden?: boolean
          id?: string
          last_reply_at?: string | null
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          title: string
          view_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          forum_id?: string
          hidden?: boolean
          id?: string
          last_reply_at?: string | null
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          title?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "threads_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          location: string | null
          pathway_type: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak: number | null
          show_bio: boolean | null
          show_location: boolean | null
          user_id: string | null
          visible_in_directory: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          location?: string | null
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak?: number | null
          show_bio?: boolean | null
          show_location?: boolean | null
          user_id?: string | null
          visible_in_directory?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          location?: string | null
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak?: number | null
          show_bio?: boolean | null
          show_location?: boolean | null
          user_id?: string | null
          visible_in_directory?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      award_badge: {
        Args: { p_badge_slug: string; p_user_id: string }
        Returns: undefined
      }
      event_tickets_sold: { Args: { event_uuid: string }; Returns: number }
      has_active_membership: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      link_type: "course" | "ritual" | "event"
      membership_plan: "monthly" | "annual"
      membership_status: "active" | "cancelled" | "past_due"
      pathway_type:
        | "foundation"
        | "growth"
        | "abundance"
        | "giver"
        | "keeper"
        | "rebel"
        | "seeker"
        | "achiever"
      post_type: "standard" | "win" | "ritual_share" | "announcement"
      ticket_status: "active" | "refunded" | "cancelled"
      user_role: "guest" | "member" | "moderator" | "admin"
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
      link_type: ["course", "ritual", "event"],
      membership_plan: ["monthly", "annual"],
      membership_status: ["active", "cancelled", "past_due"],
      pathway_type: [
        "foundation",
        "growth",
        "abundance",
        "giver",
        "keeper",
        "rebel",
        "seeker",
        "achiever",
      ],
      post_type: ["standard", "win", "ritual_share", "announcement"],
      ticket_status: ["active", "refunded", "cancelled"],
      user_role: ["guest", "member", "moderator", "admin"],
    },
  },
} as const
