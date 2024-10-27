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
  //시작일 형식바꿔주는 함수
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

    console.log('^^^^^^^^', createDateTimeTableDto);
    console.log('시간대 :', timezone_identifier);

    //json파일 읽어온것
    const workHours = await this.jsonLoader.getWorkHours();
    const events = await this.jsonLoader.getEvents();

    console.log('1111111', workHours);
    console.log('2222222', events);
    console.log('33333', days);
    console.log('444444', is_ignore_schedule);
    console.log('5555555', is_ignore_workhour);
    console.log('666666', timeslot_interval);
    //start_day_identifier 변환 및 유닉스 타임 계산
    const formattedStartDay = this.formatStartDay(start_day_identifier);
    console.log('형식에 맞게 변환한 시작날짜', formattedStartDay);

    //형식에 맞게 반환한 날짜를 유닉스 시간으로 변경
    const unixStartDay = this.calculateUnixTime(formattedStartDay);
    console.log('시작날짜를 유닉스시간대로 변환:', unixStartDay);

    const startDay = dayjs
      .tz(formattedStartDay, timezone_identifier)
      .startOf('day');
    console.log('startDay:', startDay);

    //유닉스 타임에서 국가시간에 맞게 요일구하기
    const day = await this.getDayFromUnixTime(
      unixStartDay,
      timezone_identifier,
    );
    console.log('국가별 요일:', day);

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

  //unixTime 계산기
  calculateUnixTime(input: string) {
    return Math.floor(new Date(input).getTime() / 1000);
  }

  //유닉스타임을 날짜로 변환한후 요일을 구하는 함수
  //day-off인날은 아무것도 반환하지 않기위해
  getDayFromUnixTime(unixTime: number, tz: string) {
    //TODO: 이미 unixtime 형식으로 넘겨받았는데 다시 할 필요가 있을까? 일단 우선순위 아래
    const date = dayjs.unix(unixTime).tz(tz);
    console.log('@@@@date:', date);
    const day = date.format('ddd');
    console.log('####', day);
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
    console.log('요일키값:', dayValues[day]);
    return dayValues[day];
  }

  //TODO: while문 말고 개선할수있는 방법이 있는지 찾아봐야할듯
  //TimeSlot만들어주는 함숭
  //TODO: 이거 파라미터도 DTO로 빼주면 더 깔끔할듯?
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
    console.log('TL StartDay:', startDay);

    console.log('넘어오는지 확인', workHours);
    const workhour = workHours.find((e) => {
      console.log(weekday, '-----', e.weekday, '-----', e.weekday === weekday);
      return e.weekday === weekday;
    });
    console.log('workhour:', workhour);

    let openTime = 0;
    let closeTime = 86400; //초 단위로 계산한 하루

    console.log(
      '이게 문제인듯',
      !is_ignore_workhour && workhour && !workhour.is_day_off,
    );
    if (!is_ignore_workhour && workhour && !workhour.is_day_off) {
      openTime = workhour.open_interval;
      console.log('@#@#@#@#@', openTime);
      closeTime = workhour.close_interval;
    }

    let currentTime = startDay.add(openTime, 'second');

    console.log('!@%!@%!@%!@%!@%!@%!@%시작시간', currentTime);

    //하루 전체시간은 = 86400초. 해당 초 안의 범위에서만 슬롯생성하기
    while (currentTime.diff(startDay, 'second') < closeTime) {
      const currentEndTime = currentTime.add(service_duration, 'second');

      // 하루를 넘지 않을 때만 타임슬롯 추가
      if (currentEndTime.diff(startDay, 'second') <= closeTime) {
        const timeslot = {
          begin_at: currentTime.unix(),
          end_at: currentEndTime.unix(),
        };
        console.log('찐텐 시작시간@@@@2', timeslot.begin_at);
        if (
          is_ignore_schedule ||
          (!is_ignore_schedule && !this.isDuplicateEvents(timeslot, events))
        ) {
          timeslots.push(timeslot);
          console.log('첫시작시간', timeslots[0]);
        }
      }

      // 시작 시간을 다음 타임슬롯으로 이동
      currentTime = currentTime.add(timeslot_interval, 'second');
    }
    console.log('진짜로 반환되는 타임슬롯', timeslots);
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
    //const weekday = currentDay.day();

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
