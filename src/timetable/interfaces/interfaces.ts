export interface Timeslot {
  begin_at: number;
  end_at: number;
}

export interface DayTimetable {
  start_of_day: number;
  day_modifier: number;
  is_day_off: boolean;
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
