export const getMeetingJoinLink = (meetingCode: string) =>
  `${window.location.origin}/meeting/${meetingCode}`;

export const extractMeetingCode = (value: string) => {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    const meetingIndex = parts.indexOf("meeting");
    return meetingIndex >= 0 ? parts[meetingIndex + 1] ?? "" : "";
  } catch {
    const match = input.match(/(?:meeting\/)?([0-9a-f]{8}-[0-9a-f-]{27,})/i);
    return match?.[1] ?? input;
  }
};
