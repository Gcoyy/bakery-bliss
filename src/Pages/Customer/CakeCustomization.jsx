import { useState, useEffect, useRef } from 'react';
import { Canvas, FabricText, FabricImage } from 'fabric';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';

const CakeCustomization = () => {
    console.log('=== CakeCustomization Component Initialized ===');

    const navigate = useNavigate();
    const { session, userRole } = UserAuth();
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
    const [fontFamily, setFontFamily] = useState('Arial');
    const [canvasReady, setCanvasReady] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [objectUpdateTrigger, setObjectUpdateTrigger] = useState(0);
    const [selectedAssetType, setSelectedAssetType] = useState('cake base');

    // Order modal states
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [orderDate, setOrderDate] = useState("");
    const [orderTime, setOrderTime] = useState("");
    const [orderType, setOrderType] = useState("Pickup");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [cakeQuantity, setCakeQuantity] = useState(1);
    const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [customCakeImage, setCustomCakeImage] = useState(null);
    const [isScrollLocked, setIsScrollLocked] = useState(false);

    console.log('Initial state:', { loading, canvasReady, selectedColor });

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
            console.log('User not authenticated, waiting 5 seconds to check again...');

            // Wait 5 seconds before checking again
            const checkTimer = setTimeout(() => {
                // Check again after 5 seconds
                if (!session || !session.user) {
                    console.log('User still not authenticated after 5 seconds, redirecting to login');
                    toast.error('Please log in to access the cake customization tool');
                    navigate('/login');
                } else {
                    console.log('User authenticated after 5 seconds:', session.user);
                }
            }, 5000);

            // Cleanup timer if component unmounts
            return () => clearTimeout(checkTimer);
        } else {
            console.log('User authenticated:', session.user);
        }
    }, [session, navigate]);

    // Track canvasReady changes
    useEffect(() => {
        console.log('=== CanvasReady state changed ===');
        console.log('New canvasReady value:', canvasReady);
    }, [canvasReady]);

    // Helper function to get public image URL from Supabase storage
    const getPublicImageUrl = (path) => {
        if (!path) {
            console.log('getPublicImageUrl: No path provided');
            return null;
        }

        // If the path is already a full URL, return it as is
        if (path.startsWith('http')) {
            console.log('getPublicImageUrl: Path is already a URL:', path);
            return path;
        }

        console.log('getPublicImageUrl: Processing path:', path);

        try {
            // Use the correct bucket name and handle folder structure
            const bucketName = 'asset';
            console.log(`getPublicImageUrl: Using bucket "${bucketName}"`);

            // Construct the full path with folder structure
            let fullPath = path;

            // If the path doesn't already include a folder, determine which folder it should go in
            // This is a fallback - ideally your ASSET table should include the folder in the src
            if (!path.includes('/')) {
                // You might want to add a folder field to your ASSET table to be more explicit
                console.log(`getPublicImageUrl: Path doesn't include folder, using filename: ${path}`);
            }

            const { data, error } = supabase.storage.from(bucketName).getPublicUrl(fullPath);

            if (error) {
                console.log(`getPublicImageUrl: Error with bucket "${bucketName}":`, error);
                return null;
            }

            if (data && data.publicUrl) {
                console.log(`getPublicImageUrl: Success with bucket "${bucketName}":`, data.publicUrl);
                return data.publicUrl;
            }

            console.error(`getPublicImageUrl: No public URL generated for bucket "${bucketName}"`);
            return null;
        } catch (error) {
            console.error('getPublicImageUrl: Unexpected error:', error);
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
            console.log('testImageUrl: Error testing URL:', url, error);
            return false;
        }
    };

    // Helper function to test storage bucket structure
    const testStorageBucket = async () => {
        try {
            console.log('=== TESTING STORAGE BUCKET STRUCTURE ===');
            const bucketName = 'asset';

            // Try to list files in the bucket
            const { data: bucketData, error: bucketError } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 100 });

            if (bucketError) {
                console.error('Error listing bucket contents:', bucketError);
                return;
            }

            console.log('Bucket contents:', bucketData);

            // Try to list files in specific folders
            const folders = ['cake base', 'icing', 'topping'];
            for (const folder of folders) {
                try {
                    const { data: folderData, error: folderError } = await supabase.storage
                        .from(bucketName)
                        .list(folder, { limit: 100 });

                    if (folderError) {
                        console.log(`Error listing folder "${folder}":`, folderError);
                    } else {
                        console.log(`Folder "${folder}" contents:`, folderData);
                    }
                } catch (folderError) {
                    console.log(`Exception listing folder "${folder}":`, folderError);
                }
            }
        } catch (error) {
            console.error('Error testing storage bucket:', error);
        }
    };

    // Color wheel functions
    const drawColorWheel = () => {
        const canvas = colorWheelRef.current;
        if (!canvas) {
            console.log('Color wheel canvas not ready');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.log('Color wheel context not ready');
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

        console.log('Color wheel drawn successfully');
    };

    const getColorFromWheel = (event) => {
        console.log('=== Get Color From Wheel called ===');
        console.log('Event:', event);

        const colorWheelCanvas = colorWheelRef.current;
        console.log('Color wheel canvas:', colorWheelCanvas);

        if (!colorWheelCanvas) {
            console.log('Color wheel canvas not available');
            return;
        }

        const rect = colorWheelCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = colorWheelCanvas.width / 2;
        const centerY = colorWheelCanvas.height / 2;

        console.log('Click coordinates:', { x, y, centerX, centerY });

        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const radius = Math.min(centerX, centerY) - 10;

        console.log('Distance calculation:', { deltaX, deltaY, distance, radius });

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
            console.log('Calculated color:', color);
            setSelectedColor(color);

            // Only try to change color on canvas if canvas is ready and has an active object
            console.log('Checking canvas readiness for color change');
            console.log('canvasReady:', canvasReady);
            console.log('canvas.current:', canvas.current);
            console.log('getActiveObject method:', canvas.current?.getActiveObject);

            if (canvasReady && canvas.current && canvas.current.getActiveObject) {
                console.log('Canvas is ready, getting active object');
                const activeObject = canvas.current.getActiveObject();
                console.log('Active object for color change:', activeObject);

                if (activeObject) {
                    console.log('Setting fill color on active object');
                    activeObject.set('fill', color);
                    canvas.current.renderAll();
                    console.log('Color changed successfully');

                    // Update the selected object state to reflect the color change
                    if (selectedObject && selectedObject === activeObject) {
                        setObjectUpdateTrigger(prev => prev + 1);
                    }
                } else {
                    console.log('No active object for color change');
                }
            } else {
                console.log('Canvas not ready for color change');
            }
        } else {
            console.log('Click outside color wheel radius');
        }
    };

    // Mouse event handlers for drag functionality
    const handleMouseDown = (event) => {
        console.log('=== Mouse Down on Color Wheel ===');
        const colorWheelCanvas = colorWheelRef.current;
        if (!colorWheelCanvas) return;

        // Add event listeners for drag
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Get initial color
        getColorFromWheel(event);
    };

    const handleMouseMove = (event) => {
        console.log('=== Mouse Move on Color Wheel ===');
        // Create a synthetic event with the current mouse position
        const syntheticEvent = {
            clientX: event.clientX,
            clientY: event.clientY
        };
        getColorFromWheel(syntheticEvent);
    };

    const handleMouseUp = () => {
        console.log('=== Mouse Up on Color Wheel ===');
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Fetch cake images and decorations from database
    useEffect(() => {
        console.log('=== Fetch Images useEffect triggered ===');
        const fetchImages = async () => {
            try {
                console.log('Setting loading to true');
                setLoading(true);

                // Fetch assets from ASSET table
                const { data: assetData, error: assetError } = await supabase
                    .from("ASSET")
                    .select("*");

                if (assetError) {
                    console.error("Error fetching assets:", assetError);
                    toast.error("Failed to load assets");
                    return;
                }

                console.log('=== ASSET DATA DEBUG ===');
                console.log('Raw asset data:', assetData);
                console.log('Asset count:', assetData?.length || 0);
                if (assetData && assetData.length > 0) {
                    console.log('Sample asset:', assetData[0]);
                    console.log('Asset structure:', Object.keys(assetData[0]));
                }

                // Test the storage bucket structure
                await testStorageBucket();

                // Separate assets based on type
                const cakeBases = assetData.filter(asset => asset.type === 'cake base');
                const icingAssets = assetData.filter(asset => asset.type === 'icing');
                const toppingAssets = assetData.filter(asset => asset.type === 'topping');

                console.log('Filtered cake bases:', cakeBases);
                console.log('Filtered icing assets:', icingAssets);
                console.log('Filtered topping assets:', toppingAssets);

                // Process cake bases with public URLs
                const cakesWithImages = cakeBases.map((asset) => {
                    // Use the asset.src directly as it should already contain the full path
                    const publicUrl = getPublicImageUrl(asset.src);
                    console.log(`Processing cake base ${asset.src}:`, { asset, publicUrl });
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
                    console.log(`Processing icing ${asset.src}:`, { asset, publicUrl });
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
                    console.log(`Processing topping ${asset.src}:`, { asset, publicUrl });
                    return {
                        id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        src: asset.src, // Add src property for consistency
                        category: asset.type,
                        admin_id: asset.admin_id
                    };
                });

                console.log('=== PROCESSED DATA DEBUG ===');
                console.log('Final cake images:', cakesWithImages);
                console.log('Final icing assets:', processedIcing);
                console.log('Final topping assets:', processedToppings);

                // Test a few URLs to see if they're accessible
                if (cakesWithImages.length > 0) {
                    console.log('Testing first cake image URL...');
                    const firstCakeUrl = cakesWithImages[0].publicUrl;
                    console.log('First cake URL:', firstCakeUrl);
                    if (firstCakeUrl) {
                        const isAccessible = await testImageUrl(firstCakeUrl);
                        console.log('First cake URL accessible:', isAccessible);
                    }
                }

                if (processedIcing.length > 0) {
                    console.log('Testing first icing URL...');
                    const firstIcingUrl = getPublicImageUrl(processedIcing[0].image_path);
                    console.log('First icing URL:', firstIcingUrl);
                    if (firstIcingUrl) {
                        const isAccessible = await testImageUrl(firstIcingUrl);
                        console.log('First icing URL accessible:', isAccessible);
                    }
                }

                if (cakesWithImages.length === 0) {
                    console.warn('No cake bases found in ASSET table');
                }

                if (processedIcing.length === 0) {
                    console.warn('No icing assets found in ASSET table');
                }

                if (processedToppings.length === 0) {
                    console.warn('No topping assets found in ASSET table');
                }

                setCakeImages(cakesWithImages);
                setDecorations(processedIcing);
                setToppings(processedToppings);
            } catch (error) {
                console.error("Error fetching images:", error);
                toast.error("Failed to load images");
            } finally {
                console.log('Setting loading to false');
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Initialize Fabric.js canvas
    useEffect(() => {
        console.log('=== Canvas Initialization useEffect triggered ===');
        console.log('Loading state:', loading);
        console.log('Canvas ref:', canvasRef.current);

        if (!loading && canvasRef.current && !canvas.current) {
            console.log('Loading is false, initializing canvas...');
            console.log('Canvas ref element:', canvasRef.current);

            try {
                // Get the container dimensions
                const container = canvasRef.current.parentElement;
                const containerRect = container.getBoundingClientRect();

                console.log('=== Canvas Sizing Debug ===');
                console.log('Container element:', container);
                console.log('Container rect:', containerRect);
                console.log('Container width:', containerRect.width);
                console.log('Container height:', containerRect.height);

                // Set canvas size to fit container while maintaining aspect ratio
                const maxWidth = containerRect.width; // Use full container width
                const maxHeight = containerRect.height; // Use full container height

                console.log('Calculated maxWidth:', maxWidth);
                console.log('Calculated maxHeight:', maxHeight);
                console.log('Canvas element before creation:', canvasRef.current);

                canvas.current = new Canvas(canvasRef.current, {
                    width: maxWidth,
                    height: maxHeight,
                    backgroundColor: '#f8f9fa'
                });
                console.log('Canvas created successfully:', canvas.current);
                console.log('Canvas dimensions after creation:', {
                    width: canvas.current.width,
                    height: canvas.current.height
                });

                // Check container styling
                console.log('Container computed styles:', {
                    width: window.getComputedStyle(container).width,
                    height: window.getComputedStyle(container).height,
                    maxWidth: window.getComputedStyle(container).maxWidth,
                    maxHeight: window.getComputedStyle(container).maxHeight,
                    overflow: window.getComputedStyle(container).overflow
                });

                // Check canvas element styling
                console.log('Canvas element computed styles:', {
                    width: window.getComputedStyle(canvasRef.current).width,
                    height: window.getComputedStyle(canvasRef.current).height,
                    maxWidth: window.getComputedStyle(canvasRef.current).maxWidth,
                    maxHeight: window.getComputedStyle(canvasRef.current).maxHeight
                });

                // Add event listeners
                canvas.current.on('selection:created', handleSelection);
                canvas.current.on('selection:cleared', handleDeselection);
                canvas.current.on('object:modified', handleObjectModified);
                canvas.current.on('object:moving', handleObjectModified);
                canvas.current.on('object:scaling', handleObjectModified);
                canvas.current.on('object:rotating', handleObjectModified);
                console.log('Event listeners added');

                // Mark canvas as ready with a small delay to ensure full initialization
                console.log('Setting canvasReady to true');
                setTimeout(() => {
                    console.log('Delayed canvas ready set to true');
                    setCanvasReady(true);
                }, 100);
            } catch (error) {
                console.error('Error creating Canvas:', error);
            }
        } else {
            console.log('Loading is still true, canvas ref not ready, or canvas already exists');
        }
    }, [loading]);

    // Handle canvas resize
    const handleCanvasResize = () => {
        console.log('=== Canvas Resize Debug ===');
        console.log('Canvas current:', canvas.current);
        console.log('Canvas ref:', canvasRef.current);

        if (canvas.current && canvasRef.current) {
            const container = canvasRef.current.parentElement;
            const containerRect = container.getBoundingClientRect();

            console.log('Resize - Container rect:', containerRect);
            console.log('Resize - Container width:', containerRect.width);
            console.log('Resize - Container height:', containerRect.height);

            const maxWidth = containerRect.width; // Use full container width
            const maxHeight = containerRect.height; // Use full container height

            console.log('Resize - Calculated maxWidth:', maxWidth);
            console.log('Resize - Calculated maxHeight:', maxHeight);
            console.log('Resize - Current canvas dimensions:', {
                width: canvas.current.width,
                height: canvas.current.height
            });

            canvas.current.setDimensions({
                width: maxWidth,
                height: maxHeight
            });
            canvas.current.renderAll();

            console.log('Resize - New canvas dimensions:', {
                width: canvas.current.width,
                height: canvas.current.height
            });
        } else {
            console.log('Resize - Canvas not ready for resize');
        }
    };

    // Add resize listener
    useEffect(() => {
        if (canvasReady && canvas.current) {
            window.addEventListener('resize', handleCanvasResize);
            return () => {
                window.removeEventListener('resize', handleCanvasResize);
            };
        }
    }, [canvasReady]);

    // Cleanup effect - runs only on unmount
    useEffect(() => {
        return () => {
            console.log('Canvas cleanup - disposing canvas');
            if (canvas.current) {
                canvas.current.dispose();
                canvas.current = null;
            }
            console.log('Setting canvasReady to false');
            setCanvasReady(false);
        };
    }, []);

    // Initialize color wheel
    useEffect(() => {
        console.log('=== Color Wheel useEffect triggered ===');
        console.log('Selected color:', selectedColor);
        console.log('Color wheel ref:', colorWheelRef.current);

        if (colorWheelRef.current) {
            console.log('Drawing color wheel...');
            drawColorWheel();
        } else {
            console.log('Color wheel ref not ready');
        }
    }, [selectedColor, objectUpdateTrigger]);

    // Draw color wheel on mount
    useEffect(() => {
        console.log('=== Color Wheel Mount useEffect triggered ===');
        const timer = setTimeout(() => {
            console.log('Attempting to draw color wheel on mount');
            console.log('Color wheel ref on mount:', colorWheelRef.current);
            if (colorWheelRef.current) {
                console.log('Drawing color wheel on mount...');
                drawColorWheel();
            } else {
                console.log('Color wheel ref not ready on mount');
            }
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            console.log('Clearing color wheel mount timer');
            clearTimeout(timer);
        };
    }, []);

    const handleSelection = () => {
        console.log('=== Handle Selection called ===');
        console.log('Canvas ready:', canvasReady);
        console.log('Canvas current:', canvas.current);

        if (!canvas.current) {
            console.log('Canvas not available in handleSelection');
            return;
        }

        const activeObject = canvas.current.getActiveObject();
        console.log('Active object:', activeObject);

        if (activeObject) {
            console.log('Active object type:', activeObject.type);
            setSelectedObject(activeObject);
            setObjectUpdateTrigger(prev => prev + 1);

            if (activeObject.type === 'text') {
                console.log('Setting text properties from active object');
                setTextValue(activeObject.text);
                setFontSize(activeObject.fontSize);
                setFontFamily(activeObject.fontFamily);
                setSelectedColor(activeObject.fill);
            } else {
                setSelectedColor(activeObject.fill || '#FF0000');
            }
        }
    };

    const handleDeselection = () => {
        console.log('=== Handle Deselection called ===');
        console.log('Resetting text properties');
        setTextValue('');
        setFontSize(24);
        setFontFamily('Arial');
        setSelectedColor('#FF0000');
        setSelectedObject(null);
        setObjectUpdateTrigger(0);
    };

    const handleObjectModified = () => {
        console.log('=== Handle Object Modified called ===');
        // Force a re-render of the properties panel
        setObjectUpdateTrigger(prev => prev + 1);
    };

    // Add cake base to canvas
    const addCakeBase = (cake) => {
        console.log('=== Add Cake Base called ===');
        console.log('Cake:', cake);
        console.log('Canvas ready:', canvasReady);
        console.log('Canvas current:', canvas.current);

        if (!canvasReady || !canvas.current) {
            console.log('Canvas not ready for addCakeBase');
            toast.error('Canvas not ready');
            return;
        }

        console.log('Creating image for cake base');

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

                console.log('Image loaded successfully with CORS, creating FabricImage');
                const fabricImage = new FabricImage(img);
                fabricImage.scaleToWidth(300);
                fabricImage.set({
                    left: 250,
                    top: 200,
                    name: 'cake-base'
                });
                console.log('Adding fabric image to canvas');
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();
                console.log('Cake base added successfully');

            } catch (corsError) {
                console.log('CORS failed, trying data URL conversion...');
                try {
                    // Fallback: convert to data URL
                    const dataURL = await imageToDataURL(cake.publicUrl);
                    const img = new Image();
                    img.onload = () => {
                        console.log('Image loaded successfully via data URL, creating FabricImage');
                        const fabricImage = new FabricImage(img);
                        fabricImage.scaleToWidth(300);
                        fabricImage.set({
                            left: 250,
                            top: 200,
                            name: 'cake-base'
                        });
                        console.log('Adding fabric image to canvas');
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();
                        console.log('Cake base added successfully');
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    console.error('Both CORS and data URL conversion failed:', fallbackError);
                    toast.error('Failed to load cake image');
                }
            }
        };

        loadImageWithFallback();
        console.log('Image src set to:', cake.publicUrl);
    };

    // Add decoration to canvas
    const addDecoration = (decoration) => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        // The image_path now contains the full path with folder structure
        const imageUrl = getPublicImageUrl(decoration.image_path);
        console.log('Adding decoration:', { decoration, imageUrl });

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
                    name: 'decoration'
                });
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();

            } catch (corsError) {
                console.log('CORS failed for decoration, trying data URL conversion...');
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
                            name: 'decoration'
                        });
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    console.error('Both CORS and data URL conversion failed for decoration:', fallbackError);
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
        console.log('Adding topping:', { topping, imageUrl });

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
                    name: 'topping'
                });
                canvas.current.add(fabricImage);
                canvas.current.setActiveObject(fabricImage);
                canvas.current.renderAll();

            } catch (corsError) {
                console.log('CORS failed for topping, trying data URL conversion...');
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
                            name: 'topping'
                        });
                        canvas.current.add(fabricImage);
                        canvas.current.setActiveObject(fabricImage);
                        canvas.current.renderAll();
                    };
                    img.src = dataURL;
                } catch (fallbackError) {
                    console.error('Both CORS and data URL conversion failed for topping:', fallbackError);
                    toast.error('Failed to load topping image');
                }
            }
        };

        loadImageWithFallback();
    };

    // Add text to canvas
    const addText = () => {
        if (!textValue.trim()) {
            toast.error('Please enter some text');
            return;
        }

        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        const text = new FabricText(textValue, {
            left: 350,
            top: 100,
            fontSize: fontSize,
            fontFamily: fontFamily,
            fill: selectedColor,
            name: 'text'
        });

        canvas.current.add(text);
        canvas.current.setActiveObject(text);
        canvas.current.renderAll();
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
        console.log('=== Change Size called ===');
        console.log('Scale:', scale);
        console.log('Canvas ready:', canvasReady);
        console.log('Canvas current:', canvas.current);
        console.log('Canvas getActiveObject method:', canvas.current?.getActiveObject);

        // More robust check for canvas readiness
        if (!canvasReady) {
            console.log('Canvas not ready - canvasReady is false');
            toast.error('Canvas not ready');
            return;
        }

        if (!canvas.current) {
            console.log('Canvas not ready - canvas.current is null');
            toast.error('Canvas not ready');
            return;
        }

        if (typeof canvas.current.getActiveObject !== 'function') {
            console.log('Canvas not ready - getActiveObject is not a function');
            console.log('getActiveObject type:', typeof canvas.current.getActiveObject);
            toast.error('Canvas not ready');
            return;
        }

        console.log('Getting active object');
        const activeObject = canvas.current.getActiveObject();
        console.log('Active object:', activeObject);

        if (activeObject) {
            console.log('Scaling active object by:', scale);
            activeObject.scale(scale);
            canvas.current.renderAll();
            setObjectUpdateTrigger(prev => prev + 1);
            console.log('Size changed successfully');
        } else {
            console.log('No active object found');
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
            canvas.current.bringToFront(activeObject);
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
            canvas.current.sendToBack(activeObject);
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
            canvas.current.bringForward(activeObject);
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
            canvas.current.sendBackwards(activeObject);
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
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setOrderDate(tomorrow.toISOString().split('T')[0]);
            setOrderTime("14:00");
            setCakeQuantity(1);
            setCurrentStep(1);

            // Close loading toast and open order modal
            toast.dismiss();
            setIsOrderModalOpen(true);

        } catch (error) {
            console.error('Error preparing design:', error);
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
        setCakeQuantity(1);
        setCurrentStep(1);
        setIsOrderTypeDropdownOpen(false);
        setIsPlacingOrder(false);
        setCustomCakeImage(null);
    };

    const nextStep = () => {
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

        setIsPlacingOrder(true);

        try {
            console.log('Starting custom cake order placement...');

            // Get customer ID from authentication
            const { data: customerData, error: customerError } = await supabase
                .from('CUSTOMER')
                .select('cus_id')
                .eq('auth_user_id', session.user.id)
                .single();

            if (customerError || !customerData) {
                console.error('Error fetching customer ID:', customerError);
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
                console.error('Upload error:', uploadError);
                toast.error('Failed to save design to storage');
                return;
            }

            console.log('Image uploaded successfully:', uploadData);

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
                order_date: new Date().toISOString().split('T')[0],
                delivery_method: orderType,
                order_schedule: scheduledDate.toISOString(), // Include full datetime with time
                delivery_address: orderType === "Delivery" ? deliveryAddress : null,
                cus_id: cusId,
                order_status: 'Pending'
            };

            console.log('Attempting to create order with data:', orderInsertData);

            const { data: orderData, error: orderError } = await supabase
                .from('ORDER')
                .insert([orderInsertData])
                .select()
                .single();

            if (orderError) {
                console.error('Error creating order:', orderError);
                console.error('Order error details:', {
                    message: orderError.message,
                    details: orderError.details,
                    hint: orderError.hint,
                    code: orderError.code
                });
                toast.error(`Failed to create order: ${orderError.message}`);
                return;
            }

            console.log('Order created successfully:', orderData);
            console.log('Order ID from database:', orderData.order_id);

            // Insert into CUSTOM-CAKE table
            const customCakeData = {
                cc_id: nextCcId,
                cc_img: customCakeImage.filename,
                order_id: orderData.order_id,
                cus_id: cusId,
                auth_user_id: session.user.id
            };

            console.log('Attempting to create custom cake record with data:', customCakeData);

            const { data: insertData, error: insertError } = await supabase
                .from('CUSTOM-CAKE')
                .insert(customCakeData);

            if (insertError) {
                console.error('Database insert error:', insertError);
                console.error('Custom cake error details:', {
                    message: insertError.message,
                    details: insertError.details,
                    hint: insertError.hint,
                    code: insertError.code
                });
                toast.error(`Failed to save cake design to database: ${insertError.message}`);
                return;
            }

            console.log('Custom cake record created:', insertData);

            // Create payment record
            const customCakePrice = 5000; // Base price for custom cakes
            const totalPrice = customCakePrice * cakeQuantity;

            const paymentData = {
                payment_method: "Cash",
                amount_paid: totalPrice,
                payment_date: new Date().toISOString().split('T')[0],
                payment_status: "Unpaid",
                receipt: null,
                order_id: orderData.order_id
            };

            console.log('Attempting to create payment record with data:', paymentData);

            const { error: paymentError } = await supabase
                .from('PAYMENT')
                .insert([paymentData]);

            if (paymentError) {
                console.error('Error creating payment:', paymentError);
                console.error('Payment error details:', {
                    message: paymentError.message,
                    details: paymentError.details,
                    hint: paymentError.hint,
                    code: paymentError.code
                });
                toast.error(`Failed to create payment record: ${paymentError.message}`);
                return;
            }

            console.log('Payment record created successfully');

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
            console.error('Error placing order:', error);
            toast.error('Failed to place order. Please try again.', {
                duration: 4000,
                position: 'top-center',
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    console.log('=== Render called ===');
    console.log('Current state:', { loading, canvasReady, selectedColor, cakeImages: cakeImages.length, session: !!session });

    // Show loading spinner while checking authentication or loading data
    if (!session || !session.user || loading) {
        console.log('Showing loading spinner - session:', !!session, 'loading:', loading);
        return <LoadingSpinner message={!session ? "Checking authentication, please wait..." : "Loading cake designer..."} />;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Toolbar - Figma Style */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-semibold text-gray-900">Cake Designer</h1>
                    <div className="h-4 w-px bg-gray-300"></div>
                    {/* Scroll Lock Toggle */}
                    <button
                        onClick={() => setIsScrollLocked(!isScrollLocked)}
                        className={`p-2 rounded hover:bg-gray-100 transition-colors ${isScrollLocked
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-600'
                            }`}
                        title={isScrollLocked ? "Unlock Scrolling" : "Lock Scrolling"}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isScrollLocked ? (
                                // Lock icon (when scroll is disabled)
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            ) : (
                                // Unlock icon (when scroll is enabled)
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            )}
                        </svg>
                    </button>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSelectedTool('select')}
                            className={`p-2 rounded hover:bg-gray-100 transition-colors ${selectedTool === 'select'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600'
                                }`}
                            title="Select Tool (V)"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setSelectedTool('text')}
                            className={`p-2 rounded hover:bg-gray-100 transition-colors ${selectedTool === 'text'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600'
                                }`}
                            title="Text Tool (T)"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => changeSize(0.8)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Decrease Size"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12H3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => changeSize(1.2)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Increase Size"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button
                        onClick={bringToFront}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Bring to Front"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </button>
                    <button
                        onClick={sendToBack}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Send to Back"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V20m0 0l-4-4m4 4l4-4M7 4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                    </button>
                    <button
                        onClick={bringForward}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Bring Forward"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                    </button>
                    <button
                        onClick={sendBackward}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Send Backward"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                    </button>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button
                        onClick={deleteSelected}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Selected"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Clear Canvas"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={exportDesign}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        title="Save Design"
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Sidebar - Tools Panel */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

                    {/* Text Controls */}
                    {selectedTool === 'text' && (
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Text</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={textValue}
                                    onChange={(e) => setTextValue(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter text..."
                                />
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="72"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <span className="text-xs text-gray-500">{fontSize}px</span>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Font</label>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Courier New">Courier New</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                    </select>
                                </div>
                                <button
                                    onClick={addText}
                                    className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                    Add Text
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Assets Panel with Tabs */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {/* Asset Type Tabs */}
                        <div className="flex space-x-1 p-4 pb-2 bg-gray-50 border-b border-gray-200">
                            <button
                                onClick={() => setSelectedAssetType('cake base')}
                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${selectedAssetType === 'cake base'
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Cake Bases
                            </button>
                            <button
                                onClick={() => setSelectedAssetType('icing')}
                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${selectedAssetType === 'icing'
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Icing
                            </button>
                            <button
                                onClick={() => setSelectedAssetType('topping')}
                                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${selectedAssetType === 'topping'
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                Toppings
                            </button>
                        </div>

                        {/* Asset Content */}
                        <div className="p-4">
                            {selectedAssetType === 'cake base' && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Cake Bases</h3>
                                    {cakeImages.length > 0 ? (
                                        <div className="space-y-2">
                                            {cakeImages.map((cake) => (
                                                <div key={cake.cake_id} className="group cursor-pointer">
                                                    <div className="relative">
                                                        <img
                                                            src={cake.publicUrl}
                                                            alt={cake.name}
                                                            className="w-full object-contain rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addCakeBase(cake)}
                                                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="text-white text-xs font-medium">Add</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1 truncate">{cake.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No cake bases found
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAssetType === 'icing' && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Icing & Decorations</h3>
                                    {decorations.length > 0 ? (
                                        <div className="space-y-2">
                                            {decorations.map((decoration) => (
                                                <div key={decoration.id} className="group cursor-pointer">
                                                    <div className="relative">
                                                        <img
                                                            src={getPublicImageUrl(decoration.image_path)}
                                                            alt={decoration.name}
                                                            className="w-full object-contain rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                console.error('Decoration image failed to load in UI:', decoration.image_path);
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addDecoration(decoration)}
                                                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="text-white text-xs font-medium">Add</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1 truncate">{decoration.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No icing decorations found
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAssetType === 'topping' && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Toppings</h3>
                                    {toppings.length > 0 ? (
                                        <div className="space-y-2">
                                            {toppings.map((topping) => (
                                                <div key={topping.id} className="group cursor-pointer">
                                                    <div className="relative">
                                                        <img
                                                            src={getPublicImageUrl(topping.src)}
                                                            alt={topping.name}
                                                            className="w-full object-contain rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
                                                            style={{ height: 'auto', maxHeight: '80px' }}
                                                            onError={(e) => {
                                                                console.error('Topping image failed to load in UI:', topping.src);
                                                                e.target.src = "/saved-cake.png";
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => addTopping(topping)}
                                                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="text-white text-xs font-medium">Add</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1 truncate">{topping.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No toppings found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 min-h-0 overflow-hidden">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full h-full min-w-[800px] min-h-[600px]">
                        <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Properties</h3>
                    {selectedObject ? (
                        // Use objectUpdateTrigger to force re-render when object properties change
                        <div key={objectUpdateTrigger} className="space-y-4">
                            {/* Color Picker - Only show when text object is selected */}
                            {selectedObject.type === 'text' && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                                    <div className="flex flex-col items-center space-y-3">
                                        <canvas
                                            ref={colorWheelRef}
                                            width="120"
                                            height="120"
                                            className="border border-gray-300 rounded cursor-pointer"
                                            onMouseDown={handleMouseDown}
                                            title="Click and drag to select color"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-600 font-mono">{selectedColor}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Type</label>
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                    {selectedObject.type}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Layer Order</label>
                                <div className="text-sm font-medium text-gray-900">
                                    {canvas.current.getObjects().indexOf(selectedObject) + 1} of {canvas.current.getObjects().length}
                                </div>
                                <div className="flex gap-1 mt-2">
                                    <button
                                        onClick={sendBackward}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        title="Send Backward"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={bringForward}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        title="Bring Forward"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={sendToBack}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        title="Send to Back"
                                    >
                                        ⬇
                                    </button>
                                    <button
                                        onClick={bringToFront}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                        title="Bring to Front"
                                    >
                                        ⬆
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Position</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={Math.round(selectedObject.left || 0)}
                                        onChange={(e) => {
                                            selectedObject.set('left', parseFloat(e.target.value));
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        value={Math.round(selectedObject.top || 0)}
                                        onChange={(e) => {
                                            selectedObject.set('top', parseFloat(e.target.value));
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Size</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={Math.round(selectedObject.width * (selectedObject.scaleX || 1))}
                                        onChange={(e) => {
                                            const newWidth = parseFloat(e.target.value);
                                            const scaleX = newWidth / selectedObject.width;
                                            selectedObject.set('scaleX', scaleX);
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        value={Math.round(selectedObject.height * (selectedObject.scaleY || 1))}
                                        onChange={(e) => {
                                            const newHeight = parseFloat(e.target.value);
                                            const scaleY = newHeight / selectedObject.height;
                                            selectedObject.set('scaleY', scaleY);
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Rotation</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedObject.angle || 0)}
                                    onChange={(e) => {
                                        selectedObject.set('angle', parseFloat(e.target.value));
                                        canvas.current.renderAll();
                                        setObjectUpdateTrigger(prev => prev + 1);
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round((selectedObject.opacity || 1) * 100)}
                                    onChange={(e) => {
                                        selectedObject.set('opacity', parseFloat(e.target.value) / 100);
                                        canvas.current.renderAll();
                                        setObjectUpdateTrigger(prev => prev + 1);
                                    }}
                                    className="w-full"
                                />
                                <span className="text-xs text-gray-500">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
                            </div>

                            {selectedObject.type === 'text' && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Text</label>
                                    <input
                                        type="text"
                                        value={selectedObject.text || ''}
                                        onChange={(e) => {
                                            selectedObject.set('text', e.target.value);
                                            canvas.current.renderAll();
                                            setObjectUpdateTrigger(prev => prev + 1);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 text-center py-8">
                            Select an object to view its properties
                        </div>
                    )}
                </div>
            </div>

            {/* Order Modal */}
            {isOrderModalOpen && customCakeImage && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-[#381914]">Complete Your Custom Cake Order</h2>
                            <button
                                onClick={closeOrderModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        {/* Breadcrumb Navigation */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-center space-x-4">
                                <div className={`flex items-center ${currentStep >= 1 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        1
                                    </div>
                                    <span className="ml-2 text-sm font-medium">Order Details</span>
                                </div>

                                <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-[#AF524D]' : 'bg-gray-200'}`}></div>

                                <div className={`flex items-center ${currentStep >= 2 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        2
                                    </div>
                                    <span className="ml-2 text-sm font-medium">Review</span>
                                </div>

                                <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-[#AF524D]' : 'bg-gray-200'}`}></div>

                                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#AF524D]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-[#AF524D] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        3
                                    </div>
                                    <span className="ml-2 text-sm font-medium">Success</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Custom Cake Preview */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={customCakeImage.dataURL}
                                        alt="Custom Cake Design"
                                        className="w-16 h-16 object-contain rounded-lg"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-[#381914]">Custom Cake Design</h3>
                                        <p className="text-sm text-gray-600">₱5,000 (base price)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Order Details */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    {/* Quantity Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#381914] mb-2">
                                            Quantity *
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setCakeQuantity(Math.max(1, cakeQuantity - 1))}
                                                className="w-10 h-10 rounded-full border-2 border-[#AF524D] text-[#AF524D] hover:bg-[#AF524D] hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
                                            >
                                                -
                                            </button>
                                            <span className="w-16 text-center font-semibold text-[#381914] text-lg">
                                                {cakeQuantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCakeQuantity(cakeQuantity + 1)}
                                                className="w-10 h-10 rounded-full border-2 border-[#AF524D] text-[#AF524D] hover:bg-[#AF524D] hover:text-white transition-colors flex items-center justify-center font-bold text-lg"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#381914] mb-2">
                                            Pickup/Delivery Date *
                                        </label>
                                        <div className="relative">
                                            <div className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white">
                                                <div className="flex-shrink-0">
                                                    <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="date"
                                                        value={orderDate}
                                                        onChange={(e) => setOrderDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="w-full bg-transparent border-none outline-none text-[#381914] font-medium cursor-pointer"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#381914] mb-2">
                                            Pickup/Delivery Time *
                                        </label>
                                        <div className="relative">
                                            <div className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white">
                                                <div className="flex-shrink-0">
                                                    <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="time"
                                                        value={orderTime}
                                                        onChange={(e) => setOrderTime(e.target.value)}
                                                        className="w-full bg-transparent border-none outline-none text-[#381914] font-medium cursor-pointer"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#381914] mb-2">
                                            Order Type
                                        </label>
                                        <div className="relative">
                                            <div
                                                className="flex items-center gap-3 p-3 border-2 border-[#AF524D] rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
                                            >
                                                <div className="flex-shrink-0">
                                                    <svg className="w-6 h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[#381914] font-medium">
                                                        {orderType}
                                                    </span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className={`w-5 h-5 text-[#AF524D] transition-transform ${isOrderTypeDropdownOpen ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
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
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    {orderType === "Delivery" && (
                                        <div>
                                            <label className="block text-sm font-medium text-[#381914] mb-2">
                                                Delivery Address
                                            </label>
                                            <textarea
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter your complete delivery address..."
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 justify-end">
                                        <button
                                            onClick={closeOrderModal}
                                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)}
                                            className={`px-6 py-2 rounded-full transition-colors ${!orderDate || !orderTime || (orderType === "Delivery" && !deliveryAddress)
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
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
                                    <h3 className="text-lg font-semibold text-[#381914] mb-4">Review Your Order</h3>

                                    {/* Order Summary */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-[#381914] mb-4">Order Summary</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Cake:</span>
                                                <span>Custom Cake Design</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Quantity:</span>
                                                <span>{cakeQuantity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Price per cake:</span>
                                                <span>₱5,000</span>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-200 pt-2">
                                                <span className="font-semibold">Total Price:</span>
                                                <span className="font-semibold">₱{5000 * cakeQuantity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Date:</span>
                                                <span>{orderDate ? new Date(orderDate).toLocaleDateString() : 'Not selected'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Time:</span>
                                                <span>{orderTime ? new Date(`2000-01-01T${orderTime}`).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }) : 'Not selected'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">Type:</span>
                                                <span>{orderType}</span>
                                            </div>
                                            {orderType === "Delivery" && deliveryAddress && (
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Address:</span>
                                                    <span className="text-right max-w-xs truncate">{deliveryAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 justify-between items-center pt-4 border-t border-gray-200">
                                        <button
                                            onClick={prevStep}
                                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors"
                                        >
                                            Back
                                        </button>

                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={isPlacingOrder}
                                            className={`px-6 py-2 rounded-full transition-colors ${isPlacingOrder
                                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : 'bg-[#AF524D] text-white hover:bg-[#8B3D3A]'
                                                }`}
                                        >
                                            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Order Success */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-[#381914] mb-4">Order Successfully Placed!</h3>

                                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h4 className="font-semibold text-green-800 text-xl mb-2">Thank you for your order!</h4>
                                        <p className="text-green-700 text-sm mb-4">
                                            Your custom cake order has been successfully placed.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={closeOrderModal}
                                            className="px-6 py-2 bg-[#AF524D] text-white rounded-full hover:bg-[#8B3D3A] transition-colors"
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