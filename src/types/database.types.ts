export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          group_id: string
          display_name: string
          user_id: string | null
          invite_token: string | null
        }
        Insert: {
          id?: string
          group_id: string
          display_name: string
          user_id?: string | null
          invite_token?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          display_name?: string
          user_id?: string | null
          invite_token?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          payer_id: string
          amount: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          payer_id: string
          amount: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          payer_id?: string
          amount?: number
          description?: string
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          participant_id: string
          amount_owed: number
        }
        Insert: {
          id?: string
          expense_id: string
          participant_id: string
          amount_owed: number
        }
        Update: {
          id?: string
          expense_id?: string
          participant_id?: string
          amount_owed?: number
        }
      }
    }
  }
}
