import { useEffect, useState } from "react";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import MenuPage from "./components/MenuPage";
import CartDrawer from "./components/CartDrawer";
import ProductDetailModal from "./components/ProductDetailModal";
import CheckoutPage from "./components/CheckoutPage";
import OwnerLogin from "./components/OwnerLogin";
import OwnerDashboard from "./components/OwnerDashboard";
import OrderTrackingPage from "./components/OrderTrackingPage";
import CustomerAuthModal from "./components/CustomerAuthModal";
import { getSession, signOut as apiSignOut } from "./services/apiClient";
import { fetchOrders as fetchOrdersFromBackend, placeOrder as placeOrderToBackend } from "./services/orderService";
import { normalizeOrder } from "./utils/orderUtils";
import { useRatings } from "./hooks/useRatings";
import { countReviews, getAverageRating } from "./data/productRating.js";
import { fetchProducts as fetchProductsFromMongo, updateProductStock } from "./services/productService";


function App() {
  const [page, setPage] = useState("home");
  const [jumpCategory, setJumpCategory] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState("");
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("foodworld-cart") || "{}");
    } catch {
      return {};
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const { reviewsVersion, fetchReviews, submitReview } = useRatings();
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "dark" : "dark"
  );
  const ratingSummaries = productsList.reduce((summaries, product) => {
    summaries[product.id] = {
      avgRating: getAverageRating(product.id),
      count: countReviews(product.id),
    };
    return summaries;
  }, {});

