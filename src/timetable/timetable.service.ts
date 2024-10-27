import { BadRequestException, Injectable } from '@nestjs/common';
import { JsonLoaderService } from './json-loader.service';
import { CreateDateTimeTableDto } from './dtos/create-date-time-table.dto.ts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  DayTimetable,
  Event,
  ParametersToCreateTimeslot,
  ParametersToGenerateTimetable,
  Timeslot,
  Workhour,
} from './interfaces/interfaces';
import { CLOSE_TIME, OPEN_TIME } from 'src/constants/time.constant';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TimetableService {
  constructor(private readonly jsonLoader: JsonLoaderService) {}
  async createDayTimeTable(createDateTimeTableDto: CreateDateTimeTableDto) {
    const {
      startDayIdentifier,
      timezoneIdentifier,
      days,
      serviceDuration,
      timeslotInterval,
      isIgnoreSchedule,
      isIgnoreWorkhour,
    } = createDateTimeTableDto;

    //json파일 읽어온것
    const workHours = await this.jsonLoader.getWorkHours();
    const events = await this.jsonLoader.getEvents();

    //start_day_identifier 변환 및 유닉스 타임 계산
    const formattedStartDay = this.formatStartDay(startDayIdentifier);

    //들어온 days값에 맞게 날짜에 대한 테이블 생성하기
    //days 값이 음수로 들어올때 오류가 발생해서 Math.abs를 통해 절대값으로 변환
    const dayTimetable = Array.from({ length: Math.abs(days) + 1 }, (_, i) => {
      const offset = days < 0 ? -i : i; // days가 음수일 경우 날짜를 과거로 이동

      const parametersToGenerateTimetable: ParametersToGenerateTimetable = {
        offset,
        startDay: formattedStartDay,
        timezoneIdentifier,
        timeslotInterval,
        serviceDuration,
        events,
        isIgnoreSchedule,
        workHours,
        isIgnoreWorkhour,
      };

      return this.generateDateTimetable(parametersToGenerateTimetable);
    });
    return dayTimetable;
  }

  //YYYYMMDD 형식을 YYYY-MM-DD로 변환하는 함수
  formatStartDay(input: string): string {
    if (input.length !== 8 || !/^\d{8}$/.test(input)) {
      throw new BadRequestException('올바르지 않은 날짜 형식입니다');
    }

    const year = input.slice(0, 4);
    const month = input.slice(4, 6);
    const day = input.slice(6, 8);

    return `${year}-${month}-${day}`; // YYYY-MM-DD 형식으로 변환
  }

  //유닉스타임을 날짜로 변환한후 요일을 구하는 함수
  //day-off인날은 아무것도 반환하지 않기위해
  getDayFromUnixTime(unixTime: number, tz: string) {
    const date = dayjs.unix(unixTime).tz(tz);
    const day = date.format('ddd');

    //요일을 숫자키값으로 변경
    const dayValues = {
      Sun: 1,
      Mon: 2,
      Tue: 3,
      Wed: 4,
      Thu: 5,
      Fri: 6,
      Sat: 7,
    };
    return dayValues[day];
  }

  //TimeSlot만들어주는 함숭
  createTimeSlot(params: ParametersToCreateTimeslot): Timeslot[] {
    const {
      currentDay,
      timezoneIdentifier,
      timeslotInterval,
      serviceDuration,
      events,
      isIgnoreSchedule,
      workHours,
      isIgnoreWorkHour,
      weekday,
    } = params;
    const timeslots: Timeslot[] = [];
    const startDay = dayjs.tz(currentDay, timezoneIdentifier).startOf('day');
    const workHour = workHours.find((e) => {
      return e.weekday === weekday;
    });
    let openTime = OPEN_TIME;
    let closeTime = CLOSE_TIME;

    // 영업시간무시 false 일때의 영업시간
    if (!isIgnoreWorkHour && workHour && !workHour.is_day_off) {
      openTime = workHour.open_interval;
      closeTime = workHour.close_interval;
    }
    // dayoff 가 true일때의 영업시간
    if (workHour.is_day_off == true) {
      openTime = workHour.open_interval;
      closeTime = workHour.close_interval;
    }

    let currentTime = startDay.add(openTime, 'second');

    // 하루 전체시간은 = 86400초. 해당 초 안의 범위에서만 슬롯생성하기
    while (currentTime.diff(startDay, 'second') < closeTime) {
      const currentEndTime = currentTime.add(serviceDuration, 'second');

      // 하루를 넘지 않을 때만 타임슬롯 추가
      if (currentEndTime.diff(startDay, 'second') <= closeTime) {
        const createdTimeslot = {
          beginAt: currentTime.unix(),
          endAt: currentEndTime.unix(),
        };
        if (
          isIgnoreSchedule ||
          (!isIgnoreSchedule &&
            !this.isDuplicateEvents(createdTimeslot, events))
        ) {
          timeslots.push(createdTimeslot);
        }
      }

      // 시작 시간을 다음 타임슬롯으로 이동
      currentTime = currentTime.add(timeslotInterval, 'second');
    }
    return timeslots;
  }

  //걉치는 이벤트가 있는지 확인
  isDuplicateEvents(timeslot: Timeslot, events: Event[]): boolean {
    // 이벤트가 겹치는 경우의 수
    // 1. 타임슬롯의 시작이 이벤트의 범위 내에 있는 경우
    // 2. 타임슬롯의 끝이 이벤트의 범위 내에 있는 경우
    // 3. 이벤트의 시작이 타임슬롯의 범위 내에 있는 경우
    // 4. 이벤트의 끝이 타임슬롯의 범위 내에 있는 경우
    return events.some(
      (event) =>
        (timeslot.beginAt >= event.begin_at &&
          timeslot.beginAt < event.end_at) ||
        (timeslot.endAt > event.begin_at && timeslot.endAt <= event.end_at) ||
        (event.begin_at >= timeslot.beginAt &&
          event.begin_at < timeslot.endAt) ||
        (event.end_at > timeslot.beginAt && event.end_at <= timeslot.endAt),
    );
  }

  generateDateTimetable(params: ParametersToGenerateTimetable): DayTimetable {
    const {
      offset,
      startDay,
      timezoneIdentifier,
      timeslotInterval,
      serviceDuration,
      events,
      isIgnoreSchedule,
      workHours,
      isIgnoreWorkhour,
    } = params;

    const convertedStartDay = dayjs
      .tz(startDay, timezoneIdentifier)
      .startOf('day');
    const currentDay = convertedStartDay.add(offset, 'day');
    const unixStartDay = currentDay.unix();
    const weekday = this.getDayFromUnixTime(unixStartDay, timezoneIdentifier);
    const parametersToCreateTimeslot: ParametersToCreateTimeslot = {
      currentDay: currentDay.format('YYYY-MM-DD'),
      timezoneIdentifier: timezoneIdentifier,
      timeslotInterval: timeslotInterval,
      serviceDuration: serviceDuration,
      events: events,
      isIgnoreSchedule: isIgnoreSchedule,
      workHours: workHours,
      isIgnoreWorkHour: isIgnoreWorkhour,
      weekday: weekday,
    };
    const timeslots = this.createTimeSlot(parametersToCreateTimeslot);
    const isOff = this.getIsDayOff(workHours, weekday);
    return {
      startOfDay: unixStartDay,
      dayModifier: offset,
      isDayOff: isOff,
      timeslots,
    };
  }

  getIsDayOff(workHour: Workhour[], weekday: number): boolean {
    const currentDayObject = workHour.find((e) => e.weekday == weekday);
    return currentDayObject.is_day_off;
  }
}
