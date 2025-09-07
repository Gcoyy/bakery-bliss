import { motion } from "framer-motion"
import { Link } from "react-router-dom";

const CakeCollection = () => {
  return (
    <section className="bg-[url('/Section3.png')] bg-cover bg-center w-full h-[120vh] py-20 flex items-center justify-end">
      <div className="flex flex-col items-center justify-center h-full text-center space-y-15 max-w-4xl w-full px-8">
        <h1 className="text-[#381914] text-8xl font-abhaya">Our Cake Collection</h1>

        <p className="font-bold text-white/76 text-3xl">Not in the Mood to Customize? Choose from our pre-designed cake collection.</p>

        <div className="flex items-center justify-center mt-20">
          <div className="group relative flex items-center space-x-4">
            <Link to="/cakecatalog" className="block">
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: .3,
                  ease: "easeInOut"
                }}
                viewport={{ once: true, amount: 0.5 }}
                className="bg-gradient-to-r from-white/60 to-transparent text-white px-6 py-4 rounded-full hover:bg-[#82171C] hover:text-gray-600 transition duration-300 tracking-widest text-2xl font-bold shadow-md cursor-pointer">
                Explore
              </motion.button>
            </Link>
            <img
              src="/r_arrow.png"
              alt="arrow"
              className="
                absolute 
                right-full 
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

export default CakeCollection
