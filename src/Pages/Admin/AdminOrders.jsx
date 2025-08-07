import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);

    // Helper function to get public image URL
    const getPublicImageUrl = (path) => {
        if (!path) return null;
        return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
    };

    // Fetch all orders with customer and cake details
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ORDER')
                .select(`
          *,
          CUSTOMER (
            cus_id,
            cus_fname,
            cus_lname,
            email,
            cus_celno
          ),
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
                .order('order_date', { ascending: false });

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
                            customer: order.CUSTOMER,
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

    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('ORDER')
                .update({ order_status: newStatus })
                .eq('order_id', orderId);

            if (error) {
                console.error('Error updating order status:', error);
                toast.error('Failed to update order status');
                return;
            }

            toast.success(`Order ${newStatus.toLowerCase()} successfully`);

            // Refresh orders
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        } finally {
            setUpdatingOrder(null);
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
    }, []);

    if (loading) {
        return <LoadingSpinner message="Loading orders..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4] py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">Order Management</h1>
                    <p className="text-[#381914] opacity-80">Review and manage customer orders</p>
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-[#381914] mb-6">All Orders ({orders.length})</h2>

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
                            <p className="text-gray-500">Orders will appear here when customers place them</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div key={`${order.order_id}-${order.cake_id}`} className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-start gap-6">
                                        {/* Cake Image */}
                                        {order.CAKE && (
                                            <img
                                                src={order.CAKE.publicUrl || "/saved-cake.png"}
                                                alt={order.CAKE.name}
                                                className="w-24 h-24 object-cover rounded-lg"
                                                onError={(e) => {
                                                    e.target.src = "/saved-cake.png";
                                                }}
                                            />
                                        )}

                                        {/* Order Details */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-[#381914] mb-2">
                                                        {order.CAKE ? order.CAKE.name : 'Cake'}
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-600">Order ID: <span className="font-medium">{order.order_id}</span></p>
                                                            <p className="text-gray-600">Customer: <span className="font-medium">{order.customer?.cus_fname} {order.customer?.cus_lname}</span></p>
                                                            <p className="text-gray-600">Email: <span className="font-medium">{order.customer?.email}</span></p>
                                                            <p className="text-gray-600">Phone: <span className="font-medium">{order.customer?.cus_celno}</span></p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Quantity: <span className="font-medium">{order.quantity}</span></p>
                                                            <p className="text-gray-600">Date: <span className="font-medium">{new Date(order.order_date).toLocaleDateString()}</span></p>
                                                            <p className="text-gray-600">Method: <span className="font-medium">{order.delivery_method}</span></p>
                                                            <p className="text-gray-600">Schedule: <span className="font-medium">{new Date(order.order_schedule).toLocaleDateString()}</span></p>
                                                        </div>
                                                    </div>
                                                    {order.delivery_address && (
                                                        <p className="text-gray-600 mt-2">
                                                            Address: <span className="font-medium">{order.delivery_address}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-[#381914] mb-2">
                                                        ₱{order.total_price}
                                                    </p>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                                                        {order.order_status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            {order.order_status === 'Pending' && (
                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        onClick={() => updateOrderStatus(order.order_id, 'Approved')}
                                                        disabled={updatingOrder === order.order_id}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {updatingOrder === order.order_id ? 'Updating...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => updateOrderStatus(order.order_id, 'Cancelled')}
                                                        disabled={updatingOrder === order.order_id}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {updatingOrder === order.order_id ? 'Updating...' : 'Cancel'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrders; 