import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  useToast,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import { notesNavbar } from "../../manifest";
import { useCreateNoteMutation } from "../queries";

export default function NoteCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...notesNavbar, submenuActiveKey: "all" });
  const create = useCreateNoteMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  return (
    <AppShell activeNavKey="notes" navbar={navbar}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Write a note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[12px]">
          <label className="block">
            <span className="mb-1 block text-erp-muted">Title</span>
            <Input
              className="w-full"
              value={title}
              error={Boolean(fieldErrors.title)}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Follow up with the warehouse"
            />
            {fieldErrors.title ? (
              <span className="text-erp-error">{fieldErrors.title[0]}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-erp-muted">Body</span>
            <Textarea
              className="min-h-28 w-full"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Optional details…"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              loading={create.isPending}
              disabled={!title.trim()}
              onClick={() => {
                setFieldErrors({});
                create.mutate(
                  { title: title.trim(), body: body.trim() },
                  {
                    onSuccess: (note) => {
                      toast({
                        title: "Note saved",
                        description: note.title,
                        variant: "success",
                      });
                      navigate("/notes");
                    },
                    onError: (error: unknown) => {
                      if (error instanceof ApiError && error.fields) {
                        setFieldErrors(error.fields);
                      }
                      toast({
                        title: "Could not save the note",
                        description:
                          error instanceof ApiError ? error.message : "Please try again.",
                        variant: "error",
                      });
                    },
                  }
                );
              }}
            >
              Save
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/notes")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
