export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.explore': 'استكشاف',
    'nav.categories': 'الأقسام',
    'nav.messages': 'الرسائل',
    'nav.notifications': 'الإشعارات',
    'nav.profile': 'الملف الشخصي',
    'nav.settings': 'الإعدادات',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',
    'nav.logout': 'تسجيل الخروج',
    
    // Forum
    'forum.name': 'منتدى تحويل',
    'forum.tagline': 'مجتمعك الرقمي للتواصل والنقاش',
    'forum.newPost': 'منشور جديد',
    'forum.trending': 'الأكثر تداولاً',
    'forum.latest': 'أحدث المنشورات',
    'forum.following': 'متابعاتي',
    'forum.popular': 'الأكثر شعبية',
    
    // Categories
    'categories.title': 'الأقسام',
    'categories.general': 'نقاشات عامة',
    'categories.tech': 'التقنية',
    'categories.finance': 'المال والأعمال',
    'categories.gaming': 'الألعاب',
    'categories.lifestyle': 'أسلوب الحياة',
    'categories.news': 'الأخبار',
    
    // Actions
    'action.like': 'إعجاب',
    'action.comment': 'تعليق',
    'action.share': 'مشاركة',
    'action.save': 'حفظ',
    'action.report': 'إبلاغ',
    'action.follow': 'متابعة',
    'action.unfollow': 'إلغاء المتابعة',
    
    // Auth
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.verifyEmail': 'تأكيد البريد الإلكتروني',
    
    // Profile
    'profile.followers': 'المتابعون',
    'profile.following': 'يتابع',
    'profile.posts': 'المنشورات',
    'profile.joined': 'انضم في',
    'profile.verified': 'موثق',
    
    // Rooms
    'rooms.title': 'غرف الدردشة',
    'rooms.public': 'غرف عامة',
    'rooms.private': 'غرف خاصة',
    'rooms.join': 'انضمام',
    'rooms.leave': 'مغادرة',
    'rooms.members': 'الأعضاء',
    'rooms.voiceComingSoon': 'الغرف الصوتية قريباً',
    
    // Common
    'common.search': 'بحث',
    'common.loading': 'جاري التحميل...',
    'common.noResults': 'لا توجد نتائج',
    'common.seeMore': 'عرض المزيد',
    'common.online': 'متصل',
    'common.offline': 'غير متصل',
    
    // Footer
    'footer.about': 'عن تحويل',
    'footer.terms': 'الشروط والأحكام',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.contact': 'اتصل بنا',
    'footer.rights': 'جميع الحقوق محفوظة',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.categories': 'Categories',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Logout',
    
    // Forum
    'forum.name': 'Tahweel Forum',
    'forum.tagline': 'Your digital community for connection and discussion',
    'forum.newPost': 'New Post',
    'forum.trending': 'Trending',
    'forum.latest': 'Latest Posts',
    'forum.following': 'Following',
    'forum.popular': 'Popular',
    
    // Categories
    'categories.title': 'Categories',
    'categories.general': 'General Discussion',
    'categories.tech': 'Technology',
    'categories.finance': 'Finance & Business',
    'categories.gaming': 'Gaming',
    'categories.lifestyle': 'Lifestyle',
    'categories.news': 'News',
    
    // Actions
    'action.like': 'Like',
    'action.comment': 'Comment',
    'action.share': 'Share',
    'action.save': 'Save',
    'action.report': 'Report',
    'action.follow': 'Follow',
    'action.unfollow': 'Unfollow',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.verifyEmail': 'Verify Email',
    
    // Profile
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.posts': 'Posts',
    'profile.joined': 'Joined',
    'profile.verified': 'Verified',
    
    // Rooms
    'rooms.title': 'Chat Rooms',
    'rooms.public': 'Public Rooms',
    'rooms.private': 'Private Rooms',
    'rooms.join': 'Join',
    'rooms.leave': 'Leave',
    'rooms.members': 'Members',
    'rooms.voiceComingSoon': 'Voice Rooms Coming Soon',
    
    // Common
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
    'common.seeMore': 'See More',
    'common.online': 'Online',
    'common.offline': 'Offline',
    
    // Footer
    'footer.about': 'About Tahweel',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.contact': 'Contact Us',
    'footer.rights': 'All rights reserved',
  },
};
