import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';

const getPublicImageUrl = (path) => {
  if (!path) return null;

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a file path, generate the public URL
  return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
};

// Blocked dates utility functions
const isDateTimeBlocked = async (date, time = null) => {
  try {
    const { data: blockedDates, error } = await supabase
      .from('BLOCKED-TIMES')
      .select('*')
      .eq('start_date', date);

    if (error) {
      return { isBlocked: false, reason: null };
    }

    if (!blockedDates || blockedDates.length === 0) {
      return { isBlocked: false, reason: null };
    }

    // If no time specified, check if any full day blocks exist
    if (!time) {
      const fullDayBlock = blockedDates.find(blocked => blocked.whole_day);
      if (fullDayBlock) {
        return { isBlocked: true, reason: fullDayBlock.reason };
      }
      return { isBlocked: false, reason: null };
    }

    // Check time-specific blocks
    const timeStr = time.includes(':') ? time : `${time}:00`;

    for (const blocked of blockedDates) {
      // Skip full day blocks for time checks
      if (blocked.whole_day) {
        continue;
      }

      // Check if the time falls within the blocked time range
      if (blocked.start_time && blocked.end_time) {
        const blockedStart = blocked.start_time;
        const blockedEnd = blocked.end_time;

        // Handle time comparison
        if (timeStr >= blockedStart && timeStr <= blockedEnd) {
          return { isBlocked: true, reason: blocked.reason };
        }
      }
    }

    return { isBlocked: false, reason: null };
  } catch (error) {
    return { isBlocked: false, reason: null };
  }
};

const getOrdersCountForDate = async (date) => {
  try {
    const { data: orders, error } = await supabase
      .from('ORDER')
      .select('order_id')
      .eq('order_schedule', date);

    if (error) {
      return 0;
    }

    return orders ? orders.length : 0;
  } catch (error) {
    return 0;
  }
};

const getAvailableTimeSlots = async (date) => {
  try {
    // Check if date has reached maximum orders (4 per day)
    const ordersCount = await getOrdersCountForDate(date);
    if (ordersCount >= 4) {
      return [];
    }

    const { data: blockedDates, error } = await supabase
      .from('BLOCKED-TIMES')
      .select('*')
      .eq('start_date', date);

    if (error) {
      return [];
    }

    // Find all blocked times for this date
    const blockedForDate = blockedDates || [];

    // If there's a full day block, no time slots are available
    const fullDayBlock = blockedForDate.find(blocked => blocked.whole_day);
    if (fullDayBlock) {
      return [];
    }

    // Generate time slots (every 30 minutes from 8 AM to 8 PM)
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip 8:30 PM - only allow up to 8:00 PM
        if (hour === 20 && minute === 30) {
          break;
        }

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if this time slot is blocked
        const isBlocked = blockedForDate.some(blocked => {
          if (!blocked.start_time || !blocked.end_time) return false;
          return timeStr >= blocked.start_time && timeStr <= blocked.end_time;
        });

        if (!isBlocked) {
          timeSlots.push(timeStr);
        }
      }
    }

    return timeSlots;
  } catch (error) {
    return [];
  }
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const CakeCatalog = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [cakes, setCakes] = useState([]);
  const [price, setPrice] = useState(16000);
  const [sortBy, setSortBy] = useState("default");
  const [tier, setTier] = useState("all");
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedCake, setSelectedCake] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const cakesPerPage = 8;
  const isInitialMount = useRef(true);

  // Skeleton component for loading cards
  const CakeCardSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 text-center animate-pulse">
      <div className="relative mb-4 overflow-hidden rounded-xl">
        <div className="w-full h-48 bg-gray-300 rounded-xl"></div>
      </div>
      <div className="h-6 bg-gray-300 rounded mb-2"></div>
      <div className="h-6 bg-gray-300 rounded mb-3 w-20 mx-auto"></div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </div>
    </div>
  );

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
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isDateBlocked, setIsDateBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [isCheckingBlockedDates, setIsCheckingBlockedDates] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateCapacity, setDateCapacity] = useState({});

  // Fetch all blocked dates on component mount
  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('BLOCKED-TIMES')
        .select('*')
        .eq('whole_day', true); // Only get full day blocks

      if (error) {
        return;
      }

      setBlockedDates(data || []);
    } catch (error) {
    }
  };

  // Check capacity for all dates in current month
  const checkMonthCapacity = async () => {
    const days = getDaysInMonth(currentMonth);
    const capacityData = {};

    for (const day of days) {
      if (day) {
        const dateString = formatDateForCalendar(day);
        const ordersCount = await getOrdersCountForDate(dateString);
        capacityData[dateString] = ordersCount >= 4;
      }
    }

    setDateCapacity(capacityData);
  };

  // Check if a specific date is blocked (for calendar styling)
  const isDateBlockedForCalendar = (dateString) => {
    return blockedDates.some(blocked => blocked.start_date === dateString);
  };

  // Custom calendar helper functions
  const formatDateForCalendar = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);

    // Calculate minimum date (7 days from today)
    const minimumDate = new Date(today);
    minimumDate.setDate(today.getDate() + 7);

    return compareDate < minimumDate;
  };

  const isDateBlockedInCalendar = (date) => {
    const dateString = formatDateForCalendar(date);
    return isDateBlockedForCalendar(dateString);
  };

  const isDateAtCapacity = async (date) => {
    const dateString = formatDateForCalendar(date);
    const ordersCount = await getOrdersCountForDate(dateString);
    return ordersCount >= 4;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month - create dates at noon to avoid timezone issues
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day, 12, 0, 0));
    }

    return days;
  };

  const handleDateSelect = (date) => {
    if (isDateInPast(date) || isDateBlockedInCalendar(date)) {
      return;
    }

    const dateString = formatDateForCalendar(date);
    setOrderDate(dateString);
    checkBlockedDates(dateString, orderTime);
    setShowCustomCalendar(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Check blocked dates when date changes
  const checkBlockedDates = async (date, time = null) => {
    if (!date) return;

    setIsCheckingBlockedDates(true);
    try {
      const { isBlocked, reason } = await isDateTimeBlocked(date, time);
      setIsDateBlocked(isBlocked);
      setBlockedReason(reason || '');

      if (!isBlocked) {
        // Get available time slots for the selected date
        const timeSlots = await getAvailableTimeSlots(date);
        setAvailableTimeSlots(timeSlots);
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      setIsDateBlocked(false);
      setBlockedReason('');
      setAvailableTimeSlots([]);
    } finally {
      setIsCheckingBlockedDates(false);
    }
  };

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
      toast.error('Failed to add to cart');
    }
  };

  // Fetch themes from the database
  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from("CAKE")
        .select("theme")
        .not("theme", "is", null);

      if (error) {
        console.error("Error fetching themes:", error);
        return;
      }

      // Get unique themes and sort them alphabetically
      const uniqueThemes = [...new Set(data.map(cake => cake.theme))].sort();
      setAvailableThemes(uniqueThemes);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  // Fetch cake data from Supabase
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);

        // Start both the API call and minimum loading time simultaneously
        const [apiResult] = await Promise.all([
          supabase.from("CAKE").select("*"),
          new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second loading
        ]);

        const { data, error } = apiResult;
        if (error) {
          toast.error("Failed to load cakes. Please try again.");
          return;
        }

        // Generate public URLs for each cake
        const cakesWithImages = data.map((cake) => {
          const publicUrl = getPublicImageUrl(cake.cake_img);
          return { ...cake, publicUrl };
        });

        setCakes(cakesWithImages);

        // Fetch themes after cakes are loaded
        await fetchThemes();
      } catch (error) {
        toast.error("Failed to load cakes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCakes();
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

    // Check if user is logged in
    if (!session) {
      toast.error('Please login first to place an order', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#AF524D',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px 16px',
        },
      });
      navigate('/login');
      return;
    }

    // Set default date to 7 days from today
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    setOrderDate(sevenDaysFromNow.toISOString().split('T')[0]);

    // Reset time to empty - customer must select
    setOrderTime("");

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


    if (!selectedCake || !orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate time is not after 8 PM
    if (orderTime) {
      const [hours, minutes] = orderTime.split(':');
      const hour = parseInt(hours);
      if (hour > 20 || (hour === 20 && parseInt(minutes) > 0)) {
        toast.error('Pickup/delivery time cannot be after 8:00 PM');
        return;
      }
    }

    // Check if the selected date is blocked
    if (isDateBlockedForCalendar(orderDate)) {
      toast.error('The selected date is not available for orders');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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
        order_date: new Date().toISOString(), // Current date and time
        delivery_method: orderType,
        order_schedule: scheduledDate.toISOString(),
        delivery_address: orderType === "Delivery" ? deliveryAddress : null,
        cus_id: customer.cus_id,
        order_status: 'Pending' // New orders start as pending
      };


      const { data: orderData, error: orderError } = await supabase
        .from("ORDER")
        .insert([orderInsertData])
        .select()
        .single();

      if (orderError) {
        toast.error('Failed to create order. Please try again.');
        return;
      }


      // 2. Create CAKE_ORDERS record
      const cakeOrderData = {
        quantity: cakeQuantity,
        order_id: orderData.order_id,
        cake_id: selectedCake.cake_id
      };


      const { data: cakeOrderResult, error: cakeOrderError } = await supabase
        .from("CAKE-ORDERS")
        .insert([cakeOrderData])
        .select();

      if (cakeOrderError) {
        toast.error('Failed to create cake order. Please try again.');
        return;
      }


      // 3. Create PAYMENT record
      const { error: paymentError } = await supabase
        .from("PAYMENT")
        .insert([
          {
            payment_method: "Cash", // Default to Cash for now
            amount_paid: 0, // Default to 0.00 for new orders
            total: totalPrice, // Total price the customer needs to pay
            // payment_date: new Date().toISOString().split('T')[0],
            payment_status: "Unpaid", // Default to Unpaid
            receipt: null, // No receipt uploaded yet
            order_id: orderData.order_id
          }
        ]);

      if (paymentError) {
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

      // Notify other components (e.g., Header) to refresh counts
      try { window.dispatchEvent(new Event('orderUpdated')); } catch (e) { }

      // Advance to success step (step 3)
      setCurrentStep(3);

    } catch (error) {
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
    // Validate step 1 requirements before proceeding
    if (currentStep === 1) {
      if (!orderDate) {
        toast.error('Please select a date for your order');
        return;
      }
      if (!orderTime) {
        toast.error('Please select a time for your order');
        return;
      }
      if (orderType === "Delivery" && !deliveryAddress.trim()) {
        toast.error('Please enter a delivery address');
        return;
      }
      if (isDateBlocked || isDateBlockedForCalendar(orderDate)) {
        toast.error('The selected date is not available for orders');
        return;
      }
    }

    if (currentStep < 3) {
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

  // Reload cards when page changes
  useEffect(() => {
    const reloadCakes = async () => {
      try {
        setPageLoading(true);

        // Start both the API call and minimum loading time simultaneously
        const [apiResult] = await Promise.all([
          supabase.from("CAKE").select("*"),
          new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second loading
        ]);

        const { data, error } = apiResult;
        if (error) {
          console.error("Error fetching cakes:", error);
          return;
        }

        const cakesWithImages = data.map((cake) => {
          const publicUrl = getPublicImageUrl(cake.cake_img);
          return { ...cake, publicUrl };
        });

        setCakes(cakesWithImages);
      } catch (error) {
        console.error("Error reloading cakes:", error);
      } finally {
        setPageLoading(false);
      }
    };

    // Skip the initial mount to avoid double loading with the main fetchCakes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Reload for all subsequent page changes
    reloadCakes();
  }, [currentPage]);

  // Fetch blocked dates on component mount
  useEffect(() => {
    fetchBlockedDates();
  }, []);

  // Check capacity when month changes
  useEffect(() => {
    checkMonthCapacity();
  }, [currentMonth]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomCalendar) {
        const calendarElement = event.target.closest('.custom-calendar');
        const dateFieldElement = event.target.closest('.date-field-container');

        if (!calendarElement && !dateFieldElement) {
          setShowCustomCalendar(false);
        }
      }
    };

    if (showCustomCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomCalendar]);

  if (loading) {
    return <LoadingSpinner message="Loading cake catalog..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8E6B4] via-[#E2D2A2] to-[#DFDAC7] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#AF524D] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#DFAD56] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#E2D2A2] rounded-full blur-3xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 animate-bounce">
        <div className="w-6 h-6 bg-[#DFAD56] rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-20 right-20 animate-pulse">
        <div className="w-4 h-4 bg-[#AF524D] rounded-full opacity-40"></div>
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
        <div className="w-8 h-8 bg-[#E2D2A2] rounded-full opacity-50"></div>
      </div>

      <div className="relative z-10 p-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-abhaya font-bold text-[#492220] mb-4">Our Cake Collection</h1>
          <p className="text-lg text-[#492220]/70 max-w-2xl mx-auto">
            Discover our handcrafted cakes, each made with love and the finest ingredients
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
          {/* Sidebar */}
          <aside className="w-full xl:w-80 xl:sticky xl:top-6 xl:self-start">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 text-[#492220] sticky top-6 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#AF524D]/5 via-transparent to-[#DFAD56]/5 rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#AF524D] to-[#8B3A3A] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-abhaya font-bold">Filters</h2>
                </div>

                <div className="space-y-6">
                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#492220]" htmlFor="sortBy">
                      Sort by
                    </label>
                    <select
                      id="sortBy"
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220]"
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

                  {/* Price Range */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="6 6 12 12" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Price Range
                    </h3>
                    <div className="relative">
                      <div className="w-full h-2 bg-[#AF524D] rounded-lg"></div>
                      <input
                        type="range"
                        min="0"
                        max="16000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="absolute top-0 left-0 w-full h-2 cursor-pointer slider-design appearance-none bg-transparent"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-[#492220]/70">
                      <span>₱0</span>
                      <span className="font-semibold text-[#AF524D]">₱{price}</span>
                    </div>
                  </div>

                  {/* Theme Filters */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Theme
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableThemes.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">No themes available</p>
                      ) : (
                        availableThemes.map((theme) => (
                          <label key={theme} className="flex items-center gap-3 cursor-pointer hover:bg-[#AF524D]/10 p-2 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#AF524D] bg-white border-2 border-[#AF524D]/30 rounded focus:ring-[#AF524D]/20 focus:ring-2"
                              checked={selectedThemes.includes(theme)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedThemes([...selectedThemes, theme]);
                                } else {
                                  setSelectedThemes(selectedThemes.filter((t) => t !== theme));
                                }
                              }}
                            />
                            <span className="text-sm text-[#492220]">{theme}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tier Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#492220]" htmlFor="tier">
                      Tiers
                    </label>
                    <select
                      id="tier"
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220]"
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                    >
                      <option value="all">All Tiers</option>
                      {[1, 2, 3, 4, 5].map((t) => (
                        <option key={t} value={t}>{t} Tier</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
              <div className="text-center">
                <h3 className="text-xl font-abhaya font-bold text-[#492220] mb-2">
                  {filteredCakes.length} Cakes Found
                </h3>
                <p className="text-[#492220]/70">
                  Showing {indexOfFirstCake + 1} to {Math.min(indexOfLastCake, filteredCakes.length)} of {filteredCakes.length} results
                </p>
              </div>
            </div>

            {/* Cake Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pageLoading ? (
                // Show skeleton cards during page loading
                Array.from({ length: cakesPerPage }, (_, index) => (
                  <CakeCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : (
                // Show actual cake cards
                currentCakes.map((cake) => (
                  <div
                    key={cake.cake_id}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 text-center cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 transform group"
                    onClick={() => handleCakeClick(cake)}
                  >
                    <div className="relative mb-4 overflow-hidden rounded-xl">
                      <img
                        src={cake.publicUrl}
                        alt={cake.name}
                        className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "/saved-cake.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#492220] mb-2 group-hover:text-[#AF524D] transition-colors">
                      {cake.name}
                    </h3>
                    <p className="text-xl font-bold text-[#AF524D] mb-3">₱{cake.price}</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-[#492220]/70">
                      <span className="bg-[#AF524D]/10 text-[#AF524D] px-2 py-1 rounded-full">
                        {cake.tier} Tier
                      </span>
                      <span className="bg-[#DFAD56]/10 text-[#8B3A3A] px-2 py-1 rounded-full">
                        {cake.theme}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || pageLoading}
                  className="px-6 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  Previous
                </button>

                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={pageLoading}
                      className={`px-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none ${currentPage === page
                        ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white'
                        : 'bg-white/80 text-[#492220] hover:bg-[#AF524D]/10 border border-[#AF524D]/20'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || pageLoading}
                  className="px-6 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Cake Detail Modal */}
      {isModalOpen && selectedCake && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-6 text-center relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-abhaya font-bold text-white mb-2">{selectedCake.name}</h2>
                <p className="text-white/80 text-sm">Cake Details</p>
              </div>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold cursor-pointer transition-colors duration-200 hover:scale-110 transform"
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
                  className="w-full h-64 object-contain rounded-2xl shadow-lg"
                  onError={(e) => {
                    e.target.src = "/saved-cake.png";
                  }}
                />
              </div>

              {/* Cake Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#492220] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cake Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#AF524D]/5 rounded-xl">
                      <span className="font-medium text-[#492220]">Theme:</span>
                      <span className="text-[#AF524D] font-semibold">{selectedCake.theme}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#DFAD56]/5 rounded-xl">
                      <span className="font-medium text-[#492220]">Tiers:</span>
                      <span className="text-[#8B3A3A] font-semibold">{selectedCake.tier}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl">
                      <span className="font-medium text-[#492220]">Price:</span>
                      <span className="text-[#AF524D] font-bold text-xl">₱{selectedCake.price}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#492220] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description
                  </h3>
                  <p className="text-[#492220]/80 leading-relaxed p-4 bg-[#F8E6B4]/30 rounded-xl">
                    {selectedCake.description || "No description available for this cake."}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleOrderCake}
                  className="px-8 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white font-semibold rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Order This Cake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedCake && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeOrderModal}
        >
          <div
            className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-6 text-center relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-abhaya font-bold text-white mb-2">Complete Your Order</h2>
                <p className="text-white/80 text-sm">Follow the steps to place your order</p>
              </div>
              <button
                onClick={closeOrderModal}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold cursor-pointer transition-colors duration-200 hover:scale-110 transform"
              >
                ×
              </button>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="px-6 py-6 bg-[#F8E6B4]/20">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                    }`}>
                    1
                  </div>
                  <span className="ml-3 text-sm font-medium">Order Details</span>
                </div>

                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A]' : 'bg-gray-200'}`}></div>

                <div className={`flex items-center ${currentStep >= 2 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                    }`}>
                    2
                  </div>
                  <span className="ml-3 text-sm font-medium">Review</span>
                </div>

                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A]' : 'bg-gray-200'}`}></div>

                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                    }`}>
                    3
                  </div>
                  <span className="ml-3 text-sm font-medium">Success</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Cake Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-[#F8E6B4]/30 to-[#E2D2A2]/30 rounded-2xl border border-[#AF524D]/20">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCake.publicUrl || "/saved-cake.png"}
                    alt={selectedCake.name}
                    className="w-16 h-16 object-contain rounded-xl shadow-lg"
                    onError={(e) => {
                      e.target.src = "/saved-cake.png";
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-[#492220] text-lg">{selectedCake.name}</h3>
                    <p className="text-[#AF524D] font-bold text-xl">₱{selectedCake.price}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-[#AF524D]/10 text-[#AF524D] px-2 py-1 rounded-full text-xs">
                        {selectedCake.tier} Tier
                      </span>
                      <span className="bg-[#DFAD56]/10 text-[#8B3A3A] px-2 py-1 rounded-full text-xs">
                        {selectedCake.theme}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: Order Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Quantity Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 4h6" />
                      </svg>
                      Quantity *
                    </label>
                    <div className="flex items-center justify-center gap-4 p-4 bg-[#F8E6B4]/20 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setCakeQuantity(Math.max(1, cakeQuantity - 1))}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 flex items-center justify-center font-bold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        -
                      </button>
                      <span className="w-20 text-center font-bold text-[#492220] text-2xl bg-white/70 px-4 py-2 rounded-xl">
                        {cakeQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCakeQuantity(cakeQuantity + 1)}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 flex items-center justify-center font-bold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Pickup/Delivery Date *
                    </label>
                    <div className="relative">
                      <div
                        className="date-field-container flex items-center gap-3 p-4 bg-white/70 border border-[#AF524D]/20 rounded-xl focus-within:ring-2 focus-within:ring-[#AF524D]/30 focus-within:border-[#AF524D] transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomCalendar(!showCustomCalendar);
                        }}
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-transparent border-none outline-none text-[#492220] font-medium">
                            {orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Select a date'}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className={`w-4 h-4 text-[#AF524D] transition-transform duration-200 ${showCustomCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Custom Calendar Dropdown */}
                      {showCustomCalendar && (
                        <div className="custom-calendar absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-[#AF524D]/20 z-50 p-4">
                          {/* 7-day minimum notice */}
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 text-center">
                              📅 Orders require at least 7 days advance notice
                            </p>
                          </div>
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => navigateMonth(-1)}
                              className="p-2 hover:bg-[#AF524D]/10 rounded-lg transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <h3 className="text-lg font-semibold text-[#492220]">
                              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                              onClick={() => navigateMonth(1)}
                              className="p-2 hover:bg-[#AF524D]/10 rounded-lg transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="p-2 text-center text-sm font-medium text-[#AF524D]">
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(currentMonth).map((date, index) => {
                              if (!date) {
                                return <div key={index} className="p-2"></div>;
                              }

                              const isPast = isDateInPast(date);
                              const isBlocked = isDateBlockedInCalendar(date);
                              const isSelected = orderDate === formatDateForCalendar(date);
                              const isAtCapacity = dateCapacity[formatDateForCalendar(date)] || false;
                              const today = new Date();
                              today.setHours(12, 0, 0, 0);
                              const isToday = formatDateForCalendar(date) === formatDateForCalendar(today);

                              return (
                                <button
                                  key={index}
                                  onClick={() => handleDateSelect(date)}
                                  disabled={isPast || isBlocked || isAtCapacity}
                                  className={`p-2 text-sm rounded-lg transition-all duration-200 ${isSelected
                                    ? 'bg-[#AF524D] text-white font-semibold'
                                    : isPast
                                      ? 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                      : isBlocked
                                        ? 'text-red-400 bg-red-50 cursor-not-allowed line-through'
                                        : isAtCapacity
                                          ? 'text-orange-400 bg-orange-50 cursor-not-allowed'
                                          : 'text-[#492220] hover:bg-[#AF524D]/10 hover:text-[#AF524D]'
                                    }`}
                                >
                                  {date.getDate()}
                                </button>
                              );
                            })}
                          </div>

                          {/* Legend */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                                <span>Blocked</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                                <span>Too Soon</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                                <span>Full (4 orders)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#AF524D] rounded"></div>
                                <span>Selected</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {orderDate && (
                        <div className="mt-3 space-y-2">
                          <div className={`p-3 rounded-xl border ${isDateBlockedForCalendar(orderDate)
                            ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-300'
                            : 'bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 border-[#AF524D]/20'
                            }`}>
                            <p className={`text-sm font-medium ${isDateBlockedForCalendar(orderDate)
                              ? 'text-red-700'
                              : 'text-[#492220]'
                              }`}>
                              Selected: {new Date(orderDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {isDateBlockedForCalendar(orderDate) && (
                                <span className="block mt-1 text-xs text-red-600 font-semibold">
                                  ⚠️ This date is not available for orders
                                </span>
                              )}
                            </p>
                          </div>

                          {isCheckingBlockedDates && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm text-blue-600 font-medium">Checking availability...</p>
                              </div>
                            </div>
                          )}

                          {isDateBlocked && !isCheckingBlockedDates && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                  <p className="text-sm text-red-600 font-medium">This date is not available for orders</p>
                                  {blockedReason && (
                                    <p className="text-xs text-red-500 mt-1">Reason: {blockedReason}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pickup/Delivery Time *
                    </label>

                    {isDateBlocked ? (
                      <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl">
                        <p className="text-sm text-gray-500 text-center">No time slots available for this date</p>
                      </div>
                    ) : availableTimeSlots.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-xs text-gray-600 text-center">
                          Available times: 8:00 AM - 8:00 PM
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                          {availableTimeSlots.map((timeSlot) => (
                            <button
                              key={timeSlot}
                              type="button"
                              onClick={() => setOrderTime(timeSlot)}
                              className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${orderTime === timeSlot
                                ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                : 'bg-white/70 border border-[#AF524D]/20 text-[#492220] hover:bg-[#AF524D]/10 hover:border-[#AF524D]/40'
                                }`}
                            >
                              {formatTime(timeSlot)}
                            </button>
                          ))}
                        </div>
                        {orderTime && (
                          <div className="p-3 bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl border border-[#AF524D]/20">
                            <p className="text-sm text-[#492220] font-medium">
                              Selected: {formatTime(orderTime)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : orderDate && !isCheckingBlockedDates ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-sm text-yellow-600 font-medium">No available time slots for this date</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl">
                        <p className="text-sm text-gray-500 text-center">Select a date to see available times</p>
                      </div>
                    )}
                  </div>

                  {/* Order Type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Order Type
                    </label>
                    <div className="relative">
                      <div
                        className="flex items-center gap-3 p-4 bg-white/70 border border-[#AF524D]/20 rounded-xl cursor-pointer hover:bg-white/90 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#AF524D]/30 focus-within:border-[#AF524D]"
                        onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-[#492220] font-medium">
                            {orderType}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          <svg
                            className={`w-5 h-5 text-[#AF524D] transition-transform duration-200 ${isOrderTypeDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your complete delivery address..."
                        rows="3"
                        className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50 resize-none"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                    <button
                      onClick={closeOrderModal}
                      className="px-6 py-3 bg-white/70 text-[#492220] border border-[#AF524D]/30 rounded-xl hover:bg-[#AF524D]/10 hover:border-[#AF524D]/50 transition-all duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress) || isDateBlocked || isCheckingBlockedDates || isDateBlockedForCalendar(orderDate)}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress) || isDateBlocked || isCheckingBlockedDates || isDateBlockedForCalendar(orderDate)
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D]'
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
                  <h3 className="text-lg font-semibold text-[#492220] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Review Your Order
                  </h3>

                  {/* Order Summary */}
                  <div className="p-6 bg-gradient-to-r from-[#F8E6B4]/30 to-[#E2D2A2]/30 rounded-2xl border border-[#AF524D]/20">
                    <h4 className="font-semibold text-[#492220] mb-6 text-lg">Order Summary</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Cake:</span>
                        <span className="text-[#AF524D] font-semibold">{selectedCake.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Quantity:</span>
                        <span className="text-[#8B3A3A] font-semibold">{cakeQuantity}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Price per cake:</span>
                        <span className="text-[#AF524D] font-semibold">₱{selectedCake.price}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl border-t-2 border-[#AF524D]/20">
                        <span className="font-bold text-[#492220] text-lg">Total Price:</span>
                        <span className="font-bold text-[#AF524D] text-xl">₱{selectedCake.price * cakeQuantity}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Date:</span>
                        <span className="text-[#8B3A3A] font-semibold">{orderDate ? new Date(orderDate).toLocaleDateString() : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Time:</span>
                        <span className="text-[#8B3A3A] font-semibold">{orderTime ? new Date(`2000-01-01T${orderTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="font-medium text-[#492220]">Type:</span>
                        <span className="text-[#8B3A3A] font-semibold">{orderType}</span>
                      </div>
                      {orderType === "Delivery" && deliveryAddress && (
                        <div className="flex justify-between items-start p-3 bg-white/50 rounded-xl">
                          <span className="font-medium text-[#492220]">Address:</span>
                          <span className="text-right max-w-xs text-[#8B3A3A] font-semibold">{deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-[#AF524D]/20">
                    <button
                      onClick={prevStep}
                      className="px-6 py-3 bg-white/70 text-[#492220] border border-[#AF524D]/30 rounded-xl hover:bg-[#AF524D]/10 hover:border-[#AF524D]/50 transition-all duration-200 font-semibold"
                    >
                      Back
                    </button>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${isPlacingOrder
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D]'
                        }`}
                    >
                      {isPlacingOrder ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Placing Order...
                        </div>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Order Success */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#492220] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Order Successfully Placed!
                  </h3>

                  <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="font-bold text-green-800 text-2xl mb-3">Thank you for your order!</h4>
                    <p className="text-green-700 text-lg mb-6">
                      Your order has been successfully placed and will be processed shortly. <br /><br />
                      <b>Please contact Connie de Café to finalize your order.</b>
                    </p>

                    {/* Order Details */}
                    <div className="bg-white/70 rounded-xl p-4 border border-green-200/50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Quantity:</span>
                          <span className="text-green-800 font-semibold">{cakeQuantity} {cakeQuantity === 1 ? 'cake' : 'cakes'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Total Amount:</span>
                          <span className="text-green-800 font-semibold text-lg">₱{(selectedCake.price * cakeQuantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        closeOrderModal();
                        closeModal();
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white font-semibold rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
    </div>
  );
};

export default CakeCatalog;
