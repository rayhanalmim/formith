// Re-export all hooks from the DigitalOcean Spaces upload module
// This file maintains backward compatibility while using the new storage backend

export {
  useSpacesAvatarUpload as useAvatarUpload,
  useSpacesCoverUpload as useCoverUpload,
  useSpacesPostMediaUpload as usePostMediaUpload,
  useSpacesRoomMediaUpload as useRoomMediaUpload,
  useSpacesDMMediaUpload as useDMMediaUpload,
} from './useSpacesUpload';
