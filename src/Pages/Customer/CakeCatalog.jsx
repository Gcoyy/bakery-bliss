import { useState, useEffect } from 'react'

const cakes = [
  { name: 'Red Velvet Cake', price: 600, image: '/cakes/red-velvet.jpg' },
  { name: 'Chocolate Cake', price: 600, image: '/cakes/choco.jpg' },
  { name: 'Red Velvet Cake', price: 600, image: '/cakes/red-velvet.jpg' },
  { name: 'Chocolate Cake', price: 600, image: '/cakes/choco.jpg' },
  { name: 'Red Velvet Cake', price: 600, image: '/cakes/red-velvet.jpg' },
  { name: 'Chocolate Cake', price: 600, image: '/cakes/choco.jpg' },
  { name: 'Red Velvet Cake', price: 600, image: '/cakes/red-velvet.jpg' },
  { name: 'Chocolate Cake', price: 600, image: '/cakes/choco.jpg' },
  { name: 'Red Velvet Cake', price: 600, image: '/cakes/red-velvet.jpg' },
]

const CakeCatalog = () => {
const [price, setPrice] = useState(1000)
const [scrollSticky, setScrollSticky] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4]">
      {/* Sidebar */}
      <div className="w-1/3 flex items-center justify-start">
        <aside
          className={`${
            scrollSticky ? "fixed top-1/2 left-0 -translate-y-1/2 w-[20%]" : "relative w-[80%]"
          } bg-white rounded-br-2xl rounded-tr-2xl shadow-lg p-4 text-[#381914] transform transition-transform duration-300 ease-in-out`}
        >
          <h2 className="text-xl font-semibold mb-4">Filters</h2>

          <div className="mb-6">
            <h3 className="font-medium mb-1">Sort by</h3>
            <button className="text-left w-full text-sm text-[#381914]">▼</button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Price</h3>
            <input
              type="range"
              min="0"
              max="16000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full"
            />
            <p className="text-sm mt-1">₱0 – ₱{price}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Theme</h3>
            {["Plain", "Birthday", "Wedding", "Christmas", "Graduation", "Anniversary", "New Years"].map((theme) => (
              <label key={theme} className="block text-sm">
                <input type="checkbox" className="mr-2" />
                {theme}
              </label>
            ))}
          </div>

          <div>
            <h3 className="font-medium mb-1">Tiers</h3>
            <button className="text-left w-full text-sm text-[#381914]">▼</button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className={`p-8 w-full ${scrollSticky ? "ml-1/5" : ""}`}>
        {/* Example cake grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cakes.map((cake, index) => (
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
    </div>
  )
}

export default CakeCatalog
