import { useState } from 'react';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email using EmailJS
      const result = await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'conniedecafe@gmail.com', // Your business email
        },
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
      );

      if (result.status === 200) {
        // Show success notification
        toast.success('Message sent successfully! We will get back to you soon.', {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
          },
        });

        // Clear form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send message. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[url('/AboutUs.png')] bg-cover bg-center w-full h-[180vh] px-20 py-20 flex flex-col items-center justify-center items-end space-y-20">
      <form onSubmit={handleSubmit} className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-18 py-20 flex flex-col items-center justify-center rounded-[50px] space-y-10 w-1/2 shadow-2xl">
        <h1 className="font-bold text-5xl">CONTACT US TODAY!</h1>

        <div className="flex flex-col space-y-4 w-full">
          <div className="flex items-center space-x-5">
            <label className="text-4xl" htmlFor="name">NAME:</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            />
          </div>

          <div className="flex items-center space-x-5">
            <label className="text-4xl" htmlFor="email">EMAIL:</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            />
          </div>

          <div className="flex items-center space-x-5">
            <label className="text-4xl" htmlFor="subject">SUBJECT:</label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            />
          </div>

          <div>
            <label className="text-4xl" htmlFor="message">MESSAGE:</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full h-[15vh] bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] resize-none"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-[#82171C] text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full mt-4 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
          </button>
        </div>
      </form>

      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-20 py-10 flex flex-col items-center justify-center rounded-[50px] space-y-10 w-1/2 shadow-2xl">
        <a href="#" className="flex items-center w-full space-x-4">
          <img src="/mail_icon.png" alt="Mail Icon" />

          <p className="text-4xl">conniedecafe@gmail.com</p>
        </a>

        <a href="#" className="flex items-center w-full space-x-4">
          <img src="/phone_icon.png" alt="Phone Icon" />

          <p className="text-4xl">+63 917 629 2377</p>
        </a>

        <div className="flex items-center justify-around w-full">
          <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer">
            <img src="/fb_icon.png" alt="Facebook Icon" />
          </a>

          <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer">
            <img src="/ig_icon.png" alt="Instagram Icon" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
