import React, { useState, useEffect } from 'react'
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

const Cakes = () => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cakeToDelete, setCakeToDelete] = useState(null);
  const [cakeToEdit, setCakeToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'theme'
  const [themeFilter, setThemeFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [pendingImageFiles, setPendingImageFiles] = useState({});

  const [newCake, setNewCake] = useState({
    name: '',
    theme: '',
    description: '',
    tier: 1,
    price: '',
    cake_img: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    theme: '',
    description: '',
    tier: 1,
    price: '',
    cake_img: ''
  });


  // Fetch existing cakes
  useEffect(() => {
    fetchCakes();
  }, []);

  // Filter cakes when search term or filters change
  useEffect(() => {
    filterCakes();
  }, [rows, searchTerm, searchType, themeFilter, tierFilter]);

  const fetchCakes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('CAKE').select('*').order('name');
      if (error) {
        console.error('Error fetching cakes:', error);
        toast.error('Failed to fetch cakes');
      } else {
        console.log('Fetched cakes from database:', data);
        setRows(data || []);
      }
    } catch (error) {
      console.error('Error fetching cakes:', error);
      toast.error('Failed to fetch cakes');
    } finally {
      setLoading(false);
    }
  };

  const filterCakes = () => {
    let filtered = rows;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(cake => {
        switch (searchType) {
          case 'name':
            return cake.name?.toLowerCase().includes(searchLower);
          case 'theme':
            return cake.theme?.toLowerCase().includes(searchLower);
          case 'all':
          default:
            return cake.name?.toLowerCase().includes(searchLower) ||
              cake.theme?.toLowerCase().includes(searchLower) ||
              cake.description?.toLowerCase().includes(searchLower);
        }
      });
    }

    // Apply theme filter
    if (themeFilter) {
      filtered = filtered.filter(cake =>
        cake.theme?.toLowerCase().includes(themeFilter.toLowerCase())
      );
    }

    // Apply tier filter
    if (tierFilter) {
      filtered = filtered.filter(cake =>
        cake.tier?.toString() === tierFilter
      );
    }

    setFilteredRows(filtered);
  };


  const handleAddCake = () => {
    if (!newCake.name || !newCake.theme || !newCake.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      addCake(newCake);
    } catch (error) {
      console.error('Error adding cake:', error);
      toast.error('Failed to add cake');
    } finally {
      setSaving(false);
    }
  };

  const addCake = async (cake) => {
    try {
      const { error: insertError } = await supabase
        .from('CAKE')
        .insert([{
          name: cake.name,
          theme: cake.theme,
          description: cake.description,
          tier: parseInt(cake.tier) || 1,
          price: parseFloat(cake.price) || 0,
          cake_img: cake.cake_img || '',
        }]);

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error('Failed to add cake');
        return;
      }

      toast.success('Cake added successfully');
      setShowAddModal(false);
      setNewCake({ name: '', theme: '', description: '', tier: 1, price: '', cake_img: '' });
      fetchCakes();
    } catch (error) {
      console.error('Error adding cake:', error);
      toast.error('Failed to add cake');
    }
  };

  const handleEditCake = (cake) => {
    setCakeToEdit(cake);
    setEditFormData({
      name: cake.name,
      theme: cake.theme,
      description: cake.description || '',
      tier: cake.tier,
      price: cake.price.toString(),
      cake_img: cake.cake_img || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCake = async () => {
    if (!editFormData.name || !editFormData.theme || !editFormData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateCake(cakeToEdit.cake_id, editFormData);
    } catch (error) {
      console.error('Error updating cake:', error);
      toast.error('Failed to update cake');
    } finally {
      setSaving(false);
    }
  };

  const updateCake = async (cakeId, cake) => {
    try {
      const updateData = {
        name: cake.name,
        theme: cake.theme,
        description: cake.description,
        tier: parseInt(cake.tier) || 1,
        price: parseFloat(cake.price) || 0,
        cake_img: cake.cake_img || '',
      };

      const { error: updateError } = await supabase
        .from('CAKE')
        .update(updateData)
        .eq('cake_id', cakeId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error('Failed to update cake');
        return;
      }

      toast.success('Cake updated successfully');
      setShowEditModal(false);
      setCakeToEdit(null);
      fetchCakes();
    } catch (error) {
      console.error('Error updating cake:', error);
      toast.error('Failed to update cake');
    }
  };

  const handleDeleteCake = (cake) => {
    setCakeToDelete(cake);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!cakeToDelete) return;

    try {
      setSaving(true);

      // Delete from database first
      const { error: dbError } = await supabase
        .from('CAKE')
        .delete()
        .eq('cake_id', cakeToDelete.cake_id);

      if (dbError) {
        console.error("Database deletion error:", dbError);
        toast.error('Failed to delete cake');
        return;
      }

      // Delete the cake image from storage if it exists
      if (cakeToDelete?.cake_img) {
        try {
          let filePath = cakeToDelete.cake_img;

          if (cakeToDelete.cake_img.includes('/storage/v1/object/public/cake/')) {
            filePath = cakeToDelete.cake_img.split('/storage/v1/object/public/cake/')[1];
          } else if (cakeToDelete.cake_img.startsWith('http')) {
            const urlParts = cakeToDelete.cake_img.split('/cake/');
            if (urlParts.length > 1) {
              filePath = urlParts[1];
            }
          }

          if (filePath && filePath !== cakeToDelete.cake_img) {
            await supabase.storage
              .from('cake')
              .remove([filePath]);
          }
        } catch (storageError) {
          console.warn("Storage deletion error:", storageError);
        }
      }

      toast.success('Cake deleted successfully');
      setShowDeleteModal(false);
      setCakeToDelete(null);
      fetchCakes();
    } catch (error) {
      console.error('Error deleting cake:', error);
      toast.error('Failed to delete cake');
    } finally {
      setSaving(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCakeToDelete(null);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setCakeToEdit(null);
    setEditFormData({ name: '', theme: '', description: '', tier: 1, price: '', cake_img: '' });
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toFixed(2)}`;
  };

  // Get unique themes and tiers for filter options
  const uniqueThemes = [...new Set(rows.map(row => row.theme).filter(Boolean))];
  const uniqueTiers = [...new Set(rows.map(row => row.tier).filter(Boolean))].sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Cakes Management</h1>
          <p className="text-gray-600">Manage your cake catalog and designs</p>
        </div>

        <button
          className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={() => setShowAddModal(true)}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Cake
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
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
                placeholder="Search cakes..."
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
              <option value="theme">Theme Only</option>
            </select>
          </div>

          {/* Theme Filter */}
          <div className="flex gap-2">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
            >
              <option value="">All Themes</option>
              {uniqueThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex gap-2">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
            >
              <option value="">All Tiers</option>
              {uniqueTiers.map((tier) => (
                <option key={tier} value={tier}>
                  {tier} Tier{tier > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cakes Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Cake Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Theme</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Tier</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Price</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Image</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AF524D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading cakes...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <p className="text-gray-600 text-lg">
                      {searchTerm || themeFilter || tierFilter ? 'No matching cakes found' : 'No cakes available'}
                    </p>
                    <p className="text-sm">
                      {searchTerm || themeFilter || tierFilter ? 'Try adjusting your search terms' : 'Click "Add New Cake" to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((cake) => (
                  <tr key={cake.cake_id} className="hover:bg-gray-100 transition-colors duration-200">
                    {/* Cake Name Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {cake.name}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {cake.description}
                        </p>
                      </div>
                    </td>

                    {/* Theme Column */}
                    <td className="py-6 px-6 align-middle">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#AF524D]/10 text-[#AF524D]">
                        {cake.theme}
                      </span>
                    </td>

                    {/* Tier Column */}
                    <td className="py-6 px-6 align-middle">
                      <span className="text-lg font-semibold text-gray-900">
                        {cake.tier}
                      </span>
                    </td>

                    {/* Price Column */}
                    <td className="py-6 px-6 align-middle">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(cake.price)}
                      </span>
                    </td>

                    {/* Image Column */}
                    <td className="py-6 px-6 align-middle">
                      {cake.cake_img ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 bg-green-50 flex items-center justify-center">
                          <img
                            src={getPublicImageUrl(cake.cake_img)}
                            alt="Cake"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-6 px-6 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCake(cake)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          disabled={saving}
                          title="Edit cake"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCake(cake)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={saving}
                          title="Delete cake"
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

      {/* Add Cake Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">Add New Cake</h3>

            <div className="space-y-4">
              {/* Cake Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cake Name *
                </label>
                <input
                  type="text"
                  value={newCake.name}
                  onChange={(e) => setNewCake(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter cake name..."
                />
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Theme *
                </label>
                <input
                  type="text"
                  value={newCake.theme}
                  onChange={(e) => setNewCake(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter cake theme..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCake.description}
                  onChange={(e) => setNewCake(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 resize-none"
                  placeholder="Enter cake description..."
                  rows={3}
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tier
                </label>
                <select
                  value={newCake.tier}
                  onChange={(e) => setNewCake(prev => ({ ...prev, tier: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                >
                  <option value={1}>1 Tier</option>
                  <option value={2}>2 Tiers</option>
                  <option value={3}>3 Tiers</option>
                  <option value={4}>4 Tiers</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  value={newCake.price}
                  onChange={(e) => setNewCake(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter price..."
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCake({ name: '', theme: '', description: '', tier: 1, price: '', cake_img: '' });
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCake}
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
                  'Add Cake'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cake Modal */}
      {showEditModal && cakeToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-blue-200 shadow-2xl">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">Edit Cake</h3>

            <div className="space-y-4">
              {/* Cake Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cake Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter cake name..."
                />
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Theme *
                </label>
                <input
                  type="text"
                  value={editFormData.theme}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter cake theme..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 resize-none"
                  placeholder="Enter cake description..."
                  rows={3}
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tier
                </label>
                <select
                  value={editFormData.tier}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tier: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                >
                  <option value={1}>1 Tier</option>
                  <option value={2}>2 Tiers</option>
                  <option value={3}>3 Tiers</option>
                  <option value={4}>4 Tiers</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                  placeholder="Enter price..."
                  min="0"
                  step="0.01"
                />
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
                onClick={handleUpdateCake}
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
                  'Update Cake'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && cakeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-red-200 shadow-2xl">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Cake</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this cake? This action cannot be undone.
              </p>

              {/* Cake Details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {cakeToDelete.name}
                  </h4>
                  <span className="px-2 py-1 bg-[#AF524D]/10 text-[#AF524D] text-xs font-medium rounded-full">
                    {cakeToDelete.theme}
                  </span>
                </div>

                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Tier:</span> {cakeToDelete.tier}
                </p>

                <p className="text-gray-600">
                  <span className="font-medium">Price:</span> {formatPrice(cakeToDelete.price)}
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
}

export default Cakes