const fetchProducts = async () => {
  try {
    const data = await fetchProductsFromMongo();

    if (!data || data.length === 0) {
      setProductsList([]);
      return;
    }

    const normalizedProducts = data.map((product) => ({
      ...product,
      id: product._id,
    }));

    setProductsList(normalizedProducts);
  } catch (err) {
    console.error("Error fetching products from MongoDB:", err);
    setProductsList([]);
  }
};

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await fetchOrdersFromBackend();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders from backend:", error);
      setOrdersError(error?.message || "Could not fetch orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchOrders(), fetchReviews()]);
      const session = getSession();
      if (session?.user) {
        setCustomer(session.user);
        setOwner(session.user);
      }

      // Check if URL contains ?tracking=FW-XXXX or ?order_id=...
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const trackParam = params.get("tracking") || params.get("order_id");
        if (trackParam) {
          setTrackingOrderId(trackParam);
          setPage("tracking");
        }
      }

      setLoading(false);
    };
    load();
  }, [fetchReviews]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("foodworld-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (productIdOrKey, selectedDrink = null) => {
    setCart((prev) => {
      let key = String(productIdOrKey);
      let prodId = Number(key.split("_")[0]);
      let drink = selectedDrink;

      if (!selectedDrink && key.includes("_drink_")) {
        const drinkId = Number(key.split("_drink_")[1]);
        drink = prev[key]?.drink || productsList.find((p) => p.id === drinkId) || null;
      } else if (selectedDrink) {
        key = `${prodId}_drink_${selectedDrink.id}`;
      }

      const currentItem = prev[key];
      const currentQty = typeof currentItem === "number" ? currentItem : currentItem?.quantity || 0;

      return {
        ...prev,
        [key]: {
          productId: prodId,
          quantity: currentQty + 1,
          drink: drink || currentItem?.drink || null,
        },
      };
    });
  };

  const removeFromCart = (productIdOrKey) => {
    setCart((prev) => {
      const key = String(productIdOrKey);
      const currentItem = prev[key];
      if (!currentItem) return prev;
      const currentQty = typeof currentItem === "number" ? currentItem : currentItem?.quantity || 0;

      const next = { ...prev };
      if (currentQty <= 1) {
        delete next[key];
      } else {
        next[key] = {
          ...currentItem,
          quantity: currentQty - 1,
        };
      }
      return next;
    });
  };

  const cartCount = Object.values(cart).reduce((sum, item) => {
    const q = typeof item === "number" ? item : item?.quantity || 0;
    return sum + q;
  }, 0);

  /**
   * Order placement that sends order to backend API and MongoDB
   * and clears the cart upon verified database success.
   */
  const handlePlaceOrder = async (details) => {
    const orderPayload = {
      order_id: details.order_id,
      orderNumber: details.order_id,
      customer_name: details.customer_name || "Guest",
      mobile: details.mobile || "N/A",
      customer_phone: details.mobile || "N/A",
      customer_email: details.customer_email || "",
      address: details.address || "N/A",
      special_instructions: details.special_instructions || "",
      notes: details.special_instructions || "",
      items: details.items || [],
      subtotal: details.subtotal || 0,
      delivery_fee: details.delivery_fee || 150,
      tax: details.tax || 0,
      discount: details.discount || 0,
      total_amount: details.total_amount || 0,
      total: details.total_amount || 0,
      payment_method: details.payment_method || "cod",
      status: "pending",
      orderStatus: "pending",
    };

    let savedData = null;
    try {
      savedData = await placeOrderToBackend(orderPayload);
    } catch (err) {
      console.error("Order insertion failed:", err);
      throw new Error(err?.message || "Failed to place order.");
    }

    if (!savedData) {
      throw new Error("Server did not return a valid order confirmation.");
    }

    // ONLY on successful database insertion:
    // 1. Clear cart state
    setCart({});
    // 2. Clear localStorage
    localStorage.removeItem("foodworld-cart");
    // 3. Refresh orders from database
    await fetchOrders();

    // 4. Decrement stock for ordered items in MongoDB
    try {
      for (const item of details.items || []) {
        const prodId = item.id || item.productId;

        const product = productsList.find(
          (p) => String(p.id) === String(prodId)
        );

        if (product && product.stock_quantity != null) {
          const newStock = Math.max(
            0,
            Number(product.stock_quantity) - Number(item.quantity || 1)
          );

          await updateProductStock(
            product.id,
            newStock,
            newStock > 0
          );
        }

        // Drink combo stock
        if (item.drink && item.drink.id) {
          const drinkProduct = productsList.find(
            (p) => String(p.id) === String(item.drink.id)
          );

          if (drinkProduct && drinkProduct.stock_quantity != null) {
            const drinkNewStock = Math.max(
              0,
              Number(drinkProduct.stock_quantity) -
                Number(item.quantity || 1)
            );

            await updateProductStock(
              drinkProduct.id,
              drinkNewStock,
              drinkNewStock > 0
            );
          }
        }
      }

      await fetchProducts();
    } catch (stockErr) {
      console.warn("MongoDB stock decrement warning:", stockErr);
    }

    // 5. Return normalized order with the real saved database ID & human readable order_id
    const normalized = normalizeOrder(savedData, productsList);
    if (!normalized.order_id || normalized.order_id === "FW-00000") {
      normalized.order_id = details.order_id;
    }

    return normalized;
  };

  const goToMenu = () => {
    setJumpCategory(null);
    setPage("menu");
  };

  const goToCategory = (category) => {
    setJumpCategory(category);
    setPage("menu");
  };

  const goToTracking = (orderId = "") => {
    setTrackingOrderId(orderId);
    setPage("tracking");
  };

  const signOut = async () => {
    await apiSignOut();
    setOwner(null);
    setPage("home");
  };

  const handleCustomerSignOut = async () => {
    await apiSignOut();
    setCustomer(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-coal-950 text-teal-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (page === "owner" && !owner) {
    return (
      <OwnerLogin
        onLoggedIn={(user) => {
          setOwner(user);
          setPage("owner");
        }}
        onBack={() => setPage("home")}
      />
    );
  }

  if (page === "owner" && owner) {
    return (
      <OwnerDashboard
        products={productsList}
        orders={orders}
        ordersLoading={ordersLoading}
        ordersError={ordersError}
        user={owner}
        onSignOut={signOut}
        onProductsChanged={fetchProducts}
        onOrdersChanged={fetchOrders}
        onBackToStore={() => setPage("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-coal-50 font-sans text-zinc-900 transition-colors duration-300 dark:bg-coal-950 dark:text-zinc-100">
      <Header
        page={page}
        setPage={setPage}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        theme={theme}
        toggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        onOwner={() => setPage("owner")}
        customer={customer}
        onOpenCustomerAuth={() => setCustomerAuthOpen(true)}
        onCustomerSignOut={handleCustomerSignOut}
      />

      {page === "home" && (
        <HomePage
          products={productsList}
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
          goToMenu={goToMenu}
          goToCategory={goToCategory}
          onOpenDetail={setDetailProduct}
          ratingSummaries={ratingSummaries}
        />
      )}

      {page === "menu" && (
        <MenuPage
          products={productsList}
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
          initialCategory={jumpCategory}
          onOpenDetail={setDetailProduct}
          ratingSummaries={ratingSummaries}
        />
      )}

      {page === "checkout" && (
        <CheckoutPage
          cart={cart}
          products={productsList}
          onAdd={addToCart}
          onRemove={removeFromCart}
          goToMenu={goToMenu}
          onPlaceOrder={handlePlaceOrder}
          onGoToTracking={goToTracking}
          customer={customer}
        />
      )}

      {page === "tracking" && (
        <OrderTrackingPage
          products={productsList}
          initialOrderId={trackingOrderId}
          goToMenu={goToMenu}
        />
      )}

      <footer className="border-t border-coal-200 px-6 py-8 text-center dark:border-teal-500/10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Food World · Fresh & Fast Restaurant POS
        </p>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        products={productsList}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setPage("checkout");
        }}
      />

      <ProductDetailModal
        product={detailProduct}
        products={productsList}
        cart={cart}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onClose={() => setDetailProduct(null)}
        onSubmitReview={submitReview}
        ratingSummary={detailProduct ? ratingSummaries[detailProduct.id] || null : null}
        reviewsVersion={reviewsVersion}
      />

      {customerAuthOpen && (
        <CustomerAuthModal
          onClose={() => setCustomerAuthOpen(false)}
          onAuthenticated={(user) => {
            setCustomer(user);
            setCustomerAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;