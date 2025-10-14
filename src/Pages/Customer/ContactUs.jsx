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
        'service_qjrk6rs', // EmailJS service ID
        'template_08ka2zu', // EmailJS template ID for contact form
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'dejesus.connie@gmail.com', // Your business email
        },
        'bkqhQ7VXGwKuEjz_G' // EmailJS public key
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
    <section className="bg-[url('/ContactUs.png')] bg-cover bg-center w-full min-h-screen px-8 py-12 flex flex-col items-end justify-center space-y-6">
      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-lg">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#AF524D] to-[#DFAD56] px-8 py-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-white font-abhaya">Contact Us Today!</h1>
          </div>
          <p className="text-white/90 text-sm">We'd love to hear from you</p>
        </div>

        {/* Form content */}
        <div className="px-8 py-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center text-[#381914] font-medium" htmlFor="name">
                <svg className="w-4 h-4 mr-2 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-[#AF524D]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-[#381914] font-medium" htmlFor="email">
                <svg className="w-4 h-4 mr-2 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-[#AF524D]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-[#381914] font-medium" htmlFor="subject">
                <svg className="w-4 h-4 mr-2 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="What's this about?"
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-[#AF524D]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-[#381914] font-medium" htmlFor="message">
                <svg className="w-4 h-4 mr-2 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us how we can help you..."
                rows={4}
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-[#AF524D]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-6 py-3 bg-gradient-to-r from-[#AF524D] to-[#DFAD56] text-white font-semibold rounded-2xl transition-all duration-300 hover:from-[#DFAD56] hover:to-[#AF524D] hover:scale-[1.02] transform shadow-lg flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-lg">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#AF524D] to-[#DFAD56] px-8 py-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white font-abhaya">Get In Touch</h2>
          </div>
          <p className="text-white/90 text-sm">Connect with us</p>
        </div>

        {/* Contact info content */}
        <div className="px-8 py-6 space-y-6">
          <a href="mailto:dejesus.connie@gmail.com" className="flex items-center w-full p-4 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-200 group">
            <div className="w-12 h-12 bg-[#AF524D]/10 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#AF524D]/20 transition-colors">
              <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[#381914] font-medium">Email</p>
              <p className="text-[#492220] text-sm">dejesus.connie@gmail.com</p>
            </div>
          </a>

          <a href="tel:+639176292377" className="flex items-center w-full p-4 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-200 group">
            <div className="w-12 h-12 bg-[#DFAD56]/10 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#DFAD56]/20 transition-colors">
              <svg className="w-6 h-6 text-[#DFAD56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-[#381914] font-medium">Phone</p>
              <p className="text-[#492220] text-sm">+63 917 629 2377</p>
            </div>
          </a>

          <div className="pt-4">
            <p className="text-[#381914] font-medium text-center mb-4">Follow Us</p>
            <div className="flex items-center justify-center space-x-6">
              <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-[#3b5998]/10 hover:bg-[#3b5998]/20 rounded-xl flex items-center justify-center transition-all duration-200 group">
                <svg className="w-6 h-6 text-[#3b5998] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-[#E4405F]/10 to-[#F77737]/10 hover:from-[#E4405F]/20 hover:to-[#F77737]/20 rounded-xl flex items-center justify-center transition-all duration-200 group">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="url(#instagram-gradient)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E4405F" />
                      <stop offset="100%" stopColor="#F77737" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
