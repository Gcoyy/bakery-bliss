import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';




const Profile = () => {
  // State variables  
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState(phoneNumber);
  const { session, signOut } = UserAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customCakes, setCustomCakes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedCakeImage, setSelectedCakeImage] = useState(null);
  const [originalValues, setOriginalValues] = useState({});
  const navigate = useNavigate();

  // Default phone number to display when none is stored
  const defaultPhoneNumber = 15551234567;

  // Function to get display phone number
  const getDisplayPhoneNumber = () => {
    if (!phoneNumber || phoneNumber === defaultPhoneNumber) {
      return defaultPhoneNumber; // Display the default number as is
    }
    return phoneNumber;
  };

  // Function to check if phone number is default
  const isDefaultPhoneNumber = () => {
    return !phoneNumber || phoneNumber === defaultPhoneNumber;
  };

  // Function to check if there are any changes
  const hasChanges = () => {
    if (!profile) return false;

    // Get the current phone number that would be saved
    const currentPhone = tempPhoneNumber && tempPhoneNumber.trim() !== ""
      ? tempPhoneNumber
      : (originalValues.phoneNumber || defaultPhoneNumber);

    return (
      username !== originalValues.username ||
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      currentPhone !== originalValues.phoneNumber
    );
  };

  // Function to handle sign out
  const handleSignOut = async () => {
    console.log("=== Profile Sign Out Button Clicked ===");
    try {
      console.log("Calling signOut...");
      await signOut();
      console.log("Sign out completed, navigating to login...");
      navigate("/login"); // Redirect to login page
      // Scroll to top after navigation
      setTimeout(() => window.scrollTo(0, 0), 100);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  //-----------------------------USE EFFECTS--------------------------------
  // ~Fetch profile data when component mounts or session changes~
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!session || !session.user) {
          console.log("No session or user found.");
          return;
        }

        const { data, error } = await supabase
          .from("CUSTOMER")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .single();

        if (error || !data) {
          console.log("No profile data found for this user.");
        } else {
          //console.log("Fetched profile:", data);
          const profileData = {
            username: data.cus_username || "",
            firstName: data.cus_fname || "",
            lastName: data.cus_lname || "",
            phoneNumber: data.cus_celno || ""
          };

          setUsername(profileData.username);
          setFirstName(profileData.firstName);
          setLastName(profileData.lastName);
          setPhoneNumber(profileData.phoneNumber);
          setProfile(data);
          setOriginalValues(profileData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session]);

  // Fetch custom cakes for the profile
  useEffect(() => {
    const fetchCustomCakes = async () => {
      try {
        if (!profile?.cus_id) return;

        const { data, error } = await supabase
          .from("CUSTOM-CAKE")
          .select("*")
          .eq("cus_id", profile.cus_id);

        if (error) throw error;

        // Add public URL for each custom cake image
        const customCakesWithUrls = data.map(cake => ({
          ...cake,
          publicUrl: cake.cc_img ? supabase.storage.from('cust.cakes').getPublicUrl(cake.cc_img).data.publicUrl : null
        }));

        setCustomCakes(customCakesWithUrls);
      } catch (error) {
        console.error("Error fetching custom cakes:", error.message);
      }
    };

    if (profile) fetchCustomCakes();
  }, [profile]);

  // Ensure first set of images is visible when custom cakes change
  useEffect(() => {
    if (customCakes.length > 3) {
      // Small delay to ensure Swiper is rendered
      const timer = setTimeout(() => {
        const swiperEl = document.querySelector('.swiper');
        if (swiperEl && swiperEl.swiper) {
          swiperEl.swiper.slideTo(0, 0);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [customCakes]);




  // Function to handle phone number edit
  const handleEditPhone = () => {
    // If current phone is default, start with empty string
    const currentPhone = isDefaultPhoneNumber() ? "" : phoneNumber;
    setTempPhoneNumber(currentPhone);
    setIsEditingPhone(true);
  };

  // Function to handle phone number input change with validation
  const handlePhoneInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    const numberRegex = /^[\d]*$/;

    if (numberRegex.test(value) || value === "") {
      setTempPhoneNumber(value);
    }
    // No immediate notification - only when they click save
  };

  // Function to handle phone number save
  const handlePhoneSave = () => {
    // Validate phone number before saving - only numbers allowed
    const numberRegex = /^[\d]+$/;
    if (tempPhoneNumber && !numberRegex.test(tempPhoneNumber)) {
      toast.error("Phone number can only contain numbers", {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // Check if phone number has reasonable length
    if (tempPhoneNumber && (tempPhoneNumber.length < 7 || tempPhoneNumber.length > 15)) {
      toast.error("Phone number must be between 7 and 15 digits", {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // Update the display immediately
    setPhoneNumber(tempPhoneNumber || "");
    setIsEditingPhone(false);
    // The actual save to database will happen when user clicks the main Save button
  };

  // Function to handle phone number cancel
  const handlePhoneCancel = () => {
    setTempPhoneNumber(phoneNumber); // Reset to original value
    setIsEditingPhone(false);
  };

  // Function to handle key press in phone input
  const handlePhoneKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePhoneSave();
    } else if (e.key === 'Escape') {
      handlePhoneCancel();
    }
  };

  // Function to handle click outside phone input
  const handlePhoneBlur = () => {
    // Small delay to allow for button clicks
    setTimeout(() => {
      setIsEditingPhone(false);
    }, 100);
  };

  //Function to handle profile save
  const handleSaveProfile = async () => {
    if (saving) return; // Prevent multiple clicks

    setSaving(true);

    try {
      // Validate required fields
      if (!username.trim()) {
        toast.error('Username is required', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      if (!firstName.trim()) {
        toast.error('First name is required', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      if (!lastName.trim()) {
        toast.error('Last name is required', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }

      // Save the phone number - use temp if editing, otherwise keep original
      const phoneToSave = isEditingPhone
        ? (tempPhoneNumber && tempPhoneNumber.trim() !== "" ? tempPhoneNumber : defaultPhoneNumber)
        : (phoneNumber || defaultPhoneNumber);

      const updates = {
        cus_username: username.trim(),
        cus_fname: firstName.trim(),
        cus_lname: lastName.trim(),
        cus_celno: phoneToSave,
      };

      const { error } = await supabase
        .from("CUSTOMER")
        .update(updates)
        .eq("auth_user_id", session.user.id);

      if (error) {
        console.error("Error updating profile:", error.message);
        toast.error(`Failed to update profile: ${error.message}`, {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        console.log("Profile updated successfully.");
        setProfile(prev => ({ ...prev, ...updates }));
        setPhoneNumber(phoneToSave || ""); // Update local state
        setIsEditingPhone(false); // exit phone edit mode

        // Update original values to current values
        setOriginalValues({
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneToSave
        });

        // Update the phone number state to match what was saved
        setPhoneNumber(phoneToSave);

        // Show success notification
        toast.success('Profile updated successfully!', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
          },
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error('An unexpected error occurred. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <section className="bg-gradient-to-br from-[#F8E6B4] via-[#E2D2A2] to-[#DFDAC7] min-h-screen flex flex-col items-center justify-center py-20 px-10 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#AF524D]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-[#DFAD56]/15 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-[#8B3A3A]/8 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-[#DFAD56]/12 rounded-full blur-lg animate-pulse delay-3000"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 w-full max-w-4xl relative z-10 overflow-hidden">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-abhaya font-bold text-white">My Profile</h1>
                  <p className="text-white/90 text-sm">Manage and protect your account</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-2xl cursor-pointer transition-all duration-300 tracking-wide text-sm shadow-lg hover:shadow-xl hover:scale-105 transform flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">

          {/* Username */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/90 backdrop-blur-sm text-[#492220] rounded-2xl px-4 py-3 border border-[#AF524D]/20 focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] text-sm shadow-sm transition-all duration-300 hover:shadow-md"
              placeholder="Enter your username"
            />
          </div>

          {/* First and Last Name */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
                <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-sm text-[#492220] rounded-2xl px-4 py-3 border border-[#AF524D]/20 focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] text-sm shadow-sm transition-all duration-300 hover:shadow-md"
                placeholder="Enter your first name"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
                <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-sm text-[#492220] rounded-2xl px-4 py-3 border border-[#AF524D]/20 focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] text-sm shadow-sm transition-all duration-300 hover:shadow-md"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </label>
            <div className="bg-[#F8F9FA] border border-[#AF524D]/20 rounded-2xl px-4 py-3">
              <p className="text-[#492220] text-sm font-medium">{profile?.email || ""}</p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone Number
            </label>
            <div className='flex items-center gap-4'>
              {isEditingPhone ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={tempPhoneNumber || ""}
                    onChange={handlePhoneInputChange}
                    onKeyPress={handlePhoneKeyPress}
                    onBlur={handlePhoneBlur}
                    className="flex-1 bg-white/90 backdrop-blur-sm text-[#492220] rounded-2xl px-4 py-3 border border-[#AF524D]/20 focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] text-sm shadow-sm transition-all duration-300 hover:shadow-md"
                    placeholder="Enter your phone number"
                    autoFocus
                  />
                  <button
                    onClick={handlePhoneSave}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
                    title="Save"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handlePhoneCancel}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 bg-[#F8F9FA] border border-[#AF524D]/20 rounded-2xl px-4 py-3">
                    <p className={`text-sm font-medium ${isDefaultPhoneNumber() ? 'text-gray-500 italic' : 'text-[#492220]'}`}>
                      {getDisplayPhoneNumber()}
                    </p>
                  </div>
                  {isDefaultPhoneNumber() && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-300 font-medium">
                      Default Number
                    </span>
                  )}
                  <button
                    className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white p-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
                    onClick={handleEditPhone}
                    title="Edit Phone Number"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="text-center pt-4">
            <button
              className={`font-bold px-8 py-4 rounded-2xl text-sm cursor-pointer transition-all duration-300 tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transform disabled:hover:scale-100 flex items-center justify-center mx-auto ${saving || !hasChanges()
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] hover:from-[#8B3A3A] hover:to-[#6B2D2D] text-white'
                }`}
              onClick={handleSaveProfile}
              disabled={saving || !hasChanges()}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 w-full max-w-4xl relative z-10 overflow-hidden mt-10">
        {/* Custom Cakes Header */}
        <div className="bg-gradient-to-r from-[#DFAD56] to-[#B8941F] p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center">
              <div className="mr-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-abhaya font-bold text-white">Saved Custom Cakes</h2>
                <p className="text-white/90 text-sm">Your personalized cake designs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Cakes Content */}
        <div className="p-8">

          <div className="relative w-full min-h-[50vh] bg-gradient-to-br from-[#F8F9FA] to-[#F0F0F0] rounded-2xl py-8 px-4">
            {customCakes.length > 0 ? (
              customCakes.length > 3 ? (
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    nextEl: '.custom-next',
                    prevEl: '.custom-prev',
                  }}
                  spaceBetween={0}
                  slidesPerView={3}
                  slidesPerGroup={3}
                  centeredSlides={false}
                  loop={false}
                  className="w-full h-full"
                  allowTouchMove={true}
                  breakpoints={{
                    1536: {
                      slidesPerView: 3,
                      slidesPerGroup: 3,
                      spaceBetween: 0,
                    },
                    1280: {
                      slidesPerView: 3,
                      slidesPerGroup: 3,
                      spaceBetween: 0,
                    },
                    1024: {
                      slidesPerView: 3,
                      slidesPerGroup: 3,
                      spaceBetween: 0,
                    },
                    768: {
                      slidesPerView: 2,
                      slidesPerGroup: 2,
                      spaceBetween: 0,
                    },
                    640: {
                      slidesPerView: 2,
                      slidesPerGroup: 2,
                      spaceBetween: 0,
                    },
                    480: {
                      slidesPerView: 1,
                      slidesPerGroup: 1,
                      spaceBetween: 0,
                    }
                  }}
                  onSwiper={(swiper) => {
                    // Start from the beginning to show first 3 images
                    if (swiper && customCakes.length > 0) {
                      setTimeout(() => {
                        swiper.slideTo(0, 0);
                      }, 100);
                    }
                  }}
                >
                  {customCakes.map((cake, idx) => (
                    <SwiperSlide key={idx} className="!w-1/3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden w-full max-w-64 h-80 text-center hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 transform border border-white/20 mx-auto">
                        <div
                          className="relative h-56 overflow-hidden"
                          onClick={() => setSelectedCakeImage(cake.publicUrl)}
                        >
                          <img
                            src={cake.publicUrl || "/placeholder.jpg"}
                            alt={`Custom Cake ${cake.cc_id}`}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white py-4 px-4 h-24 flex items-center justify-center">
                          <h3 className="font-bold text-lg">Custom Cake #{cake.cc_id}</h3>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}

                  {/* Navigation Arrows */}
                  <div className="custom-prev absolute top-1/2 left-2 -translate-y-1/2 bg-[#AF524D] hover:bg-[#8B3A3A] rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 text-white text-xl transition-all duration-300 shadow-lg hover:scale-110 transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div className="custom-next absolute top-1/2 right-2 -translate-y-1/2 bg-[#AF524D] hover:bg-[#8B3A3A] rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 text-white text-xl transition-all duration-300 shadow-lg hover:scale-110 transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Swiper>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                  {customCakes.map((cake, idx) => (
                    <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden w-64 h-80 text-center hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 transform border border-white/20">
                      <div
                        className="relative h-56 overflow-hidden"
                        onClick={() => setSelectedCakeImage(cake.publicUrl)}
                      >
                        <img
                          src={cake.publicUrl || "/placeholder.jpg"}
                          alt={`Custom Cake ${cake.cc_id}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white py-4 px-4 h-24 flex items-center justify-center">
                        <h3 className="font-bold text-lg">Custom Cake #{cake.cc_id}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#DFAD56]/10 rounded-full p-6 inline-block">
                      <svg className="w-16 h-16 text-[#AF524D] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-abhaya font-bold text-[#492220] mb-2">No Custom Cakes Yet</h3>
                  <p className="text-[#492220]/70 mb-4">You haven't created any custom cakes yet.</p>
                  <p className="text-sm text-[#492220]/50">Your custom cake designs will appear here once you create them.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedCakeImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCakeImage(null)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
            <img
              src={selectedCakeImage}
              alt="Custom Cake Design"
              className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedCakeImage(null)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white text-[#AF524D] rounded-full p-3 transition-all duration-300 shadow-lg hover:scale-110 transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Profile