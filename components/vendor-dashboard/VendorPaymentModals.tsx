import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VendorPaymentModalsProps {
  showSetupModal: boolean
  setShowSetupModal: (val: boolean) => void
  setupConfirmText: string
  setSetupConfirmText: (val: string) => void
  handleSetupConfirm: () => void
  saving: boolean
  lockDays: number

  showOtpRequestModal: boolean
  setShowOtpRequestModal: (val: boolean) => void
  handleRequestOtp: () => void
  requestingOtp: boolean

  showVerifyModal: boolean
  setShowVerifyModal: (val: boolean) => void
  otpValue: string
  setOtpValue: (val: string) => void
  changeConfirmText: string
  setChangeConfirmText: (val: string) => void
  handleVerifyConfirm: () => void
}

export function VendorPaymentModals({
  showSetupModal,
  setShowSetupModal,
  setupConfirmText,
  setSetupConfirmText,
  handleSetupConfirm,
  saving,
  lockDays,

  showOtpRequestModal,
  setShowOtpRequestModal,
  handleRequestOtp,
  requestingOtp,

  showVerifyModal,
  setShowVerifyModal,
  otpValue,
  setOtpValue,
  changeConfirmText,
  setChangeConfirmText,
  handleVerifyConfirm,
}: VendorPaymentModalsProps) {
  return (
    <>
      {/* 1. Initial Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bank Details</DialogTitle>
            <DialogDescription>
              To protect your funds, your bank details will be protected for{" "}
              <strong>{Math.ceil(lockDays)} days</strong> after setup. You
              won&apos;t be able to change them during this period.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Please type <strong>add account</strong> below to confirm you
              understand.
            </p>
            <Input
              value={setupConfirmText}
              onChange={(e) => setSetupConfirmText(e.target.value)}
              placeholder="add account"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSetupModal(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSetupConfirm}
              disabled={
                saving || setupConfirmText.toLowerCase() !== "add account"
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Connecting..." : "Confirm & Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Request OTP Modal (For Updates) */}
      <Dialog open={showOtpRequestModal} onOpenChange={setShowOtpRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Security Verification Required</DialogTitle>
            <DialogDescription>
              Because you are changing your payout details, we need to verify
              your identity. We will send a 6-digit One-Time Password (OTP) to
              your registered email address.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowOtpRequestModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleRequestOtp}
              disabled={requestingOtp}
            >
              {requestingOtp && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {requestingOtp ? "Sending OTP..." : "Send OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Verify OTP Modal (For Updates) */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Bank Update</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to your email to authorize this change.
              For your security, you will not be able to update these details
              again for {Math.ceil(lockDays)} days.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OTP Code</label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmation</label>
              <p className="text-xs text-muted-foreground">
                Please type <strong>change account</strong> below to confirm.
              </p>
              <Input
                value={changeConfirmText}
                onChange={(e) => setChangeConfirmText(e.target.value)}
                placeholder="change account"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVerifyModal(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleVerifyConfirm}
              disabled={
                saving ||
                !otpValue ||
                changeConfirmText.toLowerCase() !== "change account"
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Updating..." : "Verify & Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
