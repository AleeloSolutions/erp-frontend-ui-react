import { Route } from "react-router-dom";
import NotesListPage from "./pages/list";
import NoteCreatePage from "./pages/create";

export const noteRoutes = (
  <>
    <Route index element={<NotesListPage />} />
    <Route path="new" element={<NoteCreatePage />} />
  </>
);
