import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient';

const Cakes = () => {
  const [rows, setRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedName, setEditedName] = useState('');
  const [editedTheme, setEditedTheme] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPrice, setEditedPrice] = useState(0);
  const [editedTier, setEditedTier] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // // Predefined themes for dropdown
  const themes = [
    "Birthday",
    "Wedding",
    "Anniversary",
    "Graduation",
    "Baby Shower",
    "Bridal Shower",
    "Corporate",
    "Holiday",
    "Valentine's Day",
    "Christmas",
    "Halloween",
    "Easter",
    "Thanksgiving",
    "Retirement",
    "Gender Reveal",
    "Quinceañera",
    "Bar/Bat Mitzvah",
    "Engagement",
    "Custom"
  ];

  useEffect(() => {
    const fetchCakes = async () => {
      const { data, error } = await supabase.from('CAKE').select('*').order('name');
      if (error) {
        console.error('Error fetching cakes:', error);
      } else {
        setRows(data || []);
      }
    };
    fetchCakes();
  }, []);


  const handleSelectRow = (id) => {
    setSelectedRowId((prevId) => (prevId === id ? null : id));
  };

  const handleAddRow = () => {
    setNewRows([
      ...newRows,
      {
        id: `new-${Date.now()}`,
        name: '',
        theme: '',
        description: '',
        tier: 1,
        price: 0,
        cake_img: null,
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      setNewRows(newRows.filter((row) => row.cake_id !== selectedRowId));
    } else {
      try {
        const { error } = await supabase
          .from('CAKE')
          .delete()
          .eq('id', selectedRowId);

        if (error) {
          console.error("Delete error:", error);
          return;
        }

        setRows(rows.filter((row) => row.cake_id !== selectedRowId));
      } catch (error) {
        console.error("Error in delete operation:", error);
      }
    }

    setSelectedRowId(null);
  };

  const handleFieldChange = (id, field, value) => {
    // Convert numerical fields to proper types
    let processedValue = value;
    if (field === 'tier') {
      processedValue = parseInt(value) || 1;
    } else if (field === 'price') {
      processedValue = parseFloat(value) || 0;
    }

    if (id.toString().startsWith("new-")) {
      setNewRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: processedValue } : r))
      );
    } else {
      setEditedValues((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: processedValue,
        },
      }));
    }
  };

  const handleImageUpload = async (event, rowId) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setUploadingImage(rowId);

        // Get the cake name for the filename
        const row = [...rows, ...newRows].find(r => r.id === rowId);
        const cakeName = row?.name || 'cake';

        // Generate filename using cake name
        const fileExt = file.name.split('.').pop();
        const sanitizedName = cakeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `${sanitizedName}_${Date.now()}.${fileExt}`;

        // Upload to Supabase storage bucket 'cake'
        const { data, error } = await supabase.storage
          .from('CAKE')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading image:', error);
          setUploadingImage(null);
          return;
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('CAKE')
          .getPublicUrl(fileName);

        // Update the field with the image URL
        handleFieldChange(rowId, "cake_img", publicUrl);
        setUploadingImage(null);

        console.log('Image uploaded successfully:', publicUrl);
      } catch (error) {
        console.error('Error in image upload:', error);
        setUploadingImage(null);
      }
    }
  };

  const handleSaveChanges = async () => {
    console.log("=== SAVE CAKES CHANGES START ===");
    console.log("New rows to save:", newRows);
    console.log("Edited rows to save:", editedValues);

    // Save new rows (INSERT operations)
    for (const newRow of newRows) {
      console.log(`Processing new cake:`, newRow);

      if (!newRow.name) {
        console.warn("Skipping incomplete new cake:", newRow);
        continue;
      }

      try {
        const { error: insertError } = await supabase
          .from('CAKE')
          .insert([
            {
              name: newRow.name,
              theme: newRow.theme,
              description: newRow.description,
              tier: parseInt(newRow.tier) || 1,
              price: parseFloat(newRow.price) || 0,
              cake_img: newRow.cake_img,
            },
          ]);

        if (insertError) {
          console.error("Insert error:", insertError);
        } else {
          console.log(`Successfully inserted new cake: "${newRow.name}"`);
        }
      } catch (error) {
        console.error("Error processing new cake:", error);
      }
    }

    // Save updated rows (UPDATE operations)
    for (const [id, values] of Object.entries(editedValues)) {
      console.log(`Processing edited cake ${id}:`, values);

      try {
        const { error: updateError } = await supabase
          .from('CAKE')
          .update({
            name: values.name,
            theme: values.theme,
            description: values.description,
            tier: parseInt(values.tier) || 1,
            price: parseFloat(values.price) || 0,
            cake_img: values.cake_img,
          })
          .eq('cake_id', id);

        if (updateError) {
          console.error(`Update error for cake ID ${id}:`, updateError);
        } else {
          console.log(`Successfully updated cake with ID ${id}`);
        }
      } catch (error) {
        console.error("Error processing updated cake:", error);
      }
    }

    // Clear states
    setEditedValues({});
    setNewRows([]);
    setEditingField({ id: null, field: null });
    setSelectedRowId(null);

    // Refresh cakes to show updated data
    console.log("Refreshing cakes...");
    const { data, error } = await supabase
      .from('CAKE')
      .select('*')
      .order('name');

    if (error) {
      console.error("Refresh fetch error:", error);
    } else if (data) {
      console.log("Cakes refreshed:", data);
      setRows(data);
    }

    console.log("=== SAVE CAKES CHANGES END ===");
  };


  // Filter rows based on search term
  const filteredRows = [...rows, ...newRows].filter((row) => {
    const name = row.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen">
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Cakes</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search cake..."
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

      <div className="w-full h-[75%] overflow-y-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Cake Name</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Theme</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Description</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Tiers</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Price</th>
              <th className="text-left py-2 px-4 text-sm font-semibold w-1/6">Cake Image</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isSelected = selectedRowId === row.cake_id;
              const edited = editedValues[row.cake_id] || {};
              const isEditingName =
                editingField.id === row.cake_id && editingField.field === "name";
                console.log({
  rowId: row.cake_id,
  selected: selectedRowId === row.cake_id,
  editing: editingField.id === row.cake_id,
});

              return (
                <tr
                    key={row.cake_id}
                    className={`border-t text-sm cursor-pointer ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSelectRow(row.cake_id)}
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
                            handleFieldChange(row.cake_id, "name", editedName);
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
                              setEditingField({ id: row.cake_id, field: "name" });
                              setEditedName(edited.name ?? row.name);
                            }}
                          >
                            <svg key={`edit-name-${row.cake_id}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === row.cake_id && editingField.field === "theme" ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-20"
                          value={editedTheme}
                          onChange={(e) => setEditedTheme(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.cake_id, "theme", editedTheme);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {edited.theme ?? row.theme}
                          <span
                            className="cursor-pointer hover:text-blue-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.cake_id, field: "theme" });
                              setEditedTheme(edited.theme ?? row.theme);
                            }}
                          >
                            <svg key={`edit-theme-${row.cake_id}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === row.cake_id && editingField.field === "description" ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-32"
                          value={edited.description ?? row.description}
                          onChange={(e) => handleFieldChange(row.cake_id, "description", e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.cake_id, "description", edited.description ?? row.description);
                            setEditingField({ id: null, field: null });
                            
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {edited.description ?? row.description}
                          <span
                            className="cursor-pointer hover:text-blue-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.cake_id, field: "description" });
                              setEditedDescription(edited.description ?? row.description);
                            }}
                          >
                            <svg key={`edit-description-${row.cake_id}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === row.cake_id && editingField.field === "tier" ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-16"
                          value={edited.tier ?? row.tier}
                          onChange={(e) => handleFieldChange(row.cake_id, "tier", parseInt(e.target.value))}
                          onBlur={() => {
                            handleFieldChange(row.cake_id, "tier", parseInt(edited.tier ?? row.tier));
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField({ id: row.cake_id, field: "tier" });
                            setEditedTier(edited.tier ?? row.tier);
                          }}
                        >
                          {edited.tier ?? row.tier}
                          <span className="cursor-pointer hover:text-blue-700">
                            <svg key={`edit-tier-${row.cake_id}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {editingField.id === row.cake_id && editingField.field === "price" ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={edited.price ?? row.price}
                          onChange={(e) => handleFieldChange(row.cake_id, "price", parseFloat(e.target.value))}
                          onBlur={() => {
                            handleFieldChange(row.cake_id, "price", parseFloat(edited.price ?? row.price));
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField({ id: row.cake_id, field: "price" });
                            setEditedPrice(edited.price ?? row.price);
                          }}
                        >
                          ₱{edited.price ?? row.price}
                          <span className="cursor-pointer hover:text-blue-700">
                            <svg key={`edit-price-${row.cake_id}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="relative">
                      {uploadingImage === row.cake_id ? (
                        <div className="w-16 h-16 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#AF524D]"></div>
                            <span className="text-xs text-gray-500 mt-1">Uploading...</span>
                          </div>
                        </div>
                      ) : edited.cake_img || row.cake_img ? (
                        <div className="w-16 h-16 rounded overflow-hidden border border-gray-300">
                          <img
                            src={edited.cake_img || row.cake_img}
                            alt="Cake"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                            <label className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, row.cake_id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#AF524D] transition-colors duration-200">
                          <label className="cursor-pointer flex flex-col items-center">
                            <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs text-gray-500">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, row.cake_id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </label>
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

      <div className="mt-6 flex justify-end gap-4">
        <button
          className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full cursor-pointer"
          onClick={handleAddRow}
        >
          ADD
        </button>
        <button
          className={`px-6 py-2 rounded-full ${selectedRowId
            ? 'bg-[#D9D9D9] text-black cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          onClick={handleDeleteRow}
          disabled={!selectedRowId}
        >
          DELETE
        </button>
        <button
          className="bg-green-600 text-white px-6 py-2 rounded-full cursor-pointer"
          onClick={handleSaveChanges}
        >
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
}

export default Cakes

