import { useCallback, useState } from 'react';
import { API_BASE_URL, HATEOAS_ACCEPT } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import type { Link } from '../../types/api';
import { fetchWithAuth } from '../../utils/fetchUtils';
import { CreateTodoDto, Todo, UpdateTodoDto } from './types';

interface TodosResponse {
  items: Todo[];
  links: Link[];
  totalCount?: number;
}

interface ListTodosParams {
  pageSize?: number;
  fields?: string;
  sort?: string;
  url?: string;
}

export function useTodos() {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listTodos = useCallback(
    async ({
      pageSize = 6,
      fields,
      sort,
      url,
    }: ListTodosParams = {}): Promise<TodosResponse | null> => {
      if (!accessToken) return null;
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchWithAuth<TodosResponse>(
          url ||
            `${API_BASE_URL}/todos?pageSize=${pageSize}${fields ? `&fields=${fields}` : ''}${sort ? `&sort=${sort}` : ''}`,
          accessToken,
          {
            headers: {
              Accept: HATEOAS_ACCEPT,
            },
          }
        );
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch todos';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const getTodo = async (link: Link): Promise<Todo | null> => {
    if (!accessToken) return null;
    if (link.rel !== 'self' || link.method !== 'GET') {
      throw new Error('Invalid operation: Link does not support fetching todo');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithAuth<Todo>(link.href, accessToken, {
        headers: {
          Accept: HATEOAS_ACCEPT,
        },
      });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todo';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTodo = async (link: Link, data: UpdateTodoDto): Promise<boolean> => {
    if (!accessToken) return false;
    if (link.rel !== 'update' || link.method !== 'PUT') {
      throw new Error('Invalid operation: Link does not support updating todo');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetchWithAuth<Todo>(link.href, accessToken, {
        method: link.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createTodo = async (data: CreateTodoDto): Promise<Todo | null> => {
    if (!accessToken) return null;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithAuth<Todo>(`${API_BASE_URL}/todos`, accessToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: HATEOAS_ACCEPT,
        },
        body: JSON.stringify(data),
      });

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create todo';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTodo = async (link: Link): Promise<boolean> => {
    if (!accessToken) return false;
    if (link.rel !== 'delete' || link.method !== 'DELETE') {
      throw new Error('Invalid operation: Link does not support deleting todo');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetchWithAuth<Todo>(link.href, accessToken, {
        method: link.method,
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo,
    isLoading,
    error,
  };
}
