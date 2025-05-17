import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphQLProvider, useQuery, useMutation } from '../react';
import { createClient } from '../index';

describe('React Hooks', () => {
  const mockUrl = 'https://api.example.com/graphql';
  const client = createClient({ url: mockUrl });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GraphQLProvider client={client}>
      {children}
    </GraphQLProvider>
  );

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useQuery', () => {
    const mockQuery = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `;

    const mockVariables = { id: '123' };
    const mockResponse = {
      data: {
        user: {
          id: '123',
          name: 'John Doe'
        }
      }
    };

    it('데이터를 성공적으로 가져와야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(
        () => useQuery(mockQuery, mockVariables),
        { wrapper }
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      // 비동기 작업 완료 대기
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockResponse.data);
      expect(result.current.error).toBe(null);
    });

    it('에러가 발생하면 에러 상태를 설정해야 함', async () => {
      const mockError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(
        () => useQuery(mockQuery, mockVariables),
        { wrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('GraphQL request failed: Network error');
    });

    it('onCompleted 콜백을 호출해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const onCompleted = jest.fn();
      renderHook(
        () => useQuery(mockQuery, mockVariables, { onCompleted }),
        { wrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(onCompleted).toHaveBeenCalledWith(mockResponse.data);
    });
  });

  describe('useMutation', () => {
    const mockMutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          name
        }
      }
    `;

    const mockVariables = {
      input: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };

    const mockResponse = {
      data: {
        createUser: {
          id: '123',
          name: 'John Doe'
        }
      }
    };

    it('뮤테이션을 성공적으로 실행해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { result } = renderHook(
        () => useMutation(mockMutation),
        { wrapper }
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await act(async () => {
        await result.current.execute(mockVariables);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockResponse.data);
      expect(result.current.error).toBe(null);
    });

    it('에러가 발생하면 에러 상태를 설정해야 함', async () => {
      const mockError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(
        () => useMutation(mockMutation),
        { wrapper }
      );

      await act(async () => {
        try {
          await result.current.execute(mockVariables);
        } catch (error) {
          // 에러는 예상된 동작
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('GraphQL request failed: Network error');
    });

    it('onCompleted 콜백을 호출해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const onCompleted = jest.fn();
      const { result } = renderHook(
        () => useMutation(mockMutation, { onCompleted }),
        { wrapper }
      );

      await act(async () => {
        await result.current.execute(mockVariables);
      });

      expect(onCompleted).toHaveBeenCalledWith(mockResponse.data);
    });
  });
}); 