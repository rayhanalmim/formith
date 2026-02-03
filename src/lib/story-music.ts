// Story sound settings - keep original audio from videos/images
export interface StoryMusic {
  id: string;
  name: string;
  nameAr: string;
  url: string;
}

// Only option: use original sound from video/image (no background music)
export const STORY_MUSIC_LIBRARY: StoryMusic[] = [
  {
    id: 'original',
    name: 'Original Sound',
    nameAr: 'الصوت الأصلي',
    url: '',
  },
];

export const MUSIC_CATEGORIES = [] as const;

export const getMusicByCategory = (_category: string): StoryMusic[] => {
  return STORY_MUSIC_LIBRARY;
};
