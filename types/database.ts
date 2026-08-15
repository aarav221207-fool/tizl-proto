export type UserRole = 'customer' | 'cook' | 'admin';

export type BookingStatus =
  | 'pending_confirmation'
  | 'searching'
  | 'matched'
  | 'accepted'
  | 'cook_assigned'
  | 'cook_arriving'
  | 'cooking'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type DispatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phone?: string | null;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          title: string | null;
          house_number: string | null;
          street: string | null;
          landmark: string | null;
          locality: string | null;
          city_id: string | null;
          pincode: string | null;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          title?: string | null;
          house_number?: string | null;
          street?: string | null;
          landmark?: string | null;
          locality?: string | null;
          city_id?: string | null;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          title?: string | null;
          house_number?: string | null;
          street?: string | null;
          landmark?: string | null;
          locality?: string | null;
          city_id?: string | null;
          pincode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          profile_id: string;
          designation: string | null;
          permissions: Record<string, boolean>;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          designation?: string | null;
          permissions?: Record<string, boolean>;
          created_at?: string;
        };
        Update: {
          designation?: string | null;
          permissions?: Record<string, boolean>;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          profile_id: string | null;
          event_name: string;
          event_data: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          event_name: string;
          event_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          event_name?: string;
          event_data?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          message?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          profile_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      booking_cancellations: {
        Row: {
          id: string;
          booking_id: string;
          cancelled_by: string | null;
          reason: string | null;
          refund_required: boolean;
          cancelled_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          cancelled_by?: string | null;
          reason?: string | null;
          refund_required?: boolean;
          cancelled_at?: string;
        };
        Update: {
          reason?: string | null;
          refund_required?: boolean;
        };
        Relationships: [];
      };
      booking_dispatch: {
        Row: {
          id: string;
          booking_id: string;
          cook_id: string;
          distance_km: number | null;
          estimated_arrival_minutes: number | null;
          status: DispatchStatus;
          expires_at: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          cook_id: string;
          distance_km?: number | null;
          estimated_arrival_minutes?: number | null;
          status?: DispatchStatus;
          expires_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: DispatchStatus;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      booking_history: {
        Row: {
          id: string;
          booking_id: string;
          old_status: BookingStatus | null;
          new_status: BookingStatus;
          changed_by: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          old_status?: BookingStatus | null;
          new_status: BookingStatus;
          changed_by?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      booking_notes: {
        Row: {
          id: string;
          booking_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          author_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: {
          note?: string;
        };
        Relationships: [];
      };
      booking_photos: {
        Row: {
          id: string;
          booking_id: string;
          uploaded_by: string | null;
          image_url: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          uploaded_by?: string | null;
          image_url: string;
          uploaded_at?: string;
        };
        Update: {
          image_url?: string;
        };
        Relationships: [];
      };
      booking_timeline: {
        Row: {
          id: string;
          booking_id: string;
          event_title: string;
          event_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          event_title: string;
          event_description?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          cook_id: string | null;
          service_id: string;
          address_id: string;
          booking_date: string;
          start_time: string;
          duration_hours: number;
          guest_count: number;
          cooking_notes: string | null;
          status: BookingStatus;
          hourly_rate: number;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          platform_fee: number;
          total_amount: number;
          otp: string | null;
          otp_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_number: string;
          customer_id: string;
          cook_id?: string | null;
          service_id: string;
          address_id: string;
          booking_date: string;
          start_time: string;
          duration_hours: number;
          guest_count?: number;
          cooking_notes?: string | null;
          status?: BookingStatus;
          hourly_rate: number;
          subtotal: number;
          discount_amount?: number;
          tax_amount?: number;
          platform_fee?: number;
          total_amount: number;
          otp?: string | null;
          otp_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cook_id?: string | null;
          status?: BookingStatus;
          otp?: string | null;
          otp_verified?: boolean;
          cooking_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          name: string;
          state: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          state?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      cooks: {
        Row: {
          id: string;
          profile_id: string;
          display_name: string;
          bio: string | null;
          experience_years: number | null;
          hourly_rate: number;
          city_id: string;
          average_rating: number | null;
          total_reviews: number | null;
          verification_status: string | null;
          is_approved: boolean | null;
          is_available: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          display_name: string;
          bio?: string | null;
          experience_years?: number | null;
          hourly_rate: number;
          city_id: string;
          average_rating?: number | null;
          total_reviews?: number | null;
          verification_status?: string | null;
          is_approved?: boolean | null;
          is_available?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          display_name?: string;
          bio?: string | null;
          experience_years?: number | null;
          hourly_rate?: number;
          city_id?: string;
          average_rating?: number | null;
          total_reviews?: number | null;
          verification_status?: string | null;
          is_approved?: boolean | null;
          is_available?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cook_availability: {
        Row: {
          id: string;
          cook_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
        };
        Relationships: [];
      };
      cook_bank_details: {
        Row: {
          id: string;
          cook_id: string;
          account_number: string;
          ifsc_code: string;
          bank_name: string;
          account_holder_name: string;
          upi_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          account_number: string;
          ifsc_code: string;
          bank_name: string;
          account_holder_name: string;
          upi_id?: string | null;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          account_number?: string;
          ifsc_code?: string;
          bank_name?: string;
          account_holder_name?: string;
          upi_id?: string | null;
        };
        Relationships: [];
      };
      cook_certifications: {
        Row: {
          id: string;
          cook_id: string;
          title: string;
          certificate_url: string | null;
          issued_by: string | null;
          issue_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          title: string;
          certificate_url?: string | null;
          issued_by?: string | null;
          issue_date?: string | null;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          title?: string;
          certificate_url?: string | null;
          issued_by?: string | null;
          issue_date?: string | null;
        };
        Relationships: [];
      };
      cook_cuisines: {
        Row: {
          id: string;
          cook_id: string;
          cuisine_name: string;
          is_specialty: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          cuisine_name: string;
          is_specialty?: boolean;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          cuisine_name?: string;
          is_specialty?: boolean;
        };
        Relationships: [];
      };
      cook_documents: {
        Row: {
          id: string;
          cook_id: string;
          document_type: string;
          document_url: string;
          verification_status: string;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          document_type: string;
          document_url: string;
          verification_status?: string;
          remarks?: string | null;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          document_type?: string;
          document_url?: string;
          verification_status?: string;
          remarks?: string | null;
        };
        Relationships: [];
      };
      cook_languages: {
        Row: {
          id: string;
          cook_id: string;
          language: string;
          proficiency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cook_id: string;
          language: string;
          proficiency?: string | null;
          created_at?: string;
        };
        Update: {
          cook_id?: string;
          language?: string;
          proficiency?: string | null;
        };
        Relationships: [];
      };
      saved_cooks: {
        Row: {
          id: string;
          customer_id: string;
          cook_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          cook_id: string;
          created_at?: string;
        };
        Update: {
          customer_id?: string;
          cook_id?: string;
        };
        Relationships: [];
      };
      customer_details: {
        Row: {
          id: string;
          customer_id: string;
          dietary_preferences: string[] | null;
          allergies: string[] | null;
          house_type: string | null;
          kitchen_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          dietary_preferences?: string[] | null;
          allergies?: string[] | null;
          house_type?: string | null;
          kitchen_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          dietary_preferences?: string[] | null;
          allergies?: string[] | null;
          house_type?: string | null;
          kitchen_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          provider: string;
          provider_order_id: string;
          provider_payment_id: string | null;
          provider_signature: string | null;
          txn_token: string | null;
          bank_txn_id: string | null;
          raw_response: Record<string, unknown> | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          method: string | null;
          refund_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          provider?: string;
          provider_order_id: string;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          txn_token?: string | null;
          bank_txn_id?: string | null;
          raw_response?: Record<string, unknown> | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          method?: string | null;
          refund_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          provider_order_id?: string;
          provider_payment_id?: string | null;
          provider_signature?: string | null;
          txn_token?: string | null;
          bank_txn_id?: string | null;
          raw_response?: Record<string, unknown> | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          method?: string | null;
          refund_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          cook_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          cook_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_price: number;
          duration_hours: number;
          category: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          base_price: number;
          duration_hours: number;
          category: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          base_price?: number;
          duration_hours?: number;
          category?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
