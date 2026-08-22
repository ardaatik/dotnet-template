import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TodoDetails } from './TodoDetails';
import type { Todo } from './types';
import { useTodos } from './useTodos';

export const CreateTodoPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTodo, isLoading, error: apiError } = useTodos();
  const [error, setError] = useState<string | null>(null);
  const [createdTodo, setCreatedTodo] = useState<Todo | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await createTodo(formData);
    if (result) {
      setCreatedTodo(result);
      navigate(`/todos/${result.id}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTodoUpdate = (updatedTodo: Todo) => {
    setCreatedTodo(updatedTodo);
  };

  if (createdTodo) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/todos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Todos
          </Link>
        </Button>
        <TodoDetails todo={createdTodo} onUpdate={handleTodoUpdate} />
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

      <Card>
        <CardHeader>
          <CardTitle>Create New Todo</CardTitle>
        </CardHeader>
        <CardContent>
          {(error || apiError) && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error || apiError}</AlertDescription>
            </Alert>
          )}

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
                placeholder="Enter todo name"
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
                placeholder="Enter todo description (optional)"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating...' : 'Create Todo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
