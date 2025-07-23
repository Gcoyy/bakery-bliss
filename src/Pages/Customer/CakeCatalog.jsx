import { useState, useEffect } from 'react'

const cakes = [
  { name: "Chocolate Dream", price: 1000, tier: 2, theme: "Birthday", image: "cake1.jpg" },
  { name: "Vanilla Sky", price: 500, tier: 1, theme: "Plain", image: "cake2.jpg" },
  { name: "Wedding Bliss", price: 5000, tier: 3, theme: "Wedding", image: "cake3.jpg" },
  // Add more cakes here...
];

const CakeCatalog = () => {
const [price, setPrice] = useState(1000)
const [scrollSticky, setScrollSticky] = useState(false)
const [sortBy, setSortBy] = useState("default")
const [tier, setTier] = useState("all");
const [selectedThemes, setSelectedThemes] = useState([])


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrollSticky(true);
      } else {
        setScrollSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCakes = cakes
  .filter(cake => cake.price <= price)
  .filter(cake => tier === "all" || cake.tier === parseInt(tier))
  .filter(cake => selectedThemes.length === 0 || selectedThemes.includes(cake.theme))
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
      case "newest":
        return b.id - a.id; // assuming there's an `id` or `createdAt` field
      default:
        return 0;
    }
  });


  return (
    <section className="flex min-h-[120vh] bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4]">
      {/* Sidebar */}
      <div className="w-1/3 flex items-center justify-start">
        <aside
          className={`${
            scrollSticky ? "fixed top-1/2 left-0 -translate-y-1/2 w-[20%]" : "relative w-[80%]"
          } bg-white rounded-br-2xl rounded-tr-2xl shadow-lg p-4 text-[#381914] transform transition-transform duration-300 ease-in-out`}
        >
          <h2 className="text-xl font-semibold mb-4">Filters</h2>

          <div className="mb-6">
            <label className="block mb-1 font-semibold" htmlFor="sortBy">
              Sort by
            </label>
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
            <label className="block mb-1 font-semibold" htmlFor="tier">
              Tiers
            </label>
            <select
              id="tier"
              className="w-full text-sm text-[#381914] border border-[#381914] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#381914]"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="1">1 Tier</option>
              <option value="2">2 Tier</option>
              <option value="3">3 Tier</option>
              <option value="4">4 Tier</option>
              <option value="5">5 Tier</option>
            </select>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className={`p-8 w-full ${scrollSticky ? "ml-1/5" : ""}`}>
        {/* Example cake grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCakes.map((cake, index) => (
            <div key={index} className="bg-[#FAF6F1] rounded shadow-sm p-4 text-center">
              <img
                src={cake.image}
                alt={cake.name}
                className="w-full h-48 object-contain mb-4"
              />
              <h3 className="text-md font-semibold">{cake.name}</h3>
              <p className="text-sm">₱{cake.price}</p>
            </div>
          ))}
        </div>
      </main>
    </section>
  )
}

export default CakeCatalog
