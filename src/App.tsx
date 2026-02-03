import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { StoryUploadProvider } from "@/contexts/StoryUploadContext";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useGlobalDMListeners } from "@/hooks/useGlobalDMListeners";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import CategoryPage from "./pages/CategoryPage";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminPendingPosts from "./pages/admin/AdminPendingPosts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminReports from "./pages/admin/AdminReports";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminSmtpSettings from "./pages/admin/AdminSmtpSettings";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminTrendingHashtags from "./pages/admin/AdminTrendingHashtags";
import AdminRoomActivityLog from "./pages/admin/AdminRoomActivityLog";
import AdminFileMigration from "./pages/admin/AdminFileMigration";
import AdminDatabaseMigration from "./pages/admin/AdminDatabaseMigration";
import HashtagSearch from "./pages/HashtagSearch";
import DiscoverPeople from "./pages/DiscoverPeople";
import NotFound from "./pages/NotFound";

// Component to initialize hooks that need to run app-wide
function AppHooks() {
  useDocumentTitle();
  useDesktopNotifications();
  useSocketConnection(); // Initialize socket connection app-wide
  useGlobalDMListeners(); // Register global DM socket listeners once
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds default
      refetchOnWindowFocus: false, // Prevent refetch on every tab switch
      retry: 1, // Retry failed queries once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <MessagesProvider>
            <StoryUploadProvider>
            <TooltipProvider>
            <AppHooks />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/category/:categorySlug" element={<CategoryPage />} />
                <Route path="/category/:categorySlug/post/:slug" element={<PostDetail />} />
                <Route path="/post/:slug" element={<PostDetail />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/:roomSlug" element={<RoomDetail />} />
                <Route path="/hashtag/:tag" element={<HashtagSearch />} />
                <Route path="/discover" element={<DiscoverPeople />} />
                {/* Admin Routes - Protected */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="pending" element={<AdminPendingPosts />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="rooms" element={<AdminRooms />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="emails" element={<AdminEmailTemplates />} />
                  <Route path="smtp" element={<AdminSmtpSettings />} />
                  <Route path="hashtags" element={<AdminTrendingHashtags />} />
                  <Route path="room-activity" element={<AdminRoomActivityLog />} />
                  <Route path="file-migration" element={<AdminFileMigration />} />
                  <Route path="database-migration" element={<AdminDatabaseMigration />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
            </StoryUploadProvider>
          </MessagesProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
