import { SaleItem } from "../services/saleService";

export interface CreateSaleRequest {
    customer: {
      name: string;
    };
    items: SaleItem[];
    discount: number;
    tax: number;
    paymentMethod: "cash" | "card" | "upi" | "bank_transfer" | "credit";
    paymentStatus: "paid" | "pending" | "partial" | "failed";
    saleType: "retail" | "wholesale" | "online";
    notes: string;
    store: string;   // ✅ keep store only
  }
  