import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useEffect } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


const Profile = () => {
    const username = "John Snow";
    // const address = "123 Bakery Lane, Sweet City, SC 12345";
    const phone = "123-456-7890";
    const email = "p8oZy@example.com";
    const password = "password123";
    const firstname = "John";
    const lastname = "Doe";

     // Fix Swiper nav buttons not showing until after mount
  useEffect(() => {}, []);

  const cakes = [
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    {
      name: 'Wedding Cake',
      subtitle: '(Custom Cake)',
      note: 'click to size',
      image: '/image 4.png', // Replace with your image path
    },
    // Add more cake objects here if needed
  ];

  const chunkArray = (arr, size) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const cakeGroups = chunkArray(cakes, 4); // 3 cakes per slide

  return (
    <section className="bg-gradient-to-t from-[#424220] to-[#F8E6B4] min-h-screen flex flex-col items-center justify-center py-20 px-10">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] w-full p-10 rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-6">
            <img src="/pfp.png" alt="Profile Picture" />

            <div className="bg-[#F2EFE8] p-6 rounded-lg shadow-xl space-y-4 w-1/3">
                <h1 className="text-4xl font-bold">{username}</h1>
                <hr />
                {/* <p>USER _ID#</p> */}
                <div className="space-y-1">
                    {/* <p>ADDRESS: {address}</p> */}
                    <p>NAME: {firstname} {lastname}</p>
                    <p>PHONE: {phone}</p>
                    <p>EMAIL: {email}</p>
                    <p>PASSWORD: {password}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-gradient-to-t from-[#613C2A] to-[#EAD0C4] w-full p-10 rounded-2xl shadow-2xl mt-10">
        <div className="bg-[#F2EFE8] p-1 rounded-full ">
            <p>Saved Custom Cakes:</p>
        </div>

        <div className="relative w-full mt-10 bg-[#F3F0EA] rounded-r-3xl rounded-l-3xl py-6 px-4">
            <Swiper
                modules={[Navigation]}
                navigation={{
                    nextEl: '.custom-next',
                    prevEl: '.custom-prev',
                }}
                pagination={{ clickable: true }}
                spaceBetween={20}
                slidesPerView={1}
                loop={false}
                className="w-full h-full"
                >
                {cakeGroups.map((group, i) => (
                <SwiperSlide key={i}>
                    <div className="flex justify-center gap-6">
                    {group.map((cake, idx) => (
                        <div
                        key={idx}
                        className="bg-white rounded-3xl shadow-lg overflow-hidden w-56 text-center"
                        >
                        <img
                            src={cake.image}
                            alt={cake.name}
                            className="rounded-t-3xl"
                        />
                        <div className="bg-[#3B3B3B] text-white py-2 px-2 rounded-b-3xl">
                            <h3 className="font-bold text-lg">{cake.name}</h3>
                            <p className="text-sm italic">{cake.subtitle}</p>
                            <p className="text-xs text-blue-200 underline">
                            {cake.note}
                            </p>
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
