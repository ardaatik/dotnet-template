import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../api/config';
import type { Link as HypermediaLink } from '../../types/api';
import type { Todo, UpdateTodoDto } from './types';
import { useTodos } from './useTodos';

export const EditTodoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTodo, updateTodo, isLoading, error: apiError } = useTodos();
  const [error, setError] = useState<string | null>(null);
  const [todo, setTodo] = useState<Todo | null>(null);

  const [formData, setFormData] = useState<UpdateTodoDto>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadTodo();
  }, [id]);

  useEffect(() => {
    if (todo) {
      setFormData({
        name: todo.name,
        description: todo.description || '',
      });
    }
  }, [todo]);

  const loadTodo = async () => {
    if (!id) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    const updateLink = todo.links.find(link => link.rel === 'update');
    if (!updateLink) {
      setError('Cannot update this todo');
      return;
    }

    const result = await updateTodo(updateLink, formData);
    if (result) {
      navigate(`/todos/${todo.id}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (error || apiError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to={`/todos/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Todo
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
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to={`/todos/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Todo
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Todo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
