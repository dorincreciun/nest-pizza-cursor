import { PrismaClient, CategoryStatus, ProductType, ItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();

  // Ingrediente (entități cu id, slug, name, imageUrl) – un ingredient poate fi pe mai multe produse
  const ingredientData = [
    { slug: 'rosii', name: 'Roșii', imageUrl: null },
    { slug: 'mozzarella', name: 'Mozzarella', imageUrl: null },
    { slug: 'busuioc', name: 'Busuioc', imageUrl: null },
    { slug: 'pepperoni', name: 'Pepperoni', imageUrl: null },
    { slug: 'ciuperci', name: 'Ciuperci', imageUrl: null },
    { slug: 'sunca', name: 'Șuncă', imageUrl: null },
    { slug: 'masline', name: 'Măsline', imageUrl: null },
    { slug: 'artichoci', name: 'Artichoci', imageUrl: null },
    { slug: 'trufe-negre', name: 'Trufe negre', imageUrl: null },
    { slug: 'parmezan', name: 'Parmezan', imageUrl: null },
    { slug: 'ulei-masline', name: 'Ulei de măsline', imageUrl: null },
    { slug: 'creveti', name: 'Creveți', imageUrl: null },
    { slug: 'calamari', name: 'Calamari', imageUrl: null },
    { slug: 'midii', name: 'Midii', imageUrl: null },
    { slug: 'sos-alb', name: 'Sos alb', imageUrl: null },
    { slug: 'ceapa', name: 'Ceapă', imageUrl: null },
    { slug: 'ardei', name: 'Ardei', imageUrl: null },
    { slug: 'spinaci', name: 'Spinaci', imageUrl: null },
    { slug: 'ricotta', name: 'Ricotta', imageUrl: null },
    { slug: 'usturoi', name: 'Usturoi', imageUrl: null },
    { slug: 'salam-picant', name: 'Salam picant', imageUrl: null },
    { slug: 'ardei-iute', name: 'Ardei iute', imageUrl: null },
    { slug: 'jalapeno', name: 'Jalapeño', imageUrl: null },
    { slug: 'habanero', name: 'Habanero', imageUrl: null },
    { slug: 'sos-picant', name: 'Sos picant', imageUrl: null },
    { slug: 'cafea', name: 'Cafea', imageUrl: null },
    { slug: 'mascarpone', name: 'Mascarpone', imageUrl: null },
    { slug: 'cacao', name: 'Cacao', imageUrl: null },
    { slug: 'biscuiti', name: 'Biscuiți', imageUrl: null },
    { slug: 'zahar', name: 'Zahăr', imageUrl: null },
    { slug: 'smantana', name: 'Smântână', imageUrl: null },
    { slug: 'vanilie', name: 'Vanilie', imageUrl: null },
    { slug: 'fructe-padure', name: 'Fructe de pădure', imageUrl: null },
    { slug: 'ciocolata', name: 'Ciocolată', imageUrl: null },
    { slug: 'fructe', name: 'Fructe', imageUrl: null },
    { slug: 'nuci', name: 'Nuci', imageUrl: null },
    { slug: 'zahar-pudra', name: 'Zahăr pudră', imageUrl: null },
    { slug: 'carne-wagyu', name: 'Carne wagyu', imageUrl: null },
    { slug: 'cheddar', name: 'Cheddar', imageUrl: null },
    { slug: 'sos-special', name: 'Sos special', imageUrl: null },
    { slug: 'inghetata', name: 'Înghețată artizanală', imageUrl: null },
    // Variante brânzeturi
    { slug: 'gorgonzola', name: 'Gorgonzola', imageUrl: null },
    { slug: 'provolone', name: 'Provolone', imageUrl: null },
    { slug: 'feta', name: 'Feta', imageUrl: null },
    { slug: 'burrata', name: 'Burrata', imageUrl: null },
    // Variante carne & proteine
    { slug: 'bacon', name: 'Bacon', imageUrl: null },
    { slug: 'chorizo', name: 'Chorizo', imageUrl: null },
    { slug: 'pui', name: 'Pui grătat', imageUrl: null },
    { slug: 'miel', name: 'Miel', imageUrl: null },
    { slug: 'ton', name: 'Ton', imageUrl: null },
    // Legume & fructe suplimentare
    { slug: 'ananas', name: 'Ananas', imageUrl: null },
    { slug: 'porumb', name: 'Porumb', imageUrl: null },
    { slug: 'dovlecel', name: 'Dovlecel', imageUrl: null },
    { slug: 'rodie', name: 'Rodie', imageUrl: null },
    { slug: 'rucola', name: 'Rucola', imageUrl: null },
    { slug: 'rosii-cherry', name: 'Roșii cherry', imageUrl: null },
    // Sosuri & condimente
    { slug: 'sos-rosii', name: 'Sos roșii', imageUrl: null },
    { slug: 'sos-barbecue', name: 'Sos barbecue', imageUrl: null },
    { slug: 'oregano', name: 'Oregano', imageUrl: null },
    { slug: 'pesto', name: 'Pesto', imageUrl: null },
    { slug: 'miere', name: 'Miere', imageUrl: null },
  ];

  const createdIngredients = await Promise.all(
    ingredientData.map((i) =>
      prisma.ingredient.create({
        data: { slug: i.slug, name: i.name, imageUrl: i.imageUrl ?? null },
      }),
    ),
  );
  const bySlug = Object.fromEntries(createdIngredients.map((i) => [i.slug, i]));
  console.log(`✅ Created ${createdIngredients.length} ingredients`);

  const categories = await prisma.category.createMany({
    data: [
      { slug: 'pizza-clasica', name: 'Pizza Clasică', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-premium', name: 'Pizza Premium', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-vegetariana', name: 'Pizza Vegetariană', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-picanta', name: 'Pizza Picantă', status: CategoryStatus.INACTIVE },
      { slug: 'desert', name: 'Desert', status: CategoryStatus.ACTIVE },
    ],
  });
  console.log(`✅ Created ${categories.count} categories`);

  const pizzaClasica = await prisma.category.findUnique({ where: { slug: 'pizza-clasica' } });
  const pizzaPremium = await prisma.category.findUnique({ where: { slug: 'pizza-premium' } });
  const pizzaVegetariana = await prisma.category.findUnique({ where: { slug: 'pizza-vegetariana' } });
  const pizzaPicanta = await prisma.category.findUnique({ where: { slug: 'pizza-picanta' } });
  const desert = await prisma.category.findUnique({ where: { slug: 'desert' } });
  if (!pizzaClasica || !pizzaPremium || !pizzaVegetariana || !pizzaPicanta || !desert) {
    throw new Error('Categories not found');
  }

  const connectIds = (slugs: string[]) =>
    slugs.map((s) => bySlug[s]?.id).filter((id): id is number => id != null);

  await prisma.product.create({
    data: {
      slug: 'margherita',
      name: 'Pizza Margherita',
      description: 'Pizza clasică cu roșii, mozzarella și busuioc proaspăt',
      price: 24.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaClasica.id,
      sizes: ['mică', 'medie', 'mare'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'busuioc']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'pepperoni',
      name: 'Pizza Pepperoni',
      price: 27.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaClasica.id,
      sizes: ['mică', 'medie', 'mare', 'familie'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'pepperoni']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'quattro-stagioni',
      name: 'Pizza Quattro Stagioni',
      description: 'Pizza cu ciuperci, șuncă, măsline și artichoci',
      price: 29.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaClasica.id,
      sizes: ['medie', 'mare'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'ciuperci', 'sunca', 'masline', 'artichoci']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'capricciosa',
      name: 'Pizza Capricciosa',
      description: 'Pizza cu șuncă, ciuperci și măsline',
      price: 28.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.INACTIVE,
      categoryId: pizzaClasica.id,
      sizes: ['mică', 'medie', 'mare'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'sunca', 'ciuperci', 'masline']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'truffle-pizza',
      name: 'Pizza Truffle',
      description: 'Pizza premium cu trufe negre și parmezan',
      price: 45.99,
      imageUrl: null,
      type: ProductType.CONFIGURABLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaPremium.id,
      sizes: ['medie', 'mare', 'familie'],
      ingredients: { connect: connectIds(['trufe-negre', 'parmezan', 'ulei-masline']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'seafood-deluxe',
      name: 'Pizza Seafood Deluxe',
      price: 42.99,
      imageUrl: null,
      type: ProductType.CONFIGURABLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaPremium.id,
      sizes: ['mare', 'familie'],
      ingredients: { connect: connectIds(['creveti', 'calamari', 'midii', 'mozzarella', 'sos-alb']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'wagyu-beef',
      name: 'Pizza Wagyu Beef',
      description: 'Pizza premium cu carne wagyu și cheddar',
      price: 55.99,
      imageUrl: null,
      type: ProductType.CONFIGURABLE,
      status: ItemStatus.INACTIVE,
      categoryId: pizzaPremium.id,
      sizes: ['mare', 'familie'],
      ingredients: { connect: connectIds(['carne-wagyu', 'cheddar', 'sos-special', 'ceapa']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'vegetariana-completa',
      name: 'Pizza Vegetariană Completă',
      description: 'Pizza cu legume proaspete',
      price: 26.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaVegetariana.id,
      sizes: ['mică', 'medie', 'mare'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'ardei', 'ciuperci', 'masline', 'ceapa']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'spinaci-e-ricotta',
      name: 'Pizza Spinaci e Ricotta',
      price: 25.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaVegetariana.id,
      sizes: ['mică', 'medie'],
      ingredients: { connect: connectIds(['spinaci', 'ricotta', 'mozzarella', 'usturoi']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'diavola',
      name: 'Pizza Diavola',
      description: 'Pizza picantă cu salam picant',
      price: 27.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: pizzaPicanta.id,
      sizes: ['mică', 'medie', 'mare'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'salam-picant', 'ardei-iute']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'inferno',
      name: 'Pizza Inferno',
      description: 'Pizza extrem de picantă',
      price: 29.99,
      imageUrl: null,
      type: ProductType.CONFIGURABLE,
      status: ItemStatus.INACTIVE,
      categoryId: pizzaPicanta.id,
      sizes: ['mare', 'familie'],
      ingredients: { connect: connectIds(['rosii', 'mozzarella', 'jalapeno', 'habanero', 'sos-picant', 'ceapa']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'tiramisu',
      name: 'Tiramisu',
      description: 'Desert clasic italian',
      price: 18.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: desert.id,
      sizes: ['portie individuală', 'portie dublă'],
      ingredients: { connect: connectIds(['cafea', 'mascarpone', 'cacao', 'biscuiti', 'zahar']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'panna-cotta',
      name: 'Panna Cotta',
      price: 16.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.ACTIVE,
      categoryId: desert.id,
      sizes: ['portie individuală'],
      ingredients: { connect: connectIds(['smantana', 'zahar', 'vanilie', 'fructe-padure']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'gelato-misto',
      name: 'Gelato Misto',
      description: 'Mix de înghețată artizanală',
      price: 14.99,
      imageUrl: null,
      type: ProductType.CONFIGURABLE,
      status: ItemStatus.ACTIVE,
      categoryId: desert.id,
      sizes: ['1 cupă', '2 cupe', '3 cupe'],
      ingredients: { connect: connectIds(['inghetata', 'ciocolata', 'vanilie', 'fructe', 'nuci']).map((id) => ({ id })) },
    },
  });
  await prisma.product.create({
    data: {
      slug: 'cannoli',
      name: 'Cannoli Siciliani',
      description: 'Desert tradițional sicilian',
      price: 17.99,
      imageUrl: null,
      type: ProductType.SIMPLE,
      status: ItemStatus.INACTIVE,
      categoryId: desert.id,
      sizes: ['2 bucăți', '4 bucăți'],
      ingredients: { connect: connectIds(['ricotta', 'ciocolata', 'zahar-pudra']).map((id) => ({ id })) },
    },
  });

  console.log('✅ Created 15 products');
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
