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
          <a href="mailto:conniedecafe@gmail.com" className="flex items-center w-full p-4 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/70 transition-all duration-200 group">
            <div className="w-12 h-12 bg-[#AF524D]/10 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#AF524D]/20 transition-colors">
              <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[#381914] font-medium">Email</p>
              <p className="text-[#492220] text-sm">conniedecafe@gmail.com</p>
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
                <svg className="w-6 h-6 text-[#E4405F] group-hover:scale-110 transition-transform" viewBox="0 0 102 102" id="instagram">
                  <defs>
                    <radialGradient id="a" cx="6.601" cy="99.766" r="129.502" gradientUnits="userSpaceOnUse">
                      <stop offset=".09" stop-color="#fa8f21"></stop>
                      <stop offset=".78" stop-color="#d82d7e"></stop>
                    </radialGradient>
                    <radialGradient id="b" cx="70.652" cy="96.49" r="113.963" gradientUnits="userSpaceOnUse">
                      <stop offset=".64" stop-color="#8c3aaa" stop-opacity="0"></stop>
                      <stop offset="1" stop-color="#8c3aaa"></stop>
                    </radialGradient>
                  </defs>
                  <path fill="url(#a)" d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"></path>
                  <path fill="url(#b)" d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"></path>
                  <path fill="#fff" d="M461.114,477.413a12.631,12.631,0,1,1,12.629,12.632,12.631,12.631,0,0,1-12.629-12.632m-6.829,0a19.458,19.458,0,1,0,19.458-19.458,19.457,19.457,0,0,0-19.458,19.458m35.139-20.229a4.547,4.547,0,1,0,4.549-4.545h0a4.549,4.549,0,0,0-4.547,4.545m-30.99,51.074a20.943,20.943,0,0,1-7.037-1.3,12.547,12.547,0,0,1-7.193-7.19,20.923,20.923,0,0,1-1.3-7.037c-.184-3.994-.22-5.194-.22-15.313s.04-11.316.22-15.314a21.082,21.082,0,0,1,1.3-7.037,12.54,12.54,0,0,1,7.193-7.193,20.924,20.924,0,0,1,7.037-1.3c3.994-.184,5.194-.22,15.309-.22s11.316.039,15.314.221a21.082,21.082,0,0,1,7.037,1.3,12.541,12.541,0,0,1,7.193,7.193,20.926,20.926,0,0,1,1.3,7.037c.184,4,.22,5.194.22,15.314s-.037,11.316-.22,15.314a21.023,21.023,0,0,1-1.3,7.037,12.547,12.547,0,0,1-7.193,7.19,20.925,20.925,0,0,1-7.037,1.3c-3.994.184-5.194.22-15.314.22s-11.316-.037-15.309-.22m-.314-68.509a27.786,27.786,0,0,0-9.2,1.76,19.373,19.373,0,0,0-11.083,11.083,27.794,27.794,0,0,0-1.76,9.2c-.187,4.04-.229,5.332-.229,15.623s.043,11.582.229,15.623a27.793,27.793,0,0,0,1.76,9.2,19.374,19.374,0,0,0,11.083,11.083,27.813,27.813,0,0,0,9.2,1.76c4.042.184,5.332.229,15.623.229s11.582-.043,15.623-.229a27.8,27.8,0,0,0,9.2-1.76,19.374,19.374,0,0,0,11.083-11.083,27.716,27.716,0,0,0,1.76-9.2c.184-4.043.226-5.332.226-15.623s-.043-11.582-.226-15.623a27.786,27.786,0,0,0-1.76-9.2,19.379,19.379,0,0,0-11.08-11.083,27.748,27.748,0,0,0-9.2-1.76c-4.041-.185-5.332-.229-15.621-.229s-11.583.043-15.626.229" transform="translate(-422.637 -426.196)"></path>
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
