import { Link, Route, Routes } from "react-router-dom";
import { Home, PlusSquare } from "lucide-react";
import ListingPage from "./pages/ListingPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import AddPropertyPage from "./pages/AddPropertyPage";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-wide">
            Smart Property
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" to="/">
              <Home className="h-4 w-4" /> Listings
            </Link>
            <Link
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-primary-foreground"
              to="/add"
            >
              <PlusSquare className="h-4 w-4" /> Add Property
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ListingPage />} />
        <Route path="/add" element={<AddPropertyPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
      </Routes>
    </AppLayout>
  );
}
