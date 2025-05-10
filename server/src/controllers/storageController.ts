import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to update total stock for a product
const updateProductTotalStock = async (productId: string, txClient?: Prisma.TransactionClient) => {
  const prismaClient = txClient || prisma;
  try {
    const productLocations = await prismaClient.productLocation.findMany({
      where: { productId },
      select: { quantity: true },
    });

    const totalStock = productLocations.reduce((sum: number, loc: { quantity: number }) => sum + loc.quantity, 0);

    await prismaClient.products.update({
      where: { productId },
      data: { stockQuantity: totalStock },
    });
    console.log(`Updated total stock for product ${productId} to ${totalStock}`);
  } catch (error) {
    console.error(`Failed to update total stock for product ${productId}:`, error);
    // Depending on requirements, you might want to throw this error
    // or handle it in a way that doesn't break the primary operation.
  }
};

// Get all storage bins
export const getAllStorageBins = async (req: Request, res: Response) => {
  try {
    const storageBins = await prisma.storageBin.findMany({
      include: { productLocations: { include: { product: true } } },
    });
    res.json(storageBins);
  } catch (error) {
    console.error("Error fetching storage bins:", error);
    res.status(500).json({ message: "Error fetching storage bins" });
  }
};

// Get a single storage bin by ID
export const getStorageBinById = async (req: Request, res: Response) => {
  const { binId } = req.params;
  try {
    const storageBin = await prisma.storageBin.findUnique({
      where: { binId },
      include: { productLocations: { include: { product: true } } },
    });
    if (!storageBin) {
      return res.status(404).json({ message: "Storage bin not found" });
    }
    res.json(storageBin);
  } catch (error) {
    console.error(`Error fetching storage bin ${binId}:`, error);
    res.status(500).json({ message: "Error fetching storage bin" });
  }
};

// Create a new storage bin
export const createStorageBin = async (req: Request, res: Response) => {
  const { name, locationDescription, dimensions, maxCapacityWeight, maxCapacityUnits } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Storage bin name is required" });
    }
    const newStorageBin = await prisma.storageBin.create({
      data: {
        name,
        locationDescription,
        dimensions,
        maxCapacityWeight: maxCapacityWeight ? parseFloat(maxCapacityWeight) : null,
        maxCapacityUnits: maxCapacityUnits ? parseInt(maxCapacityUnits, 10) : null,
      },
    });
    res.status(201).json(newStorageBin);
  } catch (error: any) {
    console.error("Error creating storage bin:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ message: `Storage bin name '${name}' already exists.` });
    }
    res.status(500).json({ message: "Error creating storage bin" });
  }
};

// Update an existing storage bin
export const updateStorageBinById = async (req: Request, res: Response) => {
  const { binId } = req.params;
  const { name, locationDescription, dimensions, maxCapacityWeight, maxCapacityUnits } = req.body;
  try {
    const updatedStorageBin = await prisma.storageBin.update({
      where: { binId },
      data: {
        name,
        locationDescription,
        dimensions,
        maxCapacityWeight: maxCapacityWeight ? parseFloat(maxCapacityWeight) : undefined,
        maxCapacityUnits: maxCapacityUnits ? parseInt(maxCapacityUnits, 10) : undefined,
        updatedAt: new Date(),
      },
    });
    res.json(updatedStorageBin);
  } catch (error: any) {
    console.error(`Error updating storage bin ${binId}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Storage bin not found" });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ message: `Storage bin name '${name}' already exists.` });
    }
    res.status(500).json({ message: "Error updating storage bin" });
  }
};

// Delete a storage bin
export const deleteStorageBinById = async (req: Request, res: Response) => {
  const { binId } = req.params;
  try {
    const productLocations = await prisma.productLocation.count({ where: { binId }});
    if (productLocations > 0) {
      return res.status(400).json({ message: "Cannot delete bin: it still contains products. Please empty the bin first." });
    }
    await prisma.storageBin.delete({
      where: { binId },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error(`Error deleting storage bin ${binId}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Storage bin not found" });
    }
    res.status(500).json({ message: "Error deleting storage bin" });
  }
};

// --- ProductLocation Management --- 

// Get product locations (can be filtered by productId or binId)
export const getProductLocations = async (req: Request, res: Response) => {
  const { productId, binId } = req.query;
  try {
    const whereClause: Prisma.ProductLocationWhereInput = {};
    if (productId) whereClause.productId = productId as string;
    if (binId) whereClause.binId = binId as string;

    const locations = await prisma.productLocation.findMany({
      where: whereClause,
      include: {
        product: true,
        storageBin: true,
      },
      orderBy: {
        product: { name: 'asc' } // Example ordering
      }
    });
    res.json(locations);
  } catch (error) {
    console.error("Error fetching product locations:", error);
    res.status(500).json({ message: "Error fetching product locations" });
  }
};

export const assignProductToBin = async (req: Request, res: Response) => {
  const { productId, binId, quantity } = req.body;
  try {
    if (!productId || !binId || quantity === undefined) {
      return res.status(400).json({ message: "Product ID, Bin ID, and quantity are required." });
    }
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive number." });
    }

    const product = await prisma.products.findUnique({ where: { productId } });
    if (!product) return res.status(404).json({ message: "Product not found." });
    
    const storageBin = await prisma.storageBin.findUnique({ where: { binId } });
    if (!storageBin) return res.status(404).json({ message: "Storage bin not found." });

    const existingAssignment = await prisma.productLocation.findUnique({
      where: { productId_binId: { productId, binId } },
    });

    let result;
    if (existingAssignment) {
      result = await prisma.productLocation.update({
        where: { productLocationId: existingAssignment.productLocationId },
        data: { quantity: numQuantity },
        include: { product: true, storageBin: true },
      });
    } else {
      result = await prisma.productLocation.create({
        data: { productId, binId, quantity: numQuantity },
        include: { product: true, storageBin: true },
      });
    }
    
    await updateProductTotalStock(productId); // Update total stock

    res.status(200).json(result);
  } catch (error) {
    console.error("Error assigning product to bin:", error);
    res.status(500).json({ message: "Error assigning product to bin" });
  }
};

export const updateProductQuantityInBin = async (req: Request, res: Response) => {
    const { productLocationId } = req.params;
    const { quantity } = req.body;
    try {
        const numQuantity = parseInt(quantity, 10);
        if (quantity === undefined || isNaN(numQuantity) || numQuantity <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number." });
        }

        // Find the product ID before updating, to update its total stock later
        const productLocation = await prisma.productLocation.findUnique({
            where: { productLocationId },
            select: { productId: true }
        });

        if (!productLocation) {
            return res.status(404).json({ message: "Product location assignment not found." });
        }

        const updatedLocation = await prisma.productLocation.update({
            where: { productLocationId },
            data: { quantity: numQuantity },
            include: { product: true, storageBin: true },
        });
        
        await updateProductTotalStock(productLocation.productId); // Update total stock

        res.json(updatedLocation);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Product location assignment not found." });
        }
        console.error(`Error updating product quantity in bin (ID: ${productLocationId}):`, error);
        res.status(500).json({ message: "Error updating product quantity" });
    }
};

export const removeProductFromBin = async (req: Request, res: Response) => {
    const { productLocationId } = req.params;
    try {
        // Find the product ID before deleting, to update its total stock later
        const productLocation = await prisma.productLocation.findUnique({
            where: { productLocationId },
            select: { productId: true }
        });

        if (!productLocation) {
            return res.status(404).json({ message: "Product location assignment not found." });
        }
        const productIdToUpdate = productLocation.productId; // Store before delete

        await prisma.productLocation.delete({
            where: { productLocationId },
        });

        await updateProductTotalStock(productIdToUpdate); // Update total stock

        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Product location assignment not found." });
        }
        console.error(`Error removing product from bin (ID: ${productLocationId}):`, error);
        res.status(500).json({ message: "Error removing product from bin" });
    }
};

// --- Goods Receipt (Check-in) Workflow --- 

export const createGoodsReceipt = async (req: Request, res: Response) => {
  const { supplier, receivedAt, notes, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Goods receipt must contain at least one item." });
  }

  try {
    const createdReceipt = await prisma.$transaction(async (tx) => {
      const newReceipt = await tx.goodsReceipt.create({
        data: {
          supplier,
          receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
          notes,
        },
      });

      const itemCreations = items.map(async (item: any) => {
        if (!item.productId || !item.binId || !item.quantityReceived || item.quantityReceived <= 0) {
          throw new Error("Each item must have productId, binId, and a positive quantityReceived.");
        }

        // Create the GoodsReceiptItem
        const receiptItem = await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: newReceipt.receiptId,
            productId: item.productId,
            binId: item.binId,
            quantityReceived: parseInt(item.quantityReceived, 10),
          },
        });

        // Update ProductLocation
        const existingLocation = await tx.productLocation.findUnique({
          where: { productId_binId: { productId: item.productId, binId: item.binId } },
        });

        if (existingLocation) {
          await tx.productLocation.update({
            where: { productLocationId: existingLocation.productLocationId },
            data: { quantity: existingLocation.quantity + parseInt(item.quantityReceived, 10) },
          });
        } else {
          await tx.productLocation.create({
            data: {
              productId: item.productId,
              binId: item.binId,
              quantity: parseInt(item.quantityReceived, 10),
            },
          });
        }
        // Update total stock for the product
        await updateProductTotalStock(item.productId, tx as Prisma.TransactionClient);
        return receiptItem;
      });

      const createdItems = await Promise.all(itemCreations);

      return { ...newReceipt, items: createdItems };
    });

    res.status(201).json(createdReceipt);
  } catch (error: any) {
    console.error("Error creating goods receipt:", error);
    if (error.message.includes("must have productId, binId")) {
        return res.status(400).json({ message: error.message });
    }
    // Handle other potential errors, like product or bin not found if not using Restrict action properly
    // or if a product/bin ID is invalid.
    res.status(500).json({ message: "Error creating goods receipt", details: error.message });
  }
};

