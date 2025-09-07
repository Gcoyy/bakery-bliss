import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";

const AboutUs = () => {
  const [mapLoading, setMapLoading] = useState(true);

  const containerStyle = {
    width: "100%",
    height: "400px"
  };

  const center = {
    lat: 10.3157, // Example: Dumaguete coordinates
    lng: 123.8854
  };

  const handleMapLoad = () => {
    setMapLoading(false);
  };

  const handleMapError = () => {
    setMapLoading(false);
  };

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMapLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#AF524D] via-[#8B3A3A] to-[#492220] relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#F8E6B4]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-[#E2D2A2]/15 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-[#DFAD56]/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-[#F8E6B4]/20 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-[#E2D2A2]/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 py-20 px-4 md:px-8 lg:px-16 xl:px-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-16 mb-16 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F8E6B4]/20 to-[#E2D2A2]/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#DFAD56]/20 to-[#F8E6B4]/20 rounded-full blur-xl"></div>

          <div className="relative z-10 text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold font-abhaya text-white">
              About <span className="text-[#F8E6B4]">Connie de Café</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Where every slice begins with your imagination and every bite tells a story of passion, creativity, and love for the art of baking.
            </p>
          </div>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 mb-16 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#F8E6B4]/10 to-[#E2D2A2]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#DFAD56]/10 to-[#F8E6B4]/10 rounded-full blur-xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-2/5">
              <div className="relative group">
                <img
                  src="/client.png"
                  alt="Connie de Café Bakery"
                  className="w-full rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#AF524D]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <div className="w-full lg:w-3/5 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold font-abhaya text-white">
                Our <span className="text-[#F8E6B4]">Story</span>
              </h2>
              <div className="space-y-4 text-white/90">
                <p className="text-lg md:text-xl leading-relaxed">
                  Founded with a dream and a passion for creating extraordinary cakes, Connie de Café began as a small home-based bakery with big aspirations.
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  Our founder, Connie June B. De Jesus, started this journey with a simple belief: every celebration deserves a cake that's as unique as the moment itself.
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  From intimate birthday celebrations to grand wedding receptions, we've had the privilege of being part of countless memorable moments.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-abhaya text-center mb-16 text-white">
            What Makes Us <span className="text-[#F8E6B4]">Special</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* First Value */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center space-y-6 hover:bg-white/15 transition-all duration-300 group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-[#492220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" /> */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold font-abhaya text-white">Creative Design</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Every cake is a canvas for creativity. We bring your wildest cake dreams to life with our innovative designs and artistic flair.
              </p>
            </motion.div>

            {/* Second Value - Center, Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center space-y-6 hover:bg-white/15 transition-all duration-300 group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-[#492220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M15.2109 8.78899L3.4653 20.5347M8.90748 15.0925L9.10982 14.9292C9.30611 14.7589 9.48392 14.5681 9.64012 14.3598C10.854 12.7413 10.526 10.4451 8.90748 9.23119L8.70514 9.39448C8.50885 9.56474 8.33104 9.75557 8.17484 9.96383C6.96092 11.5824 7.28893 13.8786 8.90748 15.0925ZM8.90748 15.0925L9.07078 15.2948C9.24104 15.4911 9.43188 15.6689 9.64016 15.8252C11.2587 17.039 13.5548 16.711 14.7687 15.0925L14.6054 14.8901C14.4352 14.6938 14.2443 14.516 14.036 14.3598C12.4175 13.1459 10.1214 13.4739 8.90748 15.0925ZM11.8381 12.1618L12.0404 11.9985C12.2367 11.8283 12.4145 11.6375 12.5707 11.4292C13.7847 9.81064 13.4566 7.51447 11.8381 6.30055L11.6358 6.46384C11.4395 6.6341 11.2617 6.82492 11.1055 7.03319C9.89154 8.65174 10.2195 10.9479 11.8381 12.1618ZM11.8381 12.1618L12.0014 12.3642C12.1717 12.5605 12.3625 12.7383 12.5708 12.8945C14.1893 14.1084 16.4854 13.7804 17.6993 12.1618L17.536 11.9595C17.3658 11.7632 17.1749 11.5854 16.9667 11.4292C15.3481 10.2153 13.052 10.5433 11.8381 12.1618ZM14.7687 9.23119L14.9711 9.0679C15.1673 8.89764 15.3452 8.70682 15.5014 8.49855C16.7153 6.88 16.3873 4.58383 14.7687 3.36991L14.5664 3.5332C14.3701 3.70346 14.1923 3.89428 14.0361 4.10255C12.8222 5.7211 13.1502 8.01727 14.7687 9.23119ZM14.7687 9.23119L14.932 9.43354C15.1023 9.62984 15.2931 9.80766 15.5014 9.96387C17.1199 11.1778 19.4161 10.8497 20.6299 9.23119L20.4667 9.02885C20.2964 8.83254 20.1056 8.65473 19.8973 8.49852C18.2787 7.28463 15.9826 7.61266 14.7687 9.23119ZM5.90748 18.0925L6.10982 17.9292C6.30611 17.7589 6.48392 17.5681 6.64012 17.3598C7.85405 15.7413 7.52603 13.4451 5.90748 12.2312L5.70514 12.3945C5.50885 12.5647 5.33104 12.7556 5.17484 12.9638C3.96092 14.5824 4.28893 16.8786 5.90748 18.0925ZM5.90748 18.0925L6.07078 18.2948C6.24104 18.4911 6.43188 18.6689 6.64016 18.8252C8.25869 20.039 10.5548 19.711 11.7687 18.0925L11.6054 17.8901C11.4352 17.6938 11.2443 17.516 11.036 17.3598C9.41751 16.1459 7.12137 16.4739 5.90748 18.0925ZM17.6292 7.40757C17.3714 7.44439 17.1108 7.45359 16.8516 7.43518L16.593 7.40753C16.3069 5.40469 17.6986 3.54913 19.7014 3.26301C20.045 3.21392 20.3939 3.21392 20.7375 3.26301C21.0237 5.26589 19.632 7.12145 17.6292 7.40757Z" stroke="#000000" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold font-abhaya text-white">Premium Ingredients</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                We use only the finest, freshest ingredients to ensure every bite is a moment of pure indulgence and quality.
              </p>
            </motion.div>

            {/* Third Value */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center space-y-6 hover:bg-white/15 transition-all duration-300 group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-[#492220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold font-abhaya text-white">Personal Touch</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Every cake is made with love and attention to detail, ensuring your special moments are celebrated with perfection.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Location Section - Offset Layout - COMMENTED OUT UNTIL GOOGLE MAPS API KEY IS CONFIGURED */}
        {/* 
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mb-20 relative"
      >
        <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-10 rounded-3xl shadow-2xl w-5/6 ml-auto relative z-20">
          <h2 className="text-3xl md:text-4xl font-bold font-jost text-center mb-8 text-[#492220]">Visit Our Bakery</h2>
          <div className="rounded-2xl overflow-hidden shadow-xl relative">
            {mapLoading && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AF524D] mx-auto mb-2"></div>
                  <p className="text-[#492220]">Loading map...</p>
                </div>
              </div>
            )}
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              onLoad={() => setMapLoading(false)}
              onError={handleMapError}
            >
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={handleMapLoad}
                onError={handleMapError}
              >
                <Marker position={center} />
              </GoogleMap>
            </LoadScript>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#EBD187] rounded-full opacity-20 z-10"
        ></motion.div>
      </motion.div>
      */}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-16 text-center relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#F8E6B4]/20 to-[#E2D2A2]/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-[#DFAD56]/20 to-[#F8E6B4]/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-abhaya mb-8 text-white">
              Ready to Create Your <span className="text-[#F8E6B4]">Dream Cake?</span>
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Let's work together to bring your vision to life. Whether it's a birthday, wedding, or any special celebration, we're here to make it unforgettable.
            </p>
            <Link to="/cakecustomization">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] hover:from-[#8B3A3A] hover:to-[#AF524D] text-white px-12 py-6 rounded-2xl text-xl font-semibold shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Start Customizing
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutUs
