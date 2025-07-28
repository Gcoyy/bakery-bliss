import React, { useState } from 'react'

const Cakes = () => {
  const [rows, setRows] = useState([
    {
      id: 1,
      name: "Chocolate Dream",
      theme: "Birthday",
      description: "Rich chocolate cake with chocolate frosting",
      tiers: 2,
      price: 1000,
      image: "cake1.jpg"
    },
    {
      id: 2,
      name: "Vanilla Sky",
      theme: "Wedding",
      description: "Elegant vanilla cake with white frosting",
      tiers: 3,
      price: 2500,
      image: "cake2.jpg"
    },
    {
      id: 3,
      name: "Strawberry Delight",
      theme: "Birthday",
      description: "Fresh strawberry cake with cream filling",
      tiers: 1,
      price: 800,
      image: "cake3.jpg"
    }
  ]);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedName, setEditedName] = useState("");
  const [editedTheme, setEditedTheme] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTiers, setEditedTiers] = useState("");
  const [editedPrice, setEditedPrice] = useState("");

  const handleSelectRow = (id) => {
    setSelectedRowId((prevId) => (prevId === id ? null : id));
  };

  const handleFieldChange = (id, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleAddRow = () => {
    const newId = Date.now();
    setRows([
      ...rows,
      {
        id: newId,
        name: "New Cake",
        theme: "Theme",
        description: "Description",
        tiers: 1,
        price: 0,
        image: "placeholder.jpg"
      },
    ]);
  };

  const handleDeleteRow = () => {
    if (!selectedRowId) return;
    setRows(rows.filter((row) => row.id !== selectedRowId));
    setSelectedRowId(null);
  };

  const handleSaveChanges = () => {
    // Update rows with edited values
    const updatedRows = rows.map(row => {
      const edited = editedValues[row.id] || {};
      return {
        ...row,
        ...edited
      };
    });
    setRows(updatedRows);
    setEditedValues({});
    setEditingField({ id: null, field: null });
    setSelectedRowId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen">
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Cakes</h1>
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
            {rows.map((row) => {
              const isSelected = selectedRowId === row.id;
              const edited = editedValues[row.id] || {};
              const isEditingName = editingField.id === row.id && editingField.field === "name";
              const isEditingTheme = editingField.id === row.id && editingField.field === "theme";
              const isEditingDescription = editingField.id === row.id && editingField.field === "description";
              const isEditingTiers = editingField.id === row.id && editingField.field === "tiers";
              const isEditingPrice = editingField.id === row.id && editingField.field === "price";

              return (
                <tr
                  key={row.id}
                  className={`border-t text-sm cursor-pointer ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleSelectRow(row.id)}
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-32"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.id, "name", editedName);
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
                              setEditingField({ id: row.id, field: "name" });
                              setEditedName(edited.name ?? row.name);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {isEditingTheme ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-24"
                          value={editedTheme}
                          onChange={(e) => setEditedTheme(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.id, "theme", editedTheme);
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
                              setEditingField({ id: row.id, field: "theme" });
                              setEditedTheme(edited.theme ?? row.theme);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {isEditingDescription ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-32"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.id, "description", editedDescription);
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
                              setEditingField({ id: row.id, field: "description" });
                              setEditedDescription(edited.description ?? row.description);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {isEditingTiers ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-16"
                          value={editedTiers}
                          onChange={(e) => setEditedTiers(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.id, "tiers", parseInt(editedTiers));
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {edited.tiers ?? row.tiers}
                          <span
                            className="cursor-pointer hover:text-blue-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.id, field: "tiers" });
                              setEditedTiers(edited.tiers ?? row.tiers);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      {isEditingPrice ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          onBlur={() => {
                            handleFieldChange(row.id, "price", parseInt(editedPrice));
                            setEditingField({ id: null, field: null });
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          ₱{edited.price ?? row.price}
                          <span
                            className="cursor-pointer hover:text-blue-700 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: row.id, field: "price" });
                              setEditedPrice(edited.price ?? row.price);
                            }}
                          >
                            <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Image</span>
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
