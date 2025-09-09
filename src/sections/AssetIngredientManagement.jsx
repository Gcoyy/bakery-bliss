import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// Helper function to get folder name based on asset type
const getFolderName = (assetType) => {
    const folderMap = {
        'cake base': 'cake base',
        'icing': 'icing',
        'topping': 'topping'
    };
    return folderMap[assetType] || 'misc';
};

// Helper function to get public image URL from Supabase storage
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

    try {
        const publicUrl = supabase.storage.from("asset").getPublicUrl(fullPath).data.publicUrl;
        return publicUrl;
    } catch (error) {
        console.error('Error generating URL for:', fullPath, error);
        return null;
    }
};

const AssetIngredientManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data states
    const [assets, setAssets] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [assetIngredients, setAssetIngredients] = useState([]);

    // Form states
    const [newAssetIngredient, setNewAssetIngredient] = useState({
        asset_id: '',
        ingred_id: '',
        ai_quantity: ''
    });
    const [selectedIngredientForAdd, setSelectedIngredientForAdd] = useState(null);

    const [editFormData, setEditFormData] = useState({
        ai_id: '',
        asset_id: '',
        ingred_id: '',
        ai_quantity: ''
    });

    // Fetch all data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch assets
            const { data: assetsData, error: assetsError } = await supabase
                .from('ASSET')
                .select('*')
                .order('asset_id');

            if (assetsError) throw assetsError;

            // Fetch ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('INGREDIENT')
                .select('*')
                .order('ingred_name');

            if (ingredientsError) throw ingredientsError;

            // Fetch asset-ingredient relationships
            const { data: assetIngredientsData, error: assetIngredientsError } = await supabase
                .from('ASSET-INGREDIENT')
                .select(`
                    *,
                    ASSET(src, type),
                    INGREDIENT(ingred_name)
                `)
                .order('ai_id');

            if (assetIngredientsError) throw assetIngredientsError;

            // Process assets with images
            const processedAssets = (assetsData || []).map(asset => {
                const publicUrl = getPublicImageUrl(asset.src, asset.type);
                return {
                    ...asset,
                    image_url: publicUrl
                };
            });

            setAssets(processedAssets);
            setIngredients(ingredientsData || []);
            setAssetIngredients(assetIngredientsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter assets based on search term
    const filteredAssets = assets.filter(asset =>
        asset.src.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get ingredients for a specific asset
    const getIngredientsForAsset = (assetId) => {
        return assetIngredients.filter(item => item.asset_id === assetId);
    };

    // Get available ingredients (not already used for this asset)
    const getAvailableIngredients = (assetId) => {
        const usedIngredientIds = getIngredientsForAsset(assetId).map(item => item.ingred_id);
        return ingredients.filter(ingredient => !usedIngredientIds.includes(ingredient.ingred_id));
    };

    // Handle add asset-ingredient relationship
    const handleAddAssetIngredient = async () => {
        if (!selectedAsset || !newAssetIngredient.ingred_id || !newAssetIngredient.ai_quantity) {
            toast.error('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('ASSET-INGREDIENT')
                .insert({
                    asset_id: selectedAsset.asset_id,
                    ingred_id: newAssetIngredient.ingred_id,
                    ai_quantity: parseFloat(newAssetIngredient.ai_quantity)
                });

            if (error) throw error;

            toast.success('Ingredient added to asset successfully');
            setShowAddModal(false);
            setNewAssetIngredient({ asset_id: '', ingred_id: '', ai_quantity: '' });
            setSelectedIngredientForAdd(null);
            fetchData();
        } catch (error) {
            console.error('Error adding asset-ingredient relationship:', error);
            toast.error('Failed to add ingredient');
        } finally {
            setSaving(false);
        }
    };

    // Handle edit asset-ingredient relationship
    const handleEditAssetIngredient = async () => {
        if (!editFormData.ingred_id || !editFormData.ai_quantity) {
            toast.error('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('ASSET-INGREDIENT')
                .update({
                    ingred_id: editFormData.ingred_id,
                    ai_quantity: parseFloat(editFormData.ai_quantity)
                })
                .eq('ai_id', editFormData.ai_id);

            if (error) throw error;

            toast.success('Ingredient updated successfully');
            setShowEditModal(false);
            setEditFormData({ ai_id: '', asset_id: '', ingred_id: '', ai_quantity: '' });
            fetchData();
        } catch (error) {
            console.error('Error updating asset-ingredient relationship:', error);
            toast.error('Failed to update ingredient');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete asset-ingredient relationship
    const handleDeleteAssetIngredient = async () => {
        if (!deletingItem) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('ASSET-INGREDIENT')
                .delete()
                .eq('ai_id', deletingItem.ai_id);

            if (error) throw error;

            toast.success('Ingredient removed from asset successfully');
            setShowDeleteModal(false);
            setDeletingItem(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting asset-ingredient relationship:', error);
            toast.error('Failed to remove ingredient');
        } finally {
            setSaving(false);
        }
    };

    // Open add modal for specific asset
    const openAddModal = (asset) => {
        setSelectedAsset(asset);
        setNewAssetIngredient({ asset_id: asset.asset_id, ingred_id: '', ai_quantity: '' });
        setSelectedIngredientForAdd(null);
        setShowAddModal(true);
    };

    // Open edit modal
    const openEditModal = (item) => {
        setEditFormData({
            ai_id: item.ai_id,
            asset_id: item.asset_id,
            ingred_id: item.ingred_id,
            ai_quantity: item.ai_quantity.toString()
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (item) => {
        setDeletingItem(item);
        setShowDeleteModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AF524D]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">Asset-Ingredient Management</h1>
                    <p className="text-[#8B3A3A] text-lg">Manage ingredients for each custom cake asset</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Assets Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAssets.map((asset) => {
                        const assetIngredients = getIngredientsForAsset(asset.asset_id);
                        return (
                            <div key={asset.asset_id} className="bg-white rounded-2xl shadow-xl border border-[#AF524D]/20 overflow-hidden">
                                {/* Asset Image */}
                                <div className="h-48 bg-gray-100 flex items-center justify-center">
                                    {asset.image_url ? (
                                        <img
                                            src={asset.image_url}
                                            alt={asset.src}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-center">
                                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm">No Image</p>
                                        </div>
                                    )}
                                </div>

                                {/* Asset Info */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-[#492220] text-lg truncate">Asset #{asset.asset_id}</h3>
                                        <span className="px-2 py-1 bg-[#AF524D]/10 text-[#AF524D] text-xs font-medium rounded-full">
                                            {asset.type}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">
                                        {assetIngredients.length} ingredient{assetIngredients.length !== 1 ? 's' : ''}
                                    </p>

                                    {/* Ingredients List */}
                                    <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                                        {assetIngredients.map((item) => (
                                            <div key={item.ai_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-[#492220]">
                                                        {item.INGREDIENT?.ingred_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Qty: {item.ai_quantity} {ingredients.find(ing => ing.ingred_id === item.ingred_id)?.unit && `(${ingredients.find(ing => ing.ingred_id === item.ingred_id)?.unit})`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                        title="Edit ingredient"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(item)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                        title="Remove ingredient"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Ingredient Button */}
                                    <button
                                        onClick={() => openAddModal(asset)}
                                        className="w-full px-4 py-2 bg-[#AF524D] text-white rounded-xl hover:bg-[#8B3A3A] transition-colors font-medium text-sm"
                                    >
                                        Add Ingredient
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredAssets.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                        <p className="text-gray-500">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>


            {/* Add Modal */}
            {showAddModal && selectedAsset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D]/20 shadow-2xl">
                        <h3 className="text-2xl font-bold text-[#492220] mb-6">
                            Add Ingredient to Asset #{selectedAsset.asset_id}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#492220] mb-2">Ingredient</label>
                                <select
                                    value={newAssetIngredient.ingred_id}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const selectedIngredient = ingredients.find(ing => ing.ingred_id === selectedId);
                                        setSelectedIngredientForAdd(selectedIngredient);
                                        setNewAssetIngredient(prev => ({ ...prev, ingred_id: selectedId }));
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                                >
                                    <option value="">Select an ingredient</option>
                                    {getAvailableIngredients(selectedAsset.asset_id).map(ingredient => (
                                        <option key={ingredient.ingred_id} value={ingredient.ingred_id}>
                                            {ingredient.ingred_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#492220] mb-2">
                                    Quantity {selectedIngredientForAdd?.unit && `(${selectedIngredientForAdd.unit})`}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newAssetIngredient.ai_quantity}
                                    onChange={(e) => setNewAssetIngredient(prev => ({ ...prev, ai_quantity: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                                    placeholder="Enter quantity"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedIngredientForAdd(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAssetIngredient}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-[#AF524D] text-white rounded-xl hover:bg-[#8B3A3A] transition-colors font-medium disabled:opacity-50"
                            >
                                {saving ? 'Adding...' : 'Add Ingredient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D]/20 shadow-2xl">
                        <h3 className="text-2xl font-bold text-[#492220] mb-6">Edit Ingredient</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#492220] mb-2">Ingredient</label>
                                <select
                                    value={editFormData.ingred_id}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, ingred_id: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                                >
                                    <option value="">Select an ingredient</option>
                                    {ingredients.map(ingredient => (
                                        <option key={ingredient.ingred_id} value={ingredient.ingred_id}>
                                            {ingredient.ingred_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#492220] mb-2">
                                    Quantity {editFormData.ingred_id && ingredients.find(ing => ing.ingred_id === editFormData.ingred_id)?.unit && `(${ingredients.find(ing => ing.ingred_id === editFormData.ingred_id)?.unit})`}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={editFormData.ai_quantity}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, ai_quantity: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                                    placeholder="Enter quantity"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditAssetIngredient}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-[#AF524D] text-white rounded-xl hover:bg-[#8B3A3A] transition-colors font-medium disabled:opacity-50"
                            >
                                {saving ? 'Updating...' : 'Update Ingredient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-red-200 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Remove Ingredient</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to remove this ingredient from the asset? This action cannot be undone.
                            </p>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                <p className="text-gray-600">
                                    <span className="font-medium">Ingredient:</span> {deletingItem.INGREDIENT?.ingred_name}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Quantity:</span> {deletingItem.ai_quantity} {ingredients.find(ing => ing.ingred_id === deletingItem.ingred_id)?.unit && `(${ingredients.find(ing => ing.ingred_id === deletingItem.ingred_id)?.unit})`}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAssetIngredient}
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {saving ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetIngredientManagement;