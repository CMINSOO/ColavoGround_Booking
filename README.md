# 시작 가이드

**installation**

```
$ git clone https://github.com/CMINSOO/ColavoGround_Salon.git
$ npm install
```

**create**
```
.env //.env.example 참조        
```

**run code**

```
일반 실행
$ npm run start

개발모드 실행
$ npm run start:dev
```

# 테스트
**간편한 테스트를 위해 Swagger 적용**
- 서버 실행후 `localhost:${port}/api-docs` 로 이동

**Insomnia,Postman 을 이용한 테스트**
- 서버 실행후 `localhost:${port}/getTimeSlots` 로 요청
- Request Body Example
```
{
  "startDayIdentifier": "20210509",
  "days": 0,
  "serviceDuration": 1800,
  "timeslotInterval": 1800,
  "isIgnoreSchedule": false,
  "isIgnoreWorkhour": false,
  "timezoneIdentifier": "Asia/Seoul"
}
```

# 진행과정,트러블슈팅
- https://alpine-rain-094.notion.site/12ad97a585a88094b6e5ce84f67fe85f?v=4c147f8baf3e49999f6b5ed27925265b

