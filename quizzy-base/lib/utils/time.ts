import { Duration } from "luxon";

export const dispDuration = (millis: number) => Duration.fromObject(Object.fromEntries(
  Object.entries(Duration.fromObject({
    days: 0, months: 0, years: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: millis || 0,
  }).normalize().toObject())
    .filter(([, v]) => !!v)
)).toHuman({ unitDisplay: 'narrow', listStyle: 'narrow', });

export const formatMilliseconds = (milliseconds: number) => {

  if (milliseconds < 0) {
    return "Invalid input";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const formattedHours = String(remainingHours).padStart(2, '0');
  const formattedMinutes = String(remainingMinutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  if (days < 1) {
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${days}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};
