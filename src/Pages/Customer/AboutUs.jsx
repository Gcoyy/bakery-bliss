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
    <section className="bg-[linear-gradient(to_bottom,_#AF524D_0%,_#AF524D_20%,_#381914_83%)] bg-cover bg-center w-full min-h-screen py-20 px-4 md:px-8 lg:px-16 xl:px-32 relative overflow-hidden">

      {/* Hero Section - Large and Centered */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 md:px-16 py-16 flex flex-col items-center justify-center rounded-3xl space-y-8 w-full shadow-2xl mb-16 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold font-jost text-center text-[#492220]">About Connie de Café</h1>
        <p className="text-xl md:text-2xl text-center max-w-4xl text-[#492220]/80 leading-relaxed">
          Where every slice begins with your imagination and every bite tells a story of passion, creativity, and love for the art of baking.
        </p>
      </motion.div>

      {/* Story Section - Asymmetric Layout */}
      <div className="relative mb-20">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 md:px-12 py-12 rounded-3xl shadow-2xl w-3/4 ml-0 relative z-20"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-2/5">
              <img
                src="/client.png"
                alt="Connie de Café Bakery"
                className="w-full rounded-2xl shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
              />
            </div>
            <div className="w-full lg:w-3/5 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold font-jost text-[#492220]">Our Story</h2>
              <div className="space-y-4 text-[#492220]/90">
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

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="absolute -top-8 -right-8 w-32 h-32 bg-[#EBD187] rounded-full opacity-20 z-10"
        ></motion.div>
      </div>

      {/* Values Section - Staggered Grid */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mb-20"
      >
        <h2 className="text-4xl md:text-5xl font-bold font-jost text-center mb-16 text-white">What Makes Us Special</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* First Value - Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-10 rounded-2xl shadow-2xl text-center space-y-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300"
          >
            <div className="w-20 h-20 bg-[#EBD187] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-3xl">🎨</span>
            </div>
            <h3 className="text-2xl font-bold font-jost text-[#492220]">Creative Design</h3>
            <p className="text-[#492220]/80 text-lg leading-relaxed">
              Every cake is a canvas for creativity. We bring your wildest cake dreams to life with our innovative designs and artistic flair.
            </p>
          </motion.div>

          {/* Second Value - Center, Larger */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-12 rounded-2xl shadow-2xl text-center space-y-6 transform scale-105 relative z-10"
          >
            <div className="w-24 h-24 bg-[#EBD187] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-4xl">🌾</span>
            </div>
            <h3 className="text-2xl font-bold font-jost text-[#492220]">Premium Ingredients</h3>
            <p className="text-[#492220]/80 text-lg leading-relaxed">
              We use only the finest, freshest ingredients to ensure every bite is a moment of pure indulgence and quality.
            </p>
          </motion.div>

          {/* Third Value - Right */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-10 rounded-2xl shadow-2xl text-center space-y-6 transform rotate-1 hover:rotate-0 transition-transform duration-300"
          >
            <div className="w-20 h-20 bg-[#EBD187] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-3xl">❤️</span>
            </div>
            <h3 className="text-2xl font-bold font-jost text-[#492220]">Personal Touch</h3>
            <p className="text-[#492220]/80 text-lg leading-relaxed">
              Every cake is made with love and attention to detail, ensuring your special moments are celebrated with perfection.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Location Section - Offset Layout */}
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

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#EBD187] rounded-full opacity-20 z-10"
        ></motion.div>
      </motion.div>

      {/* Call to Action - Centered with Flair */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 md:px-16 py-16 rounded-3xl shadow-2xl w-4/5 mx-auto text-center relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-bold font-jost mb-8 text-[#492220]">Ready to Create Your Dream Cake?</h2>
        <p className="text-xl md:text-2xl mb-10 text-[#492220]/80 max-w-3xl mx-auto leading-relaxed">
          Let's work together to bring your vision to life. Whether it's a birthday, wedding, or any special celebration, we're here to make it unforgettable.
        </p>
        <Link to="/cakecustomization">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#AF524D] to-[#381914] text-white px-12 py-6 rounded-full text-xl font-semibold shadow-xl "
          >
            Start Customizing
          </motion.button>
        </Link>
      </motion.div>
    </section>
  )
}

export default AboutUs
