import React from 'react'

const Inventory = () => {
  return (
        <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D]">
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  {['Item Name', 'Item ID', 'Quantity', 'Last Updated'].map((heading, i) => (
                    <th key={i} className="text-left py-2 px-4 text-sm font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-t text-sm">
                    <td className="py-2 px-4 flex items-center gap-2">
                      Flour <span className="cursor-pointer">✏️</span>
                    </td>
                    <td className="py-2 px-4">0000-0001</td>
                    <td className="py-2 px-4 flex items-center gap-2">
                      01 <span className="cursor-pointer">✏️</span>
                    </td>
                    <td className="py-2 px-4 flex items-center gap-2">
                      01-01-2025 <span className="cursor-pointer">🔄</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-4">
            <button className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full">ADD</button>
            <button className="bg-[#D9D9D9] text-black px-6 py-2 rounded-full">DELETE</button>
            <button className="bg-gray-400 text-white px-6 py-2 rounded-full cursor-not-allowed" disabled>
              SAVE CHANGES
            </button>
          </div>
        </div>
  )
}

export default Inventory
