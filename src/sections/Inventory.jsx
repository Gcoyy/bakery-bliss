import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [rows, setRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedName, setEditedName] = useState("");
  const [editedQuantity, setEditedQuantity] = useState("");
  const [editedUnit, setEditedUnit] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch existing inventory
  useEffect(() => {
    const fetchData = async () => {
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

      if (error) console.error(error);
      else {
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
    };

    fetchData();
  }, []);

  // Fetch available ingredients for reference
  useEffect(() => {
    const fetchIngredients = async () => {
      const { data, error } = await supabase
        .from('INGREDIENT')
        .select('ingred_id, ingred_name, unit')
        .order('ingred_name');

      if (error) {
        console.error("Error fetching ingredients:", error);
      } else {
        setAvailableIngredients(data || []);
        console.log("Available ingredients:", data);
      }
    };

    fetchIngredients();
  }, []);


  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    setNewRows([
      ...newRows,
      {
        inven_id: newId,
        quantity: "0",
        updated: new Date().toISOString().split("T")[0],
        name: "Item Name",
        ingred_id: null,
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      setNewRows(newRows.filter((row) => row.inven_id !== selectedRowId));
    } else {
      try {
        // First, get the ingredient ID for this inventory record
        const { data: inventoryData, error: fetchError } = await supabase
          .from('INVENTORY')
          .select('ingred_id')
          .eq('inven_id', selectedRowId)
          .single();

        if (fetchError) {
          console.error("Error fetching inventory record:", fetchError);
          toast.error(`Failed to fetch inventory record: ${fetchError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
          return;
        }

        const ingred_id = inventoryData.ingred_id;

        // Delete the inventory record first
        const { error: deleteInventoryError } = await supabase
          .from('INVENTORY')
          .delete()
          .eq('inven_id', selectedRowId);

        if (deleteInventoryError) {
          console.error("Delete inventory error:", deleteInventoryError);
          toast.error(`Failed to delete inventory item: ${deleteInventoryError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
          return;
        }

        // Check if this ingredient is used in other inventory records
        const { data: otherInventory, error: checkError } = await supabase
          .from('INVENTORY')
          .select('inven_id')
          .eq('ingred_id', ingred_id);

        if (checkError) {
          console.error("Error checking other inventory records:", checkError);
        } else if (!otherInventory || otherInventory.length === 0) {
          // No other inventory records use this ingredient, so we can delete it
          console.log(`Deleting ingredient with ID ${ingred_id} as it's no longer used`);
          const { error: deleteIngredError } = await supabase
            .from('INGREDIENT')
            .delete()
            .eq('ingred_id', ingred_id);

          if (deleteIngredError) {
            console.error("Delete ingredient error:", deleteIngredError);
          } else {
            console.log(`Successfully deleted ingredient with ID ${ingred_id}`);
          }
        } else {
          console.log(`Ingredient with ID ${ingred_id} is still used in other inventory records, keeping it`);
        }

        // Update the local state
        setRows(rows.filter((row) => row.inven_id !== selectedRowId));
      } catch (error) {
        console.error("Error in delete operation:", error);
      }
    }

    setSelectedRowId(null);
  };

  const handleSaveChanges = async () => {
    if (saving) return; // Prevent multiple clicks

    setSaving(true);

    console.log("=== SAVE CHANGES START ===");
    console.log("New rows to save:", newRows);
    console.log("Edited rows to save:", editedValues);
    console.log("Available ingredients:", availableIngredients);

    // Save new rows (INSERT operations)
    for (const newRow of newRows) {
      console.log(`Processing new row:`, newRow);

      if (!newRow.name || !newRow.quantity) {
        console.warn("Skipping incomplete new row:", newRow);
        continue;
      }

      try {
        // First, check if ingredient exists
        console.log(`Looking for ingredient: "${newRow.name.trim()}"`);
        const { data: ingreds, error: ingredFetchError } = await supabase
          .from('INGREDIENT')
          .select('ingred_id, unit')
          .ilike('ingred_name', newRow.name.trim());

        if (ingredFetchError) {
          console.error("Ingredient fetch error (insert):", ingredFetchError);
          continue;
        }

        console.log(`Found ingredients:`, ingreds);

        let ingred_id;
        let unit = newRow.unit || 'pcs'; // Use the unit from the row or default to 'pcs'

        if (!ingreds || ingreds.length === 0) {
          // Ingredient doesn't exist, create it first
          console.log(`Creating new ingredient: "${newRow.name.trim()}" with unit: "${unit}"`);
          const { data: newIngred, error: createIngredError } = await supabase
            .from('INGREDIENT')
            .insert([
              {
                ingred_name: newRow.name.trim(),
                unit: unit,
              },
            ])
            .select('ingred_id')
            .single();

          if (createIngredError) {
            console.error("Error creating ingredient:", createIngredError);
            continue;
          }

          ingred_id = newIngred.ingred_id;
          console.log(`Created new ingredient with ID ${ingred_id} for "${newRow.name}"`);
        } else {
          // Ingredient exists, use its ID and update unit if different
          ingred_id = ingreds[0].ingred_id;
          const existingUnit = ingreds[0].unit;

          if (unit !== existingUnit) {
            console.log(`Updating unit for ingredient "${newRow.name}" from "${existingUnit}" to "${unit}"`);
            const { error: updateUnitError } = await supabase
              .from('INGREDIENT')
              .update({ unit: unit })
              .eq('ingred_id', ingred_id);

            if (updateUnitError) {
              console.error("Error updating ingredient unit:", updateUnitError);
            }
          }

          console.log(`Found existing ingredient ID ${ingred_id} for "${newRow.name}"`);
        }

        // Insert new inventory record
        const { error: insertError } = await supabase
          .from('INVENTORY')
          .insert([
            {
              stock_quantity: parseFloat(newRow.quantity),
              last_updated: new Date().toISOString().split("T")[0],
              ingred_id,
            },
          ]);

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error(`Failed to save inventory item "${newRow.name}": ${insertError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          console.log(`Successfully inserted new row for "${newRow.name}"`);
        }
      } catch (error) {
        console.error("Error processing new row:", error);
      }
    }

    // Save updated rows (UPDATE operations)
    for (const [id, values] of Object.entries(editedValues)) {
      console.log(`Processing edited row ${id}:`, values);
      console.log(`Values object keys:`, Object.keys(values));
      console.log(`Values object:`, values);

      // Find the original row data
      const originalRow = rows.find(row => row.inven_id === parseInt(id));
      if (!originalRow) {
        console.warn(`Original row not found for ID ${id}`);
        continue;
      }

      // Merge original data with edited values
      const mergedData = {
        name: values.name || originalRow.name,
        quantity: values.quantity !== undefined ? values.quantity : originalRow.quantity,
        unit: values.unit || originalRow.unit || 'pcs'
      };

      console.log(`Merged data for row ${id}:`, mergedData);

      const { quantity, name, unit } = mergedData;

      if (!name || quantity === undefined) {
        console.warn("Skipping incomplete edited row:", { id, mergedData });
        continue;
      }

      try {
        // Find the ingredient ID for the updated name
        console.log(`Looking for ingredient: "${name.trim()}"`);
        const { data: ingreds, error: ingredFetchError } = await supabase
          .from('INGREDIENT')
          .select('ingred_id, unit')
          .ilike('ingred_name', name.trim());

        if (ingredFetchError) {
          console.error("Ingredient fetch error (update):", ingredFetchError);
          continue;
        }

        console.log(`Found ingredients:`, ingreds);

        let ingred_id;
        let finalUnit = unit || 'pcs'; // Use the unit from the edited values or default to 'pcs'

        if (!ingreds || ingreds.length === 0) {
          // Ingredient doesn't exist, create it first
          console.log(`Creating new ingredient: "${name.trim()}" with unit: "${finalUnit}"`);
          const { data: newIngred, error: createIngredError } = await supabase
            .from('INGREDIENT')
            .insert([
              {
                ingred_name: name.trim(),
                unit: finalUnit,
              },
            ])
            .select('ingred_id')
            .single();

          if (createIngredError) {
            console.error("Error creating ingredient:", createIngredError);
            continue;
          }

          ingred_id = newIngred.ingred_id;
          console.log(`Created new ingredient with ID ${ingred_id} for "${name}"`);
        } else {
          // Ingredient exists, use its ID and update unit if different
          ingred_id = ingreds[0].ingred_id;
          const existingUnit = ingreds[0].unit;

          if (finalUnit !== existingUnit) {
            console.log(`Updating unit for ingredient "${name}" from "${existingUnit}" to "${finalUnit}"`);
            const { error: updateUnitError } = await supabase
              .from('INGREDIENT')
              .update({ unit: finalUnit })
              .eq('ingred_id', ingred_id);

            if (updateUnitError) {
              console.error("Error updating ingredient unit:", updateUnitError);
            }
          }

          console.log(`Found existing ingredient ID ${ingred_id} for "${name}"`);
        }

        // Update existing inventory record
        const { error: updateError } = await supabase
          .from('INVENTORY')
          .update({
            stock_quantity: parseFloat(quantity),
            last_updated: new Date().toISOString().split("T")[0],
            ingred_id,
          })
          .eq('inven_id', id);

        if (updateError) {
          console.error(`Update error for inven_id ${id}:`, updateError);
          toast.error(`Failed to update inventory item: ${updateError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          console.log(`Successfully updated row with inven_id ${id}`);
        }
      } catch (error) {
        console.error("Error processing updated row:", error);
      }
    }

    // Clear states
    setEditedValues({});
    setNewRows([]);
    setEditingField({ id: null, field: null });
    setSelectedRowId(null);

    // Refresh inventory to show updated data
    console.log("Refreshing inventory...");
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
      console.error("Refresh fetch error:", error);
    } else if (data) {
      const mapped = data.map((item) => ({
        inven_id: item.inven_id,
        quantity: item.stock_quantity,
        updated: item.last_updated,
        name: item.INGREDIENT?.ingred_name,
        unit: item.INGREDIENT?.unit,
        ingred_id: item.ingred_id,
      }));
      console.log("Inventory refreshed:", mapped);
      setRows(mapped);
    }

    console.log("=== SAVE CHANGES END ===");

    // Show success notification
    toast.success('Inventory saved successfully!', {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#10B981',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });

    setSaving(false);
  };


  const handleSelectRow = (id) => {
    setSelectedRowId((prevId) => (prevId === id ? null : id));
  };

  const handleFieldChange = (id, field, value) => {
    if (id.toString().startsWith("new-")) {
      setNewRows((prev) =>
        prev.map((r) => (r.inven_id === id ? { ...r, [field]: value } : r))
      );
    } else {
      setEditedValues((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }));
    }
  };

  // Filter rows based on search term - new rows first, then existing rows
  const filteredRows = [...newRows, ...rows].filter((row) => {
    const name = row.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage your bakery ingredients and stock levels</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search by ingredient name..."
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

      {/* Inventory Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Item Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Quantity</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Unit</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRows.map((row) => {
                const isSelected = selectedRowId === row.inven_id;
                const edited = editedValues[row.inven_id] || {};
                const isEditingName =
                  editingField.id === row.inven_id && editingField.field === "name";

                return (
                  <tr
                    key={row.inven_id}
                    className={`transition-all duration-200 cursor-pointer ${isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-md'
                      : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                      }`}
                    onClick={() => handleSelectRow(row.inven_id)}
                  >
                    {/* Item Name Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        {isEditingName ? (
                          <input
                            type="text"
                            className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={() => {
                              handleFieldChange(row.inven_id, "name", editedName);
                              setEditingField({ id: null, field: null });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {edited.name ?? row.name}
                            </h4>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.inven_id, field: "name" });
                                setEditedName(edited.name ?? row.name);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quantity Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        {editingField.id === row.inven_id && editingField.field === "quantity" ? (
                          <input
                            type="number"
                            className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                            value={editedQuantity}
                            onChange={(e) => setEditedQuantity(e.target.value)}
                            onBlur={() => {
                              handleFieldChange(row.inven_id, "quantity", editedQuantity);
                              setEditingField({ id: null, field: null });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              {edited.quantity ?? row.quantity}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.inven_id, field: "quantity" });
                                setEditedQuantity(edited.quantity ?? row.quantity);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Unit Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        {editingField.id === row.inven_id && editingField.field === "unit" ? (
                          <input
                            type="text"
                            className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                            value={editedUnit}
                            onChange={(e) => setEditedUnit(e.target.value)}
                            onBlur={() => {
                              handleFieldChange(row.inven_id, "unit", editedUnit);
                              setEditingField({ id: null, field: null });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              {edited.unit ?? row.unit ?? "pcs"}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.inven_id, field: "unit" });
                                setEditedUnit(edited.unit ?? row.unit ?? "pcs");
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Updated Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {new Date(row.updated).toLocaleDateString()}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
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
              Add New Item
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
              Delete Item
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
    </div>
  );
};

export default Inventory;
