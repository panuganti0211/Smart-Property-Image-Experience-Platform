import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { fetchPropertyById, reanalyzeProperty } from "../api/propertyApi";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);
  const [pollSession, setPollSession] = useState(0);

  useEffect(() => {
    let mounted = true;
    let pollTimer = null;

    async function load(isInitial) {
      if (isInitial) setLoading(true);
      setError("");
      try {
        const data = await fetchPropertyById(id);
        if (!mounted) return;
        setProperty(data);
        if (data.analysisStatus === "pending") {
          pollTimer = setTimeout(() => load(false), 4000);
        }
      } catch {
        if (mounted) setError("We could not load this property.");
        if (mounted) setProperty(null);
      } finally {
        if (mounted && isInitial) setLoading(false);
      }
    }

    load(true);
    return () => {
      mounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [id, pollSession]);

  const images = property?.images || [];
  const heroSrc =
    images[selectedIdx]?.url ||
    property?.coverImageUrl ||
    images[0]?.url ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

  function goHero(delta) {
    if (!images.length) return;
    setSelectedIdx((i) => (i + delta + images.length) % images.length);
  }

  async function onReanalyze() {
    if (!id) return;
    setReanalyzeLoading(true);
    setError("");
    try {
      await reanalyzeProperty(id);
      setPollSession((s) => s + 1);
      setSelectedIdx(0);
    } catch {
      setError("Could not start re-analysis. Try again shortly.");
    } finally {
      setReanalyzeLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-[420px] animate-pulse rounded-2xl bg-neutral-900" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <Card className="border-red-900/40 bg-red-950/20 p-8 text-center">
        <p className="text-red-200">{error}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button type="button" variant="outline">
            Back to listings
          </Button>
        </Link>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Return home
        </Link>
      </Card>
    );
  }

  const status = property.analysisStatus;
  const isPending = status === "pending";
  const isFailed = status === "failed";

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All properties
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black">
            <img src={heroSrc} alt={property.title} className="aspect-[16/10] w-full object-cover md:aspect-[21/9]" />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                  onClick={() => goHero(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                  onClick={() => goHero(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
              <p className="text-xs uppercase tracking-widest text-white/70">Featured</p>
              <p className="text-xl font-semibold text-white md:text-2xl">{property.title}</p>
              <p className="mt-1 text-2xl font-semibold text-primary md:text-3xl">
                ${property.price?.toLocaleString()}
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img._id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    idx === selectedIdx ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit space-y-5 border-border/60 p-6 lg:sticky lg:top-24">
          <div>
            <p className="text-sm text-muted-foreground">{property.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(property.tags || []).map((tag) => (
                <Badge key={tag} className="bg-primary/15 text-primary">
                  {tag}
                </Badge>
              ))}
              {!property.tags?.length && !isPending && (
                <span className="text-xs text-muted-foreground">No tags yet</span>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">AI description</h2>
            {isPending && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing images… this page refreshes automatically.
              </div>
            )}
            {isFailed && (
              <div className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-100">
                <p>
                  AI insights could not be generated (for example API quota or key). Your listing and photos are still
                  saved.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full border-amber-800/50"
                  disabled={reanalyzeLoading}
                  onClick={onReanalyze}
                >
                  {reanalyzeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry AI analysis
                    </>
                  )}
                </Button>
              </div>
            )}
            {!isPending && !isFailed && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {property.aiDescription?.trim() ? property.aiDescription : "—"}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
        </Card>
      </div>

      <Card className="space-y-4 border-border/60 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Image insights</h2>
          {isFailed && (
            <Button type="button" variant="outline" size="sm" disabled={reanalyzeLoading} onClick={onReanalyze}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry analysis
            </Button>
          )}
        </div>
        {!images.length && (
          <p className="text-sm text-muted-foreground">No images uploaded for this property.</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((image) => (
            <div key={image._id} className="flex gap-4 rounded-xl border border-border/60 bg-card/50 p-4">
              <img src={image.url} alt="" className="h-24 w-28 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Room</span>{" "}
                  <span className="font-medium">
                    {isPending ? "…" : image.roomType?.trim() ? image.roomType : "—"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Quality</span>{" "}
                  <span className="font-medium">{isPending ? "—" : `${image.qualityScore ?? 0}/100`}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(isPending ? [] : image.features || image.keyFeatures || []).map((f) => (
                    <Badge key={f} className="text-[10px]">
                      {f}
                    </Badge>
                  ))}
                </div>
                {(isPending ? [] : image.suggestions || image.improvementTips || []).length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {(image.suggestions || image.improvementTips || []).map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                )}
                {!isPending &&
                  !isFailed &&
                  !(image.suggestions || image.improvementTips || []).length && (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
