import { Routes } from "react-router-dom";
import { noteRoutes } from "./notes";

export function NotesRoutes() {
  return <Routes>{noteRoutes}</Routes>;
}
