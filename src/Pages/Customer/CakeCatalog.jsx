

const CakeCatalog = () => {
    const cakes = [
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    {      name: 'Wedding Cake',
      description: 'Custom Cake for your special day',
      image: '/image 4.png', // Replace with your image path
    },
    ]
  return (
    <section className="bg-gradient-to-t from-[#424220] to-[#F8E6B4] min-h-screen flex flex-col items-center justify-center py-20 px-10">
      <div>
        <h1 className="text-4xl font-bold text-center mb-10 text-[#F8E6B4]">Cake Catalog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cakes.map((cake, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <img src={cake.image} alt={cake.name} className="w-full h-48 object-cover mb-4" />
              <h2 className="text-lg font-semibold mb-2">{cake.name}</h2>
              <p className="text-gray-600">{cake.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CakeCatalog
