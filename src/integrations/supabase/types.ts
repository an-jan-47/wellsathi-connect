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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          clinic_id: string
          doctor_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          patient_name: string
          patient_phone: string
          status: Database["public"]["Enums"]["appointment_status"]
          time: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_id: string
          doctor_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          patient_name: string
          patient_phone: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string
          doctor_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          patient_name?: string
          patient_phone?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          created_at: string
          fee: number
          id: string
          service_name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          fee?: number
          id?: string
          service_name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          fee?: number
          id?: string
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string
          certificates: string[] | null
          city: string
          created_at: string
          description: string | null
          fees: number
          id: string
          image_url: string | null
          images: string[] | null
          is_approved: boolean
          name: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          registration_number: string | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          address: string
          certificates?: string[] | null
          city: string
          created_at?: string
          description?: string | null
          fees?: number
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_approved?: boolean
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string
          certificates?: string[] | null
          city?: string
          created_at?: string
          description?: string | null
          fees?: number
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_approved?: boolean
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          registration_number?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          bio: string | null
          clinic_id: string
          created_at: string
          fee: number | null
          id: string
          image_url: string | null
          name: string
          specialization: string
        }
        Insert: {
          bio?: string | null
          clinic_id: string
          created_at?: string
          fee?: number | null
          id?: string
          image_url?: string | null
          name: string
          specialization: string
        }
        Update: {
          bio?: string | null
          clinic_id?: string
          created_at?: string
          fee?: number | null
          id?: string
          image_url?: string | null
          name?: string
          specialization?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          clinic_id: string
          created_at: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_working_day: boolean | null
          slot_duration: number
          start_time: string
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clinic_id: string
          created_at?: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_working_day?: boolean | null
          slot_duration?: number
          start_time: string
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clinic_id?: string
          created_at?: string | null
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_working_day?: boolean | null
          slot_duration?: number
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_slot_overrides: {
        Row: {
          created_at: string | null
          doctor_id: string
          end_time: string | null
          id: string
          is_available: boolean | null
          override_date: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          override_date: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          override_date?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_slot_overrides_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          id: string
          appointment_id: string
          service_id: string
          fee: number
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          service_id: string
          fee?: number
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          service_id?: string
          fee?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "clinic_services"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          id: string
          clinic_id: string
          full_name: string
          phone: string | null
          email: string | null
          condition: string | null
          status: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          full_name: string
          phone?: string | null
          email?: string | null
          condition?: string | null
          status?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          condition?: string | null
          status?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }

    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_clinic_role: { Args: { _user_id: string }; Returns: undefined }
      book_appointment: {
        Args: {
          _clinic_id: string
          _slot_id: string
          _patient_name: string
          _patient_phone: string
          _date: string
          _time: string
          _notes?: string | null
          _doctor_id?: string | null
          _total_fee?: number
        }
        Returns: string
      }
      cancel_appointment: {
        Args: { _appointment_id: string }
        Returns: undefined
      }
      update_appointment_status: {
        Args: {
          _appointment_id: string
          _new_status: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_doctor_slots: {
        Args: {
          p_doctor_id: string,
          p_date: string,
        },
        Returns: {
          start_time: string,
          end_time: string,
          is_available: boolean,
        }[],
      },
      get_clinic_review_stats: {
        Args: { p_clinic_id: string }
        Returns: Json
      }
      get_clinic_patients_list: {
        Args: {
          p_clinic_id: string
          p_search?: string | null
          p_status?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      owns_clinic: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "clinic" | "admin"
      appointment_status: "pending" | "confirmed" | "cancelled"
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
      app_role: ["user", "clinic", "admin"],
      appointment_status: ["pending", "confirmed", "cancelled"],
    },
  },
} as const
