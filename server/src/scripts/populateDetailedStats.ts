import { PrismaClient, Role, Prisma, Users, Category, StorageBin, Products as PrismaProducts, ProductLocation, GoodsReceipt, GoodsReceiptItem, Shipment, ShipmentItem } from '@prisma/client';
import bcrypt from 'bcryptjs'; // For hashing passwords

const prisma = new PrismaClient();

const SCRIPT_USER_EMAIL_PREFIX = 'scriptuser_';
const SCRIPT_CATEGORY_PREFIX = 'Sample Category ';
const SCRIPT_PRODUCT_PREFIX = 'Product ';
const SCRIPT_BIN_PREFIX = 'Bin ';

// --- Helper Functions ---
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// --- Data Creation Functions ---

async function createSampleUsers(count: number = 3): Promise<Users[]> {
  console.log('\nCreating sample users...');
  const users: Users[] = [];
  const roles = [Role.ADMIN, Role.WAREHOUSE_STAFF]; // Adjust as per your Role enum

  for (let i = 0; i < count; i++) {
    const email = `${SCRIPT_USER_EMAIL_PREFIX}${i + 1}@example.com`;
    const name = `Script User ${i + 1}`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    const role = roles[i % roles.length];

    try {
      const user = await prisma.users.upsert({
        where: { email },
        update: { name, password: hashedPassword, role },
        create: {
          email,
          name,
          password: hashedPassword,
          role,
        },
      });
      users.push(user);
      console.log(`Created/Updated user: ${user.email} (Role: ${user.role}, ID: ${user.userId})`);
    } catch (e: any) {
      console.error(`Error creating/updating user ${email}:`, e.message);
    }
  }
  return users;
}

async function createSampleCategories(count: number = 7): Promise<Category[]> {
  console.log('\nCreating sample categories...');
  const categories: Category[] = [];
  const categoryNames = [
    'Electronics', 'Books', 'Clothing', 'Home Goods', 'Sports & Outdoors', 
    'Toys & Games', 'Automotive', 'Health & Beauty', 'Groceries', 'Office Supplies'
  ];

  for (let i = 0; i < count; i++) {
    const name = categoryNames[i % categoryNames.length] + (i >= categoryNames.length ? ` ${Math.floor(i / categoryNames.length) + 1}` : '');
    try {
      const category = await prisma.category.create({
        data: { name },
      });
      categories.push(category);
      console.log(`Created category: ${category.name} (ID: ${category.categoryId})`);
    } catch (e: any) {
       if (e.code === 'P2002' && e.meta?.target?.includes('name')) {
         console.warn(`Category with name '${name}' already exists. Skipping creation.`);
         // If it already exists, try to fetch it to include in the returned array for other functions
         const existingCategory = await prisma.category.findFirst({ where: { name } });
         if (existingCategory) categories.push(existingCategory);
       } else {
        console.error(`Error creating category ${name}:`, e.message);
       }
    }
  }
  return categories;
}

async function createSampleStorageBins(count: number = 4): Promise<StorageBin[]> {
  console.log('\nCreating sample storage bins...');
  const storageBins: StorageBin[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${SCRIPT_BIN_PREFIX}${String.fromCharCode(65 + i)}${getRandomInt(1, 9)}`; // e.g., Bin A1, Bin B2
    const locationDescription = `Shelf ${String.fromCharCode(65 + i)}, Row ${i + 1}`;
    const dimensions = `${getRandomInt(50,200)}x${getRandomInt(50,150)}x${getRandomInt(30,100)}cm`; // L W H string
    const maxCapacityWeight = getRandomFloat(50, 500); // in kg
    const maxCapacityUnits = getRandomInt(100, 1000);

    try {
      // StorageBin names should be unique
      let bin = await prisma.storageBin.findUnique({ where: { name } });
      if (!bin) {
        bin = await prisma.storageBin.create({
          data: {
            name,
            locationDescription, // As per controller
            dimensions,          // As per controller
            maxCapacityWeight,   // As per controller
            maxCapacityUnits,    // As per controller
          },
        });
        console.log(`Created storage bin: ${bin.name} (ID: ${bin.binId})`);
      } else {
        console.log(`Found existing storage bin: ${bin.name} (ID: ${bin.binId})`);
      }
      storageBins.push(bin);
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('name')) {
        console.warn(`Storage bin with name '${name}' likely created by concurrent process. Attempting to re-fetch.`);
        const existingBin = await prisma.storageBin.findUnique({ where: { name } });
        if (existingBin) storageBins.push(existingBin);
      } else {
        console.error(`Error processing storage bin ${name}:`, e.message);
      }
    }
  }
  return storageBins;
}

async function createSampleProducts(categories: Category[], count: number = 20): Promise<PrismaProducts[]> {
  console.log('\nCreating sample products...');
  const products: PrismaProducts[] = [];
  if (categories.length === 0) {
    console.warn('No categories available to assign to products. Skipping product creation.');
    return products;
  }

  for (let i = 0; i < count; i++) {
    const productNameBase = `Sample ${SCRIPT_PRODUCT_PREFIX}${i + 1}`;
    const name = `${productNameBase} - ${getRandomString(3)}`;
    const sku = `SKU-${getRandomString(4)}-${getRandomInt(1000, 9999)}`;
    const description = `Detailed description for ${name}. Color: ${['Red','Blue','Green','Black','White'][i%5]}. Material: ${['Cotton','Plastic','Metal','Wood','Ceramic'][i%5]}.`;
    const price = getRandomFloat(5, 300);
    // categoryId comes from the previously created categories (client expects categoryId)
    const category = categories[i % categories.length];
    const categoryId = category.categoryId; 

    const imageUrl = `https://picsum.photos/seed/${sku}/200/300`; // Placeholder image
    const productDimensions = `${getRandomInt(10,50)}x${getRandomInt(5,30)}x${getRandomInt(1,20)}cm`; // L W H string for product
    const weight = getRandomFloat(0.1, 25); // in kg
    const rating = getRandomFloat(3, 5, 1);
    const minimumStockLevel = getRandomInt(5, 20);
    // stockQuantity will be updated by goods receipts

    try {
      // Product SKUs must be unique
      let product = await prisma.products.findUnique({ where: { sku } });
      if (!product) {
        product = await prisma.products.create({
          data: {
            name,
            sku,
            description,
            price,
            categoryId, // Connect to Category using categoryId
            imageUrl, // As per controller
            dimensions: productDimensions, // As per controller
            weight,
            rating,
            minimumStockLevel,
            stockQuantity: 0, // Initial stock, will be updated by goods receipts
          },
        });
        console.log(`Created product: ${product.name} (SKU: ${product.sku}, ID: ${product.productId})`);
      } else {
        // Optionally update existing product if needed, for now just log
        console.log(`Found existing product (SKU: ${sku}): ${product.name} (ID: ${product.productId})`);
      }
      products.push(product);
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('sku')) {
        console.warn(`Product with SKU '${sku}' likely created by concurrent process. Attempting to re-fetch.`);
        const existingProduct = await prisma.products.findUnique({ where: { sku }});
        if (existingProduct) products.push(existingProduct);
      } else if (e.code === 'P2003') { // Foreign key constraint (e.g. categoryId invalid)
         console.error(`Error creating product ${name} due to invalid categoryId '${categoryId}':`, e.message);
      }else {
        console.error(`Error processing product ${name} (SKU: ${sku}):`, e.message);
      }
    }
  }
  return products;
}

// Helper to update total stock for a product (mimics controller helper)
async function updateProductTotalStock(tx: Prisma.TransactionClient, productId: string) {
    const productLocations = await tx.productLocation.findMany({
      where: { productId }, select: { quantity: true },
    });
    const totalStock = productLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    await tx.products.update({
      where: { productId }, data: { stockQuantity: totalStock },
    });
    console.log(`Updated total stock for product ${productId} to ${totalStock} (within script transaction)`);
}

async function simulateGoodsReceipts(products: PrismaProducts[], storageBins: StorageBin[], users: Users[], count: number = 10) {
  console.log('\nSimulating Goods Receipts...');
  if (products.length === 0 || storageBins.length === 0) {
    console.warn('No products or storage bins available. Skipping goods receipts.'); return;
  }
  const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'General Goods Ltd.'];

  for (let i = 0; i < count; i++) {
    const supplier = suppliers[i % suppliers.length];
    const notes = `Receipt #${i + 1} - Order PO${getRandomInt(1000,2000)}`;
    const receivedAt = getRandomDate(new Date(2023, 0, 1), new Date());
    const responsibleUser = users.length > 0 ? users[i % users.length] : null;
    const numItemsInReceipt = getRandomInt(1, 3);

    try {
      await prisma.$transaction(async (tx) => {
        // Temporarily remove userId assignment due to persistent CreateInput type issues
        const goodsReceiptData: Prisma.GoodsReceiptCreateInput = { supplier, notes, receivedAt /* userId: responsibleUser?.userId */ };
        // if (responsibleUser) {
        //   goodsReceiptData.userId = responsibleUser.userId; 
        // }
        const newReceipt = await tx.goodsReceipt.create({ data: goodsReceiptData });
        console.log(`Created Goods Receipt ID: ${newReceipt.receiptId} (User link temporarily omitted)`);

        for (let j = 0; j < numItemsInReceipt; j++) {
          const productToReceive = products[getRandomInt(0, products.length - 1)];
          const binToReceiveIn = storageBins[getRandomInt(0, storageBins.length - 1)];
          const quantityReceived = getRandomInt(5, 50);

          const goodsReceiptItemData: Prisma.GoodsReceiptItemCreateInput = {
            goodsReceipt: { connect: { receiptId: newReceipt.receiptId } },
            product: { connect: { productId: productToReceive.productId } },
            quantityReceived,
            storageBin: { connect: { binId: binToReceiveIn.binId } }, // storageBin connection is mandatory
          };
          await tx.goodsReceiptItem.create({ data: goodsReceiptItemData });
          console.log(`  - Item: ${productToReceive.name} (Qty: ${quantityReceived}) into Bin: ${binToReceiveIn.name}`);

          const existingLocation = await tx.productLocation.findUnique({
            where: { productId_binId: { productId: productToReceive.productId, binId: binToReceiveIn.binId } },
          });
          if (existingLocation) {
            await tx.productLocation.update({
              where: { productLocationId: existingLocation.productLocationId }, 
              data: { quantity: existingLocation.quantity + quantityReceived },
            });
          } else {
            await tx.productLocation.create({
              data: { productId: productToReceive.productId, binId: binToReceiveIn.binId, quantity: quantityReceived },
            });
          }
          await updateProductTotalStock(tx, productToReceive.productId);
        }
      });
    } catch (e: any) {
      console.error(`Error creating goods receipt #${i+1}:`, e.message, e.code ? `(Code: ${e.code})` : '');
      if (e.code === 'P2003' || e.code === 'P2025') console.error('  This might be due to an invalid UserID, ProductID, or BinID for connection.');
    }
  }
}

async function simulateShipments(products: PrismaProducts[], storageBins: StorageBin[], users: Users[], count: number = 15) {
  console.log('\nSimulating Shipments...');
  if (products.length === 0 || storageBins.length === 0) {
    console.warn('No products or storage bins available. Skipping shipments.'); return;
  }
  const customers = ['Customer X', 'Customer Y', 'Retail Giant Inc.', 'Local Shop'];

  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const notes = `Shipment #${i + 1} - Order SO${getRandomInt(3000,4000)}`;
    const shippedAt = getRandomDate(new Date(2023, 1, 1), new Date()); // Ensure shipped after potential receipts
    const responsibleUser = users.length > 0 ? users[i % users.length] : null;
    const numItemsInShipment = getRandomInt(1, 2);

    try {
      await prisma.$transaction(async (tx) => {
        // Temporarily remove userId assignment due to persistent CreateInput type issues
        const shipmentData: Prisma.ShipmentCreateInput = { customer, notes, shippedAt /* userId: responsibleUser?.userId */ };
        // if (responsibleUser) {
        //    shipmentData.userId = responsibleUser.userId;
        // }
        const newShipment = await tx.shipment.create({ data: shipmentData });
        console.log(`Created Shipment ID: ${newShipment.shipmentId} (User link temporarily omitted)`);

        for (let j = 0; j < numItemsInShipment; j++) {
          // Find a product location that actually has stock
          const availableLocations = await tx.productLocation.findMany({
            where: { quantity: { gt: 0 } }, include: { product: true, storageBin: true },
          });
          if (availableLocations.length === 0) {
            console.warn('  No stock available anywhere to ship. Ending shipment item creation.'); break;
          }
          const locationToShipFrom = availableLocations[getRandomInt(0, availableLocations.length - 1)];
          const productToShip = locationToShipFrom.product;
          const binToShipFrom = locationToShipFrom.storageBin;
          const quantityToShip = Math.min(locationToShipFrom.quantity, getRandomInt(1, 5)); // Ship available or up to 5

          if (quantityToShip <= 0) {
            console.warn(`  Skipping item ${productToShip.name} from ${binToShipFrom.name} as quantity to ship is zero or less.`);
            continue;
          }

          const shipmentItemData: Prisma.ShipmentItemCreateInput = {
            shipment: { connect: { shipmentId: newShipment.shipmentId } },
            product: { connect: { productId: productToShip.productId } },
            storageBin: { connect: { binId: binToShipFrom.binId } }, // From which bin it was picked
            quantityShipped: quantityToShip,
          };
          await tx.shipmentItem.create({ data: shipmentItemData });
          console.log(`  - Item: ${productToShip.name} (Qty: ${quantityToShip}) from Bin: ${binToShipFrom.name}`);

          await tx.productLocation.update({
            where: { productLocationId: locationToShipFrom.productLocationId }, 
            data: { quantity: { decrement: quantityToShip } },
          });
          await updateProductTotalStock(tx, productToShip.productId);
        }
      });
    } catch (e: any) {
      console.error(`Error creating shipment #${i+1}:`, e.message, e.code ? `(Code: ${e.code})` : '');
       if (e.code === 'P2003' || e.code === 'P2025') console.error('  This might be due to an invalid UserID, ProductID, or BinID for connection, or insufficient stock leading to transaction rollback.');
    }
  }
}

// --- Main Population Logic ---
async function main() {
  console.log('Starting database population script...');

  const users: Users[] = await createSampleUsers();
  if (users.length === 0) {
    console.error("No users created or found. Aborting script.");
    return;
  }
  const categories: Category[] = await createSampleCategories();
   if (categories.length === 0) {
    console.error("No categories created or found. Aborting script.");
    return;
  }

  const storageBins: StorageBin[] = await createSampleStorageBins();
  if (storageBins.length === 0) {
    console.error("No storage bins created or found. Aborting script as bins are needed for inventory.");
    return;
  }

  const products: PrismaProducts[] = await createSampleProducts(categories);
  if (products.length === 0) {
    console.warn("No products were created or found. Subsequent inventory operations might be limited.");
    // Not aborting, as some operations might still be possible or user might want to debug this part.
  }

  // Simulate transactions only if there are products and bins
  if (products.length > 0 && storageBins.length > 0) {
    await simulateGoodsReceipts(products, storageBins, users, 15);
    await simulateShipments(products, storageBins, users, 25); // Pass products to pick from
  } else {
    console.warn("Skipping Goods Receipts and Shipments due to lack of products or bins.");
  }

  console.log('\nUsers, Categories, Storage Bins, Products, Goods Receipts, and Shipments processed.');
  console.log('Next step: Implement Expenses.');

  console.log('\nDatabase population script finished for now (up to Products).');
}

main()
  .catch((e) => {
    console.error('An error occurred during script execution:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  }); 