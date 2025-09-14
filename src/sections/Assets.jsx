import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Centralized folder mapping function
const getFolderName = (assetType) => {
  const folderMap = {
    'cake base': 'cake base',
    'icing': 'icing',
    'topping': 'topping'
  };
  return folderMap[assetType] || 'misc';
};

const getPublicImageUrl = (path, assetType = null) => {
  if (!path) return null;

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a file path, generate the public URL
  let fullPath = path;

  // If the path doesn't contain a folder and we have an asset type, add the folder
  if (!path.includes('/') && assetType) {
    const folderName = getFolderName(assetType);
    if (folderName !== 'misc') {
      fullPath = `${folderName}/${path}`;
    }
  }

  const publicUrl = supabase.storage.from("asset").getPublicUrl(fullPath).data.publicUrl;
  return publicUrl;
};

const Assets = () => {
  const { session } = UserAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState('all'); // 'all', 'src', 'type'
  const [currentAdminId, setCurrentAdminId] = useState(null);

  const [newAsset, setNewAsset] = useState({
    src: '',
    type: 'cake base'
  });

  const [editFormData, setEditFormData] = useState({
    src: '',
    type: 'cake base'
  });

  // Asset types for dropdown
  const assetTypes = [
    'cake base',
    'icing',
    'topping'
  ];

  // Fetch current admin ID
  useEffect(() => {
    const fetchAdminId = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('ADMIN')
        .select('admin_id')
        .eq('admin_uid', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching admin ID:', error);
      } else {
        setCurrentAdminId(data.admin_id);
      }
    };

    fetchAdminId();
  }, [session]);

  // Fetch existing assets
  useEffect(() => {
    fetchAssets();
  }, []);

  // Filter assets when search term or search type changes
  useEffect(() => {
    filterAssets();
  }, [rows, searchTerm, searchType]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ASSET')
        .select('*')
        .order('asset_id');

      if (error) {
        console.error('Error fetching assets:', error);
        toast.error('Failed to fetch assets');
      } else {
        const mapped = data.map((asset) => {
          const publicUrl = getPublicImageUrl(asset.src, asset.type);
          return {
            asset_id: asset.asset_id,
            src: asset.src,
            src_url: publicUrl,
            type: asset.type,
            admin_id: asset.admin_id,
          };
        });
        setRows(mapped);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    if (!searchTerm.trim()) {
      setFilteredRows(rows);
      return;
    }

    const filtered = rows.filter(asset => {
      const searchLower = searchTerm.toLowerCase();

      switch (searchType) {
        case 'src':
          return asset.src?.toLowerCase().includes(searchLower);
        case 'type':
          return asset.type?.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return asset.src?.toLowerCase().includes(searchLower) ||
            asset.type?.toLowerCase().includes(searchLower);
      }
    });

    setFilteredRows(filtered);
  };

  const handleAddAsset = () => {
    setNewAsset({
      src: '',
      type: 'cake base'
    });
    setShowAddModal(true);
  };

  const handleEditAsset = (asset) => {
    setAssetToEdit(asset);
    setEditFormData({
      src: asset.src,
      type: asset.type
    });
    setShowEditModal(true);
  };

  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      setSaving(true);

      // Delete from database
      const { error: dbError } = await supabase
        .from('ASSET')
        .delete()
        .eq('asset_id', assetToDelete.asset_id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        toast.error(`Failed to delete asset: ${dbError.message}`);
        return;
      }

      // Delete the file from storage if it exists
      if (assetToDelete?.src) {
        try {
          let filePath = assetToDelete.src;

          // If it's a full URL, extract just the path part
          if (assetToDelete.src.includes('/storage/v1/object/public/asset/')) {
            filePath = assetToDelete.src.split('/storage/v1/object/public/asset/')[1];
          } else if (assetToDelete.src.startsWith('http')) {
            const urlParts = assetToDelete.src.split('/asset/');
            if (urlParts.length > 1) {
              filePath = urlParts[1];
            }
          }

          const { error: storageError } = await supabase.storage
            .from('asset')
            .remove([filePath]);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Don't fail the entire operation, just log the error
          }
        } catch (error) {
          console.error('Error deleting file from storage:', error);
          // Don't fail the entire operation
        }
      }

      toast.success('Asset deleted successfully');
      setShowDeleteModal(false);
      setAssetToDelete(null);
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsset = async () => {
    if (!editFormData.src || !editFormData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      if (assetToEdit) {
        // Update existing asset
        const { error } = await supabase
          .from('ASSET')
          .update({
            src: editFormData.src,
            type: editFormData.type
          })
          .eq('asset_id', assetToEdit.asset_id);

        if (error) {
          console.error('Error updating asset:', error);
          toast.error('Failed to update asset');
          return;
        }

        toast.success('Asset updated successfully');
        setShowEditModal(false);
      } else {
        // Create new asset
        const { error } = await supabase
          .from('ASSET')
          .insert({
            src: editFormData.src,
            type: editFormData.type,
            admin_id: currentAdminId
          });

        if (error) {
          console.error('Error creating asset:', error);
          toast.error('Failed to create asset');
          return;
        }

        toast.success('Asset created successfully');
        setShowAddModal(false);
      }

      setAssetToEdit(null);
      setEditFormData({ src: '', type: 'cake base' });
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setAssetToEdit(null);
    setEditFormData({ src: '', type: 'cake base' });
    setShowAddModal(false);
    setShowEditModal(false);
  };

  // Get unique types for filter options
  const uniqueTypes = [...new Set(rows.map(row => row.type).filter(Boolean))];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AF524D] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Assets Management</h1>
          <p className="text-gray-600">Manage your custom cake assets and decorations</p>
        </div>

        <button
          className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={() => setShowAddModal(true)}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Asset
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
                placeholder="Search assets..."
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
              <option value="src">Source</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/3">Preview</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/3">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8">
                    <p className="text-gray-600 text-lg">
                      {searchTerm ? 'No matching assets found' : 'No assets available'}
                    </p>
                    <p className="text-sm">
                      {searchTerm ? 'Try adjusting your search terms' : 'Click "Add New Asset" to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-gray-100 transition-colors duration-200">
                    {/* Preview Column */}
                    <td className="py-6 px-6 align-middle">
                      {asset.src_url ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 bg-green-50 flex items-center justify-center">
                          <img
                            src={asset.src_url}
                            alt="Asset preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Type Column */}
                    <td className="py-6 px-6 align-middle">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#AF524D]/10 text-[#AF524D]">
                        {asset.type.charAt(0).toUpperCase() + asset.type.slice(1).replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-6 px-6 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAsset(asset)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          disabled={saving}
                          title="Edit asset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={saving}
                          title="Delete asset"
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

      {/* Add/Edit Asset Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
            <h3 className="text-2xl font-bold text-[#381914] mb-6">
              {assetToEdit ? 'Edit Asset' : 'Add New Asset'}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                >
                  {assetTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Image *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditFormData(prev => ({ ...prev, src: file.name }));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#AF524D] hover:bg-[#AF524D]/5 transition-all duration-200 group"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400 group-hover:text-[#AF524D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 group-hover:text-[#AF524D] transition-colors">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                    </div>
                  </label>
                </div>
                {editFormData.src && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Selected file:</span> {editFormData.src}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${saving
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#AF524D] text-white hover:bg-[#8B3A3A] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                {saving ? 'Saving...' : (assetToEdit ? 'Update Asset' : 'Add Asset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-red-200 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Asset</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this asset? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssetToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;