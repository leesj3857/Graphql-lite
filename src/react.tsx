import React, { createContext, useContext, ReactNode } from 'react';
import { GraphQLLite, GraphQLClientOptions, gql } from './index';

// Context 생성
const GraphQLContext = createContext<GraphQLLite | null>(null);

// Provider Props 타입 정의
interface GraphQLProviderProps {
  client: GraphQLLite;
  children: ReactNode;
}

// Provider 컴포넌트
export function GraphQLProvider({ client, children }: GraphQLProviderProps) {
  return (
    <GraphQLContext.Provider value={client}>
      {children}
    </GraphQLContext.Provider>
  );
}

// 클라이언트 훅
export function useGraphQL() {
  const client = useContext(GraphQLContext);
  if (!client) {
    throw new Error('useGraphQL must be used within a GraphQLProvider');
  }
  return client;
}

// 쿼리 훅
export function useQuery<T = any, V = Record<string, any>>(
  query: string,
  variables?: V,
  options?: {
    onCompleted?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const client = useGraphQL();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await client.query<T, V>(query, variables);
        if (mounted) {
          setData(result);
          setError(null);
          options?.onCompleted?.(result);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setData(null);
          options?.onError?.(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [client, query, JSON.stringify(variables)]);

  return { data, error, loading };
}

// 뮤테이션 훅
export function useMutation<T = any, V = Record<string, any>>(
  mutation: string,
  options?: {
    onCompleted?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const client = useGraphQL();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(
    async (variables?: V) => {
      try {
        setLoading(true);
        setError(null);
        const result = await client.mutation<T, V>(mutation, variables);
        setData(result);
        options?.onCompleted?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setData(null);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [client, mutation, options]
  );

  return { execute, data, error, loading };
}

export { gql }; 