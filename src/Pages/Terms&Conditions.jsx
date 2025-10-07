const TermsConditions = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8E6B4] via-[#E2D2A2] to-[#DFDAC7] relative overflow-hidden py-10">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-20 w-32 h-32 bg-[#AF524D] rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#DFAD56] rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#E2D2A2] rounded-full blur-3xl"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 animate-bounce">
                <div className="w-6 h-6 bg-[#DFAD56] rounded-full opacity-60"></div>
            </div>
            <div className="absolute top-20 right-20 animate-pulse">
                <div className="w-4 h-4 bg-[#AF524D] rounded-full opacity-40"></div>
            </div>
            <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
                <div className="w-8 h-8 bg-[#E2D2A2] rounded-full opacity-50"></div>
            </div>

            <main className="max-w-4xl mx-auto p-6 sm:p-10 bg-white shadow-lg rounded-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-2">
                    Terms and Conditions – Connie de Café
                </h1>
                <p className="text-center text-sm text-gray-500 mb-8">Last Updated: October 6, 2025</p>

                <p className="mb-6">
                    Welcome to <span className="font-semibold">Connie de Café</span>! By placing an order through our website,
                    social media, or messaging channels, you agree to the following Terms and Conditions. Please read them
                    carefully before confirming your order.
                </p>

                {/* <!-- 1 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">1. General Information</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            Connie de Café (“we,” “our,” “us”) is a local cake shop based in Dumaguete City, Philippines,
                            offering made-to-order and customizable cakes for any occasion.
                        </li>
                        <li>
                            By placing an order, you confirm that you are at least 18 years old or have parental/guardian consent.
                        </li>
                        <li>All cakes are handcrafted, and slight variations in color, shape, or decoration may occur.</li>
                    </ul>
                </section>

                {/* <!-- 2 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">2. Orders and Customizations</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Orders must be placed at least 3–5 days in advance depending on the design and size.</li>
                        <li>
                            For custom cakes, please provide complete and accurate details, including flavor, size, color theme, and
                            design references.
                        </li>
                        <li>Once your order is submitted, we will confirm it via text, call, or email.</li>
                        <li>We will do our best to match your requested design, but minor artistic differences may occur.</li>
                    </ul>
                </section>

                {/* <!-- 3 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">3. Payments</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>A 50% down payment is required to confirm all orders.</li>
                        <li>The remaining balance must be paid upon pickup or before delivery.</li>
                        <li>Accepted payment methods: GCash, bank transfer, or cash.</li>
                        <li>All prices are in Philippine Peso (₱) and inclusive of applicable taxes.</li>
                    </ul>
                </section>

                {/* <!-- 4 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">4. Cancellations and Refunds</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            Orders canceled at least 3 days before the scheduled pickup or delivery may qualify for a partial refund or
                            store credit.
                        </li>
                        <li>
                            Orders canceled less than 3 days before the date are non-refundable, as ingredients and preparation may
                            already have begun.
                        </li>
                        <li>Down payments for custom cakes are non-refundable once production has started.</li>
                        <li>
                            In rare cases where Connie de Café must cancel your order due to unforeseen circumstances, you will receive
                            a full refund or the option to reschedule.
                        </li>
                    </ul>
                </section>

                {/* <!-- 5 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">5. Pickup and Delivery</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Pickup is available in Dumaguete City at the agreed time and location.</li>
                        <li>Delivery is available within Dumaguete and nearby areas for an additional fee.</li>
                        <li>
                            Customers are responsible for providing accurate delivery details (address, contact number, and recipient
                            name).
                        </li>
                        <li>
                            Once a cake is picked up or delivered, Connie de Café is not responsible for any damage, melting, or
                            mishandling.
                        </li>
                    </ul>
                </section>

                {/* <!-- 6 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">6. Allergies and Ingredients</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Our products are made in a kitchen that handles nuts, dairy, eggs, soy, and gluten.</li>
                        <li>We cannot guarantee that any of our cakes are completely free from allergens.</li>
                    </ul>
                </section>

                {/* <!-- 7 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">7. Photos and Marketing</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>We may take photos of your cake before pickup or delivery.</li>
                        <li>
                            By ordering, you grant Connie de Café permission to use these photos for marketing or social media, unless
                            you request otherwise.
                        </li>
                    </ul>
                </section>

                {/* <!-- 8 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">8. Liability</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            Connie de Café will not be liable for:
                            <ul className="list-disc list-inside ml-6 space-y-1">
                                <li>Incorrect information provided by the customer.</li>
                                <li>Damage or melting after pickup or delivery.</li>
                                <li>Delays caused by weather, traffic, or other circumstances beyond our control.</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                {/* <!-- 9 --> */}
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">9. Changes to These Terms</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            We may update these Terms from time to time. Any updates will be posted on our website or social media.
                            Continued use of our services means you accept the updated Terms.
                        </li>
                    </ul>
                </section>

                {/* <!-- 10 --> */}
                <section className="mb-2">
                    <h2 className="text-xl font-semibold text-amber-800 mb-2">10. Contact Us</h2>
                    <p className="mb-2">For inquiries, custom cake designs, or concerns, please contact us:</p>
                    <p className="font-medium">
                        📞 +63 917 629 2377<br />
                        📧 <a href="mailto:dejesus.connie@gmail.com" className="text-amber-700 underline hover:text-amber-900">dejesus.connie@gmail.com</a>
                    </p>
                </section>
            </main>
        </div>
    )
}

export default TermsConditions