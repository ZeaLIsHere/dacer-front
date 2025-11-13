import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import storeStatsService from "../services/storeStatsService";

const StoreContext = createContext();

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

export function StoreProvider({ children }) {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeStats, setStoreStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0,
    todayRevenue: 0,
  });

  // Listen to user's stores
  useEffect(() => {
    if (!currentUser) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log("Firestore loading timeout, switching to fallback mode");

      // Try to load from localStorage
      const tempStoreData = localStorage.getItem("tempStore");
      if (tempStoreData) {
        try {
          const tempStore = JSON.parse(tempStoreData);
          if (tempStore.userId === currentUser.uid) {
            setStores([tempStore]);
            setCurrentStore(tempStore);
            console.log(
              "Using temporary store from localStorage due to timeout:",
              tempStore,
            );
          }
        } catch (error) {
          console.error("Error parsing temporary store data:", error);
        }
      }

      setLoading(false);
    }, 5000); // 5 second timeout

    const storesQuery = query(
      collection(db, "stores"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      storesQuery,
      (snapshot) => {
        clearTimeout(loadingTimeout); // Clear timeout if successful

        try {
          const storesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Check for temporary store in localStorage
          const tempStoreData = localStorage.getItem("tempStore");
          if (tempStoreData) {
            try {
              const tempStore = JSON.parse(tempStoreData);
              if (tempStore.userId === currentUser.uid) {
                // Check if this temp store is already in Firestore
                const existsInFirestore = storesData.some(
                  (store) =>
                    store.storeName === tempStore.storeName &&
                    store.ownerName === tempStore.ownerName,
                );

                if (!existsInFirestore) {
                  storesData.push(tempStore);
                  console.log(
                    "Added temporary store from localStorage:",
                    tempStore,
                  );
                } else {
                  // Remove temp store if it exists in Firestore
                  localStorage.removeItem("tempStore");
                  console.log(
                    "Removed temporary store as it exists in Firestore",
                  );
                }
              }
            } catch (error) {
              console.error("Error parsing temporary store data:", error);
              localStorage.removeItem("tempStore"); // Remove corrupted data
            }
          }

          setStores(storesData);

          // Set current store (first store or previously selected)
          const savedStoreId = localStorage.getItem("currentStoreId");
          let selectedStore = null;

          if (savedStoreId) {
            selectedStore = storesData.find(
              (store) => store.id === savedStoreId,
            );
          }

          if (!selectedStore && storesData.length > 0) {
            selectedStore = storesData[0];
            // Save the selected store ID
            localStorage.setItem("currentStoreId", selectedStore.id);
          }

          setCurrentStore(selectedStore);
          setLoading(false);
        } catch (error) {
          console.error("Error processing stores data:", error);
          setLoading(false);
        }
      },
      (error) => {
        clearTimeout(loadingTimeout); // Clear timeout on error
        console.error("Firestore error, using fallback mode:", error);

        // Enhanced error handling based on error type
        if (error.code === "permission-denied") {
          console.log("Permission denied - using localStorage fallback");
        } else if (error.code === "unavailable") {
          console.log("Firestore unavailable - using localStorage fallback");
        } else {
          console.log("Unknown Firestore error - using localStorage fallback");
        }

        // Fallback: Try to load from localStorage
        const tempStoreData = localStorage.getItem("tempStore");
        if (tempStoreData) {
          try {
            const tempStore = JSON.parse(tempStoreData);
            if (tempStore.userId === currentUser.uid) {
              setStores([tempStore]);
              setCurrentStore(tempStore);
              console.log(
                "Using temporary store from localStorage:",
                tempStore,
              );
            }
          } catch (error) {
            console.error("Error parsing temporary store data:", error);
            localStorage.removeItem("tempStore");
          }
        } else {
          // No stores available
          setStores([]);
          setCurrentStore(null);
        }

        setLoading(false);
      },
    );

    return () => {
      clearTimeout(loadingTimeout); // Clear timeout on cleanup
      unsubscribe();
    };
  }, [currentUser]);

  // Listen to store statistics updates
  useEffect(() => {
    if (!currentUser?.uid) {
      setStoreStats({
        totalSales: 0,
        totalRevenue: 0,
        todaySales: 0,
        todayRevenue: 0,
      });
      return;
    }

    const unsubscribe = storeStatsService.getStoreStats(
      currentUser?.uid,
      (stats) => {
        setStoreStats(stats);

        // Update current store with latest stats
        setCurrentStore((prev) =>
          prev
            ? {
                ...prev,
                totalSales: stats.totalSales,
                totalRevenue: stats.totalRevenue,
              }
            : null,
        );
      },
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  // Switch to different store
  const switchStore = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem("currentStoreId", storeId);
    }
  };

  // Update store data
  const updateStore = async (storeId, updateData) => {
    try {
      const storeRef = doc(db, "stores", storeId);
      await updateDoc(storeRef, updateData);
    } catch (error) {
      console.error("Error creating store:", error);
      throw error;
    }
  };

  // Get store statistics
  const getStoreStats = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return {
      totalProducts: store?.totalProducts || 0,
      totalSales: store?.totalSales || 0,
      totalRevenue: store?.totalRevenue || 0,
      isActive: store?.isActive || false,
    };
  };

  const value = {
    stores,
    currentStore,
    loading,
    storeStats,
    switchStore,
    updateStore,
    getStoreStats,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
