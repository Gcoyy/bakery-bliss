import { useState, useEffect, useRef } from 'react';
import { Canvas, FabricText, FabricImage } from 'fabric';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';

// Font loading utility
const loadFont = (fontFamily) => {
    return new Promise((resolve) => {
        if (document.fonts && document.fonts.load) {
            // Load multiple weights to ensure the font is available
            const weights = ['400', '500', '600', '700'];
            const loadPromises = weights.map(weight =>
                document.fonts.load(`${weight} 16px "${fontFamily}"`)
            );

            Promise.all(loadPromises).then(() => {
                // Verify the font is actually loaded
                const isLoaded = document.fonts.check(`16px "${fontFamily}"`);
                // console.log(`Font ${fontFamily} loaded successfully:`, isLoaded);
                if (!isLoaded) {
                    console.warn(`Font ${fontFamily} verification failed, but continuing...`);
                }
                resolve();
            }).catch((error) => {
                console.warn(`Font ${fontFamily} failed to load:`, error);
                resolve(); // Continue even if font fails to load
            });
        } else {
            // Fallback: wait a bit for fonts to load from CSS
            setTimeout(() => {
                const isLoaded = document.fonts.check(`16px "${fontFamily}"`);
                // console.log(`Font ${fontFamily} loaded via fallback:`, isLoaded);
                resolve();
            }, 1000);
        }
    });
};

