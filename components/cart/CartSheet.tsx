"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"
import { formatPriceExact } from "@/lib/format"
import { OrderFormCartItems } from "@/components/cart/OrderFormCartItems"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ShoppingBag, ArrowRight } from "lucide-react"

interface CartSheetProps {
  open: boolean
  onClose: () => void
}

export function CartSheet({ open, onClose }: CartSheetProps) {
  const router = useRouter()
  const { cart, total } = useCart()
  const { isCustomer } = useCustomerProfile()

  // State for the Auth Intercept view
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  // Reset auth prompt state cleanly when the sheet opens (without causing an extra useEffect re-render)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setShowAuthPrompt(false)
    }
  }

  // Smooth navigation: close the drawer, wait for animation, then navigate
  const handleNavigate = (path: string) => {
    onClose()
    setTimeout(() => {
      router.push(path)
    }, 300)
  }

  const handleCheckoutClick = () => {
    if (cart.items.length === 0) return

    if (isCustomer) {
      // Logged in — go straight to checkout
      handleNavigate("/checkout")
    } else {
      // Guest — show auth prompt
      setShowAuthPrompt(true)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            {showAuthPrompt ? "Almost there" : "Your Cart"}
          </SheetTitle>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <span className="sr-only">Close</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <ShoppingBag className="size-8 text-muted-foreground" />
              </div>
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Looks like you haven&apos;t added anything yet.
              </p>
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Continue Browsing
              </Button>
            </div>
          ) : showAuthPrompt ? (
            <div className="flex h-full flex-col justify-center space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="font-heading text-xl font-bold">
                  Sign in for a faster checkout
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track your orders, earn rewards, and save your delivery
                  details for next time.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={() => {
                    handleNavigate("/customer/signup?redirect=/checkout")
                  }}
                >
                  Create Free Account
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => {
                    handleNavigate("/customer/login?redirect=/checkout")
                  }}
                >
                  Log In
                </Button>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-popover px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="xl"
                onClick={() => {
                  handleNavigate("/checkout")
                }}
                className="text-muted-foreground"
              >
                Continue as Guest
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-4 rounded-xl bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  Ordering from
                </p>
                <p className="font-bold">{cart.vendorName}</p>
              </div>

              <OrderFormCartItems loading={false} />
            </div>
          )}
        </div>

        {!showAuthPrompt && cart.items.length > 0 && (
          <SheetFooter className="mt-auto border-t p-6">
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span>{formatPriceExact(total)}</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Delivery and service fees calculated at checkout.
              </p>
              <Button
                onClick={handleCheckoutClick}
                variant="hero"
                size="xl"
                className="group w-full"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
