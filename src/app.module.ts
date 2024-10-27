import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TimetableModule } from './timetable/timetable.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TimetableModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
