# GraphQL Mini

GraphQL Mini는 GraphQL 요청을 더 간편하게 만들어주는 경량화된 클라이언트 라이브러리입니다. 외부 의존성 없이 순수하게 GraphQL 요청을 처리할 수 있습니다.

## 설치

```bash
npm install graphql-mini
# 또는
yarn add graphql-mini
```

## React 사용법

### Provider 설정

```typescript
import { createClient, GraphQLProvider } from 'graphql-mini';

const client = createClient({
  url: 'https://api.example.com/graphql',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

function App() {
  return (
    <GraphQLProvider client={client}>
      <YourApp />
    </GraphQLProvider>
  );
}
```

### 컴포넌트에서 사용하기

```typescript
import { useQuery, useMutation, gql } from 'graphql-mini';

// 쿼리 사용 예시
function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error } = useQuery(
    gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `,
    { id: userId }
  );

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}

// 뮤테이션 사용 예시
function CreateUser() {
  const { execute, loading, error } = useMutation(
    gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          name
        }
      }
    `
  );

  const handleSubmit = async (formData: any) => {
    try {
      const result = await execute({
        input: {
          name: formData.name,
          email: formData.email
        }
      });
      console.log('사용자 생성됨:', result);
    } catch (err) {
      console.error('사용자 생성 실패:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 내용 */}
    </form>
  );
}
```

### 고급 기능

#### 타임아웃 설정

```typescript
const client = createClient({
  url: 'https://api.example.com/graphql',
  timeout: 5000 // 5초 타임아웃
});
```

#### 헤더 관리

```typescript
const client = createClient({
  url: 'https://api.example.com/graphql'
});

// 단일 헤더 설정
client.setHeader('Authorization', 'Bearer new-token');

// 여러 헤더 한번에 설정
client.setHeaders({
  'Authorization': 'Bearer new-token',
  'X-Custom-Header': 'custom-value'
});
```

#### 커스텀 요청 설정

```typescript
const data = await client.query(query, variables, {
  headers: {
    'Custom-Header': 'value'
  },
  credentials: 'include',
  mode: 'cors',
  cache: 'no-cache'
});
```

## 특징

- 🚀 경량화된 구현
- 🔒 타입스크립트 지원
- ⚡️ 타임아웃 지원
- 🔄 헤더 관리 기능
- 🛠 커스텀 요청 설정
- 📦 외부 의존성 없음
- 📝 문자열 또는 템플릿 리터럴로 쿼리 작성 가능
- ⚛️ React 통합 지원
- 🎣 React Hooks 제공 (useQuery, useMutation)

## 라이선스

MIT 