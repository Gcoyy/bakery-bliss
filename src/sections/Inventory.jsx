import { useState } from 'react';
const Inventory = () => {
  const [rows, setRows] = useState([
    { name: "Flour", id: "0000-0001", quantity: "01", updated: "01-01-2025" },
    { name: "Flour", id: "0000-0002", quantity: "02", updated: "01-01-2025" },
    { name: "Flour", id: "0000-0003", quantity: "03", updated: "01-01-2025" },
    
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      { name: "New Item", id: `0000-000${rows.length + 1}`, quantity: "00", updated: "01-01-2025" }
    ]);
  };

  return (
        <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen">
          <div className='flex gap-4 items-center mb-6'>
            <h1 className="text-3xl font-semibold mb-4 text-[#381914]">Inventory</h1>

            {/* Filters */}
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
      {rows.map((row, i) => (
  <tr key={i} className="border-t text-sm">
    <td className="py-2 px-4">
      <div className="flex items-center gap-2">
        {row.name}
        <span className="cursor-pointer">
          <img className='w-5 h-auto' src="edit.svg" alt="" />
        </span>
      </div>
    </td>
    <td className="py-2 px-4">{row.id}</td>
    <td className="py-2 px-4">
      <div className="flex items-center gap-2">
        {row.quantity}
        <span className="cursor-pointer"><img className='w-5 h-auto' src="edit.svg" alt="" /></span>
      </div>
    </td>
    <td className="py-2 px-4">
      <div className="flex items-center gap-2">
        {row.updated}
        <span className="cursor-pointer">🔄</span>
      </div>
    </td>
  </tr>
))}

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
            <button className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full">DELETE</button>
            <button className="bg-gray-400 text-white px-6 py-2 rounded-full cursor-not-allowed" disabled>
              SAVE CHANGES
            </button>
          </div>
        </div>
  )
}

export default Inventory
