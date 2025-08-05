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
    const [selectedTool, setSelectedTool] = useState('select');
    const [selectedColor, setSelectedColor] = useState('#FF0000');
    const [textValue, setTextValue] = useState('');
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [canvasReady, setCanvasReady] = useState(false);

    console.log('Initial state:', { loading, canvasReady, selectedColor });

    // Track canvasReady changes
    useEffect(() => {
        console.log('=== CanvasReady state changed ===');
        console.log('New canvasReady value:', canvasReady);
    }, [canvasReady]);

    // Helper function to get public image URL
    const getPublicImageUrl = (path) => {
        if (!path) return null;
        // If the path is already a full URL, return it as is
        if (path.startsWith('http')) {
            return path;
        }
        // Otherwise, construct the public URL
        return supabase.storage.from("cake").getPublicUrl(path).data.publicUrl;
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

        const canvas = colorWheelRef.current;
        console.log('Color wheel canvas:', canvas);

        if (!canvas) {
            console.log('Color wheel canvas not available');
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

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

            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
                    toast.success('Color changed');
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

    // Fetch cake images and decorations from database
    useEffect(() => {
        console.log('=== Fetch Images useEffect triggered ===');
        const fetchImages = async () => {
            try {
                console.log('Setting loading to true');
                setLoading(true);

                // Fetch cake bases
                const { data: cakeData, error: cakeError } = await supabase
                    .from("CAKE")
                    .select("*");

                if (cakeError) {
                    console.error("Error fetching cakes:", cakeError);
                    toast.error("Failed to load cake images");
                    return;
                }

                // Fetch decorations (you might need to create this table)
                const { data: decorationData, error: decorationError } = await supabase
                    .from("DECORATIONS")
                    .select("*");

                if (decorationError) {
                    console.log("No decorations table found, using sample data");
                    // Use sample decoration data if table doesn't exist
                    const sampleDecorations = [
                        { id: 1, name: 'Sprinkles', image_path: 'decorations/sprinkles.png', category: 'toppings' },
                        { id: 2, name: 'Fruits', image_path: 'decorations/fruits.png', category: 'toppings' },
                        { id: 3, name: 'Chocolate Chips', image_path: 'decorations/chocolate-chips.png', category: 'toppings' },
                        { id: 4, name: 'Flowers', image_path: 'decorations/flowers.png', category: 'decorations' },
                        { id: 5, name: 'Balloons', image_path: 'decorations/balloons.png', category: 'decorations' }
                    ];
                    setDecorations(sampleDecorations);
                } else {
                    setDecorations(decorationData);
                }

                // Process cake images with public URLs
                const cakesWithImages = cakeData.map((cake) => ({
                    ...cake,
                    publicUrl: getPublicImageUrl(cake.cake_img)
                }));

                console.log('Setting cake images:', cakesWithImages);
                setCakeImages(cakesWithImages);
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
                canvas.current = new Canvas(canvasRef.current, {
                    width: 800,
                    height: 600,
                    backgroundColor: '#f8f9fa'
                });
                console.log('Canvas created successfully:', canvas.current);

                // Add event listeners
                canvas.current.on('selection:created', handleSelection);
                canvas.current.on('selection:cleared', handleDeselection);
                console.log('Event listeners added');

                // Mark canvas as ready with a small delay to ensure full initialization
                console.log('Setting canvasReady to true');
                setTimeout(() => {
                    console.log('Delayed canvas ready set to true');
                    setCanvasReady(true);
                }, 100);

                return () => {
                    console.log('Canvas cleanup - disposing canvas');
                    if (canvas.current) {
                        canvas.current.dispose();
                        canvas.current = null;
                    }
                    console.log('Setting canvasReady to false');
                    setCanvasReady(false);
                };
            } catch (error) {
                console.error('Error creating Canvas:', error);
            }
        } else {
            console.log('Loading is still true, canvas ref not ready, or canvas already exists');
        }
    }, [loading]);

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
    }, [selectedColor]);

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
            if (activeObject.type === 'text') {
                console.log('Setting text properties from active object');
                setTextValue(activeObject.text);
                setFontSize(activeObject.fontSize);
                setFontFamily(activeObject.fontFamily);
                setSelectedColor(activeObject.fill);
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
            console.log('Image src that failed:', cake.publicUrl || '/saved-cake.png');
            toast.error('Failed to load cake image');
        };
        img.src = cake.publicUrl || '/saved-cake.png';
        console.log('Image src set to:', cake.publicUrl || '/saved-cake.png');
    };

    // Add decoration to canvas
    const addDecoration = (decoration) => {
        if (!canvasReady || !canvas.current) {
            toast.error('Canvas not ready');
            return;
        }

        const imageUrl = decoration.image_path ?
            getPublicImageUrl(decoration.image_path) :
            `/decorations/${decoration.name.toLowerCase().replace(' ', '-')}.png`;

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
            console.log('Size changed successfully');
            toast.success('Size changed');
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
        <div className="min-h-screen bg-gradient-to-b from-[#f7f0e7] to-[#e5d6c4] py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#381914] mb-2">Custom Cake Designer</h1>
                    <p className="text-[#381914] opacity-80">Create your perfect cake design with our interactive tool</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Tools and Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Tools */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Tools</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedTool('select')}
                                    className={`w-full py-2 px-4 rounded-lg transition-colors ${selectedTool === 'select'
                                        ? 'bg-[#AF524D] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ✋ Select
                                </button>
                                <button
                                    onClick={() => setSelectedTool('text')}
                                    className={`w-full py-2 px-4 rounded-lg transition-colors ${selectedTool === 'text'
                                        ? 'bg-[#AF524D] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    T Text
                                </button>
                            </div>
                        </div>

                        {/* Color Wheel */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Color Wheel</h3>
                            <div className="flex flex-col items-center space-y-4">
                                <canvas
                                    ref={colorWheelRef}
                                    width="200"
                                    height="200"
                                    className="border border-gray-300 rounded-lg cursor-pointer"
                                    onClick={getColorFromWheel}
                                    title="Click to select color"
                                />
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Selected Color:</p>
                                    <div
                                        className="w-12 h-12 rounded-full border-2 border-gray-300 mx-auto"
                                        style={{ backgroundColor: selectedColor }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{selectedColor}</p>
                                </div>
                            </div>
                        </div>

                        {/* Text Controls */}
                        {selectedTool === 'text' && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-[#381914] mb-4">Text Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
                                        <input
                                            type="text"
                                            value={textValue}
                                            onChange={(e) => setTextValue(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
                                            placeholder="Enter your text..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                                        <input
                                            type="range"
                                            min="12"
                                            max="72"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <span className="text-sm text-gray-500">{fontSize}px</span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => setFontFamily(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
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
                                        className="w-full py-2 px-4 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3D3A] transition-colors"
                                    >
                                        Add Text
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => changeSize(1.2)}
                                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Increase Size
                                </button>
                                <button
                                    onClick={() => changeSize(0.8)}
                                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Decrease Size
                                </button>
                                <button
                                    onClick={deleteSelected}
                                    className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={clearCanvas}
                                    className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Clear Canvas
                                </button>
                                <button
                                    onClick={exportDesign}
                                    className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Export Design
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Design Canvas</h3>
                            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Cake Images and Decorations */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Cake Bases */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Cake Bases</h3>
                            <div className="space-y-3">
                                {cakeImages.map((cake) => (
                                    <div key={cake.cake_id} className="border border-gray-200 rounded-lg p-3 hover:border-[#AF524D] transition-colors cursor-pointer">
                                        <img
                                            src={cake.publicUrl || "/saved-cake.png"}
                                            alt={cake.name}
                                            className="w-full h-20 object-cover rounded mb-2"
                                            onError={(e) => {
                                                e.target.src = "/saved-cake.png";
                                            }}
                                        />
                                        <p className="text-sm font-medium text-[#381914]">{cake.name}</p>
                                        <button
                                            onClick={() => addCakeBase(cake)}
                                            className="w-full mt-2 py-1 px-3 bg-[#AF524D] text-white text-xs rounded hover:bg-[#8B3D3A] transition-colors"
                                        >
                                            Add to Canvas
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decorations */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-[#381914] mb-4">Decorations</h3>
                            <div className="space-y-3">
                                {decorations.map((decoration) => (
                                    <div key={decoration.id} className="border border-gray-200 rounded-lg p-3 hover:border-[#AF524D] transition-colors cursor-pointer">
                                        <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">{decoration.name}</span>
                                        </div>
                                        <p className="text-sm font-medium text-[#381914]">{decoration.name}</p>
                                        <button
                                            onClick={() => addDecoration(decoration)}
                                            className="w-full mt-2 py-1 px-3 bg-[#AF524D] text-white text-xs rounded hover:bg-[#8B3D3A] transition-colors"
                                        >
                                            Add to Canvas
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CakeCustomization;