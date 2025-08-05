import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserAuth } from '../../context/AuthContext';

const Cart = () => {
    const { session } = UserAuth();
    const [activeTab, setActiveTab] = useState('toPay'); // 'toPay', 'toReceive', 'completed', or 'cancelled'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderLoading, setOrderLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Helper function to get public image URL
    const getPublicImageUrl = (path) => {
        if (!path) return null;
        return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
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
                     PAYMENT (
                         payment_id,
                         payment_method,
                         amount_paid,
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
                            CAKE: cakeOrder.CAKE ? {
                                ...cakeOrder.CAKE,
                                publicUrl: getPublicImageUrl(cakeOrder.CAKE.cake_img)
                            } : null,
                            payment: order.PAYMENT?.[0] || null,
                            total_price: cakeOrder.CAKE ? cakeOrder.CAKE.price * cakeOrder.quantity : 0
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
    const openPaymentModal = (order) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
        setReceiptFile(null);
    };

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setReceiptFile(file);
        }
    };

    // Upload receipt and update payment
    const uploadReceipt = async () => {
        if (!receiptFile) {
            toast.error('Please select a receipt image');
            return;
        }

        if (!selectedOrder) {
            toast.error('No order selected');
            return;
        }

        setUploading(true);
        try {
            // Upload file to Supabase Storage
            const fileName = `receipts/${selectedOrder.order_id}_${Date.now()}.${receiptFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, receiptFile);

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                toast.error('Failed to upload receipt');
                return;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);

            // Update payment record with receipt URL
            const { error: updateError } = await supabase
                .from('PAYMENT')
                .update({
                    receipt: urlData.publicUrl,
                    payment_status: 'Paid',
                    payment_date: new Date().toISOString().split('T')[0]
                })
                .eq('order_id', selectedOrder.order_id);

            if (updateError) {
                console.error('Error updating payment:', updateError);
                toast.error('Failed to update payment status');
                return;
            }

            toast.success('Receipt uploaded successfully!');
            setShowPaymentModal(false);
            setSelectedOrder(null);
            setReceiptFile(null);

            // Refresh orders
            fetchOrders();
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setUploading(false);
        }
    };



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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No pending orders</h3>
                                <p className="text-gray-500">Your pending orders will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.filter(order => order.order_status === 'Pending').map((order) => (
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
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_date).toLocaleDateString()}
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
                                                <div className="flex justify-end mt-4">
                                                    <button
                                                        onClick={() => openPaymentModal(order)}
                                                        disabled={orderLoading}
                                                        className={`py-2 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${orderLoading
                                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                            : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A] shadow-md hover:shadow-lg transform hover:scale-105'
                                                            }`}
                                                    >
                                                        Pay Now
                                                    </button>
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
                                <p className="text-gray-500">Your approved and paid orders will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.filter(order => order.order_status === 'Approved').map((order) => (
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
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_date).toLocaleDateString()}
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
                            <div className="space-y-4">
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
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_date).toLocaleDateString()}
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
                            <div className="space-y-4">
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
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            Order ID: {order.order_id}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {order.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Date: {new Date(order.order_date).toLocaleDateString()}
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
            {
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
                                <button
                                    onClick={uploadReceipt}
                                    disabled={!receiptFile || uploading}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${!receiptFile || uploading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Receipt'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Cart;
