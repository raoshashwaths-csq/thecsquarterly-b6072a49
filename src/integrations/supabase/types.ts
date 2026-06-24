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
      article_translations: {
        Row: {
          article_id: string | null
          created_at: string
          id: string
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_content_hash: string | null
          status: string
          translated_at: string | null
          translated_content: string | null
          translated_subtitle: string | null
          translated_title: string | null
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          id?: string
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string
          translated_at?: string | null
          translated_content?: string | null
          translated_subtitle?: string | null
          translated_title?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          id?: string
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string
          translated_at?: string | null
          translated_content?: string | null
          translated_subtitle?: string | null
          translated_title?: string | null
          updated_at?: string
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
          account_manager: string | null
          active_headcount: number | null
          actual_go_live: string | null
          arr: number
          associate_director: string | null
          backup_owner: string | null
          blocker: string | null
          carr: number | null
          champion: string | null
          contract_renewal_date: string | null
          country: string | null
          created_at: string
          cs_transition_start: string | null
          csm_name: string | null
          csm_sentiment: string | null
          customer_city: string | null
          customer_success: string | null
          da_project_manager: string | null
          economic_buyer: string | null
          existing_crm: string | null
          existing_erp: string | null
          final_cs_nps: number | null
          health: number
          id: string
          implementation_progress: number | null
          industry: string | null
          invoiced_arr: number | null
          journey_stage: string | null
          key_account_manager: string | null
          marquee_client: boolean | null
          name: string
          notes: string | null
          payroll_service_type: string | null
          planned_go_live: string | null
          project_manager_ii: string | null
          qbr_status: string
          region: string | null
          renewal_quarter: string
          server_location: string | null
          server_name: string | null
          sub_region: string | null
          tier: string
          ucc: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_manager?: string | null
          active_headcount?: number | null
          actual_go_live?: string | null
          arr?: number
          associate_director?: string | null
          backup_owner?: string | null
          blocker?: string | null
          carr?: number | null
          champion?: string | null
          contract_renewal_date?: string | null
          country?: string | null
          created_at?: string
          cs_transition_start?: string | null
          csm_name?: string | null
          csm_sentiment?: string | null
          customer_city?: string | null
          customer_success?: string | null
          da_project_manager?: string | null
          economic_buyer?: string | null
          existing_crm?: string | null
          existing_erp?: string | null
          final_cs_nps?: number | null
          health?: number
          id?: string
          implementation_progress?: number | null
          industry?: string | null
          invoiced_arr?: number | null
          journey_stage?: string | null
          key_account_manager?: string | null
          marquee_client?: boolean | null
          name: string
          notes?: string | null
          payroll_service_type?: string | null
          planned_go_live?: string | null
          project_manager_ii?: string | null
          qbr_status?: string
          region?: string | null
          renewal_quarter?: string
          server_location?: string | null
          server_name?: string | null
          sub_region?: string | null
          tier?: string
          ucc?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_manager?: string | null
          active_headcount?: number | null
          actual_go_live?: string | null
          arr?: number
          associate_director?: string | null
          backup_owner?: string | null
          blocker?: string | null
          carr?: number | null
          champion?: string | null
          contract_renewal_date?: string | null
          country?: string | null
          created_at?: string
          cs_transition_start?: string | null
          csm_name?: string | null
          csm_sentiment?: string | null
          customer_city?: string | null
          customer_success?: string | null
          da_project_manager?: string | null
          economic_buyer?: string | null
          existing_crm?: string | null
          existing_erp?: string | null
          final_cs_nps?: number | null
          health?: number
          id?: string
          implementation_progress?: number | null
          industry?: string | null
          invoiced_arr?: number | null
          journey_stage?: string | null
          key_account_manager?: string | null
          marquee_client?: boolean | null
          name?: string
          notes?: string | null
          payroll_service_type?: string | null
          planned_go_live?: string | null
          project_manager_ii?: string | null
          qbr_status?: string
          region?: string | null
          renewal_quarter?: string
          server_location?: string | null
          server_name?: string | null
          sub_region?: string | null
          tier?: string
          ucc?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cs_contracts: {
        Row: {
          account_id: string
          auto_renewal: boolean
          created_at: string
          doc_type: string
          executed_on: string | null
          file_name: string | null
          file_path: string | null
          id: string
          mime_type: string | null
          notice_days: number
          signed_value_cents: number | null
          size_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          auto_renewal?: boolean
          created_at?: string
          doc_type?: string
          executed_on?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          notice_days?: number
          signed_value_cents?: number | null
          size_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          auto_renewal?: boolean
          created_at?: string
          doc_type?: string
          executed_on?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          notice_days?: number
          signed_value_cents?: number | null
          size_bytes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_stakeholders: {
        Row: {
          account_id: string
          buying_role: string
          contact_name: string
          created_at: string
          id: string
          influence: string
          sentiment: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          buying_role?: string
          contact_name: string
          created_at?: string
          id?: string
          influence?: string
          sentiment?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          buying_role?: string
          contact_name?: string
          created_at?: string
          id?: string
          influence?: string
          sentiment?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_stakeholders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ctas: {
        Row: {
          account_id: string | null
          account_name: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          completed_at: string | null
          completion_note: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          cta_type: string
          description: string | null
          due_date: string | null
          id: string
          outcome: string | null
          priority: string
          source: string
          source_ref: string | null
          status: string
          team_id: string | null
          team_wide: boolean
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by: string
          created_by_name?: string | null
          cta_type: string
          description?: string | null
          due_date?: string | null
          id?: string
          outcome?: string | null
          priority?: string
          source?: string
          source_ref?: string | null
          status?: string
          team_id?: string | null
          team_wide?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          cta_type?: string
          description?: string | null
          due_date?: string | null
          id?: string
          outcome?: string | null
          priority?: string
          source?: string
          source_ref?: string | null
          status?: string
          team_id?: string | null
          team_wide?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ctas_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ctas_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      lumi_events: {
        Row: {
          briefing_shown: boolean
          created_at: string
          event: string
          id: string
          message_count: number
          meta: Json | null
          tree_id: string | null
          user_id: string | null
        }
        Insert: {
          briefing_shown?: boolean
          created_at?: string
          event: string
          id?: string
          message_count?: number
          meta?: Json | null
          tree_id?: string | null
          user_id?: string | null
        }
        Update: {
          briefing_shown?: boolean
          created_at?: string
          event?: string
          id?: string
          message_count?: number
          meta?: Json | null
          tree_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      map_comments: {
        Row: {
          author_name: string | null
          author_type: string
          content: string
          created_at: string
          id: string
          map_id: string
          milestone_id: string | null
        }
        Insert: {
          author_name?: string | null
          author_type: string
          content: string
          created_at?: string
          id?: string
          map_id: string
          milestone_id?: string | null
        }
        Update: {
          author_name?: string | null
          author_type?: string
          content?: string
          created_at?: string
          id?: string
          map_id?: string
          milestone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "map_comments_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_comments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "map_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      map_milestones: {
        Row: {
          assigned_to: string | null
          blocked_reason: string | null
          completed_at: string | null
          completion_note: string | null
          created_at: string
          description: string | null
          due_days_from_start: number | null
          health_score_impact: number
          id: string
          map_id: string
          milestone_order: number
          owner: string
          phase_id: string
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          description?: string | null
          due_days_from_start?: number | null
          health_score_impact?: number
          id?: string
          map_id: string
          milestone_order: number
          owner?: string
          phase_id: string
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          description?: string | null
          due_days_from_start?: number | null
          health_score_impact?: number
          id?: string
          map_id?: string
          milestone_order?: number
          owner?: string
          phase_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_milestones_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "map_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      map_phases: {
        Row: {
          color: string
          created_at: string
          id: string
          is_value_milestone: boolean
          map_id: string
          phase_order: number
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_value_milestone?: boolean
          map_id: string
          phase_order: number
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_value_milestone?: boolean
          map_id?: string
          phase_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_phases_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          account_id: string | null
          account_industry: string | null
          account_name: string | null
          account_tier: string | null
          actual_ttv_days: number | null
          benchmark_ttv_days: number | null
          completed_at: string | null
          contract_start_date: string | null
          created_at: string
          csm_id: string
          csm_name: string | null
          customer_email: string | null
          id: string
          last_customer_view: string | null
          lumi_generated: boolean
          share_enabled: boolean
          share_token: string
          status: string
          target_value_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_industry?: string | null
          account_name?: string | null
          account_tier?: string | null
          actual_ttv_days?: number | null
          benchmark_ttv_days?: number | null
          completed_at?: string | null
          contract_start_date?: string | null
          created_at?: string
          csm_id: string
          csm_name?: string | null
          customer_email?: string | null
          id?: string
          last_customer_view?: string | null
          lumi_generated?: boolean
          share_enabled?: boolean
          share_token?: string
          status?: string
          target_value_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_industry?: string | null
          account_name?: string | null
          account_tier?: string | null
          actual_ttv_days?: number | null
          benchmark_ttv_days?: number | null
          completed_at?: string | null
          contract_start_date?: string | null
          created_at?: string
          csm_id?: string
          csm_name?: string | null
          customer_email?: string | null
          id?: string
          last_customer_view?: string | null
          lumi_generated?: boolean
          share_enabled?: boolean
          share_token?: string
          status?: string
          target_value_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maps_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          is_team_leader: boolean
          persona: Database["public"]["Enums"]["user_persona"] | null
          seniority: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_team_leader?: boolean
          persona?: Database["public"]["Enums"]["user_persona"] | null
          seniority?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_team_leader?: boolean
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
          account_id: string | null
          context: Json
          cost_micros: number | null
          created_at: string
          id: string
          latency_ms: number | null
          model: string | null
          node_id: string
          shared: boolean
          tagged_at: string | null
          tagged_stakeholder: string | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
          witty: boolean
          zones: Json
        }
        Insert: {
          account_id?: string | null
          context?: Json
          cost_micros?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          node_id: string
          shared?: boolean
          tagged_at?: string | null
          tagged_stakeholder?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
          witty?: boolean
          zones: Json
        }
        Update: {
          account_id?: string | null
          context?: Json
          cost_micros?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          node_id?: string
          shared?: boolean
          tagged_at?: string | null
          tagged_stakeholder?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
          witty?: boolean
          zones?: Json
        }
        Relationships: [
          {
            foreignKeyName: "q_runs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cs_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      rl_accounts: {
        Row: {
          contract_value: number
          created_at: string
          current_roi: number
          id: string
          name: string
          owner_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          contract_value?: number
          created_at?: string
          current_roi?: number
          id?: string
          name: string
          owner_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          contract_value?: number
          created_at?: string
          current_roi?: number
          id?: string
          name?: string
          owner_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rl_intelligence_signals: {
        Row: {
          account_id: string
          created_at: string
          description: string
          id: string
          owner_id: string
          severity: string
          signal_type: string
          status: string
          team_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description: string
          id?: string
          owner_id: string
          severity?: string
          signal_type: string
          status?: string
          team_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          severity?: string
          signal_type?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rl_intelligence_signals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "rl_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rl_stakeholders: {
        Row: {
          account_id: string
          created_at: string
          current_title: string | null
          email: string | null
          first_name: string
          id: string
          owner_id: string
          team_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          current_title?: string | null
          email?: string | null
          first_name: string
          id?: string
          owner_id: string
          team_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          current_title?: string | null
          email?: string | null
          first_name?: string
          id?: string
          owner_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rl_stakeholders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "rl_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rl_value_ledger: {
        Row: {
          account_id: string
          created_at: string
          financial_value_override: number | null
          id: string
          logged_at: string
          metric_type: string
          owner_id: string
          quantity_logged: number
          team_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          financial_value_override?: number | null
          id?: string
          logged_at?: string
          metric_type: string
          owner_id: string
          quantity_logged?: number
          team_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          financial_value_override?: number | null
          id?: string
          logged_at?: string
          metric_type?: string
          owner_id?: string
          quantity_logged?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rl_value_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "rl_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rl_value_metrics: {
        Row: {
          created_at: string
          hourly_multiplier: number
          id: string
          metric_name: string
          owner_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          hourly_multiplier?: number
          id?: string
          metric_name: string
          owner_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          hourly_multiplier?: number
          id?: string
          metric_name?: string
          owner_id?: string
          team_id?: string
        }
        Relationships: []
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
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          designation: string | null
          environment: string
          id: string
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          designation?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          designation?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          price_id?: string | null
          product_id?: string | null
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
      translation_glossary: {
        Row: {
          category: string | null
          created_at: string
          fixed_translations: Json
          id: string
          notes: string | null
          pending_review: boolean
          protection_type: string
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          fixed_translations?: Json
          id?: string
          notes?: string | null
          pending_review?: boolean
          protection_type: string
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          fixed_translations?: Json
          id?: string
          notes?: string | null
          pending_review?: boolean
          protection_type?: string
          term?: string
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
      user_daily_sentiment: {
        Row: {
          calculated_sentiment_score: string
          created_at: string
          date: string
          flagged_keywords: string[]
          id: string
          raw_text_feedback: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_sentiment_score: string
          created_at?: string
          date: string
          flagged_keywords?: string[]
          id?: string
          raw_text_feedback: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_sentiment_score?: string
          created_at?: string
          date?: string
          flagged_keywords?: string[]
          id?: string
          raw_text_feedback?: string
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
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
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
