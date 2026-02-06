/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  token?: string;
}

interface ProfileResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  profile?: {
    id: string;
    user_id: string;
    username: string;
    display_name: string | null;
    display_name_ar: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    is_verified: boolean;
    is_banned: boolean;
    is_email_verified: boolean;
    followers_count: number;
    following_count: number;
    posts_count: number;
  };
}

export interface SuggestedUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  followers_count: number | null;
  is_following: boolean;
}

export interface MutualSuggestion {
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  followers_count: number | null;
  mutual_count: number;
  mutual_samples: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  }[];
  recommendation_reason: 'mutual' | 'location' | 'tahweel_support' | 'popular';
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
  is_banned: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  current_location: string | null;
}

export interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  total_engagement: number;
}

export interface TrendingPost {
  id: string;
  content: string;
  slug: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile: {
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  media: {
    id: string;
    media_url: string;
    media_type: string;
  } | null;
}

export interface TrendingTopic {
  category_id: string;
  category_name_ar: string;
  category_name_en: string;
  category_slug: string;
  post_count: number;
  recent_engagement: number;
}

export interface StorageStats {
  folder: string;
  totalSize: number;
  fileCount: number;
  formattedSize: string;
}

export interface StorageStatsResponse {
  stats: StorageStats[];
  totalSize: number;
  formattedTotal: string;
  lastUpdated: string;
}

export interface StoryProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  text_overlay: any;
  stickers: any[];
  filter: string | null;
  audio_url: string | null;
  reaction_emoji: { emoji: string; position: { x: number; y: number } } | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  profile?: StoryProfile | null;
  user_viewed?: boolean;
}

