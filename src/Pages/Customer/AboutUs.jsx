import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"
import { useState } from "react";
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

  if (mapLoading) {
    return <LoadingSpinner message="Loading about us page..." />;
  }

  return (
    <section className="bg-[linear-gradient(to_bottom,_#AF524D_0%,_#AF524D_20%,_#381914_83%)] bg-cover bg-center w-full h-fit py-20 px-60 flex flex-col items-center justify-center text-[#492220] space-y-10">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-18 py-10 flex flex-col items-center justify-center rounded-2xl space-y-10 w-full shadow-2xl">
        <h1 className="text-6xl font-bold font-jost">Who is Connie?</h1>
      </div>

      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-10 py-10 rounded-2xl shadow-2xl flex
      items-center justify-center gap-10 w-full">
        <img src="#" alt="Connie's Picture" className="w-1/3"/>

        <div className="w-2/3">
          <h2>Connie June B. De Jesus</h2>

          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-10 w-full bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-10 py-10 rounded-2xl shadow-2xl">
        <div className="flex flex-col justify-center items-center w-2/3" id="location">
          <h2 className="text-4xl font-bold font-jost">Connie de Cafe's Location</h2>

          {/* Google Map goes here */}
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap 
              mapContainerStyle={containerStyle} 
              center={center} 
              zoom={12}
              onLoad={handleMapLoad}
            >
              <Marker position={center} />
            </GoogleMap>
          </LoadScript>
        </div>

        <div className="flex flex-col justify-center items-center w-1/3">
          <h2>Our Products</h2>

          {/* Product carousel goes here */}
        </div>
      </div>
    </section>
  )
}

export default AboutUs
