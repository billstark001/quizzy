import { Duration } from "luxon";

export const dispDuration = (millis: number) => Duration.fromObject(Object.fromEntries(
  Object.entries(Duration.fromObject({
    days: 0, months: 0, years: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: millis || 0,
  }).normalize().toObject())
    .filter(([, v]) => !!v)
)).toHuman({ unitDisplay: 'narrow', listStyle: 'narrow', });

