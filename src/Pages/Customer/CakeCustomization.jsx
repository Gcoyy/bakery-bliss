import { useState, useEffect, useRef } from 'react';
import { Canvas, FabricText, FabricImage } from 'fabric';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const CakeCustomization = () => {
    console.log('=== CakeCustomization Component Initialized ===');

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

    console.log('Initial state:', { loading, canvasReady, selectedColor });

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
                    // Construct the full path with folder structure
                    const fullPath = `cake base/${asset.src}`;
                    const publicUrl = getPublicImageUrl(fullPath);
                    console.log(`Processing cake base ${asset.src}:`, { asset, fullPath, publicUrl });
                    return {
                        cake_id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        publicUrl: publicUrl,
                        admin_id: asset.admin_id
                    };
                });

                // Process icing assets with public URLs
                const processedIcing = icingAssets.map((asset) => {
                    // Construct the full path with folder structure
                    const fullPath = `icing/${asset.src}`;
                    const publicUrl = getPublicImageUrl(fullPath);
                    console.log(`Processing icing ${asset.src}:`, { asset, fullPath, publicUrl });
                    return {
                        id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        image_path: fullPath, // Store the full path for later use
                        category: asset.type,
                        admin_id: asset.admin_id
                    };
                });

                // Process topping assets with public URLs
                const processedToppings = toppingAssets.map((asset) => {
                    // Construct the full path with folder structure
                    const fullPath = `topping/${asset.src}`;
                    const publicUrl = getPublicImageUrl(fullPath);
                    console.log(`Processing topping ${asset.src}:`, { asset, fullPath, publicUrl });
                    return {
                        id: asset.asset_id,
                        name: asset.src.replace('.png', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully, creating FabricImage');
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
            toast.success(`${cake.name} added to canvas`);
        };
        img.onerror = (error) => {
            console.error('Image failed to load:', error);
            console.log('Image src that failed:', cake.publicUrl);
            toast.error('Failed to load cake image');
        };
        img.src = cake.publicUrl;
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
            toast.success(`${decoration.name} added to canvas`);
        };
        img.onerror = (error) => {
            console.error('Decoration image failed to load:', error);
            console.log('Image src that failed:', imageUrl);
            toast.error('Failed to load decoration image');
        };
        img.src = imageUrl;
    };

    // Add topping to canvas
    const addTopping = (topping) => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        // Construct the full path with folder structure
        const imageUrl = getPublicImageUrl(`topping/${topping.src}`);
        console.log('Adding topping:', { topping, imageUrl });

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
            toast.success(`${topping.name} added to canvas`);
        };
        img.onerror = (error) => {
            console.error('Topping image failed to load:', error);
            console.log('Image src that failed:', imageUrl);
            toast.error('Failed to load topping image');
        };
        img.src = imageUrl;
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
        toast.success('Text added to canvas');
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
            toast.success('Object deleted');
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

    // Export design
    const exportDesign = () => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        const dataURL = canvas.current.toDataURL({
            format: 'png',
            quality: 1
        });

        const link = document.createElement('a');
        link.download = 'custom-cake-design.png';
        link.href = dataURL;
        link.click();
        toast.success('Design exported successfully');
    };

    console.log('=== Render called ===');
    console.log('Current state:', { loading, canvasReady, selectedColor, cakeImages: cakeImages.length });

    if (loading) {
        console.log('Showing loading spinner');
        return <LoadingSpinner message="Loading cake designer..." />;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Toolbar - Figma Style */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-semibold text-gray-900">Cake Designer</h1>
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
                                                            className="w-full h-16 object-cover rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
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
                                                            className="w-full h-16 object-cover rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
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
                                                            src={getPublicImageUrl(`topping/${topping.src}`)}
                                                            alt={topping.name}
                                                            className="w-full h-16 object-cover rounded border border-gray-200 group-hover:border-blue-300 transition-colors"
                                                            onError={(e) => {
                                                                console.error('Topping image failed to load in UI:', `topping/${topping.src}`);
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
                            {/* Color Picker - Only show when object is selected */}
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
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Type</label>
                                <div className="text-sm font-medium text-gray-900 capitalize">
                                    {selectedObject.type}
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
        </div>
    );
};

export default CakeCustomization;