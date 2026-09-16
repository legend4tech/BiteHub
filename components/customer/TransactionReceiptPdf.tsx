import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer"
import { formatPriceExact } from "@/lib/format"
import type { Transaction } from "@/types/customer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  watermarkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
    overflow: "hidden",
    opacity: 0.08,
  },
  watermarkText: {
    fontSize: 16,
    color: "#f24700",
    transform: "rotate(-30deg)",
    margin: 15,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#f24700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 20,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  logoHighlight: {
    color: "#f24700",
  },
  title: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 30,
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  lastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "bold",
    textAlign: "right",
    maxWidth: "65%",
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ffedd5",
    flexWrap: "wrap",
  },
  amountLabel: {
    fontSize: 14,
    color: "#9a3412",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
    flexShrink: 1,
  },
  amountValueDebit: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
    flexShrink: 1,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 20,
  },
  footerLink: {
    color: "#f24700",
    textDecoration: "none",
  },
})

interface Props {
  transaction: Transaction
  customerName: string
}

export const TransactionReceiptPdf = ({ transaction, customerName }: Props) => {
  const date = new Date(transaction.createdAt).toLocaleString()
  const isCredit =
    transaction.type.includes("deposit") || transaction.type === "reward"

  // Replace weird Naira symbol with NGN in PDF to avoid font rendering issues
  const rawPriceStr = formatPriceExact(transaction.amount)
  const safePriceStr = rawPriceStr.replace("₦", "NGN ")

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.topAccent} />

        {/* Watermark */}
        <View style={styles.watermarkContainer}>
          {Array.from({ length: 150 }).map((_, i) => (
            <Text key={i} style={styles.watermarkText}>
              BITEHUB
            </Text>
          ))}
        </View>

        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image src="/apple-touch-icon.png" style={styles.logoImage} />
            <Text style={styles.logoText}>
              Bite<Text style={styles.logoHighlight}>Hub</Text>
            </Text>
          </View>
          <Text style={styles.title}>Receipt</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name</Text>
            <Text style={styles.value}>{customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date & Time</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference No.</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction Type</Text>
            <Text style={styles.value}>
              {transaction.type.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
          <View style={styles.lastRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>SUCCESSFUL</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={isCredit ? styles.amountValue : styles.amountValueDebit}>
            {isCredit ? "+" : "-"}
            {safePriceStr}
          </Text>
        </View>

        <Text style={styles.footer}>
          Thank you for choosing BiteHub!{"\n"}
          <Link src="https://www.bitehubapp.com" style={styles.footerLink}>
            www.bitehubapp.com
          </Link>
        </Text>
      </Page>
    </Document>
  )
}
