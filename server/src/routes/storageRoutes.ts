import { Router } from "express";
import {
  getAllStorageBins,
  getStorageBinById,
  createStorageBin,
  updateStorageBinById,
  deleteStorageBinById,
  assignProductToBin,
  updateProductQuantityInBin,
  removeProductFromBin,
  getProductLocations,
  createGoodsReceipt,
  getGoodsReceipts,
  getGoodsReceiptById,
  createShipment,
  getShipments,
  getShipmentById
} from "../controllers/storageController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { Role } from "@prisma/client";

const router = Router();

// All storage routes require authentication
router.use(authMiddleware);

// --- StorageBin Routes ---
router.get("/bins", getAllStorageBins);
router.post(
  "/bins",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  createStorageBin
);
router.get("/bins/:binId", getStorageBinById);
router.put(
  "/bins/:binId",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  updateStorageBinById
);
router.delete(
  "/bins/:binId",
  roleMiddleware([Role.ADMIN]), // Only ADMIN can delete bins
  deleteStorageBinById
);

// --- ProductLocation (Product in Bin assignment) Routes ---
router.get("/product-locations", getProductLocations);

router.post(
  "/product-locations",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  assignProductToBin
);
router.put(
  "/product-locations/:productLocationId",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  updateProductQuantityInBin
);
router.delete(
  "/product-locations/:productLocationId",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]), // Or perhaps only ADMIN for removal
  removeProductFromBin
);

// --- Goods Receipt (Check-in) Routes ---
router.post(
  "/receipts", 
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]), 
  createGoodsReceipt
);
router.get(
  "/receipts", 
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]), 
  getGoodsReceipts
);
router.get(
  "/receipts/:receiptId", 
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]), 
  getGoodsReceiptById
);

// --- Shipment (Check-out) Routes ---
router.post(
  "/shipments",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  createShipment
);
router.get(
  "/shipments",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  getShipments
);
router.get(
  "/shipments/:shipmentId",
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  getShipmentById
);

export default router; 