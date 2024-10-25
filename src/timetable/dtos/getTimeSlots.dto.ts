import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetTimeSlotsDto {
  @IsString()
  start_day_identifier: string;

  @IsString()
  timezone_identifier: string;

  @IsNumber()
  service_duration: number;

  @IsNumber()
  @IsOptional()
  days?: number = 1;

  @IsNumber()
  @IsOptional()
  timeslot_interval?: number;

  @IsBoolean()
  @IsOptional()
  is_ignore_schedule?: boolean;

  @IsBoolean()
  @IsOptional()
  is_ignore_workhour?: boolean;
}
