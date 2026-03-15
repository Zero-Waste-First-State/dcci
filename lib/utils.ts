/**
 * Shared utilities: className merge (cn), form data URL parsing for compost-form flow, env checks.
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// User form utilities
export interface FormData {
  site: number;
  firstName: string;
  lastName: string;
  email: string;
  tasks: string; // Single task instead of array
  submissionId: string;
}

export function parseFormDataFromURL(searchParams: URLSearchParams): FormData | null {
  const site = searchParams.get('site');
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');
  const email = searchParams.get('email');
  const tasks = searchParams.get('tasks');
  const submissionId = searchParams.get('submissionId');

  if (!site || !firstName || !lastName || !email || !tasks || !submissionId) {
    return null;
  }

  return {
    site: Number(site),
    firstName,
    lastName,
    email,
    tasks: tasks, // Single task string
    submissionId
  };
}

export function createFormDataURL(formData: FormData, taskPath?: string): string {
  const params = new URLSearchParams({
    site: formData.site.toString(),
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    tasks: formData.tasks, // Single task string
    submissionId: formData.submissionId
  });

  if (taskPath) {
    return `/compost-form/task-selection/${taskPath}?${params.toString()}`;
  }
  
  return `/compost-form/task-selection?${params.toString()}`;
}

export function getNextTask(currentTask: string, allTasks: string[]): string | null {
  const currentIndex = allTasks.indexOf(currentTask);
  if (currentIndex === -1 || currentIndex === allTasks.length - 1) {
    return null; // No next task
  }
  return allTasks[currentIndex + 1];
}

export function getPreviousTask(currentTask: string, allTasks: string[]): string | null {
  const currentIndex = allTasks.indexOf(currentTask);
  if (currentIndex <= 0) {
    return null; // No previous task
  }
  return allTasks[currentIndex - 1];
}

export const taskPathMap: Record<string, string> = {
  'add_material': 'adding-material',
  'measure_bin': 'measuring-bin',
  'move_bins': 'moving-bins',
  'finished_compost': 'finished-compost'
};

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
