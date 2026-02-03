-- =============================================
-- TAHWEEL FORUM DATABASE SCHEMA
-- =============================================

-- 1. APP ROLE ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'moderator', 'user');

-- 2. USER ROLES TABLE (RBAC - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. SECURITY DEFINER FUNCTION FOR ROLE CHECKS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- 4. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    display_name_ar TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CATEGORIES TABLE (bilingual)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    icon_url TEXT,
    cover_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    allow_posting BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. POSTS TABLE
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 7. POST MEDIA TABLE
CREATE TABLE public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image', -- image, video
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- 8. COMMENTS TABLE
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 9. LIKES TABLE (for posts and comments)
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE (user_id, post_id),
    UNIQUE (user_id, comment_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 10. BOOKMARKS TABLE
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 11. FOLLOWS TABLE
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 12. ROOMS TABLE (Chat rooms)
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    members_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- 13. ROOM MEMBERS TABLE
CREATE TABLE public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMPTZ,
    muted_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- 14. MESSAGES TABLE
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 15. REPORTS TABLE
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 16. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- follow, like, comment, mention, etc.
    title TEXT NOT NULL,
    title_ar TEXT,
    message TEXT,
    message_ar TEXT,
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin_or_manager(auth.uid()));

-- CATEGORIES POLICIES
CREATE POLICY "Active categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- POSTS POLICIES
CREATE POLICY "Approved posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (
        (is_approved = true AND is_hidden = false) 
        OR auth.uid() = user_id 
        OR public.is_admin_or_manager(auth.uid())
    );

CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

-- POST MEDIA POLICIES
CREATE POLICY "Post media is viewable with post"
    ON public.post_media FOR SELECT
    USING (true);

CREATE POLICY "Users can add media to their posts"
    ON public.post_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their post media"
    ON public.post_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- COMMENTS POLICIES
CREATE POLICY "Visible comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (is_hidden = false OR auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

-- LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- BOOKMARKS POLICIES
CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- FOLLOWS POLICIES
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can follow"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- ROOMS POLICIES
CREATE POLICY "Public rooms are viewable by everyone"
    ON public.rooms FOR SELECT
    USING (
        is_public = true 
        OR EXISTS (SELECT 1 FROM public.room_members WHERE room_id = id AND user_id = auth.uid())
        OR public.is_admin_or_manager(auth.uid())
    );

CREATE POLICY "Admins can manage rooms"
    ON public.rooms FOR ALL
    USING (public.is_admin_or_manager(auth.uid()));

-- ROOM MEMBERS POLICIES
CREATE POLICY "Room members are viewable by room members"
    ON public.room_members FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_id AND rm.user_id = auth.uid())
        OR public.is_admin_or_manager(auth.uid())
    );

CREATE POLICY "Users can join public rooms"
    ON public.room_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND is_public = true)
    );

CREATE POLICY "Users can leave rooms"
    ON public.room_members FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can manage room members"
    ON public.room_members FOR UPDATE
    USING (public.is_admin_or_manager(auth.uid()));

-- MESSAGES POLICIES
CREATE POLICY "Room members can view messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
    );

CREATE POLICY "Room members can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.room_members 
            WHERE room_id = messages.room_id 
            AND user_id = auth.uid() 
            AND (is_muted = false OR muted_until < now())
        )
    );

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));

-- REPORTS POLICIES
CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Authenticated users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
    ON public.reports FOR UPDATE
    USING (public.is_admin_or_manager(auth.uid()));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (
        NEW.id,
        LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 4),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DEFAULT CATEGORIES
-- =============================================

INSERT INTO public.categories (name_en, name_ar, description_en, description_ar, slug, sort_order) VALUES
('General Discussion', 'نقاشات عامة', 'General topics and conversations', 'مواضيع ومحادثات عامة', 'general', 1),
('Technology', 'التقنية', 'Tech news, programming, and gadgets', 'أخبار التقنية والبرمجة والأجهزة', 'technology', 2),
('Finance & Business', 'المال والأعمال', 'Business, investments, and finance', 'الأعمال والاستثمارات والمال', 'finance', 3),
('Gaming', 'الألعاب', 'Video games and gaming culture', 'ألعاب الفيديو وثقافة الألعاب', 'gaming', 4),
('Lifestyle', 'أسلوب الحياة', 'Health, travel, and lifestyle topics', 'الصحة والسفر ومواضيع أسلوب الحياة', 'lifestyle', 5),
('News', 'الأخبار', 'Current events and news', 'الأحداث الجارية والأخبار', 'news', 6);

-- =============================================
-- SEED DEFAULT ROOMS
-- =============================================

INSERT INTO public.rooms (name, name_ar, description, description_ar, is_public) VALUES
('General Chat', 'الدردشة العامة', 'General discussion room', 'غرفة النقاش العام', true),
('Tech Talk', 'التقنية والبرمجة', 'Technology and programming discussions', 'نقاشات التقنية والبرمجة', true),
('Gaming Lounge', 'الألعاب', 'Gaming community room', 'غرفة مجتمع الألعاب', true);