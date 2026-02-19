import { PrismaClient, CategoryStatus, ProductType, ItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Șterge datele existente (opțional - pentru re-rulare curată)
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Categorii cu toate posibilitățile
  const categories = await prisma.category.createMany({
    data: [
      {
        slug: 'pizza-clasica',
        name: 'Pizza Clasică',
        status: CategoryStatus.ACTIVE,
      },
      {
        slug: 'pizza-premium',
        name: 'Pizza Premium',
        status: CategoryStatus.ACTIVE,
      },
      {
        slug: 'pizza-vegetariana',
        name: 'Pizza Vegetariană',
        status: CategoryStatus.ACTIVE,
      },
      {
        slug: 'pizza-picanta',
        name: 'Pizza Picantă',
        status: CategoryStatus.INACTIVE, // Categorie inactivă pentru testare
      },
      {
        slug: 'desert',
        name: 'Desert',
        status: CategoryStatus.ACTIVE,
      },
    ],
  });

  console.log(`✅ Created ${categories.count} categories`);

  // Preluăm categoriile create pentru a le folosi în produse
  const pizzaClasica = await prisma.category.findUnique({
    where: { slug: 'pizza-clasica' },
  });
  const pizzaPremium = await prisma.category.findUnique({
    where: { slug: 'pizza-premium' },
  });
  const pizzaVegetariana = await prisma.category.findUnique({
    where: { slug: 'pizza-vegetariana' },
  });
  const pizzaPicanta = await prisma.category.findUnique({
    where: { slug: 'pizza-picanta' },
  });
  const desert = await prisma.category.findUnique({
    where: { slug: 'desert' },
  });

  if (!pizzaClasica || !pizzaPremium || !pizzaVegetariana || !pizzaPicanta || !desert) {
    throw new Error('Categories not found');
  }

  // Produse cu toate combinațiile posibile
  const products = await prisma.product.createMany({
    data: [
      // Pizza Clasică - SIMPLE, ACTIVE, cu description și imageUrl
      {
        slug: 'margherita',
        name: 'Pizza Margherita',
        description: 'Pizza clasică cu roșii, mozzarella și busuioc proaspăt',
        price: 24.99,
        imageUrl: 'https://example.com/images/margherita.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaClasica.id,
        ingredients: ['roșii', 'mozzarella', 'busuioc'],
        sizes: ['mică', 'medie', 'mare'],
      },
      // Pizza Clasică - SIMPLE, ACTIVE, fără description, cu imageUrl
      {
        slug: 'pepperoni',
        name: 'Pizza Pepperoni',
        description: null,
        price: 27.99,
        imageUrl: 'https://example.com/images/pepperoni.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaClasica.id,
        ingredients: ['roșii', 'mozzarella', 'pepperoni'],
        sizes: ['mică', 'medie', 'mare', 'familie'],
      },
      // Pizza Clasică - SIMPLE, ACTIVE, cu description, fără imageUrl
      {
        slug: 'quattro-stagioni',
        name: 'Pizza Quattro Stagioni',
        description: 'Pizza cu ciuperci, șuncă, măsline și artichoci',
        price: 29.99,
        imageUrl: null,
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaClasica.id,
        ingredients: ['roșii', 'mozzarella', 'ciuperci', 'șuncă', 'măsline', 'artichoci'],
        sizes: ['medie', 'mare'],
      },
      // Pizza Clasică - SIMPLE, INACTIVE (pentru testare)
      {
        slug: 'capricciosa',
        name: 'Pizza Capricciosa',
        description: 'Pizza cu șuncă, ciuperci și măsline',
        price: 28.99,
        imageUrl: 'https://example.com/images/capricciosa.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.INACTIVE,
        categoryId: pizzaClasica.id,
        ingredients: ['roșii', 'mozzarella', 'șuncă', 'ciuperci', 'măsline'],
        sizes: ['mică', 'medie', 'mare'],
      },
      // Pizza Premium - CONFIGURABLE, ACTIVE, cu description și imageUrl
      {
        slug: 'truffle-pizza',
        name: 'Pizza Truffle',
        description: 'Pizza premium cu trufe negre, mozzarella di bufala și parmezan',
        price: 45.99,
        imageUrl: 'https://example.com/images/truffle.jpg',
        type: ProductType.CONFIGURABLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaPremium.id,
        ingredients: ['trufe negre', 'mozzarella di bufala', 'parmezan', 'ulei de măsline'],
        sizes: ['medie', 'mare', 'familie'],
      },
      // Pizza Premium - CONFIGURABLE, ACTIVE, fără description, cu imageUrl
      {
        slug: 'seafood-deluxe',
        name: 'Pizza Seafood Deluxe',
        description: null,
        price: 42.99,
        imageUrl: 'https://example.com/images/seafood.jpg',
        type: ProductType.CONFIGURABLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaPremium.id,
        ingredients: ['creveți', 'calamari', 'midii', 'mozzarella', 'sos alb'],
        sizes: ['mare', 'familie'],
      },
      // Pizza Premium - CONFIGURABLE, INACTIVE
      {
        slug: 'wagyu-beef',
        name: 'Pizza Wagyu Beef',
        description: 'Pizza premium cu carne wagyu, cheddar și sos special',
        price: 55.99,
        imageUrl: 'https://example.com/images/wagyu.jpg',
        type: ProductType.CONFIGURABLE,
        status: ItemStatus.INACTIVE,
        categoryId: pizzaPremium.id,
        ingredients: ['carne wagyu', 'cheddar', 'sos special', 'ceapă caramelizată'],
        sizes: ['mare', 'familie'],
      },
      // Pizza Vegetariană - SIMPLE, ACTIVE, cu description și imageUrl
      {
        slug: 'vegetariana-completa',
        name: 'Pizza Vegetariană Completă',
        description: 'Pizza cu legume proaspete: roșii, ardei, ciuperci, măsline și ceapă',
        price: 26.99,
        imageUrl: 'https://example.com/images/vegetariana.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaVegetariana.id,
        ingredients: ['roșii', 'mozzarella', 'ardei', 'ciuperci', 'măsline', 'ceapă'],
        sizes: ['mică', 'medie', 'mare'],
      },
      // Pizza Vegetariană - SIMPLE, ACTIVE, fără description, fără imageUrl
      {
        slug: 'spinaci-e-ricotta',
        name: 'Pizza Spinaci e Ricotta',
        description: null,
        price: 25.99,
        imageUrl: null,
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaVegetariana.id,
        ingredients: ['spinaci', 'ricotta', 'mozzarella', 'usturoi'],
        sizes: ['mică', 'medie'],
      },
      // Pizza Picantă - SIMPLE, ACTIVE (categoria este INACTIVE, dar produsul poate fi ACTIVE)
      {
        slug: 'diavola',
        name: 'Pizza Diavola',
        description: 'Pizza picantă cu salam picant, roșii și mozzarella',
        price: 27.99,
        imageUrl: 'https://example.com/images/diavola.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: pizzaPicanta.id,
        ingredients: ['roșii', 'mozzarella', 'salam picant', 'ardei iute'],
        sizes: ['mică', 'medie', 'mare'],
      },
      // Pizza Picantă - CONFIGURABLE, INACTIVE
      {
        slug: 'inferno',
        name: 'Pizza Inferno',
        description: 'Pizza extrem de picantă cu jalapeño, habanero și sos picant',
        price: 29.99,
        imageUrl: 'https://example.com/images/inferno.jpg',
        type: ProductType.CONFIGURABLE,
        status: ItemStatus.INACTIVE,
        categoryId: pizzaPicanta.id,
        ingredients: ['roșii', 'mozzarella', 'jalapeño', 'habanero', 'sos picant', 'ceapă'],
        sizes: ['mare', 'familie'],
      },
      // Desert - SIMPLE, ACTIVE, cu description și imageUrl
      {
        slug: 'tiramisu',
        name: 'Tiramisu',
        description: 'Desert clasic italian cu cafea, mascarpone și cacao',
        price: 18.99,
        imageUrl: 'https://example.com/images/tiramisu.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: desert.id,
        ingredients: ['cafea', 'mascarpone', 'cacao', 'biscuiți', 'zahăr'],
        sizes: ['portie individuală', 'portie dublă'],
      },
      // Desert - SIMPLE, ACTIVE, fără description, cu imageUrl
      {
        slug: 'panna-cotta',
        name: 'Panna Cotta',
        description: null,
        price: 16.99,
        imageUrl: 'https://example.com/images/panna-cotta.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: desert.id,
        ingredients: ['smântână', 'zahăr', 'vanilie', 'fructe de pădure'],
        sizes: ['portie individuală'],
      },
      // Desert - CONFIGURABLE, ACTIVE, cu description, fără imageUrl
      {
        slug: 'gelato-misto',
        name: 'Gelato Misto',
        description: 'Mix de înghețată artizanală cu 3 arome la alegere',
        price: 14.99,
        imageUrl: null,
        type: ProductType.CONFIGURABLE,
        status: ItemStatus.ACTIVE,
        categoryId: desert.id,
        ingredients: ['înghețată artizanală', 'ciocolată', 'vanilie', 'fructe', 'nuci'],
        sizes: ['1 cupă', '2 cupe', '3 cupe'],
      },
      // Desert - SIMPLE, INACTIVE
      {
        slug: 'cannoli',
        name: 'Cannoli Siciliani',
        description: 'Desert tradițional sicilian cu ricotta și ciocolată',
        price: 17.99,
        imageUrl: 'https://example.com/images/cannoli.jpg',
        type: ProductType.SIMPLE,
        status: ItemStatus.INACTIVE,
        categoryId: desert.id,
        ingredients: ['ricotta', 'ciocolată', 'zahăr pudră', 'coajă crocantă'],
        sizes: ['2 bucăți', '4 bucăți'],
      },
    ],
  });

  console.log(`✅ Created ${products.count} products`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