export interface UserStories {
  user_id: string;
  profile: StoryProfile;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface StoryViewer {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profile: StoryProfile | null;
}

export interface StoryAnalyticsData {
  totalViews: number;
  uniqueViewers: number;
  viewTrends: { date: string; views: number }[];
  viewers: StoryViewer[];
  peakHour: number | null;
}

export interface UserStoriesAnalytics {
  totalStories: number;
  totalViews: number;
  activeStories: number;
  viewTrends: { date: string; views: number }[];
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
  items?: any[];
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Always get the latest token from localStorage
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken && currentToken !== this.token) {
      this.token = currentToken;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API Client] Request failed:', {
        endpoint,
        status: response.status,
        hasToken: !!this.token,
        error: data
      });
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async signUp(
    email: string,
    password: string,
    redirectUrl: string,
    language: string = 'en'
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, redirectUrl, language }),
    });
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('[API Client] signIn called, URL:', `${this.baseUrl}/auth/signin`);
    const response = await this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async signOut(): Promise<void> {
    this.setToken(null);
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    console.log('[API Client] verifyEmail called, URL:', `${this.baseUrl}/auth/verify-email`);
    return this.request<ApiResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(
    email: string,
    redirectUrl: string,
    language: string = 'en'
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email, redirectUrl, language }),
    });
  }

  async getMe(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/auth/me');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Categories endpoints
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories');
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/slug/${slug}`);
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/${id}`);
  }

  async getCategoriesByIds(ids: string[]): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories/by-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async getAdminCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories/admin/all');
  }

  async createCategory(category: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>('/categories/admin', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/categories/admin/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCategorySortOrder(categories: { id: string; sort_order: number }[]): Promise<ApiResponse> {
    return this.request<ApiResponse>('/categories/admin/sort-order', {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
  }

  // Rooms endpoints
  async getPublicRooms(): Promise<ApiResponse<Room[]>> {
    return this.request<ApiResponse<Room[]>>('/rooms/public');
  }

  async getRoomById(id: string): Promise<ApiResponse<Room>> {
    return this.request<ApiResponse<Room>>(`/rooms/${id}`);
  }

  async getRoomBySlug(slug: string): Promise<ApiResponse<Room>> {
    return this.request<ApiResponse<Room>>(`/rooms/slug/${slug}`);
  }

  async getRoomMembers(roomId: string): Promise<ApiResponse<RoomMember[]>> {
    return this.request<ApiResponse<RoomMember[]>>(`/rooms/${roomId}/members`);
  }

  async getUserRoomMembership(roomId: string, userId: string): Promise<ApiResponse<RoomMember | null>> {
    return this.request<ApiResponse<RoomMember | null>>(`/rooms/${roomId}/membership/${userId}`);
  }

  async joinRoom(roomId: string, userId: string): Promise<ApiResponse<RoomMember>> {
    return this.request<ApiResponse<RoomMember>>(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async leaveRoom(roomId: string, userId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/rooms/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getRoomMessages(roomId: string, limit = 50, before?: string): Promise<ApiResponse<RoomMessage[]> & { hasMore?: boolean }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.append('before', before);
    return this.request<ApiResponse<RoomMessage[]> & { hasMore?: boolean }>(`/rooms/${roomId}/messages?${params.toString()}`);
  }

  async sendRoomMessage(roomId: string, userId: string, content: string, mediaUrl?: string, mediaType?: string): Promise<ApiResponse<RoomMessage>> {
    return this.request<ApiResponse<RoomMessage>>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ userId, content, mediaUrl, mediaType }),
    });
  }

  async editRoomMessage(messageId: string, userId: string, content: string): Promise<ApiResponse<RoomMessage>> {
    return this.request<ApiResponse<RoomMessage>>(`/rooms/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content }),
    });
  }

  async deleteRoomMessage(messageId: string, userId: string, isAdmin = false, roomId?: string, messageAuthorId?: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/rooms/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId, isAdmin, roomId, messageAuthorId }),
    });
  }

  async createRoom(userId: string, room: { name: string; name_ar?: string; description?: string; description_ar?: string; is_public?: boolean }): Promise<ApiResponse<Room>> {
    return this.request<ApiResponse<Room>>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ userId, ...room }),
    });
  }

  async getAdminRooms(): Promise<ApiResponse<Room[]>> {
    return this.request<ApiResponse<Room[]>>('/rooms/admin/all');
  }

  async updateRoomStatus(roomId: string, isActive: boolean): Promise<ApiResponse<Room>> {
    return this.request<ApiResponse<Room>>(`/rooms/admin/${roomId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteRoom(roomId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/rooms/admin/${roomId}`, {
      method: 'DELETE',
    });
  }

  // Banners endpoints
  async getActiveBanners(): Promise<ApiResponse<Banner[]>> {
    return this.request<ApiResponse<Banner[]>>('/banners/active');
  }

  async getAllBanners(): Promise<ApiResponse<Banner[]>> {
    return this.request<ApiResponse<Banner[]>>('/banners/admin/all');
  }

  async createBanner(banner: Partial<Banner>): Promise<ApiResponse<Banner>> {
    return this.request<ApiResponse<Banner>>('/banners/admin', {
      method: 'POST',
      body: JSON.stringify(banner),
    });
  }

  async updateBanner(id: string, updates: Partial<Banner>): Promise<ApiResponse<Banner>> {
    return this.request<ApiResponse<Banner>>(`/banners/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBanner(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/banners/admin/${id}`, {
      method: 'DELETE',
    });
  }

  // Posts endpoints
  async getPostsFeed(options?: { categoryId?: string; tab?: string; location?: string; userId?: string; limit?: number; offset?: number }): Promise<ApiResponse<Post[]> & { total?: number }> {
    const params = new URLSearchParams();
    if (options?.categoryId) params.set('categoryId', options.categoryId);
    if (options?.tab) params.set('tab', options.tab);
    if (options?.location) params.set('location', options.location);
    if (options?.userId) params.set('userId', options.userId);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const queryString = params.toString();
    return this.request<ApiResponse<Post[]> & { total?: number }>(`/posts/feed${queryString ? `?${queryString}` : ''}`);
  }

  async getPostById(id: string, userId?: string): Promise<ApiResponse<Post>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<ApiResponse<Post>>(`/posts/id/${id}${params}`);
  }

  async getPostBySlug(slug: string, userId?: string): Promise<ApiResponse<Post>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<ApiResponse<Post>>(`/posts/slug/${slug}${params}`);
  }

  async createPost(data: { content: string; user_id: string; category_id?: string; location?: string; feeling?: string; repost_of_id?: string; quote_content?: string }): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: string, user_id: string, content: string): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user_id, content }),
    });
  }

  async deletePost(id: string, user_id: string): Promise<ApiResponse<{ mediaUrls: string[] }>> {
    return this.request<ApiResponse<{ mediaUrls: string[] }>>(`/posts/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id }),
    });
  }

  async togglePostLike(postId: string, user_id: string, is_liked: boolean): Promise<ApiResponse<{ is_liked: boolean }>> {
    return this.request<ApiResponse<{ is_liked: boolean }>>(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ user_id, is_liked }),
    });
  }

  async togglePostBookmark(postId: string, user_id: string, is_bookmarked: boolean): Promise<ApiResponse<{ is_bookmarked: boolean }>> {
    return this.request<ApiResponse<{ is_bookmarked: boolean }>>(`/posts/${postId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({ user_id, is_bookmarked }),
    });
  }

  async trackPostView(postId: string, user_id: string): Promise<ApiResponse<{ tracked: boolean }>> {
    return this.request<ApiResponse<{ tracked: boolean }>>(`/posts/${postId}/view`, {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    });
  }

  async getAdminPosts(options?: { page?: number; pageSize?: number; search?: string }): Promise<ApiResponse<Post[]> & { total?: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.pageSize) params.set('pageSize', options.pageSize.toString());
    if (options?.search) params.set('search', options.search);
    const queryString = params.toString();
    return this.request<ApiResponse<Post[]> & { total?: number }>(`/posts/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  async adminUpdatePost(id: string, updates: Partial<Post>): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>(`/posts/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async adminDeletePost(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/posts/admin/${id}`, {
      method: 'DELETE',
    });
  }

  async getTrendingHashtags(limit?: number): Promise<ApiResponse<TrendingHashtag[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<TrendingHashtag[]>>(`/posts/trending-hashtags${params}`);
  }

  async getPostCounters(postId: string): Promise<ApiResponse<{ likes_count: number; comments_count: number; shares_count: number; views_count: number }>> {
    return this.request<ApiResponse<{ likes_count: number; comments_count: number; shares_count: number; views_count: number }>>(`/posts/counters/${postId}`);
  }

  async getActualCommentsCount(postId: string): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(`/posts/comments-count/${postId}`);
  }

  async getTrendingPosts(limit?: number): Promise<ApiResponse<TrendingPost[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<TrendingPost[]>>(`/posts/trending${params}`);
  }

  async getTrendingTopics(limit?: number): Promise<ApiResponse<TrendingTopic[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<TrendingTopic[]>>(`/posts/trending-topics${params}`);
  }

  // Storage endpoints
  async getStorageStats(): Promise<ApiResponse<StorageStatsResponse>> {
    return this.request<ApiResponse<StorageStatsResponse>>('/storage/stats');
  }

  // Stories endpoints
  async getStories(userId: string): Promise<ApiResponse<UserStories[]>> {
    return this.request<ApiResponse<UserStories[]>>(`/stories?userId=${userId}`);
  }

  async getStoryViewers(storyId: string): Promise<ApiResponse<StoryViewer[]>> {
    return this.request<ApiResponse<StoryViewer[]>>(`/stories/viewers/${storyId}`);
  }

  async getStoryAnalytics(storyId: string): Promise<ApiResponse<StoryAnalyticsData>> {
    return this.request<ApiResponse<StoryAnalyticsData>>(`/stories/analytics/${storyId}`);
  }

  async getUserStoriesAnalytics(userId: string): Promise<ApiResponse<UserStoriesAnalytics>> {
    return this.request<ApiResponse<UserStoriesAnalytics>>(`/stories/user-analytics/${userId}`);
  }

  async getUserHighlights(userId: string): Promise<ApiResponse<StoryHighlight[]>> {
    return this.request<ApiResponse<StoryHighlight[]>>(`/stories/highlights/${userId}`);
  }

  // User status endpoints
  async getUserStatuses(userIds: string[]): Promise<ApiResponse<Record<string, string>>> {
    return this.request<ApiResponse<Record<string, string>>>('/users/statuses', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async getUserStatus(userId: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<ApiResponse<{ status: string }>>(`/users/status/${userId}`);
  }

  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'busy'): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/users/status', {
      method: 'PUT',
      body: JSON.stringify({ userId, status }),
    });
  }

  // Polls endpoints
  async getPollByPostId(postId: string, userId?: string): Promise<ApiResponse<Poll | null>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<ApiResponse<Poll | null>>(`/polls/post/${postId}${params}`);
  }

  async createPoll(data: { postId: string; question: string; pollType: 'single' | 'multiple'; goal?: string; endsAt?: string; options: { text: string; emoji?: string }[] }): Promise<ApiResponse<Poll>> {
    return this.request<ApiResponse<Poll>>('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePoll(pollId: string, optionId: string, userId: string, isVoted: boolean): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId, userId, isVoted }),
    });
  }

  async votePollSingle(pollId: string, optionId: string, userId: string, previousVotes: string[]): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/polls/${pollId}/vote-single`, {
      method: 'POST',
      body: JSON.stringify({ optionId, userId, previousVotes }),
    });
  }

  // Users endpoints
  async getSuggestedUsers(userId?: string, limit?: number): Promise<ApiResponse<SuggestedUser[]>> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (limit) params.set('limit', limit.toString());
    const queryString = params.toString();
    return this.request<ApiResponse<SuggestedUser[]>>(`/users/suggested${queryString ? `?${queryString}` : ''}`);
  }

  async getPeopleYouMayKnow(userId: string, userLocation?: string, limit?: number): Promise<ApiResponse<MutualSuggestion[]>> {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (userLocation) params.set('userLocation', userLocation);
    if (limit) params.set('limit', limit.toString());
    return this.request<ApiResponse<MutualSuggestion[]>>(`/users/people-you-may-know?${params.toString()}`);
  }

  async followUser(followerId: string, followingId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return this.request<ApiResponse<{ isFollowing: boolean }>>('/users/follow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followingId }),
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return this.request<ApiResponse<{ isFollowing: boolean }>>('/users/unfollow', {
      method: 'POST',
      body: JSON.stringify({ followerId, followingId }),
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return this.request<ApiResponse<{ isFollowing: boolean }>>(`/users/is-following?followerId=${followerId}&followingId=${followingId}`);
  }

  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/users/profile/${userId}`);
  }

  async getProfileByUsername(username: string): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/users/profile/by-username/${username}`);
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getFollowers(userId: string): Promise<ApiResponse<UserProfile[]>> {
    return this.request<ApiResponse<UserProfile[]>>(`/users/${userId}/followers`);
  }

  async getFollowing(userId: string): Promise<ApiResponse<UserProfile[]>> {
    return this.request<ApiResponse<UserProfile[]>>(`/users/${userId}/following`);
  }

  async getUserPosts(userId: string, currentUserId?: string): Promise<ApiResponse<Post[]>> {
    const params = currentUserId ? `?currentUserId=${currentUserId}` : '';
    return this.request<ApiResponse<Post[]>>(`/posts/user/${userId}${params}`);
  }

  async getUserLikes(userId: string, currentUserId?: string): Promise<ApiResponse<Post[]>> {
    const params = currentUserId ? `?currentUserId=${currentUserId}` : '';
    return this.request<ApiResponse<Post[]>>(`/posts/user/${userId}/likes${params}`);
  }

  // Push notifications
  async hasPushSubscription(userId: string): Promise<ApiResponse<{ hasSubscription: boolean }>> {
    return this.request<ApiResponse<{ hasSubscription: boolean }>>(`/notifications/push-subscription/${userId}`);
  }

  async createPushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/notifications/push-subscription', {
      method: 'POST',
      body: JSON.stringify({ userId, endpoint, p256dh, auth }),
    });
  }

  async deletePushSubscription(userId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<ApiResponse<{ deleted: boolean }>>(`/notifications/push-subscription/${userId}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(postId: string, currentUserId?: string): Promise<ApiResponse<any[]>> {
    const params = currentUserId ? `?currentUserId=${currentUserId}` : '';
    return this.request<ApiResponse<any[]>>(`/comments/${postId}${params}`);
  }

  async getInfiniteComments(postId: string, currentUserId?: string, page?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (currentUserId) params.set('currentUserId', currentUserId);
    if (page !== undefined) params.set('page', page.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<ApiResponse<any>>(`/comments/${postId}/infinite${queryString}`);
  }

  async getReplies(parentId: string, currentUserId?: string, offset?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (currentUserId) params.set('currentUserId', currentUserId);
    if (offset !== undefined) params.set('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<ApiResponse<any[]>>(`/comments/replies/${parentId}${queryString}`);
  }

  async createComment(postId: string, userId: string, content: string, parentId?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, userId, content, parentId }),
    });
  }

  async updateComment(commentId: string, userId: string, content: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content }),
    });
  }

  async deleteComment(commentId: string, userId: string, postId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<ApiResponse<{ deleted: boolean }>>(`/comments/${commentId}?userId=${userId}&postId=${postId}`, {
      method: 'DELETE',
    });
  }

  async toggleCommentLike(commentId: string, userId: string, isLiked: boolean): Promise<ApiResponse<{ liked: boolean }>> {
    return this.request<ApiResponse<{ liked: boolean }>>(`/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId, isLiked }),
    });
  }

  // Reports
  async getReports(status?: string): Promise<ApiResponse<any[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request<ApiResponse<any[]>>(`/reports${params}`);
  }

  async getPendingReportsCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/reports/pending-count');
  }

  async createReport(data: {
    reporter_id: string;
    reported_type?: 'post' | 'comment' | 'message' | 'story' | 'user';
    reported_id?: string;
    reported_user_id?: string;
    post_id?: string;
    comment_id?: string;
    message_id?: string;
    reason: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReportStatus(reportId: string, status: string, reviewedBy: string, resolutionNotes?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewed_by: reviewedBy, resolution_notes: resolutionNotes }),
    });
  }

  // Messages / DMs
  async getConversations(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/messages/conversations/${userId}`);
  }

  async getConversationMessages(conversationId: string, userId: string, limit = 12, beforeMessageId?: string): Promise<ApiResponse<any[]>> {
    let url = `/messages/conversation/${conversationId}?userId=${userId}&limit=${limit}`;
    if (beforeMessageId) {
      url += `&beforeMessageId=${beforeMessageId}`;
    }
    return this.request<ApiResponse<any[]>>(url);
  }

  async getUnreadMessageCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(`/messages/unread-count/${userId}`);
  }

  async startConversation(userId: string, otherUserId: string): Promise<ApiResponse<{ conversationId: string }>> {
    return this.request<ApiResponse<{ conversationId: string }>>('/messages/start', {
      method: 'POST',
      body: JSON.stringify({ userId, otherUserId }),
    });
  }

  async sendMessage(data: {
    conversation_id: string;
    sender_id: string;
    content: string;
    media_url?: string;
    media_type?: string;
    reply_to_id?: string;
    reply_content?: string;
    reply_sender_id?: string;
    reply_sender_username?: string;
    reply_sender_display_name?: string;
    link_previews?: any[];
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fetchLinkPreviews(content: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/messages/link-previews', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<ApiResponse<{ deleted: boolean }>>(`/messages/message/${messageId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ conversationId, userId }),
    });
  }

  async pinConversation(conversationId: string, userId: string, isPinned: boolean): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/messages/pin', {
      method: 'POST',
      body: JSON.stringify({ conversationId, userId, isPinned }),
    });
  }

  async deleteConversation(conversationId: string, userId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<ApiResponse<{ deleted: boolean }>>(`/messages/conversation/${conversationId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteMessages(messageIds: string[], conversationId: string, userId: string): Promise<ApiResponse<{ deleted: boolean; mediaUrls: string[] }>> {
    return this.request<ApiResponse<{ deleted: boolean; mediaUrls: string[] }>>('/messages/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ messageIds, conversationId, userId }),
    });
  }

  async hideMessageForUser(messageId: string, userId: string): Promise<ApiResponse<{ hidden: boolean }>> {
    return this.request<ApiResponse<{ hidden: boolean }>>('/messages/hide', {
      method: 'POST',
      body: JSON.stringify({ messageId, userId }),
    });
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/messages/message/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, content }),
    });
  }

  // Stories CRUD
  async createStory(data: {
    userId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    thumbnailUrl?: string;
    textOverlay?: any;
    stickers?: any[];
    filter?: string;
    audioUrl?: string;
    reactionEmoji?: { emoji: string; position: { x: number; y: number } };
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteStory(storyId: string, userId: string): Promise<ApiResponse<{ mediaUrl: string | null; thumbnailUrl: string | null }>> {
    return this.request<ApiResponse<{ mediaUrl: string | null; thumbnailUrl: string | null }>>(`/stories/${storyId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async viewStory(storyId: string, viewerId: string, storyOwnerId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/stories/view', {
      method: 'POST',
      body: JSON.stringify({ storyId, viewerId, storyOwnerId }),
    });
  }

  async reactToStory(storyId: string, userId: string, emoji: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/stories/react', {
      method: 'POST',
      body: JSON.stringify({ storyId, userId, emoji }),
    });
  }

  async replyToStory(storyId: string, senderId: string, content: string): Promise<ApiResponse<{ storyOwnerId: string | null }>> {
    return this.request<ApiResponse<{ storyOwnerId: string | null }>>('/stories/reply', {
      method: 'POST',
      body: JSON.stringify({ storyId, senderId, content }),
    });
  }

  async getUserStoriesForHighlights(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/stories/user-stories/${userId}`);
  }

  // Highlights CRUD
  async createHighlight(userId: string, title: string, coverUrl?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/stories/highlights', {
      method: 'POST',
      body: JSON.stringify({ userId, title, coverUrl }),
    });
  }

  async updateHighlight(highlightId: string, userId: string, data: { title?: string; coverUrl?: string | null }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/stories/highlights/${highlightId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...data }),
    });
  }

  async deleteHighlight(highlightId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/stories/highlights/${highlightId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async addToHighlight(highlightId: string, storyId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/stories/highlights/${highlightId}/items`, {
      method: 'POST',
      body: JSON.stringify({ storyId, userId }),
    });
  }

  async removeFromHighlight(highlightId: string, storyId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/stories/highlights/${highlightId}/items/${storyId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Stories broadcast (legacy - now handled by create/delete endpoints)
  async broadcastStoryEvent(userId: string, storyId: string, type: 'new' | 'delete' | 'view'): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/stories/broadcast', {
      method: 'POST',
      body: JSON.stringify({ userId, storyId, type }),
    });
  }

  // Story Emoji Button Reactions
  async reactToEmojiButton(storyId: string, emoji: string): Promise<ApiResponse<{ isNew: boolean }>> {
    return this.request<ApiResponse<{ isNew: boolean }>>('/stories/emoji-react', {
      method: 'POST',
      body: JSON.stringify({ storyId, emoji }),
    });
  }

  async getUnseenEmojiReactions(storyId: string): Promise<ApiResponse<{ users: any[]; totalCount: number }>> {
    return this.request<ApiResponse<{ users: any[]; totalCount: number }>>(`/stories/emoji-reactions/unseen/${storyId}`);
  }

  async getEmojiReactors(storyId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/stories/emoji-reactions/${storyId}`);
  }

  async markEmojiReactionsAsSeen(storyId: string): Promise<ApiResponse<{ markedCount: number }>> {
    return this.request<ApiResponse<{ markedCount: number }>>(`/stories/emoji-reactions/mark-seen/${storyId}`, {
      method: 'POST',
    });
  }

  // DM Reactions
  async getDMReactions(messageId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/messages/reactions/${messageId}`);
  }

  async addDMReaction(messageId: string, userId: string, emoji: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/messages/reactions', {
      method: 'POST',
      body: JSON.stringify({ messageId, userId, emoji }),
    });
  }

  async removeDMReaction(messageId: string, userId: string, emoji: string): Promise<ApiResponse<{ removed: boolean }>> {
    return this.request<ApiResponse<{ removed: boolean }>>(`/messages/reactions?messageId=${messageId}&userId=${userId}&emoji=${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  }

  // Room message reactions
  async getMessageReactions(messageId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/messages/${messageId}/reactions`);
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string, roomId?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/rooms/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ userId, emoji, roomId }),
    });
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string, roomId?: string): Promise<ApiResponse<{ removed: boolean }>> {
    const params = new URLSearchParams({ userId, emoji });
    if (roomId) params.append('roomId', roomId);
    return this.request<ApiResponse<{ removed: boolean }>>(`/rooms/messages/${messageId}/reactions?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  // Pinned messages
  async getPinnedMessages(roomId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/${roomId}/pinned-messages`);
  }

  async pinMessage(messageId: string, userId: string, roomId: string, messageAuthorId?: string): Promise<ApiResponse<{ pinned: boolean }>> {
    return this.request<ApiResponse<{ pinned: boolean }>>(`/rooms/messages/${messageId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ userId, roomId, messageAuthorId }),
    });
  }

  async unpinMessage(messageId: string, userId: string, roomId: string, messageAuthorId?: string): Promise<ApiResponse<{ unpinned: boolean }>> {
    return this.request<ApiResponse<{ unpinned: boolean }>>(`/rooms/messages/${messageId}/unpin`, {
      method: 'POST',
      body: JSON.stringify({ userId, roomId, messageAuthorId }),
    });
  }

  // Message read receipts
  async getMessageReads(messageId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/messages/${messageId}/reads`);
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<ApiResponse<{ marked: boolean }>> {
    return this.request<ApiResponse<{ marked: boolean }>>(`/rooms/messages/${messageId}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async markRoomMessagesAsRead(roomId: string, userId: string, messageIds: string[]): Promise<ApiResponse<{ marked: boolean }>> {
    return this.request<ApiResponse<{ marked: boolean }>>(`/rooms/${roomId}/messages/read-bulk`, {
      method: 'POST',
      body: JSON.stringify({ userId, messageIds }),
    });
  }

  async getInfiniteSuggestedUsers(options?: {
    userId?: string;
    sortBy?: 'most_followed' | 'recently_joined' | 'verified';
    verifiedOnly?: boolean;
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<SuggestedUser[]> & { total?: number }> {
    const params = new URLSearchParams();
    if (options?.userId) params.set('userId', options.userId);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.verifiedOnly) params.set('verifiedOnly', 'true');
    if (options?.searchQuery) params.set('searchQuery', options.searchQuery);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const queryString = params.toString();
    return this.request<ApiResponse<SuggestedUser[]> & { total?: number }>(`/users/infinite-suggested${queryString ? `?${queryString}` : ''}`);
  }

  // Notifications
  async getNotifications(userId: string, limit?: number): Promise<ApiResponse<any[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<any[]>>(`/notifications/${userId}${params}`);
  }

  async getUnreadNotificationsCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>(`/notifications/${userId}/unread-count`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ marked: boolean }>> {
    return this.request<ApiResponse<{ marked: boolean }>>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<{ marked: number }>> {
    return this.request<ApiResponse<{ marked: number }>>(`/notifications/${userId}/read-all`, {
      method: 'PATCH',
    });
  }

  // Mentions
  async searchMentions(userId: string, query?: string): Promise<ApiResponse<MentionUser[]>> {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (query) params.set('query', query);
    return this.request<ApiResponse<MentionUser[]>>(`/users/mentions/search?${params.toString()}`);
  }

  // Mutual Followers
  async getMutualFollowers(userId: string, targetUserIds: string[]): Promise<ApiResponse<Record<string, MutualFollower[]>>> {
    const params = new URLSearchParams();
    params.set('userId', userId);
    params.set('targetUserIds', targetUserIds.join(','));
    return this.request<ApiResponse<Record<string, MutualFollower[]>>>(`/users/mutual-followers?${params.toString()}`);
  }

  async getMutualFollowersCount(userId: string, targetUserId: string): Promise<ApiResponse<{ count: number; samples: MutualFollower[] }>> {
    return this.request<ApiResponse<{ count: number; samples: MutualFollower[] }>>(`/users/mutual-followers-count/${targetUserId}?userId=${userId}`);
  }

  // ========== ROLE MANAGEMENT ==========

  async getUserRole(userId: string): Promise<ApiResponse<{ role: string }>> {
    return this.request<ApiResponse<{ role: string }>>(`/users/role/${userId}`);
  }

  async getUsersRoles(userIds: string[]): Promise<ApiResponse<Record<string, string>>> {
    return this.request<ApiResponse<Record<string, string>>>('/users/roles', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async isAdminOrManager(userId: string): Promise<ApiResponse<boolean>> {
    return this.request<ApiResponse<boolean>>(`/users/is-admin/${userId}`);
  }

  async canModerate(userId: string): Promise<ApiResponse<boolean>> {
    return this.request<ApiResponse<boolean>>(`/users/can-moderate/${userId}`);
  }

  async updateUserRole(userId: string, role: 'admin' | 'manager' | 'moderator' | 'user'): Promise<ApiResponse<{ userId: string; role: string }>> {
    return this.request<ApiResponse<{ userId: string; role: string }>>('/users/role', {
      method: 'PUT',
      body: JSON.stringify({ userId, role }),
    });
  }

  async deleteUserRole(userId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/users/role/${userId}`, {
      method: 'DELETE',
    });
  }

  // ========== ADMIN ==========

  async getAdminUsers(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/admin/users');
  }

  async getAdminPostsPaginated(page: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    posts: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }>> {
    return this.request<ApiResponse<{
      posts: any[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }>>(`/admin/posts?page=${page}&pageSize=${pageSize}`);
  }

  async getPendingPosts(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/admin/posts/pending');
  }

  async getPendingPostsCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/admin/posts/pending/count');
  }

  async getAdminReports(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/admin/reports');
  }

  async toggleUserBan(userId: string, isBanned: boolean, banReason?: string): Promise<ApiResponse<{ userId: string; isBanned: boolean }>> {
    return this.request<ApiResponse<{ userId: string; isBanned: boolean }>>(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ isBanned, banReason }),
    });
  }

  async adminDeleteUser(userId: string): Promise<ApiResponse<{ userId: string }>> {
    return this.request<ApiResponse<{ userId: string }>>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async adminUpdateUsername(userId: string, username: string): Promise<ApiResponse<{ userId: string; username: string }>> {
    return this.request<ApiResponse<{ userId: string; username: string }>>(`/admin/users/${userId}/username`, {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  }

  async moderatePost(postId: string, action: 'approve' | 'hide' | 'pin' | 'unpin' | 'lock' | 'unlock'): Promise<ApiResponse<{ postId: string; action: string }>> {
    return this.request<ApiResponse<{ postId: string; action: string }>>(`/admin/posts/${postId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async adminDeletePostById(postId: string): Promise<ApiResponse<{ postId: string }>> {
    return this.request<ApiResponse<{ postId: string }>>(`/admin/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async adminDeleteComment(commentId: string): Promise<ApiResponse<{ commentId: string }>> {
    return this.request<ApiResponse<{ commentId: string }>>(`/admin/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async bulkDeletePosts(postIds: string[]): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/admin/posts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ postIds }),
    });
  }

  async bulkModeratePosts(postIds: string[], action: 'approve' | 'hide' | 'pin' | 'unpin'): Promise<ApiResponse<{ postIds: string[]; action: string }>> {
    return this.request<ApiResponse<{ postIds: string[]; action: string }>>('/admin/posts/bulk-moderate', {
      method: 'POST',
      body: JSON.stringify({ postIds, action }),
    });
  }

  async resolveReport(reportId: string, status: 'resolved' | 'dismissed', resolvedBy: string, notes?: string): Promise<ApiResponse<{ reportId: string; status: string }>> {
    return this.request<ApiResponse<{ reportId: string; status: string }>>(`/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolvedBy, notes }),
    });
  }

  // ========== MEDIA PROXY ==========
  
  /**
   * Get the proxy URL for encrypted media - returns a URL that can be used directly as src
   */
  getProxyMediaUrl(url: string): string {
    return `${this.baseUrl}/messages/proxy-media?url=${encodeURIComponent(url)}`;
  }

  /**
   * Fetch proxied media as blob (for encrypted media that needs decryption)
   */
  async fetchProxyMedia(url: string): Promise<Blob> {
    const proxyUrl = this.getProxyMediaUrl(url);
    const response = await fetch(proxyUrl, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status}`);
    }
    return response.blob();
  }

  // ========== EMAIL TEMPLATES ==========

  async getEmailTemplates(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/settings/email-templates');
  }

  async createEmailTemplate(template: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/settings/email-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateEmailTemplate(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/settings/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEmailTemplate(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/settings/email-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== SMTP SETTINGS ==========

  async getSmtpSettings(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/settings/smtp');
  }

  async saveSmtpSettings(settings: any, existingId?: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/settings/smtp', {
      method: 'POST',
      body: JSON.stringify({ ...settings, existingId }),
    });
  }

  // ========== ROOM ACTIVITY LOGS ==========

  async getRoomActivityLogs(limit = 50): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/activity/logs?limit=${limit}`);
  }

  async logRoomActivity(roomId: string, userId: string, actionType: string, targetUserId?: string, details?: Record<string, unknown>): Promise<ApiResponse> {
    return this.request<ApiResponse>('/rooms/activity/log', {
      method: 'POST',
      body: JSON.stringify({ roomId, userId, targetUserId, actionType, details }),
    });
  }

  // ========== ROOM INVITES ==========

  async getMyRoomInvites(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/invites/my/${userId}`);
  }

  async getRoomInvites(roomId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/${roomId}/invites`);
  }

  async sendRoomInvite(roomId: string, userId: string, invitedBy: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/rooms/${roomId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ userId, invitedBy }),
    });
  }

  async respondToRoomInvite(inviteId: string, userId: string, accept: boolean): Promise<ApiResponse<{ roomId: string; accepted: boolean }>> {
    return this.request<ApiResponse<{ roomId: string; accepted: boolean }>>(`/rooms/invites/${inviteId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ userId, accept }),
    });
  }

  async cancelRoomInvite(inviteId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/rooms/invites/${inviteId}`, {
      method: 'DELETE',
    });
  }

  // ========== ROOM MODERATOR ==========

  async isRoomModerator(roomId: string, userId: string): Promise<ApiResponse<boolean>> {
    return this.request<ApiResponse<boolean>>(`/rooms/${roomId}/moderator/${userId}`);
  }

  async getRoomMemberRoles(roomId: string): Promise<ApiResponse<Record<string, string>>> {
    return this.request<ApiResponse<Record<string, string>>>(`/rooms/${roomId}/member-roles`);
  }

  // ========== HASHTAGS ==========

  async getRecentlyUsedHashtags(userId: string, limit = 5): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/rooms/hashtags/recent/${userId}?limit=${limit}`);
  }

  // ========== USER SETTINGS ==========

  async getUserSettings(userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/settings/user/${userId}`);
  }

  async getProfileVisibility(userId: string): Promise<ApiResponse<{ profile_visibility: string } | null>> {
    return this.request<ApiResponse<{ profile_visibility: string } | null>>(`/settings/user/${userId}/visibility`);
  }

  async canMessageUser(senderId: string, recipientId: string): Promise<ApiResponse<{ canMessage: boolean; reason: string | null }>> {
    return this.request<ApiResponse<{ canMessage: boolean; reason: string | null }>>(`/settings/user/${senderId}/can-message/${recipientId}`);
  }

  async updateUserSettings(userId: string, updates: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/settings/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ========== SAVED LOCATIONS ==========

  async getSavedLocations(searchTerm?: string): Promise<ApiResponse<string[]>> {
    const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    return this.request<ApiResponse<string[]>>(`/settings/locations${params}`);
  }

  // ========== SEARCH ==========

  async searchAll(query: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/settings/search?q=${encodeURIComponent(query)}`);
  }

  // ========== HASHTAG POSTS ==========

  async getHashtagPosts(hashtag: string, userId: string | null, page: number = 0, pageSize: number = 20): Promise<ApiResponse<{ posts: any[]; nextPage: number | null }>> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    if (userId) params.set('userId', userId);
    return this.request<ApiResponse<{ posts: any[]; nextPage: number | null }>>(`/posts/hashtag/${encodeURIComponent(hashtag)}?${params.toString()}`);
  }

  async searchHashtags(query: string): Promise<ApiResponse<{ hashtag: string; post_count: number }[]>> {
    return this.request<ApiResponse<{ hashtag: string; post_count: number }[]>>(`/posts/hashtags/search?q=${encodeURIComponent(query)}`);
  }

  // ========== BOOKMARKS ==========

  async getBookmarkedPosts(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/posts/bookmarks/${userId}`);
  }

  // ========== ROOM ADMIN ==========

  async muteMember(memberId: string, mute: boolean, duration: number, mutedBy: string | null, roomId: string, targetUserId?: string): Promise<ApiResponse<{ roomId: string }>> {
    return this.request<ApiResponse<{ roomId: string }>>(`/rooms/members/${memberId}/mute`, {
      method: 'PUT',
      body: JSON.stringify({ mute, duration, mutedBy, roomId, targetUserId }),
    });
  }

  async setMemberRole(memberId: string, role: string, roomId: string, userId: string, targetUserId?: string): Promise<ApiResponse<{ roomId: string }>> {
    return this.request<ApiResponse<{ roomId: string }>>(`/rooms/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, roomId, userId, targetUserId }),
    });
  }

  async logRoomAdminActivity(roomId: string, userId: string, actionType: string, targetUserId?: string, details?: Record<string, unknown>): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/rooms/activity/log-admin', {
      method: 'POST',
      body: JSON.stringify({ roomId, userId, actionType, targetUserId, details }),
    });
  }

  // ========== MFA (Two-Factor Authentication) ==========

  async listMFAFactors(userId: string): Promise<ApiResponse<{ totp: any[] }>> {
    return this.request<ApiResponse<{ totp: any[] }>>(`/mfa/factors/${userId}`);
  }

  async enrollMFA(userId: string, email: string, friendlyName?: string): Promise<ApiResponse<{ id: string; type: string; totp: { qr_code: string; secret: string; uri: string } }>> {
    return this.request<ApiResponse<{ id: string; type: string; totp: { qr_code: string; secret: string; uri: string } }>>('/mfa/enroll', {
      method: 'POST',
      body: JSON.stringify({ userId, email, friendlyName }),
    });
  }

  async verifyMFAEnrollment(factorId: string, code: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ factorId, code }),
    });
  }

  async challengeMFA(factorId: string, code: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/mfa/challenge', {
      method: 'POST',
      body: JSON.stringify({ factorId, code }),
    });
  }

  async unenrollMFA(factorId: string, userId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/mfa/factors/${factorId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  async getMFAAssuranceLevel(userId: string): Promise<ApiResponse<{ currentLevel: string; nextLevel: string | null }>> {
    return this.request<ApiResponse<{ currentLevel: string; nextLevel: string | null }>>(`/mfa/assurance/${userId}`);
  }

  // ========== EMAIL ==========

  async sendPasswordResetEmail(email: string, redirectUrl: string, language?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/email/send-reset-email', {
      method: 'POST',
      body: JSON.stringify({ email, redirectUrl, language }),
    });
  }

  async verifyResetToken(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/email/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async sendTemplatedEmail(to: string, templateName: string, variables: Record<string, string>, language?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, template_name: templateName, variables, language }),
    });
  }

  async sendBanNotification(userId: string, isBanned?: boolean, reason?: string, language?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/email/send-ban-notification', {
      method: 'POST',
      body: JSON.stringify({ userId, isBanned, reason, language }),
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/email/update-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    });
  }

  // ========== MEDIA ==========

  async removeBackground(imageBase64: string): Promise<ApiResponse<{ imageUrl: string }>> {
    return this.request<ApiResponse<{ imageUrl: string }>>('/media/remove-background', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  }
}

// Types for mentions and mutual followers
export interface MentionUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_connection?: boolean;
  is_recent?: boolean;
  is_following?: boolean;
  follows_you?: boolean;
}

export interface MutualFollower {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

// Types for categories and rooms
export interface Category {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  icon_url: string | null;
  cover_url: string | null;
  slug: string | null;
  is_active: boolean;
  allow_posting: boolean;
  allow_comments: boolean;
  require_approval: boolean;
  sort_order: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  is_public: boolean;
  is_active: boolean;
  members_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  is_muted: boolean;
  muted_until: string | null;
  joined_at: string;
  role: string | null;
  profile?: {
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  is_deleted: boolean;
  is_pinned: boolean;
  created_at: string;
  link_previews?: string | null;
  profile?: {
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export interface Banner {
  id: string;
  title: string;
  title_ar: string | null;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PostProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}

export interface PostCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  sort_order: number | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  slug: string | null;
  category_id: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  is_approved: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  repost_of_id: string | null;
  quote_content: string | null;
  location: string | null;
  feeling: string | null;
  link_previews?: string | null;
  profile?: PostProfile | null;
  category?: PostCategory | null;
  media?: PostMedia[];
  user_liked?: boolean;
  user_bookmarked?: boolean;
  original_post?: {
    id: string;
    content: string;
    slug: string | null;
    profile: PostProfile | null;
    media: PostMedia[];
  } | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  emoji: string | null;
  sort_order: number;
  votes_count: number;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  poll_type: 'single' | 'multiple';
  goal: string | null;
  ends_at: string | null;
  allow_add_options: boolean;
  created_at: string;
  options: PollOption[];
  user_votes: string[];
  total_votes: number;
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse, AuthResponse, ProfileResponse };
