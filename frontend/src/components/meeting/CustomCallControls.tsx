import {
  CancelCallButton,
  ReactionsButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-sdk";

import type { CallControlsProps } from "@stream-io/video-react-sdk";


export const CustomCallControls = ({ onLeave }: CallControlsProps) => (
  <div className="str-video__call-controls">
    <SpeakingWhileMutedNotification>
      <ToggleAudioPublishingButton />
    </SpeakingWhileMutedNotification>
    <ToggleVideoPublishingButton />
    <ScreenShareButton />
    <ReactionsButton />
    <CancelCallButton onLeave={onLeave} />
  </div>
);