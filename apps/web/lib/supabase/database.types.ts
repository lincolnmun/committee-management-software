// Hand-authored to match supabase/migrations/20260721000001_initial_schema.sql.
// Regenerate with `supabase gen types typescript` once a project is linked,
// keeping this file's shape as the source of truth in the meantime.

// Mirrors the language_code enum. 'en'/'es' have translation files at
// launch; the rest are reserved so a new locale JSON file is all that's
// needed later, no schema change. 'hi-Latn'/'zh-Latn' are the Latin-script
// (romanized/Pinyin) variants of Hindi/Mandarin.
export type LanguageCode =
  | "en" | "es" | "fr" | "de" | "nl"
  | "zh" | "zh-Latn"
  | "ar" | "pt"
  | "hi" | "hi-Latn"
  | "ru" | "ja" | "ko" | "it" | "tr"
  | "bn" | "ur" | "id" | "vi" | "fa" | "sw" | "th" | "pl";
export type CommitteeRole = "chair" | "delegate" | "observer";
export type SessionMode =
  | "gsl"
  | "moderated_caucus"
  | "unmoderated_caucus"
  | "voting_procedure"
  | "suspended"
  | "not_started";
export type ListType = "gsl" | "moderated_caucus";
export type SpeakerStatus = "waiting" | "speaking" | "done" | "withdrawn";
export type MotionType =
  | "point_of_order"
  | "point_of_personal_privilege"
  | "point_of_inquiry"
  | "open_gsl"
  | "close_gsl"
  | "extend_gsl"
  | "moderated_caucus"
  | "unmoderated_caucus"
  | "introduce_draft_resolution"
  | "introduce_amendment"
  | "vote_on_resolution"
  | "vote_on_amendment"
  | "other";
export type MotionStatus = "pending" | "approved" | "rejected" | "in_vote" | "closed";
export type VoteValue = "for" | "against" | "abstain";
export type RequestType = "bathroom" | "point_of_information" | "chair_assistance" | "other";
export type RequestStatus = "pending" | "approved" | "held" | "denied";
export type DocType = "resolution" | "amendment" | "position_paper" | "other";
export type InviteStatus = "pending" | "claimed" | "revoked";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          display_name: string;
          email: string;
          preferred_interface_language: LanguageCode;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          display_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          contact_email: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      org_admins: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["org_admins"]["Row"]> & {
          organization_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_admins"]["Row"]>;
        Relationships: [];
      };
      conferences: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          venue_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conferences"]["Row"]> & {
          organization_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["conferences"]["Row"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          conference_id: string;
          name: string;
          floor: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rooms"]["Row"]> & {
          conference_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [];
      };
      committees: {
        Row: {
          id: string;
          conference_id: string;
          name: string;
          capacity: number | null;
          room_id: string | null;
          interface_language: LanguageCode;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["committees"]["Row"]> & {
          conference_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["committees"]["Row"]>;
        Relationships: [];
      };
      committee_members: {
        Row: {
          id: string;
          committee_id: string;
          user_id: string | null;
          role: CommitteeRole;
          delegation: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["committee_members"]["Row"]> & {
          committee_id: string;
          role: CommitteeRole;
        };
        Update: Partial<Database["public"]["Tables"]["committee_members"]["Row"]>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          committee_id: string;
          email: string;
          role: CommitteeRole;
          delegation: string | null;
          status: InviteStatus;
          invite_code: string | null;
          created_by: string | null;
          created_at: string;
          claimed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["invites"]["Row"]> & {
          committee_id: string;
          email: string;
          role: CommitteeRole;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Row"]>;
        Relationships: [];
      };
      schedule_items: {
        Row: {
          id: string;
          conference_id: string;
          title: string;
          description: string | null;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schedule_items"]["Row"]> & {
          conference_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["schedule_items"]["Row"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          committee_id: string;
          mode: SessionMode;
          topic: string | null;
          speaking_time_seconds: number | null;
          total_time_seconds: number | null;
          status: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sessions"]["Row"]> & {
          committee_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
        Relationships: [];
      };
      speakers_list: {
        Row: {
          id: string;
          committee_id: string;
          session_id: string;
          delegate_id: string | null;
          list_type: ListType;
          status: SpeakerStatus;
          joined_at: string;
          called_at: string | null;
          finished_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["speakers_list"]["Row"]> & {
          committee_id: string;
          session_id: string;
          list_type: ListType;
        };
        Update: Partial<Database["public"]["Tables"]["speakers_list"]["Row"]>;
        Relationships: [];
      };
      motions: {
        Row: {
          id: string;
          committee_id: string;
          delegate_id: string | null;
          motion_type: MotionType;
          params: Record<string, unknown> | null;
          status: MotionStatus;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["motions"]["Row"]> & {
          committee_id: string;
          motion_type: MotionType;
        };
        Update: Partial<Database["public"]["Tables"]["motions"]["Row"]>;
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          motion_id: string;
          delegate_id: string | null;
          value: VoteValue;
          cast_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["votes"]["Row"]> & {
          motion_id: string;
          value: VoteValue;
        };
        Update: Partial<Database["public"]["Tables"]["votes"]["Row"]>;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          committee_id: string;
          delegate_id: string | null;
          type: RequestType;
          status: RequestStatus;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["requests"]["Row"]> & {
          committee_id: string;
          type: RequestType;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Row"]>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          committee_id: string;
          delegate_id: string | null;
          session_date: string;
          present: boolean;
          present_and_voting: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance"]["Row"]> & {
          committee_id: string;
          session_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          committee_id: string;
          uploaded_by: string | null;
          title: string;
          doc_type: DocType;
          drive_file_id: string;
          drive_link: string;
          version: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          committee_id: string;
          title: string;
          doc_type: DocType;
          drive_file_id: string;
          drive_link: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [];
      };
      drive_links: {
        Row: {
          id: string;
          committee_id: string;
          chair_id: string | null;
          drive_folder_id: string;
          oauth_refresh_token_encrypted: string;
          connected_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["drive_links"]["Row"]> & {
          committee_id: string;
          drive_folder_id: string;
          oauth_refresh_token_encrypted: string;
        };
        Update: Partial<Database["public"]["Tables"]["drive_links"]["Row"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          conference_id: string;
          committee_id: string | null;
          body: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["announcements"]["Row"]> & {
          conference_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: {
          org_name: string;
          org_slug: string;
          org_contact_email?: string | null;
        };
        Returns: Database["public"]["Tables"]["organizations"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
