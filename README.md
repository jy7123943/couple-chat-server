# Couple Lab (Client & Server)

## Introduction
**Couple Lab**은 최근 한 달 동안 연인과 나눈 대화를 분석해서 그래프로 시각화해주는 채팅 어플입니다. 연인의 아이디를 입력하여 둘 만의 채팅방을 만든 후 대화를 나눌 수 있습니다. 대화 분석하기 버튼을 누르면 한 달 간의 대화 감정 점수와 다른 커플들과 비교한 상대적인 대화량 점수를 통해 커플 보고서를 만들어줍니다.

## Preview

## Features
- 회원 가입 후 상대방의 아이디를 입력하면 자동으로 연결
- 연결 후 둘 만의 채팅방에서 채팅
- 앱 종료 이후에 채팅이 오는 경우 push 알림 수신
- 프로필 사진과 상태 메시지 변경
- 프로필 페이지에 사귄 기간 표시
- 최근 한 달 동안의 대화 분석 후 차트를 통한 시각화
- 커플 보고서를 사용자 스마트폰 갤러리에 이미지로 저장

## Requirements
- 안드로이드 기기 지원
- 채팅 push 알림은 **Android 8+ **이상인 디바이스만 지원

## Prerequisites
Couple Lab을 실행하기 위해서는 다음의 과정이 선행되어야 합니다.

### Client
- `environment.js` 파일을 생성한 후 아래 코드를 복사하여 붙여넣습니다.
- 아래 코드 중 `<user-public-ip-address>` 부분을 삭제하고 사용자 컴퓨터의 공용 ip 주소를 넣습니다.
```javascript
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const localhost = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://<user-public-ip-address>:3000';
const ENV = {
  dev: {
    apiUrl: localhost
  },
  prod: {
    apiUrl: localhost
  }
}
const getEnvVars = (env = Constants.manifest.releaseChannel) => {
  if (__DEV__) {
    return ENV.dev;
  } else {
    return ENV.prod;
  }
}
export default getEnvVars;
```
- 아래 링크를 클릭하여 1단계 ~ 3단계 과정을 진행합니다.  
[Click Here](https://firebase.google.com/docs/android/setup?hl=ko)
- 위 과정 3단계에서 다운받은 `google-services.json`은 아래에서 clone받을 Client 폴더의 app.json에 아래 예제와 같이 추가합니다.
```
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": <package-name>
    }
  }
}
```

### Server
- [Google Cloud Console](https://console.cloud.google.com/)에 위에서 생성한 프로젝트를 등록합니다.
- [사용자 인증 정보](https://console.cloud.google.com/apis/credentials/serviceaccountkey) 페이지에서 `사용자 인증 정보 만들기` -> `서비스 계정 키 만들기`를 선택합니다.
- JSON 파일을 생성하여 사용자의 컴퓨터에 저장합니다.
- `.env` 파일을 생성하여 위에서 저장한 Google 서비스 계정 키 JSON 파일의 저장 경로를 환경변수를 입력합니다.
- 그 외의 환경변수도 아래와 같이 입력하여 저장합니다.
```
PORT=8080
MONGODB_ATLAS_URL=<mongoDB-connection-string>
JWT_SECRET_KEY=<jwt-secret-key>
GOOGLE_APPLICATION_CREDENTIALS=<google-service-account-key-json-path>
```

## Installation
### Client
```
git clone https://github.com/jy7123943/couple-chat-client.git
cd couple-chat-client
# 위에서 생성한 environment.js 파일을 Root 디렉토리에 추가
npm install
expo start
```

### Server
```
git clone https://github.com/jy7123943/couple-chat-server.git
cd couple-chat-server
# 위에서 생성한 .env 파일을 Root 디렉토리에 추가
npm install
npm start
```

## Skills
### Client
- ES2015+
- React Native
- Expo
- React Navigation
- Web Socket (Socket.io-client)

### Server
- ES2015+
- Node.js
- Express
- JSON Web Token Authentication
- MongoDB, Atlas
- Mongoose
- Web Socket (Socket.io)
- AWS S3
- Google Natural Language Api

## Test
### Client
- Jest, Enzyme

### Server
- Mocha, Chai, Supertest

## Project Control
- Git, GitHub
- Trello를 이용한 Task Management

## Deployment
### Server
- Amazon Web Services(AWS) Elastic Beanstalk
- Circle CI를 이용한 빌드 자동화

## Challenges
- React Native로 안드로이드 앱 구축을 처음으로 도전해보았는데 React로 웹을 구축하는 것과 구조적인 면에서 다른 점이 많아서 어려움이 많았습니다. 초반에 프로젝트를 기획할 때 React Native 관련 사전 조사를 최대한 한 후에 진행하여 본 프로젝트 때 시간을 최대한 단축시키려고 노력하였습니다.
- 부족한 시간 내에 기능 구현을 하느라 React Native의 구조를 완전히 파악하지 못하고 시작했습니다. Redux를 이용하여 상태 관리를 하지 못해 아쉬움이 남습니다. 다음 번에 React Native로 프로젝트를 진행하게 된다면 Redux를 꼭 사용해보고 싶습니다.
- React Native에서는 Navigation이 Stack 구조로 되어있어 Life Cycle Method가 원하는대로 작동하지 않아 채팅방 구현 시 많은 어려움을 겪었습니다. React Navigation 자체 Life Cycle Method를 추가하여 해결하였습니다.

## Things to do
- Client Deployment
- 채팅 대화 저장 시 대화량을 디비에 따로 저장하여 대화 분석 시 효율적으로 분석하도록 리팩토링
- 채팅 대화를 일정량만 불러오고 페이지 상단으로 스크롤 시 추가로 Api 요청하도록 리팩토링
- 채팅방 사진 전송 기능 추가
- Client Component Unit Test 추가
