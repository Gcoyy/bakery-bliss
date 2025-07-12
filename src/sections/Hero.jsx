import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="bg-[url('/Hero.png')] bg-cover bg-center w-full h-[120vh] flex items-center justify-start" id="home">
      <div className="flex flex-col items-center justify-center h-full text-center space-y-15 max-w-2xl w-full px-8">
        <h1 className="text-[#EBD187] text-8xl font-abhaya ">Connie de Café</h1>

        <p className="font-bold text-white/76 text-3xl">Where every slice begins with your imagination</p>

        <div className="flex items-center justify-center mt-20">
          <div className="group relative flex items-center space-x-4">
            <motion.button 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
              duration: .3,
              ease: "easeInOut"
            }}
            viewport={{ once: true, amount: 0.5 }}
            className="bg-gradient-to-r from-white/60 to-transparent text-white px-6 py-4 rounded-full hover:bg-[#FFECB5] hover:text-gray-800 transition duration-300 tracking-widest text-2xl font-bold shadow-md">
              Customize Now
            </motion.button>
            <img
              src="/g_arrow.png"
              alt="arrow"
              className="
                absolute 
                left-full 
                top-[120%]
                translate-y-0
                opacity-0 
                group-hover:top-1/2 
                group-hover:-translate-y-1/2
                group-hover:opacity-100 
                transition-all 
                duration-500 
                ease-in-out 
                ml-2
              "
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero;