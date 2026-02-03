import { VideoPlayer } from '@/components/ui/video-player';

export function VideoPlayerTest() {
  // Sample video URL - replace with actual video URL when testing
  const sampleVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Video Player Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Responsive Video Player</h2>
        <VideoPlayer 
          src={sampleVideoUrl}
          className="w-full"
          maxHeight="400px"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Small Video Player</h2>
        <VideoPlayer 
          src={sampleVideoUrl}
          className="w-full max-w-md"
          maxHeight="200px"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Auto-play Video Player</h2>
        <VideoPlayer 
          src={sampleVideoUrl}
          className="w-full"
          autoPlay={true}
          muted={true}
          maxHeight="300px"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Loop Video Player</h2>
        <VideoPlayer 
          src={sampleVideoUrl}
          className="w-full"
          loop={true}
          maxHeight="250px"
        />
      </div>
    </div>
  );
}
