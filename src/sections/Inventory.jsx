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

  // Filter rows based on search term
  const filteredRows = [...rows, ...newRows].filter((row) => {
    const name = row.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen flex flex-col">
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Inventory</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ingredients..."
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
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/4">Item Name</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/4">Quantity</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/4">Unit</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/4">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isSelected = selectedRowId === row.inven_id;
              const edited = editedValues[row.inven_id] || {};
              const isEditingName =
                editingField.id === row.inven_id && editingField.field === "name";
              console.log({
                rowId: row.inven_id,
                selected: selectedRowId === row.inven_id,
                editing: editingField.id === row.inven_id,
              });

              return (
                <tr
                  key={row.inven_id}
                  className={`border-t text-sm cursor-pointer ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => handleSelectRow(row.inven_id)}
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-40"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.inven_id, "name", editedName);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {edited.name ?? row.name}
                          <span
                            className="cursor-pointer hover:text-blue-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.inven_id, field: "name" });
                              setEditedName(edited.name ?? row.name);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === row.inven_id && editingField.field === "quantity" ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={editedQuantity}
                          onChange={(e) => setEditedQuantity(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.inven_id, "quantity", editedQuantity);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField({ id: row.inven_id, field: "quantity" });
                            setEditedQuantity(edited.quantity ?? row.quantity);
                          }}
                        >
                          {edited.quantity ?? row.quantity}
                          <span className="cursor-pointer hover:text-blue-700">
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === row.inven_id && editingField.field === "unit" ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-20"
                          value={editedUnit}
                          onChange={(e) => setEditedUnit(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.inven_id, "unit", editedUnit);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField({ id: row.inven_id, field: "unit" });
                            setEditedUnit(edited.unit ?? row.unit ?? "pcs");
                          }}
                        >
                          {edited.unit ?? row.unit ?? "pcs"}
                          <span className="cursor-pointer hover:text-blue-700">
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className='flex items-center gap-2'>
                      {new Date(row.updated).toLocaleDateString()}
                      <img src="/clock.svg" alt="" />
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
          className="bg-green-600 text-white px-6 py-2 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
          onClick={handleSaveChanges}
        >
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
};

export default Inventory;
