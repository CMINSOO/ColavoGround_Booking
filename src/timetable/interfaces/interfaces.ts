export interface Timeslot {
  beginAt: number;
  endAt: number;
}

export interface DayTimetable {
  startOfDay: number;
  dayModifier: number;
  isDayOff: boolean;
  timeslots: Timeslot[];
}

export interface Event {
  begin_at: number;
  end_at: number;
}

export interface Workhour {
  is_day_off: boolean;
  open_interval: number;
  close_interval: number;
  weekday: number;
}

export interface ParametersToGenerateTimetable {
  offset: number;
  startDay: string;
  timezoneIdentifier: string;
  timeslotInterval: number;
  serviceDuration: number;
  events: Event[];
  isIgnoreSchedule: boolean;
  workHours: Workhour[];
  isIgnoreWorkhour: boolean;
}

export interface ParametersToCreateTimeslot {
  currentDay: string;
  timezoneIdentifier: string;
  timeslotInterval: number;
  serviceDuration: number;
  events: Event[];
  isIgnoreSchedule: boolean;
  workHours: Workhour[];
  isIgnoreWorkHour: boolean;
  weekday: number;
}
