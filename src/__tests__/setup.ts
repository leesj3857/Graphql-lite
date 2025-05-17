// 전역 fetch 모킹
global.fetch = jest.fn();

// 테스트 후 모든 모킹 초기화
afterEach(() => {
  jest.clearAllMocks();
}); 