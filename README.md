# 🧗 볼더링 파티 - 당근 클라이밍 크루

실시간 팀 점수 관리 웹앱

## 🚀 배포 가이드

### 1단계: Firebase 설정 (무료)

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름 입력 (예: `bouldering-party`)
4. Google Analytics는 **사용 안함**으로 해도 됨 → **프로젝트 만들기**

#### Realtime Database 만들기
1. 왼쪽 메뉴에서 **빌드 → Realtime Database** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치: **싱가포르 (asia-southeast1)** 선택 (한국에서 빠름)
4. **"테스트 모드에서 시작"** 선택 → **사용 설정**

#### 웹 앱 등록
1. 프로젝트 개요 페이지에서 **</>** (웹) 아이콘 클릭
2. 앱 닉네임 입력 (예: `bouldering-web`)
3. **"Firebase 호스팅도 설정"** 체크 안 해도 됨
4. **앱 등록** 클릭
5. 나오는 `firebaseConfig` 값들을 메모장에 복사해두기!

```javascript
// 이런 형태로 나옴
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bouldering-party.firebaseapp.com",
  databaseURL: "https://bouldering-party-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bouldering-party",
  storageBucket: "bouldering-party.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

### 2단계: Vercel 배포 (무료)

#### GitHub에 코드 올리기
1. [GitHub](https://github.com) 로그인
2. 오른쪽 위 **+** → **New repository**
3. Repository name: `bouldering-party`
4. **Create repository** 클릭
5. 이 폴더의 파일들을 업로드 (Add file → Upload files)

#### Vercel 연결
1. [Vercel](https://vercel.com) 접속 → **Sign up with GitHub**
2. **Add New → Project**
3. `bouldering-party` 저장소 **Import**
4. **Environment Variables** 섹션에서 Firebase 값 입력:

| Name | Value |
|------|-------|
| VITE_FIREBASE_API_KEY | AIzaSy... |
| VITE_FIREBASE_AUTH_DOMAIN | your-project.firebaseapp.com |
| VITE_FIREBASE_DATABASE_URL | https://your-project-default-rtdb.firebasedatabase.app |
| VITE_FIREBASE_PROJECT_ID | your-project |
| VITE_FIREBASE_STORAGE_BUCKET | your-project.appspot.com |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 123456789 |
| VITE_FIREBASE_APP_ID | 1:123456789:web:abcdef |

5. **Deploy** 클릭!

#### 완료! 🎉
배포 완료되면 `https://bouldering-party-xxx.vercel.app` 같은 주소가 생김!
이 링크를 크루원들에게 공유하면 됨

---

### 3단계: Firebase 보안 규칙 설정 (선택)

파티 끝나면 데이터베이스 보안을 위해:

1. Firebase Console → Realtime Database → **규칙** 탭
2. 아래 내용으로 변경:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

파티 끝나면 `".write": false`로 바꾸면 더 이상 수정 안 됨

---

## 🔐 관리자 비밀번호

`danggeun`

---

## 📱 사용법

1. 관리자가 비밀번호 입력 → 팀 배정
2. 크루원들 링크 접속 → 본인 이름 선택 → 점수 입력
3. 전체 현황에서 실시간 경쟁!

---

## 🛠 로컬 개발 (선택)

```bash
npm install
cp .env.example .env  # 환경변수 파일 복사 후 수정
npm run dev
```

---

## 💡 문제 해결

**Q: Firebase 연결 안 됨**
- 환경변수 값이 정확한지 확인
- DATABASE_URL에 `.firebasedatabase.app` 포함되어 있는지 확인

**Q: 점수가 실시간 반영 안 됨**
- Realtime Database 규칙이 read/write true인지 확인

**Q: Vercel 배포 실패**
- 환경변수가 모두 입력되었는지 확인
