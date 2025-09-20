import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { UserAuth } from '../context/AuthContext';

const RecipeManagement = () => {
    const { session } = UserAuth();
    const [cakes, setCakes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [cakeIngredients, setCakeIngredients] = useState([]);
    const [filteredCakes, setFilteredCakes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [showAddCake, setShowAddCake] = useState(false);
    const [showEditCake, setShowEditCake] = useState(false);
    const [showAddIngredient, setShowAddIngredient] = useState(false);
    const [showEditIngredient, setShowEditIngredient] = useState(false);
    const [showDeleteCake, setShowDeleteCake] = useState(false);
    const [showDeleteIngredient, setShowDeleteIngredient] = useState(false);
    const [showDeleteCakeIngredient, setShowDeleteCakeIngredient] = useState(false);
    const [showAddCakeIngredient, setShowAddCakeIngredient] = useState(false);

    // Cake form data
    const [cakeFormData, setCakeFormData] = useState({
        theme: '',
        tier: '',
        name: '',
        description: '',
        price: '',
        cake_img: ''
    });

    // Ingredient form data
    const [ingredientFormData, setIngredientFormData] = useState({
        ingred_name: '',
        unit: 'pcs'
    });

    // Cake ingredient form data
    const [cakeIngredientFormData, setCakeIngredientFormData] = useState({
        cake_id: '',
        ingred_id: '',
        quantity: '',
        unit: 'pcs'
    });

    // Selected items for editing/deleting
    const [selectedCake, setSelectedCake] = useState(null);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [selectedCakeIngredient, setSelectedCakeIngredient] = useState(null);
    const [selectedCakeForIngredient, setSelectedCakeForIngredient] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Filter cakes when search term changes
    useEffect(() => {
        filterCakes();
    }, [cakes, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch cakes
            const { data: cakesData, error: cakesError } = await supabase
                .from('CAKE')
                .select('*')
                .order('cake_id', { ascending: true });

            if (cakesError) throw cakesError;

            // Fetch ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('INGREDIENT')
                .select('*')
                .order('ingred_id', { ascending: true });

            if (ingredientsError) throw ingredientsError;

            // Fetch cake ingredients with joins
            const { data: cakeIngredientsData, error: cakeIngredientsError } = await supabase
                .from('CAKE-INGREDIENT')
                .select(`
          ci_id,
          quantity,
          CAKE!inner(
            cake_id,
            name,
            theme,
            tier
          ),
          INGREDIENT!inner(
            ingred_id,
            ingred_name,
            unit
          )
        `)
                .order('ci_id', { ascending: true });

            if (cakeIngredientsError) throw cakeIngredientsError;

            setCakes(cakesData || []);
            setIngredients(ingredientsData || []);
            setCakeIngredients(cakeIngredientsData || []);
            setFilteredCakes(cakesData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const filterCakes = () => {
        if (!searchTerm.trim()) {
            setFilteredCakes(cakes);
            return;
        }

        const filtered = cakes.filter(cake => {
            const searchLower = searchTerm.toLowerCase();
            return (
                cake.name?.toLowerCase().includes(searchLower) ||
                cake.theme?.toLowerCase().includes(searchLower) ||
                cake.tier?.toString().toLowerCase().includes(searchLower) ||
                cake.description?.toLowerCase().includes(searchLower)
            );
        });

        setFilteredCakes(filtered);
    };

    // Cake Management Functions
    const handleAddCake = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const { error } = await supabase
                .from('CAKE')
                .insert([cakeFormData]);

            if (error) throw error;

            toast.success('Cake added successfully');
            setShowAddCake(false);
            setCakeFormData({
                theme: '',
                tier: '',
                name: '',
                description: '',
                price: '',
                cake_img: ''
            });
            fetchData();

        } catch (error) {
            console.error('Error adding cake:', error);
            toast.error('Failed to add cake');
        } finally {
            setSaving(false);
        }
    };

    const handleEditCake = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const { error } = await supabase
                .from('CAKE')
                .update(cakeFormData)
                .eq('cake_id', selectedCake.cake_id);

            if (error) throw error;

            toast.success('Cake updated successfully');
            setShowEditCake(false);
            setSelectedCake(null);
            setCakeFormData({
                theme: '',
                tier: '',
                name: '',
                description: '',
                price: '',
                cake_img: ''
            });
            fetchData();

        } catch (error) {
            console.error('Error updating cake:', error);
            toast.error('Failed to update cake');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCake = async (cakeId) => {
        const cake = cakes.find(c => c.cake_id === cakeId);
        setSelectedCake(cake);
        setShowDeleteCake(true);
    };

    const confirmDeleteCake = async () => {
        if (!selectedCake) return;

        try {
            setSaving(true);

            // First delete cake ingredients
            const { error: ingredientsError } = await supabase
                .from('CAKE-INGREDIENT')
                .delete()
                .eq('cake_id', selectedCake.cake_id);

            if (ingredientsError) throw ingredientsError;

            // Then delete the cake
            const { error: cakeError } = await supabase
                .from('CAKE')
                .delete()
                .eq('cake_id', selectedCake.cake_id);

            if (cakeError) throw cakeError;

            toast.success('Cake and recipe deleted successfully');
            setShowDeleteCake(false);
            setSelectedCake(null);
            fetchData();

        } catch (error) {
            console.error('Error deleting cake:', error);
            toast.error('Failed to delete cake');
        } finally {
            setSaving(false);
        }
    };

    // Ingredient Management Functions
    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const { error } = await supabase
                .from('INGREDIENT')
                .insert([ingredientFormData]);

            if (error) throw error;

            toast.success('Ingredient added successfully');
            setShowAddIngredient(false);
            setIngredientFormData({
                ingred_name: '',
                unit: ''
            });
            fetchData();

        } catch (error) {
            console.error('Error adding ingredient:', error);
            toast.error('Failed to add ingredient');
        } finally {
            setSaving(false);
        }
    };

    const handleEditIngredient = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const { error } = await supabase
                .from('INGREDIENT')
                .update(ingredientFormData)
                .eq('ingred_id', selectedIngredient.ingred_id);

            if (error) throw error;

            toast.success('Ingredient updated successfully');
            setShowEditIngredient(false);
            setSelectedIngredient(null);
            setIngredientFormData({
                ingred_name: '',
                unit: ''
            });
            fetchData();

        } catch (error) {
            console.error('Error updating ingredient:', error);
            toast.error('Failed to update ingredient');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteIngredient = async (ingredId) => {
        const ingredient = ingredients.find(i => i.ingred_id === ingredId);
        setSelectedIngredient(ingredient);
        setShowDeleteIngredient(true);
    };

    const confirmDeleteIngredient = async () => {
        if (!selectedIngredient) return;

        try {
            setSaving(true);

            // First delete from cake ingredients
            const { error: ingredientsError } = await supabase
                .from('CAKE-INGREDIENT')
                .delete()
                .eq('ingred_id', selectedIngredient.ingred_id);

            if (ingredientsError) throw ingredientsError;

            // Then delete the ingredient
            const { error: ingredientError } = await supabase
                .from('INGREDIENT')
                .delete()
                .eq('ingred_id', selectedIngredient.ingred_id);

            if (ingredientError) throw ingredientError;

            toast.success('Ingredient deleted successfully');
            setShowDeleteIngredient(false);
            setSelectedIngredient(null);
            fetchData();

        } catch (error) {
            console.error('Error deleting ingredient:', error);
            toast.error('Failed to delete ingredient');
        } finally {
            setSaving(false);
        }
    };

    // Cake Ingredient Management Functions
    const handleAddCakeIngredient = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const formData = {
                cake_id: selectedCakeForIngredient.cake_id,
                ingred_id: cakeIngredientFormData.ingred_id,
                quantity: cakeIngredientFormData.quantity
            };

            const { error } = await supabase
                .from('CAKE-INGREDIENT')
                .insert([formData]);

            if (error) throw error;

            toast.success('Recipe ingredient added successfully');
            setShowAddCakeIngredient(false);
            setSelectedCakeForIngredient(null);
            setCakeIngredientFormData({
                cake_id: '',
                ingred_id: '',
                quantity: ''
            });
            fetchData();

        } catch (error) {
            console.error('Error adding recipe ingredient:', error);
            toast.error('Failed to add recipe ingredient');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCakeIngredient = async (ciId) => {
        const cakeIngredient = cakeIngredients.find(ci => ci.ci_id === ciId);
        setSelectedCakeIngredient(cakeIngredient);
        setShowDeleteCakeIngredient(true);
    };

    const confirmDeleteCakeIngredient = async () => {
        if (!selectedCakeIngredient) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('CAKE-INGREDIENT')
                .delete()
                .eq('ci_id', selectedCakeIngredient.ci_id);

            if (error) throw error;

            toast.success('Recipe ingredient removed successfully');
            setShowDeleteCakeIngredient(false);
            setSelectedCakeIngredient(null);
            fetchData();

        } catch (error) {
            console.error('Error deleting recipe ingredient:', error);
            toast.error('Failed to remove recipe ingredient');
        } finally {
            setSaving(false);
        }
    };

    // Helper functions
    const openEditCake = (cake) => {
        setSelectedCake(cake);
        setCakeFormData({
            theme: cake.theme,
            tier: cake.tier,
            name: cake.name,
            description: cake.description,
            price: cake.price,
            cake_img: cake.cake_img
        });
        setShowEditCake(true);
    };

    const openEditIngredient = (ingredient) => {
        setSelectedIngredient(ingredient);
        setIngredientFormData({
            ingred_name: ingredient.ingred_name,
            unit: ingredient.unit
        });
        setShowEditIngredient(true);
    };

    const getCakeIngredients = (cakeId) => {
        return cakeIngredients.filter(ci => ci.CAKE.cake_id === cakeId);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] h-[80vh] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">Recipe Management</h1>
                    <p className="text-gray-600">Manage cake recipes, ingredients, and their quantities</p>
                </div>
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
                                placeholder={`Search cakes...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
                <div className="overflow-auto h-full pb-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AF524D]"></div>
                        </div>
                    ) : (
                        // Cakes Content
                        filteredCakes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-lg font-medium">
                                    {searchTerm ? 'No matching cakes found' : 'No cakes'}
                                </p>
                                <p className="text-sm">
                                    {searchTerm ? 'Try adjusting your search terms' : 'Click "Add New Cake" to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {filteredCakes.map((cake) => (
                                    <div
                                        key={cake.cake_id}
                                        className="bg-white rounded-xl border-2 border-[#AF524D] p-6 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4 mb-3">
                                                    {/* Cake Image */}
                                                    {cake.cake_img && (
                                                        <div className="flex-shrink-0">
                                                            <img
                                                                src={cake.cake_img}
                                                                alt={cake.name}
                                                                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Cake Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-[#381914]">{cake.name}</h3>
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                                {cake.theme} - {cake.tier} Tier
                                                            </span>
                                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                ₱{cake.price}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600">{cake.description}</p>
                                                    </div>
                                                </div>

                                                {/* Recipe Ingredients */}
                                                <div className="border-t pt-3">
                                                    <h4 className="font-medium text-sm text-gray-900 mb-2">Recipe Ingredients:</h4>
                                                    {getCakeIngredients(cake.cake_id).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {getCakeIngredients(cake.cake_id).map((ci) => (
                                                                <div key={ci.ci_id} className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-700">
                                                                        {ci.INGREDIENT.ingred_name} - {ci.quantity} {ci.INGREDIENT.unit}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleDeleteCakeIngredient(ci.ci_id)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No ingredients added yet</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCakeForIngredient(cake);
                                                        setShowAddCakeIngredient(true);
                                                    }}
                                                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                                                    disabled={saving}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Add Ingredient
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => openEditCake(cake)}
                                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                                                    disabled={saving}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCake(cake.cake_id)}
                                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                                    disabled={saving}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-4">
                <button
                    className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => setShowAddCake(true)}
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Cake
                    </div>
                </button>
            </div>

            {/* Add Cake Modal */}
            {
                showAddCake && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                            <h3 className="text-2xl font-bold text-[#381914] mb-6">Add New Cake</h3>
                            <form onSubmit={handleAddCake} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Wedding, Birthday, Anniversary"
                                        value={cakeFormData.theme}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, theme: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tier</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2, 3, 4"
                                        value={cakeFormData.tier}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, tier: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Cake name"
                                        value={cakeFormData.name}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, name: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        placeholder="Describe the cake..."
                                        value={cakeFormData.description}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, description: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={cakeFormData.price}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, price: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.jpg"
                                        value={cakeFormData.cake_img}
                                        onChange={(e) => setCakeFormData({ ...cakeFormData, cake_img: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-[#AF524D] hover:bg-[#8B3A3A] text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {saving ? 'Adding...' : 'Add Cake'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCake(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Cake Modal */}
            {
                showEditCake && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg lg:max-w-2xl xl:max-w-4xl border-2 border-[#AF524D] shadow-2xl max-h-[95vh] overflow-y-auto">
                            <h3 className="text-xl sm:text-2xl font-bold text-[#381914] mb-4 sm:mb-6">Edit Cake</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Cake Information */}
                                <div className="space-y-4">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-2">Cake Information</h4>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Wedding, Birthday, Anniversary"
                                            value={cakeFormData.theme}
                                            onChange={(e) => setCakeFormData({ ...cakeFormData, theme: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tier</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 2, 3, 4"
                                            value={cakeFormData.tier}
                                            onChange={(e) => setCakeFormData({ ...cakeFormData, tier: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Cake name"
                                            value={cakeFormData.name}
                                            onChange={(e) => setCakeFormData({ ...cakeFormData, name: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-2">Additional Details</h4>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                        <textarea
                                            placeholder="Describe the cake..."
                                            value={cakeFormData.description}
                                            onChange={(e) => setCakeFormData({ ...cakeFormData, description: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={cakeFormData.price}
                                            onChange={(e) => setCakeFormData({ ...cakeFormData, price: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowEditCake(false)}
                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditCake}
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
                                            Updating...
                                        </div>
                                    ) : (
                                        'Update Cake'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modals */}
            {
                showDeleteCake && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                            <h3 className="text-2xl font-bold text-[#381914] mb-6">Delete Cake</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this cake? This will also delete all associated recipe ingredients.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={confirmDeleteCake}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteCake(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeleteIngredient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                            <h3 className="text-2xl font-bold text-[#381914] mb-6">Delete Ingredient</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this ingredient? This will remove it from all cake recipes.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={confirmDeleteIngredient}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteIngredient(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeleteCakeIngredient && selectedCakeIngredient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                            <h3 className="text-2xl font-bold text-[#381914] mb-6">Remove Ingredient from Recipe</h3>

                            <div className="mb-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <span className="font-semibold text-red-800">Confirm Removal</span>
                                    </div>
                                    <p className="text-red-700 text-sm mb-2">
                                        You are about to remove this ingredient from the cake recipe:
                                    </p>
                                    <div className="bg-white border border-red-300 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    <span className="text-red-600">Ingredient:</span> {selectedCakeIngredient.INGREDIENT.ingred_name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Quantity: {selectedCakeIngredient.quantity} {selectedCakeIngredient.INGREDIENT.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="font-semibold text-gray-900">
                                                <span className="text-blue-600">From Cake:</span> {selectedCakeIngredient.CAKE.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {selectedCakeIngredient.CAKE.theme} - {selectedCakeIngredient.CAKE.tier} Tier
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={confirmDeleteCakeIngredient}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Remove from Recipe
                                </button>
                                <button
                                    onClick={() => setShowDeleteCakeIngredient(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Cake Ingredient Modal */}
            {
                showAddCakeIngredient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                            <h3 className="text-2xl font-bold text-[#381914] mb-6">Add Ingredient to Recipe</h3>
                            <form onSubmit={handleAddCakeIngredient} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cake</label>
                                    <input
                                        type="text"
                                        value={selectedCakeForIngredient?.name || ''}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredient</label>
                                    <select
                                        value={cakeIngredientFormData.ingred_id}
                                        onChange={(e) => setCakeIngredientFormData({ ...cakeIngredientFormData, ingred_id: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        required
                                    >
                                        <option value="">Select ingredient</option>
                                        {ingredients.map((ingredient) => (
                                            <option key={ingredient.ingred_id} value={ingredient.ingred_id}>
                                                {ingredient.ingred_name} ({ingredient.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={cakeIngredientFormData.quantity}
                                            onChange={(e) => setCakeIngredientFormData({ ...cakeIngredientFormData, quantity: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                                        <select
                                            value={cakeIngredientFormData.unit}
                                            onChange={(e) => setCakeIngredientFormData({ ...cakeIngredientFormData, unit: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                            required
                                        >
                                            <option value="pcs">Pieces</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="g">Grams</option>
                                            <option value="lbs">Pounds</option>
                                            <option value="oz">Ounces</option>
                                            <option value="L">Liters</option>
                                            <option value="ml">Milliliters</option>
                                            <option value="cups">Cups</option>
                                            <option value="tbsp">Tablespoons</option>
                                            <option value="tsp">Teaspoons</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCakeIngredient(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-[#AF524D] hover:bg-[#8B3A3A] text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {saving ? 'Adding...' : 'Add to Recipe'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default RecipeManagement;