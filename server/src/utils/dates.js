import { HttpError } from './errors.js';

export function toDateOrNull(value, fieldName = 'date') {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${fieldName} must be a valid date`);
  }
  return date;
}

export function isTaskOverdue(task, now = new Date()) {
  return Boolean(task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < now);
}
