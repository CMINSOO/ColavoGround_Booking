import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDateTimeTableDto {
  @ApiProperty({ example: '20210509' })
  @IsNotEmpty()
  @IsString()
  startDayIdentifier: string;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  days: number = 1;

  @ApiProperty({ example: 1800 })
  @IsNotEmpty()
  @IsNumber()
  serviceDuration: number;

  @ApiProperty({ example: 1800 })
  @IsOptional()
  @IsNumber()
  timeslotInterval: number = 1800;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  isIgnoreSchedule: boolean = false;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  isIgnoreWorkhour: boolean = false;

  @ApiProperty({ example: 'Asia/Seoul' })
  @IsNotEmpty()
  @IsString()
  timezoneIdentifier: string;
}
