import { createContext, useContext, ReactNode, useCallback } from "react"
import { useGetCart, useAddToCart, useUpdateCartItem, useRemoveFromCart, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface CartContextType {
  cart: any; // Using any for simplicity as Cart type is complex
  isLoading: boolean;
  addToCart: (productId: number, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { data: cart, isLoading } = useGetCart({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetCartQueryKey()
    }
  })

  const addMutation = useAddToCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveFromCart()
  const clearMutation = useClearCart()

  const addToCart = useCallback((productId: number, quantity = 1) => {
    if (!isAuthenticated) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour ajouter au panier", variant: "destructive" })
      return
    }
    
    addMutation.mutate(
      { data: { productId, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
          toast({ title: "Ajouté au panier", description: "Le produit a été ajouté avec succès." })
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible d'ajouter au panier.", variant: "destructive" })
        }
      }
    )
  }, [addMutation, isAuthenticated, queryClient, toast])

  const removeItem = useCallback((productId: number) => {
    removeMutation.mutate(
      { productId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
      }
    )
  }, [removeMutation, queryClient])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return removeItem(productId)
    
    updateMutation.mutate(
      { productId, data: { quantity } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
      }
    )
  }, [updateMutation, queryClient, removeItem])

  const clearCart = useCallback(() => {
    clearMutation.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    })
  }, [clearMutation, queryClient])

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount: cart?.itemCount || 0
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
