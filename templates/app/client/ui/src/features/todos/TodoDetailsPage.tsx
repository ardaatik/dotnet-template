import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../api/config';
import type { Link as HypermediaLink } from '../../types/api';
import { TodoDetails } from './TodoDetails';
import type { Todo } from './types';
import { useTodos } from './useTodos';

export const TodoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTodo, deleteTodo, isLoading, error: apiError } = useTodos();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodo();
  }, [id]);

  const loadTodo = async () => {
    if (!id) return;

    // Create a self link for the todo
    const selfLink: HypermediaLink = {
      href: `${API_BASE_URL}/todos/${id}`,
      rel: 'self',
      method: 'GET',
    };

    const result = await getTodo(selfLink);
    if (result) {
      setTodo(result);
      setError(null);
    } else {
      setError('Failed to load todo');
    }
  };

  const handleTodoUpdate = (updatedTodo: Todo) => {
    setTodo(updatedTodo);
  };

  const handleDelete = async () => {
    if (!todo) return;

    const deleteLink = todo.links.find(link => link.rel === 'delete');
    if (!deleteLink) {
      setError('Cannot delete this todo');
      return;
    }

    if (window.confirm('Are you sure you want to delete this todo?')) {
      const success = await deleteTodo(deleteLink);
      if (success) {
        navigate('/todos');
      }
    }
  };

  if (error || apiError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/todos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Todos
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || apiError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !todo) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to="/todos">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Todos
        </Link>
      </Button>
      <TodoDetails todo={todo} onUpdate={handleTodoUpdate} onDelete={handleDelete} />
    </div>
  );
};
