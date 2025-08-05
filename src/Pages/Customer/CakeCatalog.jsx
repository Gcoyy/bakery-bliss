import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const cakesPerPage = 21;

  // Order form states
  const [orderDate, setOrderDate] = useState("");
  const [orderTime, setOrderTime] = useState("");
  const [orderType, setOrderType] = useState("Pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [cakeQuantity, setCakeQuantity] = useState(1);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Add to cart functionality
  const addToCart = (cake) => {
    try {
      // Get existing cart from localStorage
      const existingCart = localStorage.getItem('bakeryCart');
      const cart = existingCart ? JSON.parse(existingCart) : [];

      // Check if cake is already in cart
      const existingItem = cart.find(item => item.cake_id === cake.cake_id);

      if (existingItem) {
        // Update quantity if already in cart
        existingItem.quantity += 1;
        toast.success(`Updated quantity for ${cake.name}`);
      } else {
        // Add new item to cart
        cart.push({
          cake_id: cake.cake_id,
          name: cake.name,
          price: cake.price,
          cake_img: cake.cake_img,
          quantity: 1
        });
        toast.success(`${cake.name} added to cart!`);
      }

      // Save updated cart to localStorage
      localStorage.setItem('bakeryCart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Fetch cake data from Supabase
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("CAKE").select("*");
        if (error) {
          console.error("Error fetching cakes:", error.message);
          toast.error("Failed to load cakes. Please try again.");
          return;
        }

        // Generate public URLs for each cake
        const cakesWithImages = data.map((cake) => {
          const publicUrl = getPublicImageUrl(cake.cake_img);
          console.log(`Cake: ${cake.name}, cake_img: ${cake.cake_img}, publicUrl: ${publicUrl}`);
          return { ...cake, publicUrl };
        });

        setCakes(cakesWithImages);
      } catch (error) {
        console.error("Error fetching cakes:", error);
        toast.error("Failed to load cakes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCakes();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if we're near the bottom of the page (within 200px)
      const isNearBottom = scrollY + windowHeight >= documentHeight - 200;

      // Only make sticky if we're not near the bottom
      if (scrollY > 100 && !isNearBottom) {
        setScrollSticky(true);
      } else {
        setScrollSticky(false);
      }
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

  const handleOrderCake = () => {
    if (!selectedCake) return;

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setOrderDate(tomorrow.toISOString().split('T')[0]);

    // Set default time to 2 PM
    setOrderTime("14:00");

    // Reset quantity to 1 and step to 1, then open order modal
    setCakeQuantity(1);
    setCurrentStep(1);
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrder = async () => {
    // Prevent multiple clicks
    if (isPlacingOrder) {
      return;
    }

    console.log('handlePlaceOrder called');
    console.log('selectedCake:', selectedCake);
    console.log('orderDate:', orderDate);
    console.log('orderTime:', orderTime);
    console.log('orderType:', orderType);
    console.log('deliveryAddress:', deliveryAddress);

    if (!selectedCake || !orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)) {
      console.log('Validation failed - missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    setIsPlacingOrder(true);

    try {
      console.log('Starting order placement...');
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No user session found');
        toast.error('Please log in to place an order');
        return;
      }

      // Get customer ID from the session
      const { data: customer, error: customerError } = await supabase
        .from("CUSTOMER")
        .select("cus_id")
        .eq("auth_user_id", session.user.id)
        .single();

      if (customerError || !customer) {
        toast.error('Customer information not found. Please try again.');
        return;
      }

      const totalPrice = selectedCake.price * cakeQuantity;
      const scheduledDate = new Date(`${orderDate}T${orderTime}`);

      // 1. Create ORDER record
      const orderInsertData = {
        order_date: new Date().toISOString().split('T')[0], // Current date
        delivery_method: orderType,
        order_schedule: scheduledDate.toISOString().split('T')[0],
        delivery_address: orderType === "Delivery" ? deliveryAddress : null,
        cus_id: customer.cus_id,
        order_status: 'Pending' // New orders start as pending
      };

      console.log('Attempting to create order with data:', orderInsertData);

      const { data: orderData, error: orderError } = await supabase
        .from("ORDER")
        .insert([orderInsertData])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        console.error('Order error details:', {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code
        });
        toast.error('Failed to create order. Please try again.');
        return;
      }

      console.log('Order created successfully:', orderData);
      console.log('Order ID from database:', orderData.order_id);
      console.log('Selected cake ID:', selectedCake.cake_id);
      console.log('Cake quantity:', cakeQuantity);

      // 2. Create CAKE_ORDERS record
      const cakeOrderData = {
        quantity: cakeQuantity,
        order_id: orderData.order_id,
        cake_id: selectedCake.cake_id
      };

      console.log('Attempting to create cake order with data:', cakeOrderData);

      console.log('Attempting to insert into CAKE-ORDERS table...');

      const { data: cakeOrderResult, error: cakeOrderError } = await supabase
        .from("CAKE-ORDERS")
        .insert([cakeOrderData])
        .select();

      if (cakeOrderError) {
        console.error('Error creating cake order:', cakeOrderError);
        console.error('Full error object:', JSON.stringify(cakeOrderError, null, 2));
        console.error('Error details:', {
          message: cakeOrderError.message,
          details: cakeOrderError.details,
          hint: cakeOrderError.hint,
          code: cakeOrderError.code
        });
        toast.error('Failed to create cake order. Please try again.');
        return;
      }

      console.log('Cake order created successfully:', cakeOrderResult);

      // 3. Create PAYMENT record
      const { error: paymentError } = await supabase
        .from("PAYMENT")
        .insert([
          {
            payment_method: "Cash", // Default to Cash for now
            amount_paid: totalPrice,
            payment_date: new Date().toISOString().split('T')[0],
            payment_status: "Unpaid", // Default to Unpaid
            receipt: null, // No receipt uploaded yet
            order_id: orderData.order_id
          }
        ]);

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        toast.error('Failed to create payment record. Please try again.');
        return;
      }

      // Generate unique order ID for display
      const newOrderId = `ORD-${orderData.order_id}`;
      setOrderId(newOrderId);

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

      console.log('Advancing to step 3...');
      // Advance to success step (step 3)
      setCurrentStep(3);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const closeOrderModal = () => {
    setIsOrderModalOpen(false);
    setOrderDate("");
    setOrderTime("");
    setOrderType("Pickup");
    setDeliveryAddress("");
    setCakeQuantity(1);
    setCurrentStep(1);
    setIsOrderTypeDropdownOpen(false);
    setOrderId('');
    setIsPlacingOrder(false);
  };

  const nextStep = () => {
    console.log('nextStep called, current step:', currentStep);
    if (currentStep < 3) {
      console.log('Advancing to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredCakes.length / cakesPerPage);
  const indexOfLastCake = currentPage * cakesPerPage;
  const indexOfFirstCake = indexOfLastCake - cakesPerPage;
  const currentCakes = filteredCakes.slice(indexOfFirstCake, indexOfLastCake);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [price, tier, selectedThemes, sortBy]);



  if (loading) {
    return <LoadingSpinner message="Loading cake catalog..." />;
  }

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
          {currentCakes.map((cake) => (
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3D3A] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page
                    ? 'bg-[#AF524D] text-white'
                    : 'bg-white text-[#381914] hover:bg-[#f0f0f0] border border-[#381914]'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3D3A] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Info */}
        <div className="text-center mt-4 text-sm text-[#381914]">
          Showing {indexOfFirstCake + 1} to {Math.min(indexOfLastCake, filteredCakes.length)} of {filteredCakes.length} cakes
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

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedCake && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#381914]">Complete Your Order</h2>
              <button
                onClick={closeOrderModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Order Details</span>
                </div>

                <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-[#AF524D]' : 'bg-gray-200'}`}></div>

                <div className={`flex items-center ${currentStep >= 2 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Review</span>
                </div>

                <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-[#AF524D]' : 'bg-gray-200'}`}></div>

                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Success</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Cake Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCake.publicUrl || "/saved-cake.png"}
                    alt={selectedCake.name}
                    className="w-16 h-16 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.src = "/saved-cake.png";
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-[#381914]">{selectedCake.name}</h3>
                    <p className="text-sm text-gray-600">₱{selectedCake.price}</p>
                  </div>
                </div>
              </div>

              {/* Step 1: Order Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Quantity Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#381914] mb-2">
                      Quantity *
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCakeQuantity(Math.max(1, cakeQuantity - 1))}
                        className="w-10 h-10 rounded-full border-2 border-[#AF524D] text-[#AF524D] hover:bg-[#AF524D] hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="w-16 text-center font-semibold text-[#381914] text-lg">
                        {cakeQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCakeQuantity(cakeQuantity + 1)}
                        className="w-10 h-10 rounded-full border-2 border-[#AF524D] text-[#AF524D] hover:bg-[#AF524D] hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#381914] mb-2">
                      Pickup/Delivery Date *
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <input
                            type="date"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-transparent border-none outline-none text-[#381914] font-medium cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                      {orderDate && (
                        <div className="mt-2 p-2 bg-[#AF524D] bg-opacity-10 rounded-lg border border-[#AF524D] border-opacity-30">
                          <p className="text-sm text-[#381914] font-medium">
                            Selected: {new Date(orderDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#381914] mb-2">
                      Pickup/Delivery Time *
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <input
                            type="time"
                            value={orderTime}
                            onChange={(e) => setOrderTime(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-[#381914] font-medium cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                      {orderTime && (
                        <div className="mt-2 p-2 bg-[#AF524D] bg-opacity-10 rounded-lg border border-[#AF524D] border-opacity-30">
                          <p className="text-sm text-[#381914] font-medium">
                            Selected: {new Date(`2000-01-01T${orderTime}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-[#381914] mb-2">
                      Order Type
                    </label>
                    <div className="relative">
                      <div
                        className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-[#381914] font-medium">
                            {orderType}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          <svg
                            className={`w-5 h-5 text-[#AF524D] transition-transform ${isOrderTypeDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Custom Dropdown */}
                      {isOrderTypeDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#AF524D] rounded-lg shadow-lg z-10">
                          <div
                            className="p-3 hover:bg-[#AF524D] hover:text-white cursor-pointer transition-colors border-b border-gray-100"
                            onClick={() => {
                              setOrderType("Pickup");
                              setIsOrderTypeDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                              <span className="font-medium">Pickup</span>
                            </div>
                          </div>
                          <div
                            className="p-3 hover:bg-[#AF524D] hover:text-white cursor-pointer transition-colors"
                            onClick={() => {
                              setOrderType("Delivery");
                              setIsOrderTypeDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                              </svg>
                              <span className="font-medium">Delivery</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {orderType && (
                        <div className="mt-2 p-2 bg-[#AF524D] bg-opacity-10 rounded-lg border border-[#AF524D] border-opacity-30">
                          <p className="text-sm text-[#381914] font-medium">
                            Selected: {orderType}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {orderType === "Delivery" && (
                    <div>
                      <label className="block text-sm font-medium text-[#381914] mb-2">
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your complete delivery address..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent resize-none"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={closeOrderModal}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)}
                      className={`px-6 py-2 rounded-full transition-colors ${!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Review Order */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#381914] mb-4">Review Your Order</h3>

                  {/* Order Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-[#381914] mb-4">Order Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Cake:</span>
                        <span>{selectedCake.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quantity:</span>
                        <span>{cakeQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Price per cake:</span>
                        <span>₱{selectedCake.price}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="font-semibold">Total Price:</span>
                        <span className="font-semibold">₱{selectedCake.price * cakeQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{orderDate ? new Date(orderDate).toLocaleDateString() : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Time:</span>
                        <span>{orderTime ? new Date(`2000-01-01T${orderTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span>{orderType}</span>
                      </div>
                      {orderType === "Delivery" && deliveryAddress && (
                        <div className="flex justify-between">
                          <span className="font-medium">Address:</span>
                          <span className="text-right max-w-xs truncate">{deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-between items-center pt-4 border-t border-gray-200">
                    <button
                      onClick={prevStep}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors"
                    >
                      Back
                    </button>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className={`px-6 py-2 rounded-full transition-colors ${isPlacingOrder
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
                        }`}
                    >
                      {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Order Success */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#381914] mb-4">Order Successfully Placed!</h3>

                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-green-800 text-xl mb-2">Thank you for your order!</h4>
                    <p className="text-green-700 text-sm mb-4">
                      Your order has been successfully placed.
                    </p>

                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        closeOrderModal();
                        closeModal();
                      }}
                      className="px-6 py-2 bg-[#AF524D] text-white rounded-full hover:bg-[#8B3D3A] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CakeCatalog;
