import {
  ReactionsButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-sdk";


export const CustomCallControls = () => (
  <div className="str-video__call-controls">
    <SpeakingWhileMutedNotification>
      <ToggleAudioPublishingButton />
    </SpeakingWhileMutedNotification>
    <ToggleVideoPublishingButton />
    <ScreenShareButton />
    <ReactionsButton />
  </div>
);