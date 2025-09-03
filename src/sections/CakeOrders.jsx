import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const getPublicImageUrl = (path) => {
  if (!path) return null;

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a file path, generate the public URL
  return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
};

const CakeOrders = () => {
  const [rows, setRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedCustomer, setEditedCustomer] = useState("");
  const [editedCake, setEditedCake] = useState("");
  const [editedScheduledDate, setEditedScheduledDate] = useState("");
  const [editedOrderType, setEditedOrderType] = useState("");
  const [editedDeliveryAddress, setEditedDeliveryAddress] = useState("");
  const [editedAmountPaid, setEditedAmountPaid] = useState("");
  const [editedPaymentMethod, setEditedPaymentMethod] = useState("");
  const [editedPaymentStatus, setEditedPaymentStatus] = useState("");
  const [editedPaymentDate, setEditedPaymentDate] = useState("");
  const [availableCakes, setAvailableCakes] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCakeModal, setShowCakeModal] = useState(false);
  const [selectedCakeForModal, setSelectedCakeForModal] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptRow, setSelectedReceiptRow] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Fetch existing orders with all related data
  useEffect(() => {
    const fetchData = async () => {
      // Try the main query
      const { data, error } = await supabase
        .from('ORDER')
        .select(`
          order_id,
          order_date,
          delivery_method,
          order_schedule,
          delivery_address,
          order_status,
          cus_id,
          CUSTOMER (
            cus_id,
            cus_fname,
            cus_lname,
            cus_celno,
            email
          ),
          PAYMENT (
            payment_id,
            payment_method,
            amount_paid,
            payment_date,
            payment_status,
            receipt
          ),
          "CAKE-ORDERS" (
            co_id,
            quantity,
            cake_id,
            CAKE (
              cake_id,
              name,
              cake_img,
              price,
              theme,
              tier,
              description
            )
          )
        `);

      console.log('Query result:', { data, error });

      // Debug: Check the raw data structure
      if (data && data.length > 0) {
        console.log('Raw database response - first order:', data[0]);
        console.log('Customer data from first order:', data[0].customer);
        console.log('Cake orders from first order:', data[0]["CAKE-ORDERS"]);

        // Test different relationship names
        console.log('Testing different customer relationship names:');
        console.log('data[0].CUSTOMER:', data[0].CUSTOMER);
        console.log('data[0].customer:', data[0].customer);
        console.log('data[0].Customer:', data[0].Customer);
        console.log('data[0].customers:', data[0].customers);
      }

      if (error) {
        console.error('Database error:', error);
      } else {
        // Flatten the data structure - each cake order becomes a row
        const mapped = data.flatMap((order) => {
          // If no cakes in the order, create a placeholder row
          if (!order["CAKE-ORDERS"] || order["CAKE-ORDERS"].length === 0) {
            return [{
              order_id: order.order_id,
              co_id: null,
              customer_id: order.cus_id,
              customer: order.CUSTOMER ? `${order.CUSTOMER.cus_fname} ${order.CUSTOMER.cus_lname}` : 'Unknown Customer',
              customer_email: order.CUSTOMER?.email || 'N/A',
              customer_phone: order.CUSTOMER?.cus_celno || 'N/A',
              cake: 'No Cake Assigned',
              cake_img: null,
              cake_img_url: null,
              cake_price: 0,
              cake_theme: 'N/A',
              cake_tier: 'N/A',
              cake_description: 'N/A',
              scheduled_date: order.order_schedule,
              order_type: order.delivery_method,
              delivery_address: order.delivery_address || 'N/A',
              cake_id: null,
              quantity: 0,
              amount_paid: order.PAYMENT?.[0]?.amount_paid || 0,
              payment_date: order.PAYMENT?.[0]?.payment_date,
              payment_status: order.PAYMENT?.[0]?.payment_status || 'Pending',
              payment_method: order.PAYMENT?.[0]?.payment_method || 'Cash',
              receipt_path: order.PAYMENT?.[0]?.receipt,
              order_status: order.order_status,
              order_date: order.order_date,
            }];
          }

          // Create a row for each cake in the order
          return order["CAKE-ORDERS"].map((cakeOrder) => ({
            order_id: order.order_id,
            co_id: cakeOrder.co_id,
            customer_id: order.cus_id,
            customer: order.CUSTOMER ? `${order.CUSTOMER.cus_fname} ${order.CUSTOMER.cus_lname}` : 'Unknown Customer',
            customer_email: order.CUSTOMER?.email || 'N/A',
            customer_phone: order.CUSTOMER?.cus_celno || 'N/A',
            cake: cakeOrder.CAKE?.name || 'Unknown Cake',
            cake_img: cakeOrder.CAKE?.cake_img,
            cake_img_url: getPublicImageUrl(cakeOrder.CAKE?.cake_img),
            cake_price: cakeOrder.CAKE?.price || 0,
            cake_theme: cakeOrder.CAKE?.theme || 'N/A',
            cake_tier: cakeOrder.CAKE?.tier || 'N/A',
            cake_description: cakeOrder.CAKE?.description || 'N/A',
            scheduled_date: order.order_schedule,
            order_type: order.delivery_method,
            delivery_address: order.delivery_address || 'N/A',
            cake_id: cakeOrder.cake_id,
            quantity: cakeOrder.quantity || 0,
            amount_paid: order.PAYMENT?.[0]?.amount_paid || 0,
            payment_date: order.PAYMENT?.[0]?.payment_date,
            payment_status: order.PAYMENT?.[0]?.payment_status || 'Pending',
            payment_method: order.PAYMENT?.[0]?.payment_method || 'Cash',
            receipt_path: order.PAYMENT?.[0]?.receipt,
            order_status: order.order_status,
            order_date: order.order_date,
          }));
        });
        // Debug: Check customer data mapping
        if (mapped.length > 0) {
          console.log('Customer info from first row:', {
            customer: mapped[0].customer,
            customer_id: mapped[0].customer_id,
            customer_email: mapped[0].customer_email,
            customer_phone: mapped[0].customer_phone
          });
        }

        setRows(mapped);
      }
    };

    fetchData();
  }, []);

  // Fetch available cakes for reference
  useEffect(() => {
    const fetchCakes = async () => {
      const { data, error } = await supabase
        .from('CAKE')
        .select('cake_id, name, cake_img, price, theme, tier, description')
        .order('name');

      if (error) {
        console.error("Error fetching cakes:", error);
      } else {
        setAvailableCakes(data || []);
        console.log("Available cakes:", data);
      }
    };

    fetchCakes();
  }, []);

  // Fetch available customers for reference
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('CUSTOMER')
        .select('cus_id, cus_fname, cus_lname, email, cus_celno')
        .order('cus_fname');

      if (error) {
        console.error("Error fetching customers:", error);
      } else {
        setAvailableCustomers(data || []);
        console.log("Available customers:", data);
      }
    };

    fetchCustomers();
  }, []);

  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    setNewRows([
      ...newRows,
      {
        order_id: newId,
        co_id: newId,
        customer_id: null,
        customer: "Select Customer",
        customer_email: "",
        customer_phone: "",
        cake: "Select Cake",
        cake_img: null,
        cake_img_url: null,
        cake_price: 0,
        cake_theme: "",
        cake_tier: "",
        cake_description: "",
        scheduled_date: new Date().toISOString().split("T")[0],
        order_type: "pickup",
        delivery_address: "Delivery Address",
        cake_id: null,
        quantity: 1,
        amount_paid: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_status: "Pending",
        payment_method: "Cash",
        receipt_path: null,
        order_status: "Pending",
        order_date: new Date().toISOString().split("T")[0],
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      // For new rows, just remove from local state
      console.log('🗑️ Deleting new order from local state:', selectedRowId);
      setNewRows(newRows.filter((row) => row.order_id !== selectedRowId));
      setSelectedRowId(null);
      toast.success("Order deleted successfully");
    } else {
      // For existing rows, delete from database and storage
      try {
        console.log('🗑️ Deleting existing order from database:', selectedRowId);

        // Find the row to get the receipt path for storage deletion
        const rowToDelete = rows.find(row => row.order_id === selectedRowId);

        // Delete from database first
        const { error: dbError } = await supabase
          .from('CAKE-ORDERS')
          .delete()
          .eq('order_id', selectedRowId);

        if (dbError) {
          console.error("❌ Database deletion error:", dbError);
          toast.error(`Failed to delete order: ${dbError.message}`);
          return;
        }

        console.log('✅ Order deleted from database successfully');

        // Delete the receipt from storage if it exists
        if (rowToDelete?.receipt_path) {
          try {
            console.log('🗑️ Attempting to delete receipt from storage:', rowToDelete.receipt_path);

            // Extract the file path from the receipt URL
            let filePath = rowToDelete.receipt_path;

            // If it's a full URL, extract just the path part
            if (rowToDelete.receipt_path.includes('/storage/v1/object/public/receipts/')) {
              filePath = rowToDelete.receipt_path.split('/storage/v1/object/public/receipts/')[1];
              console.log('📁 Extracted file path from URL:', filePath);
            } else if (rowToDelete.receipt_path.startsWith('http')) {
              // Handle other URL formats
              const urlParts = rowToDelete.receipt_path.split('/receipts/');
              if (urlParts.length > 1) {
                filePath = urlParts[1];
                console.log('📁 Extracted file path from alternative URL:', filePath);
              }
            }

            // Only attempt deletion if we have a valid file path
            if (filePath && filePath !== rowToDelete.receipt_path) {
              console.log('🗑️ Deleting receipt from storage bucket:', filePath);

              const { error: storageError } = await supabase.storage
                .from('receipts')
                .remove([filePath]);

              if (storageError) {
                console.warn("⚠️ Storage deletion warning:", storageError);
                // Don't fail the whole operation if storage deletion fails
              } else {
                console.log('✅ Receipt deleted from storage successfully');
              }
            } else {
              console.log('⚠️ Could not extract valid file path for storage deletion');
            }
          } catch (storageError) {
            console.warn("⚠️ Storage deletion error:", storageError);
            // Don't fail the whole operation if storage deletion fails
          }
        }

        // Remove from local state
        setRows(rows.filter((row) => row.order_id !== selectedRowId));
        setSelectedRowId(null);
        toast.success("Order deleted successfully");

      } catch (error) {
        console.error("❌ Unexpected error during deletion:", error);
        toast.error("Failed to delete order");
      }
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      // Save new rows
      for (const newRow of newRows) {
        // Find the cake_id based on cake name
        const cake = availableCakes.find(c => c.name === newRow.cake);
        const cake_id = cake ? cake.cake_id : null;

        // Find the customer_id based on customer name
        const customer = availableCustomers.find(c => `${c.cus_fname} ${c.cus_lname}` === newRow.customer);
        const customer_id = customer ? customer.cus_id : null;

        const { error } = await supabase
          .from('CAKE-ORDERS')
          .insert({
            customer_id: customer_id,
            cake_id: cake_id,
            scheduled_date: newRow.scheduled_date,
            order_type: newRow.order_type,
            delivery_address: newRow.delivery_address,
            amount_paid: parseFloat(newRow.amount_paid) || 0,
            payment_date: newRow.payment_date,
            payment_status: newRow.payment_status,
            payment_method: newRow.payment_method,
            receipt_path: newRow.receipt_path,
          });

        if (error) {
          console.error("Error inserting new order:", error);
          toast.error("Failed to save new order");
          setSaving(false);
          return;
        }
      }

      // Update existing rows
      for (const [orderId, changes] of Object.entries(editedValues)) {
        if (orderId.toString().startsWith("new-")) continue;

        const updateData = {};

        if (changes.scheduled_date !== undefined) updateData.scheduled_date = changes.scheduled_date;
        if (changes.order_type !== undefined) updateData.order_type = changes.order_type;
        if (changes.delivery_address !== undefined) updateData.delivery_address = changes.delivery_address;
        if (changes.amount_paid !== undefined) updateData.amount_paid = parseFloat(changes.amount_paid) || 0;
        if (changes.payment_date !== undefined) updateData.payment_date = changes.payment_date;
        if (changes.payment_status !== undefined) updateData.payment_status = changes.payment_status;
        if (changes.payment_method !== undefined) updateData.payment_method = changes.payment_method;
        if (changes.receipt_path !== undefined) updateData.receipt_path = changes.receipt_path;

        if (changes.cake !== undefined) {
          const cake = availableCakes.find(c => c.name === changes.cake);
          updateData.cake_id = cake ? cake.cake_id : null;
        }

        if (changes.customer !== undefined) {
          const customer = availableCustomers.find(c => `${c.cus_fname} ${c.cus_lname}` === changes.customer);
          updateData.customer_id = customer ? customer.cus_id : null;
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('CAKE-ORDERS')
            .update(updateData)
            .eq('order_id', orderId);

          if (error) {
            console.error("Error updating order:", error);
            toast.error("Failed to update order");
            setSaving(false);
            return;
          }
        }
      }

      // Refresh data
      const { data, error } = await supabase
        .from('ORDER')
        .select(`
          order_id,
          order_date,
          delivery_method,
          order_schedule,
          delivery_address,
          order_status,
          cus_id,
          CUSTOMER (
            cus_id,
            cus_fname,
            cus_lname,
            cus_celno,
            email
          ),
          PAYMENT (
            payment_id,
            payment_method,
            amount_paid,
            payment_date,
            payment_status,
            receipt
          ),
          "CAKE-ORDERS" (
            co_id,
            quantity,
            cake_id,
            CAKE (
              cake_id,
              name,
              cake_img,
              price,
              theme,
              tier,
              description
            )
          )
        `);

      if (error) {
        console.error("Error refreshing data:", error);
      } else {
        // Flatten the data structure - each cake order becomes a row
        const mapped = data.flatMap((order) => {
          // If no cakes in the order, create a placeholder row
          if (!order["CAKE-ORDERS"] || order["CAKE-ORDERS"].length === 0) {
            return [{
              order_id: order.order_id,
              co_id: null,
              customer_id: order.cus_id,
              customer: order.CUSTOMER ? `${order.CUSTOMER.cus_fname} ${order.CUSTOMER.cus_lname}` : 'Unknown Customer',
              customer_email: order.CUSTOMER?.email || 'N/A',
              customer_phone: order.CUSTOMER?.cus_celno || 'N/A',
              cake: 'No Cake Assigned',
              cake_img: null,
              cake_img_url: null,
              cake_price: 0,
              cake_theme: 'N/A',
              cake_tier: 'N/A',
              cake_description: 'N/A',
              scheduled_date: order.order_schedule,
              order_type: order.delivery_method,
              delivery_address: order.delivery_address || 'N/A',
              cake_id: null,
              quantity: 0,
              amount_paid: order.PAYMENT?.[0]?.amount_paid || 0,
              payment_date: order.PAYMENT?.[0]?.payment_date,
              payment_status: order.PAYMENT?.[0]?.payment_status || 'Pending',
              payment_method: order.PAYMENT?.[0]?.payment_method || 'Cash',
              receipt_path: order.PAYMENT?.[0]?.receipt,
              order_status: order.order_status,
              order_date: order.order_date,
            }];
          }

          // Create a row for each cake in the order
          return order.CAKE - ORDERS.map((cakeOrder) => ({
            order_id: order.order_id,
            co_id: cakeOrder.co_id,
            customer_id: order.cus_id,
            customer: order.CUSTOMER ? `${order.CUSTOMER.cus_fname} ${order.CUSTOMER.cus_lname}` : 'Unknown Customer',
            customer_email: order.CUSTOMER?.email || 'N/A',
            customer_phone: order.CUSTOMER?.cus_celno || 'N/A',
            cake: cakeOrder.CAKE?.name || 'Unknown Cake',
            cake_img: cakeOrder.CAKE?.cake_img,
            cake_img_url: getPublicImageUrl(cakeOrder.CAKE?.cake_img),
            cake_price: cakeOrder.CAKE?.price || 0,
            cake_theme: cakeOrder.CAKE?.theme || 'N/A',
            cake_tier: cakeOrder.CAKE?.tier || 'N/A',
            cake_description: cakeOrder.CAKE?.description || 'N/A',
            scheduled_date: order.order_schedule,
            order_type: order.delivery_method,
            delivery_address: order.delivery_address || 'N/A',
            cake_id: cakeOrder.cake_id,
            quantity: cakeOrder.quantity || 0,
            amount_paid: order.PAYMENT?.[0]?.amount_paid || 0,
            payment_date: order.PAYMENT?.[0]?.payment_date,
            payment_status: order.PAYMENT?.[0]?.payment_status || 'Pending',
            payment_method: order.PAYMENT?.[0]?.payment_method || 'Cash',
            receipt_path: order.PAYMENT?.[0]?.receipt,
            order_status: order.order_status,
            order_date: order.order_date,
          }));
        });
        setRows(mapped);
      }

      setNewRows([]);
      setEditedValues({});
      setSelectedRowId(null);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRowId(id);
  };

  const handleFieldChange = (id, field, value) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));

    // If cake is changed, also update the cake image and price
    if (field === "cake") {
      const selectedCake = availableCakes.find(c => c.name === value);
      if (selectedCake) {
        setEditedValues(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            cake_img_url: getPublicImageUrl(selectedCake.cake_img),
            cake_price: selectedCake.price,
            cake_theme: selectedCake.theme,
            cake_tier: selectedCake.tier,
            cake_description: selectedCake.description
          }
        }));
      }
    }
  };

  const handleCakeSelection = (cake) => {
    if (selectedCakeForModal) {
      handleFieldChange(selectedCakeForModal, "cake", cake.name);
      setEditedValues(prev => ({
        ...prev,
        [selectedCakeForModal]: {
          ...prev[selectedCakeForModal],
          cake_img_url: getPublicImageUrl(cake.cake_img),
          cake_price: cake.price,
          cake_theme: cake.theme,
          cake_tier: cake.tier,
          cake_description: cake.description
        }
      }));
    }
    setShowCakeModal(false);
    setSelectedCakeForModal(null);
  };

  const handleCustomerSelection = (customer) => {
    if (selectedCustomerForModal) {
      const customerName = `${customer.cus_fname} ${customer.cus_lname}`;
      handleFieldChange(selectedCustomerForModal, "customer", customerName);
      setEditedValues(prev => ({
        ...prev,
        [selectedCustomerForModal]: {
          ...prev[selectedCustomerForModal],
          customer_email: customer.email,
          customer_phone: customer.cus_celno
        }
      }));
    }
    setShowCustomerModal(false);
    setSelectedCustomerForModal(null);
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || !selectedReceiptRow) return;

    setUploadingReceipt(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `receipt_${selectedReceiptRow}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Update the order with receipt path
      const { error: updateError } = await supabase
        .from('CAKE-ORDERS')
        .update({ receipt_path: publicUrl })
        .eq('order_id', selectedReceiptRow);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setRows(rows.map(row =>
        row.order_id === selectedReceiptRow
          ? { ...row, receipt_path: publicUrl }
          : row
      ));

      toast.success('Receipt uploaded successfully');
      setShowReceiptModal(false);
      setSelectedReceiptRow(null);
      setReceiptFile(null);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Filter rows based on search term - new rows first, then existing rows
  const filteredRows = [...newRows, ...rows].filter((row) => {
    const customer = row.customer || "";
    const cake = row.cake || "";
    const theme = row.cake_theme || "";
    const tier = row.cake_tier || "";
    return customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tier.toLowerCase().includes(searchTerm.toLowerCase());
  });



  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Cake Orders Management</h1>

        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search by customer, cake, theme, or tier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 border-2 border-gray-200 rounded-xl px-5 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 text-base"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Customer Details</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Cake Information</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Order Details</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Schedule & Delivery</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Payment Details</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRows.map((row) => {
                const isSelected = selectedRowId === row.order_id;
                const edited = editedValues[row.order_id] || {};
                const isEditingScheduledDate =
                  editingField.id === row.order_id && editingField.field === "scheduled_date";
                const isEditingOrderType =
                  editingField.id === row.order_id && editingField.field === "order_type";
                const isEditingDeliveryAddress =
                  editingField.id === row.order_id && editingField.field === "delivery_address";
                const isEditingAmountPaid =
                  editingField.id === row.order_id && editingField.field === "amount_paid";
                const isEditingPaymentMethod =
                  editingField.id === row.order_id && editingField.field === "payment_method";
                const isEditingPaymentStatus =
                  editingField.id === row.order_id && editingField.field === "payment_status";
                const isEditingPaymentDate =
                  editingField.id === row.order_id && editingField.field === "payment_date";

                return (
                  <tr
                    key={row.order_id}
                    className={`transition-all duration-200 cursor-pointer ${isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-md'
                      : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                      }`}
                    onClick={() => handleSelectRow(row.order_id)}
                  >
                    {/* Customer Details Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {edited.customer ?? row.customer}
                          </h4>
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerForModal(row.order_id);
                              setShowCustomerModal(true);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {edited.customer_email ?? row.customer_email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {edited.customer_phone ?? row.customer_phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cake Information Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 flex-shrink-0">
                            {(edited.cake_img_url || row.cake_img_url) ? (
                              <img
                                src={edited.cake_img_url || row.cake_img_url}
                                alt={edited.cake || row.cake || "Cake"}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {(!(edited.cake_img_url || row.cake_img_url) || (edited.cake_img_url || row.cake_img_url) === '') && (
                              <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-500 text-xs font-medium">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base truncate">
                              {edited.cake ?? row.cake}
                            </h4>
                            <p className="text-lg font-bold text-[#AF524D]">
                              ₱{(edited.cake_price ?? row.cake_price).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {edited.cake_description ?? row.cake_description}
                            </p>
                          </div>
                        </div>
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCakeForModal(row.order_id);
                            setShowCakeModal(true);
                          }}
                        >
                          Change Cake
                        </button>
                      </div>
                    </td>

                    {/* Order Details Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9zm9-3h-2v3H8V6h8z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        </div>
                        <p className="text-base font-medium text-gray-900">
                          {edited.quantity ?? row.quantity}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l3-7m3 7V4M12 10V2m0 14a2 2 0 100-4 2 2 0 000 4zm-8-6a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Theme:</span>
                        </div>
                        <p className="text-base font-medium text-gray-900">
                          {edited.cake_theme ?? row.cake_theme}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Tier:</span>
                        </div>
                        <p className="text-base font-medium text-gray-900">
                          {edited.cake_tier ?? row.cake_tier}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Order Status:</span>
                        </div>
                        <p className="text-base font-medium text-gray-900">
                          {edited.order_status ?? row.order_status}
                        </p>
                      </div>
                    </td>

                    {/* Schedule & Delivery Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Scheduled Date:</span>
                          </div>
                          {isEditingScheduledDate ? (
                            <input
                              type="date"
                              className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                              value={editedScheduledDate}
                              onChange={(e) => setEditedScheduledDate(e.target.value)}
                              onBlur={() => {
                                handleFieldChange(row.order_id, "scheduled_date", editedScheduledDate);
                                setEditingField({ id: null, field: null });
                              }}
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-base font-medium text-gray-900">
                                {edited.scheduled_date ? new Date(edited.scheduled_date).toLocaleDateString() : new Date(row.scheduled_date).toLocaleDateString()}
                              </p>
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingField({ id: row.order_id, field: "scheduled_date" });
                                  setEditedScheduledDate(edited.scheduled_date ?? row.scheduled_date);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Order Type:</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${(edited.order_type ?? row.order_type) === 'Pickup'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {edited.order_type ?? row.order_type}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.order_id, field: "order_type" });
                                setEditedOrderType(edited.order_type ?? row.order_type);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Delivery Address:</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 max-w-32 truncate">
                              {edited.delivery_address ?? row.delivery_address}
                            </p>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.order_id, field: "delivery_address" });
                                setEditedDeliveryAddress(edited.delivery_address ?? row.delivery_address);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment Details Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Amount:</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xl font-bold text-[#AF524D]">
                              ₱{(edited.amount_paid ?? row.amount_paid).toLocaleString()}
                            </p>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.order_id, field: "amount_paid" });
                                setEditedAmountPaid(edited.amount_paid ?? row.amount_paid);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m2 0h1m-1 0h1m1 0h1m-1 0h1m1 0h1m-1 0h1m1 0h1M7 15h1m2 0h1m-1 0h1m1 0h1m-1 0h1m1 0h1m-1 0h1m1 0h1" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                              {edited.payment_method ?? row.payment_method}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.order_id, field: "payment_method" });
                                setEditedPaymentMethod(edited.payment_method ?? row.payment_method);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                          </div>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${(edited.payment_status ?? row.payment_status) === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {edited.payment_status ?? row.payment_status}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Payment Date:</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {edited.payment_date ? new Date(edited.payment_date).toLocaleDateString() : (row.payment_date ? new Date(row.payment_date).toLocaleDateString() : 'Not specified')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Receipt Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-3">
                        <div className="text-center">
                          {edited.receipt_path ?? row.receipt_path ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-green-700">Receipt Uploaded</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-500">No Receipt</span>
                            </div>
                          )}
                        </div>

                        <button
                          className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptRow(row.order_id);
                            setShowReceiptModal(true);
                          }}
                        >
                          {edited.receipt_path ?? row.receipt_path ? 'Change Receipt' : 'Upload Receipt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-3">
          <button
            className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            onClick={handleAddRow}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Order
            </div>
          </button>

          <button
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${selectedRowId
              ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            onClick={handleDeleteRow}
            disabled={!selectedRowId}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Order
            </div>
          </button>
        </div>

        <button
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${saving
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          onClick={handleSaveChanges}
          disabled={saving}
        >
          <div className="flex items-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Changes
              </>
            )}
          </div>
        </button>
      </div>

      {/* Cake Selection Modal */}
      {showCakeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#381914]">Select a Cake</h3>
                <p className="text-gray-600 mt-1">Choose from available cakes in the catalog</p>
              </div>
              <button
                onClick={() => {
                  setShowCakeModal(false);
                  setSelectedCakeForModal(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {availableCakes.map((cake) => (
                <div
                  key={cake.cake_id}
                  className="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#AF524D] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  onClick={() => handleCakeSelection(cake)}
                >
                  <div className="aspect-square mb-4">
                    {cake.cake_img ? (
                      <img
                        src={getPublicImageUrl(cake.cake_img)}
                        alt={cake.name}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {(!cake.cake_img || cake.cake_img === '') && (
                      <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-500 text-sm font-medium">
                        No Image
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-800 text-center text-sm mb-2 truncate">
                    {cake.name}
                  </h4>
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-bold text-[#AF524D]">
                      ₱{cake.price?.toLocaleString() || '0'}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {cake.theme}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {cake.tier} Tier
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {cake.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  setShowCakeModal(false);
                  setSelectedCakeForModal(null);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#381914]">Select a Customer</h3>
                <p className="text-gray-600 mt-1">Choose from registered customers</p>
              </div>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setSelectedCustomerForModal(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {availableCustomers.map((customer) => (
                <div
                  key={customer.cus_id}
                  className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#AF524D] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  onClick={() => handleCustomerSelection(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-lg mb-2">
                        {customer.cus_fname} {customer.cus_lname}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.cus_celno}
                        </div>
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setSelectedCustomerForModal(null);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptModal && (
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
                  setReceiptFile(null);
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
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#AF524D] transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                    className="w-full opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-[#AF524D]">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
                {receiptFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Selected: {receiptFile.name}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedReceiptRow(null);
                    setReceiptFile(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceiptUpload}
                  disabled={!receiptFile || uploadingReceipt}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${!receiptFile || uploadingReceipt
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                >
                  {uploadingReceipt ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Receipt'
                  )}
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
