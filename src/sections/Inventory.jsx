import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'unit'
  const [availableIngredients, setAvailableIngredients] = useState([]);

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: 'pcs'
  });

  // Inventory deduction and restock functions
  const deductInventoryForOrder = async (orderId, previousPaymentStatus, newPaymentStatus) => {
    try {
      // Only deduct if moving from Unpaid to Partial Payment or Fully Paid
      if (previousPaymentStatus === 'Unpaid' && (newPaymentStatus === 'Partial Payment' || newPaymentStatus === 'Fully Paid')) {
        console.log(`Deducting inventory for order ${orderId} - Status change: ${previousPaymentStatus} → ${newPaymentStatus}`);

        // Get cake orders for this order
        const { data: cakeOrders, error: cakeOrdersError } = await supabase
          .from('CAKE-ORDERS')
          .select(`
            quantity,
            CAKE!inner(cake_id),
            "CAKE-INGREDIENT"!inner(
              ci_id,
              quantity as ingredient_quantity,
              INGREDIENT!inner(
          ingred_id,
                ingred_name
              )
            )
          `)
          .eq('order_id', orderId);

        if (cakeOrdersError) {
          console.error('Error fetching cake orders:', cakeOrdersError);
          return;
        }

        if (!cakeOrders || cakeOrders.length === 0) {
          console.log('No cake orders found for this order');
          return;
        }

        // Calculate total ingredients needed
        const ingredientDeductions = {};

        for (const cakeOrder of cakeOrders) {
          const cakeQuantity = cakeOrder.quantity;

          for (const cakeIngredient of cakeOrder['CAKE-INGREDIENT']) {
            const ingredientId = cakeIngredient.INGREDIENT.ingred_id;
            const ingredientName = cakeIngredient.INGREDIENT.ingred_name;
            const requiredQuantity = cakeIngredient.ingredient_quantity * cakeQuantity;

            if (ingredientDeductions[ingredientId]) {
              ingredientDeductions[ingredientId].quantity += requiredQuantity;
            } else {
              ingredientDeductions[ingredientId] = {
                name: ingredientName,
                quantity: requiredQuantity
              };
            }
          }
        }

        // Deduct ingredients from inventory
        for (const [ingredientId, deduction] of Object.entries(ingredientDeductions)) {
          const { error: deductError } = await supabase
            .from('INVENTORY')
            .update({
              stock_quantity: supabase.raw(`stock_quantity - ${deduction.quantity}`),
              last_updated: new Date().toISOString()
            })
            .eq('ingred_id', ingredientId);

          if (deductError) {
            console.error(`Error deducting ${deduction.name}:`, deductError);
            toast.error(`Failed to deduct ${deduction.name} from inventory`);
          } else {
            console.log(`Deducted ${deduction.quantity} units of ${deduction.name}`);
          }
        }

        toast.success('Inventory deducted successfully');
      } else {
        console.log(`Skipping inventory deduction - Status change: ${previousPaymentStatus} → ${newPaymentStatus}`);
      }
    } catch (error) {
      console.error('Error in deductInventoryForOrder:', error);
      toast.error('Failed to process inventory deduction');
    }
  };

  const restockInventoryForCancelledOrder = async (orderId) => {
    try {
      console.log(`Restocking inventory for cancelled order ${orderId}`);

      // Get cake orders for this order
      const { data: cakeOrders, error: cakeOrdersError } = await supabase
        .from('CAKE-ORDERS')
        .select(`
          quantity,
          CAKE!inner(cake_id),
          CAKE-INGREDIENT!inner(
            ci_id,
            quantity as ingredient_quantity,
            INGREDIENT!inner(
              ingred_id,
              ingred_name
            )
          )
        `)
        .eq('order_id', orderId);

      if (cakeOrdersError) {
        console.error('Error fetching cake orders:', cakeOrdersError);
        return;
      }

      if (!cakeOrders || cakeOrders.length === 0) {
        console.log('No cake orders found for this cancelled order');
        return;
      }

      // Calculate total ingredients to restock
      const ingredientRestocks = {};

      for (const cakeOrder of cakeOrders) {
        const cakeQuantity = cakeOrder.quantity;

        for (const cakeIngredient of cakeOrder['CAKE-INGREDIENT']) {
          const ingredientId = cakeIngredient.INGREDIENT.ingred_id;
          const ingredientName = cakeIngredient.INGREDIENT.ingred_name;
          const restockQuantity = cakeIngredient.ingredient_quantity * cakeQuantity;

          if (ingredientRestocks[ingredientId]) {
            ingredientRestocks[ingredientId].quantity += restockQuantity;
          } else {
            ingredientRestocks[ingredientId] = {
              name: ingredientName,
              quantity: restockQuantity
            };
          }
        }
      }

      // Restock ingredients in inventory
      for (const [ingredientId, restock] of Object.entries(ingredientRestocks)) {
        const { error: restockError } = await supabase
          .from('INVENTORY')
          .update({
            stock_quantity: supabase.raw(`stock_quantity + ${restock.quantity}`),
            last_updated: new Date().toISOString()
          })
          .eq('ingred_id', ingredientId);

        if (restockError) {
          console.error(`Error restocking ${restock.name}:`, restockError);
          toast.error(`Failed to restock ${restock.name} in inventory`);
        } else {
          console.log(`Restocked ${restock.quantity} units of ${restock.name}`);
        }
      }

      toast.success('Inventory restocked for cancelled order');
    } catch (error) {
      console.error('Error in restockInventoryForCancelledOrder:', error);
      toast.error('Failed to restock inventory for cancelled order');
    }
  };

  const checkAndTriggerRestock = async () => {
    try {
      // Get all inventory items with low stock (less than 10 units)
      const { data: lowStockItems, error: lowStockError } = await supabase
        .from('INVENTORY')
        .select(`
          inven_id,
          stock_quantity,
          INGREDIENT!inner(
            ingred_id,
            ingred_name
          )
        `)
        .lt('stock_quantity', 10);

      if (lowStockError) {
        console.error('Error checking low stock:', lowStockError);
        return;
      }

      if (lowStockItems && lowStockItems.length > 0) {
        // Low stock check - no toast notification
        console.log('Low stock items detected:', lowStockItems);
      }
    } catch (error) {
      console.error('Error in checkAndTriggerRestock:', error);
    }
  };

  const [editFormData, setEditFormData] = useState({
    name: '',
    quantity: '',
    unit: 'pcs'
  });

  // Fetch existing inventory
  useEffect(() => {
    fetchInventory();
  }, []);

  // Check for low stock when inventory changes
  useEffect(() => {
    if (rows.length > 0) {
      checkAndTriggerRestock();
    }
  }, [rows]);

  // Filter inventory when search term or search type changes
  useEffect(() => {
    filterInventory();
  }, [rows, searchTerm, searchType]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('INVENTORY')
        .select(`
          inven_id,
          stock_quantity,
          last_updated,
          ingred_id,
          INGREDIENT (
            ingred_name,
            unit
          )
        `);

      if (error) {
        console.error(error);
        toast.error('Failed to fetch inventory');
      } else {
        const mapped = data.map((item) => ({
          inven_id: item.inven_id,
          quantity: item.stock_quantity,
          updated: item.last_updated,
          name: item.INGREDIENT?.ingred_name,
          unit: item.INGREDIENT?.unit,
          ingred_id: item.ingred_id,
        }));
        setRows(mapped);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter(item => {
      const searchLower = searchTerm.toLowerCase();

      switch (searchType) {
        case 'name':
          return item.name?.toLowerCase().includes(searchLower);
        case 'unit':
          return item.unit?.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return item.name?.toLowerCase().includes(searchLower) ||
            item.unit?.toLowerCase().includes(searchLower) ||
            item.quantity?.toString().includes(searchLower);
      }
    });

    setFilteredRows(filtered);
  };


  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      addInventoryItem(newItem);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const addInventoryItem = async (item) => {
    try {
      // Check if ingredient exists
      const { data: ingreds, error: ingredFetchError } = await supabase
        .from('INGREDIENT')
        .select('ingred_id, unit')
        .ilike('ingred_name', item.name.trim());

      if (ingredFetchError) {
        console.error("Ingredient fetch error:", ingredFetchError);
        toast.error('Failed to check ingredient');
        return;
      }

      let ingred_id;
      let unit = item.unit || 'pcs';

      if (!ingreds || ingreds.length === 0) {
        // Create new ingredient
        const { data: newIngred, error: createIngredError } = await supabase
          .from('INGREDIENT')
          .insert([{
            ingred_name: item.name.trim(),
            unit: unit,
          }])
          .select('ingred_id')
          .single();

        if (createIngredError) {
          console.error("Error creating ingredient:", createIngredError);
          toast.error('Failed to create ingredient');
          return;
        }

        ingred_id = newIngred.ingred_id;
      } else {
        // Use existing ingredient
        ingred_id = ingreds[0].ingred_id;

        // Update unit if different
        if (unit !== ingreds[0].unit) {
          await supabase
            .from('INGREDIENT')
            .update({ unit: unit })
            .eq('ingred_id', ingred_id);
        }
      }

      // Insert inventory record
      const { error: insertError } = await supabase
        .from('INVENTORY')
        .insert([{
          stock_quantity: parseFloat(item.quantity),
          last_updated: new Date().toISOString().split("T")[0],
          ingred_id,
        }]);

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error('Failed to add inventory item');
        return;
      }

      toast.success('Item added successfully');
      setShowAddModal(false);
      setNewItem({ name: '', quantity: '', unit: 'pcs' });
      fetchInventory();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = (item) => {
    setItemToEdit(item);
    setEditFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit || 'pcs'
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async () => {
    if (!editFormData.name || !editFormData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateInventoryItem(itemToEdit.inven_id, editFormData);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const updateInventoryItem = async (invenId, item) => {
    try {
      // Check if ingredient exists
      const { data: ingreds, error: ingredFetchError } = await supabase
        .from('INGREDIENT')
        .select('ingred_id, unit')
        .ilike('ingred_name', item.name.trim());

      if (ingredFetchError) {
        console.error("Ingredient fetch error:", ingredFetchError);
        toast.error('Failed to check ingredient');
        return;
      }

      let ingred_id;
      let unit = item.unit || 'pcs';

      if (!ingreds || ingreds.length === 0) {
        // Create new ingredient
        const { data: newIngred, error: createIngredError } = await supabase
          .from('INGREDIENT')
          .insert([{
            ingred_name: item.name.trim(),
            unit: unit,
          }])
          .select('ingred_id')
          .single();

        if (createIngredError) {
          console.error("Error creating ingredient:", createIngredError);
          toast.error('Failed to create ingredient');
          return;
        }

        ingred_id = newIngred.ingred_id;
      } else {
        // Use existing ingredient
        ingred_id = ingreds[0].ingred_id;

        // Update unit if different
        if (unit !== ingreds[0].unit) {
          await supabase
            .from('INGREDIENT')
            .update({ unit: unit })
            .eq('ingred_id', ingred_id);
        }
      }

      // Update inventory record
      const { error: updateError } = await supabase
        .from('INVENTORY')
        .update({
          stock_quantity: parseFloat(item.quantity),
          last_updated: new Date().toISOString().split("T")[0],
          ingred_id,
        })
        .eq('inven_id', invenId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error('Failed to update inventory item');
        return;
      }

      toast.success('Item updated successfully');
      setShowEditModal(false);
      setItemToEdit(null);
      fetchInventory();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setSaving(true);

      // Get the ingredient ID for this inventory record
      const { data: inventoryData, error: fetchError } = await supabase
        .from('INVENTORY')
        .select('ingred_id')
        .eq('inven_id', itemToDelete.inven_id)
        .single();

      if (fetchError) {
        console.error("Error fetching inventory record:", fetchError);
        toast.error('Failed to fetch inventory record');
        return;
      }

      const ingred_id = inventoryData.ingred_id;

      // Delete the inventory record
      const { error: deleteInventoryError } = await supabase
        .from('INVENTORY')
        .delete()
        .eq('inven_id', itemToDelete.inven_id);

      if (deleteInventoryError) {
        console.error("Delete inventory error:", deleteInventoryError);
        toast.error('Failed to delete inventory item');
        return;
      }

      // Check if this ingredient is used in other inventory records
      const { data: otherInventory, error: checkError } = await supabase
        .from('INVENTORY')
        .select('inven_id')
        .eq('ingred_id', ingred_id);

      if (!checkError && (!otherInventory || otherInventory.length === 0)) {
        // No other inventory records use this ingredient, so we can delete it
        await supabase
          .from('INGREDIENT')
          .delete()
          .eq('ingred_id', ingred_id);
      }

      toast.success('Item deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setItemToEdit(null);
    setEditFormData({ name: '', quantity: '', unit: 'pcs' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage your bakery ingredients and stock levels</p>
        </div>

        <button
          className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={() => setShowAddModal(true)}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Item
          </div>
        </button>
      </div>

      {/* Search Bar */}
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
                placeholder="Search inventory items..."
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
              <option value="name">Name Only</option>
              <option value="unit">Unit Only</option>
            </select>
          </div>
        </div>
      </div>


      {/* Inventory Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Item Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Quantity</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Unit</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Last Updated</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AF524D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading inventory...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'No matching items found' : 'No inventory items'}
                    </p>
                    <p className="text-sm">
                      {searchTerm ? 'Try adjusting your search terms' : 'Click "Add New Item" to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr key={item.inven_id} className={`hover:bg-gray-100 transition-colors duration-200 ${item.quantity < 10 ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                    {/* Item Name Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-base ${item.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.name}
                          </h4>
                          {item.quantity < 10 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-semibold ${item.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          {item.quantity < 10 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Low Stock
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Unit Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#AF524D]/10 text-[#AF524D]">
                          {item.unit || "pcs"}
                        </span>
                      </div>
                    </td>

                    {/* Last Updated Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {formatDate(item.updated)}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-6 px-6 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          disabled={saving}
                          title="Edit item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={saving}
                          title="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">Add New Item</h3>

            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter item name..."
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter quantity..."
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="g">Grams</option>
                  <option value="lbs">Pounds</option>
                  <option value="oz">Ounces</option>
                  <option value="L">Liters</option>
                  <option value="ml">Milliliters</option>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="tsp">Teaspoons</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewItem({ name: '', quantity: '', unit: 'pcs' });
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${saving
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-[#AF524D] text-white hover:bg-[#8B3A3A] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </div>
                ) : (
                  'Add Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && itemToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-blue-200 shadow-2xl">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">Edit Item</h3>

            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter item name..."
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter quantity..."
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="g">Grams</option>
                  <option value="lbs">Pounds</option>
                  <option value="oz">Ounces</option>
                  <option value="L">Liters</option>
                  <option value="ml">Milliliters</option>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="tsp">Teaspoons</option>
                </select>
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
                onClick={handleUpdateItem}
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
                  'Update Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-red-200 shadow-2xl">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this inventory item? This action cannot be undone.
              </p>

              {/* Item Details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {itemToDelete.name}
                  </h4>
                  <span className="px-2 py-1 bg-[#AF524D]/10 text-[#AF524D] text-xs font-medium rounded-full">
                    {itemToDelete.unit}
                  </span>
                </div>

                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Quantity:</span> {itemToDelete.quantity}
                </p>

                <p className="text-gray-600">
                  <span className="font-medium">Last Updated:</span> {formatDate(itemToDelete.updated)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export inventory management functions for use in other components
export const inventoryManagement = {
  deductInventoryForCustomCakeOrder: async (orderId, previousPaymentStatus, newPaymentStatus) => {
    try {
      // Deduct inventory: Unpaid → Partial Payment or Fully Paid
      if (previousPaymentStatus === 'Unpaid' && (newPaymentStatus === 'Partial Payment' || newPaymentStatus === 'Fully Paid')) {
        console.log(`Deducting inventory for custom cake order ${orderId} - Status change: ${previousPaymentStatus} → ${newPaymentStatus}`);

        // Get custom cake ID for this order
        const { data: customCakeData, error: customCakeError } = await supabase
          .from('CUSTOM-CAKE')
          .select('cc_id')
          .eq('order_id', orderId)
          .single();

        if (customCakeError) {
          console.error('Error fetching custom cake data:', customCakeError);
          return;
        }

        if (!customCakeData) {
          console.log('No custom cake found for this order');
          return;
        }

        // Get custom cake assets for this order
        const { data: customCakeAssets, error: customCakeAssetsError } = await supabase
          .from('CUSTOM-CAKE-ASSETS')
          .select(`
            quantity,
            asset_id
          `)
          .eq('cc_id', customCakeData.cc_id);

        if (customCakeAssetsError) {
          console.error('Error fetching custom cake assets:', customCakeAssetsError);
          return;
        }

        if (!customCakeAssets || customCakeAssets.length === 0) {
          console.log('No custom cake assets found for this order');
          return;
        }

        // Calculate total ingredients needed
        const ingredientDeductions = {};

        for (const customCakeAsset of customCakeAssets) {
          const assetQuantity = customCakeAsset.quantity;
          const assetId = customCakeAsset.asset_id;

          // Get ingredients for this specific asset
          const { data: assetIngredients, error: assetIngredientsError } = await supabase
            .from('ASSET-INGREDIENT')
            .select(`
              ai_id,
              ai_quantity,
              INGREDIENT!inner(
                ingred_id,
                ingred_name
              )
            `)
            .eq('asset_id', assetId);

          if (assetIngredientsError) {
            console.error(`Error fetching ingredients for asset ${assetId}:`, assetIngredientsError);
            continue;
          }

          if (!assetIngredients || assetIngredients.length === 0) {
            continue;
          }

          for (const assetIngredient of assetIngredients) {
            const ingredientId = assetIngredient.INGREDIENT.ingred_id;
            const ingredientName = assetIngredient.INGREDIENT.ingred_name;
            const requiredQuantity = assetIngredient.ai_quantity * assetQuantity;

            if (ingredientDeductions[ingredientId]) {
              ingredientDeductions[ingredientId].quantity += requiredQuantity;
            } else {
              ingredientDeductions[ingredientId] = {
                name: ingredientName,
                quantity: requiredQuantity
              };
            }
          }
        }

        // Deduct ingredients from inventory
        for (const [ingredientId, deduction] of Object.entries(ingredientDeductions)) {
          // First, get the current stock quantity
          const { data: currentInventory, error: fetchError } = await supabase
            .from('INVENTORY')
            .select('stock_quantity')
            .eq('ingred_id', ingredientId)
            .single();

          if (fetchError) {
            console.error(`Error fetching current inventory for ingredient ${ingredientId}:`, fetchError);
            continue;
          }

          // Calculate new stock quantity
          const newStockQuantity = currentInventory.stock_quantity - deduction.quantity;

          // Update the inventory
          const { error: updateError } = await supabase
            .from('INVENTORY')
            .update({
              stock_quantity: newStockQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('ingred_id', ingredientId);

          if (updateError) {
            console.error(`Error updating inventory for ingredient ${ingredientId}:`, updateError);
          } else {
            console.log(`Deducted ${deduction.quantity} ${deduction.name} from inventory`);
          }
        }

      }
    } catch (error) {
      console.error('Error in custom cake inventory deduction:', error);
    }
  },

  restockInventoryForCustomCakeOrder: async (orderId, previousPaymentStatus, newPaymentStatus) => {
    try {
      // Restock inventory: Fully Paid or Partial Payment → Unpaid (payment reversal)
      if ((previousPaymentStatus === 'Fully Paid' || previousPaymentStatus === 'Partial Payment') && newPaymentStatus === 'Unpaid') {
        console.log(`Restocking inventory for custom cake order ${orderId} - Payment reversal: ${previousPaymentStatus} → ${newPaymentStatus}`);

        // Get custom cake ID for this order
        const { data: customCakeData, error: customCakeError } = await supabase
          .from('CUSTOM-CAKE')
          .select('cc_id')
          .eq('order_id', orderId)
          .single();

        if (customCakeError) {
          console.error('Error fetching custom cake data:', customCakeError);
          return;
        }

        if (!customCakeData) {
          console.log('No custom cake found for this order');
          return;
        }

        // Get custom cake assets for this order
        const { data: customCakeAssets, error: customCakeAssetsError } = await supabase
          .from('CUSTOM-CAKE-ASSETS')
          .select(`
            quantity,
            asset_id
          `)
          .eq('cc_id', customCakeData.cc_id);

        if (customCakeAssetsError) {
          console.error('Error fetching custom cake assets:', customCakeAssetsError);
          return;
        }

        if (!customCakeAssets || customCakeAssets.length === 0) {
          console.log('No custom cake assets found for this order');
          return;
        }

        // Calculate total ingredients to restock
        const ingredientRestocks = {};

        for (const customCakeAsset of customCakeAssets) {
          const assetQuantity = customCakeAsset.quantity;

          // Get ingredients for this asset
          const { data: assetIngredients, error: assetIngredientsError } = await supabase
            .from('ASSET-INGREDIENT')
            .select(`
              ai_quantity,
              INGREDIENT!inner(
                ingred_id,
                ingred_name
              )
            `)
            .eq('asset_id', customCakeAsset.asset_id);

          if (assetIngredientsError) {
            console.error(`Error fetching ingredients for asset ${customCakeAsset.asset_id}:`, assetIngredientsError);
            continue;
          }

          if (!assetIngredients || assetIngredients.length === 0) {
            console.log(`No ingredients found for asset ${customCakeAsset.asset_id}`);
            continue;
          }

          for (const assetIngredient of assetIngredients) {
            const ingredientId = assetIngredient.INGREDIENT.ingred_id;
            const ingredientName = assetIngredient.INGREDIENT.ingred_name;
            const restockQuantity = assetIngredient.ai_quantity * assetQuantity;

            if (ingredientRestocks[ingredientId]) {
              ingredientRestocks[ingredientId].quantity += restockQuantity;
            } else {
              ingredientRestocks[ingredientId] = {
                name: ingredientName,
                quantity: restockQuantity
              };
            }
          }
        }

        // Restock ingredients in inventory
        for (const [ingredientId, restock] of Object.entries(ingredientRestocks)) {
          console.log(`Restocking ${restock.quantity} units of ${restock.name} (ID: ${ingredientId})`);

          // Get current stock quantity
          const { data: currentStock, error: stockError } = await supabase
            .from('INVENTORY')
            .select('stock_quantity')
            .eq('ingred_id', ingredientId)
            .single();

          if (stockError) {
            console.error(`Error fetching current stock for ingredient ${ingredientId}:`, stockError);
            continue;
          }

          const newStockQuantity = (currentStock.stock_quantity || 0) + restock.quantity;

          // Update stock quantity
          const { error: updateError } = await supabase
            .from('INVENTORY')
            .update({ stock_quantity: newStockQuantity })
            .eq('ingred_id', ingredientId);

          if (updateError) {
            console.error(`Error updating stock for ingredient ${ingredientId}:`, updateError);
            continue;
          }

          console.log(`Successfully restocked ${restock.quantity} units of ${restock.name}. New stock: ${newStockQuantity}`);
        }

        console.log('Custom cake inventory restocking completed successfully');
      }
    } catch (error) {
      console.error('Error in custom cake inventory restocking:', error);
    }
  },

  deductInventoryForOrder: async (orderId, previousPaymentStatus, newPaymentStatus) => {
    try {
      // Deduct inventory: Unpaid → Partial Payment or Fully Paid
      if (previousPaymentStatus === 'Unpaid' && (newPaymentStatus === 'Partial Payment' || newPaymentStatus === 'Fully Paid')) {
        console.log(`Deducting inventory for order ${orderId} - Status change: ${previousPaymentStatus} → ${newPaymentStatus}`);

        // Get cake orders for this order
        const { data: cakeOrders, error: cakeOrdersError } = await supabase
          .from('CAKE-ORDERS')
          .select(`
            quantity,
            cake_id
          `)
          .eq('order_id', orderId);

        if (cakeOrdersError) {
          console.error('Error fetching cake orders:', cakeOrdersError);
          return;
        }

        if (!cakeOrders || cakeOrders.length === 0) {
          return;
        }


        // Calculate total ingredients needed
        const ingredientDeductions = {};

        for (const cakeOrder of cakeOrders) {
          const cakeQuantity = cakeOrder.quantity;
          const cakeId = cakeOrder.cake_id;

          // Get ingredients for this specific cake
          const { data: cakeIngredients, error: ingredientsError } = await supabase
            .from('CAKE-INGREDIENT')
            .select(`
              ci_id,
              quantity,
              INGREDIENT!inner(
                ingred_id,
                ingred_name
              )
            `)
            .eq('cake_id', cakeId);

          if (ingredientsError) {
            console.error(`Error fetching ingredients for cake ${cakeId}:`, ingredientsError);
            continue;
          }

          if (!cakeIngredients || cakeIngredients.length === 0) {
            continue;
          }

          for (const cakeIngredient of cakeIngredients) {
            const ingredientId = cakeIngredient.INGREDIENT.ingred_id;
            const ingredientName = cakeIngredient.INGREDIENT.ingred_name;
            const requiredQuantity = cakeIngredient.quantity * cakeQuantity;

            if (ingredientDeductions[ingredientId]) {
              ingredientDeductions[ingredientId].quantity += requiredQuantity;
            } else {
              ingredientDeductions[ingredientId] = {
                name: ingredientName,
                quantity: requiredQuantity
              };
            }
          }
        }

        // Deduct ingredients from inventory
        for (const [ingredientId, deduction] of Object.entries(ingredientDeductions)) {
          // First, get the current stock quantity
          const { data: currentInventory, error: fetchError } = await supabase
            .from('INVENTORY')
            .select('stock_quantity')
            .eq('ingred_id', ingredientId)
            .single();

          if (fetchError) {
            console.error(`Error fetching current inventory for ingredient ${ingredientId}:`, fetchError);
            toast.error(`Failed to fetch current inventory for ${deduction.name}`);
            continue;
          }

          // Calculate new stock quantity
          const newStockQuantity = currentInventory.stock_quantity - deduction.quantity;

          // Update the inventory
          const { error: deductError } = await supabase
            .from('INVENTORY')
            .update({
              stock_quantity: newStockQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('ingred_id', ingredientId);

          if (deductError) {
            console.error(`Error deducting ${deduction.name}:`, deductError);
            toast.error(`Failed to deduct ${deduction.name} from inventory`);
          } else {
            console.log(`Deducted ${deduction.quantity} units of ${deduction.name} (${currentInventory.stock_quantity} → ${newStockQuantity})`);
          }
        }

        toast.success('Inventory deducted successfully');
      }
      // Restock inventory: Fully Paid or Partial Payment → Unpaid (payment reversal)
      else if ((previousPaymentStatus === 'Fully Paid' || previousPaymentStatus === 'Partial Payment') && newPaymentStatus === 'Unpaid') {
        console.log(`Restocking inventory for order ${orderId} - Payment reversal: ${previousPaymentStatus} → ${newPaymentStatus}`);

        // Get cake orders for this order
        const { data: cakeOrders, error: cakeOrdersError } = await supabase
          .from('CAKE-ORDERS')
          .select(`
            quantity,
            cake_id
          `)
          .eq('order_id', orderId);

        if (cakeOrdersError) {
          console.error('Error fetching cake orders:', cakeOrdersError);
          return;
        }

        if (!cakeOrders || cakeOrders.length === 0) {
          console.log('No cake orders found for this order');
          return;
        }


        // Calculate total ingredients to restock
        const ingredientRestocks = {};

        for (const cakeOrder of cakeOrders) {
          const cakeQuantity = cakeOrder.quantity;
          const cakeId = cakeOrder.cake_id;

          // Get ingredients for this specific cake
          const { data: cakeIngredients, error: ingredientsError } = await supabase
            .from('CAKE-INGREDIENT')
            .select(`
              ci_id,
              quantity,
              INGREDIENT!inner(
                ingred_id,
                ingred_name
              )
            `)
            .eq('cake_id', cakeId);

          if (ingredientsError) {
            console.error(`Error fetching ingredients for cake ${cakeId}:`, ingredientsError);
            continue;
          }

          if (!cakeIngredients || cakeIngredients.length === 0) {
            continue;
          }

          for (const cakeIngredient of cakeIngredients) {
            const ingredientId = cakeIngredient.INGREDIENT.ingred_id;
            const ingredientName = cakeIngredient.INGREDIENT.ingred_name;
            const restockQuantity = cakeIngredient.quantity * cakeQuantity;

            if (ingredientRestocks[ingredientId]) {
              ingredientRestocks[ingredientId].quantity += restockQuantity;
            } else {
              ingredientRestocks[ingredientId] = {
                name: ingredientName,
                quantity: restockQuantity
              };
            }
          }
        }

        // Restock ingredients in inventory
        for (const [ingredientId, restock] of Object.entries(ingredientRestocks)) {
          // First, get the current stock quantity
          const { data: currentInventory, error: fetchError } = await supabase
            .from('INVENTORY')
            .select('stock_quantity')
            .eq('ingred_id', ingredientId)
            .single();

          if (fetchError) {
            console.error(`Error fetching current inventory for ingredient ${ingredientId}:`, fetchError);
            toast.error(`Failed to fetch current inventory for ${restock.name}`);
            continue;
          }

          // Calculate new stock quantity
          const newStockQuantity = currentInventory.stock_quantity + restock.quantity;

          // Update the inventory
          const { error: restockError } = await supabase
            .from('INVENTORY')
            .update({
              stock_quantity: newStockQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('ingred_id', ingredientId);

          if (restockError) {
            console.error(`Error restocking ${restock.name}:`, restockError);
            toast.error(`Failed to restock ${restock.name} in inventory`);
          } else {
            console.log(`Restocked ${restock.quantity} units of ${restock.name}`);
          }
        }

        toast.success('Inventory restocked due to payment reversal');
      } else {
        console.log(`No inventory action needed - Status change: ${previousPaymentStatus} → ${newPaymentStatus}`);
      }
    } catch (error) {
      console.error('Error in deductInventoryForOrder:', error);
      toast.error('Failed to process inventory deduction');
    }
  },

  restockInventoryForCancelledOrder: async (orderId) => {
    try {
      console.log(`Restocking inventory for cancelled order ${orderId}`);

      // Get cake orders for this order
      const { data: cakeOrders, error: cakeOrdersError } = await supabase
        .from('CAKE-ORDERS')
        .select(`
          quantity,
          CAKE!inner(cake_id),
          CAKE-INGREDIENT!inner(
            ci_id,
            quantity as ingredient_quantity,
            INGREDIENT!inner(
              ingred_id,
              ingred_name
            )
          )
        `)
        .eq('order_id', orderId);

      if (cakeOrdersError) {
        console.error('Error fetching cake orders:', cakeOrdersError);
        return;
      }

      if (!cakeOrders || cakeOrders.length === 0) {
        console.log('No cake orders found for this cancelled order');
        return;
      }

      // Calculate total ingredients to restock
      const ingredientRestocks = {};

      for (const cakeOrder of cakeOrders) {
        const cakeQuantity = cakeOrder.quantity;

        for (const cakeIngredient of cakeOrder['CAKE-INGREDIENT']) {
          const ingredientId = cakeIngredient.INGREDIENT.ingred_id;
          const ingredientName = cakeIngredient.INGREDIENT.ingred_name;
          const restockQuantity = cakeIngredient.ingredient_quantity * cakeQuantity;

          if (ingredientRestocks[ingredientId]) {
            ingredientRestocks[ingredientId].quantity += restockQuantity;
          } else {
            ingredientRestocks[ingredientId] = {
              name: ingredientName,
              quantity: restockQuantity
            };
          }
        }
      }

      // Restock ingredients in inventory
      for (const [ingredientId, restock] of Object.entries(ingredientRestocks)) {
        const { error: restockError } = await supabase
          .from('INVENTORY')
          .update({
            stock_quantity: supabase.raw(`stock_quantity + ${restock.quantity}`),
            last_updated: new Date().toISOString()
          })
          .eq('ingred_id', ingredientId);

        if (restockError) {
          console.error(`Error restocking ${restock.name}:`, restockError);
          toast.error(`Failed to restock ${restock.name} in inventory`);
        } else {
          console.log(`Restocked ${restock.quantity} units of ${restock.name}`);
        }
      }

      toast.success('Inventory restocked for cancelled order');
    } catch (error) {
      console.error('Error in restockInventoryForCancelledOrder:', error);
      toast.error('Failed to restock inventory for cancelled order');
    }
  }
};

export default Inventory;
