import { GraphQLLite, createClient } from '../index';

describe('GraphQLLite', () => {
  const mockUrl = 'https://api.example.com/graphql';
  let client: GraphQLLite;

  beforeEach(() => {
    client = createClient({ url: mockUrl });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('query', () => {
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

    it('성공적으로 쿼리를 실행해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.query(mockQuery, mockVariables);

      expect(global.fetch).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            query: mockQuery,
            variables: mockVariables
          })
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('에러가 발생하면 예외를 던져야 함', async () => {
      const mockError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(client.query(mockQuery, mockVariables))
        .rejects
        .toThrow('GraphQL request failed: Network error');
    });

    it('GraphQL 에러가 발생하면 예외를 던져야 함', async () => {
      const mockGraphQLError = {
        data: null,
        errors: [{ message: 'User not found' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGraphQLError)
      });

      await expect(client.query(mockQuery, mockVariables))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('mutation', () => {
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

    it('성공적으로 뮤테이션을 실행해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.mutation(mockMutation, mockVariables);

      expect(global.fetch).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: mockMutation,
            variables: mockVariables
          })
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('headers', () => {
    it('기본 헤더를 설정해야 함', () => {
      const customHeaders = {
        'Authorization': 'Bearer token',
        'X-Custom-Header': 'value'
      };

      client.setHeaders(customHeaders);

      expect(client['config'].defaultHeaders).toEqual(
        expect.objectContaining(customHeaders)
      );
    });

    it('단일 헤더를 설정해야 함', () => {
      client.setHeader('Authorization', 'Bearer token');

      expect(client['config'].defaultHeaders).toEqual(
        expect.objectContaining({
          'Authorization': 'Bearer token'
        })
      );
    });
  });

  describe('timeout', () => {
    it('타임아웃이 발생하면 요청을 중단해야 함', async () => {
      const timeoutClient = createClient({
        url: mockUrl,
        timeout: 100
      });

      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(timeoutClient.query('query { hello }'))
        .rejects
        .toThrow();
    });
  });
}); 