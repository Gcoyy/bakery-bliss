import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const getPublicImageUrl = (path, assetType = null) => {
  console.log('🔗 getPublicImageUrl called with path:', path, 'and type:', assetType);

  if (!path) {
    console.log('❌ No path provided, returning null');
    return null;
  }

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('✅ Path is already a full URL:', path);
    return path;
  }

  // If it's a file path, generate the public URL
  // Check if the path already includes a folder structure
  let fullPath = path;

  // If the path doesn't contain a folder and we have an asset type, add the folder
  if (!path.includes('/') && assetType) {
    const folderMap = {
      'cake base': 'cake base',
      'icing': 'icing',
      'topping': 'topping'
    };

    const folderName = folderMap[assetType];
    if (folderName) {
      fullPath = `${folderName}/${path}`;
      console.log('📁 Added folder to path:', fullPath);
    }
  }

  const publicUrl = supabase.storage.from("asset").getPublicUrl(fullPath).data.publicUrl;
  console.log('🔄 Generated public URL:', publicUrl);
  return publicUrl;
};

const Assets = () => {
  const [rows, setRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingField, setEditingField] = useState({ id: null, field: null });
  const [editedValues, setEditedValues] = useState({});
  const [editedSrc, setEditedSrc] = useState("");
  const [editedType, setEditedType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssetForUpload, setSelectedAssetForUpload] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Asset types for dropdown (matching your database)
  const assetTypes = [
    'cake base',
    'icing',
    'topping'
  ];

  // Fetch existing assets
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 Fetching assets from database...');
      const { data, error } = await supabase
        .from('ASSET')
        .select('*')
        .order('asset_id');

      if (error) {
        console.error('❌ Database error:', error);
        toast.error('Failed to fetch assets');
      } else {
        console.log('✅ Raw data from database:', data);
        const mapped = data.map((asset) => {
          const publicUrl = getPublicImageUrl(asset.src, asset.type);
          console.log(`🖼️ Asset ${asset.asset_id}:`, {
            originalSrc: asset.src,
            publicUrl: publicUrl,
            type: asset.type
          });
          return {
            asset_id: asset.asset_id,
            src: asset.src,
            src_url: publicUrl,
            type: asset.type,
            admin_id: asset.admin_id,
          };
        });
        console.log('📋 Mapped rows:', mapped);
        setRows(mapped);
      }
    };

    fetchData();
  }, []);

  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    setNewRows([
      ...newRows,
      {
        asset_id: newId,
        src: "",
        src_url: null,
        type: "cake base",
        admin_id: null, // You might want to set this to current admin ID
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async () => {
    if (!selectedRowId) return;

    const isNew = selectedRowId.toString().startsWith("new-");
    if (isNew) {
      setNewRows(newRows.filter((row) => row.asset_id !== selectedRowId));
    } else {
      try {
        const { error } = await supabase
          .from('ASSET')
          .delete()
          .eq('asset_id', selectedRowId);

        if (error) {
          console.error("Error deleting asset:", error);
          toast.error("Failed to delete asset");
        } else {
          setRows(rows.filter((row) => row.asset_id !== selectedRowId));
          setSelectedRowId(null);
          toast.success("Asset deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting asset:", error);
        toast.error("Failed to delete asset");
      }
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      // Save new rows
      for (const newRow of newRows) {
        const { error } = await supabase
          .from('ASSET')
          .insert({
            src: newRow.src,
            type: newRow.type,
            admin_id: newRow.admin_id,
          });

        if (error) {
          console.error("Error inserting new asset:", error);
          toast.error("Failed to save new asset");
          setSaving(false);
          return;
        }
      }

      // Update existing rows
      for (const [assetId, changes] of Object.entries(editedValues)) {
        if (assetId.toString().startsWith("new-")) continue;

        const updateData = {};

        if (changes.src !== undefined) updateData.src = changes.src;
        if (changes.type !== undefined) updateData.type = changes.type;

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('ASSET')
            .update(updateData)
            .eq('asset_id', assetId);

          if (error) {
            console.error("Error updating asset:", error);
            toast.error("Failed to update asset");
            setSaving(false);
            return;
          }
        }
      }

      // Refresh data
      const { data, error } = await supabase
        .from('ASSET')
        .select('*')
        .order('asset_id');

      if (error) {
        console.error("Error refreshing data:", error);
      } else {
        const mapped = data.map((asset) => ({
          asset_id: asset.asset_id,
          src: asset.src,
          src_url: getPublicImageUrl(asset.src, asset.type),
          type: asset.type,
          admin_id: asset.admin_id,
        }));
        setRows(mapped);
      }

      setNewRows([]);
      setEditedValues({});
      setSelectedRowId(null);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRowId(id);
  };

  const handleFieldChange = (id, field, value) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedAssetForUpload) return;

    setUploading(true);
    try {
      // Get the asset type to determine the correct folder
      const asset = rows.find(row => row.asset_id === selectedAssetForUpload);
      const assetType = asset?.type || 'misc';

      // Map asset types to folder names
      const folderMap = {
        'cake base': 'cake base',
        'icing': 'icing',
        'topping': 'topping'
      };

      const folderName = folderMap[assetType] || 'misc';

      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `asset_${selectedAssetForUpload}_${Date.now()}.${fileExt}`;
      const filePath = `${folderName}/${fileName}`;

      const { error } = await supabase.storage
        .from('asset')
        .upload(filePath, uploadFile);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('asset')
        .getPublicUrl(filePath);

      // Update the asset with new src
      const { error: updateError } = await supabase
        .from('ASSET')
        .update({ src: publicUrl })
        .eq('asset_id', selectedAssetForUpload);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setRows(rows.map(row =>
        row.asset_id === selectedAssetForUpload
          ? { ...row, src: publicUrl, src_url: publicUrl }
          : row
      ));

      toast.success('Asset uploaded successfully');
      setShowUploadModal(false);
      setSelectedAssetForUpload(null);
      setUploadFile(null);
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
    } finally {
      setUploading(false);
    }
  };

  // Filter rows based on search term - new rows first, then existing rows
  const filteredRows = [...newRows, ...rows].filter((row) => {
    const src = row.src || "";
    const type = row.type || "";
    return src.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-[#381914] mb-2">Assets Management</h1>
          <p className="text-gray-600">Manage your custom cake assets and decorations</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search by source or type..."
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

      {/* Assets Table */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
        <div className="overflow-auto h-full max-h-[45vh] pb-4">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white sticky top-0 z-20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Asset ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Preview</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Source</th>
                <th className="text-left py-4 px-6 text-sm font-semibold uppercase tracking-wide w-1/4">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRows.map((row) => {
                const isSelected = selectedRowId === row.asset_id;
                const edited = editedValues[row.asset_id] || {};
                const isEditingSrc = editingField.id === row.asset_id && editingField.field === "src";
                const isEditingType = editingField.id === row.asset_id && editingField.field === "type";

                return (
                  <tr
                    key={row.asset_id}
                    className={`transition-all duration-200 cursor-pointer ${isSelected
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-md'
                      : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                      }`}
                    onClick={() => handleSelectRow(row.asset_id)}
                  >
                    {/* Asset ID Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {row.asset_id}
                        </h4>
                      </div>
                    </td>

                    {/* Preview Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="relative w-20 h-20 rounded overflow-hidden border border-gray-300 group">
                        <img
                          src={getPublicImageUrl(edited.src || row.src, edited.type || row.type)}
                          alt="Asset preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center hidden">
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      </div>
                    </td>

                    {/* Source Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        {isEditingSrc ? (
                          <input
                            type="text"
                            className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                            value={editedSrc}
                            onChange={(e) => setEditedSrc(e.target.value)}
                            onBlur={() => {
                              handleFieldChange(row.asset_id, "src", editedSrc);
                              setEditingField({ id: null, field: null });
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 max-w-48 truncate">
                              {(edited.src ?? row.src) || 'No source'}
                            </p>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.asset_id, field: "src" });
                                setEditedSrc(edited.src ?? row.src);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        <button
                          className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssetForUpload(row.asset_id);
                            setShowUploadModal(true);
                          }}
                        >
                          Upload File
                        </button>
                      </div>
                    </td>

                    {/* Type Column */}
                    <td className="py-6 px-6 align-top">
                      <div className="space-y-2">
                        {isEditingType ? (
                          <select
                            className="border-2 border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D]"
                            value={editedType}
                            onChange={(e) => setEditedType(e.target.value)}
                            onBlur={() => {
                              handleFieldChange(row.asset_id, "type", editedType);
                              setEditingField({ id: null, field: null });
                            }}
                            autoFocus
                          >
                            {assetTypes.map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${(edited.type ?? row.type) === 'cake base' ? 'bg-amber-100 text-amber-800' :
                              (edited.type ?? row.type) === 'icing' ? 'bg-pink-100 text-pink-800' :
                                (edited.type ?? row.type) === 'topping' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {(edited.type ?? row.type)?.charAt(0).toUpperCase() + (edited.type ?? row.type)?.slice(1).replace('_', ' ') || 'Unknown'}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField({ id: row.asset_id, field: "type" });
                                setEditedType(edited.type ?? row.type);
                              }}
                            >
                              Edit
                            </button>
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
              Add New Asset
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
              Delete Asset
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

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#381914]">Upload Asset</h3>
                <p className="text-gray-600 mt-1">Upload a new asset file</p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedAssetForUpload(null);
                  setUploadFile(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Asset File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#AF524D] transition-colors">
                  <input
                    type="file"
                    accept="image/*,.svg,.png,.jpg,.jpeg,.gif"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-[#AF524D]">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, SVG, GIF up to 10MB</p>
                  </div>
                </div>
                {uploadFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Selected: {uploadFile.name}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedAssetForUpload(null);
                    setUploadFile(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${!uploadFile || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Asset'
                  )}
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
