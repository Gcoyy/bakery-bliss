import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserAuth } from '../../context/AuthContext';
import QRCode from 'qrcode';
import emailjs from '@emailjs/browser';

const Cart = () => {
    const { session } = UserAuth();
    const [activeTab, setActiveTab] = useState('toPay'); // 'toPay', 'toReceive', 'completed', or 'cancelled'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [orderLoading, setOrderLoading] = useState(false);
    // const [showPaymentModal, setShowPaymentModal] = useState(false);
    // const [selectedOrder, setSelectedOrder] = useState(null);
    // const [receiptFile, setReceiptFile] = useState(null);
    // const [uploading, setUploading] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');

    // Helper function to get public image URL
    const getPublicImageUrl = (path) => {
        if (!path) return null;

        // If the path is already a full URL, return it as is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // If it's a file path, generate the public URL
        return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
    };

    // Helper function to check if order can be cancelled (5 days before delivery)
    const canCancelOrder = (orderSchedule) => {
        if (!orderSchedule) return false;

        const deliveryDate = new Date(orderSchedule);
        const currentDate = new Date();

        // Set both dates to start of day for accurate comparison
        deliveryDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        // Calculate difference in days
        const timeDiff = deliveryDate.getTime() - currentDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Can cancel if 5 or more days before delivery
        return daysDiff >= 5;
    };

    // Function to automatically cancel unpaid orders less than 7 days before delivery
    const autoCancelUnpaidOrders = async () => {
        if (!session?.user) return;

        try {
            // Get all pending orders with payment info and related data
            const { data: allOrders, error: fetchError } = await supabase
                .from('ORDER')
                .select(`
                    order_id,
                    order_schedule,
                    order_status,
                    order_date,
                    delivery_method,
                    delivery_address,
                    cus_id,
                    CUSTOMER!inner(
                        email
                    ),
                    PAYMENT!inner(
                        payment_status,
                        amount_paid,
                        total
                    ),
                    "CAKE-ORDERS"(
                        quantity,
                        CAKE(
                            name,
                            price
                        )
                    ),
                    "CUSTOM-CAKE"(
                        cc_id,
                        cc_img
                    )
                `)
                .eq('order_status', 'Pending')
                .in('PAYMENT.payment_status', ['Unpaid']);

            if (fetchError) {
                console.error('Error fetching unpaid orders:', fetchError);
                return;
            }

            if (!allOrders || allOrders.length === 0) return;

            const currentDate = new Date();
            const ordersToCancel = [];

            // Check each order to see if it's 7 days or less before delivery
            for (const order of allOrders) {
                if (!order.order_schedule) continue;

                const deliveryDate = new Date(order.order_schedule);
                const timeDiff = deliveryDate.getTime() - currentDate.getTime();
                const daysUntilDelivery = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // If less than 7 days until delivery, mark for cancellation
                if (daysUntilDelivery < 7) {
                    ordersToCancel.push(order);
                }
            }

            if (ordersToCancel.length > 0) {
                console.log(`Found ${ordersToCancel.length} unpaid orders to auto-cancel (less than 7 days before delivery)`);

                // Cancel each unpaid order
                for (const order of ordersToCancel) {
                    try {
                        // Update order status to 'Cancelled'
                        const { error: orderError } = await supabase
                            .from('ORDER')
                            .update({ order_status: 'Cancelled' })
                            .eq('order_id', order.order_id);

                        if (orderError) {
                            console.error(`Error cancelling order ${order.order_id}:`, orderError);
                            continue;
                        }

                        // Send email notification to admin
                        const cancellationReason = "Order has been automatically cancelled because the customer has not paid";
                        try {
                            // Get cake details from CAKE-ORDERS relationship
                            const cakeOrders = order["CAKE-ORDERS"] || [];
                            const customCakes = order["CUSTOM-CAKE"] || [];

                            let cakeName = '';
                            let totalQuantity = 0;

                            if (cakeOrders.length > 0) {
                                const cakeNames = cakeOrders.map(co => co.CAKE?.name).filter(Boolean);
                                cakeName = cakeNames.join(', ');
                                totalQuantity = cakeOrders.reduce((sum, co) => sum + (co.quantity || 0), 0);
                            } else if (customCakes.length > 0) {
                                cakeName = 'Custom Cake Design';
                                totalQuantity = customCakes.length; // Each custom cake is typically 1 quantity
                            } else {
                                cakeName = 'Unknown Cake';
                                totalQuantity = 0;
                            }

                            // Get payment amounts (numerical values)
                            const amountPaid = order.PAYMENT?.amount_paid || 0;
                            const totalAmount = order.PAYMENT?.total || 0;

                            const emailParams = {
                                to_email: 'admin@bakerybliss.com', // Replace with actual admin email
                                subject: `Order #${order.order_id} Auto-Cancelled - No Payment`,
                                message: `Order #${order.order_id} has been automatically cancelled due to non-payment.\n\nOrder Details:\n- Order ID: ${order.order_id}\n- Order Date: ${new Date(order.order_schedule).toLocaleDateString()}\n- Delivery Date: ${new Date(order.order_schedule).toLocaleDateString()}\n- Delivery Method: ${order.delivery_method || 'Pickup'}\n- Delivery Address: ${order.delivery_address || 'N/A'}\n- Customer ID: ${order.cus_id}\n- Customer Email: ${order.CUSTOMER?.email || 'Unknown'}\n\nCake Details:\n- Cake(s): ${cakeName}\n- Total Quantity: ${totalQuantity}\n\nPayment Details:\n- Amount Paid: ₱${amountPaid.toLocaleString()}\n- Total Amount: ₱${totalAmount.toLocaleString()}\n\nCancellation Reason:\n"${cancellationReason}"\n\nThis order was automatically cancelled by the system because payment was not received within 7 days of the delivery date.`
                            };

                            await emailjs.send(
                                'service_qjrk6rs', // EmailJS service ID
                                'template_1b8rn3c', // EmailJS template ID for order cancellations
                                emailParams,
                                'bkqhQ7VXGwKuEjz_G' // EmailJS public key
                            );

                            console.log(`Email sent for auto-cancelled order ${order.order_id}`);
                        } catch (emailError) {
                            console.error(`Error sending email for order ${order.order_id}:`, emailError);
                        }

                        console.log(`Auto-cancelled order ${order.order_id} (${Math.ceil((new Date(order.order_schedule).getTime() - currentDate.getTime()) / (1000 * 3600 * 24))} days before delivery)`);
                    } catch (error) {
                        console.error(`Error processing order ${order.order_id}:`, error);
                    }
                }

                // Refresh orders after auto-cancellation
                fetchOrders();
            }
        } catch (error) {
            console.error('Error in auto-cancel function:', error);
        }
    };



    // Fetch orders from database
    const fetchOrders = async () => {
        if (!session?.user) return;

        try {
            setLoading(true);

            // First get the customer ID from the CUSTOMER table
            const { data: customerData, error: customerError } = await supabase
                .from('CUSTOMER')
                .select('cus_id')
                .eq('auth_user_id', session.user.id)
                .single();

            if (customerError) {
                console.error('Error fetching customer:', customerError);
                toast.error('Failed to load customer information');
                return;
            }

            // Now fetch orders using the proper schema
            const { data, error } = await supabase
                .from('ORDER')
                .select(`
                     *,
                     CAKE-ORDERS (
                         co_id,
                         quantity,
                         cake_id,
                         CAKE (
                             cake_id,
                             name,
                             price,
                             cake_img
                         )
                     ),
                     CUSTOM-CAKE (
                         cc_id,
                         cc_img,
                         order_id,
                         cus_id
                     ),
                     PAYMENT (
                         payment_id,
                         payment_method,
                         amount_paid,
                         total,
                         payment_status,
                         payment_date
                     )
                 `)
                .eq('cus_id', customerData.cus_id)
                .order('order_id', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                toast.error('Failed to load orders');
                return;
            }

            // Process the data to flatten it for easier display
            const processedOrders = [];
            data.forEach(order => {
                // Process regular cake orders
                if (order['CAKE-ORDERS'] && order['CAKE-ORDERS'].length > 0) {
                    order['CAKE-ORDERS'].forEach(cakeOrder => {
                        processedOrders.push({
                            order_id: order.order_id,
                            order_date: order.order_date,
                            delivery_method: order.delivery_method,
                            order_schedule: order.order_schedule,
                            delivery_address: order.delivery_address,
                            order_status: order.order_status || 'Pending',
                            quantity: cakeOrder.quantity,
                            cake_id: cakeOrder.cake_id,
                            order_type: 'regular',
                            CAKE: cakeOrder.CAKE ? {
                                ...cakeOrder.CAKE,
                                publicUrl: (() => {
                                    const imagePath = cakeOrder.CAKE.cake_img;
                                    const publicUrl = getPublicImageUrl(imagePath);
                                    console.log('Regular cake image processing:', {
                                        cakeName: cakeOrder.CAKE.name,
                                        originalPath: imagePath,
                                        publicUrl: publicUrl
                                    });
                                    return publicUrl;
                                })()
                            } : null,
                            payment: order.PAYMENT?.[0] || null,
                            total_price: cakeOrder.CAKE ? cakeOrder.CAKE.price * cakeOrder.quantity : 0
                        });
                    });
                }

                // Process custom cake orders
                if (order['CUSTOM-CAKE'] && order['CUSTOM-CAKE'].length > 0) {
                    order['CUSTOM-CAKE'].forEach(customCake => {
                        // Get public URL for custom cake image
                        const customCakeUrl = supabase.storage.from('cust.cakes').getPublicUrl(customCake.cc_img).data.publicUrl;
                        console.log('Custom cake image processing:', {
                            ccId: customCake.cc_id,
                            originalPath: customCake.cc_img,
                            publicUrl: customCakeUrl
                        });

                        // Get payment details from database
                        const payment = order.PAYMENT?.[0] || null;
                        const totalPrice = payment?.total || 1500; // Use actual payment total from DB or fallback to base price

                        processedOrders.push({
                            order_id: order.order_id,
                            order_date: order.order_date,
                            delivery_method: order.delivery_method,
                            order_schedule: order.order_schedule,
                            delivery_address: order.delivery_address,
                            order_status: order.order_status || 'Pending',
                            quantity: 1, // Custom cakes are typically 1 per order
                            cc_id: customCake.cc_id,
                            order_type: 'custom',
                            CAKE: {
                                name: 'Custom Cake Design',
                                price: totalPrice, // Use actual price from database
                                publicUrl: customCakeUrl
                            },
                            payment: payment,
                            total_price: totalPrice // Use actual total from database
                        });
                    });
                }
            });

            setOrders(processedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };



    // Open payment modal
    // const openPaymentModal = (order) => {
    //     setSelectedOrder(order);
    //     setShowPaymentModal(true);
    //     setReceiptFile(null);
    // };

    // Handle file selection
    // const handleFileChange = (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         // Check file type
    //         if (!file.type.startsWith('image/')) {
    //             toast.error('Please select an image file');
    //             return;
    //         }
    //         // Check file size (5MB limit)
    //         if (file.size > 5 * 1024 * 1024) {
    //             toast.error('File size must be less than 5MB');
    //             return;
    //         }
    //         setReceiptFile(file);
    //     }
    // };

    // Open cancel confirmation modal
    const openCancelModal = (order) => {
        setOrderToCancel(order);
        setShowReasonModal(true);
        setCancelReason('');
    };

    // Generate secure QR code data
    const generateSecureQRData = (order) => {
        const timestamp = Date.now();
        const randomNonce = Math.random().toString(36).substring(2, 15);
        const orderHash = btoa(`${order.order_id}-${timestamp}-${randomNonce}`).replace(/[^a-zA-Z0-9]/g, '');

        return {
            token: orderHash,
            orderId: order.order_id,
            timestamp: timestamp,
            expires: timestamp + (24 * 60 * 60 * 1000), // 24 hours from now
            version: '1.0'
        };
    };

    // Open QR code modal
    const openQRModal = async (order) => {
        setSelectedOrderForQR(order);
        setShowQRModal(true);

        try {
            // Generate secure QR code data
            const qrData = generateSecureQRData(order);
            const qrCodeString = JSON.stringify(qrData);

            const qrCodeDataURL = await QRCode.toDataURL(qrCodeString, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#AF524D',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });
            setQrCodeDataURL(qrCodeDataURL);
        } catch (error) {
            console.error('Error generating QR code:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // Send cancellation email to admin using EmailJS
    const sendCancellationEmail = async (order, reason) => {
        try {
            // Get admin email from ADMIN table
            const { data: adminData, error: adminError } = await supabase
                .from('ADMIN')
                .select('email')
                .limit(1)
                .single();

            if (adminError || !adminData) {
                console.error('Error fetching admin email:', adminError);
                return;
            }

            // Create cancellation record in database for admin to see
            const { error: cancellationError } = await supabase
                .from('ORDER_CANCELLATIONS')
                .insert({
                    order_id: order.order_id,
                    customer_email: session.user.email,
                    cake_name: order.CAKE ? order.CAKE.name : 'Custom Cake Design',
                    total_price: order.total_price,
                    order_date: order.order_date,
                    delivery_date: order.order_schedule,
                    delivery_method: order.delivery_method,
                    cancellation_reason: reason,
                    admin_email: adminData.email,
                    created_at: new Date().toISOString()
                });

            if (cancellationError) {
                console.error('Error creating cancellation record:', cancellationError);
                // Don't fail the cancellation if record creation fails
            }

            // Send email using EmailJS (same as Contact Us)
            const emailParams = {
                to_email: adminData.email,
                from_name: 'Bakery Bliss Customer',
                from_email: session.user.email,
                subject: `Order Cancellation - #${order.order_id} - ${order.CAKE ? order.CAKE.name : 'Custom Cake Design'}`,
                order_id: order.order_id,
                customer_email: session.user.email,
                cake_name: order.CAKE ? order.CAKE.name : 'Custom Cake Design',
                total_price: `₱${order.total_price.toLocaleString()}`,
                order_date: new Date(order.order_date).toLocaleDateString(),
                delivery_date: new Date(order.order_schedule).toLocaleDateString(),
                delivery_method: order.delivery_method,
                cancellation_reason: reason,
                message: `Order #${order.order_id} has been cancelled by the customer.\n\nOrder Details:\n- Cake: ${order.CAKE ? order.CAKE.name : 'Custom Cake Design'}\n- Total Price: ₱${order.total_price.toLocaleString()}\n- Order Date: ${new Date(order.order_schedule).toLocaleDateString()}\n- Delivery Date: ${new Date(order.order_schedule).toLocaleDateString()}\n- Delivery Method: ${order.delivery_method}\n\nCancellation Reason:\n"${reason}"\n\nCustomer Email: ${session.user.email}`
            };

            const result = await emailjs.send(
                'service_qjrk6rs', // EmailJS service ID
                'template_1b8rn3c', // EmailJS template ID for order cancellations
                emailParams,
                'bkqhQ7VXGwKuEjz_G' // EmailJS public key
            );

            if (result.status === 200) {
                console.log('Cancellation email sent successfully');
            } else {
                console.error('Failed to send cancellation email');
            }
        } catch (error) {
            console.error('Error in sendCancellationEmail:', error);
            // Don't fail the cancellation if email fails
        }
    };

    // Cancel order function
    const cancelOrder = async () => {
        if (cancellingOrder || !orderToCancel || !cancelReason.trim()) {
            if (!cancelReason.trim()) {
                toast.error('Please provide a reason for cancellation');
            }
            return;
        }

        setCancellingOrder(true);
        try {
            // Update order status to 'Cancelled'
            const { error: orderError } = await supabase
                .from('ORDER')
                .update({ order_status: 'Cancelled' })
                .eq('order_id', orderToCancel.order_id);

            if (orderError) {
                console.error('Error cancelling order:', orderError);
                toast.error('Failed to cancel order. Please try again.');
                return;
            }

            // Update payment status to 'Cancelled'
            const { error: paymentError } = await supabase
                .from('PAYMENT')
                .update({ payment_status: 'Cancelled' })
                .eq('order_id', orderToCancel.order_id);

            if (paymentError) {
                console.error('Error updating payment status:', paymentError);
                // Don't show error to user as order was already cancelled
            }

            // Send cancellation email to admin
            await sendCancellationEmail(orderToCancel, cancelReason);

            toast.success('Order cancelled successfully! Admin has been notified.');
            setShowReasonModal(false);
            setShowCancelModal(false);
            setOrderToCancel(null);
            setCancelReason('');

            // Refresh orders
            fetchOrders();
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Failed to cancel order. Please try again.');
        } finally {
            setCancellingOrder(false);
        }
    };

    // Upload receipt and update payment
    // const uploadReceipt = async () => {
    //     if (!receiptFile) {
    //         toast.error('Please select a receipt image');
    //         return;
    //     }

    //     if (!selectedOrder) {
    //         toast.error('No order selected');
    //         return;
    //     }

    //     setUploading(true);
    //     try {
    //         // Upload file to Supabase Storage
    //         const fileName = `receipts/${selectedOrder.order_id}_${Date.now()}.${receiptFile.name.split('.').pop()}`;
    //         const { data: uploadData, error: uploadError } = await supabase.storage
    //             .from('receipts')
    //             .upload(fileName, receiptFile);

    //         if (uploadError) {
    //             console.error('Error uploading file:', uploadError);
    //             toast.error('Failed to upload receipt');
    //             return;
    //         }

    //         // Get the public URL
    //         const { data: urlData } = supabase.storage
    //             .from('receipts')
    //             .getPublicUrl(fileName);

    //         // Update payment record with receipt URL
    //         const { error: updateError } = await supabase
    //             .from('PAYMENT')
    //             .update({
    //                 receipt: urlData.publicUrl,
    //                 payment_status: 'Paid',
    //                 payment_date: new Date().toISOString().split('T')[0]
    //             })
    //             .eq('order_id', selectedOrder.order_id);

    //         if (updateError) {
    //             console.error('Error updating payment:', updateError);
    //             toast.error('Failed to update payment status');
    //             return;
    //         }

    //         toast.success('Receipt uploaded successfully!');
    //         setShowPaymentModal(false);
    //         setSelectedOrder(null);
    //         setReceiptFile(null);

    //         // Refresh orders
    //         fetchOrders();
    //     } catch (error) {
    //         console.error('Error processing payment:', error);
    //         toast.error('Failed to process payment');
    //     } finally {
    //         setUploading(false);
    //     }
    // };



    // Get order status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'cancelled':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    useEffect(() => {
        fetchOrders();
        autoCancelUnpaidOrders();
    }, [session?.user]);

    // Check if user is logged in
    if (!session?.user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4] py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-[#381914] mb-2">My Account</h1>
                        <p className="text-[#381914] opacity-80">Manage your cart and view your orders</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Please Log In First</h3>
                        <p className="text-gray-500 mb-6">You need to be logged in to access your cart and orders.</p>
                        <Link to="/login" className="inline-block bg-[#AF524D] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#8B3D3A] transition-colors">
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner message="Loading..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4] py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">My Account</h1>
                    <p className="text-[#381914] opacity-80">Manage your cart and view your orders</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg p-1 shadow-lg">
                        <button
                            onClick={() => setActiveTab('toPay')}
                            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'toPay'
                                ? 'bg-[#AF524D] text-white'
                                : 'text-[#381914] hover:bg-gray-100'
                                }`}
                        >
                            To Pay ({orders.filter(order => order.order_status === 'Pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('toReceive')}
                            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'toReceive'
                                ? 'bg-[#AF524D] text-white'
                                : 'text-[#381914] hover:bg-gray-100'
                                }`}
                        >
                            To Receive ({orders.filter(order => order.order_status === 'Approved').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'completed'
                                ? 'bg-[#AF524D] text-white'
                                : 'text-[#381914] hover:bg-gray-100'
                                }`}
                        >
                            Completed ({orders.filter(order => order.order_status === 'Delivered').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'cancelled'
                                ? 'bg-[#AF524D] text-white'
                                : 'text-[#381914] hover:bg-gray-100'
                                }`}
                        >
                            Cancelled ({orders.filter(order => order.order_status === 'Cancelled').length})
                        </button>
                    </div>
                </div>

                {/* To Pay Tab */}
                {activeTab === 'toPay' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-[#381914] mb-6">Orders to Pay</h2>

                        {orders.filter(order => order.order_status === 'Pending').length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No pending orders</h3>
                                <p className="text-gray-500">Your pending orders will appear here</p>
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-[#AF524D]/30 scrollbar-track-gray-100 hover:scrollbar-thumb-[#AF524D]/50">
                                {orders.filter(order => order.order_status === 'Pending').map((order) => (
                                    <div key={order.order_id} className="bg-gradient-to-br from-white to-[#F7F3F0] rounded-2xl shadow-lg border-2 border-[#AF524D]/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[#AF524D]/30 group">
                                        <div className="p-6">
                                            <div className="flex items-start gap-6">
                                                {order.CAKE && (
                                                    <div className="relative">
                                                        <img
                                                            src={order.CAKE.publicUrl || "/saved-cake.png"}
                                                            alt={order.CAKE.name}
                                                            className="w-20 h-20 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        {order.order_type === 'custom' && (
                                                            <div className="absolute -top-2 -right-2 bg-[#AF524D] text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                                                                Custom
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-[#381914] mb-2">
                                                                {order.CAKE ? order.CAKE.name : 'Cake'}
                                                            </h3>
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                    </svg>
                                                                    <span className="text-gray-600">Order #{order.order_id}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                                                                    </svg>
                                                                    <span className="text-gray-600">Qty: {order.quantity}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="text-gray-600">{new Date(order.order_schedule).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="text-gray-600 capitalize">{order.delivery_method}</span>
                                                                </div>
                                                            </div>
                                                            {order.payment && (
                                                                <div className="mt-3 flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                    </svg>
                                                                    <span className="text-sm text-gray-600">Payment: </span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.payment.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                                        order.payment.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {order.payment.payment_status}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="bg-[#AF524D]/10 rounded-xl p-4 mb-3">
                                                                <p className="text-2xl font-bold text-[#AF524D]">
                                                                    ₱{order.total_price.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                                                                {order.order_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-3 mt-6">
                                                        {canCancelOrder(order.order_schedule) && (
                                                            <button
                                                                onClick={() => openCancelModal(order)}
                                                                disabled={cancellingOrder}
                                                                className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${cancellingOrder
                                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                                                                    }`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                                                            </button>
                                                        )}
                                                        {/* <button
                                                            onClick={() => openPaymentModal(order)}
                                                            disabled={orderLoading}
                                                            className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${orderLoading
                                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                                : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A] shadow-lg hover:shadow-xl transform hover:scale-105'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                            Pay Now
                                                        </button> */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* To Receive Tab */}
                {activeTab === 'toReceive' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-[#381914] mb-6">Orders to Receive</h2>

                        {orders.filter(order => order.order_status === 'Approved').length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders to receive</h3>
                                <p className="text-gray-500">Your approved orders will appear here</p>
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-[#AF524D]/30 scrollbar-track-gray-100 hover:scrollbar-thumb-[#AF524D]/50">
                                {orders.filter(order => order.order_status === 'Approved').map((order) => (
                                    <div
                                        key={order.order_id}
                                        onClick={() => openQRModal(order)}
                                        className="bg-gradient-to-br from-[#F7F3F0] to-[#E8D5D1] rounded-2xl shadow-lg border-2 border-[#AF524D]/20 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[#AF524D]/40 group cursor-pointer"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-6">
                                                {order.CAKE && (
                                                    <div className="relative">
                                                        <img
                                                            src={order.CAKE.publicUrl || "/saved-cake.png"}
                                                            alt={order.CAKE.name}
                                                            className="w-20 h-20 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        {order.order_type === 'custom' && (
                                                            <div className="absolute -top-2 -right-2 bg-[#AF524D] text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                                                                Custom
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                                                            Ready
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-bold text-[#381914] mb-2">
                                                                {order.CAKE ? order.CAKE.name : 'Cake'}
                                                            </h3>
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                    </svg>
                                                                    <span className="text-gray-600">Order #{order.order_id}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                                                                    </svg>
                                                                    <span className="text-gray-600">Qty: {order.quantity}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="text-gray-600">{new Date(order.order_schedule).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="text-gray-600 capitalize">{order.delivery_method}</span>
                                                                </div>
                                                            </div>
                                                            {order.payment && (
                                                                <div className="mt-3 flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                    </svg>
                                                                    <span className="text-sm text-gray-600">Payment: </span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.payment.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                                        order.payment.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        {order.payment.payment_status}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="bg-[#AF524D]/10 rounded-xl p-4 mb-3">
                                                                <p className="text-2xl font-bold text-[#AF524D]">
                                                                    ₱{order.total_price.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                                                                {order.order_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="flex items-center gap-2 text-[#AF524D] font-semibold">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Click to show QR code for pickup</span>
                                                        </div>
                                                        {canCancelOrder(order.order_schedule) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openCancelModal(order);
                                                                }}
                                                                disabled={cancellingOrder}
                                                                className={`py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${cancellingOrder
                                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                                                                    }`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Completed Tab */}
                {activeTab === 'completed' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-[#381914] mb-6">Delivered Orders</h2>

                        {orders.filter(order => order.order_status === 'Delivered').length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No delivered orders</h3>
                                <p className="text-gray-500">Your delivered orders will appear here</p>
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-[#AF524D]/30 scrollbar-track-gray-100 hover:scrollbar-thumb-[#AF524D]/50">
                                {orders.filter(order => order.order_status === 'Delivered').map((order) => (
                                    <div key={order.order_id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            {order.CAKE && (
                                                <img
                                                    src={order.CAKE.publicUrl || "/saved-cake.png"}
                                                    alt={order.CAKE.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                    onError={(e) => {
                                                        e.target.src = "/saved-cake.png";
                                                    }}
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-[#381914]">
                                                            {order.CAKE ? order.CAKE.name : 'Cake'}
                                                            {order.order_type === 'custom' && (
                                                                <span className="ml-2 inline-block px-2 py-1 bg-[#AF524D] text-white text-xs rounded-full">
                                                                    Custom
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_schedule).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Method: {order.delivery_method}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Status: {order.order_status}
                                                        </p>
                                                        {order.payment && (
                                                            <p className="text-sm text-gray-600">
                                                                Payment: {order.payment.payment_status}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-[#381914]">
                                                            ₱{order.total_price}
                                                        </p>
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                            {order.order_status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Cancelled Tab */}
                {activeTab === 'cancelled' && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-[#381914] mb-6">Cancelled Orders</h2>

                        {orders.filter(order => order.order_status === 'Cancelled').length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No cancelled orders</h3>
                                <p className="text-gray-500">Your cancelled orders will appear here</p>
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-[#AF524D]/30 scrollbar-track-gray-100 hover:scrollbar-thumb-[#AF524D]/50">
                                {orders.filter(order => order.order_status === 'Cancelled').map((order) => (
                                    <div key={order.order_id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            {order.CAKE && (
                                                <img
                                                    src={order.CAKE.publicUrl || "/saved-cake.png"}
                                                    alt={order.CAKE.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                    onError={(e) => {
                                                        e.target.src = "/saved-cake.png";
                                                    }}
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-[#381914]">
                                                            {order.CAKE ? order.CAKE.name : 'Cake'}
                                                            {order.order_type === 'custom' && (
                                                                <span className="ml-2 inline-block px-2 py-1 bg-[#AF524D] text-white text-xs rounded-full">
                                                                    Custom
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_schedule).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Method: {order.delivery_method}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Status: {order.order_status}
                                                        </p>
                                                        {order.payment && (
                                                            <p className="text-sm text-gray-600">
                                                                Payment: {order.payment.payment_status}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-[#381914]">
                                                            ₱{order.total_price}
                                                        </p>
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                            {order.order_status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Payment Modal */}
            {/* {
                showPaymentModal && selectedOrder && (
                    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-[#381914]">Upload Receipt</h3>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedOrder(null);
                                        setReceiptFile(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-gray-600 mb-2">Order Details:</p>
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Order ID:</span> {selectedOrder.order_id}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Item:</span> {selectedOrder.CAKE ? selectedOrder.CAKE.name : 'Cake'}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Total Amount:</span> ₱{selectedOrder.total_price}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Minimum Payment (50%):</span> ₱{(selectedOrder.total_price * 0.5).toFixed(2)}
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-blue-800 mb-1">Payment Instructions</p>
                                            <p className="text-xs text-blue-700">
                                                Please pay at least <span className="font-semibold">₱{(selectedOrder.total_price * 0.5).toFixed(2)}</span> to confirm your order.
                                                The remaining balance of <span className="font-semibold">₱{(selectedOrder.total_price * 0.5).toFixed(2)}</span> can be paid upon pickup or delivery.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Receipt Image
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#AF524D] transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="receipt-upload"
                                    />
                                    <label htmlFor="receipt-upload" className="cursor-pointer">
                                        {receiptFile ? (
                                            <div>
                                                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-sm text-gray-600">{receiptFile.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                                </svg>
                                                <p className="text-sm text-gray-600">Click to upload receipt</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedOrder(null);
                                        setReceiptFile(null);
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                {/* <button
                                    onClick={uploadReceipt}
                                    disabled={!receiptFile || uploading}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${!receiptFile || uploading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Receipt'}
                                </button> */}
            {/* </div>
                        </div>
                    </div>
                )
            } */}

            {/* Cancel Order Reason Modal */}
            {showReasonModal && orderToCancel && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#381914] mb-2">Cancel Order</h3>
                            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Order ID:</span> #{orderToCancel.order_id}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Item:</span> {orderToCancel.CAKE ? orderToCancel.CAKE.name : 'Cake'}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Total Amount:</span> ₱{orderToCancel.total_price.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Order Date:</span> {new Date(orderToCancel.order_date).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                    Please provide a reason for cancellation *
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Please explain why you need to cancel this order..."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {cancelReason.length}/500 characters
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 mb-1">Important Notice</p>
                                        <p className="text-xs text-amber-700">
                                            This cancellation reason will be sent to the bakery admin. Any payments made will be refunded.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowReasonModal(false);
                                        setOrderToCancel(null);
                                        setCancelReason('');
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Keep Order
                                </button>
                                <button
                                    onClick={cancelOrder}
                                    disabled={cancellingOrder || !cancelReason.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${cancellingOrder || !cancelReason.trim()
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                >
                                    {cancellingOrder ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedOrderForQR && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#AF524D]/10 mb-4">
                                <svg className="h-8 w-8 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#381914] mb-2">Pickup QR Code</h3>
                            <p className="text-gray-600 mb-6">Show this QR code to the admin for order pickup</p>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Order ID:</span> #{selectedOrderForQR.order_id}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Item:</span> {selectedOrderForQR.CAKE ? selectedOrderForQR.CAKE.name : 'Cake'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Total:</span> ₱{selectedOrderForQR.total_price.toLocaleString()}
                                </p>
                            </div>

                            {qrCodeDataURL ? (
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white p-4 rounded-xl shadow-lg">
                                        <img
                                            src={qrCodeDataURL}
                                            alt="QR Code for order pickup"
                                            className="w-40 h-40 sm:w-48 sm:h-48"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center mb-6">
                                    <div className="bg-gray-100 p-6 sm:p-8 rounded-xl">
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-sm text-gray-500 mt-2">Generating QR code...</p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-blue-800 mb-1">Instructions</p>
                                        <p className="text-xs text-blue-700">
                                            Present this QR code to the bakery staff. They will scan it to mark your order as delivered.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 mb-1">Security Notice</p>
                                        <p className="text-xs text-amber-700">
                                            This QR code is unique and expires in 24 hours. Do not share screenshots or copies with others.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    setSelectedOrderForQR(null);
                                    setQrCodeDataURL('');
                                }}
                                className="w-full py-3 px-4 bg-[#AF524D] text-white rounded-xl font-semibold hover:bg-[#8B3D3A] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Cart;
