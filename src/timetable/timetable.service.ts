import { BadRequestException, Injectable } from '@nestjs/common';
import { JsonLoaderService } from './json-loader.service';
import { CreateDateTimeTableDto } from './dtos/create-date-time-table.dto.ts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  DayTimetable,
  Event,
  Timeslot,
  Workhour,
} from './interfaces/interfaces';
import { GenerateDayTimetableDto } from './dtos/generate-date-time-table.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TimetableService {
  constructor(private readonly jsonLoader: JsonLoaderService) {}
  async createDayTimeTable(createDateTimeTableDto: CreateDateTimeTableDto) {
    const {
      start_day_identifier,
      timezone_identifier,
      days,
      service_duration,
      timeslot_interval,
      is_ignore_schedule,
      is_ignore_workhour,
    } = createDateTimeTableDto;

    //json파일 읽어온것
    const workHours = await this.jsonLoader.getWorkHours();
    const events = await this.jsonLoader.getEvents();

    //start_day_identifier 변환 및 유닉스 타임 계산
    const formattedStartDay = this.formatStartDay(start_day_identifier);

    //들어온 days값에 맞게 날짜에 대한 테이블 생성하기
    //days 값이 음수로 들어올때 오류가 발생해서 Math.abs를 통해 절대값으로 변환
    const dayTimetable = Array.from({ length: Math.abs(days) + 1 }, (_, i) => {
      const offset = days < 0 ? -i : i; // days가 음수일 경우 날짜를 과거로 이동

      const generateDayTimetableDto: GenerateDayTimetableDto = {
        offset,
        startDay: formattedStartDay,
        timezone_identifier,
        timeslot_interval,
        service_duration,
        events,
        is_ignore_schedule,
        workHours,
        is_ignore_workhour,
      };

      return this.generateDateTimetable(generateDayTimetableDto);
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

  //TODO: while문 말고 개선할수있는 방법이 있는지 찾아봐야할듯
  //TimeSlot만들어주는 함숭
  createTimeSlot(
    date: string,
    timezone: string,
    timeslot_interval: number,
    service_duration: number,
    events: Event[],
    is_ignore_schedule: boolean,
    workHours: Workhour[],
    is_ignore_workhour: boolean,
    weekday: number,
  ): Timeslot[] {
    const timeslots: Timeslot[] = [];

    const startDay = dayjs.tz(date, timezone).startOf('day');

    const workhour = workHours.find((e) => {
      return e.weekday === weekday;
    });

    let openTime = 0;
    let closeTime = 86400; //초 단위로 계산한 하루

    if (!is_ignore_workhour && workhour && !workhour.is_day_off) {
      openTime = workhour.open_interval;
      closeTime = workhour.close_interval;
    }

    let currentTime = startDay.add(openTime, 'second');

    //하루 전체시간은 = 86400초. 해당 초 안의 범위에서만 슬롯생성하기
    while (currentTime.diff(startDay, 'second') < closeTime) {
      const currentEndTime = currentTime.add(service_duration, 'second');

      // 하루를 넘지 않을 때만 타임슬롯 추가
      if (currentEndTime.diff(startDay, 'second') <= closeTime) {
        const timeslot = {
          begin_at: currentTime.unix(),
          end_at: currentEndTime.unix(),
        };
        if (
          is_ignore_schedule ||
          (!is_ignore_schedule && !this.isDuplicateEvents(timeslot, events))
        ) {
          timeslots.push(timeslot);
        }
      }

      // 시작 시간을 다음 타임슬롯으로 이동
      currentTime = currentTime.add(timeslot_interval, 'second');
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
        (timeslot.begin_at >= event.begin_at &&
          timeslot.begin_at < event.end_at) ||
        (timeslot.end_at > event.begin_at && timeslot.end_at <= event.end_at) ||
        (event.begin_at >= timeslot.begin_at &&
          event.begin_at < timeslot.end_at) ||
        (event.end_at > timeslot.begin_at && event.end_at <= timeslot.end_at),
    );
  }

  generateDateTimetable(
    generateDateTimetableDto: GenerateDayTimetableDto,
  ): DayTimetable {
    const {
      offset,
      startDay,
      timezone_identifier,
      timeslot_interval,
      service_duration,
      events,
      is_ignore_schedule,
      workHours,
      is_ignore_workhour,
    } = generateDateTimetableDto;

    const convertedStartDay = dayjs
      .tz(startDay, timezone_identifier)
      .startOf('day'); // 새로운 변수명 사용
    const currentDay = convertedStartDay.add(offset, 'day');
    const unixStartDay = currentDay.unix();
    const weekday = this.getDayFromUnixTime(unixStartDay, timezone_identifier);

    const timeslots = this.createTimeSlot(
      currentDay.format('YYYY-MM-DD'),
      timezone_identifier,
      timeslot_interval,
      service_duration,
      events,
      is_ignore_schedule,
      workHours,
      is_ignore_workhour,
      weekday,
    );

    return {
      start_of_day: unixStartDay,
      day_modifier: offset,
      is_day_off: false,
      timeslots,
    };
  }
}
