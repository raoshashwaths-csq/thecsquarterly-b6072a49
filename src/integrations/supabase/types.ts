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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          ip: string | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      benchmark_drops: {
        Row: {
          created_at: string
          id: string
          metric: string
          notes: string | null
          period: string
          published: boolean
          segment: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          notes?: string | null
          period: string
          published?: boolean
          segment?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          notes?: string | null
          period?: string
          published?: boolean
          segment?: string | null
          value?: number
        }
        Relationships: []
      }
      cs_account_events: {
        Row: {
          account_id: string
          created_at: string
          id: string
          kind: string
          occurred_at: string
          payload: Json
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          kind: string
          occurred_at?: string
          payload?: Json
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          kind?: string
          occurred_at?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_account_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_accounts: {
        Row: {
          arr: number
          blocker: string | null
          champion: string | null
          created_at: string
          economic_buyer: string | null
          health: number
          id: string
          name: string
          notes: string | null
          qbr_status: string
          renewal_quarter: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arr?: number
          blocker?: string | null
          champion?: string | null
          created_at?: string
          economic_buyer?: string | null
          health?: number
          id?: string
          name: string
          notes?: string | null
          qbr_status?: string
          renewal_quarter?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arr?: number
          blocker?: string | null
          champion?: string | null
          created_at?: string
          economic_buyer?: string | null
          health?: number
          id?: string
          name?: string
          notes?: string | null
          qbr_status?: string
          renewal_quarter?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      directory_profiles: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string
          credentials: string[]
          headshot_url: string | null
          id: string
          name: string
          public: boolean
          title: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string
          credentials?: string[]
          headshot_url?: string | null
          id?: string
          name: string
          public?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string
          credentials?: string[]
          headshot_url?: string | null
          id?: string
          name?: string
          public?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          apply_url: string | null
          click_count: number
          created_at: string
          description: string | null
          employer_name: string
          featured: boolean
          id: string
          job_title: string
          package_tier: number
          pinned: boolean
          status: string
          submitted_by: string | null
          submitted_email: string | null
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          click_count?: number
          created_at?: string
          description?: string | null
          employer_name: string
          featured?: boolean
          id?: string
          job_title: string
          package_tier?: number
          pinned?: boolean
          status?: string
          submitted_by?: string | null
          submitted_email?: string | null
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          click_count?: number
          created_at?: string
          description?: string | null
          employer_name?: string
          featured?: boolean
          id?: string
          job_title?: string
          package_tier?: number
          pinned?: boolean
          status?: string
          submitted_by?: string | null
          submitted_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      playbooks: {
        Row: {
          body: string
          category: string
          cover_image_url: string | null
          created_at: string
          id: string
          included_in_vanguard: boolean
          pages: number
          price_cents: number
          published: boolean
          published_at: string
          slug: string
          summary: string
          title: string
        }
        Insert: {
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          included_in_vanguard?: boolean
          pages?: number
          price_cents?: number
          published?: boolean
          published_at?: string
          slug: string
          summary: string
          title: string
        }
        Update: {
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          included_in_vanguard?: boolean
          pages?: number
          price_cents?: number
          published?: boolean
          published_at?: string
          slug?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string
          body: string
          body_mckinsey: string | null
          body_wodehouse: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          hero_prompt: string | null
          id: string
          is_premium: boolean
          published: boolean
          published_at: string
          read_minutes: number
          section: string
          series_part: number | null
          series_slug: string | null
          series_title: string | null
          series_total: number | null
          slug: string
          sources: string | null
          subtitle: string | null
          tier: string
          title: string
          title_mckinsey: string | null
          title_wodehouse: string | null
        }
        Insert: {
          author?: string
          body: string
          body_mckinsey?: string | null
          body_wodehouse?: string | null
          category: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          hero_prompt?: string | null
          id?: string
          is_premium?: boolean
          published?: boolean
          published_at?: string
          read_minutes?: number
          section?: string
          series_part?: number | null
          series_slug?: string | null
          series_title?: string | null
          series_total?: number | null
          slug: string
          sources?: string | null
          subtitle?: string | null
          tier?: string
          title: string
          title_mckinsey?: string | null
          title_wodehouse?: string | null
        }
        Update: {
          author?: string
          body?: string
          body_mckinsey?: string | null
          body_wodehouse?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          hero_prompt?: string | null
          id?: string
          is_premium?: boolean
          published?: boolean
          published_at?: string
          read_minutes?: number
          section?: string
          series_part?: number | null
          series_slug?: string | null
          series_title?: string | null
          series_total?: number | null
          slug?: string
          sources?: string | null
          subtitle?: string | null
          tier?: string
          title?: string
          title_mckinsey?: string | null
          title_wodehouse?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          persona: Database["public"]["Enums"]["user_persona"] | null
          seniority: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          persona?: Database["public"]["Enums"]["user_persona"] | null
          seniority?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          persona?: Database["public"]["Enums"]["user_persona"] | null
          seniority?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          item_id: string
          item_type: string
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          status?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      q_runs: {
        Row: {
          context: Json
          created_at: string
          id: string
          node_id: string
          shared: boolean
          user_id: string
          witty: boolean
          zones: Json
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          node_id: string
          shared?: boolean
          user_id: string
          witty?: boolean
          zones: Json
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          node_id?: string
          shared?: boolean
          user_id?: string
          witty?: boolean
          zones?: Json
        }
        Relationships: []
      }
      reading_sequences: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          owner_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          owner_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          owner_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sequences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          segment: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          segment?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          segment?: string | null
          source?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          agent_score: number | null
          answers: Json
          company: string | null
          created_at: string
          dimension_scores: Json | null
          email: string
          foundational_score: number | null
          hcm_status: string | null
          id: string
          name: string | null
          report_unlocked: boolean
          role: string | null
          score: number
          segment: string | null
          tier: string
          title: string | null
        }
        Insert: {
          agent_score?: number | null
          answers: Json
          company?: string | null
          created_at?: string
          dimension_scores?: Json | null
          email: string
          foundational_score?: number | null
          hcm_status?: string | null
          id?: string
          name?: string | null
          report_unlocked?: boolean
          role?: string | null
          score: number
          segment?: string | null
          tier: string
          title?: string | null
        }
        Update: {
          agent_score?: number | null
          answers?: Json
          company?: string | null
          created_at?: string
          dimension_scores?: Json | null
          email?: string
          foundational_score?: number | null
          hcm_status?: string | null
          id?: string
          name?: string | null
          report_unlocked?: boolean
          role?: string | null
          score?: number
          segment?: string | null
          tier?: string
          title?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_annotations: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string | null
          slug: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          slug: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          slug?: string
          text?: string
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
      user_workspace_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          size_bytes: number | null
          tag: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          size_bytes?: number | null
          tag?: string
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          tag?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "subscriber"
      user_persona:
        | "csm"
        | "senior_csm"
        | "manager"
        | "director"
        | "vp"
        | "recruiter"
        | "team_lead"
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
      app_role: ["admin", "subscriber"],
      user_persona: [
        "csm",
        "senior_csm",
        "manager",
        "director",
        "vp",
        "recruiter",
        "team_lead",
      ],
    },
  },
} as const
