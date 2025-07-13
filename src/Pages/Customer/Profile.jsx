
const Profile = () => {
    const username = "John Doe";
    const address = "123 Bakery Lane, Sweet City, SC 12345";
    const phone = "123-456-7890";
    const email = "p8oZy@example.com";
    const password = "password123";
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
                    <p>PHONE: {phone}</p>
                    <p>EMAIL: {email}</p>
                    <p>PASSWORD: {password}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-gradient-to-t from-[#613C2A] to-[#EAD0C4] w-full p-10 rounded-2xl shadow-2xl mt-10">
        <div>
            <p>Saved Custom Cakes:</p>
        </div>
        
        <div>

        </div>
      </div>
    </section>
  )
}

export default Profile
