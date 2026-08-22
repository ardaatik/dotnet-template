import { HateoasResponse } from '../../types/api';

export interface CreateTodoDto {
  name: string;
  description?: string;
}

export interface UpdateTodoDto {
  name: string;
  description?: string;
}

export interface Todo extends UpdateTodoDto, HateoasResponse {
  id: string;
  isArchived: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export type TodosSortColumn = 'Name' | 'Description' | 'CreatedAtUtc' | 'UpdatedAtUtc';

export function buildTodosSortParam(
  sort: { column: TodosSortColumn; desc: boolean } | null
): string | undefined {
  if (sort == null) return undefined;
  return sort.desc ? `${sort.column} desc` : sort.column;
}
