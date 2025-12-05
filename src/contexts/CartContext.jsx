import React, { createContext, useContext, useReducer } from "react"

const CartContext = createContext()

export function useCart () {
  return useContext(CartContext)
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      )
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload)
      }

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }

    case "CLEAR_CART":
      return {
        ...state,
        items: []
      }

    default:
      return state
  }
}

export function CartProvider ({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] })

  const addItem = (product) => {
    console.log("CartContext addItem called with:", product)

    if (!product || !product.id) {
      console.error("Invalid product provided to addItem:", product)
      return
    }

    dispatch({ type: "ADD_ITEM", payload: product })
    console.log("Item dispatched to cart successfully")
  }

  const removeItem = (productId) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { id: productId, quantity }
      })
    }
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const getTotalPrice = () => {
    return cart.items.reduce(
      (total, item) => total + item.harga * item.quantity,
      0
    )
  }

  const getTotalItems = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