const loadGoogleFonts = async () => {
    const fonts = ['Poppins', 'Abhaya Libre'];
    // console.log('Loading Google Fonts:', fonts);

    // Load fonts with a delay between each to ensure proper loading
    for (const font of fonts) {
        await loadFont(font);
        // Add a small delay between font loads
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // console.log('All Google Fonts loaded');

    // Final verification
    fonts.forEach(font => {
        const isLoaded = document.fonts.check(`16px "${font}"`);
        // console.log(`Final verification - ${font}:`, isLoaded);
    });
};

const CakeCustomization = () => {

    const navigate = useNavigate();
    const { session, userRole } = UserAuth();

    // Add custom styles for scrollbar
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #AF524D #F8E6B4;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #F8E6B4;
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #AF524D;
                border-radius: 4px;
                cursor: pointer;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #8B3A3A;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
                background: #6B2A2A;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);
    const canvasRef = useRef(null);
    const canvas = useRef(null);
    const colorWheelRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [cakeImages, setCakeImages] = useState([]);
    const [decorations, setDecorations] = useState([]);
    const [toppings, setToppings] = useState([]);
    const [selectedTool, setSelectedTool] = useState('select');
    const [selectedColor, setSelectedColor] = useState('#FF0000');
    const [textValue, setTextValue] = useState('');
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Poppins');
    const [currentFontSize, setCurrentFontSize] = useState(24);
    const [canvasReady, setCanvasReady] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [objectUpdateTrigger, setObjectUpdateTrigger] = useState(0);
    const [selectedAssetType, setSelectedAssetType] = useState('cake base');
    const [usedAssets, setUsedAssets] = useState([]); // Track assets used in the canvas

    // Order modal states
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [orderDate, setOrderDate] = useState("");
    const [orderTime, setOrderTime] = useState("");
    const [orderType, setOrderType] = useState("Pickup");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [customCakeImage, setCustomCakeImage] = useState(null);
    const [isScrollLocked, setIsScrollLocked] = useState(false);

    // Custom calendar states
    const [showCustomCalendar, setShowCustomCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [blockedDates, setBlockedDates] = useState([]);
    const [dateCapacity, setDateCapacity] = useState({});
    const [isDateBlocked, setIsDateBlocked] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');
    const [isCheckingBlockedDates, setIsCheckingBlockedDates] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);


    // Scroll lock functionality
    useEffect(() => {
        if (isScrollLocked) {
            // Disable scrolling
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            // Enable scrolling
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        };
    }, [isScrollLocked]);

    // Check authentication on component mount
    useEffect(() => {
        if (!session || !session.user) {

            // Wait 3 seconds before checking again
            const checkTimer = setTimeout(() => {
                // Check again after 3 seconds
                if (!session || !session.user) {
                    toast.error('Please log in to access the cake customization tool');
                    navigate('/login');
                } else {
                }
            }, 3000);

            // Cleanup timer if component unmounts
            return () => clearTimeout(checkTimer);
        } else {
        }
    }, [session, navigate]);

    // Track canvasReady changes
    useEffect(() => {
    }, [canvasReady]);

    // Helper function to get public image URL from Supabase storage
    const getPublicImageUrl = (path) => {
        if (!path) {
            return null;
        }

        // If the path is already a full URL, return it as is
        if (path.startsWith('http')) {
            return path;
        }


        try {
            // Use the correct bucket name and handle folder structure
            const bucketName = 'asset';

            // Construct the full path with folder structure
            let fullPath = path;

            // If the path doesn't already include a folder, determine which folder it should go in
            // This is a fallback - ideally your ASSET table should include the folder in the src
            if (!path.includes('/')) {
                // You might want to add a folder field to your ASSET table to be more explicit
            }

            const { data, error } = supabase.storage.from(bucketName).getPublicUrl(fullPath);

            if (error) {
                return null;
            }

            if (data && data.publicUrl) {
                return data.publicUrl;
            }

            return null;
        } catch (error) {
            return null;
        }
    };

    // Helper function to convert image to data URL to avoid CORS issues
    const imageToDataURL = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.onerror = () => {
                // If CORS fails, try without crossOrigin
                const img2 = new Image();
                img2.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img2.width;
                    canvas.height = img2.height;
                    ctx.drawImage(img2, 0, 0);
                    resolve(canvas.toDataURL());
                };
                img2.onerror = reject;
                img2.src = url;
            };
            img.src = url;
        });
    };

    // Helper function to test if an image URL is accessible
    const testImageUrl = async (url) => {
        if (!url) return false;

        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Helper function to test storage bucket structure
    const testStorageBucket = async () => {
        try {
            const bucketName = 'asset';

            // Try to list files in the bucket
            const { data: bucketData, error: bucketError } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 100 });

            if (bucketError) {
                return;
            }


            // Try to list files in specific folders
            const folders = ['cake base', 'icing', 'topping'];
            for (const folder of folders) {
                try {
                    const { data: folderData, error: folderError } = await supabase.storage
                        .from(bucketName)
                        .list(folder, { limit: 100 });

                    if (folderError) {
                    } else {
                    }
                } catch (folderError) {
                }
            }
        } catch (error) {
        }
    };

    // Order count function
    const getOrdersCountForDate = async (date) => {
        try {
            const { data: orders, error } = await supabase
                .from('ORDER')
                .select('order_id')
                .eq('order_schedule', date);

            if (error) {
                return 0;
            }

            return orders ? orders.length : 0;
        } catch (error) {
            return 0;
        }
    };

    // Custom calendar helper functions
    const formatDateForCalendar = (date) => {
        return date.toISOString().split('T')[0];
    };

    const isDateInPast = (date) => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(12, 0, 0, 0);

        // Calculate minimum date (7 days from today)
        const minimumDate = new Date(today);
        minimumDate.setDate(today.getDate() + 7);

        return compareDate < minimumDate;
    };

    const isDateBlockedInCalendar = (date) => {
        const dateString = formatDateForCalendar(date);
        return blockedDates.some(blocked => {
            const blockedDate = new Date(blocked.start_date);
            return formatDateForCalendar(blockedDate) === dateString && blocked.whole_day;
        });
    };

    const isDateBlockedForCalendar = (dateString) => {
        return blockedDates.some(blocked => {
            const blockedDate = new Date(blocked.start_date);
            return formatDateForCalendar(blockedDate) === dateString && blocked.whole_day;
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Generate available time slots
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month - create dates at noon to avoid timezone issues
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day, 12, 0, 0));
        }

        return days;
    };

    const handleDateSelect = (date) => {
        if (isDateInPast(date) || isDateBlockedInCalendar(date)) {
            return;
        }

        const dateString = formatDateForCalendar(date);
        setOrderDate(dateString);
        // After selecting a date, check blocked dates and compute available time slots
        checkBlockedDates(dateString);
        setShowCustomCalendar(false);
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(prev.getMonth() + direction);
            return newMonth;
        });
    };

    // Fetch blocked dates
    // const fetchBlockedDates = async () => {
    //     try {
    //         const { data, error } = await supabase
    //             .from('BLOCKED-TIMES')
    //             .select('*')
    //             .eq('whole_day', true);

    //         if (error) {
    //             return;
    //         }

    //         setBlockedDates(data || []);
    //     } catch (error) {
    //     }
    // };

    const checkBlockedDates = async (date, time = null) => {
        if (!date) return;

        setIsCheckingBlockedDates(true);
        try {
            const { isBlocked, reason } = await isDateTimeBlocked(date, time);
            setIsDateBlocked(isBlocked);
            setBlockedReason(reason || '');

            if (!isBlocked) {
                // Get available time slots for the selected date
                const timeSlots = await getAvailableTimeSlots(date);
                setAvailableTimeSlots(timeSlots);
            } else {
                setAvailableTimeSlots([]);
            }
        } catch (error) {
            setIsDateBlocked(false);
            setBlockedReason('');
            setAvailableTimeSlots([]);
        } finally {
            setIsCheckingBlockedDates(false);
        }
    };

    // Blocked dates utility functions
    const isDateTimeBlocked = async (date, time = null) => {
        try {
            const { data: blockedDates, error } = await supabase
                .from('BLOCKED-TIMES')
                .select('*')
                .eq('start_date', date);

            if (error) {
                return { isBlocked: false, reason: null };
            }

            if (!blockedDates || blockedDates.length === 0) {
                return { isBlocked: false, reason: null };
            }

            // If no time specified, check if any full day blocks exist
            if (!time) {
                const fullDayBlock = blockedDates.find(blocked => blocked.whole_day);
                if (fullDayBlock) {
                    return { isBlocked: true, reason: fullDayBlock.reason };
                }
                return { isBlocked: false, reason: null };
            }

            // Check time-specific blocks
            const timeStr = time.includes(':') ? time : `${time}:00`;

            for (const blocked of blockedDates) {
                // Skip full day blocks for time checks
                if (blocked.whole_day) {
                    continue;
                }

                // Check if the time falls within the blocked time range
                if (blocked.start_time && blocked.end_time) {
                    const blockedStart = blocked.start_time;
                    const blockedEnd = blocked.end_time;

                    // Handle time comparison
                    if (timeStr >= blockedStart && timeStr <= blockedEnd) {
                        return { isBlocked: true, reason: blocked.reason };
                    }
                }
            }

            return { isBlocked: false, reason: null };
        } catch (error) {
            return { isBlocked: false, reason: null };
        }
    };

    // Generate available time slots for a given date, excluding blocked ranges and enforcing capacity
    const getAvailableTimeSlots = async (date) => {
        try {
            // If date has reached maximum orders (4 per day), no time slots
            const ordersCount = await getOrdersCountForDate(date);
            if (ordersCount >= 4) {
                return [];
            }

            const { data: blockedDatesForDay, error } = await supabase
                .from('BLOCKED-TIMES')
                .select('*')
                .eq('start_date', date);

            if (error) {
                return [];
            }

            const blockedForDate = blockedDatesForDay || [];

            // If full day blocked, return empty
            const fullDayBlock = blockedForDate.find(b => b.whole_day);
            if (fullDayBlock) {
                return [];
            }

            // Normalize times to HH:mm
            const normalizeTime = (t) => {
                if (!t) return null;
                const [h, m] = t.split(':');
                return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
            };

            const blockedRanges = blockedForDate
                .filter(b => b.start_time && b.end_time)
                .map(b => ({ start: normalizeTime(b.start_time), end: normalizeTime(b.end_time) }));

            const timeSlots = [];
            for (let hour = 8; hour <= 20; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    // Skip 20:30; only allow up to 20:00
                    if (hour === 20 && minute === 30) {
                        break;
                    }

                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const isBlocked = blockedRanges.some(r => timeStr >= r.start && timeStr <= r.end);
                    if (!isBlocked) {
                        timeSlots.push(timeStr);
                    }
                }
            }

            return timeSlots;
        } catch (e) {
            return [];
        }
    };

    // Check capacity for all dates in current month
    const checkMonthCapacity = async () => {
        const days = getDaysInMonth(currentMonth);
        const capacityData = {};

        for (const day of days) {
            if (day) {
                const dateString = formatDateForCalendar(day);
                const ordersCount = await getOrdersCountForDate(dateString);
                capacityData[dateString] = ordersCount >= 4;
            }
        }

        setDateCapacity(capacityData);
    };

    // Color wheel functions
    const drawColorWheel = () => {
        const canvas = colorWheelRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw color wheel using radial gradient
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                if (distance <= radius) {
                    const hue = ((angle * 180 / Math.PI) + 360) % 360;
                    const saturation = Math.min((distance / radius) * 100, 100);
                    const lightness = 50;

                    // Convert HSL to RGB
                    const hslToRgb = (h, s, l) => {
                        s /= 100;
                        l /= 100;
                        const c = (1 - Math.abs(2 * l - 1)) * s;
                        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                        const m = l - c / 2;
                        let r = 0, g = 0, b = 0;

                        if (0 <= h && h < 60) {
                            r = c; g = x; b = 0;
                        } else if (60 <= h && h < 120) {
                            r = x; g = c; b = 0;
                        } else if (120 <= h && h < 180) {
                            r = 0; g = c; b = x;
                        } else if (180 <= h && h < 240) {
                            r = 0; g = x; b = c;
                        } else if (240 <= h && h < 300) {
                            r = x; g = 0; b = c;
                        } else if (300 <= h && h < 360) {
                            r = c; g = 0; b = x;
                        }

                        return [
                            Math.round((r + m) * 255),
                            Math.round((g + m) * 255),
                            Math.round((b + m) * 255)
                        ];
                    };

                    const [r, g, b] = hslToRgb(hue, saturation, lightness);
                    const index = (y * canvas.width + x) * 4;
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                    data[index + 3] = 255;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw center circle for lightness control
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = selectedColor;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

    };

    const getColorFromWheel = (event) => {

        const colorWheelCanvas = colorWheelRef.current;

        if (!colorWheelCanvas) {
            return;
        }

        const rect = colorWheelCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = colorWheelCanvas.width / 2;
        const centerY = colorWheelCanvas.height / 2;


        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const radius = Math.min(centerX, centerY) - 10;


        if (distance <= radius) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            const hue = (angle + 360) % 360;
            const saturation = Math.min((distance / radius) * 100, 100);
            const lightness = 50;

            // Convert HSL to RGB first, then to hex
            const hslToRgb = (h, s, l) => {
                s /= 100;
                l /= 100;
                const c = (1 - Math.abs(2 * l - 1)) * s;
                const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                const m = l - c / 2;
                let r = 0, g = 0, b = 0;

                if (0 <= h && h < 60) {
                    r = c; g = x; b = 0;
                } else if (60 <= h && h < 120) {
                    r = x; g = c; b = 0;
                } else if (120 <= h && h < 180) {
                    r = 0; g = c; b = x;
                } else if (180 <= h && h < 240) {
                    r = 0; g = x; b = c;
                } else if (240 <= h && h < 300) {
                    r = x; g = 0; b = c;
                } else if (300 <= h && h < 360) {
                    r = c; g = 0; b = x;
                }

                return [
                    Math.round((r + m) * 255),
                    Math.round((g + m) * 255),
                    Math.round((b + m) * 255)
                ];
            };

            const rgbToHex = (r, g, b) => {
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            };

            const [r, g, b] = hslToRgb(hue, saturation, lightness);
            const color = rgbToHex(r, g, b);
            setSelectedColor(color);

            // Only try to change color on canvas if canvas is ready and has an active object

            if (canvasReady && canvas.current && canvas.current.getActiveObject) {
                const activeObject = canvas.current.getActiveObject();

                if (activeObject) {
                    activeObject.set('fill', color);
                    canvas.current.renderAll();

                    // Update the selected object state to reflect the color change
                    if (selectedObject && selectedObject === activeObject) {
                        setObjectUpdateTrigger(prev => prev + 1);
                    }
                } else {
                }
            } else {
            }
        } else {
        }
    };

    // Mouse event handlers for drag functionality
    const handleMouseDown = (event) => {
        const colorWheelCanvas = colorWheelRef.current;
        if (!colorWheelCanvas) return;

        // Prevent event from interfering with other elements
        event.stopPropagation();

        // Add event listeners for drag
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Get initial color
        getColorFromWheel(event);
    };

    const handleMouseMove = (event) => {
        // Only handle if we're still dragging the color wheel
        if (!colorWheelRef.current) return;

        // Create a synthetic event with the current mouse position
        const syntheticEvent = {
            clientX: event.clientX,
            clientY: event.clientY
        };
        getColorFromWheel(syntheticEvent);
    };

    const handleMouseUp = (event) => {
        // Only remove listeners if this is the color wheel mouse up
        if (event.target === colorWheelRef.current || event.target.closest('.color-picker-container')) {
            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    };

    // Fetch cake images and decorations from database
    useEffect(() => {
        const fetchImages = async () => {
            try {
                setLoading(true);

                // Fetch assets from ASSET table
                const { data: assetData, error: assetError } = await supabase
                    .from("ASSET")
                    .select("*")
                    .order('asset_id');

                if (assetError) {
                    toast.error("Failed to load assets");
                    return;
                }

                if (assetData && assetData.length > 0) {
                }

                // Test the storage bucket structure
                await testStorageBucket();

                // Separate assets based on type
                const cakeBases = assetData.filter(asset => asset.type === 'cake base');
                const icingAssets = assetData.filter(asset => asset.type === 'icing');
                const toppingAssets = assetData.filter(asset => asset.type === 'topping');


                // Process cake bases with public URLs
                const cakesWithImages = cakeBases.map((asset) => {
                    // Use the asset.src directly as it should already contain the full path
                    const publicUrl = getPublicImageUrl(asset.src);
                    return {
                        cake_id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        publicUrl: publicUrl,
                        admin_id: asset.admin_id
                    };
                });

                // Process icing assets with public URLs
                const processedIcing = icingAssets.map((asset) => {
                    // Use the asset.src directly as it should already contain the full path
                    const publicUrl = getPublicImageUrl(asset.src);
                    return {
                        id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        image_path: asset.src, // Store the src path for later use
                        category: asset.type,
                        admin_id: asset.admin_id
                    };
                });

                // Process topping assets with public URLs
                const processedToppings = toppingAssets.map((asset) => {
                    // Use the asset.src directly as it should already contain the full path
                    const publicUrl = getPublicImageUrl(asset.src);
                    return {
                        id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        src: asset.src, // Add src property for consistency
                        category: asset.type,
                        admin_id: asset.admin_id
                    };
                });


                // Test a few URLs to see if they're accessible
                if (cakesWithImages.length > 0) {
                    const firstCakeUrl = cakesWithImages[0].publicUrl;
                    if (firstCakeUrl) {
                        const isAccessible = await testImageUrl(firstCakeUrl);
                    }
                }

                if (processedIcing.length > 0) {
                    const firstIcingUrl = getPublicImageUrl(processedIcing[0].image_path);
                    if (firstIcingUrl) {
                        const isAccessible = await testImageUrl(firstIcingUrl);
                    }
                }

                if (cakesWithImages.length === 0) {
                }

                if (processedIcing.length === 0) {
                }

                if (processedToppings.length === 0) {
                }

                setCakeImages(cakesWithImages);
                setDecorations(processedIcing);
                setToppings(processedToppings);
            } catch (error) {
                toast.error("Failed to load images");
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Load Google Fonts
    useEffect(() => {
        // Add a small delay to ensure fonts are loaded from HTML
        setTimeout(() => {
            loadGoogleFonts();
        }, 500);
    }, []);


    // Sync font size state with selected text object
    useEffect(() => {
        if (selectedObject?.type === 'text') {
            setCurrentFontSize(selectedObject.fontSize || 24);
        }
    }, [selectedObject, objectUpdateTrigger]);

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!loading && canvasRef.current && !canvas.current) {
            try {
                // Get the container dimensions
                const container = canvasRef.current.parentElement;
                const containerRect = container.getBoundingClientRect();

                // Set canvas size to fit container while maintaining aspect ratio
                const maxWidth = containerRect.width; // Use full container width
                const maxHeight = containerRect.height; // Use full container height

                canvas.current = new Canvas(canvasRef.current, {
                    width: maxWidth,
                    height: maxHeight,
                    backgroundColor: '#f8f9fa'
                });

                // Add event listeners
                canvas.current.on('selection:created', handleSelection);
                canvas.current.on('selection:updated', handleSelection);
                canvas.current.on('selection:cleared', handleDeselection);
                canvas.current.on('object:modified', handleObjectModified);
                canvas.current.on('object:moving', handleObjectModified);
                canvas.current.on('object:scaling', handleObjectModified);
                canvas.current.on('object:rotating', handleObjectModified);
                canvas.current.on('mouse:down', handleObjectClick);

                // Mark canvas as ready with a small delay to ensure full initialization
                setTimeout(() => {
                    setCanvasReady(true);
                }, 100);
            } catch (error) {
            }
        }
    }, [loading]);

    // Handle canvas visibility restoration
    const handleCanvasVisibilityChange = () => {
        if (canvas.current && !document.hidden) {
            // Force canvas to re-render all objects
            canvas.current.renderAll();
            // Trigger a small delay to ensure proper rendering
            setTimeout(() => {
                canvas.current.renderAll();
            }, 100);
        }
    };

    // Handle canvas resize
    const handleCanvasResize = () => {
        if (canvas.current && canvasRef.current) {
            const container = canvasRef.current.parentElement;
            const containerRect = container.getBoundingClientRect();

            const maxWidth = containerRect.width; // Use full container width
            const maxHeight = containerRect.height; // Use full container height

            canvas.current.setDimensions({
                width: maxWidth,
                height: maxHeight
            });
            canvas.current.renderAll();
        }
    };

    // Add resize and visibility listeners
    useEffect(() => {
        if (canvasReady && canvas.current) {
            const handleResize = () => {
                handleCanvasResize();
            };

            const handleVisibilityChange = () => {
                handleCanvasVisibilityChange();
            };

            const handleWindowFocus = () => {
                canvas.current.renderAll();
            };

            // Periodic canvas refresh to ensure objects stay visible
            const refreshInterval = setInterval(() => {
                if (canvas.current && canvas.current.getObjects().length > 0) {
                    canvas.current.renderAll();
                }
            }, 2000); // Refresh every 2 seconds

            window.addEventListener('resize', handleResize);
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleWindowFocus);

            return () => {
                clearInterval(refreshInterval);
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleWindowFocus);
            };
        }
    }, [canvasReady]);

    // Cleanup effect - runs only on unmount
    useEffect(() => {
        return () => {
            if (canvas.current) {
                canvas.current.dispose();
                canvas.current = null;
            }
            setCanvasReady(false);
        };
    }, []);

    // Initialize color wheel
    useEffect(() => {

        if (colorWheelRef.current) {
            drawColorWheel();
        } else {
        }
    }, [selectedColor, objectUpdateTrigger]);

    // Draw color wheel on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (colorWheelRef.current) {
                drawColorWheel();
            } else {
            }
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // Fetch blocked dates on component mount
    // useEffect(() => {
    //     fetchBlockedDates();
    //     // Generate available time slots
    //     setAvailableTimeSlots(generateTimeSlots());
    // }, []);

    // Check capacity when month changes
    useEffect(() => {
        checkMonthCapacity();
    }, [currentMonth]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCustomCalendar) {
                const calendarElement = event.target.closest('.custom-calendar');
                const dateFieldElement = event.target.closest('.date-field-container');

                if (!calendarElement && !dateFieldElement) {
                    setShowCustomCalendar(false);
                }
            }
        };

        if (showCustomCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCustomCalendar]);

    const handleSelection = () => {

        if (!canvas.current) {
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            setSelectedObject(activeObject);
            setObjectUpdateTrigger(prev => prev + 1);

            // Update local state variables for sliders
            if (activeObject.type === 'text') {
                setCurrentFontSize(activeObject.fontSize || 24);
            }

            if (activeObject.type === 'text') {
                setSelectedColor(activeObject.fill);
            } else {
                setSelectedColor(activeObject.fill || '#FF0000');
            }
        }
    };

    const handleDeselection = () => {
        setTextValue('');
        setFontSize(24);
        setFontFamily('Poppins');
        setSelectedColor('#FF0000');
        setSelectedObject(null);
        setObjectUpdateTrigger(0);
        // Clear local state variables for sliders
        setCurrentFontSize(24);
    };

    const handleObjectModified = () => {
        // Force a re-render of the properties panel
        setObjectUpdateTrigger(prev => prev + 1);
    };

    const handleObjectClick = (e) => {
        if (e.target) {
            // Object was clicked, make it active
            canvas.current.setActiveObject(e.target);
            canvas.current.renderAll();
            // Trigger selection handler to update properties panel
            handleSelection();
        }
    };

    // Add cake base to canvas
    const addCakeBase = (cake) => {

        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }


        // Try to load image with CORS support first
        const loadImageWithFallback = async () => {
            try {
                // First try with crossOrigin
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = cake.publicUrl;
                });

                const fabricImage = new FabricImage(img);
                fabricImage.scaleToWidth(300);
                fabricImage.set({
                    left: 250,
                    top: 200,
                    name: 'cake-base',
                    assetId: cake.cake_id, // Store the asset ID
                    assetType: 'cake base'
                });
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();
                forceCanvasRefresh();

                // Track the used asset
                console.log('Adding cake base asset:', {
                    asset_id: cake.cake_id,
                    asset_type: 'cake base',
                    quantity: 1
                });
                setUsedAssets(prev => {
                    const existingAssetIndex = prev.findIndex(asset =>
                        asset.asset_id === cake.cake_id && asset.asset_type === 'cake base'
                    );

                    if (existingAssetIndex !== -1) {
                        // Asset exists, increment quantity
                        const newAssets = [...prev];
                        newAssets[existingAssetIndex].quantity += 1;
                        console.log('Updated usedAssets (cake base - increment):', newAssets);
                        return newAssets;
                    } else {
                        // Asset doesn't exist, add new entry
                        const newAssets = [...prev, {
                            asset_id: cake.cake_id,
                            asset_type: 'cake base',
                            quantity: 1
                        }];
                        console.log('Updated usedAssets (cake base - new):', newAssets);
                        return newAssets;
                    }
                });

            } catch (corsError) {
                try {
                    // Fallback: convert to data URL
                    const dataURL = await imageToDataURL(cake.publicUrl);
                    const img = new Image();
                    img.onload = () => {
                        const fabricImage = new FabricImage(img);
                        fabricImage.scaleToWidth(300);
                        fabricImage.set({
                            left: 250,
                            top: 200,
                            name: 'cake-base',
                            assetId: cake.cake_id, // Store the asset ID
                            assetType: 'cake base'
                        });
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();
                        forceCanvasRefresh();

                        // Track the used asset
                        console.log('Adding cake base asset (fallback):', {
                            asset_id: cake.cake_id,
                            asset_type: 'cake base',
                            quantity: 1
                        });
                        setUsedAssets(prev => {
                            const existingAssetIndex = prev.findIndex(asset =>
                                asset.asset_id === cake.cake_id && asset.asset_type === 'cake base'
                            );

                            if (existingAssetIndex !== -1) {
                                // Asset exists, increment quantity
                                const newAssets = [...prev];
                                newAssets[existingAssetIndex].quantity += 1;
                                console.log('Updated usedAssets (cake base fallback - increment):', newAssets);
                                return newAssets;
                            } else {
                                // Asset doesn't exist, add new entry
                                const newAssets = [...prev, {
                                    asset_id: cake.cake_id,
                                    asset_type: 'cake base',
                                    quantity: 1
                                }];
                                console.log('Updated usedAssets (cake base fallback - new):', newAssets);
                                return newAssets;
                            }
                        });
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    toast.error('Failed to load cake image');
                }
            }
        };

        loadImageWithFallback();
    };

    // Add decoration to canvas
    const addDecoration = (decoration) => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        // The image_path now contains the full path with folder structure
        const imageUrl = getPublicImageUrl(decoration.image_path);

        // Try to load image with CORS support first
        const loadImageWithFallback = async () => {
            try {
                // First try with crossOrigin
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });

                const fabricImage = new FabricImage(img);
                fabricImage.scaleToWidth(80);
                fabricImage.set({
                    left: 300,
                    top: 250,
                    name: 'decoration',
                    assetId: decoration.id, // Store the asset ID
                    assetType: 'icing'
                });
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();

                // Track the used asset
                console.log('Adding decoration asset:', {
                    asset_id: decoration.id,
                    asset_type: 'icing',
                    quantity: 1
                });
                setUsedAssets(prev => {
                    const existingAssetIndex = prev.findIndex(asset =>
                        asset.asset_id === decoration.id && asset.asset_type === 'icing'
                    );

                    if (existingAssetIndex !== -1) {
                        // Asset exists, increment quantity
                        const newAssets = [...prev];
                        newAssets[existingAssetIndex].quantity += 1;
                        console.log('Updated usedAssets (decoration - increment):', newAssets);
                        return newAssets;
                    } else {
                        // Asset doesn't exist, add new entry
                        const newAssets = [...prev, {
                            asset_id: decoration.id,
                            asset_type: 'icing',
                            quantity: 1
                        }];
                        console.log('Updated usedAssets (decoration - new):', newAssets);
                        return newAssets;
                    }
                });

            } catch (corsError) {
                try {
                    // Fallback: convert to data URL
                    const dataURL = await imageToDataURL(imageUrl);
                    const img = new Image();
                    img.onload = () => {
                        const fabricImage = new FabricImage(img);
                        fabricImage.scaleToWidth(80);
                        fabricImage.set({
                            left: 300,
                            top: 250,
                            name: 'decoration',
                            assetId: decoration.id, // Store the asset ID
                            assetType: 'icing'
                        });
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();

                        // Track the used asset
                        console.log('Adding decoration asset (fallback):', {
                            asset_id: decoration.id,
                            asset_type: 'icing',
                            quantity: 1
                        });
                        setUsedAssets(prev => {
                            const existingAssetIndex = prev.findIndex(asset =>
                                asset.asset_id === decoration.id && asset.asset_type === 'icing'
                            );

                            if (existingAssetIndex !== -1) {
                                // Asset exists, increment quantity
                                const newAssets = [...prev];
                                newAssets[existingAssetIndex].quantity += 1;
                                console.log('Updated usedAssets (decoration fallback - increment):', newAssets);
                                return newAssets;
                            } else {
                                // Asset doesn't exist, add new entry
                                const newAssets = [...prev, {
                                    asset_id: decoration.id,
                                    asset_type: 'icing',
                                    quantity: 1
                                }];
                                console.log('Updated usedAssets (decoration fallback - new):', newAssets);
                                return newAssets;
                            }
                        });
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    toast.error('Failed to load decoration image');
                }
            }
        };

        loadImageWithFallback();
    };

    // Add topping to canvas
    const addTopping = (topping) => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        // Use the topping.src directly as it should already contain the full path
        const imageUrl = getPublicImageUrl(topping.src);

        // Try to load image with CORS support first
        const loadImageWithFallback = async () => {
            try {
                // First try with crossOrigin
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });

                const fabricImage = new FabricImage(img);
                fabricImage.scaleToWidth(60);
                fabricImage.set({
                    left: 320,
                    top: 270,
                    name: 'topping',
                    assetId: topping.id, // Store the asset ID
                    assetType: 'topping'
                });
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();

                // Track the used asset
                console.log('Adding topping asset:', {
                    asset_id: topping.id,
                    asset_type: 'topping',
                    quantity: 1
                });
                setUsedAssets(prev => {
                    const existingAssetIndex = prev.findIndex(asset =>
                        asset.asset_id === topping.id && asset.asset_type === 'topping'
                    );

                    if (existingAssetIndex !== -1) {
                        // Asset exists, increment quantity
                        const newAssets = [...prev];
                        newAssets[existingAssetIndex].quantity += 1;
                        console.log('Updated usedAssets (topping - increment):', newAssets);
                        return newAssets;
                    } else {
                        // Asset doesn't exist, add new entry
                        const newAssets = [...prev, {
                            asset_id: topping.id,
                            asset_type: 'topping',
                            quantity: 1
                        }];
                        console.log('Updated usedAssets (topping - new):', newAssets);
                        return newAssets;
                    }
                });

            } catch (corsError) {
                try {
                    // Fallback: convert to data URL
                    const dataURL = await imageToDataURL(imageUrl);
                    const img = new Image();
                    img.onload = () => {
                        const fabricImage = new FabricImage(img);
                        fabricImage.scaleToWidth(60);
                        fabricImage.set({
                            left: 320,
                            top: 270,
                            name: 'topping',
                            assetId: topping.id, // Store the asset ID
                            assetType: 'topping'
                        });
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();

                        // Track the used asset
                        console.log('Adding topping asset (fallback):', {
                            asset_id: topping.id,
                            asset_type: 'topping',
                            quantity: 1
                        });
                        setUsedAssets(prev => {
                            const existingAssetIndex = prev.findIndex(asset =>
                                asset.asset_id === topping.id && asset.asset_type === 'topping'
                            );

                            if (existingAssetIndex !== -1) {
                                // Asset exists, increment quantity
                                const newAssets = [...prev];
                                newAssets[existingAssetIndex].quantity += 1;
                                console.log('Updated usedAssets (topping fallback - increment):', newAssets);
                                return newAssets;
                            } else {
                                // Asset doesn't exist, add new entry
                                const newAssets = [...prev, {
                                    asset_id: topping.id,
                                    asset_type: 'topping',
                                    quantity: 1
                                }];
                                console.log('Updated usedAssets (topping fallback - new):', newAssets);
                                return newAssets;
                            }
                        });
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    toast.error('Failed to load topping image');
                }
            }
        };

        loadImageWithFallback();
    };

    // Add text to canvas
    // Force canvas refresh
    const forceCanvasRefresh = () => {
        if (canvas.current) {
            canvas.current.renderAll();
            // Additional refresh after a short delay
            setTimeout(() => {
                canvas.current.renderAll();
            }, 50);
        }
    };

    const addText = async () => {
        if (!textValue.trim()) {
            toast.error('Please enter some text');
            return;
        }

        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        // Ensure font is loaded before creating text
        await loadFont(fontFamily);

        // Double-check font availability
        const fontAvailable = document.fonts.check(`16px "${fontFamily}"`);
        console.log(`Font ${fontFamily} available:`, fontAvailable);

        const text = new FabricText(textValue, {
            left: 350,
            top: 100,
            fontSize: fontSize,
            fontFamily: fontAvailable ? fontFamily : 'Arial', // Fallback to Arial if font not available
            fill: selectedColor,
            name: 'text'
        });

        canvas.current.add(text);
        canvas.current.setActiveObject(text);
        canvas.current.renderAll();

        // Trigger selection handler to update properties panel
        handleSelection();

        // Force additional refresh
        forceCanvasRefresh();

        setTextValue('');
    };

    // Change color of selected object
    const changeColor = (color) => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            activeObject.set('fill', color);
            canvas.current.renderAll();
            setSelectedColor(color);
            setObjectUpdateTrigger(prev => prev + 1);
            toast.success('Color changed');
        } else {
            toast.error('Please select an object first');
        }
    };

    // Change size of selected object
    const changeSize = (scale) => {

        // More robust check for canvas readiness
        if (!canvasReady) {
            toast.error('Canvas not ready');
            return;
        }

        if (!canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        if (typeof canvas.current.getActiveObject !== 'function') {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();

        if (activeObject) {
            activeObject.scale(scale);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
        } else {
            toast.error('Please select an object first');
        }
    };

    // Delete selected object
    const deleteSelected = () => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            canvas.current.remove(activeObject);
            canvas.current.renderAll();
        } else {
            toast.error('Please select an object first');
        }
    };

    // Clear canvas
    const clearCanvas = () => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        canvas.current.clear();
        canvas.current.backgroundColor = '#f8f9fa';
        canvas.current.renderAll();

        console.log('=== CANVAS CLEARED ===');
        console.log('Clearing usedAssets array');
        setUsedAssets([]);
        console.log('usedAssets after clear:', []);
        console.log('=== END CANVAS CLEARED ===');

        toast.success('Canvas cleared');
    };

    // Z-index control functions
    const bringToFront = () => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            canvas.current.bringObjectToFront(activeObject);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
        } else {
            toast.error('Please select an object first');
        }
    };

    const sendToBack = () => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            canvas.current.sendObjectToBack(activeObject);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
        } else {
            toast.error('Please select an object first');
        }
    };

    const bringForward = () => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            canvas.current.bringObjectForward(activeObject);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
        } else {
            toast.error('Please select an object first');
        }
    };

    const sendBackward = () => {
        if (!canvasReady || !canvas.current || !canvas.current.getActiveObject) {
            toast.error('Canvas not ready');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        if (activeObject) {
            canvas.current.sendObjectBackwards(activeObject);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
        } else {
            toast.error('Please select an object first');
        }
    };

    // Save design to bucket and create order
    const exportDesign = async () => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        try {
            // Show loading state
            toast.loading('Preparing your custom cake design...');

            // Convert canvas to blob
            const dataURL = canvas.current.toDataURL({
                format: 'png',
                quality: 1
            });

            // Convert data URL to blob
            const response = await fetch(dataURL);
            const blob = await response.blob();

            // Store the image data for later use
            setCustomCakeImage({
                dataURL,
                blob,
                filename: `custom_cake_${Date.now()}.png`
            });

            // Set default order values
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            setOrderDate(sevenDaysFromNow.toISOString().split('T')[0]);
            setOrderTime("");
            setCurrentStep(1);

            // Close loading toast and open order modal
            toast.dismiss();

            console.log('=== EXPORT DESIGN DEBUG ===');
            console.log('usedAssets when exporting design:', usedAssets);
            console.log('usedAssets length:', usedAssets.length);
            console.log('=== END EXPORT DESIGN DEBUG ===');

            setIsOrderModalOpen(true);

        } catch (error) {
            toast.error('Failed to prepare design');
        }
    };

    // Order modal functions
    const closeOrderModal = () => {
        setIsOrderModalOpen(false);
        setOrderDate("");
        setOrderTime("");
        setOrderType("Pickup");
        setDeliveryAddress("");
        setCurrentStep(1);
        setIsOrderTypeDropdownOpen(false);
        setIsPlacingOrder(false);
        setCustomCakeImage(null);
    };

    const closeModal = () => {
        // This function is referenced but not used in custom cake context
        // Keeping it for compatibility with the integrated modal
    };

    const nextStep = () => {
        // Validate step 1 requirements before proceeding
        if (currentStep === 1) {
            if (!orderDate) {
                toast.error('Please select a date for your order');
                return;
            }
            if (!orderTime) {
                toast.error('Please select a time for your order');
                return;
            }
            if (orderType === "Delivery" && !deliveryAddress.trim()) {
                toast.error('Please enter a delivery address');
                return;
            }
            if (isDateBlocked || isDateBlockedForCalendar(orderDate)) {
                toast.error('The selected date is not available for orders');
                return;
            }
        }

        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle placing the custom cake order
    const handlePlaceOrder = async () => {
        if (isPlacingOrder) {
            return;
        }

        if (!customCakeImage || !orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate time is not after 8 PM
        if (orderTime) {
            const [hours, minutes] = orderTime.split(':');
            const hour = parseInt(hours);
            if (hour > 20 || (hour === 20 && parseInt(minutes) > 0)) {
                toast.error('Pickup/delivery time cannot be after 8:00 PM');
                setIsPlacingOrder(false);
                return;
            }
        }

        // Check if the selected date is blocked
        if (isDateBlockedForCalendar(orderDate)) {
            toast.error('The selected date is not available for orders');
            return;
        }

        setIsPlacingOrder(true);

        try {
            // Get customer ID from authentication
            const { data: customerData, error: customerError } = await supabase
                .from('CUSTOMER')
                .select('cus_id')
                .eq('auth_user_id', session.user.id)
                .single();

            if (customerError || !customerData) {
                toast.error('Customer information not found. Please try again.');
                return;
            }

            const cusId = customerData.cus_id;

            // Upload image to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('cust.cakes')
                .upload(customCakeImage.filename, customCakeImage.blob, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (uploadError) {
                toast.error('Failed to save design to storage');
                return;
            }

            // Get the next CC ID
            const { data: maxIdData } = await supabase
                .from('CUSTOM-CAKE')
                .select('cc_id')
                .order('cc_id', { ascending: false })
                .limit(1);

            const nextCcId = maxIdData && maxIdData.length > 0 ? maxIdData[0].cc_id + 1 : 6001;

            // Create order with proper scheduling
            const scheduledDate = new Date(`${orderDate}T${orderTime}`);
            const orderInsertData = {
                order_date: new Date().toISOString(), // Current date and time
                delivery_method: orderType,
                order_schedule: scheduledDate.toISOString(), // Include full datetime with time
                delivery_address: orderType === "Delivery" ? deliveryAddress : null,
                cus_id: cusId,
                order_status: 'Pending'
            };


            const { data: orderData, error: orderError } = await supabase
                .from('ORDER')
                .insert([orderInsertData])
                .select()
                .single();

            if (orderError) {
                toast.error(`Failed to create order: ${orderError.message}`);
                return;
            }


            // Insert into CUSTOM-CAKE table
            const customCakeData = {
                cc_id: nextCcId,
                cc_img: customCakeImage.filename,
                order_id: orderData.order_id,
                cus_id: cusId,
                auth_user_id: session.user.id
            };


            const { data: insertData, error: insertError } = await supabase
                .from('CUSTOM-CAKE')
                .insert(customCakeData);

            if (insertError) {
                toast.error(`Failed to save cake design to database: ${insertError.message}`);
                return;
            }

            // Save used assets to CUSTOM-CAKE-ASSETS table
            console.log('=== ASSET TRACKING DEBUG ===');
            console.log('usedAssets array:', usedAssets);
            console.log('usedAssets length:', usedAssets.length);
            console.log('nextCcId:', nextCcId);

            if (usedAssets.length > 0) {
                const customCakeAssetsData = usedAssets.map(asset => ({
                    cc_id: nextCcId,
                    asset_id: asset.asset_id,
                    quantity: asset.quantity
                }));

                console.log('customCakeAssetsData to insert:', customCakeAssetsData);

                const { data: insertData, error: assetsError } = await supabase
                    .from('CUSTOM-CAKE-ASSETS')
                    .insert(customCakeAssetsData)
                    .select();

                if (assetsError) {
                    console.error('Error saving custom cake assets:', assetsError);
                    console.error('Error details:', {
                        message: assetsError.message,
                        details: assetsError.details,
                        hint: assetsError.hint,
                        code: assetsError.code
                    });
                    // Don't fail the order if asset tracking fails
                } else {
                    console.log('Custom cake assets saved successfully:', insertData);
                }
            } else {
                console.log('No assets to save - usedAssets array is empty');
            }
            console.log('=== END ASSET TRACKING DEBUG ===');

            // Create payment record
            const customCakePrice = 1500; // Base price for custom cakes
            const totalPrice = customCakePrice * 1; // Fixed quantity of 1 for custom cakes

            const paymentData = {
                payment_method: "Cash",
                amount_paid: 0, // Default to 0.00 for new orders
                total: totalPrice, // Total price the customer needs to pay
                // payment_date: new Date().toISOString().split('T')[0],
                payment_status: "Unpaid",
                receipt: null,
                order_id: orderData.order_id
            };


            const { error: paymentError } = await supabase
                .from('PAYMENT')
                .insert([paymentData]);

            if (paymentError) {
                toast.error(`Failed to create payment record: ${paymentError.message}`);
                return;
            }


            // Show success notification
            toast.success('Custom cake order placed successfully!', {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '12px 16px',
                },
            });

            // Advance to success step
            setCurrentStep(3);

        } catch (error) {
            toast.error('Failed to place order. Please try again.', {
                duration: 4000,
                position: 'top-center',
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };


    // Show loading spinner while checking authentication or loading data
    if (!session || !session.user || loading) {
        return <LoadingSpinner message={!session ? "Checking authentication, please wait..." : "Loading cake designer..."} />;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Toolbar - Bakery Theme */}
            <div className="bg-gradient-to-r from-[#F8E6B4] to-[#E2D2A2] border-b border-[#AF524D]/20 px-6 py-4 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-2 left-20 w-12 h-12 bg-[#AF524D] rounded-full blur-xl"></div>
                    <div className="absolute top-2 right-20 w-16 h-16 bg-[#DFAD56] rounded-full blur-xl"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-[#E2D2A2] rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    {/* Left Section - Title and Tools */}
                    <div className="flex items-center space-x-6">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#AF524D] to-[#8B3A3A] rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-abhaya font-bold text-[#492220]">Cake Designer</h1>
                                <p className="text-xs text-[#492220]/70">Create your perfect cake</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-[#AF524D]/30"></div>

                        {/* Scroll Lock Toggle */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 border border-[#AF524D]/20">
                            <button
                                onClick={() => setIsScrollLocked(!isScrollLocked)}
                                className={`p-2 rounded-lg transition-all duration-200 ${isScrollLocked
                                    ? 'bg-red-100 text-red-600 border border-red-200'
                                    : 'text-[#492220] hover:bg-[#AF524D]/10'
                                    }`}
                                title={isScrollLocked ? "Unlock Scrolling" : "Lock Scrolling"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isScrollLocked ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    )}
                                </svg>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-[#AF524D]/30"></div>

                        {/* Tool Selection */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 border border-[#AF524D]/20 flex items-center space-x-1">
                            <button
                                onClick={() => setSelectedTool('select')}
                                className={`p-2 rounded-lg transition-all duration-200 ${selectedTool === 'select'
                                    ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                    : 'text-[#492220] hover:bg-[#AF524D]/10'
                                    }`}
                                title="Select Tool (V)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setSelectedTool('text')}
                                className={`p-2 rounded-lg transition-all duration-200 ${selectedTool === 'text'
                                    ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                    : 'text-[#492220] hover:bg-[#AF524D]/10'
                                    }`}
                                title="Text Tool (T)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Size Controls */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 border border-[#AF524D]/20 flex items-center space-x-1">
                            <button
                                onClick={() => changeSize(0.8)}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Decrease Size"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12H3" />
                                </svg>
                            </button>
                            <button
                                onClick={() => changeSize(1.2)}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Increase Size"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-[#AF524D]/30"></div>

                        {/* Layer Controls */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-2 border border-[#AF524D]/20 flex items-center space-x-1">
                            <button
                                onClick={bringToFront}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Bring to Front"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0l4 4m-4-4l-4 4M17 20V8m0 0l4 4m-4-4l-4 4" />
                                </svg>
                            </button>
                            <button
                                onClick={sendToBack}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Send to Back"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V20m0 0l-4-4m4 4l4-4M7 4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                            </button>
                            <button
                                onClick={bringForward}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Bring Forward"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            </button>
                            <button
                                onClick={sendBackward}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200"
                                title="Send Backward"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-[#AF524D]/30"></div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={deleteSelected}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                                title="Delete Selected"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={clearCanvas}
                                className="p-2 text-[#492220] hover:bg-[#AF524D]/10 rounded-lg transition-all duration-200 border border-[#AF524D]/20 hover:border-[#AF524D]/30"
                                title="Clear Canvas"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            <button
                                onClick={exportDesign}
                                className="px-4 py-2 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white text-sm font-semibold rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                title="Save Design"
                            >
                                Save Design
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Sidebar - Tools Panel */}
                <div className="w-80 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] border-r border-[#AF524D]/20 flex flex-col overflow-hidden relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-10 left-10 w-16 h-16 bg-[#AF524D] rounded-full blur-2xl"></div>
                        <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#DFAD56] rounded-full blur-2xl"></div>
                    </div>

                    {/* Text Controls */}
                    {selectedTool === 'text' && (
                        <div className="p-6 border-b border-[#AF524D]/20 relative z-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] rounded-2xl p-4 text-center relative overflow-hidden mb-6">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="relative z-10">
                                    <div className="w-10 h-10 mx-auto mb-2 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-abhaya font-bold text-white">Text Tool</h3>
                                    <p className="text-white/80 text-xs">Add text to your design</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <label className="block text-sm font-semibold text-[#492220] mb-2">Text Content</label>
                                    <input
                                        type="text"
                                        value={textValue}
                                        onChange={(e) => setTextValue(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                                        placeholder="Enter text..."
                                    />
                                </div>
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <label className="block text-sm font-semibold text-[#492220] mb-3">Font Size</label>
                                    <div className="space-y-3">
                                        <input
                                            type="range"
                                            min="12"
                                            max="72"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full h-2 bg-[#AF524D]/20 rounded-lg appearance-none cursor-pointer slider-design"
                                            style={{
                                                background: `linear-gradient(to right, #AF524D 0%, #AF524D ${((fontSize - 12) / (72 - 12)) * 100}%, #E5E7EB ${((fontSize - 12) / (72 - 12)) * 100}%, #E5E7EB 100%)`
                                            }}
                                        />
                                        <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl px-4 py-2 border border-[#AF524D]/20">
                                            <div className="text-sm font-semibold text-[#492220] text-center">{fontSize}px</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <label className="block text-sm font-semibold text-[#492220] mb-2">Font Family</label>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220]"
                                        style={{ fontFamily: fontFamily }}
                                    >
                                        <option value="Poppins" style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</option>
                                        <option value="Abhaya Libre" style={{ fontFamily: 'Abhaya Libre, serif' }}>Abhaya Libre</option>
                                        <option value="Arial" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
                                        <option value="Times New Roman" style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</option>
                                        <option value="Courier New" style={{ fontFamily: 'Courier New, monospace' }}>Courier New</option>
                                        <option value="Georgia" style={{ fontFamily: 'Georgia, serif' }}>Georgia</option>
                                        <option value="Verdana" style={{ fontFamily: 'Verdana, sans-serif' }}>Verdana</option>
                                    </select>
                                </div>
                                <button
                                    onClick={addText}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white text-sm font-semibold rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    Add Text to Canvas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Assets Panel with Tabs */}
                    <div className="flex-1 overflow-y-auto min-h-0 relative z-10 custom-scrollbar">
                        {/* Asset Type Tabs */}
                        <div className="p-6 pb-4 relative z-10">
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                <h3 className="text-lg font-abhaya font-bold text-[#492220] mb-4 text-center">Design Assets</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => setSelectedAssetType('cake base')}
                                        className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${selectedAssetType === 'cake base'
                                            ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                            : 'bg-white/50 text-[#492220] hover:bg-[#AF524D]/10 hover:border-[#AF524D] border border-[#AF524D]/20'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Cake Bases</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAssetType('icing')}
                                        className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${selectedAssetType === 'icing'
                                            ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                            : 'bg-white/50 text-[#492220] hover:bg-[#AF524D]/10 hover:border-[#AF524D] border border-[#AF524D]/20'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <span>Icing & Decorations</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAssetType('topping')}
                                        className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${selectedAssetType === 'topping'
                                            ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                            : 'bg-white/50 text-[#492220] hover:bg-[#AF524D]/10 hover:border-[#AF524D] border border-[#AF524D]/20'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                        </svg>
                                        <span>Toppings</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Asset Content */}
                        <div className="px-6 pb-6 relative z-10">
                            {selectedAssetType === 'cake base' && (
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <h3 className="text-lg font-abhaya font-bold text-[#492220] mb-4 text-center">Cake Bases</h3>
                                    {cakeImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {cakeImages.map((cake) => (
                                                <div key={cake.cake_id} className="group cursor-pointer">
                                                    <div className="relative bg-white/50 rounded-xl p-2 border border-[#AF524D]/20 hover:border-[#AF524D] transition-all duration-200">
                                                        <img
                                                            src={cake.publicUrl}
                                                            alt={cake.name}
                                                            className="w-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-200"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addCakeBase(cake)}
                                                            className="absolute inset-0 bg-gradient-to-t from-[#AF524D]/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-2"
                                                        >
                                                            <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg">Add to Canvas</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#AF524D]/20 to-[#8B3A3A]/20 rounded-2xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-[#AF524D]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-abhaya font-semibold text-[#492220] mb-2">No Cake Bases</h4>
                                            <p className="text-sm text-[#492220]/70">No cake bases available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAssetType === 'icing' && (
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <h3 className="text-lg font-abhaya font-bold text-[#492220] mb-4 text-center">Icing & Decorations</h3>
                                    {decorations.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {decorations.map((decoration) => (
                                                <div key={decoration.id} className="group cursor-pointer">
                                                    <div className="relative bg-white/50 rounded-xl p-2 border border-[#AF524D]/20 hover:border-[#AF524D] transition-all duration-200">
                                                        <img
                                                            src={getPublicImageUrl(decoration.image_path)}
                                                            alt={decoration.name}
                                                            className="w-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-200"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addDecoration(decoration)}
                                                            className="absolute inset-0 bg-gradient-to-t from-[#AF524D]/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-2"
                                                        >
                                                            <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg">Add to Canvas</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#AF524D]/20 to-[#8B3A3A]/20 rounded-2xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-[#AF524D]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-abhaya font-semibold text-[#492220] mb-2">No Decorations</h4>
                                            <p className="text-sm text-[#492220]/70">No decorations available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAssetType === 'topping' && (
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <h3 className="text-lg font-abhaya font-bold text-[#492220] mb-4 text-center">Toppings</h3>
                                    {toppings.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {toppings.map((topping) => (
                                                <div key={topping.id} className="group cursor-pointer">
                                                    <div className="relative bg-white/50 rounded-xl p-2 border border-[#AF524D]/20 hover:border-[#AF524D] transition-all duration-200">
                                                        <img
                                                            src={getPublicImageUrl(topping.src)}
                                                            alt={topping.name}
                                                            className="w-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-200"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addTopping(topping)}
                                                            className="absolute inset-0 bg-gradient-to-t from-[#AF524D]/80 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center pb-2"
                                                        >
                                                            <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg">Add to Canvas</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#AF524D]/20 to-[#8B3A3A]/20 rounded-2xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-[#AF524D]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-abhaya font-semibold text-[#492220] mb-2">No Toppings</h4>
                                            <p className="text-sm text-[#492220]/70">No toppings available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] flex items-center justify-center p-6 min-h-0 overflow-hidden relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-20 left-20 w-32 h-32 bg-[#AF524D] rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#DFAD56] rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#E2D2A2] rounded-full blur-3xl"></div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-10 left-10 animate-bounce">
                        <div className="w-6 h-6 bg-[#DFAD56] rounded-full opacity-60"></div>
                    </div>
                    <div className="absolute top-20 right-20 animate-pulse">
                        <div className="w-4 h-4 bg-[#AF524D] rounded-full opacity-40"></div>
                    </div>
                    <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
                        <div className="w-8 h-8 bg-[#E2D2A2] rounded-full opacity-50"></div>
                    </div>

                    {/* Canvas Container */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden w-full h-full min-w-[800px] min-h-[600px] relative">
                            {/* Canvas Content */}
                            <div className="bg-white h-full">
                                <canvas ref={canvasRef} className="w-full h-full" />
                            </div>

                            {/* Canvas Footer */}
                            <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 p-3 border-t border-[#AF524D]/20">
                                <div className="flex items-center justify-center space-x-4 text-sm text-[#492220]/70">
                                    <div className="flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                                        </svg>
                                        <span>Drag & Drop</span>
                                    </div>
                                    <div className="w-1 h-1 bg-[#AF524D]/30 rounded-full"></div>
                                    <div className="flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        <span>Add Text</span>
                                    </div>
                                    <div className="w-1 h-1 bg-[#AF524D]/30 rounded-full"></div>
                                    <div className="flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Customize</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                <div className="w-80 bg-gradient-to-br from-[#F8E6B4] to-[#E2D2A2] border-l border-[#AF524D]/20 p-6 relative overflow-y-auto max-h-full">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-10 right-10 w-16 h-16 bg-[#AF524D] rounded-full blur-2xl"></div>
                        <div className="absolute bottom-10 left-10 w-20 h-20 bg-[#DFAD56] rounded-full blur-2xl"></div>
                    </div>

                    {/* Header */}
                    <div className="relative z-10 mb-6">
                        <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] rounded-2xl p-4 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-abhaya font-bold text-white">Properties</h3>
                                <p className="text-white/80 text-xs">Customize your design</p>
                            </div>
                        </div>
                    </div>
                    {selectedObject ? (
                        // Use objectUpdateTrigger to force re-render when object properties change
                        <div key={objectUpdateTrigger} className="space-y-6 relative z-10 pb-4">
                            {/* Color Picker - Only show when text object is selected */}
                            {selectedObject.type === 'text' && (
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                    <label className="block text-sm font-semibold text-[#492220] mb-3">Text Color</label>
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="bg-white/50 rounded-xl p-3 border border-[#AF524D]/20 color-picker-container">
                                            <canvas
                                                ref={colorWheelRef}
                                                width="120"
                                                height="120"
                                                className="border-2 border-[#AF524D]/30 rounded-xl cursor-pointer shadow-lg"
                                                onMouseDown={handleMouseDown}
                                                title="Click and drag to select color"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-3 bg-white/50 rounded-xl px-4 py-2 border border-[#AF524D]/20">
                                            <div className="w-6 h-6 rounded-full border-2 border-[#AF524D]/30" style={{ backgroundColor: selectedColor }}></div>
                                            <span className="text-sm font-mono text-[#492220] font-semibold">{selectedColor}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                <label className="block text-sm font-semibold text-[#492220] mb-2">Object Type</label>
                                <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl px-4 py-3 border border-[#AF524D]/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-[#AF524D] rounded-full"></div>
                                        <span className="text-sm font-semibold text-[#492220] capitalize">{selectedObject.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                <label className="block text-sm font-semibold text-[#492220] mb-3">Layer Order</label>
                                <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl px-4 py-3 border border-[#AF524D]/20 mb-4">
                                    <div className="text-sm font-semibold text-[#492220] text-center">
                                        {canvas.current.getObjects().indexOf(selectedObject) + 1} of {canvas.current.getObjects().length}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={sendBackward}
                                        className="px-3 py-2 text-xs bg-white/70 hover:bg-[#AF524D]/10 border border-[#AF524D]/20 rounded-xl transition-all duration-200 text-[#492220] font-semibold hover:border-[#AF524D] flex items-center justify-center space-x-1"
                                        title="Send Backward"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span>Back</span>
                                    </button>
                                    <button
                                        onClick={bringForward}
                                        className="px-3 py-2 text-xs bg-white/70 hover:bg-[#AF524D]/10 border border-[#AF524D]/20 rounded-xl transition-all duration-200 text-[#492220] font-semibold hover:border-[#AF524D] flex items-center justify-center space-x-1"
                                        title="Bring Forward"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span>Front</span>
                                    </button>
                                    <button
                                        onClick={sendToBack}
                                        className="px-3 py-2 text-xs bg-white/70 hover:bg-[#AF524D]/10 border border-[#AF524D]/20 rounded-xl transition-all duration-200 text-[#492220] font-semibold hover:border-[#AF524D] flex items-center justify-center space-x-1"
                                        title="Send to Back"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span>Bottom</span>
                                    </button>
                                    <button
                                        onClick={bringToFront}
                                        className="px-3 py-2 text-xs bg-white/70 hover:bg-[#AF524D]/10 border border-[#AF524D]/20 rounded-xl transition-all duration-200 text-[#492220] font-semibold hover:border-[#AF524D] flex items-center justify-center space-x-1"
                                        title="Bring to Front"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span>Top</span>
                                    </button>
                                </div>
                            </div>


                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                <label className="block text-sm font-semibold text-[#492220] mb-3">Size</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-[#492220]/70">Width (inches)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={Math.round(((selectedObject.width * (selectedObject.scaleX || 1)) / 96) * 20) / 10}
                                            onChange={(e) => {
                                                const newWidthInches = parseFloat(e.target.value) / 2; // Divide by 2 since display is doubled
                                                const newWidthPixels = newWidthInches * 96;
                                                const scaleX = newWidthPixels / selectedObject.width;
                                                selectedObject.set('scaleX', scaleX);
                                                canvas.current.renderAll();
                                                setObjectUpdateTrigger(prev => prev + 1);
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                                            placeholder="Width (in)"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-[#492220]/70">Height (inches)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={Math.round(((selectedObject.height * (selectedObject.scaleY || 1)) / 96) * 20) / 10}
                                            onChange={(e) => {
                                                const newHeightInches = parseFloat(e.target.value) / 2; // Divide by 2 since display is doubled
                                                const newHeightPixels = newHeightInches * 96;
                                                const scaleY = newHeightPixels / selectedObject.height;
                                                selectedObject.set('scaleY', scaleY);
                                                canvas.current.renderAll();
                                                setObjectUpdateTrigger(prev => prev + 1);
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                                            placeholder="Height (in)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                <label className="block text-sm font-semibold text-[#492220] mb-3">Rotation</label>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        value={Math.round(selectedObject.angle || 0)}
                                        onChange={(e) => {
                                            selectedObject.set('angle', parseFloat(e.target.value));
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                                        placeholder="Rotation (degrees)"
                                    />
                                    <div className="text-xs text-[#492220]/70 text-center">Degrees (0-360)</div>
                                </div>
                            </div>


                            {selectedObject.type === 'text' && (
                                <>
                                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                        <label className="block text-sm font-semibold text-[#492220] mb-3">Text Content</label>
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={selectedObject.text || ''}
                                                onChange={(e) => {
                                                    selectedObject.set('text', e.target.value);
                                                    canvas.current.renderAll();
                                                    setObjectUpdateTrigger(prev => prev + 1);
                                                }}
                                                className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                                                placeholder="Enter text..."
                                            />
                                            <div className="text-xs text-[#492220]/70 text-center">Edit the text content</div>
                                        </div>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                        <label className="block text-sm font-semibold text-[#492220] mb-3">Font Family</label>
                                        <select
                                            value={(() => {
                                                const activeObject = canvas.current?.getActiveObject();
                                                return activeObject?.type === 'text' ? activeObject.fontFamily || 'Poppins' : 'Poppins';
                                            })()}
                                            onChange={async (e) => {
                                                const newFontFamily = e.target.value;
                                                await loadFont(newFontFamily);
                                                if (canvas.current) {
                                                    const activeObject = canvas.current.getActiveObject();
                                                    if (activeObject && activeObject.type === 'text') {
                                                        activeObject.set('fontFamily', newFontFamily);
                                                        canvas.current.renderAll();
                                                        setObjectUpdateTrigger(prev => prev + 1);
                                                    }
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220]"
                                            style={{
                                                fontFamily: (() => {
                                                    const activeObject = canvas.current?.getActiveObject();
                                                    return activeObject?.type === 'text' ? activeObject.fontFamily || 'Poppins' : 'Poppins';
                                                })()
                                            }}
                                        >
                                            <option value="Poppins" style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</option>
                                            <option value="Abhaya Libre" style={{ fontFamily: 'Abhaya Libre, serif' }}>Abhaya Libre</option>
                                            <option value="Arial" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
                                            <option value="Times New Roman" style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</option>
                                            <option value="Courier New" style={{ fontFamily: 'Courier New, monospace' }}>Courier New</option>
                                            <option value="Georgia" style={{ fontFamily: 'Georgia, serif' }}>Georgia</option>
                                            <option value="Verdana" style={{ fontFamily: 'Verdana, sans-serif' }}>Verdana</option>
                                        </select>
                                    </div>

                                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-[#AF524D]/20">
                                        <label className="block text-sm font-semibold text-[#492220] mb-3">Font Size</label>
                                        <div className="space-y-3">
                                            <input
                                                type="range"
                                                min="12"
                                                max="72"
                                                value={(() => {
                                                    const activeObject = canvas.current?.getActiveObject();
                                                    return activeObject?.type === 'text' ? activeObject.fontSize || 24 : 24;
                                                })()}
                                                onChange={(e) => {
                                                    const newSize = parseInt(e.target.value);
                                                    setCurrentFontSize(newSize); // slider moves immediately
                                                    if (canvas.current) {
                                                        const activeObject = canvas.current.getActiveObject();
                                                        if (activeObject && activeObject.type === 'text') {
                                                            activeObject.set('fontSize', newSize);
                                                            canvas.current.renderAll();
                                                        }
                                                    }
                                                }}
                                                className="w-full h-2 bg-[#AF524D]/20 rounded-lg appearance-none cursor-pointer slider-design"
                                                style={{
                                                    background: (() => {
                                                        const activeObject = canvas.current?.getActiveObject();
                                                        const fontSize = activeObject?.type === 'text' ? activeObject.fontSize || 24 : 24;
                                                        const percentage = ((fontSize - 12) / (72 - 12)) * 100;
                                                        return `linear-gradient(to right, #AF524D 0%, #AF524D ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`;
                                                    })()
                                                }}
                                            />
                                            <div className="bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl px-4 py-2 border border-[#AF524D]/20">
                                                <div className="text-sm font-semibold text-[#492220] text-center">
                                                    {(() => {
                                                        const activeObject = canvas.current?.getActiveObject();
                                                        return activeObject?.type === 'text' ? activeObject.fontSize || 24 : 24;
                                                    })()}px
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 relative z-10">
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-[#AF524D]/20">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#AF524D]/20 to-[#8B3A3A]/20 rounded-2xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-[#AF524D]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-abhaya font-semibold text-[#492220] mb-2">No Object Selected</h4>
                                <p className="text-sm text-[#492220]/70">Click on an object to customize its properties</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {isOrderModalOpen && customCakeImage && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeOrderModal}
                >
                    <div
                        className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-6 text-center relative">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-abhaya font-bold text-white mb-2">Complete Your Order</h2>
                                <p className="text-white/80 text-sm">Follow the steps to place your order</p>
                            </div>
                            <button
                                onClick={closeOrderModal}
                                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold cursor-pointer transition-colors duration-200 hover:scale-110 transform"
                            >
                                ×
                            </button>
                        </div>

                        {/* Breadcrumb Navigation */}
                        <div className="px-6 py-6 bg-[#F8E6B4]/20">
                            <div className="flex items-center justify-center space-x-4">
                                <div className={`flex items-center ${currentStep >= 1 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        1
                                    </div>
                                    <span className="ml-3 text-sm font-medium">Order Details</span>
                                </div>

                                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A]' : 'bg-gray-200'}`}></div>

                                <div className={`flex items-center ${currentStep >= 2 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        2
                                    </div>
                                    <span className="ml-3 text-sm font-medium">Review</span>
                                </div>

                                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A]' : 'bg-gray-200'}`}></div>

                                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep >= 3 ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        3
                                    </div>
                                    <span className="ml-3 text-sm font-medium">Success</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Custom Cake Summary */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-[#F8E6B4]/30 to-[#E2D2A2]/30 rounded-2xl border border-[#AF524D]/20">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={customCakeImage.dataURL}
                                        alt="Custom Cake Design"
                                        className="w-16 h-16 object-contain rounded-xl shadow-lg"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-[#492220] text-lg">Custom Cake Design</h3>
                                        <p className="text-[#AF524D] font-bold text-xl"> Estimated Price: ₱1,500</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="bg-[#AF524D]/10 text-[#AF524D] px-2 py-1 rounded-full text-xs">
                                                Custom
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Order Details */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    {/* Quantity Selection */}

                                    {/* Date Selection */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Pickup/Delivery Date *
                                        </label>
                                        <div className="relative">
                                            <div
                                                className="date-field-container flex items-center gap-3 p-4 bg-white/70 border border-[#AF524D]/20 rounded-xl focus-within:ring-2 focus-within:ring-[#AF524D]/30 focus-within:border-[#AF524D] transition-all duration-200 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCustomCalendar(!showCustomCalendar);
                                                }}
                                            >
                                                <div className="flex-shrink-0">
                                                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="w-full bg-transparent border-none outline-none text-[#492220] font-medium">
                                                        {orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) : 'Select a date'}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <svg className={`w-4 h-4 text-[#AF524D] transition-transform duration-200 ${showCustomCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Custom Calendar Dropdown */}
                                            {showCustomCalendar && (
                                                <div className="custom-calendar absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-[#AF524D]/20 z-50 p-4">
                                                    {/* 7-day minimum notice */}
                                                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-xs text-blue-700 text-center">
                                                            📅 Orders require at least 7 days advance notice
                                                        </p>
                                                    </div>
                                                    {/* Calendar Header */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <button
                                                            onClick={() => navigateMonth(-1)}
                                                            className="p-2 hover:bg-[#AF524D]/10 rounded-lg transition-colors duration-200"
                                                        >
                                                            <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <h3 className="text-lg font-semibold text-[#492220]">
                                                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </h3>
                                                        <button
                                                            onClick={() => navigateMonth(1)}
                                                            className="p-2 hover:bg-[#AF524D]/10 rounded-lg transition-colors duration-200"
                                                        >
                                                            <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Calendar Grid */}
                                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                            <div key={day} className="p-2 text-center text-sm font-medium text-[#AF524D]">
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-7 gap-1">
                                                        {getDaysInMonth(currentMonth).map((date, index) => {
                                                            if (!date) {
                                                                return <div key={index} className="p-2"></div>;
                                                            }

                                                            const isPast = isDateInPast(date);
                                                            const isBlocked = isDateBlockedInCalendar(date);
                                                            const isSelected = orderDate === formatDateForCalendar(date);
                                                            const isAtCapacity = dateCapacity[formatDateForCalendar(date)] || false;
                                                            const today = new Date();
                                                            today.setHours(12, 0, 0, 0);
                                                            const isToday = formatDateForCalendar(date) === formatDateForCalendar(today);

                                                            return (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => handleDateSelect(date)}
                                                                    disabled={isPast || isBlocked || isAtCapacity}
                                                                    className={`p-2 text-sm rounded-lg transition-all duration-200 ${isSelected
                                                                        ? 'bg-[#AF524D] text-white font-semibold'
                                                                        : isPast
                                                                            ? 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                                            : isBlocked
                                                                                ? 'text-red-400 bg-red-50 cursor-not-allowed line-through'
                                                                                : isAtCapacity
                                                                                    ? 'text-orange-400 bg-orange-50 cursor-not-allowed'
                                                                                    : 'text-[#492220] hover:bg-[#AF524D]/10 hover:text-[#AF524D]'
                                                                        }`}
                                                                >
                                                                    {date.getDate()}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Legend */}
                                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                                        <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                                                                <span>Blocked</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                                                                <span>Too Soon</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                                                                <span>Full (4 orders)</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-3 h-3 bg-[#AF524D] rounded"></div>
                                                                <span>Selected</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {orderDate && (
                                                <div className="mt-3 space-y-2">
                                                    <div className={`p-3 rounded-xl border ${isDateBlockedForCalendar(orderDate)
                                                        ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-300'
                                                        : 'bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 border-[#AF524D]/20'
                                                        }`}>
                                                        <p className={`text-sm font-medium ${isDateBlockedForCalendar(orderDate)
                                                            ? 'text-red-700'
                                                            : 'text-[#492220]'
                                                            }`}>
                                                            Selected: {new Date(orderDate).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                            {isDateBlockedForCalendar(orderDate) && (
                                                                <span className="block mt-1 text-xs text-red-600 font-semibold">
                                                                    ⚠️ This date is not available for orders
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {isCheckingBlockedDates && (
                                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <p className="text-sm text-blue-600 font-medium">Checking availability...</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {isDateBlocked && !isCheckingBlockedDates && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                </svg>
                                                                <div>
                                                                    <p className="text-sm text-red-600 font-medium">This date is not available for orders</p>
                                                                    {blockedReason && (
                                                                        <p className="text-xs text-red-500 mt-1">Reason: {blockedReason}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time Selection */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Pickup/Delivery Time *
                                        </label>

                                        {isDateBlocked ? (
                                            <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl">
                                                <p className="text-sm text-gray-500 text-center">No time slots available for this date</p>
                                            </div>
                                        ) : availableTimeSlots.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="text-xs text-gray-600 text-center">
                                                    Available times: 8:00 AM - 8:00 PM
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                                    {availableTimeSlots.map((timeSlot) => (
                                                        <button
                                                            key={timeSlot}
                                                            type="button"
                                                            onClick={() => setOrderTime(timeSlot)}
                                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${orderTime === timeSlot
                                                                ? 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white shadow-lg'
                                                                : 'bg-white/70 border border-[#AF524D]/20 text-[#492220] hover:bg-[#AF524D]/10 hover:border-[#AF524D]/40'
                                                                }`}
                                                        >
                                                            {formatTime(timeSlot)}
                                                        </button>
                                                    ))}
                                                </div>
                                                {orderTime && (
                                                    <div className="p-3 bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl border border-[#AF524D]/20">
                                                        <p className="text-sm text-[#492220] font-medium">
                                                            Selected: {formatTime(orderTime)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : orderDate && !isCheckingBlockedDates ? (
                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    <p className="text-sm text-yellow-600 font-medium">No available time slots for this date</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl">
                                                <p className="text-sm text-gray-500 text-center">Select a date to see available times</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Type */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            Order Type
                                        </label>
                                        <div className="relative">
                                            <div
                                                className="flex items-center gap-3 p-4 bg-white/70 border border-[#AF524D]/20 rounded-xl cursor-pointer hover:bg-white/90 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#AF524D]/30 focus-within:border-[#AF524D]"
                                                onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
                                            >
                                                <div className="flex-shrink-0">
                                                    <svg className="w-5 h-5 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[#492220] font-medium">
                                                        {orderType}
                                                    </span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className={`w-5 h-5 text-[#AF524D] transition-transform duration-200 ${isOrderTypeDropdownOpen ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Custom Dropdown */}
                                            {isOrderTypeDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#AF524D] rounded-lg shadow-lg z-10">
                                                    <div
                                                        className="p-3 hover:bg-[#AF524D] hover:text-white cursor-pointer transition-colors border-b border-gray-100"
                                                        onClick={() => {
                                                            setOrderType("Pickup");
                                                            setIsOrderTypeDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                            </svg>
                                                            <span className="font-medium">Pickup</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="p-3 hover:bg-[#AF524D] hover:text-white cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setOrderType("Delivery");
                                                            setIsOrderTypeDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                                            </svg>
                                                            <span className="font-medium">Delivery</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {orderType && (
                                                <div className="mt-2 p-2 bg-[#AF524D] bg-opacity-10 rounded-lg border border-[#AF524D] border-opacity-30">
                                                    <p className="text-sm text-[#381914] font-medium">
                                                        Selected: {orderType}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    {orderType === "Delivery" && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-[#492220] flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Delivery Address
                                            </label>
                                            <textarea
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter your complete delivery address..."
                                                rows="3"
                                                className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50 resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                                        <button
                                            onClick={closeOrderModal}
                                            className="px-6 py-3 bg-white/70 text-[#492220] border border-[#AF524D]/30 rounded-xl hover:bg-[#AF524D]/10 hover:border-[#AF524D]/50 transition-all duration-200 font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress) || isDateBlocked || isCheckingBlockedDates || isDateBlockedForCalendar(orderDate)}
                                            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress) || isDateBlocked || isCheckingBlockedDates || isDateBlockedForCalendar(orderDate)
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D]'
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Review Order */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#492220] mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Review Your Order
                                    </h3>

                                    {/* Order Summary */}
                                    <div className="p-6 bg-gradient-to-r from-[#F8E6B4]/30 to-[#E2D2A2]/30 rounded-2xl border border-[#AF524D]/20">
                                        <h4 className="font-semibold text-[#492220] mb-6 text-lg">Order Summary</h4>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Cake:</span>
                                                <span className="text-[#AF524D] font-semibold">Custom Cake Design</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Quantity:</span>
                                                <span className="text-[#8B3A3A] font-semibold">1</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Estimated price per cake:</span>
                                                <span className="text-[#AF524D] font-semibold">₱1,500</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#AF524D]/10 to-[#8B3A3A]/10 rounded-xl border-t-2 border-[#AF524D]/20">
                                                <span className="font-bold text-[#492220] text-lg">Total Estimated Price:</span>
                                                <span className="font-bold text-[#AF524D] text-xl">₱1,500</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Date:</span>
                                                <span className="text-[#8B3A3A] font-semibold">{orderDate ? new Date(orderDate).toLocaleDateString() : 'Not selected'}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Time:</span>
                                                <span className="text-[#8B3A3A] font-semibold">{orderTime ? new Date(`2000-01-01T${orderTime}`).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }) : 'Not selected'}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                                <span className="font-medium text-[#492220]">Type:</span>
                                                <span className="text-[#8B3A3A] font-semibold">{orderType}</span>
                                            </div>
                                            {orderType === "Delivery" && deliveryAddress && (
                                                <div className="flex justify-between items-start p-3 bg-white/50 rounded-xl">
                                                    <span className="font-medium text-[#492220]">Address:</span>
                                                    <span className="text-right max-w-xs text-[#8B3A3A] font-semibold">{deliveryAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-[#AF524D]/20">
                                        <button
                                            onClick={prevStep}
                                            className="px-6 py-3 bg-white/70 text-[#492220] border border-[#AF524D]/30 rounded-xl hover:bg-[#AF524D]/10 hover:border-[#AF524D]/50 transition-all duration-200 font-semibold"
                                        >
                                            Back
                                        </button>

                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={isPlacingOrder}
                                            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${isPlacingOrder
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white hover:from-[#8B3A3A] hover:to-[#AF524D]'
                                                }`}
                                        >
                                            {isPlacingOrder ? (
                                                <div className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Placing Order...
                                                </div>
                                            ) : (
                                                'Place Order'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Order Success */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#492220] mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Order Successfully Placed!
                                    </h3>

                                    <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center">
                                        <div className="flex items-center justify-center gap-4 mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-green-800 text-2xl mb-3">Thank you for your order!</h4>
                                        <p className="text-green-700 text-lg mb-6">
                                            Your order has been successfully placed and will be processed shortly. <br /><br />
                                            <b>Please contact Connie de Café to finalize your order.</b>
                                        </p>

                                        {/* Order Details */}
                                        <div className="bg-white/70 rounded-xl p-4 border border-green-200/50">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-800 font-medium">Quantity:</span>
                                                    <span className="text-green-800 font-semibold">1 cake</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-800 font-medium">Total Estimated Amount:</span>
                                                    <span className="text-green-800 font-semibold text-lg">₱1,500</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={closeOrderModal}
                                            className="px-8 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white font-semibold rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CakeCustomization;