import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  discountType: "FIXED" | "PERCENTAGE";
  taxRate: number;
  image: string | null;
  variantName?: string;
}

interface HeldOrder {
  id: string;
  items: CartItem[];
  customerId: string | null;
  note: string;
  createdAt: string;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  warehouseId: string | null;
  orderTaxId: string | null;
  orderTaxRate: number;
  discount: number;
  discountType: "FIXED" | "PERCENTAGE";
  note: string;
  heldOrders: HeldOrder[];
}

const initialState: CartState = {
  items: [],
  customerId: null,
  warehouseId: null,
  orderTaxId: null,
  orderTaxRate: 0,
  discount: 0,
  discountType: "FIXED",
  note: "",
  heldOrders: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.variantName === action.payload.variantName
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<{ productId: string; variantName?: string }>) {
      state.items = state.items.filter(
        (item) =>
          !(
            item.productId === action.payload.productId &&
            item.variantName === action.payload.variantName
          )
      );
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantName?: string; quantity: number }>
    ) {
      const item = state.items.find(
        (i) =>
          i.productId === action.payload.productId &&
          i.variantName === action.payload.variantName
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    updateItemDiscount(
      state,
      action: PayloadAction<{
        productId: string;
        variantName?: string;
        discount: number;
        discountType: "FIXED" | "PERCENTAGE";
      }>
    ) {
      const item = state.items.find(
        (i) =>
          i.productId === action.payload.productId &&
          i.variantName === action.payload.variantName
      );
      if (item) {
        item.discount = action.payload.discount;
        item.discountType = action.payload.discountType;
      }
    },
    setCustomer(state, action: PayloadAction<string | null>) {
      state.customerId = action.payload;
    },
    setWarehouse(state, action: PayloadAction<string | null>) {
      state.warehouseId = action.payload;
    },
    setOrderTax(
      state,
      action: PayloadAction<{ taxId: string | null; taxRate: number }>
    ) {
      state.orderTaxId = action.payload.taxId;
      state.orderTaxRate = action.payload.taxRate;
    },
    setDiscount(
      state,
      action: PayloadAction<{ discount: number; discountType: "FIXED" | "PERCENTAGE" }>
    ) {
      state.discount = action.payload.discount;
      state.discountType = action.payload.discountType;
    },
    setNote(state, action: PayloadAction<string>) {
      state.note = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.customerId = null;
      state.orderTaxId = null;
      state.orderTaxRate = 0;
      state.discount = 0;
      state.discountType = "FIXED";
      state.note = "";
    },
    holdOrder(state) {
      if (state.items.length === 0) return;
      state.heldOrders.push({
        id: crypto.randomUUID(),
        items: [...state.items],
        customerId: state.customerId,
        note: state.note,
        createdAt: new Date().toISOString(),
      });
      state.items = [];
      state.customerId = null;
      state.note = "";
      state.discount = 0;
    },
    recallOrder(state, action: PayloadAction<string>) {
      const order = state.heldOrders.find((o) => o.id === action.payload);
      if (order) {
        state.items = order.items;
        state.customerId = order.customerId;
        state.note = order.note;
        state.heldOrders = state.heldOrders.filter(
          (o) => o.id !== action.payload
        );
      }
    },
    removeHeldOrder(state, action: PayloadAction<string>) {
      state.heldOrders = state.heldOrders.filter(
        (o) => o.id !== action.payload
      );
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  updateItemDiscount,
  setCustomer,
  setWarehouse,
  setOrderTax,
  setDiscount,
  setNote,
  clearCart,
  holdOrder,
  recallOrder,
  removeHeldOrder,
} = cartSlice.actions;

export default cartSlice.reducer;
