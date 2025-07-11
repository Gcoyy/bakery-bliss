import { useEffect, useRef, useState } from "react";

const CakeCustom = () => {
  const buttonRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), 500);
        }
      },
      { threshold: 0.5 }
    );

    if (buttonRef.current) {
      observer.observe(buttonRef.current);
    }

    return () => {
      if (buttonRef.current) observer.unobserve(buttonRef.current);
    };
  }, []);


  return (
    <div className="bg-[linear-gradient(to_bottom,_#F2EFE8_0%,_#DFDAC7_51%,_#A8A599_100%)] h-auto py-20">
      <section className="flex flex-col items-center text-center px-4 py-16">
  {/* Title */}
  <h2 className="text-2xl md:text-5xl font-bold tracking-widest py-10 pb-30">
    How to create your cake?
  </h2>

  {/* Description */}
  <p className="max-w-2xl text-gray-700 mb-12 text-base md:text-3xl text-left">
    Connie de Cafe's got you covered! With our drag-and-drop customization tool, 
    you can bring your cake ideas to life — and see the magic happen in REAL TIME!
  </p>

  {/* Cake image with hotspots */}
  <div className="relative w-full max-w-4xl p-11">
    <img src="/image 4.png" alt="Cake" className="w-full mx-auto" />

    {/* Button positions */}
    <button
      ref={buttonRef}
      className={`absolute top-[18%] left-[0%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-xs w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#82171C] backdrop-filter backdrop-blur-[2px] font-semibold transition-opacity duration-700 ease-in
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      Add Frosting <br />& Fillings
    </button>


    <button className={`
    absolute top-[10%] right-[5%] 
    text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em]
    max-w-xs w-auto text-left
    bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A]
    border-4 border-[#82171C] backdrop-filter backdrop-blur-[2px]
    font-semibold

    transition-opacity duration-[700ms] ease-in 
    transition-transform duration-[300ms] hover:scale-115 

    ${visible ? "opacity-100" : "opacity-0"}
    `}
    >
      Add Decorations <br />& Toppings
    </button>

    <button className="absolute top-[42%] left-[-8%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Flavor
    </button>

    <button className="absolute top-[42%] right-[-8%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Layers
    </button>

    <button className="absolute bottom-[20%] left-[-7%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Shape
    </button>

    <button className="absolute bottom-[20%] right-[-12%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Size
    </button>
  </div>
</section>


    </div>
  )
}

export default CakeCustom;