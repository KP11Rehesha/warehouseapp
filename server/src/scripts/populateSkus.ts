import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function populateSkus() {
  console.log('Starting SKU population script...');

  try {
    const productsWithoutSku = await prisma.products.findMany({
      where: {
        sku: null,
      },
    });

    if (productsWithoutSku.length === 0) {
      console.log('All products already have SKUs. No action needed.');
      return;
    }

    console.log(`Found ${productsWithoutSku.length} products without SKUs. Populating...`);

    let updatedCount = 0;
    for (const product of productsWithoutSku) {
      const newSku = uuidv4(); // Generate a unique UUID as the SKU
      try {
        await prisma.products.update({
          where: { productId: product.productId },
          data: { sku: newSku },
        });
        console.log(`Updated product ${product.name} (ID: ${product.productId}) with SKU: ${newSku}`);
        updatedCount++;
      } catch (updateError) {
        console.error(`Failed to update product ID ${product.productId}:`, updateError);
        // Decide if you want to stop or continue on error
      }
    }

    console.log(`Successfully updated ${updatedCount} products with unique SKUs.`);

  } catch (error) {
    console.error('Error fetching or updating products:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Script finished. Disconnected from database.');
  }
}

populateSkus(); 