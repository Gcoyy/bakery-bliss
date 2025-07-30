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

function chunkArray(array, size) {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}


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
        setCustomCakes(data);
      } catch (error) {
        console.error("Error fetching custom cakes:", error.message);
      }
    };

    if (profile) fetchCustomCakes();
  }, [profile]);

  // Function to chunk the custom cakes into groups of 4
  const cakeGroups = chunkArray(customCakes, 4);


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
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-10 rounded-lg text-lg cursor-pointer"
            onClick={handleSaveProfile}
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-t from-[#613C2A] to-[#EAD0C4] w-full p-10 rounded-2xl shadow-2xl mt-10">
        <div className="bg-[#F2EFE8] p-2 rounded-full">
          <p className='text-2xl font-bold cursor-default'>Saved Custom Cakes:</p>
        </div>

        <div className="relative w-full min-h-[40vh] mt-10 bg-[#F3F0EA] rounded-r-3xl rounded-l-3xl py-6 px-4">
          {customCakes.length > 0 ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: '.custom-next',
                prevEl: '.custom-prev',
              }}
              spaceBetween={20}
              slidesPerView={1}
              loop={false}
              className="w-full h-full"
            >
              {cakeGroups.map((group, i) => (
                <SwiperSlide key={i}>
                  <div className="flex justify-center gap-4">
                    {group.map((cake, idx) => (
                      <div key={idx} className="bg-white rounded-3xl shadow-lg overflow-hidden w-56 text-center">
                        <img
                          src={cake.preview_url || "/placeholder.jpg"}
                          alt={`Custom Cake ${cake.cc_id}`}
                          className="rounded-t-3xl object-cover h-40 w-full"
                        />
                        <div className="bg-[#3B3B3B] text-white py-2 px-2 rounded-b-3xl">
                          <h3 className="font-bold text-lg">Custom Cake #{cake.cc_id}</h3>
                          <p className="text-sm italic">Order #{cake.order_id}</p>
                          <p className="text-xs text-blue-200 underline">click to size</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SwiperSlide>
              ))}

              {/* Navigation Arrows */}
              <div className="custom-prev absolute top-1/2 left-0 -translate-y-1/2 bg-gray-500 rounded-r-lg px-3 py-4 cursor-pointer z-10 text-white text-2xl">
                &lt;
              </div>
              <div className="custom-next absolute top-1/2 right-0 -translate-y-1/2 bg-gray-500 rounded-l-lg px-3 py-4 cursor-pointer z-10 text-white text-2xl">
                &gt;
              </div>
            </Swiper>
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
    </section>
  )
}

export default Profile