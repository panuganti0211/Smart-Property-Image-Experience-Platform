import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Loader2, Check, Upload } from "lucide-react";
import { createProperty, uploadImages } from "../api/propertyApi";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

const MAX_FILES = 5;

function humanError(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  if (err?.response?.status === 413) return "Files are too large. Try smaller images.";
  if (err?.response?.status >= 500) return "Server error. Please try again later.";
  return "Something went wrong. Check your connection and try again.";
}

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", price: "", location: "" });
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState("idle");
  const [lastHadImages, setLastHadImages] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  const addFiles = useCallback((incoming) => {
    const list = Array.from(incoming || []).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const merged = [...prev, ...list].slice(0, MAX_FILES);
      return merged;
    });
  }, []);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLastHadImages(files.length > 0);
    setStep("creating");
    try {
      const property = await createProperty({
        title: form.title,
        price: Number(form.price),
        location: form.location,
      });
      if (files.length) {
        setStep("uploading");
        await uploadImages(property._id, files);
      }
      setStep("done");
      setMessage(files.length ? "Listing saved. AI is analyzing your photos in the background." : "Listing saved.");
      setForm({ title: "", price: "", location: "" });
      setFiles([]);
      if (files.length) {
        navigate(`/properties/${property._id}`);
      }
    } catch (err) {
      setStep("idle");
      setError(humanError(err));
    }
  }

  return (
    <Card className="mx-auto max-w-3xl space-y-6 border-border/60 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add property</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Premium listings with AI room insights, tags, and an auto-picked cover image.
        </p>
      </div>

      {(step === "creating" || step === "uploading") && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>
            {step === "creating" && "Creating your listing…"}
            {step === "uploading" && "Uploading images to secure storage…"}
          </span>
        </div>
      )}

      <ol className="flex flex-wrap gap-6 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${
              step === "creating"
                ? "border-primary ring-2 ring-primary/30"
                : step === "uploading" || step === "done"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
            }`}
          >
            {step === "uploading" || step === "done" ? <Check className="h-3 w-3" /> : "1"}
          </span>
          Save listing
        </li>
        <li className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${
              step === "uploading"
                ? "border-primary ring-2 ring-primary/30"
                : step === "done" && lastHadImages
                  ? "border-primary bg-primary text-primary-foreground"
                  : step === "done" && !lastHadImages
                    ? "border-muted-foreground/40 text-muted-foreground"
                    : "border-border"
            }`}
          >
            {step === "done" && lastHadImages ? <Check className="h-3 w-3" /> : "2"}
          </span>
          Upload images{!lastHadImages && step === "done" ? " (skipped)" : ""}
        </li>
        <li className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${
              step === "done" && lastHadImages
                ? "border-primary bg-primary text-primary-foreground"
                : step === "done" && !lastHadImages
                  ? "border-muted-foreground/40 text-muted-foreground"
                  : "border-border"
            }`}
          >
            {step === "done" && lastHadImages ? <Check className="h-3 w-3" /> : "3"}
          </span>
          AI processing{!lastHadImages && step === "done" ? " (no photos)" : ""}
        </li>
      </ol>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <Input
          required
          type="number"
          min={0}
          placeholder="Price (USD)"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
        />
        <Input
          required
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
        />

        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20"
          }`}
        >
          <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop up to {MAX_FILES} images</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP — or choose files below</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <ImagePlus className="h-4 w-4" />
            Browse files
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>

        {!!previews.length && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {previews.map(({ file, url }) => (
              <div key={url} className="group relative overflow-hidden rounded-lg border border-border/60">
                <img src={url} alt="" className="h-28 w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <Button disabled={step === "creating" || step === "uploading"} className="w-full" type="submit">
          {step === "creating" || step === "uploading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…
            </>
          ) : (
            "Create property"
          )}
        </Button>
      </form>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </Card>
  );
}
