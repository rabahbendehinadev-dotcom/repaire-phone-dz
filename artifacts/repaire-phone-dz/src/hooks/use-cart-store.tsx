import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react"
import {
  useGetCart, useAddToCart, useUpdateCartItem, useRemoveFromCart, useClearCart,
  getGetCartQueryKey
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

// ─── Guest cart (localStorage) ───────────────────────────────────────────────

const GUEST_CART_KEY = "repaire_guest_cart"

export interface GuestCartItem {
  productId: number
  quantity: number
  name: string
  price: number
  images: string[]
}

function loadGuestItems(): GuestCartItem[] {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]") }
  catch { return [] }
}

function saveGuestItems(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

function buildGuestCart(items: GuestCartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = 500
  return {
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    discount: 0,
    couponDiscount: 0,
    couponCode: null as string | null,
    shipping,
    total: subtotal + shipping,
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface CartContextType {
  cart: ReturnType<typeof buildGuestCart> | any
  isLoading: boolean
  isGuest: boolean
  addToCart: (productId: number, quantity?: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Guest cart — initialised from localStorage
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>(loadGuestItems)

  // Keep localStorage in sync whenever guest items change
  useEffect(() => {
    if (!isAuthenticated) saveGuestItems(guestItems)
  }, [guestItems, isAuthenticated])

  // API cart — only enabled when the user is logged in
  const { data: apiCart, isLoading } = useGetCart({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetCartQueryKey(),
    },
  })

  const addMutation    = useAddToCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveFromCart()
  const clearMutation  = useClearCart()

  // ── addToCart — no auth guard; works for guests via localStorage ──────────
  const addToCart = useCallback(async (productId: number, quantity = 1) => {
    if (isAuthenticated) {
      addMutation.mutate(
        { data: { productId, quantity } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
            toast({ title: "Ajouté au panier", description: "Le produit a été ajouté avec succès." })
          },
          onError: () => {
            toast({ title: "Erreur", description: "Impossible d'ajouter au panier.", variant: "destructive" })
          },
        }
      )
    } else {
      // Guest: fetch product details, then persist to localStorage
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (!res.ok) throw new Error("product fetch failed")
        const product = await res.json()

        setGuestItems(prev => {
          const existing = prev.find(i => i.productId === productId)
          const updated = existing
            ? prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i)
            : [...prev, {
                productId,
                quantity,
                name: product.name,
                price: product.discountPrice ?? product.price,
                images: Array.isArray(product.images) ? product.images : [],
              }]
          saveGuestItems(updated)
          return updated
        })

        toast({ title: "Ajouté au panier", description: "Le produit a été ajouté avec succès." })
      } catch {
        toast({ title: "Erreur", description: "Impossible d'ajouter au panier.", variant: "destructive" })
      }
    }
  }, [addMutation, isAuthenticated, queryClient, toast])

  // ── removeItem ────────────────────────────────────────────────────────────
  const removeItem = useCallback((productId: number) => {
    if (isAuthenticated) {
      removeMutation.mutate(
        { productId },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
      )
    } else {
      setGuestItems(prev => {
        const updated = prev.filter(i => i.productId !== productId)
        saveGuestItems(updated)
        return updated
      })
    }
  }, [removeMutation, queryClient, isAuthenticated])

  // ── updateQuantity ────────────────────────────────────────────────────────
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) { removeItem(productId); return }
    if (isAuthenticated) {
      updateMutation.mutate(
        { productId, data: { quantity } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
      )
    } else {
      setGuestItems(prev => {
        const updated = prev.map(i => i.productId === productId ? { ...i, quantity } : i)
        saveGuestItems(updated)
        return updated
      })
    }
  }, [updateMutation, queryClient, removeItem, isAuthenticated])

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      clearMutation.mutate(undefined, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
      })
    } else {
      setGuestItems([])
      localStorage.removeItem(GUEST_CART_KEY)
    }
  }, [clearMutation, queryClient, isAuthenticated])

  const cart      = isAuthenticated ? apiCart : buildGuestCart(guestItems)
  const itemCount = (cart as any)?.itemCount ?? 0

  return (
    <CartContext.Provider value={{
      cart,
      isLoading: isAuthenticated ? isLoading : false,
      isGuest: !isAuthenticated,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
