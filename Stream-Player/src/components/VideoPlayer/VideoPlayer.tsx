import ReactPlayer from "react-player";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <div className="video-player-container">
      <ReactPlayer
        src={videoUrl}
        controls
        width="100%"
        height="100%"
        className="react-player"
      />
    </div>
  );
}
