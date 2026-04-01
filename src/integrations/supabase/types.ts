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
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
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
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
          watch_position: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
          watch_position?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
          watch_position?: number
        }
        Relationships: [
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
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
          description: string | null
          id: string
          pathway_type: Database["public"]["Enums"]["pathway_type"]
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          pathway_type: Database["public"]["Enums"]["pathway_type"]
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          pathway_type?: Database["public"]["Enums"]["pathway_type"]
          title?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          location: string | null
          onboarding_complete: boolean
          pathway_type: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak: number
          role: Database["public"]["Enums"]["user_role"]
          show_bio: boolean
          show_location: boolean
          user_id: string
          visible_in_directory: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          location?: string | null
          onboarding_complete?: boolean
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          show_bio?: boolean
          show_location?: boolean
          user_id: string
          visible_in_directory?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          location?: string | null
          onboarding_complete?: boolean
          pathway_type?: Database["public"]["Enums"]["pathway_type"] | null
          ritual_streak?: number
          role?: Database["public"]["Enums"]["user_role"]
          show_bio?: boolean
          show_location?: boolean
          user_id?: string
          visible_in_directory?: boolean
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      event_tickets_sold: { Args: { event_uuid: string }; Returns: number }
      has_active_membership: { Args: { user_uuid: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      link_type: "course" | "ritual" | "event"
      membership_plan: "monthly" | "annual"
      membership_status: "active" | "cancelled" | "past_due"
      pathway_type: "foundation" | "growth" | "abundance"
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
      pathway_type: ["foundation", "growth", "abundance"],
      post_type: ["standard", "win", "ritual_share", "announcement"],
      ticket_status: ["active", "refunded", "cancelled"],
      user_role: ["guest", "member", "moderator", "admin"],
    },
  },
} as const
