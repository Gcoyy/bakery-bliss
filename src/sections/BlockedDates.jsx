import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

const BlockedDates = () => {
    const { session } = UserAuth();
    const [blockedDates, setBlockedDates] = useState([]);
    const [filteredDates, setFilteredDates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newBlockedDate, setNewBlockedDate] = useState({
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        reason: '',
        is_full_day: false
    });

    // Load blocked dates from localStorage on component mount
    useEffect(() => {
        fetchBlockedDates();
    }, []);

    // Get current admin ID
    const getCurrentAdminId = async () => {
        try {
            if (!session?.user?.id) {
                console.error('No session user ID found');
                return null;
            }

            const { data: adminData, error } = await supabase
                .from('ADMIN')
                .select('admin_id')
                .eq('admin_uid', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching admin ID:', error);
                return null;
            }

            return adminData?.admin_id;
        } catch (error) {
            console.error('Error getting admin ID:', error);
            return null;
        }
    };

    // Filter blocked dates when search term changes
    useEffect(() => {
        filterBlockedDates();
    }, [blockedDates, searchTerm]);

    const fetchBlockedDates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('BLOCKED-TIMES')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching blocked dates:', error);
                toast.error('Failed to load blocked dates');
                return;
            }

            setBlockedDates(data || []);
        } catch (error) {
            console.error('Error loading blocked dates:', error);
            toast.error('Failed to load blocked dates');
        } finally {
            setLoading(false);
        }
    };


    const filterBlockedDates = () => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            setFilteredDates(blockedDates.slice());
            return;
        }

        const filtered = blockedDates.filter(date => {
            const dateObj = new Date(date.start_date);
            const dateStr = dateObj.toLocaleDateString('en-US').toLowerCase();
            const dateStrAlt = (date.start_date || '').toString().toLowerCase();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
            const dayNumber = (dateObj.getDate() || '').toString().toLowerCase();
            const monthNumber = ((dateObj.getMonth() + 1) || '').toString().toLowerCase();
            const year = (dateObj.getFullYear() || '').toString().toLowerCase();
            const reason = (date.reason || '').toString().toLowerCase();

            // Time matching with token boundaries to avoid matching 1:00 in 11:00
            let timeMatches = false;
            if (date.whole_day) {
                timeMatches = 'full day'.includes(term);
            } else {
                const st24 = (date.start_time || '').toString().toLowerCase();
                const et24 = (date.end_time || '').toString().toLowerCase();
                const st12 = (formatTime(date.start_time) || '').toString().toLowerCase();
                const et12 = (formatTime(date.end_time) || '').toString().toLowerCase();

                if (term.includes(':')) {
                    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const re = new RegExp(`(^|\\D)${esc}(\\D|$)`);
                    timeMatches = (
                        re.test(st24) ||
                        re.test(et24) ||
                        re.test(st12) ||
                        re.test(et12)
                    );
                } else {
                    timeMatches = (
                        st24.includes(term) ||
                        et24.includes(term) ||
                        st12.includes(term) ||
                        et12.includes(term)
                    );
                }
            }

            return (
                dateStr.includes(term) ||
                dateStrAlt.includes(term) ||
                dayName.includes(term) ||
                monthName.includes(term) ||
                dayNumber.includes(term) ||
                monthNumber.includes(term) ||
                year.includes(term) ||
                reason.includes(term) ||
                timeMatches
            );
        });

        setFilteredDates(filtered);
    };

    const handleAddBlockedDate = async () => {
        if (!newBlockedDate.start_date) {
            toast.error('Please select a start date');
            return;
        }

        if (!newBlockedDate.end_date) {
            toast.error('Please select an end date');
            return;
        }

        if (!newBlockedDate.is_full_day && (!newBlockedDate.start_time || !newBlockedDate.end_time)) {
            toast.error('Please select start and end times');
            return;
        }

        // Validate date range
        const startDate = new Date(newBlockedDate.start_date);
        const endDate = new Date(newBlockedDate.end_date);

        if (endDate < startDate) {
            toast.error('End date must be after start date');
            return;
        }

        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 6) {
            toast.error('Maximum 6 days can be selected at once');
            return;
        }

        try {
            setSaving(true);

            // Get current admin ID
            const adminId = await getCurrentAdminId();
            if (!adminId) {
                toast.error('Unable to identify admin. Please try again.');
                return;
            }

            const newBlockedDates = [];

            // Generate dates for the selected range
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                newBlockedDates.push({
                    start_date: dateString,
                    end_date: dateString,
                    start_time: newBlockedDate.is_full_day ? null : newBlockedDate.start_time,
                    end_time: newBlockedDate.is_full_day ? null : newBlockedDate.end_time,
                    reason: newBlockedDate.reason || 'No reason provided',
                    whole_day: newBlockedDate.is_full_day,
                    admin_id: adminId
                });
            }

            // Insert into database
            const { data, error } = await supabase
                .from('BLOCKED-TIMES')
                .insert(newBlockedDates)
                .select();

            if (error) {
                console.error('Error adding blocked dates:', error);
                toast.error('Failed to add blocked dates');
                return;
            }

            // Refresh the list
            await fetchBlockedDates();

            toast.success(`${newBlockedDates.length} blocked date${newBlockedDates.length > 1 ? 's' : ''} added successfully`);
            setShowAddModal(false);
            setNewBlockedDate({
                start_date: '',
                end_date: '',
                start_time: '',
                end_time: '',
                reason: '',
                is_full_day: false
            });
        } catch (error) {
            console.error('Error adding blocked date:', error);
            toast.error('Failed to add blocked date');
        } finally {
            setSaving(false);
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dateToDelete, setDateToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [dateToEdit, setDateToEdit] = useState(null);
    const [editFormData, setEditFormData] = useState({
        date: '',
        start_time: '',
        end_time: '',
        reason: '',
        is_full_day: false
    });


    const handleDeleteBlockedDate = (bt_id) => {
        const date = blockedDates.find(d => d.bt_id === bt_id);
        setDateToDelete(date);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!dateToDelete) return;

        try {
            const { error } = await supabase
                .from('BLOCKED-TIMES')
                .delete()
                .eq('bt_id', dateToDelete.bt_id);

            if (error) {
                console.error('Error deleting blocked date:', error);
                toast.error('Failed to delete blocked date');
                return;
            }

            // Refresh the list
            await fetchBlockedDates();

            toast.success('Blocked date deleted successfully');
            setShowDeleteModal(false);
            setDateToDelete(null);
        } catch (error) {
            console.error('Error deleting blocked date:', error);
            toast.error('Failed to delete blocked date');
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDateToDelete(null);
    };

    const handleEditBlockedDate = (bt_id) => {
        const date = blockedDates.find(d => d.bt_id === bt_id);
        setDateToEdit(date);
        setEditFormData({
            date: date.start_date,
            start_time: date.start_time || '',
            end_time: date.end_time || '',
            reason: date.reason,
            is_full_day: date.whole_day
        });
        setShowEditModal(true);
    };

    const handleUpdateBlockedDate = async () => {
        if (!editFormData.date) {
            toast.error('Please select a date');
            return;
        }

        if (!editFormData.is_full_day && (!editFormData.start_time || !editFormData.end_time)) {
            toast.error('Please select start and end times');
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('BLOCKED-TIMES')
                .update({
                    start_date: editFormData.date,
                    end_date: editFormData.date,
                    start_time: editFormData.is_full_day ? null : editFormData.start_time,
                    end_time: editFormData.is_full_day ? null : editFormData.end_time,
                    reason: editFormData.reason,
                    whole_day: editFormData.is_full_day
                })
                .eq('bt_id', dateToEdit.bt_id);

            if (error) {
                console.error('Error updating blocked date:', error);
                toast.error('Failed to update blocked date');
                return;
            }

            // Refresh the list
            await fetchBlockedDates();

            toast.success('Blocked date updated successfully');
            setShowEditModal(false);
            setDateToEdit(null);
        } catch (error) {
            console.error('Error updating blocked date:', error);
            toast.error('Failed to update blocked date');
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setShowEditModal(false);
        setDateToEdit(null);
        setEditFormData({
            date: '',
            start_time: '',
            end_time: '',
            reason: '',
            is_full_day: false
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const isDateInPast = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(dateString);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full border-2 border-[#AF524D] min-h-[80vh] max-h-[80vh] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">Blocked Dates Management</h1>
                    <p className="text-gray-600">Manage days and times when orders are not allowed</p>
                </div>

                <button
                    className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => setShowAddModal(true)}
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Blocked Date
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
                                placeholder="Search by date (sunday, december, 25), reason, or time..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                            />
                        </div>
                    </div>

                </div>

            </div>

            {/* Blocked Dates List */}
            <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
                <div className="overflow-auto h-full max-h-[45vh] pb-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AF524D]"></div>
                        </div>
                    ) : filteredDates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium">
                                {searchTerm ? 'No matching blocked dates found' : 'No blocked dates'}
                            </p>
                            <p className="text-sm">
                                {searchTerm ? 'Try adjusting your search terms' : 'Click "Add Blocked Date" to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {filteredDates.map((blockedDate) => (
                                <div
                                    key={blockedDate.bt_id}
                                    className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all duration-200 ${isDateInPast(blockedDate.start_date)
                                        ? 'border-gray-300 bg-gray-50 opacity-75'
                                        : 'border-[#AF524D] hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-[#381914]">
                                                    {formatDate(blockedDate.start_date)}
                                                </h3>
                                                {blockedDate.whole_day && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                                        Full Day
                                                    </span>
                                                )}
                                                {isDateInPast(blockedDate.start_date) && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                        Past Date
                                                    </span>
                                                )}
                                            </div>

                                            {!blockedDate.whole_day && (
                                                <p className="text-gray-600 mb-2">
                                                    <span className="font-medium">Time:</span> {formatTime(blockedDate.start_time)} - {formatTime(blockedDate.end_time)}
                                                </p>
                                            )}

                                            <p className="text-gray-600">
                                                <span className="font-medium">Reason:</span> {blockedDate.reason}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditBlockedDate(blockedDate.bt_id)}
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
                                                onClick={() => handleDeleteBlockedDate(blockedDate.bt_id)}
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
                    )}
                </div>
            </div>

            {/* Add Blocked Date Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-[#AF524D] shadow-2xl">
                        <h3 className="text-2xl font-bold text-[#381914] mb-6">Add Blocked Date Range</h3>

                        <div className="space-y-4">
                            {/* Date Range Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        From Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={newBlockedDate.start_date}
                                        onChange={(e) => setNewBlockedDate(prev => ({ ...prev, start_date: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        To Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={newBlockedDate.end_date}
                                        onChange={(e) => setNewBlockedDate(prev => ({ ...prev, end_date: e.target.value }))}
                                        min={newBlockedDate.start_date || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Date Range Preview */}

                            {/* Full Day Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="fullDay"
                                    checked={newBlockedDate.is_full_day}
                                    onChange={(e) => setNewBlockedDate(prev => ({
                                        ...prev,
                                        is_full_day: e.target.checked,
                                        start_time: e.target.checked ? '' : prev.start_time,
                                        end_time: e.target.checked ? '' : prev.end_time
                                    }))}
                                    className="w-5 h-5 text-[#AF524D] border-2 border-gray-300 rounded focus:ring-[#AF524D]"
                                />
                                <label htmlFor="fullDay" className="text-sm font-medium text-gray-700">
                                    Block entire day
                                </label>
                            </div>

                            {/* Time Selection (only if not full day) */}
                            {!newBlockedDate.is_full_day && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={newBlockedDate.start_time}
                                            onChange={(e) => setNewBlockedDate(prev => ({ ...prev, start_time: e.target.value }))}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={newBlockedDate.end_time}
                                            onChange={(e) => setNewBlockedDate(prev => ({ ...prev, end_time: e.target.value }))}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason
                                </label>
                                <textarea
                                    value={newBlockedDate.reason}
                                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Enter reason for blocking this date..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewBlockedDate({
                                        start_date: '',
                                        end_date: '',
                                        start_time: '',
                                        end_time: '',
                                        reason: '',
                                        is_full_day: false
                                    });
                                }}
                                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddBlockedDate}
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
                                    'Add Blocked Date'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && dateToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-red-200 shadow-2xl">
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Blocked Date</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this blocked date? This action cannot be undone.
                            </p>

                            {/* Date Details */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                        {formatDate(dateToDelete.start_date)}
                                    </h4>
                                    {dateToDelete.whole_day && (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                            Full Day
                                        </span>
                                    )}
                                </div>

                                {dateToDelete.whole_day ? (
                                    <p className="text-gray-600 mb-2">
                                        <span className="font-medium">Time:</span> 8:00 AM - 8:00 PM
                                    </p>
                                ) : (
                                    <p className="text-gray-600 mb-2">
                                        <span className="font-medium">Time:</span> {formatTime(dateToDelete.start_time)} - {formatTime(dateToDelete.end_time)}
                                    </p>
                                )}

                                <p className="text-gray-600">
                                    <span className="font-medium">Reason:</span> {dateToDelete.reason}
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

            {/* Edit Blocked Date Modal */}
            {showEditModal && dateToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md border-2 border-blue-200 shadow-2xl">
                        <h3 className="text-2xl font-bold text-[#381914] mb-6">Edit Blocked Date</h3>

                        <div className="space-y-4">
                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                />
                            </div>

                            {/* Full Day Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="editFullDay"
                                    checked={editFormData.is_full_day}
                                    onChange={(e) => setEditFormData(prev => ({
                                        ...prev,
                                        is_full_day: e.target.checked,
                                        start_time: e.target.checked ? '' : prev.start_time,
                                        end_time: e.target.checked ? '' : prev.end_time
                                    }))}
                                    className="w-5 h-5 text-[#AF524D] border-2 border-gray-300 rounded focus:ring-[#AF524D]"
                                />
                                <label htmlFor="editFullDay" className="text-sm font-medium text-gray-700">
                                    Block entire day
                                </label>
                            </div>

                            {/* Time Selection (only if not full day) */}
                            {!editFormData.is_full_day && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={editFormData.start_time}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={editFormData.end_time}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason
                                </label>
                                <textarea
                                    value={editFormData.reason}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Enter reason for blocking this date..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] transition-all duration-200 resize-none"
                                    rows={3}
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
                                onClick={handleUpdateBlockedDate}
                                disabled={saving}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${saving
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-[#AF524D] text-white over:bg-[#8B3A3A] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
                                    'Update Blocked Date'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockedDates;