export const getGoodsReceipts = async (req: Request, res: Response) => {
  try {
    const receipts = await prisma.goodsReceipt.findMany({
      include: {
        items: {
          include: {
            product: true,
            storageBin: true,
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });
    res.json(receipts);
  } catch (error: any) {
    console.error("Error fetching goods receipts:", error);
    res.status(500).json({ message: "Error fetching goods receipts", details: error.message });
  }
};

export const getGoodsReceiptById = async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  try {
    const receipt = await prisma.goodsReceipt.findUnique({
      where: { receiptId },
      include: {
        items: {
          include: {
            product: true,
            storageBin: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: "Goods receipt not found" });
    }
    res.json(receipt);
  } catch (error: any) {
    console.error(`Error fetching goods receipt ${receiptId}:`, error);
    res.status(500).json({ message: "Error fetching goods receipt", details: error.message });
  }
};

// --- Shipment (Check-out) Workflow ---

export const createShipment = async (req: Request, res: Response) => {
  const { customer, notes, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Shipment must contain at least one item." });
  }

  try {
    const createdShipment = await prisma.$transaction(async (tx) => {
      // 1. Create the main Shipment record
      const newShipment = await tx.shipment.create({
        data: {
          customer,
          notes,
          shippedAt: new Date(), // Set shippedAt to current time
        },
      });

      const shipmentItemsData = [];

      for (const item of items) {
        if (!item.productId || !item.binId || !item.quantityShipped || item.quantityShipped <= 0) {
          throw new Error("Invalid item data: Product ID, Bin ID, and a positive Quantity Shipped are required for all items.");
        }

        // 2. Find the ProductLocation for the item
        const productLocation = await tx.productLocation.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.binId,
            },
          },
        });

        if (!productLocation) {
          throw new Error(`Product ${item.productId} not found in bin ${item.binId}.`);
        }

        if (productLocation.quantity < item.quantityShipped) {
          throw new Error(
            `Insufficient stock for product ${item.productId} in bin ${item.binId}. Available: ${productLocation.quantity}, Requested: ${item.quantityShipped}`
          );
        }

        // 3. Create ShipmentItem
        const shipmentItem = await tx.shipmentItem.create({
          data: {
            shipmentId: newShipment.shipmentId,
            productId: item.productId,
            binId: item.binId,
            quantityShipped: item.quantityShipped,
          },
        });
        shipmentItemsData.push(shipmentItem);

        // 4. Decrease stock in ProductLocation
        await tx.productLocation.update({
          where: {
            productLocationId: productLocation.productLocationId,
          },
          data: {
            quantity: {
              decrement: item.quantityShipped,
            },
          },
        });

        // 5. Update total product stock (pass transaction client to helper)
        await updateProductTotalStock(item.productId, tx); 
      }

      // Return the shipment with its items (items might not be fully populated here, depending on Prisma version/config)
      // For a more complete response, you might need to query the shipment again outside the transaction or expand relations.
      // However, for creation, returning the core newShipment and the processed items should suffice.
      return { ...newShipment, items: shipmentItemsData }; 
    });

    // Optionally, refetch the created shipment with all relations populated if needed by the client for immediate display
    const fullShipment = await prisma.shipment.findUnique({
        where: { shipmentId: createdShipment.shipmentId },
        include: {
            items: {
                include: {
                    product: true,
                    storageBin: true,
                }
            }
        }
    });

    res.status(201).json(fullShipment);
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    // Check for specific Prisma errors if needed, e.g., P2002 for unique constraint
    if (error.message.includes("Insufficient stock") || error.message.includes("not found")) {
        return res.status(400).json({ message: "Error creating shipment.", details: error.message });
    }
    res.status(500).json({ message: "Error creating shipment", details: error.message });
  }
};

export const getShipments = async (req: Request, res: Response) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        items: {
          include: {
            product: true,
            storageBin: true,
          },
        },
      },
      orderBy: {
        shippedAt: 'desc',
      },
    });
    res.json(shipments);
  } catch (error: any) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ message: "Error fetching shipments", details: error.message });
  }
};

export const getShipmentById = async (req: Request, res: Response) => {
  const { shipmentId } = req.params;
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { shipmentId },
      include: {
        items: {
          include: {
            product: true,
            storageBin: true,
          },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }
    res.json(shipment);
  } catch (error: any) {
    console.error("Error fetching shipment by ID:", error);
    res.status(500).json({ message: "Error fetching shipment by ID", details: error.message });
  }
}; 