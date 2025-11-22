import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const results = await response.json();
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSelectLocation = (result: SearchResult) => {
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location, city, zip code..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border-2 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border-2 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectLocation(result)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 text-sm"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
