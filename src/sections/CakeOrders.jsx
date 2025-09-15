import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { inventoryManagement } from './Inventory';

const getPublicImageUrl = (path, type = 'cake', isCustomCake = false) => {
  if (!path) return null;

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Determine the correct bucket based on image type
  const bucketName = isCustomCake ? 'cust.cakes' : type;

  // If it's a file path, generate the public URL from the appropriate bucket
  return supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
};

const CakeOrders = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReceiptViewModal, setShowReceiptViewModal] = useState(false);
  const [showCakeImageModal, setShowCakeImageModal] = useState(false);
  const [selectedCakeImage, setSelectedCakeImage] = useState(null);
  const [selectedCakeName, setSelectedCakeName] = useState('');
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [selectedReceiptRow, setSelectedReceiptRow] = useState(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState('all'); // 'all', 'customer', 'cake', 'status'
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingReceiptFiles, setPendingReceiptFiles] = useState({});

  // Helper function to check if an order is new (not edited yet - still in Pending status)
  const isNewOrder = (orderStatus) => {
    return orderStatus === 'Pending';
  };

  const [editFormData, setEditFormData] = useState({
    cake_name: '',
    theme: '',
    tier: 1,
    order_schedule: '',
    delivery_method: '',
    delivery_address: '',
    order_status: '',
    quantity: 1,
    payment_method: '',
    amount_paid: '',
    payment_status: '',
    payment_date: ''
  });

  // Fetch existing orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Set up real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('cake-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ORDER'
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          if (payload.eventType === 'INSERT') {
            // New order added
            handleNewOrder(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            // Order updated
            handleOrderUpdate(payload.new);
          } else if (payload.eventType === 'DELETE') {
            // Order deleted
            handleOrderDelete(payload.old);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter orders when search term or filters change
  useEffect(() => {
    filterOrders();
  }, [rows, searchTerm, searchType, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Join ORDER, CAKE-ORDERS, CAKE, CUSTOMER, and PAYMENT tables to get complete order information
      const { data, error } = await supabase
        .from('ORDER')
        .select(`
          *,
          CUSTOMER!inner(
            cus_id,
            cus_fname,
            cus_lname,
            cus_celno,
            email
          ),
          CAKE-ORDERS(
            co_id,
            quantity,
            cake_id,
            CAKE(
              cake_id,
              theme,
              tier,
              name,
              description,
              price,
              cake_img
            )
          ),
          CUSTOM-CAKE(
            cc_id,
            cc_img,
            order_id,
            cus_id
          ),
          PAYMENT(
            payment_id,
            payment_method,
            amount_paid,
            total,
            payment_date,
            payment_status,
            receipt
          )
        `)
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      } else {
        // Transform the data to match our component structure
        const transformedData = data?.map(order => {
          const transformed = transformOrderData(order);
          // Add additional fields that were in the original transformation
          return {
            ...transformed,
            receipt_url: transformed.receipt,
            payment_id: order.PAYMENT?.[0]?.payment_id || null
          };
        }) || [];

        setRows(transformedData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = rows;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        switch (searchType) {
          case 'customer':
            return order.customer?.toLowerCase().includes(searchLower) ||
              order.phone?.toLowerCase().includes(searchLower) ||
              order.email?.toLowerCase().includes(searchLower) ||
              order.customer_fname?.toLowerCase().includes(searchLower) ||
              order.customer_lname?.toLowerCase().includes(searchLower);
          case 'cake':
            return order.cake_name?.toLowerCase().includes(searchLower) ||
              order.theme?.toLowerCase().includes(searchLower);
          case 'status':
            return order.order_status?.toLowerCase().includes(searchLower) ||
              order.delivery_method?.toLowerCase().includes(searchLower);
          case 'all':
          default:
            return order.customer?.toLowerCase().includes(searchLower) ||
              order.customer_fname?.toLowerCase().includes(searchLower) ||
              order.customer_lname?.toLowerCase().includes(searchLower) ||
              order.phone?.toLowerCase().includes(searchLower) ||
              order.email?.toLowerCase().includes(searchLower) ||
              order.cake_name?.toLowerCase().includes(searchLower) ||
              order.theme?.toLowerCase().includes(searchLower) ||
              order.order_status?.toLowerCase().includes(searchLower) ||
              order.delivery_method?.toLowerCase().includes(searchLower);
        }
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order =>
        order.order_status?.toLowerCase().includes(statusFilter.toLowerCase()) ||
        order.delivery_method?.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    setFilteredRows(filtered);
  };

  // Real-time update handlers
  const handleNewOrder = async (newOrderData) => {
    try {
      // Fetch the complete order data with all related information
      const { data: completeOrder, error } = await supabase
        .from('ORDER')
        .select(`
          *,
          CUSTOMER!inner(
            cus_id,
            cus_fname,
            cus_lname,
            cus_celno,
            email
          ),
          CAKE-ORDERS(
            co_id,
            quantity,
            cake_id,
            CAKE(
              cake_id,
              theme,
              tier,
              name,
              description,
              price,
              cake_img
            )
          ),
          CUSTOM-CAKE(
            cc_id,
            cc_img,
            order_id,
            cus_id
          ),
          PAYMENT(
            payment_id,
            amount_paid,
            total,
            payment_date,
            payment_status,
            receipt
          )
        `)
        .eq('order_id', newOrderData.order_id)
        .single();

      if (error) {
        console.error('Error fetching complete order data:', error);
        return;
      }

      // Transform the data to match our component structure
      const transformedOrder = transformOrderData(completeOrder);

      // Add the new order to the beginning of the list
      setRows(prevRows => [transformedOrder, ...prevRows]);

      // Show notification
      toast.success(`New order received from ${transformedOrder.customer}!`, {
        duration: 4000,
        icon: '🎂',
      });
    } catch (error) {
      console.error('Error handling new order:', error);
    }
  };

  const handleOrderUpdate = async (updatedOrderData) => {
    try {
      // Fetch the complete updated order data
      const { data: completeOrder, error } = await supabase
        .from('ORDER')
        .select(`
          *,
          CUSTOMER!inner(
            cus_id,
            cus_fname,
            cus_lname,
            cus_celno,
            email
          ),
          CAKE-ORDERS(
            co_id,
            quantity,
            cake_id,
            CAKE(
              cake_id,
              theme,
              tier,
              name,
              description,
              price,
              cake_img
            )
          ),
          CUSTOM-CAKE(
            cc_id,
            cc_img,
            order_id,
            cus_id
          ),
          PAYMENT(
            payment_id,
            amount_paid,
            total,
            payment_date,
            payment_status,
            receipt
          )
        `)
        .eq('order_id', updatedOrderData.order_id)
        .single();

      if (error) {
        console.error('Error fetching updated order data:', error);
        return;
      }

      // Transform the data
      const transformedOrder = transformOrderData(completeOrder);

      // Update the order in the list
      setRows(prevRows =>
        prevRows.map(order =>
          order.order_id === updatedOrderData.order_id ? transformedOrder : order
        )
      );

      // Show notification
      toast.success(`Order #${updatedOrderData.order_id} has been updated!`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error handling order update:', error);
    }
  };


  // Helper function to transform order data (extracted from fetchOrders)
  const transformOrderData = (order) => {
    const customer = order.CUSTOMER;
    const cakeOrder = order['CAKE-ORDERS']?.[0]; // Get first cake order
    const customCake = order['CUSTOM-CAKE']?.[0]; // Get custom cake order
    const cake = cakeOrder?.CAKE;
    const payment = order.PAYMENT?.[0]; // Get first payment (assuming one payment per order)

    // Determine if this is a custom cake order
    const isCustomCake = customCake && !cakeOrder;

    return {
      order_id: order.order_id,
      order_date: order.order_date,
      delivery_method: order.delivery_method,
      order_schedule: order.order_schedule,
      delivery_address: order.delivery_address,
      order_status: order.order_status,
      cus_id: order.cus_id,
      // Customer information
      customer_fname: customer?.cus_fname || '',
      customer_lname: customer?.cus_lname || '',
      customer_phone: customer?.cus_celno || '',
      customer_email: customer?.email || '',
      // Cake information
      cake_id: cake?.cake_id || null,
      cake_name: isCustomCake ? 'Custom Cake' : (cake?.name || 'Custom Cake'),
      theme: isCustomCake ? 'Custom' : (cake?.theme || 'Custom'),
      tier: isCustomCake ? 'Custom' : (cake?.tier || 1),
      description: isCustomCake ? 'Custom designed cake' : (cake?.description || 'Custom designed cake'),
      price: isCustomCake ? 'P1,500' : (cake?.price || 'P1,500'),
      cake_img: isCustomCake ? customCake?.cc_img : (cake?.cake_img || null),
      // Order details
      quantity: cakeOrder?.quantity || 1,
      // Map to expected field names for compatibility
      customer: `${customer?.cus_fname || ''} ${customer?.cus_lname || ''}`.trim() || `Customer ${order.cus_id}`,
      phone: customer?.cus_celno || '',
      email: customer?.email || '',
      scheduled_date: order.order_schedule,
      order_type: order.delivery_method,
      // Payment information
      amount_paid: payment?.amount_paid ?? 0,
      total: payment?.total ?? cake?.price ?? 0,
      payment_method: payment?.payment_method || 'Cash',
      payment_status: payment?.payment_status || 'Unpaid',
      payment_date: payment?.payment_date ? (() => {
        // Format date for date input field (YYYY-MM-DD)
        const date = new Date(payment.payment_date);
        return date.toISOString().split('T')[0];
      })() : (order.order_date ? (() => {
        const date = new Date(order.order_date);
        return date.toISOString().split('T')[0];
      })() : ''),
      // Receipt information
      receipt: payment?.receipt || null,
      receipt_url: payment?.receipt || null,
      payment_id: payment?.payment_id || null
    };
  };

  const handleEditOrder = (order) => {
    setOrderToEdit(order);
    setEditFormData({
      cake_name: order.cake_name || '',
      theme: order.theme || '',
      tier: order.tier || 1,
      order_schedule: order.order_schedule || '',
      delivery_method: order.delivery_method || '',
      delivery_address: order.delivery_address || '',
      order_status: order.order_status || '',
      quantity: order.quantity || 1,
      payment_method: order.payment_method || '',
      amount_paid: order.amount_paid || '',
      payment_status: order.payment_status || '',
      payment_date: order.payment_date || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!editFormData.cake_name || !editFormData.order_schedule) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate delivery address if delivery method is "Delivery"
    if (editFormData.delivery_method === 'Delivery' && !editFormData.delivery_address?.trim()) {
      toast.error('Please enter a delivery address for delivery orders');
      return;
    }

    try {
      setSaving(true);
      await updateOrder(orderToEdit.order_id, editFormData);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (orderId, order) => {
    try {
      // Update ORDER table
      const orderUpdateData = {
        delivery_method: order.delivery_method,
        order_schedule: order.order_schedule,
        delivery_address: order.delivery_address,
        order_status: order.order_status
      };

      const { error: orderUpdateError } = await supabase
        .from('ORDER')
        .update(orderUpdateData)
        .eq('order_id', orderId);

      if (orderUpdateError) {
        console.error("Order update error:", orderUpdateError);
        toast.error('Failed to update order');
        return;
      }

      // Update CAKE table if cake information changed
      if (orderToEdit.cake_id) {
        const cakeUpdateData = {
          name: order.cake_name,
          theme: order.theme,
          tier: parseInt(order.tier) || 1
        };

        const { error: cakeUpdateError } = await supabase
          .from('CAKE')
          .update(cakeUpdateData)
          .eq('cake_id', orderToEdit.cake_id);

        if (cakeUpdateError) {
          console.error("Cake update error:", cakeUpdateError);
          toast.error('Failed to update cake information');
          return;
        }
      }

      // Update CAKE-ORDERS table for quantity
      const { error: cakeOrderUpdateError } = await supabase
        .from('CAKE-ORDERS')
        .update({ quantity: parseInt(order.quantity) || 1 })
        .eq('order_id', orderId);

      if (cakeOrderUpdateError) {
        console.error("Cake order update error:", cakeOrderUpdateError);
        toast.error('Failed to update order quantity');
        return;
      }

      // Update or create PAYMENT record
      if (order.payment_method || order.amount_paid || order.payment_status || order.payment_date) {
        // Check if payment record exists and get previous payment status
        const { data: existingPayment, error: fetchError } = await supabase
          .from('PAYMENT')
          .select('payment_id, payment_status')
          .eq('order_id', orderId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error checking existing payment:', fetchError);
          toast.error('Failed to check existing payment');
          return;
        }

        const previousPaymentStatus = existingPayment?.payment_status || 'Unpaid';
        const newPaymentStatus = order.payment_status || previousPaymentStatus;

        const paymentData = {};
        if (order.payment_method) paymentData.payment_method = order.payment_method;
        if (order.amount_paid) paymentData.amount_paid = order.amount_paid;
        if (order.payment_status) paymentData.payment_status = order.payment_status;
        if (order.payment_date) paymentData.payment_date = order.payment_date;

        if (existingPayment) {
          // Update existing payment record
          const { error: paymentError } = await supabase
            .from('PAYMENT')
            .update(paymentData)
            .eq('payment_id', existingPayment.payment_id);

          if (paymentError) {
            console.error('Error updating payment:', paymentError);
            toast.error('Failed to update payment');
            return;
          }
        } else {
          // Create new payment record
          const { error: paymentError } = await supabase
            .from('PAYMENT')
            .insert({
              ...paymentData,
              order_id: orderId
            });

          if (paymentError) {
            console.error('Error creating payment:', paymentError);
            toast.error('Failed to create payment');
            return;
          }
        }

        // Handle inventory deduction based on payment status change
        if (order.payment_status && order.payment_status !== previousPaymentStatus) {
          // Check if this is a custom cake order
          const { data: customCakeData, error: customCakeError } = await supabase
            .from('CUSTOM-CAKE')
            .select('cc_id')
            .eq('order_id', orderId);

          if (customCakeData && customCakeData.length > 0) {
            // This is a custom cake order - use custom cake inventory management
            await inventoryManagement.deductInventoryForCustomCakeOrder(orderId, previousPaymentStatus, newPaymentStatus);
            await inventoryManagement.restockInventoryForCustomCakeOrder(orderId, previousPaymentStatus, newPaymentStatus);
          } else {
            // This is a regular cake order - use regular inventory management
            await inventoryManagement.deductInventoryForOrder(orderId, previousPaymentStatus, newPaymentStatus);
          }

          // Auto-approve order if payment status is Partial Payment or Fully Paid
          if (newPaymentStatus === 'Partial Payment' || newPaymentStatus === 'Fully Paid') {
            const { error: orderStatusError } = await supabase
              .from('ORDER')
              .update({ order_status: 'Approved' })
              .eq('order_id', orderId);

            if (orderStatusError) {
              console.error('Error updating order status to Approved:', orderStatusError);
              toast.error('Failed to update order status');
            } else {
              console.log(`Order ${orderId} automatically approved due to payment status: ${newPaymentStatus}`);
            }
          }
        }
      }

      toast.success('Order updated successfully');
      setShowEditModal(false);
      setOrderToEdit(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };


  const cancelEdit = () => {
    setShowEditModal(false);
    setOrderToEdit(null);
    setEditFormData({
      cake_name: '', theme: '', tier: 1,
      order_schedule: '', delivery_method: '', delivery_address: '',
      order_status: '', quantity: 1
    });
  };

  const handleCakeImageClick = (order) => {
    if (order.cake_img) {
      setSelectedCakeImage({
        path: order.cake_img,
        isCustomCake: order.cake_name === 'Custom Cake'
      });
      setSelectedCakeName(order.cake_name);
      setShowCakeImageModal(true);
    } else {
      toast.error('No image available for this cake');
    }
  };

  const closeCakeImageModal = () => {
    setShowCakeImageModal(false);
    setSelectedCakeImage(null);
    setSelectedCakeName('');
  };

  const formatPrice = (price) => {
    if (!price) return '₱0.00';
    // Remove any existing currency symbols and clean the price
    const cleanPrice = String(price).replace(/[P₱,]/g, '').trim();
    const numericPrice = parseFloat(cleanPrice) || 0;
    return `₱${numericPrice.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const uploadReceiptToDatabase = async (orderId, file) => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `receipt_${orderId}_${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

      // Check if payment record exists for this order
      const { data: existingPayment, error: fetchError } = await supabase
        .from('PAYMENT')
        .select('payment_id')
        .eq('order_id', orderId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing payment:', fetchError);
        throw new Error('Failed to check existing payment');
      }

      if (existingPayment) {
        // Update existing payment record
        const { error: updateError } = await supabase
          .from('PAYMENT')
          .update({ receipt: fileName })
          .eq('payment_id', existingPayment.payment_id);

        if (updateError) {
          console.error('Payment update error:', updateError);
          await supabase.storage.from('receipts').remove([fileName]);
          throw new Error('Failed to update payment with receipt');
        }
      } else {
        // Create new payment record
        const { error: insertError } = await supabase
          .from('PAYMENT')
          .insert({
            payment_method: 'Cash',
            amount_paid: 'P0', // Will be updated when payment details are known
            payment_date: new Date().toISOString().split('T')[0],
            payment_status: 'Pending',
            receipt: fileName,
            order_id: orderId
          });

        if (insertError) {
          console.error('Payment insert error:', insertError);
          await supabase.storage.from('receipts').remove([fileName]);
          throw new Error('Failed to create payment record');
        }
      }

      toast.success('Receipt uploaded successfully');

      // Refresh orders to show updated receipt
      fetchOrders();

    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  };

  // Get unique statuses for filter options
  const uniqueStatuses = [...new Set([
    ...rows.map(row => row.order_status).filter(Boolean),
    ...rows.map(row => row.delivery_method).filter(Boolean)
  ])];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Cake Orders Management</h1>
          <p className="text-gray-600">Manage customer orders and payments</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
              />
            </div>
          </div>

          {/* Search Type Filter */}
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
            >
              <option value="all">All Fields</option>
              <option value="customer">Customer Only</option>
              <option value="cake">Cake Only</option>
              <option value="status">Status Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Cake</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Order Details</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Payment</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Receipt</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AF524D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <p className="text-gray-600 text-lg">
                      {searchTerm || statusFilter ? 'No matching orders found' : 'No orders available'}
                    </p>
                    <p className="text-sm">
                      {searchTerm || statusFilter ? 'Try adjusting your search terms' : 'Orders will appear here when customers place them'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((order) => (
                  <tr key={order.order_id} className={`hover:bg-gray-100 transition-colors duration-200 ${isNewOrder(order.order_status) ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                    {/* Customer Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {order.customer}
                          </h4>
                          {isNewOrder(order.order_status) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{order.phone}</p>
                        <p className="text-sm text-gray-600">{order.email}</p>
                        <p className="text-sm text-gray-600">Order Date: {formatDate(order.order_date)}</p>
                      </div>
                    </td>

                    {/* Cake Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <h4
                          className={`font-semibold text-base ${order.cake_img ? 'text-[#AF524D] hover:text-[#8B3A3A] cursor-pointer transition-colors duration-200' : 'text-gray-900'}`}
                          onClick={() => order.cake_img && handleCakeImageClick(order)}
                          title={order.cake_img ? 'Click to view cake image' : 'No image available'}
                        >
                          {order.cake_name}
                          {order.cake_img && (
                            <span className="ml-2 text-xs">🖼️</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#AF524D]/10 text-[#AF524D]">
                            {order.theme}
                          </span>
                          <span className="text-sm text-gray-600">{order.tier} Tier{order.tier > 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-sm text-gray-600">Qty: {order.quantity}</p>
                      </div>
                    </td>

                    {/* Order Details Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {order.delivery_method}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Scheduled:</span> {formatDateTime(order.order_schedule)}
                        </p>
                        {order.delivery_address && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Address:</span> {order.delivery_address}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> {order.order_status}
                        </p>
                      </div>
                    </td>

                    {/* Payment Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(order.total || order.amount_paid)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Paid: {formatPrice(order.amount_paid)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.payment_status === 'Fully Paid'
                            ? 'bg-green-100 text-green-700'
                            : order.payment_status === 'Partial Payment'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.payment_status === 'Unpaid'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{order.payment_method}</p>
                        {order.payment_date && (
                          <p className="text-sm text-gray-600">{formatDate(order.payment_date)}</p>
                        )}
                      </div>
                    </td>

                    {/* Receipt Column */}
                    <td className="py-6 px-6 align-middle">
                      {order.receipt_url ? (
                        <div
                          className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 bg-green-50 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors"
                          onClick={() => {
                            setSelectedReceiptForView(order);
                            setShowReceiptViewModal(true);
                          }}
                          title="Click to view receipt"
                        >
                          <img
                            src={getPublicImageUrl(order.receipt_url, 'receipts')}
                            alt="Receipt"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-6 px-6 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          disabled={saving}
                          title="Edit order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReceiptRow(order.order_id);
                            setShowReceiptModal(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${saving
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          disabled={saving}
                          title={saving ? "Uploading..." : "Upload receipt"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && orderToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl border-2 border-blue-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">Edit Order</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cake Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Cake Information</h4>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cake Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.cake_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, cake_name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    placeholder="Enter cake name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Theme
                  </label>
                  <input
                    type="text"
                    value={editFormData.theme}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    placeholder="Enter cake theme..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tier
                  </label>
                  <select
                    value={editFormData.tier}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, tier: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  >
                    <option value={1}>1 Tier</option>
                    <option value={2}>2 Tiers</option>
                    <option value={3}>3 Tiers</option>
                    <option value={4}>4 Tiers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    placeholder="Enter quantity..."
                    min="1"
                  />
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Order Details</h4>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Schedule *
                  </label>
                  <input
                    type="date"
                    value={editFormData.order_schedule}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, order_schedule: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Method
                  </label>
                  <select
                    value={editFormData.delivery_method}
                    onChange={(e) => {
                      const newDeliveryMethod = e.target.value;
                      setEditFormData(prev => ({
                        ...prev,
                        delivery_method: newDeliveryMethod,
                        // Clear delivery address when switching to pickup
                        delivery_address: newDeliveryMethod === 'Pickup' ? '' : prev.delivery_address
                      }));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  >
                    <option value="">Select delivery method</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>

                {editFormData.delivery_method === 'Delivery' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={editFormData.delivery_address}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 resize-none"
                      placeholder="Enter delivery address..."
                      rows={3}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={editFormData.order_status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, order_status: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  >
                    <option value="">Select order status</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Payment Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={editFormData.payment_method}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="BPI">BPI</option>
                      <option value="GCash">GCash</option>
                      <option value="PayMaya">PayMaya</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount Paid
                    </label>
                    <input
                      type="text"
                      value={editFormData.amount_paid}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                      placeholder="e.g., P2,500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={editFormData.payment_status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    >
                      <option value="">Select payment status</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial Payment">Partial Payment</option>
                      <option value="Fully Paid">Fully Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={editFormData.payment_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrder}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${saving
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Update Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Receipt Upload Modal */}
      {showReceiptModal && selectedReceiptRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#381914]">Upload Receipt</h3>
                <p className="text-gray-600 mt-1">Upload payment receipt for this order</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceiptRow(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Receipt File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#AF524D] transition-colors relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          setSaving(true);
                          await uploadReceiptToDatabase(selectedReceiptRow, file);
                          // Close modal after successful upload
                          setShowReceiptModal(false);
                          setSelectedReceiptRow(null);
                        } catch (error) {
                          console.error('Error uploading receipt:', error);
                          toast.error('Failed to upload receipt');
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-[#AF524D]">Click to upload</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedReceiptRow(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {showReceiptViewModal && selectedReceiptForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl border-2 border-[#AF524D] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#381914]">Payment Receipt</h3>
                <p className="text-gray-600 mt-1">Order #{selectedReceiptForView.order_id}</p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptViewModal(false);
                  setSelectedReceiptForView(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={getPublicImageUrl(selectedReceiptForView.receipt_url, 'receipts')}
                  alt="Payment Receipt"
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden mt-8 p-8 bg-gray-100 rounded-lg">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600">Failed to load receipt image</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowReceiptViewModal(false);
                    setSelectedReceiptForView(null);
                  }}
                  className="px-6 py-3 bg-[#AF524D] text-white rounded-xl hover:bg-[#8B3A3A] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cake Image Modal */}
      {showCakeImageModal && selectedCakeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border-2 border-[#AF524D]/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-[#381914]">
                {selectedCakeName}
              </h3>
              <button
                onClick={closeCakeImageModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={getPublicImageUrl(selectedCakeImage.path, 'cake', selectedCakeImage.isCustomCake)}
                  alt={selectedCakeName}
                  className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden mt-8 p-8 bg-gray-100 rounded-lg">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">Failed to load cake image</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeCakeImageModal}
                  className="px-6 py-2 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3A3A] transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CakeOrders;
