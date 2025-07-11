// import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react"

const CakeCustom = () => {
  // const buttonRef = useRef(null);
  // const [visible, setVisible] = useState(false);

  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry.isIntersecting) {
  //         setTimeout(() => setVisible(true), 500);
  //       }
  //     },
  //     { threshold: 0.5 }
  //   );

  //   if (buttonRef.current) {
  //     observer.observe(buttonRef.current);
  //   }

  //   return () => {
  //     if (buttonRef.current) observer.unobserve(buttonRef.current);
  //   };
  // }, []);


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
    <motion.button
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute top-[18%] left-[0%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-xs w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#82171C] backdrop-filter backdrop-blur-[2px] font-semibold">
      Add Frosting <br />& Fillings
    </motion.button>


    <motion.button 
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute top-[10%] right-[5%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-xs w-auto text-left bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#82171C] backdrop-filter backdrop-blur-[2px] font-semibold"
    >
      Add Decorations <br />& Toppings
    </motion.button>

    <motion.button 
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute top-[42%] left-[-8%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Flavor
    </motion.button>

    <motion.button 
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute top-[42%] right-[-8%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Layers
    </motion.button>

    <motion.button 
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute bottom-[20%] left-[-7%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-r from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Shape
    </motion.button>

    <motion.button 
    initial={{ opacity: 0, scale: 0 }}
    whileInView={{ opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.1,
      transition: { duration: 0.3 }
    }}
    transition={{
      duration: 1.5,
      ease: "easeInOut"
    }}
    viewport={{ once: true, amount: 0.5 }} // only plays once when 50% in view
    className="absolute bottom-[20%] right-[-12%] text-gray-800 px-8 py-1.5 rounded-full text-2xl shadow-md tracking-[0.15em] max-w-fit w-auto text-left bg-gradient-to-l from-white/60 to-transparent text-[#3A3A3A] border-4 border-[#DFAD56]/53 transition-transform hover:scale-115 duration-600 delay-100 backdrop-filter backdrop-blur-[2px] font-semibold">
      Choose Cake <br />Size
    </motion.button>
  </div>
</section>


    </div>
  )
}

export default CakeCustom;