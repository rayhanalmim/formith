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
      banners: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string
          sort_order: number | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url: string
          sort_order?: number | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string
          sort_order?: number | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          allow_comments: boolean | null
          allow_posting: boolean | null
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          posts_count: number | null
          require_approval: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          allow_comments?: boolean | null
          allow_posting?: boolean | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          posts_count?: number | null
          require_approval?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          allow_comments?: boolean | null
          allow_posting?: boolean | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          posts_count?: number | null
          require_approval?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
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
          {
            foreignKeyName: "comments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          deleted_at: string | null
          id: string
          is_pinned: boolean | null
          joined_at: string
          last_read_at: string | null
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          read_at: string | null
          reply_content: string | null
          reply_sender_display_name: string | null
          reply_sender_id: string | null
          reply_sender_username: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          reply_content?: string | null
          reply_sender_display_name?: string | null
          reply_sender_id?: string | null
          reply_sender_username?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          reply_content?: string | null
          reply_sender_display_name?: string | null
          reply_sender_id?: string | null
          reply_sender_username?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_profiles_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dm_hidden_messages: {
        Row: {
          hidden_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_hidden_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_html_ar: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          subject_ar: string | null
          updated_at: string
          updated_by: string | null
          variables: string[] | null
        }
        Insert: {
          body_html: string
          body_html_ar?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          subject_ar?: string | null
          updated_at?: string
          updated_by?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          body_html_ar?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          subject_ar?: string | null
          updated_at?: string
          updated_by?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_profiles_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_profiles_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          media_type: string | null
          media_url: string | null
          pinned_at: string | null
          pinned_by: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_type?: string | null
          media_url?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_type?: string | null
          media_url?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          message_ar: string | null
          title: string
          title_ar: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          message_ar?: string | null
          title: string
          title_ar?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          message_ar?: string | null
          title?: string
          title_ar?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          poll_id: string
          sort_order: number | null
          text: string
          votes_count: number | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          poll_id: string
          sort_order?: number | null
          text: string
          votes_count?: number | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          poll_id?: string
          sort_order?: number | null
          text?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          post_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_polls: {
        Row: {
          allow_add_options: boolean | null
          created_at: string
          ends_at: string | null
          goal: string | null
          id: string
          poll_type: Database["public"]["Enums"]["poll_type"]
          post_id: string
          question: string
        }
        Insert: {
          allow_add_options?: boolean | null
          created_at?: string
          ends_at?: string | null
          goal?: string | null
          id?: string
          poll_type?: Database["public"]["Enums"]["poll_type"]
          post_id: string
          question: string
        }
        Update: {
          allow_add_options?: boolean | null
          created_at?: string
          ends_at?: string | null
          goal?: string | null
          id?: string
          poll_type?: Database["public"]["Enums"]["poll_type"]
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category_id: string | null
          comments_count: number | null
          content: string
          created_at: string
          feeling: string | null
          id: string
          is_approved: boolean | null
          is_hidden: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          location: string | null
          quote_content: string | null
          repost_of_id: string | null
          shares_count: number | null
          slug: string | null
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          category_id?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          feeling?: string | null
          id?: string
          is_approved?: boolean | null
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          quote_content?: string | null
          repost_of_id?: string | null
          shares_count?: number | null
          slug?: string | null
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          category_id?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          feeling?: string | null
          id?: string
          is_approved?: boolean | null
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          quote_content?: string | null
          repost_of_id?: string | null
          shares_count?: number | null
          slug?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_id_fkey"
            columns: ["repost_of_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          birthday: string | null
          birthplace: string | null
          cover_url: string | null
          created_at: string
          current_location: string | null
          display_name: string | null
          display_name_ar: string | null
          followers_count: number | null
          following_count: number | null
          gender: string | null
          id: string
          is_banned: boolean | null
          is_email_verified: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          posts_count: number | null
          relationship_status: string | null
          show_birthday: boolean | null
          show_birthplace: boolean | null
          show_followers_count: boolean | null
          show_following_count: boolean | null
          show_gender: boolean | null
          show_joined_date: boolean | null
          show_location: boolean | null
          show_relationship: boolean | null
          status: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          birthday?: string | null
          birthplace?: string | null
          cover_url?: string | null
          created_at?: string
          current_location?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          followers_count?: number | null
          following_count?: number | null
          gender?: string | null
          id?: string
          is_banned?: boolean | null
          is_email_verified?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          posts_count?: number | null
          relationship_status?: string | null
          show_birthday?: boolean | null
          show_birthplace?: boolean | null
          show_followers_count?: boolean | null
          show_following_count?: boolean | null
          show_gender?: boolean | null
          show_joined_date?: boolean | null
          show_location?: boolean | null
          show_relationship?: boolean | null
          status?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          birthday?: string | null
          birthplace?: string | null
          cover_url?: string | null
          created_at?: string
          current_location?: string | null
          display_name?: string | null
          display_name_ar?: string | null
          followers_count?: number | null
          following_count?: number | null
          gender?: string | null
          id?: string
          is_banned?: boolean | null
          is_email_verified?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          posts_count?: number | null
          relationship_status?: string | null
          show_birthday?: boolean | null
          show_birthplace?: boolean | null
          show_followers_count?: boolean | null
          show_following_count?: boolean | null
          show_gender?: boolean | null
          show_joined_date?: boolean | null
          show_location?: boolean | null
          show_relationship?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_profiles_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      room_activity_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          room_id: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          room_id: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          room_id?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_activity_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_user_id: string
          responded_at: string | null
          room_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_user_id: string
          responded_at?: string | null
          room_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          responded_at?: string | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "room_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "room_invites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          is_muted: boolean | null
          joined_at: string
          muted_by: string | null
          muted_until: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          muted_by?: string | null
          muted_until?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          muted_by?: string | null
          muted_until?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          members_count: number | null
          name: string
          name_ar: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          members_count?: number | null
          name: string
          name_ar?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          members_count?: number | null
          name?: string
          name_ar?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          host: string
          id: string
          is_active: boolean | null
          password: string
          port: number
          updated_at: string
          use_tls: boolean | null
          username: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name?: string
          host: string
          id?: string
          is_active?: boolean | null
          password: string
          port?: number
          updated_at?: string
          use_tls?: boolean | null
          username: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          is_active?: boolean | null
          password?: string
          port?: number
          updated_at?: string
          use_tls?: boolean | null
          username?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          audio_url: string | null
          created_at: string
          expires_at: string
          filter: string | null
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string
          stickers: Json | null
          text_overlay: Json | null
          thumbnail_url: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          expires_at?: string
          filter?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url: string
          stickers?: Json | null
          text_overlay?: Json | null
          thumbnail_url?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          expires_at?: string
          filter?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string
          stickers?: Json | null
          text_overlay?: Json | null
          thumbnail_url?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      story_highlight_items: {
        Row: {
          added_at: string
          highlight_id: string
          id: string
          sort_order: number | null
          story_id: string
        }
        Insert: {
          added_at?: string
          highlight_id: string
          id?: string
          sort_order?: number | null
          story_id: string
        }
        Update: {
          added_at?: string
          highlight_id?: string
          id?: string
          sort_order?: number | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_highlight_items_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "story_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_highlight_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_highlights: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          story_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          story_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          allow_messages_from: string | null
          created_at: string
          email_notifications: boolean | null
          id: string
          notify_comments: boolean | null
          notify_follows: boolean | null
          notify_likes: boolean | null
          notify_messages: boolean | null
          profile_visibility: string | null
          push_notifications: boolean | null
          show_online_status: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages_from?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_comments?: boolean | null
          notify_follows?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages_from?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notify_comments?: boolean | null
          notify_follows?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_delete_messages: {
        Args: { p_message_ids: string[] }
        Returns: undefined
      }
      can_access_message_reads: {
        Args: { _message_id: string; _user_id: string }
        Returns: boolean
      }
      can_message_user: {
        Args: { _recipient_id: string; _sender_id: string }
        Returns: boolean
      }
      can_react_to_message: {
        Args: { _message_id: string; _user_id: string }
        Returns: boolean
      }
      delete_conversation_for_user: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      delete_conversation_messages: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      delete_single_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      edit_direct_message: {
        Args: { p_message_id: string; p_new_content: string }
        Returns: undefined
      }
      get_or_create_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hide_message_for_user: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_moderator: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "moderator" | "user"
      poll_type: "single" | "multiple"
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
      app_role: ["admin", "manager", "moderator", "user"],
      poll_type: ["single", "multiple"],
    },
  },
} as const
