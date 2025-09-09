import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { UserAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!session?.user?.id) return;

      try {
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
      } catch (error) {
        console.error('Error fetching admin:', error);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [session]);

  const handleSignOut = async () => {
    console.log("=== Admin Profile Sign Out Button Clicked ===");
    try {
      console.log("Calling signOut...");
      await signOut();
      console.log("Sign out completed, navigating to login...");
      navigate('/login');
      setTimeout(() => window.scrollTo(0, 0), 100);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!admin) return <p className="text-center text-red-500 text-lg">No admin data found.</p>;

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-abhaya font-bold text-white">Admin Profile</h1>
                  <p className="text-white/90 text-sm">View your admin account information</p>
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
          {/* Admin ID */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              Admin ID
            </label>
            <div className="bg-[#F8F9FA] border border-[#AF524D]/20 rounded-2xl px-4 py-3">
              <p className="text-[#492220] text-sm font-medium">{admin.admin_id}</p>
            </div>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Username
            </label>
            <div className="bg-[#F8F9FA] border border-[#AF524D]/20 rounded-2xl px-4 py-3">
              <p className="text-[#492220] text-sm font-medium">{admin.username || "Not set"}</p>
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
              <p className="text-[#492220] text-sm font-medium">{admin.admin_email || "Not set"}</p>
            </div>
          </div>

          {/* Password Status */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#492220] mb-2 flex items-center">
              <svg className="w-4 h-4 text-[#AF524D] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password Status
            </label>
            <div className="bg-[#F8F9FA] border border-[#AF524D]/20 rounded-2xl px-4 py-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <p className="text-[#492220] text-sm font-medium">Password is set</p>
              </div>
            </div>
          </div>

          {/* Admin Role Badge */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Administrator
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminProfile;