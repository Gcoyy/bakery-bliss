import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const Cakes = () => {
  const [rows, setRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedName, setEditedName] = useState('');
  const [editedTheme, setEditedTheme] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedTier, setEditedTier] = useState('');
  const [uploadingImage, setUploadingImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [editingDescriptionRowId, setEditingDescriptionRowId] = useState(null);
  const [tempDescription, setTempDescription] = useState("");
  const [saving, setSaving] = useState(false);
  // Add filter states
  const [themeFilter, setThemeFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");


  useEffect(() => {
    const fetchCakes = async () => {
      const { data, error } = await supabase.from('CAKE').select('*').order('name');
      if (error) {
        console.error('Error fetching cakes:', error);
      } else {
        console.log('Fetched cakes from database:', data);
        setRows(data || []);
      }
    };
    fetchCakes();
  }, []);


  const handleSelectRow = (id) => {
    setSelectedRowId((prevId) => (prevId === id ? null : id));
  };

  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    setNewRows([
      ...newRows,
      {
        id: newId,
        name: 'New Cake',
        theme: 'Theme',
        description: 'Description',
        tier: 1,
        price: 0,
        cake_img: '', // Use empty string instead of null
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      setNewRows(newRows.filter((row) => row.id !== selectedRowId));
    } else {
      try {
        const { error } = await supabase
          .from('CAKE')
          .delete()
          .eq('cake_id', selectedRowId); // Use cake_id consistently

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
    console.log(`handleFieldChange called: id=${id}, field=${field}, value=${value}`);

    // Convert numerical fields to proper types
    let processedValue = value;
    if (field === 'tier') {
      processedValue = parseInt(value) || 1;
    } else if (field === 'price') {
      processedValue = parseFloat(value) || 0;
    }

    // Check if this is a new row (starts with "new-")
    const isNewRow = id && id.toString().startsWith("new-");

    if (isNewRow) {
      setNewRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: processedValue } : r))
      );
    } else {
      // This is an existing row
      setEditedValues((prev) => {
        const newEditedValues = {
          ...prev,
          [id]: {
            ...prev[id],
            [field]: processedValue,
          },
        };
        console.log(`Updated editedValues for ID ${id}:`, newEditedValues[id]);
        return newEditedValues;
      });
    }
  };

  const handleDescriptionEdit = (rowId, currentDescription) => {
    setEditingDescriptionRowId(rowId);
    setTempDescription(currentDescription);
    setShowDescriptionModal(true);
  };

  const handleDescriptionSave = () => {
    if (editingDescriptionRowId) {
      handleFieldChange(editingDescriptionRowId, "description", tempDescription);
      setShowDescriptionModal(false);
      setEditingDescriptionRowId(null);
      setTempDescription("");
    }
  };

  const handleDescriptionCancel = () => {
    setShowDescriptionModal(false);
    setEditingDescriptionRowId(null);
    setTempDescription("");
  };

  const handleImageUpload = async (event, rowId) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setUploadingImage(rowId);

        // Get the cake name for the filename
        const row = [...rows, ...newRows].find(r => r.cake_id === rowId || r.id === rowId);
        const cakeName = row?.name || 'cake';

        // Generate filename using cake name
        const fileExt = file.name.split('.').pop();
        const sanitizedName = cakeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `${sanitizedName}_${Date.now()}.${fileExt}`;

        // Upload to Supabase storage bucket 'cake'
        const { error } = await supabase.storage
          .from('cake')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading image:', error);
          setUploadingImage(null);
          return;
        }

        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('cake')
          .getPublicUrl(fileName);

        // Update the field with the image URL
        handleFieldChange(rowId, "cake_img", publicUrl);
        setUploadingImage(null);

        console.log('Image uploaded successfully:', publicUrl);
        console.log('Stored URL in database:', publicUrl);
        toast.success('Image uploaded successfully!', {
          duration: 2000,
          position: 'top-center',
        });
      } catch (error) {
        console.error('Error in image upload:', error);
        setUploadingImage(null);
        toast.error('Failed to upload image. Please try again.', {
          duration: 4000,
          position: 'top-center',
        });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (saving) return; // Prevent multiple clicks

    setSaving(true);

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
              cake_img: newRow.cake_img || '', // Provide default empty string if null
            },
          ]);

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error(`Failed to save cake "${newRow.name}": ${insertError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          console.log(`Successfully inserted new cake: "${newRow.name}"`);
        }
      } catch (error) {
        console.error("Error processing new cake:", error);
      }
    }

    // Save updated rows (UPDATE operations)
    console.log("All editedValues before processing:", editedValues);
    for (const [id, values] of Object.entries(editedValues)) {
      console.log(`Processing edited cake ${id}:`, values);

      if (!id || id === 'undefined') {
        console.warn("Skipping row with invalid ID:", id);
        continue;
      }

      // Find the original row to preserve unchanged values
      const originalRow = rows.find(row => row.cake_id === parseInt(id) || row.cake_id === id);
      console.log(`Original row for ID ${id}:`, originalRow);

      try {
        const updateData = {
          name: values.name !== undefined ? values.name : originalRow?.name,
          theme: values.theme !== undefined ? values.theme : originalRow?.theme,
          description: values.description !== undefined ? values.description : originalRow?.description,
          tier: values.tier !== undefined ? (parseInt(values.tier) || 1) : originalRow?.tier,
          price: values.price !== undefined ? (parseFloat(values.price) || 0) : originalRow?.price,
          // Preserve existing cake_img if not explicitly changed
          cake_img: values.cake_img !== undefined ? values.cake_img : (originalRow?.cake_img || ''),
        };

        console.log(`Update data for cake ID ${id}:`, updateData);

        const { error: updateError } = await supabase
          .from('CAKE')
          .update(updateData)
          .eq('cake_id', id);

        if (updateError) {
          console.error(`Update error for cake ID ${id}:`, updateError);
          toast.error(`Failed to update cake: ${updateError.message}`, {
            duration: 4000,
            position: 'top-center',
          });
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

    // Show success notification
    toast.success('Cakes saved successfully!', {
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


  // Filter rows based on search term
  const filteredRows = [...rows, ...newRows].filter((row) => {
    const name = row.name || "";
    const theme = row.theme || "";
    const tier = row.tier || 1;

    const matchesName = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = themeFilter === "" || theme.toLowerCase().includes(themeFilter.toLowerCase());
    const matchesTier = tierFilter === "" || tier.toString() === tierFilter;

    return matchesName && matchesTheme && matchesTier;
  });

  // Get unique themes and tiers for filter options
  const uniqueThemes = [...new Set([...rows, ...newRows].map(row => row.theme).filter(Boolean))];
  const uniqueTiers = [...new Set([...rows, ...newRows].map(row => row.tier).filter(Boolean))].sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Cakes</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Theme Filter */}
          <div className="relative">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Themes</option>
              {uniqueThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
            {/* Filter Icon */}
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {/* Dropdown Arrow */}
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Tier Filter */}
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Tiers</option>
              {uniqueTiers.map((tier) => (
                <option key={tier} value={tier}>
                  {tier} Tier{tier > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            {/* Filter Icon */}
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {/* Dropdown Arrow */}
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Search Bar */}
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

      <div className="flex-1 overflow-y-auto">
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
              // Handle both new rows (id) and existing rows (cake_id)
              const rowId = row.cake_id || row.id;
              const isSelected = selectedRowId === rowId;
              const edited = editedValues[rowId] || {};
              const isEditingName =
                editingField.id === rowId && editingField.field === "name";
              console.log({
                rowId: rowId,
                selected: selectedRowId === rowId,
                editing: editingField.id === rowId,
              });

              return (
                <tr
                  key={rowId}
                  className={`border-t text-sm cursor-pointer ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => handleSelectRow(rowId)}
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
                            handleFieldChange(rowId, "name", editedName);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="flex-grow truncate">
                            {edited.name ?? row.name}
                          </div>
                          <span
                            className="cursor-pointer hover:text-blue-700 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: rowId, field: "name" });
                              setEditedName(edited.name ?? row.name);
                            }}
                          >
                            <svg key={`edit-name-${rowId}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {editingField.id === rowId && editingField.field === "theme" ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-20"
                          value={editedTheme}
                          onChange={(e) => setEditedTheme(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(rowId, "theme", editedTheme);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="flex-grow truncate">
                            {edited.theme ?? row.theme}
                          </div>
                          <span
                            className="cursor-pointer hover:text-blue-700 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: rowId, field: "theme" });
                              setEditedTheme(edited.theme ?? row.theme);
                            }}
                          >
                            <svg key={`edit-theme-${rowId}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <div className="flex-grow truncate">
                        {edited.description ?? row.description}
                      </div>
                      <span
                        className="cursor-pointer hover:text-blue-700 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescriptionEdit(rowId, edited.description ?? row.description);
                        }}
                      >
                        <svg key={`edit-description-${rowId}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {editingField.id === rowId && editingField.field === "tier" ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-16"
                          value={editedTier}
                          onChange={(e) => setEditedTier(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(rowId, "tier", parseInt(editedTier) || 1);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="truncate">
                            {edited.tier ?? row.tier}
                          </div>
                          <span
                            className="cursor-pointer hover:text-blue-700 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: rowId, field: "tier" });
                              setEditedTier(edited.tier ?? row.tier);
                            }}
                          >
                            <svg key={`edit-tier-${rowId}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {editingField.id === rowId && editingField.field === "price" ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-16"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(rowId, "price", parseFloat(editedPrice) || 0);
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="truncate">
                            ₱{edited.price ?? row.price}
                          </div>
                          <span
                            className="cursor-pointer hover:text-blue-700 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: rowId, field: "price" });
                              setEditedPrice(edited.price ?? row.price);
                            }}
                          >
                            <svg key={`edit-price-${rowId}`} width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="relative">
                      {uploadingImage === rowId ? (
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
                                onChange={(e) => handleImageUpload(e, rowId)}
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
                              onChange={(e) => handleImageUpload(e, rowId)}
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

      {/* Description Edit Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-gray/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md border-4 border-[#AF524D] shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-[#381914]">Edit Description</h3>
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
              placeholder="Enter cake description..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleDescriptionCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDescriptionSave}
                className="px-4 py-2 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3D3A] transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cakes

