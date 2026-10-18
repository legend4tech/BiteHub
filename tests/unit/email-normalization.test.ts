import { describe, it, expect } from "vitest"
import { getCanonicalEmail, isDisposableEmail } from "@/lib/emailNormalization"

describe("Email Canonical Normalization (Anti-Abuse Invariants)", () => {
  describe("Gmail Normalization", () => {
    it("strips dots from Gmail usernames", () => {
      expect(getCanonicalEmail("t.e.s.t.student@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("test.student@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("t.e.s.t.s.t.u.d.e.n.t@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
    })

    it("strips plus-addressing subaddresses from Gmail", () => {
      expect(getCanonicalEmail("teststudent+food@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("teststudent+promo123@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
    })

    it("strips both dots and plus-addressing simultaneously on Gmail", () => {
      expect(getCanonicalEmail("t.e.s.t.student+bonus@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("test.student+test.tag@gmail.com")).toBe(
        "teststudent@gmail.com"
      )
    })

    it("normalises @googlemail.com domain to @gmail.com with dot and plus stripping", () => {
      expect(getCanonicalEmail("teststudent@googlemail.com")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("t.e.s.t.student+voucher@googlemail.com")).toBe(
        "teststudent@gmail.com"
      )
    })
  })

  describe("Other Major Providers", () => {
    it("strips plus-addressing for Outlook, Hotmail, and iCloud while preserving dots", () => {
      expect(getCanonicalEmail("john.doe+orders@outlook.com")).toBe(
        "john.doe@outlook.com"
      )
      expect(getCanonicalEmail("campus.student+food@hotmail.com")).toBe(
        "campus.student@hotmail.com"
      )
      expect(getCanonicalEmail("apple.user+test@icloud.com")).toBe(
        "apple.user@icloud.com"
      )
    })

    it("strips hyphen-addressing for Yahoo while preserving dots", () => {
      expect(getCanonicalEmail("user.name-temporary@yahoo.com")).toBe(
        "user.name@yahoo.com"
      )
    })
  })

  describe("Sanitization & Edge Cases", () => {
    it("trims whitespace and converts uppercase to lowercase", () => {
      expect(getCanonicalEmail("  TESTSTUDENT@GMAIL.COM  ")).toBe(
        "teststudent@gmail.com"
      )
      expect(getCanonicalEmail("  John.Doe+Promo@OutLook.COM  ")).toBe(
        "john.doe@outlook.com"
      )
    })

    it("handles empty or malformed email strings gracefully", () => {
      expect(getCanonicalEmail("")).toBe("")
      expect(getCanonicalEmail("notanemail")).toBe("notanemail")
      expect(getCanonicalEmail("@domain.com")).toBe("@domain.com")
    })
  })

  describe("Disposable Email Detection", () => {
    it("flags known temporary/throwaway email domains", () => {
      expect(isDisposableEmail("attacker@tempmail.com")).toBe(true)
      expect(isDisposableEmail("fraud@10minutemail.com")).toBe(true)
      expect(isDisposableEmail("fake@mailinator.com")).toBe(true)
      expect(isDisposableEmail("scam@guerrillamail.com")).toBe(true)
    })

    it("returns false for legitimate email domains", () => {
      expect(isDisposableEmail("student@gmail.com")).toBe(false)
      expect(isDisposableEmail("student@unilag.edu.ng")).toBe(false)
      expect(isDisposableEmail("customer@outlook.com")).toBe(false)
    })
  })
})
