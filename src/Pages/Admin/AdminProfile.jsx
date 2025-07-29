import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { UserAuth } from '../../context/AuthContext';

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('ADMIN')
        .select('*')
        .eq('admin_uid', session.user.id)
        .single();

      if (error) {
        console.error('Admin not found:', error.message);
        setAdmin(null);
      } else {
        setAdmin(data);
      }
      setLoading(false);
    };

    fetchAdmin();
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) return <p className="text-center text-xl">Loading profile...</p>;
  if (!admin) return <p className="text-center text-red-500 text-lg">No admin data found.</p>;

  return (
    <section className="bg-gradient-to-t from-[#424220] to-[#F8E6B4] min-h-screen flex flex-col items-center justify-center py-20 px-10">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] w-full p-10 rounded-2xl shadow-2xl max-w-xl">
        {/* Title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Admin Profile</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>

        <p className="text-lg text-gray-500">View your admin account information</p>
        <hr className="my-6 border-gray-400" />

        {/* Username */}
        <div className="mb-6">
          <label className="block text-gray-500 font-semibold mb-2">Username</label>
          <p className="text-black text-lg">{admin.username}</p>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-gray-500 font-semibold mb-2">Email</label>
          <p className="text-black text-lg">{admin.admin_email}</p>
        </div>
      </div>
    </section>
  );
};

export default AdminProfile;
