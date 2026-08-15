import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { Upload } from "lucide-react";
import { cn } from "../../../utils";

export interface FormFileUploadProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange"
  > {
  error?: boolean;
  hint?: string;
  value?: FileList | null;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFilesChange?: (files: FileList | null) => void;
}

export const FormFileUpload = forwardRef<HTMLInputElement, FormFileUploadProps>(
  function FormFileUpload(
    {
      className,
      error,
      hint = "Drop or choose file",
      id,
      disabled,
      onChange,
      onFilesChange,
      value: _value,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    function assignRef(node: HTMLInputElement | null) {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const files = event.target.files;
      setFileName(files?.[0]?.name ?? null);
      onFilesChange?.(files);
      onChange?.(event);
    }

    return (
      <div className={cn("w-full", className)}>
        <label
          htmlFor={inputId}
          className={cn(
            "grid min-h-16 cursor-pointer place-items-center rounded-[5px] border border-dashed border-erp-border px-3 py-3 text-center text-[10px] text-erp-subtle transition-colors",
            dragging && "border-erp-blue bg-erp-blue-50 text-erp-blue",
            error && "border-erp-error bg-erp-error-bg",
            disabled && "cursor-not-allowed opacity-60"
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (disabled) return;
            const files = event.dataTransfer.files;
            if (inputRef.current && files?.length) {
              const transfer = new DataTransfer();
              Array.from(files).forEach((file) => transfer.items.add(file));
              inputRef.current.files = transfer.files;
              setFileName(files[0]?.name ?? null);
              onFilesChange?.(transfer.files);
              inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {fileName ?? hint}
          </span>
        </label>
        <input
          ref={assignRef}
          id={inputId}
          type="file"
          className="sr-only"
          disabled={disabled}
          aria-invalid={error || undefined}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);

FormFileUpload.displayName = "FormFileUpload";
