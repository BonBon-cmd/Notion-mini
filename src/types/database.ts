export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  author_id: string
  title: string
  content: string
  is_public: boolean
  cover_image_url?: string | null
  color?: string | null
  created_at: string
  // Joined data
  profiles?: Profile
}

export interface Tag {
  id: string
  author_id: string
  name: string
  color: string
}

export interface NoteTag {
  note_id: string
  tag_id: string
  tags?: Tag
}