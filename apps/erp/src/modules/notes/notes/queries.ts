import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NOTES_QUERY_KEY,
  createNote,
  deleteNote,
  listNotes,
  type NoteInput,
} from "./api";

export function useNotesQuery() {
  return useQuery({ queryKey: NOTES_QUERY_KEY, queryFn: listNotes });
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteInput) => createNote(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteNote(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
