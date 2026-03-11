import { PrismaClient, CategoryStatus, ProductType, ItemStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

/** Base path pentru imagini (servite static). Stocăm path relativ: /pizza-img/... sau /ingredient-img/... */
const PIZZA_IMG_BASE = '/pizza-img';
const INGREDIENT_IMG_BASE = '/ingredient-img';

async function main() {
  console.log('🌱 Seeding database...');

  // Ștergem DOAR date legate de categorii, produse, ingrediente. USERS rămâne neatins.
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();

  console.log('✅ Cleared products, ingredients, categories (users untouched)');

  // Imagini disponibile în public/ingredient-img/ (același format ca pizza-img: path relativ pentru backend)
  const ingredientImageFiles = [
    'Gemini_Generated_Image_5pmy585pmy585pmy.png',
    'Gemini_Generated_Image_6a7q1l6a7q1l6a7q.png',
    'Gemini_Generated_Image_agcst6agcst6agcs.png',
    'Gemini_Generated_Image_e9tg2oe9tg2oe9tg.png',
    'Gemini_Generated_Image_fw0rcafw0rcafw0r.png',
    'Gemini_Generated_Image_kf8r8ikf8r8ikf8r.png',
    'Gemini_Generated_Image_krundakrundakrun.png',
    'Gemini_Generated_Image_l3bipxl3bipxl3bi.png',
    'Gemini_Generated_Image_msuf08msuf08msuf.png',
    'Gemini_Generated_Image_uk5fyyuk5fyyuk5f.png',
  ];

  // Pas 1: Ingrediente cu imageUrl din ingredient-img (primele 10 au imagine, restul null)
  const ingredientData: Array<{ slug: string; name: string; imageUrl: string | null; defaultExtraPrice?: number }> = [
    { slug: 'tomato-sauce', name: 'Sos de roșii', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[0]}`, defaultExtraPrice: undefined },
    { slug: 'mozzarella', name: 'Mozzarella', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[1]}`, defaultExtraPrice: 2.5 },
    { slug: 'basil', name: 'Busuioc', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[2]}`, defaultExtraPrice: undefined },
    { slug: 'ham', name: 'Șuncă', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[3]}`, defaultExtraPrice: 2.5 },
    { slug: 'mushrooms', name: 'Ciuperci', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[4]}`, defaultExtraPrice: 1.5 },
    { slug: 'black-olives', name: 'Măsline negre', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[5]}`, defaultExtraPrice: 1 },
    { slug: 'pepperoni', name: 'Pepperoni', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[6]}`, defaultExtraPrice: 3 },
    { slug: 'chicken', name: 'Pui', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[7]}`, defaultExtraPrice: 3 },
    { slug: 'red-onion', name: 'Ceapă roșie', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[8]}`, defaultExtraPrice: 0.5 },
    { slug: 'pickles', name: 'Castraveți murați', imageUrl: `${INGREDIENT_IMG_BASE}/${ingredientImageFiles[9]}`, defaultExtraPrice: 1 },
    { slug: 'parsley', name: 'Pătrunjel', imageUrl: null },
    { slug: 'ranch-sauce', name: 'Sos ranch', imageUrl: null },
    { slug: 'corn', name: 'Porumb', imageUrl: null, defaultExtraPrice: 1 },
    { slug: 'bacon', name: 'Bacon', imageUrl: null, defaultExtraPrice: 3 },
    { slug: 'barbecue-sauce', name: 'Sos barbecue', imageUrl: null },
    { slug: 'salami', name: 'Salam', imageUrl: null, defaultExtraPrice: 2.5 },
    { slug: 'pineapple', name: 'Ananas', imageUrl: null, defaultExtraPrice: 1.5 },
    { slug: 'ground-meat', name: 'Carne tocată', imageUrl: null, defaultExtraPrice: 3 },
    { slug: 'mustard', name: 'Muștar', imageUrl: null },
    { slug: 'cream-sauce', name: 'Sos alb (cremă)', imageUrl: null },
    { slug: 'feta', name: 'Feta', imageUrl: null, defaultExtraPrice: 2.5 },
    { slug: 'parmesan', name: 'Parmezan', imageUrl: null, defaultExtraPrice: 3 },
    { slug: 'black-pepper', name: 'Piper negru', imageUrl: null },
    { slug: 'sausage', name: 'Cârnați', imageUrl: null, defaultExtraPrice: 2.5 },
    { slug: 'red-bell-pepper', name: 'Ardei gras roșu', imageUrl: null, defaultExtraPrice: 1 },
    { slug: 'shrimp', name: 'Creveți', imageUrl: null, defaultExtraPrice: 5 },
    { slug: 'special-sauce', name: 'Sos special', imageUrl: null },
  ];

  const createdIngredients = await Promise.all(
    ingredientData.map((i) =>
      prisma.ingredient.create({
        data: {
          slug: i.slug,
          name: i.name,
          imageUrl: i.imageUrl ?? null,
          ...(i.defaultExtraPrice != null && { defaultExtraPrice: i.defaultExtraPrice }),
        },
      }),
    ),
  );
  const bySlug = Object.fromEntries(createdIngredients.map((i) => [i.slug, i]));
  console.log(`✅ Created ${createdIngredients.length} ingredients`);

  // Categorii (conform tipurilor de pizza din imagini)
  const categories = await prisma.category.createMany({
    data: [
      { slug: 'pizza-clasica', name: 'Pizza Clasică', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-cu-carne', name: 'Pizza cu Carne', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-vegetariana', name: 'Pizza Vegetariană', status: CategoryStatus.ACTIVE },
      { slug: 'pizza-speciala', name: 'Pizza Specială', status: CategoryStatus.ACTIVE },
    ],
  });
  console.log(`✅ Created ${categories.count} categories`);

  const pizzaClasica = await prisma.category.findUnique({ where: { slug: 'pizza-clasica' } });
  const pizzaCarne = await prisma.category.findUnique({ where: { slug: 'pizza-cu-carne' } });
  const pizzaVegetariana = await prisma.category.findUnique({ where: { slug: 'pizza-vegetariana' } });
  const pizzaSpeciala = await prisma.category.findUnique({ where: { slug: 'pizza-speciala' } });
  if (!pizzaClasica || !pizzaCarne || !pizzaVegetariana || !pizzaSpeciala) {
    throw new Error('Categories not found');
  }

  const connectIds = (slugs: string[]) =>
    slugs.map((s) => bySlug[s]?.id).filter((id): id is number => id != null);

  // Modificatori preț mărime (exemple)
  const sizeModifiers = {
    medie: { priceModifierPercent: 15 },
    mare: { priceModifierPercent: 30 },
    familie: { extraPrice: 5 },
  };

  // Produse: denumire și descriere STRICT conform conținutului din imagine; imagine din pizza-img
  // ~10% CONFIGURABLE (2 din 19), restul SIMPLE
  const pizzaProducts: Array<{
    slug: string;
    name: string;
    description: string;
    price: number;
    imageFileName: string;
    categorySlug: string;
    ingredientSlugs: string[];
    sizes?: string[];
    sizePriceModifiers?: Record<string, { priceModifierPercent?: number; extraPrice?: number }>;
    type?: ProductType;
  }> = [
    {
      slug: 'pizza-creveti',
      type: ProductType.CONFIGURABLE,
      name: 'Pizza Creveți',
      description: 'Pizza cu creveți, sos de roșii și mozzarella topită pe blat auriu.',
      price: 32.99,
      imageFileName: 'pizza-creveti.webp',
      categorySlug: 'pizza-speciala',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'shrimp'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: { medie: { priceModifierPercent: 12 }, mare: { priceModifierPercent: 25 } },
    },
    {
      slug: 'pizza-sunca-ciuperci-masline',
      name: 'Pizza Șuncă, Ciuperci și Măsline',
      description: 'Pizza clasică cu felii de șuncă, ciuperci tăiate și măsline negre, pe bază de sos de roșii și mozzarella.',
      price: 28.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220643b2b69d3-56f6-40fd-ac63-155ba9c14b6f-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'ham', 'mushrooms', 'black-olives'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-rancho-pui',
      name: 'Pizza Rancho cu Pui',
      description: 'Pizza savuroasă cu pui, ceapă roșie, castraveți murați, pătrunjel proaspăt și sos ranch cremos în spirală, pe bază de roșii.',
      price: 29.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220644c765e92-1bfd-480d-a3ee-13630296f9a7-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'chicken', 'red-onion', 'pickles', 'parsley', 'ranch-sauce'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-salam-ananas',
      name: 'Pizza Salam și Ananas',
      description: 'Pizza cu felii de salam, bucăți dulci de ananas, sos de roșii și mozzarella topită, coaptă până la crustă aurie.',
      price: 27.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220644e917e3d-8154-4d3e-bdde-8aef8b7c175b-500x500.png',
      categorySlug: 'pizza-speciala',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'salami', 'pineapple'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-pui-porumb',
      name: 'Pizza Pui și Porumb',
      description: 'Pizza cu carne de pui mărunțită, porumb dulce, sos de roșii și brânză topită pe blat pufos.',
      price: 26.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220644f14fd00-1b03-4f15-ad85-ef6911f71e02-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'chicken', 'corn'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-bbq-chicken',
      name: 'Pizza BBQ Chicken',
      description: 'Pizza cu pui, șuncă/bacon și sos barbecue generos turnat în model rețea peste toppinguri, pe bază de roșii și mozzarella.',
      price: 30.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064fcd77a10-6651-4965-ad24-dd58f55b5ae8-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'chicken', 'ham', 'barbecue-sauce'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-ciuperci',
      name: 'Pizza Ciuperci',
      description: 'Pizza vegetariană cu ciuperci albe tăiate, sos de roșii și mozzarella topită pe crustă aurie.',
      price: 24.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064010b0814-cd3f-4b52-b65e-0d6aeda4565d-500x500.png',
      categorySlug: 'pizza-vegetariana',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'mushrooms'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-pepperoni',
      type: ProductType.CONFIGURABLE,
      name: 'Pizza Pepperoni',
      description: 'Pizza clasică cu sos de roșii, mozzarella topită și felii generoase de pepperoni crocant, pe crustă aurie.',
      price: 26.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test182206405a74b1b-e5c5-49f2-812b-0e27d38093fa-500x500.png',
      categorySlug: 'pizza-clasica',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'pepperoni'],
      sizes: ['mică', 'medie', 'mare', 'familie'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-margherita',
      name: 'Pizza Margherita',
      description: 'Pizza clasică cu sos de roșii, mozzarella topită și frunze proaspete de busuioc, pe blat auriu.',
      price: 22.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064654813b2-4527-45b6-9907-f0435f95ccea-500x500.png',
      categorySlug: 'pizza-clasica',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'basil'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-rancho-bacon-ciuperci-porumb',
      name: 'Pizza Rancho (Bacon, Ciuperci, Porumb)',
      description: 'Pizza cu bacon, ciuperci tăiate și porumb dulce, pe sos de roșii și mozzarella, blat crocant.',
      price: 29.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test182206471b11803-a521-4017-aa46-dc319aab7305-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'bacon', 'mushrooms', 'corn'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-rancho-carne-mustar',
      name: 'Pizza Rancho cu Carne și Muștar',
      description: 'Pizza cu carne tocată, castraveți murați și un văl de sos muștar galben în spirală, pe bază de roșii și brânză.',
      price: 28.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220647b533be7-32b2-447e-89b2-26b91bc235e9-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'ground-meat', 'pickles', 'mustard'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-quattro-formaggi-alba',
      name: 'Pizza Quattro Formaggi Albă',
      description: 'Pizza albă cu sos cremos, mozzarella, cuburi de feta, parmezan rumenit și piper negru, fără sos de roșii.',
      price: 28.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220649522d964-68c0-43da-af54-8938a7d3bf34-500x500.png',
      categorySlug: 'pizza-vegetariana',
      ingredientSlugs: ['cream-sauce', 'mozzarella', 'feta', 'parmesan', 'black-pepper'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-pepperoni-ciuperci',
      name: 'Pizza Pepperoni și Ciuperci',
      description: 'Pizza cu pepperoni picant și ciuperci proaspete tăiate subțire, pe sos de roșii și mozzarella.',
      price: 27.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test18220649b9de0b1-d3d7-4f56-9822-dc548ab7d0e8-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'pepperoni', 'mushrooms'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-mix-carnuri',
      name: 'Pizza Mix de Carnuri',
      description: 'Pizza bogată cu șuncă, pepperoni, rondele de cârnați și bucăți de pui, pe sos de roșii și mozzarella.',
      price: 31.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064d799f86c-6efb-4ce1-8ea7-1925f9025135-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'ham', 'pepperoni', 'sausage', 'chicken'],
      sizes: ['mică', 'medie', 'mare', 'familie'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-cheeseburger',
      name: 'Pizza Cheeseburger',
      description: 'Pizza cu carne tocată, ceapă roșie, castraveți murați și sos cremos portocaliu-galben în spirală, pe bază de roșii și brânză.',
      price: 29.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064da5f5744-47e6-441d-aa18-bf01728d555c-500x500.png',
      categorySlug: 'pizza-speciala',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'ground-meat', 'red-onion', 'pickles', 'special-sauce'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
    {
      slug: 'pizza-pui-ciuperci-ardei-ranch',
      name: 'Pizza Pui, Ciuperci și Ardei cu Ranch',
      description: 'Pizza cu pui, ciuperci, ardei gras roșu și sos ranch cremos în spirală, pe bază de roșii și mozzarella.',
      price: 28.99,
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064ebf0f825-b1a6-4c14-8249-43ba44663253-500x500.png',
      categorySlug: 'pizza-cu-carne',
      ingredientSlugs: ['tomato-sauce', 'mozzarella', 'chicken', 'mushrooms', 'red-bell-pepper', 'ranch-sauce'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    },
  ];

  // Produse suplimentare pentru imaginile rămase din pizza-img (fără analiză vizuală)
  const extraPizzas: Array<{ imageFileName: string; slug: string; name: string; description: string }> = [
    {
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064148b5890-8152-4814-8128-7efd7324a0de.png',
      slug: 'pizza-speciala-imagine-1',
      name: 'Pizza Specială',
      description: 'Pizza specială cu ingrediente selectate, pe bază de roșii și mozzarella.',
    },
    {
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064b8f48757-95c3-481b-b4f2-b822d3bd5be1.png',
      slug: 'pizza-speciala-imagine-2',
      name: 'Pizza Specială',
      description: 'Pizza specială cu ingrediente selectate, pe bază de roșii și mozzarella.',
    },
    {
      imageFileName: 'httpscdneu.syrve_.comnomenclature_images_test1822064fdb633f3-371d-41b7-9fe5-0afb7f9e683f.png',
      slug: 'pizza-speciala-imagine-3',
      name: 'Pizza Specială',
      description: 'Pizza specială cu ingrediente selectate, pe bază de roșii și mozzarella.',
    },
  ];
  for (const p of extraPizzas) {
    pizzaProducts.push({
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: 27.99,
      imageFileName: p.imageFileName,
      categorySlug: 'pizza-speciala',
      ingredientSlugs: ['tomato-sauce', 'mozzarella'],
      sizes: ['mică', 'medie', 'mare'],
      sizePriceModifiers: sizeModifiers,
    });
  }

  const categoryBySlug: Record<string, { id: number }> = {
    'pizza-clasica': pizzaClasica,
    'pizza-cu-carne': pizzaCarne,
    'pizza-vegetariana': pizzaVegetariana,
    'pizza-speciala': pizzaSpeciala,
  };

  for (const p of pizzaProducts) {
    const category = categoryBySlug[p.categorySlug];
    if (!category) continue;
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: `${PIZZA_IMG_BASE}/${p.imageFileName}`,
        type: p.type ?? ProductType.SIMPLE,
        status: ItemStatus.ACTIVE,
        categoryId: category.id,
        sizes: p.sizes ?? ['mică', 'medie', 'mare'],
        sizePriceModifiers: (p.sizePriceModifiers ?? null) as object,
        ingredients: { connect: connectIds(p.ingredientSlugs).map((id) => ({ id })) },
      },
    });
  }

  console.log(`✅ Created ${pizzaProducts.length} products with images from pizza-img`);

  // Acordă drepturi de admin utilizatorului john.doe@example.com dacă există
  const adminEmail = 'john.doe@example.com';
  const adminUser = await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { rol: Role.ADMIN },
  });
  if (adminUser.count > 0) {
    console.log(`✅ Set role ADMIN for ${adminEmail}`);
  }

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
