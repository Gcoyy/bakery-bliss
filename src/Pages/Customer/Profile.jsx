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

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
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
          setUsername(data.cus_username || "");
          setFirstName(data.cus_fname || "");
          setLastName(data.cus_lname || "");
          setPhoneNumber(data.cus_celno || "");
          setProfile(data);
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

      // Only save default phone number if there was no phone number in the database originally
      // and user hasn't provided a custom one
      const originalPhoneNumber = profile?.cus_celno;
      const phoneToSave = tempPhoneNumber && tempPhoneNumber.trim() !== ""
        ? tempPhoneNumber
        : defaultPhoneNumber; // Always save default number if no custom input

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
    <section className="bg-gradient-to-t from-[#424220] to-[#F8E6B4] min-h-screen flex flex-col items-center justify-center py-20 px-10">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] w-full p-10 rounded-2xl shadow-2xl">

        {/* Title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">My Profile</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
        <div className="flex justify-end mb-4">

        </div>

        <p className="text-lg text-gray-500">Manage and protect your account</p>
        <hr className="my-6 border-gray-400" />

        {/* Username */}
        <div className="mb-6">
          <label className="block text-gray-500 font-semibold mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white border border-gray-300 px-4 py-2 rounded w-full"
          />
        </div>

        {/* First and Last Name */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <label className="block text-gray-500 font-semibold mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-white border border-gray-300 px-4 py-2 rounded w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-500 font-semibold mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-white border border-gray-300 px-4 py-2 rounded w-full"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-gray-500 font-semibold mb-1">Email</label>
          <p className="text-black text-lg font-medium">{profile?.email || ""}</p>
        </div>

        {/* Phone Number with icon */}
        <div className="mb-10 gap-3">
          <label className="block text-gray-500 font-semibold mb-1">Phone Number</label>
          <div className='flex items-center gap-5'>
            {isEditingPhone ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempPhoneNumber || ""}
                  onChange={handlePhoneInputChange}
                  onKeyPress={handlePhoneKeyPress}
                  onBlur={handlePhoneBlur}
                  className="text-black text-lg font-medium border border-black rounded p-2"
                  placeholder="Enter your phone number"
                  autoFocus
                />
                <button
                  onClick={handlePhoneSave}
                  className="text-green-600 hover:text-green-800 cursor-pointer px-2 py-1 rounded"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={handlePhoneCancel}
                  className="text-red-600 hover:text-red-800 cursor-pointer px-2 py-1 rounded"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className={`text-lg font-medium ${isDefaultPhoneNumber() ? 'text-gray-500 italic' : 'text-black'}`}>
                  {getDisplayPhoneNumber()}
                </p>
                {isDefaultPhoneNumber() && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-300">
                    Default Number
                  </span>
                )}
                <button className="text-blue-600 hover:text-blue-800 cursor-pointer" onClick={handleEditPhone}>
                  <img className='w-7 h-7 hover:color-red-500 ' src="/edit.svg" alt="Edit Icon" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            className={`font-semibold py-2 px-10 rounded-lg text-lg cursor-pointer transition-colors ${saving
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-t from-[#613C2A] to-[#EAD0C4] w-full p-10 rounded-2xl shadow-2xl mt-10">
        <div className="bg-[#F2EFE8] p-2 rounded-full">
          <p className='text-2xl font-bold cursor-default'>Saved Custom Cakes:</p>
        </div>

        <div className="relative w-full min-h-[50vh] mt-10 bg-[#F3F0EA] rounded-r-3xl rounded-l-3xl py-8 px-6">
          {customCakes.length > 0 ? (
            customCakes.length > 5 ? (
              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: '.custom-next',
                  prevEl: '.custom-prev',
                }}
                spaceBetween={24}
                slidesPerView="auto"
                centeredSlides={false}
                loop={false}
                className="w-full h-full"
                breakpoints={{
                  1024: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                  },
                  768: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                  },
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 16,
                  },
                  480: {
                    slidesPerView: 1,
                    spaceBetween: 12,
                  }
                }}
              >
                {customCakes.map((cake, idx) => (
                  <SwiperSlide key={idx} className="!w-auto">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-64 h-80 text-center hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                      <div
                        className="relative h-56 overflow-hidden"
                        onClick={() => setSelectedCakeImage(cake.publicUrl)}
                      >
                        <img
                          src={cake.publicUrl || "/placeholder.jpg"}
                          alt={`Custom Cake ${cake.cc_id}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#3B3B3B] text-white py-4 px-4 h-24 flex items-center justify-center">
                        <h3 className="font-bold text-lg">Custom Cake #{cake.cc_id}</h3>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}

                {/* Navigation Arrows */}
                <div className="custom-prev absolute top-1/2 left-2 -translate-y-1/2 bg-gray-600 hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 text-white text-xl transition-colors duration-200 shadow-lg">
                  &lt;
                </div>
                <div className="custom-next absolute top-1/2 right-2 -translate-y-1/2 bg-gray-600 hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10 text-white text-xl transition-colors duration-200 shadow-lg">
                  &gt;
                </div>
              </Swiper>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {customCakes.map((cake, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden w-64 h-80 text-center hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                    <div
                      className="relative h-56 overflow-hidden"
                      onClick={() => setSelectedCakeImage(cake.publicUrl)}
                    >
                      <img
                        src={cake.publicUrl || "/placeholder.jpg"}
                        alt={`Custom Cake ${cake.cc_id}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#3B3B3B] text-white py-4 px-4 h-24 flex items-center justify-center">
                      <h3 className="font-bold text-lg">Custom Cake #{cake.cc_id}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Custom Cakes Yet</h3>
                <p className="text-gray-500 mb-4">You haven't created any custom cakes yet.</p>
                <p className="text-sm text-gray-400">Your custom cake designs will appear here once you create them.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedCakeImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCakeImage(null)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
            <img
              src={selectedCakeImage}
              alt="Custom Cake Design"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setSelectedCakeImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 shadow-lg"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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