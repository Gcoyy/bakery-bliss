import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
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
      setTempPhoneNumber(phoneNumber);
      setIsEditingPhone(true);
    };

    //Function to handle profile save
    const handleSaveProfile = async () => {
      try {
        const updates = {
          cus_username: username,
          cus_fname: firstName,
          cus_lname: lastName,
          cus_celno: tempPhoneNumber,
        };

    const { error } = await supabase
      .from("CUSTOMER")
      .update(updates)
      .eq("auth_user_id", session.user.id);

    if (error) {
      console.error("Error updating profile:", error.message);
    } else {
      console.log("Profile updated successfully.");
      setProfile(prev => ({ ...prev, ...updates }));
      setPhoneNumber(tempPhoneNumber); // commit phone update
      setIsEditingPhone(false); // exit phone edit mode
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};



  if (loading) {
  return <p className="text-center text-xl">Loading profile...</p>;
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
              <input
                type="text"
                value={tempPhoneNumber || ""}
                onChange={e => setTempPhoneNumber(e.target.value)}
                className="text-black text-lg font-medium border border-black rounded p-2"
              />
            ) : (
              <p className="text-black text-lg font-medium">{phoneNumber}</p>
            )}
          <button className="text-blue-600 hover:text-blue-800 cursor-pointer" onClick={handleEditPhone}>
              <img className='w-7 h-7 hover:color-red-500 ' src="/edit.svg" alt="Edit Icon" />
            </button>
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

        <div className="relative w-full mt-10 bg-[#F3F0EA] rounded-r-3xl rounded-l-3xl py-6 px-4">
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
        </div>
      </div>
    </section>
  )
}

export default Profile