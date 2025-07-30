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
    <section className="bg-[url('/AboutUs.png')] bg-cover bg-center w-full min-h-screen px-8 py-12 flex flex-col items-end justify-center space-y-6">
      <form onSubmit={handleSubmit} className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-8 flex flex-col items-center justify-center rounded-2xl space-y-6 w-full max-w-lg shadow-2xl">
        <h1 className="font-bold text-3xl text-center text-[#381914]">Contact Us Today!</h1>

        <div className="flex flex-col space-y-4 w-full">
          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-[#381914]" htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-[#381914]" htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-[#381914]" htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full bg-white text-black rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-[#381914]" htmlFor="message">Message:</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full h-24 bg-white text-black rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-[#82171C] text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>

      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_51%,_#A8A599_100%)] h-fit px-8 py-6 flex flex-col items-center justify-center rounded-2xl space-y-4 w-full max-w-lg shadow-2xl">
        <h2 className="font-bold text-2xl text-[#381914] mb-2">Get In Touch</h2>

        <a href="mailto:conniedecafe@gmail.com" className="flex items-center w-full space-x-4 hover:opacity-80 transition-opacity">
          <img src="/mail_icon.png" alt="Mail Icon" className="w-6 h-6" />
          <p className="text-lg text-[#381914]">conniedecafe@gmail.com</p>
        </a>

        <a href="tel:+639176292377" className="flex items-center w-full space-x-4 hover:opacity-80 transition-opacity">
          <img src="/phone_icon.png" alt="Phone Icon" className="w-6 h-6" />
          <p className="text-lg text-[#381914]">+63 917 629 2377</p>
        </a>

        <div className="flex items-center justify-center space-x-8 w-full pt-2">
          <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src="/fb_icon.png" alt="Facebook Icon" className="w-8 h-8" />
          </a>

          <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src="/ig_icon.png" alt="Instagram Icon" className="w-8 h-8" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
