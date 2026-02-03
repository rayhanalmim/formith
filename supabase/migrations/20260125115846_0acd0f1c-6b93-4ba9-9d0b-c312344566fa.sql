-- Add foreign key from posts.user_id to profiles.user_id
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from comments.user_id to profiles.user_id
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from likes.user_id to profiles.user_id
ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from bookmarks.user_id to profiles.user_id
ALTER TABLE public.bookmarks 
ADD CONSTRAINT bookmarks_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from follows.follower_id to profiles.user_id
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_profiles_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from follows.following_id to profiles.user_id
ALTER TABLE public.follows 
ADD CONSTRAINT follows_following_id_profiles_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;