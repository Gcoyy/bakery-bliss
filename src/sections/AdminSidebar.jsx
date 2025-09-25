import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

const AdminSidebar = () => {
  const location = useLocation();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lowInventoryCount, setLowInventoryCount] = useState(0);

  // Get the current path segment after /adminpage/
  const pathSegments = location.pathname.split('/');
  const adminIndex = pathSegments.indexOf('adminpage');
  const currentPath = adminIndex !== -1 && pathSegments[adminIndex + 1] ? pathSegments[adminIndex + 1] : 'inventory';

  // Fetch new orders count (Pending status)
  const fetchNewOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('ORDER')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'Pending');

      if (error) {
        console.error('Error fetching new orders count:', error);
        setNewOrdersCount(0);
        return;
      }

      setNewOrdersCount(count || 0);
    } catch (error) {
      console.error('Error in fetchNewOrdersCount:', error);
      setNewOrdersCount(0);
    }
  };

  // Fetch low inventory count (stock_quantity < 10)
  const fetchLowInventoryCount = async () => {
    try {
      // First, let's get the actual data to debug
      const { data: lowInventoryData, error: dataError } = await supabase
        .from('INVENTORY')
        .select('inven_id, stock_quantity, ingred_id, INGREDIENT(ingred_name)')
        .lt('stock_quantity', 500);

      if (dataError) {
        console.error('Error fetching low inventory data:', dataError);
        setLowInventoryCount(0);
        return;
      }

      // console.log('Low inventory data:', lowInventoryData);
      // console.log('Low inventory count:', lowInventoryData?.length || 0);

      setLowInventoryCount(lowInventoryData?.length || 0);
    } catch (error) {
      console.error('Error in fetchLowInventoryCount:', error);
      setLowInventoryCount(0);
    }
  };

  // Fetch data on component mount and set up real-time updates
  useEffect(() => {
    fetchNewOrdersCount();
    fetchLowInventoryCount();

    // Set up real-time subscription for orders
    const orderChannel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ORDER'
        },
        () => {
          fetchNewOrdersCount();
        }
      )
      .subscribe();

    // Set up real-time subscription for inventory
    const inventoryChannel = supabase
      .channel('admin-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'INVENTORY'
        },
        () => {
          fetchLowInventoryCount();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, []);


  return (
    <aside className="w-52 bg-white border-4 border-[#AF524D] py-4 px-2 rounded-2xl max-h-fit">
      <ul className="space-y-2">
        {[
          { name: "Inventory", path: "inventory", indicator: lowInventoryCount, indicatorColor: "red" },
          { name: "Cake Orders", path: "cake orders", indicator: newOrdersCount, indicatorColor: "green" },
          { name: "Cakes", path: "cakes" },
          { name: "Custom Cake Assets", path: "custom cake assets" },
          { name: "Blocked Dates", path: "blocked dates" },
          { name: "Recipe Management", path: "recipe management" },
          { name: "Asset Ingredient Management", path: "asset ingredient management" },
        ].map((opt, i) => {
          // Check if this option is active - handle URL encoding
          const decodedCurrentPath = decodeURIComponent(currentPath);
          const isActive = decodedCurrentPath === opt.path;

          return (
            <Link
              key={i}
              to={`/adminpage/${opt.path}`}
              className={`block text-sm px-3 py-2 rounded border transition-all duration-200 relative ${isActive
                ? 'bg-[#AF524D] text-white border-[#AF524D] shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-[#DFBFA6] border-gray-300 hover:border-[#AF524D] hover:text-[#AF524D]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{opt.name}</span>
                {/* Indicator Badge */}
                {opt.indicator && opt.indicator > 0 && (
                  <div className={`min-w-[20px] h-5 text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg border-2 border-white animate-pulse ${opt.indicatorColor === 'red'
                    ? 'bg-gradient-to-r from-red-400 to-red-500 text-white'
                    : 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                    }`}>
                    {opt.indicator > 99 ? '99+' : opt.indicator}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </ul>
    </aside>
  )
}

export default AdminSidebar
