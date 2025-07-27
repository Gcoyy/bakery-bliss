import { useState } from 'react';

const Inventory = () => {
  const [rows, setRows] = useState([
    { name: "Flour", id: "0000-0001", quantity: "01", updated: "01-01-2025" },
    { name: "Flour", id: "0000-0002", quantity: "02", updated: "01-01-2025" },
    { name: "Flour", id: "0000-0003", quantity: "03", updated: "01-01-2025" },
  ]);

  const [selectedRowId, setSelectedRowId] = useState(null)

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        name: "New Item",
        id: `0000-000${rows.length + 1}`,
        quantity: "00",
        updated: "01-01-2025",
      },
    ]);
  };

  const handleDeleteRow = () => {
    if (selectedRowId) {
      setRows(rows.filter((row) => row.id !== selectedRowId));
      setSelectedRowId(null);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRowId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen">
      {/* Header & Filters */}
      <div className="flex gap-4 items-center mb-6">
        <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Inventory</h1>
        <div className="flex space-x-4 mb-4">
          {[1, 2, 3].map((_, i) => (
            <select
              key={i}
              className="px-4 py-2 border rounded-full text-sm bg-gray-100"
            >
              <option>Choose Filter...</option>
            </select>
          ))}
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border rounded text-sm bg-gray-100 flex-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full h-[75%] overflow-y-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              {['Item Name', 'Item ID', 'Quantity', 'Last Updated'].map((heading, i) => (
                <th key={i} className="text-left py-2 px-4 text-sm font-semibold w-1/4">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedRowId === row.id;
              return (
                <tr
                  key={row.id}
                  className={`border-t text-sm cursor-pointer ${
                    isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelectRow(row.id)}
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {row.name}
                      <span className="cursor-pointer hover:text-blue-700">
                        <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">{row.id}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {row.quantity}
                      <span className="cursor-pointer hover:text-blue-700">
                        <svg width="3vw" height="3vh" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.375 11.375H9.75C8.88805 11.375 8.0614 11.7174 7.4519 12.3269C6.84241 12.9364 6.5 13.763 6.5 14.625V29.25C6.5 30.112 6.84241 30.9386 7.4519 31.5481C8.0614 32.1576 8.88805 32.5 9.75 32.5H24.375C25.237 32.5 26.0636 32.1576 26.6731 31.5481C27.2826 30.9386 27.625 30.112 27.625 29.25V27.625" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M26 8.12517L30.875 13.0002M33.1256 10.7008C33.7656 10.0608 34.1252 9.19277 34.1252 8.28767C34.1252 7.38258 33.7656 6.51455 33.1256 5.87455C32.4856 5.23455 31.6176 4.875 30.7125 4.875C29.8074 4.875 28.9394 5.23455 28.2994 5.87455L14.625 19.5002V24.3752H19.5L33.1256 10.7008Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {row.updated}
                      <span>
                        <img src="/clock.svg" alt="" />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full cursor-pointer"
          onClick={handleAddRow}
        >
          ADD
        </button>
        <button
          className={`px-6 py-2 rounded-full ${
            selectedRowId ? 'bg-[#D9D9D9] text-black cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleDeleteRow}
          disabled={!selectedRowId}
        >
          DELETE
        </button>
        <button
          className="bg-gray-400 text-white px-6 py-2 rounded-full cursor-not-allowed"
          disabled
        >
          SAVE CHANGES
        </button>
      </div>
    </div>
  );
};

export default Inventory;
