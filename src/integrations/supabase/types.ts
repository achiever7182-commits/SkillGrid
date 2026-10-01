export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          dedupe_key: string | null;
          id: string;
          message: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          message: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          message?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          created_at: string;
          id: string;
          receiver_id: string;
          requester_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          receiver_id: string;
          requester_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          receiver_id?: string;
          requester_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          dedupe_key: string | null;
          id: string;
          link: string | null;
          message: string;
          read: boolean;
          type: string;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          link?: string | null;
          message: string;
          read?: boolean;
          type: string;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          link?: string | null;
          message?: string;
          read?: boolean;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          college: string | null;
          created_at: string;
          full_name: string;
          graduation_year: number | null;
          id: string;
          onboarded: boolean;
          timezone: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          college?: string | null;
          created_at?: string;
          full_name?: string;
          graduation_year?: number | null;
          id: string;
          onboarded?: boolean;
          timezone?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          college?: string | null;
          created_at?: string;
          full_name?: string;
          graduation_year?: number | null;
          id?: string;
          onboarded?: boolean;
          timezone?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          reaction: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          reaction: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          reaction?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          category: string | null;
          color: string;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_instances: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          date: string;
          id: string;
          notes: string | null;
          planned_minutes: number;
          subject_id: string | null;
          task_id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          date: string;
          id?: string;
          notes?: string | null;
          planned_minutes: number;
          subject_id?: string | null;
          task_id: string;
          title: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          date?: string;
          id?: string;
          notes?: string | null;
          planned_minutes?: number;
          subject_id?: string | null;
          task_id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_instances_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_instances_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_instances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          archived: boolean;
          created_at: string;
          days_of_week: number[];
          end_date: string | null;
          id: string;
          planned_minutes: number;
          recurring: boolean;
          start_date: string;
          subject_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          days_of_week?: number[];
          end_date?: string | null;
          id?: string;
          planned_minutes: number;
          recurring?: boolean;
          start_date?: string;
          subject_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          days_of_week?: number[];
          end_date?: string | null;
          id?: string;
          planned_minutes?: number;
          recurring?: boolean;
          start_date?: string;
          subject_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          activity_visibility: string;
          daily_reminders: boolean;
          notify_friend_activity: boolean;
          notify_streaks: boolean;
          profile_visibility: string;
          progress_visibility: string;
          streak_threshold: number;
          user_id: string;
        };
        Insert: {
          activity_visibility?: string;
          daily_reminders?: boolean;
          notify_friend_activity?: boolean;
          notify_streaks?: boolean;
          profile_visibility?: string;
          progress_visibility?: string;
          streak_threshold?: number;
          user_id: string;
        };
        Update: {
          activity_visibility?: string;
          daily_reminders?: boolean;
          notify_friend_activity?: boolean;
          notify_streaks?: boolean;
          profile_visibility?: string;
          progress_visibility?: string;
          streak_threshold?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean };
      basic_profiles: {
        Args: { _ids: string[] };
        Returns: {
          avatar_url: string;
          full_name: string;
          id: string;
          username: string;
        }[];
      };
      can_view: { Args: { _kind: string; _owner: string }; Returns: boolean };
      get_daily_stats: {
        Args: { _from: string; _to: string; _user: string };
        Returns: {
          completed: number;
          day: string;
          done_tasks: number;
          planned: number;
          total_tasks: number;
        }[];
      };
      get_streak_threshold: { Args: { _user: string }; Returns: number };
      get_subject_stats: {
        Args: { _from: string; _to: string; _user: string };
        Returns: {
          color: string;
          completed: number;
          name: string;
          planned: number;
          subject_id: string;
        }[];
      };
      profile_id_by_username: { Args: { _username: string }; Returns: string };
      search_users: {
        Args: { _q: string };
        Returns: {
          avatar_url: string;
          full_name: string;
          id: string;
          username: string;
        }[];
      };
      username_available: { Args: { _username: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
