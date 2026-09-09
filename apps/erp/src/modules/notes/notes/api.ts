/**
 * Notes against `/api/v1/notes/notes/`.
 */

import { apiDelete, apiGetPage, apiPost } from "@/lib/api-client";

export interface Note {
  uuid: string;
  title: string;
  body: string;
  branch: { uuid: string; name: string; code: string };
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  body?: string;
}

export const NOTES_QUERY_KEY = ["notes", "notes"] as const;

export async function listNotes(): Promise<Note[]> {
  const page = await apiGetPage<Note>(
    "/v1/notes/notes/?page_size=100&ordering=-created_at"
  );
  return page.data;
}

export function createNote(input: NoteInput) {
  return apiPost<Note>("/v1/notes/notes/", input);
}

export function deleteNote(uuid: string) {
  return apiDelete(`/v1/notes/notes/${uuid}/`);
}
