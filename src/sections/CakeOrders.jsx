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
  const [availableCakes, setAvailableCakes] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCakeModal, setShowCakeModal] = useState(false);
  const [selectedCakeForModal, setSelectedCakeForModal] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);

  // Fetch existing cake orders
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('CAKE_ORDERS')
        .select(`
          order_id,
          customer_id,
          scheduled_date,
          order_type,
          delivery_address,
          cake_id,
          CAKE (
            name,
            cake_img
          ),
          CUSTOMER (
            customer_id,
            first_name,
            last_name
          )
        `);

      if (error) console.error(error);
      else {
        const mapped = data.map((item) => ({
          order_id: item.order_id,
          customer_id: item.customer_id,
          customer: item.CUSTOMER ? `${item.CUSTOMER.first_name} ${item.CUSTOMER.last_name}` : 'Unknown Customer',
          cake: item.CAKE?.name,
          cake_img: item.CAKE?.cake_img,
          cake_img_url: getPublicImageUrl(item.CAKE?.cake_img),
          scheduled_date: item.scheduled_date,
          order_type: item.order_type,
          delivery_address: item.delivery_address,
          cake_id: item.cake_id,
        }));
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
        .select('cake_id, name, cake_img')
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
        .select('customer_id, first_name, last_name')
        .order('first_name');

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
        customer_id: null,
        customer: "Select Customer",
        cake: "Select Cake",
        cake_img: null,
        cake_img_url: null,
        scheduled_date: new Date().toISOString().split("T")[0],
        order_type: "Pickup",
        delivery_address: "Delivery Address",
        cake_id: null,
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      setNewRows(newRows.filter((row) => row.order_id !== selectedRowId));
    } else {
      try {
        const { error } = await supabase
          .from('CAKE_ORDERS')
          .delete()
          .eq('order_id', selectedRowId);

        if (error) {
          console.error("Error deleting order:", error);
          toast.error("Failed to delete order");
        } else {
          setRows(rows.filter((row) => row.order_id !== selectedRowId));
          setSelectedRowId(null);
          toast.success("Order deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting order:", error);
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
        const customer = availableCustomers.find(c => `${c.first_name} ${c.last_name}` === newRow.customer);
        const customer_id = customer ? customer.customer_id : null;

        const { error } = await supabase
          .from('CAKE_ORDERS')
          .insert({
            customer_id: customer_id,
            cake_id: cake_id,
            scheduled_date: newRow.scheduled_date,
            order_type: newRow.order_type,
            delivery_address: newRow.delivery_address,
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

        if (changes.cake !== undefined) {
          const cake = availableCakes.find(c => c.name === changes.cake);
          updateData.cake_id = cake ? cake.cake_id : null;
        }

        if (changes.customer !== undefined) {
          const customer = availableCustomers.find(c => `${c.first_name} ${c.last_name}` === changes.customer);
          updateData.customer_id = customer ? customer.customer_id : null;
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('CAKE_ORDERS')
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
        .from('CAKE_ORDERS')
        .select(`
          order_id,
          customer_id,
          scheduled_date,
          order_type,
          delivery_address,
          cake_id,
          CAKE (
            name,
            cake_img
          ),
          CUSTOMER (
            customer_id,
            first_name,
            last_name
          )
        `);

      if (error) {
        console.error("Error refreshing data:", error);
      } else {
        const mapped = data.map((item) => ({
          order_id: item.order_id,
          customer_id: item.customer_id,
          customer: item.CUSTOMER ? `${item.CUSTOMER.first_name} ${item.CUSTOMER.last_name}` : 'Unknown Customer',
          cake: item.CAKE?.name,
          cake_img: item.CAKE?.cake_img,
          cake_img_url: getPublicImageUrl(item.CAKE?.cake_img),
          scheduled_date: item.scheduled_date,
          order_type: item.order_type,
          delivery_address: item.delivery_address,
          cake_id: item.cake_id,
        }));
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

    // If cake is changed, also update the cake image
    if (field === "cake") {
      const selectedCake = availableCakes.find(c => c.name === value);
      if (selectedCake) {
        setEditedValues(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            cake_img_url: getPublicImageUrl(selectedCake.cake_img)
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
          cake_img_url: getPublicImageUrl(cake.cake_img)
        }
      }));
    }
    setShowCakeModal(false);
    setSelectedCakeForModal(null);
  };

  const handleCustomerSelection = (customer) => {
    if (selectedCustomerForModal) {
      const customerName = `${customer.first_name} ${customer.last_name}`;
      handleFieldChange(selectedCustomerForModal, "customer", customerName);
    }
    setShowCustomerModal(false);
    setSelectedCustomerForModal(null);
  };

  // Filter rows based on search term
  const filteredRows = [...rows, ...newRows].filter((row) => {
    const customer = row.customer || "";
    const cake = row.cake || "";
    return customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cake.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Cake Orders</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/5">Customer</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/5">Cake</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/5">Scheduled Date</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/5">Order Type</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/5">Delivery Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isSelected = selectedRowId === row.order_id;
              const edited = editedValues[row.order_id] || {};
              const isEditingCustomer =
                editingField.id === row.order_id && editingField.field === "customer";
              const isEditingCake =
                editingField.id === row.order_id && editingField.field === "cake";
              const isEditingScheduledDate =
                editingField.id === row.order_id && editingField.field === "scheduled_date";
              const isEditingOrderType =
                editingField.id === row.order_id && editingField.field === "order_type";
              const isEditingDeliveryAddress =
                editingField.id === row.order_id && editingField.field === "delivery_address";

              return (
                <tr
                  key={row.order_id}
                  className={`border-t text-sm cursor-pointer ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => handleSelectRow(row.order_id)}
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span>{edited.customer ?? row.customer}</span>
                        <span
                          className="cursor-pointer hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerForModal(row.order_id);
                            setShowCustomerModal(true);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {(edited.cake_img_url || row.cake_img_url) ? (
                          <img
                            src={edited.cake_img_url || row.cake_img_url}
                            alt={edited.cake || row.cake || "Cake"}
                            className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {(!(edited.cake_img_url || row.cake_img_url) || (edited.cake_img_url || row.cake_img_url) === '') && (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-500 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-sm">{edited.cake ?? row.cake}</span>
                        <span
                          className="cursor-pointer hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCakeForModal(row.order_id);
                            setShowCakeModal(true);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isEditingScheduledDate ? (
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-32"
                          value={editedScheduledDate}
                          onChange={(e) => setEditedScheduledDate(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.order_id, "scheduled_date", editedScheduledDate);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{edited.scheduled_date ? new Date(edited.scheduled_date).toLocaleDateString() : new Date(row.scheduled_date).toLocaleDateString()}</span>
                          <span
                            className="cursor-pointer hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.order_id, field: "scheduled_date" });
                              setEditedScheduledDate(edited.scheduled_date ?? row.scheduled_date);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isEditingOrderType ? (
                        <select
                          className="border rounded px-2 py-1 w-24"
                          value={editedOrderType}
                          onChange={(e) => setEditedOrderType(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.order_id, "order_type", editedOrderType);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        >
                          <option value="Pickup">Pickup</option>
                          <option value="Delivery">Delivery</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{edited.order_type ?? row.order_type}</span>
                          <span
                            className="cursor-pointer hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.order_id, field: "order_type" });
                              setEditedOrderType(edited.order_type ?? row.order_type);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isEditingDeliveryAddress ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-40"
                          value={editedDeliveryAddress}
                          onChange={(e) => setEditedDeliveryAddress(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.order_id, "delivery_address", editedDeliveryAddress);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-32">{edited.delivery_address ?? row.delivery_address}</span>
                          <span
                            className="cursor-pointer hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.order_id, field: "delivery_address" });
                              setEditedDeliveryAddress(edited.delivery_address ?? row.delivery_address);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-4 flex-wrap">
        <button
          className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={handleAddRow}
        >
          ADD
        </button>
        <button
          className={`px-6 py-2 rounded-full transition-colors ${selectedRowId
            ? 'bg-[#D9D9D9] text-black cursor-pointer hover:bg-gray-300'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          onClick={handleDeleteRow}
          disabled={!selectedRowId}
        >
          DELETE
        </button>
        <button
          className={`px-6 py-2 rounded-full transition-colors ${saving
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
            }`}
          onClick={handleSaveChanges}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'SAVE CHANGES'}
        </button>
      </div>

      {/* Cake Selection Modal */}
      {showCakeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border-4 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#381914]">Select a Cake</h3>
              <button
                onClick={() => {
                  setShowCakeModal(false);
                  setSelectedCakeForModal(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableCakes.map((cake) => (
                <div
                  key={cake.cake_id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-[#AF524D] hover:shadow-md transition-all duration-200"
                  onClick={() => handleCakeSelection(cake)}
                >
                  <div className="aspect-square mb-3">
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
                      <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-500 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-center text-gray-800 truncate">
                    {cake.name}
                  </h4>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCakeModal(false);
                  setSelectedCakeForModal(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border-4 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#381914]">Select a Customer</h3>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setSelectedCustomerForModal(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {availableCustomers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-[#AF524D] hover:shadow-md transition-all duration-200"
                  onClick={() => handleCustomerSelection(customer)}
                >
                  <h4 className="font-medium text-gray-800">
                    {customer.first_name} {customer.last_name}
                  </h4>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setSelectedCustomerForModal(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CakeOrders;
