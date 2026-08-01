import { useState, useEffect } from "react"
import axios from "axios"

export function useMonnifyAccountValidation(
  accountNumber?: string,
  bankCode?: string
) {
  const [accountName, setAccountName] = useState<string>("")
  const [isFetchingName, setIsFetchingName] = useState(false)
  const [isNameValid, setIsNameValid] = useState(false)
  const [nameError, setNameError] = useState("")

  useEffect(() => {
    if (accountNumber?.length === 10 && bankCode) {
      const fetchAccountName = async () => {
        setIsFetchingName(true)
        setNameError("")
        setAccountName("")
        setIsNameValid(false)
        try {
          const res = await axios.get(
            `/api/vendor/monnify/validate-account?accountNumber=${accountNumber}&bankCode=${bankCode}`
          )
          if (res.data.success && res.data.accountDetails?.accountName) {
            setAccountName(res.data.accountDetails.accountName)
            setIsNameValid(true)
          } else {
            setNameError("Invalid account details")
          }
        } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string } } }
          setNameError(err.response?.data?.error || "Invalid account details")
        } finally {
          setIsFetchingName(false)
        }
      }

      const debounceId = setTimeout(() => {
        fetchAccountName()
      }, 500)

      return () => clearTimeout(debounceId)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountName("")
       
      setIsNameValid(false)
       
      setNameError("")
    }
  }, [accountNumber, bankCode])

  return { accountName, isFetchingName, isNameValid, nameError }
}
