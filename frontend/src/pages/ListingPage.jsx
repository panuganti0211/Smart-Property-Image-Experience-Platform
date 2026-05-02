import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProperties } from "../api/propertyApi";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const PAGE_SIZE = 12;

export default function ListingPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [draftLocation, setDraftLocation] = useState("");
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [draftTags, setDraftTags] = useState("");

  const [filters, setFilters] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    tags: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(filters.location.trim() && { location: filters.location.trim() }),
        ...(filters.minPrice !== "" &&
          !Number.isNaN(Number(filters.minPrice)) && { minPrice: Number(filters.minPrice) }),
        ...(filters.maxPrice !== "" &&
          !Number.isNaN(Number(filters.maxPrice)) && { maxPrice: Number(filters.maxPrice) }),
        ...(filters.tags.trim() && {
          tags: filters.tags
            .split(/[,]+/)
            .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
            .filter(Boolean)
            .join(","),
        }),
      };
      const data = await fetchProperties(params);
      setProperties(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total ?? 0);
    } catch {
      setError("We could not load listings. Please try again in a moment.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e) {
    e.preventDefault();
    setFilters({
      location: draftLocation,
      minPrice: draftMin,
      maxPrice: draftMax,
      tags: draftTags,
    });
    setPage(1);
  }

  function clearFilters() {
    setDraftLocation("");
    setDraftMin("");
    setDraftMax("");
    setDraftTags("");
    setFilters({ location: "", minPrice: "", maxPrice: "", tags: "" });
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-neutral-950/80 p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Luxury Properties</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Curated homes with AI image insights—room types, standout features, and cover photos chosen for impact.
        </p>

        <form onSubmit={applyFilters} className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Location contains…"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
            className="bg-background/50"
          />
          <Input
            type="number"
            min={0}
            placeholder="Min price"
            value={draftMin}
            onChange={(e) => setDraftMin(e.target.value)}
            className="bg-background/50"
          />
          <Input
            type="number"
            min={0}
            placeholder="Max price"
            value={draftMax}
            onChange={(e) => setDraftMax(e.target.value)}
            className="bg-background/50"
          />
          <Input
            placeholder="Tags (comma-separated)"
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            className="bg-background/50"
          />
          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </section>

      {!loading && !error && total > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} properties
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl border border-border/60">
              <div className="h-56 animate-pulse bg-neutral-900" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && <Card className="border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">{error}</Card>}

      {!loading && !error && properties.length === 0 && (
        <Card className="border-dashed p-10 text-center">
          <p className="text-lg font-medium">No properties match</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try widening location, price, or tag filters—or add a new listing.
          </p>
          <Link to="/add" className="mt-6 inline-block">
            <Button type="button">Add property</Button>
          </Link>
        </Card>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link key={property._id} to={`/properties/${property._id}`} className="group block">
                <Card className="h-full overflow-hidden border-border/60 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        property.coverImageUrl ||
                        property.images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
                      }
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="text-xs uppercase tracking-widest text-white/70">From</p>
                      <p className="text-2xl font-semibold">${property.price?.toLocaleString()}</p>
                      <p className="mt-1 line-clamp-1 text-sm font-medium">{property.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{property.location}</span>
                      </p>
                    </div>
                    <div className="absolute right-3 top-3">
                      <Badge className="border-white/20 bg-black/50 text-white backdrop-blur">
                        {property.analysisStatus === "done"
                          ? "AI ready"
                          : property.analysisStatus === "pending"
                            ? "Analyzing"
                            : property.analysisStatus === "failed"
                              ? "AI unavailable"
                              : "New"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4">
                    {property.tags?.slice(0, 4).map((tag) => (
                      <Badge key={tag} className="border-border/80 bg-transparent font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {!property.tags?.length && (
                      <Badge className="gap-1 border-dashed bg-transparent font-normal text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        Tags after analysis
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
