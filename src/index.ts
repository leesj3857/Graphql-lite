export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLRequestConfig {
  url: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
}

export interface GraphQLClientOptions extends GraphQLRequestConfig {
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export class GraphQLLite {
  private config: GraphQLClientOptions;

  constructor(options: GraphQLClientOptions) {
    this.config = {
      ...options,
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...options.defaultHeaders,
      },
    };
  }

  async request<T = any, V = Record<string, any>>(
    query: string,
    variables?: V,
    requestConfig?: Partial<GraphQLRequestConfig>
  ): Promise<GraphQLResponse<T>> {
    const config = { ...this.config, ...requestConfig };
    
    const controller = new AbortController();
    const timeoutId = config.timeout 
      ? setTimeout(() => controller.abort(), config.timeout)
      : null;

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          ...config.defaultHeaders,
          ...config.headers,
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
        credentials: config.credentials,
        mode: config.mode,
        cache: config.cache,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result as GraphQLResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  // 편의를 위한 메서드들
  async query<T = any, V = Record<string, any>>(
    query: string,
    variables?: V,
    requestConfig?: Partial<GraphQLRequestConfig>
  ): Promise<T> {
    const response = await this.request<T, V>(query, variables, requestConfig);
    if (response.errors) {
      throw new Error(response.errors.map(e => e.message).join(', '));
    }
    return response.data as T;
  }

  async mutation<T = any, V = Record<string, any>>(
    query: string,
    variables?: V,
    requestConfig?: Partial<GraphQLRequestConfig>
  ): Promise<T> {
    return this.query<T, V>(query, variables, requestConfig);
  }

  // 헤더 설정을 위한 유틸리티 메서드
  setHeader(key: string, value: string): void {
    this.config.defaultHeaders = {
      ...this.config.defaultHeaders,
      [key]: value,
    };
  }

  setHeaders(headers: Record<string, string>): void {
    this.config.defaultHeaders = {
      ...this.config.defaultHeaders,
      ...headers,
    };
  }
}

// 편의를 위한 함수
export function createClient(options: GraphQLClientOptions): GraphQLLite {
  return new GraphQLLite(options);
}

// 편의를 위한 템플릿 리터럴 함수
export function gql(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] || '');
  }, '');
} 

export * from './react';