import {
  ReactionsButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-sdk";


export const CustomCallControls = () => (
  <div className="str-video__call-controls meeting-media-controls" role="group" aria-label="Microphone, camera, screen sharing and reactions">
    <SpeakingWhileMutedNotification>
      <ToggleAudioPublishingButton />
    </SpeakingWhileMutedNotification>
    <ToggleVideoPublishingButton />
    <ScreenShareButton />
    <ReactionsButton />
  </div>
);
