import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableLoadMoreRow } from '@/components/ui/table-load-more-row';
import { useInfiniteHateoasList } from '@/hooks/useInfiniteHateoasList';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Link as HypermediaLink } from '../../types/api';
import { buildTodosSortParam, type Todo, type TodosSortColumn } from './types';
import { useTodos } from './useTodos';

const PAGE_SIZE = 10;
const COLUMN_COUNT = 5;

function TodosTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: '24%' }} />
      <col style={{ width: '32%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '5rem' }} />
    </colgroup>
  );
}

const actionsColumnClassName = 'w-[1%] whitespace-nowrap pl-1 pr-3 text-right';

function TodosColumnHeader({
  title,
  sorted,
  onSort,
}: {
  title: ReactNode;
  sorted: false | 'asc' | 'desc';
  onSort: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'gap-1.5 font-medium text-muted-foreground',
        'focus-visible:bg-accent focus-visible:text-accent-foreground',
        'h-auto items-center whitespace-normal pl-2 pr-1.5 py-1.5 text-sm'
      )}
      onClick={onSort}
    >
      {title}
      {sorted === 'desc' ? (
        <ChevronDown className="shrink-0 size-4" />
      ) : sorted === 'asc' ? (
        <ChevronUp className="shrink-0 size-4" />
      ) : (
        <ChevronsUpDown className="shrink-0 size-4 opacity-60" />
      )}
    </Button>
  );
}

export const TodosPage: React.FC = () => {
  const { listTodos, createTodo, updateTodo, deleteTodo, isLoading, error } = useTodos();
  const [createLink, setCreateLink] = useState<HypermediaLink | null>(null);
  const [todosSort, setTodosSort] = useState<{
    column: TodosSortColumn;
    desc: boolean;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const sortParam = useMemo(() => buildTodosSortParam(todosSort), [todosSort]);

  const loadPage = useCallback(
    async (params: { pageSize?: number; sort?: string; url?: string }) => {
      const result = await listTodos(params);
      if (result?.links) {
        setCreateLink(result.links.find(link => link.rel === 'create') ?? null);
      }
      return result;
    },
    [listTodos]
  );

  const {
    items: todos,
    hasNextPage,
    isLoadingMore,
    loadInitial,
    loadMore,
    handleScroll,
    containerRef,
  } = useInfiniteHateoasList<Todo>({
    loadPage,
    pageSize: PAGE_SIZE,
    sort: sortParam,
  });

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleTodosSort = (column: TodosSortColumn) => {
    setTodosSort(prev =>
      prev?.column === column ? { column, desc: !prev.desc } : { column, desc: false }
    );
  };

  const sortState = (column: TodosSortColumn) =>
    todosSort?.column === column ? (todosSort.desc ? 'desc' : 'asc') : false;

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setIsCreateOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditTodo(todo);
    setForm({ name: todo.name, description: todo.description || '' });
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createTodo({ name: form.name, description: form.description });
    if (created) {
      setIsCreateOpen(false);
      await loadInitial();
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTodo) return;
    const updateLink = editTodo.links.find(l => l.rel === 'update');
    if (!updateLink) return;
    const ok = await updateTodo(updateLink, { name: form.name, description: form.description });
    if (ok) {
      setEditTodo(null);
      await loadInitial();
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const del = pendingDelete.links.find(l => l.rel === 'delete');
    if (!del) return;
    const ok = await deleteTodo(del);
    if (ok) {
      setPendingDelete(null);
      await loadInitial();
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">My Todos</h1>
          <p className="text-xs text-muted-foreground">Manage your tasks and track your progress</p>
        </div>
        {createLink && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" />
                New Todo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Todo</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    minLength={3}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && todos.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No todos yet.</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
          <div className="shrink-0 border-b bg-muted/50">
            <Table noContainer className="table-fixed">
              <TodosTableColGroup />
              <TableHeader className="[&_tr]:border-b-0 [&_tr]:bg-transparent [&_tr>*]:border-t-0">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 border-b-0">
                    <TodosColumnHeader
                      title="Name"
                      sorted={sortState('Name')}
                      onSort={() => handleTodosSort('Name')}
                    />
                  </TableHead>
                  <TableHead className="h-10 border-b-0">
                    <TodosColumnHeader
                      title="Description"
                      sorted={sortState('Description')}
                      onSort={() => handleTodosSort('Description')}
                    />
                  </TableHead>
                  <TableHead className="h-10 border-b-0">
                    <TodosColumnHeader
                      title="Created"
                      sorted={sortState('CreatedAtUtc')}
                      onSort={() => handleTodosSort('CreatedAtUtc')}
                    />
                  </TableHead>
                  <TableHead className="h-10 border-b-0">
                    <TodosColumnHeader
                      title="Updated"
                      sorted={sortState('UpdatedAtUtc')}
                      onSort={() => handleTodosSort('UpdatedAtUtc')}
                    />
                  </TableHead>
                  <TableHead className={cn('h-10 border-b-0', actionsColumnClassName)}>
                    <span className="inline-flex h-10 items-center text-sm font-medium text-muted-foreground">
                      Actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div ref={containerRef} className="min-h-0 flex-1 overflow-auto" onScroll={handleScroll}>
            <Table noContainer className="table-fixed">
              <TodosTableColGroup />
              <TableBody>
                {todos.map(todo => (
                  <TableRow key={todo.id}>
                    <TableCell className="font-medium">{todo.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {todo.description || '-'}
                    </TableCell>
                    <TableCell>
                      {todo.createdAtUtc ? (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(todo.createdAtUtc).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {todo.updatedAtUtc ? (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(todo.updatedAtUtc).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className={actionsColumnClassName}>
                      <div className="inline-flex justify-end gap-1">
                        <Dialog
                          open={!!editTodo && editTodo.id === todo.id}
                          onOpenChange={open => !open && setEditTodo(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(todo)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Todo</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submitEdit} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                  id="edit-name"
                                  value={form.name}
                                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                  minLength={3}
                                  maxLength={100}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                  id="edit-description"
                                  value={form.description}
                                  onChange={e =>
                                    setForm(f => ({ ...f, description: e.target.value }))
                                  }
                                  maxLength={500}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setEditTodo(null)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">Save</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog
                          open={!!pendingDelete && pendingDelete.id === todo.id}
                          onOpenChange={open => !open && setPendingDelete(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setPendingDelete(todo)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete todo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the todo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel asChild>
                                <Button variant="ghost">Cancel</Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button variant="destructive" onClick={confirmDelete}>
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableLoadMoreRow
                  colSpan={COLUMN_COUNT}
                  hasNextPage={hasNextPage}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMore}
                  scrollRootRef={containerRef}
                  showEndMessage={false}
                  showLoadMoreButton={false}
                />
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
