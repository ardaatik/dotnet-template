import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import type { Link as HypermediaLink } from '../../types/api';
import { Todo } from './types';

interface TodoDetailsProps {
  todo: Todo;
  onDelete?: () => void;
  onUpdate?: (updatedTodo: Todo) => void;
}

export const TodoDetails: React.FC<TodoDetailsProps> = ({ todo, onDelete }) => {
  const getOperationLink = (rel: string): HypermediaLink | undefined => {
    return todo.links.find(link => link.rel === rel);
  };

  const updateLink = getOperationLink('update');
  const deleteLink = getOperationLink('delete');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{todo.name}</CardTitle>
            {todo.description && (
              <CardDescription className="text-base">{todo.description}</CardDescription>
            )}
          </div>
          <div className="flex space-x-2">
            {updateLink && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/todos/${todo.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {deleteLink && onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(todo.createdAtUtc).toLocaleString()}
              </p>
            </div>
          </div>
          {todo.updatedAtUtc && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(todo.updatedAtUtc).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
