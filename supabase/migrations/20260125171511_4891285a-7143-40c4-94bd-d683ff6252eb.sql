-- Enable realtime for comments and likes tables to get counter updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;