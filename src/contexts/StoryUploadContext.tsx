import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface StoryUploadState {
  isUploading: boolean;
  progress: number;
  status: string | null;
}

interface StoryUploadContextType {
  uploadState: StoryUploadState;
  startUpload: () => void;
  updateProgress: (progress: number, status?: string) => void;
  finishUpload: () => void;
  cancelUpload: () => void;
}

const StoryUploadContext = createContext<StoryUploadContextType | null>(null);

export function StoryUploadProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<StoryUploadState>({
    isUploading: false,
    progress: 0,
    status: null,
  });

  const startUpload = useCallback(() => {
    setUploadState({
      isUploading: true,
      progress: 0,
      status: null,
    });
  }, []);

  const updateProgress = useCallback((progress: number, status?: string) => {
    setUploadState(prev => ({
      ...prev,
      progress,
      status: status ?? prev.status,
    }));
  }, []);

  const finishUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 100,
      status: null,
    });
  }, []);

  const cancelUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      status: null,
    });
  }, []);

  return (
    <StoryUploadContext.Provider value={{
      uploadState,
      startUpload,
      updateProgress,
      finishUpload,
      cancelUpload,
    }}>
      {children}
    </StoryUploadContext.Provider>
  );
}

export function useStoryUpload() {
  const context = useContext(StoryUploadContext);
  if (!context) {
    throw new Error('useStoryUpload must be used within StoryUploadProvider');
  }
  return context;
}
