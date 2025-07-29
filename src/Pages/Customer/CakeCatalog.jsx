import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

const getPublicImageUrl = (path) => {
  if (!path) return null;

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a file path, generate the public URL
  return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
};

const CakeCatalog = () => {
  const [cakes, setCakes] = useState([]);
  const [price, setPrice] = useState(16000);
  const [scrollSticky, setScrollSticky] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [tier, setTier] = useState("all");
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedCake, setSelectedCake] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch cake data from Supabase
  useEffect(() => {
    const fetchCakes = async () => {
      const { data, error } = await supabase.from("CAKE").select("*");
      if (error) {
        console.error("Error fetching cakes:", error.message);
        return;
      }

      // Generate public URLs for each cake
      const cakesWithImages = data.map((cake) => {
        const publicUrl = getPublicImageUrl(cake.cake_img);
        console.log(`Cake: ${cake.name}, cake_img: ${cake.cake_img}, publicUrl: ${publicUrl}`);
        return { ...cake, publicUrl };
      });

      setCakes(cakesWithImages);
    };

    fetchCakes();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollSticky(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCakeClick = (cake) => {
    setSelectedCake(cake);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCake(null);
  };

  const handleOrderCake = async () => {
    if (!selectedCake) return;

    try {
      // Here you would typically save the order to your database
      // For now, we'll simulate the order process
      console.log('Placing order for cake:', selectedCake.name);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success notification
      toast.success(`Order successfully placed for ${selectedCake.name}!`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 16px',
        },
      });

      // Close the modal
      closeModal();

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const filteredCakes = cakes
    .filter((cake) => cake.price <= price)
    .filter((cake) => tier === "all" || cake.tier === parseInt(tier))
    .filter((cake) => selectedThemes.length === 0 || selectedThemes.includes(cake.theme))
    .sort((a, b) => {
      switch (sortBy) {
        case "priceLowToHigh":
          return a.price - b.price;
        case "priceHighToLow":
          return b.price - a.price;
        case "alphabeticalAsc":
          return a.name.localeCompare(b.name);
        case "alphabeticalDesc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  return (
    <section className="flex min-h-[120vh] bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4]">
      {/* Sidebar */}
      <div className="w-1/3 flex items-center justify-start">
        <aside
          className={`${scrollSticky ? "fixed top-1/2 left-0 -translate-y-1/2 w-[20%]" : "relative w-[80%]"
            } bg-white rounded-br-2xl rounded-tr-2xl shadow-lg p-4 text-[#381914]`}
        >
          <h2 className="text-xl font-semibold mb-4">Filters</h2>

          <div className="mb-6">
            <label className="block mb-1 font-semibold" htmlFor="sortBy">Sort by</label>
            <select
              id="sortBy"
              className="w-full text-sm text-[#381914] border border-[#381914] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#381914] cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
              <option value="alphabeticalAsc">Alphabetical: A → Z</option>
              <option value="alphabeticalDesc">Alphabetical: Z → A</option>
            </select>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Price</h3>
            <input
              type="range"
              min="0"
              max="16000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full cursor-pointer slider-design appearance-none bg-[#6a2e2e] rounded-lg h-2"
            />
            <p className="text-sm mt-1">₱0 - ₱{price}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Theme</h3>
            {["Plain", "Birthday", "Wedding", "Christmas", "Graduation", "Anniversary", "New Years"].map((theme) => (
              <label key={theme} className="block text-sm flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 appearance-none w-4 h-4 border-2 border-[#381914] checked:bg-[#381914] checked:border-transparent focus:outline-none cursor-pointer"
                  checked={selectedThemes.includes(theme)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedThemes([...selectedThemes, theme]);
                    } else {
                      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
                    }
                  }}
                />
                {theme}
              </label>
            ))}
          </div>

          <div>
            <label className="block mb-1 font-semibold" htmlFor="tier">Tiers</label>
            <select
              id="tier"
              className="w-full text-sm text-[#381914] border border-[#381914] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#381914]"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="all">All Tiers</option>
              {[1, 2, 3, 4, 5].map((t) => (
                <option key={t} value={t}>{t} Tier</option>
              ))}
            </select>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className={`p-8 w-full ${scrollSticky ? "ml-1/5" : ""}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCakes.map((cake) => (
            <div
              key={cake.cake_id}
              className="bg-[#FAF6F1] rounded shadow-sm p-4 text-center cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform transition-transform"
              onClick={() => handleCakeClick(cake)}
            >
              <img
                src={cake.publicUrl || "/saved-cake.png"}
                alt={cake.name}
                className="w-full h-48 object-contain mb-4"
                onError={(e) => {
                  console.error(`Failed to load image for cake: ${cake.name}, URL: ${cake.publicUrl}`);
                  e.target.src = "/saved-cake.png";
                }}
              />
              <h3 className="text-md font-semibold">{cake.name}</h3>
              <p className="text-sm">₱{cake.price}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Cake Detail Modal */}
      {isModalOpen && selectedCake && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#381914]">{selectedCake.name}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Cake Image */}
              <div className="mb-6">
                <img
                  src={selectedCake.publicUrl || "/saved-cake.png"}
                  alt={selectedCake.name}
                  className="w-full h-64 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = "/saved-cake.png";
                  }}
                />
              </div>

              {/* Cake Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#381914] mb-4">Cake Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600">Theme:</span>
                      <span className="ml-2 text-[#381914]">{selectedCake.theme}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tiers:</span>
                      <span className="ml-2 text-[#381914]">{selectedCake.tier}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Price:</span>
                      <span className="ml-2 text-[#381914] font-bold">₱{selectedCake.price}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#381914] mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedCake.description || "No description available for this cake."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleOrderCake}
                  className="px-6 py-2 bg-[#AF524D] text-white rounded-full hover:bg-[#8B3D3A] transition-colors"
                >
                  Order This Cake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CakeCatalog;
