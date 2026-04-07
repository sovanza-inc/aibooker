import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  integrations,
  providers,
  providerLocations,
  bookingTypes,
  availabilitySlots,
  bookings,
  customerLeads,
  openingHours,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { sql } from 'drizzle-orm';

async function seedDemo() {
  console.log('🌱 Seeding demo data for MCP testing...\n');

  const passwordHash = await hashPassword('demo123');

  // ── Teams & Integrations ──────────────────────────────────────────

  const providerData = [
    {
      team: 'La Piazza Group',
      source: 'jimani',
      externalId: 'rest_1001',
      provider: {
        name: 'La Trattoria Roma',
        slug: 'la-trattoria-roma-demo',
        description: 'Classic Roman trattoria in the heart of Amsterdam. Family recipes passed down for three generations — from carbonara to cacio e pepe.',
        cuisineType: ['italian', 'roman', 'pasta'],
        tags: ['romantic', 'terrace', 'wine bar', 'family friendly'],
        phone: '+31201110001',
        email: 'info@latrattoria.nl',
        website: 'https://latrattoria.nl',
        priceRange: 3,
        rating: 4.7,
        aboutCompany: 'Owned by the Rossi family since 1998, La Trattoria Roma brings the warmth and flavors of Rome to Amsterdam.',
        whatIsThisBusiness: 'A traditional Roman trattoria with a cozy terrace on the Prinsengracht canal.',
        whatCanIBookHere: 'Lunch, dinner, private dining for groups up to 16, and wine tasting evenings.',
        whenShouldRecommend: 'For Italian food lovers, romantic dinners, or anyone wanting a genuine Roman dining experience in Amsterdam.',
        whatCanCustomersBook: ['Lunch', 'Dinner', 'Wine Tasting', 'Private Dining'],
        bestFor: ['Date night', 'Anniversary', 'Family dinner', 'Tourists'],
        atmosphere: ['Romantic', 'Cozy', 'Traditional'],
        whatMakesUnique: 'Imported ingredients from Rome, homemade fresh pasta daily, candlelit canal-view terrace.',
        whenShouldChoose: 'When you want authentic Roman food in a romantic canal-side setting.',
        whenShouldNotChoose: 'If you want modern fusion or a quick casual meal.',
        popularDishes: 'Cacio e Pepe, Carbonara, Saltimbocca alla Romana, Tiramisu, Amatriciana',
        minGuestSize: 1,
        maxGuestSize: 16,
        priceRangeFrom: 28.0,
        priceRangeTo: 55.0,
        targetAudience: ['Adults', 'Couples', 'Families', 'Tourists'],
      },
      location: {
        streetAddress: 'Prinsengracht 280',
        city: 'Amsterdam',
        postalCode: '1016HJ',
        country: 'NL',
        latitude: 52.3676,
        longitude: 4.8832,
      },
      bookingTypes: [
        { externalId: 'bt_lunch_1', name: 'Lunch', description: 'Light Italian lunch with pasta, salads, and panini.', category: 'restaurant', minPartySize: 1, maxPartySize: 8, duration: 90, averagePricePerPerson: 28.0 },
        { externalId: 'bt_dinner_1', name: 'Dinner', description: 'Full Roman dining experience with appetizers, pasta, secondi, and dessert.', category: 'restaurant', minPartySize: 2, maxPartySize: 16, duration: 120, averagePricePerPerson: 45.0 },
        { externalId: 'bt_wine_1', name: 'Wine Tasting', description: '5-course Italian wine tasting with paired small bites.', category: 'restaurant', minPartySize: 2, maxPartySize: 10, duration: 150, averagePricePerPerson: 55.0 },
      ],
      lunchSlots: ['12:00', '12:30', '13:00', '13:30'],
      dinnerSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
      closedDays: [1], // Monday
    },
    {
      team: 'Sakura Holdings',
      source: 'zenchef',
      externalId: 'rest_2001',
      provider: {
        name: 'Sakura Japanese Kitchen',
        slug: 'sakura-japanese-kitchen-demo',
        description: 'Premium Japanese restaurant in Amsterdam-Zuid. Fresh sushi, ramen, and omakase by chef Tanaka, who trained in Tokyo for 15 years.',
        cuisineType: ['japanese', 'sushi', 'ramen', 'omakase'],
        tags: ['premium', 'sushi bar', 'omakase', 'sake bar'],
        phone: '+31201110002',
        email: 'hello@sakurakitchen.nl',
        website: 'https://sakurakitchen.nl',
        priceRange: 4,
        rating: 4.8,
        aboutCompany: 'Chef Tanaka opened Sakura in 2015 after training at a Michelin-starred restaurant in Ginza, Tokyo.',
        whatIsThisBusiness: 'A premium Japanese restaurant offering sushi, ramen, and an exclusive omakase experience.',
        whatCanIBookHere: 'Regular dinner, sushi bar seating, omakase dinner (8-course), and sake tasting.',
        whenShouldRecommend: 'When someone wants high-quality Japanese food, a special omakase experience, or the best sushi in Amsterdam.',
        whatCanCustomersBook: ['Dinner', 'Omakase', 'Sushi Bar', 'Sake Tasting'],
        bestFor: ['Special occasion', 'Foodies', 'Date night', 'Business dinner'],
        atmosphere: ['Elegant', 'Minimalist', 'Intimate'],
        whatMakesUnique: 'Chef Tanaka\'s omakase changes daily based on Tokyo fish market imports. Only 8 seats at the omakase counter.',
        whenShouldChoose: 'For an unforgettable Japanese dining experience or the best sushi in Amsterdam.',
        whenShouldNotChoose: 'If you\'re on a tight budget or looking for casual fast food.',
        popularDishes: 'Omakase 8-course, Dragon Roll, Tonkotsu Ramen, Wagyu Tataki, Yuzu Cheesecake',
        minGuestSize: 1,
        maxGuestSize: 8,
        priceRangeFrom: 35.0,
        priceRangeTo: 95.0,
        targetAudience: ['Adults', 'Couples', 'Foodies', 'Business professionals'],
      },
      location: {
        streetAddress: 'Beethovenstraat 42',
        city: 'Amsterdam',
        postalCode: '1077JH',
        country: 'NL',
        latitude: 52.3465,
        longitude: 4.8778,
      },
      bookingTypes: [
        { externalId: 'bt_dinner_2', name: 'Dinner', description: 'À la carte Japanese dinner with sushi, ramen, and more.', category: 'restaurant', minPartySize: 1, maxPartySize: 8, duration: 90, averagePricePerPerson: 45.0 },
        { externalId: 'bt_omakase_2', name: 'Omakase Experience', description: 'Exclusive 8-course omakase at the chef\'s counter. Only 8 seats.', category: 'restaurant', minPartySize: 1, maxPartySize: 2, duration: 150, averagePricePerPerson: 95.0 },
        { externalId: 'bt_sake_2', name: 'Sake Tasting', description: 'Guided sake tasting with 6 premium sakes and Japanese snacks.', category: 'restaurant', minPartySize: 2, maxPartySize: 6, duration: 120, averagePricePerPerson: 55.0 },
      ],
      lunchSlots: [],
      dinnerSlots: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
      closedDays: [0, 1], // Sunday, Monday
    },
    {
      team: 'Café de Jordaan BV',
      source: 'jimani',
      externalId: 'rest_3001',
      provider: {
        name: 'Café de Jordaan',
        slug: 'cafe-de-jordaan-demo',
        description: 'Beloved neighborhood café in the Jordaan with classic Dutch bites, craft beers, and a sun-drenched terrace on the canal.',
        cuisineType: ['dutch', 'european', 'café', 'brunch'],
        tags: ['casual', 'terrace', 'brunch', 'craft beer', 'pet friendly'],
        phone: '+31201110003',
        email: 'hallo@cafedejordaan.nl',
        website: 'https://cafedejordaan.nl',
        priceRange: 2,
        rating: 4.4,
        aboutCompany: 'A Jordaan institution since 2005. Known for the best bitterballen in Amsterdam and a terrace that fills up on sunny days.',
        whatIsThisBusiness: 'A casual Dutch café with brunch, lunch, borrels, and a great craft beer selection.',
        whatCanIBookHere: 'Brunch, lunch, afternoon borrel (drinks & snacks), and group events.',
        whenShouldRecommend: 'For a relaxed brunch, sunny terrace drinks, casual lunch, or someone wanting classic Dutch food.',
        whatCanCustomersBook: ['Brunch', 'Lunch', 'Borrel', 'Group Event'],
        bestFor: ['Friends', 'Casual outing', 'Brunch lovers', 'Tourists'],
        atmosphere: ['Casual', 'Lively', 'Cozy', 'Local'],
        whatMakesUnique: 'Best bitterballen in Amsterdam (voted #1 by Het Parool), 20 craft beers on tap, canal-side terrace.',
        whenShouldChoose: 'When you want a relaxed, affordable meal or drinks in a classic Amsterdam setting.',
        whenShouldNotChoose: 'If you\'re looking for a fine dining or formal experience.',
        popularDishes: 'Bitterballen, Dutch Pancakes, Uitsmijter, Broodje Kroket, Apple Pie',
        minGuestSize: 1,
        maxGuestSize: 20,
        priceRangeFrom: 12.0,
        priceRangeTo: 25.0,
        targetAudience: ['Adults', 'Friends', 'Tourists', 'Families', 'Dog owners'],
      },
      location: {
        streetAddress: 'Westerstraat 56',
        city: 'Amsterdam',
        postalCode: '1015MK',
        country: 'NL',
        latitude: 52.3793,
        longitude: 4.8813,
      },
      bookingTypes: [
        { externalId: 'bt_brunch_3', name: 'Brunch', description: 'Weekend brunch with eggs, pancakes, fresh juice, and coffee.', category: 'restaurant', minPartySize: 1, maxPartySize: 8, duration: 90, averagePricePerPerson: 18.0 },
        { externalId: 'bt_lunch_3', name: 'Lunch', description: 'Classic Dutch lunch with sandwiches, soups, and salads.', category: 'restaurant', minPartySize: 1, maxPartySize: 10, duration: 75, averagePricePerPerson: 15.0 },
        { externalId: 'bt_borrel_3', name: 'Borrel', description: 'Afternoon drinks with bitterballen and Dutch cheese board.', category: 'restaurant', minPartySize: 2, maxPartySize: 20, duration: 120, averagePricePerPerson: 22.0 },
      ],
      lunchSlots: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'],
      dinnerSlots: ['16:00', '16:30', '17:00', '17:30', '18:00'],
      closedDays: [2], // Tuesday
    },
    {
      team: 'Le Marais Amsterdam',
      source: 'zenchef',
      externalId: 'rest_4001',
      provider: {
        name: 'Le Marais Bistro',
        slug: 'le-marais-bistro-demo',
        description: 'Charming French bistro in Oud-Zuid. Classic French cuisine with a modern twist, excellent wine list, and a cozy candlelit interior.',
        cuisineType: ['french', 'bistro', 'european'],
        tags: ['romantic', 'wine bar', 'candlelit', 'classic'],
        phone: '+31201110004',
        email: 'bonjour@lemarais.nl',
        website: 'https://lemarais.nl',
        priceRange: 3,
        rating: 4.5,
        aboutCompany: 'Le Marais brings Parisian bistro culture to Amsterdam. Chef Pierre trained at Le Bernardin and brings seasonal French cooking to every plate.',
        whatIsThisBusiness: 'A classic French bistro with candlelit dining, seasonal menus, and an extensive French wine cellar.',
        whatCanIBookHere: 'Lunch, dinner, 3-course prix fixe, and wine pairing dinners.',
        whenShouldRecommend: 'For a romantic French dinner, someone celebrating a special occasion, or wine lovers.',
        whatCanCustomersBook: ['Lunch', 'Dinner', 'Prix Fixe', 'Wine Pairing Dinner'],
        bestFor: ['Date night', 'Anniversary', 'Wine lovers', 'Special occasion'],
        atmosphere: ['Romantic', 'Elegant', 'Candlelit', 'Intimate'],
        whatMakesUnique: 'Seasonal menu that changes every 3 weeks, wine cellar with 200+ French wines, candlelit tables.',
        whenShouldChoose: 'When you want a romantic, elegant French meal with great wine.',
        whenShouldNotChoose: 'For casual dining, large groups, or if you prefer non-European cuisine.',
        popularDishes: 'Duck Confit, Bouillabaisse, Crème Brûlée, Steak Tartare, Coq au Vin',
        minGuestSize: 1,
        maxGuestSize: 12,
        priceRangeFrom: 32.0,
        priceRangeTo: 65.0,
        targetAudience: ['Adults', 'Couples', 'Wine enthusiasts', 'Business professionals'],
      },
      location: {
        streetAddress: 'Willemsparkweg 77',
        city: 'Amsterdam',
        postalCode: '1071GR',
        country: 'NL',
        latitude: 52.3521,
        longitude: 4.8756,
      },
      bookingTypes: [
        { externalId: 'bt_lunch_4', name: 'Lunch', description: 'Two-course French lunch with soup or salad and a plat du jour.', category: 'restaurant', minPartySize: 1, maxPartySize: 6, duration: 75, averagePricePerPerson: 32.0 },
        { externalId: 'bt_dinner_4', name: 'Dinner', description: 'À la carte French dining with seasonal dishes and wine pairing option.', category: 'restaurant', minPartySize: 2, maxPartySize: 12, duration: 120, averagePricePerPerson: 52.0 },
        { externalId: 'bt_prixfixe_4', name: '3-Course Prix Fixe', description: 'Chef\'s 3-course seasonal menu with optional wine pairing.', category: 'restaurant', minPartySize: 2, maxPartySize: 8, duration: 150, averagePricePerPerson: 65.0 },
      ],
      lunchSlots: ['12:00', '12:30', '13:00', '13:30'],
      dinnerSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
      closedDays: [0, 1], // Sunday, Monday
    },
    {
      team: 'Rotterdam Harbour Dining',
      source: 'jimani',
      externalId: 'rest_5001',
      provider: {
        name: 'The Harbour Kitchen',
        slug: 'the-harbour-kitchen-demo',
        description: 'Modern seafood restaurant on Rotterdam\'s waterfront. Sustainably sourced fish, harbour views, and a raw bar with the freshest oysters in town.',
        cuisineType: ['seafood', 'european', 'modern'],
        tags: ['waterfront', 'seafood', 'raw bar', 'sustainable', 'views'],
        phone: '+31101110005',
        email: 'info@harbourkitchen.nl',
        website: 'https://harbourkitchen.nl',
        priceRange: 3,
        rating: 4.6,
        aboutCompany: 'The Harbour Kitchen opened in 2019 with a mission to serve the freshest, most sustainably sourced seafood in Rotterdam.',
        whatIsThisBusiness: 'A modern seafood restaurant with panoramic harbour views and a dedicated raw bar.',
        whatCanIBookHere: 'Lunch, dinner, raw bar seating, and Sunday seafood brunch.',
        whenShouldRecommend: 'For seafood lovers, harbour views dining in Rotterdam, or a fresh oyster & champagne experience.',
        whatCanCustomersBook: ['Lunch', 'Dinner', 'Raw Bar', 'Sunday Brunch'],
        bestFor: ['Seafood lovers', 'Business lunch', 'Special occasion', 'Tourists'],
        atmosphere: ['Modern', 'Airy', 'Waterfront', 'Upscale casual'],
        whatMakesUnique: 'Daily fish delivery from Scheveningen harbour, panoramic harbour terrace, raw bar with 6 oyster varieties.',
        whenShouldChoose: 'When you want fresh seafood with amazing harbour views in Rotterdam.',
        whenShouldNotChoose: 'If you don\'t eat seafood or want a meat-focused restaurant.',
        popularDishes: 'Zeeland Oysters, Grilled Whole Seabass, Lobster Thermidor, Fish & Chips, Seafood Platter',
        minGuestSize: 1,
        maxGuestSize: 14,
        priceRangeFrom: 30.0,
        priceRangeTo: 60.0,
        targetAudience: ['Adults', 'Couples', 'Business professionals', 'Tourists'],
      },
      location: {
        streetAddress: 'Wilhelminakade 137',
        city: 'Rotterdam',
        postalCode: '3072AP',
        country: 'NL',
        latitude: 51.9050,
        longitude: 4.4858,
      },
      bookingTypes: [
        { externalId: 'bt_lunch_5', name: 'Lunch', description: 'Light seafood lunch with soups, salads, and fresh catch of the day.', category: 'restaurant', minPartySize: 1, maxPartySize: 8, duration: 75, averagePricePerPerson: 30.0 },
        { externalId: 'bt_dinner_5', name: 'Dinner', description: 'Full seafood dinner with starters, mains, and dessert.', category: 'restaurant', minPartySize: 2, maxPartySize: 14, duration: 120, averagePricePerPerson: 52.0 },
        { externalId: 'bt_rawbar_5', name: 'Raw Bar', description: 'Oysters, ceviche, and tartare at the raw bar counter.', category: 'restaurant', minPartySize: 1, maxPartySize: 4, duration: 60, averagePricePerPerson: 40.0 },
      ],
      lunchSlots: ['12:00', '12:30', '13:00', '13:30', '14:00'],
      dinnerSlots: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
      closedDays: [1], // Monday
    },
    {
      team: 'Habibi Group',
      source: 'jimani',
      externalId: 'rest_6001',
      provider: {
        name: 'Habibi Lebanese Kitchen',
        slug: 'habibi-lebanese-kitchen-demo',
        description: 'Vibrant Lebanese restaurant in De Pijp. Authentic mezze, grills, and fresh-baked flatbreads. Vegan and vegetarian friendly.',
        cuisineType: ['lebanese', 'middle eastern', 'mediterranean', 'vegan'],
        tags: ['vegan friendly', 'group friendly', 'sharing plates', 'lively'],
        phone: '+31201110006',
        email: 'salam@habibikitchen.nl',
        website: 'https://habibikitchen.nl',
        priceRange: 2,
        rating: 4.5,
        aboutCompany: 'Habibi was founded by chef Layla Kassem who brought her grandmother\'s recipes from Beirut to Amsterdam.',
        whatIsThisBusiness: 'A lively Lebanese restaurant with sharing-style mezze, grills, and an extensive vegetarian menu.',
        whatCanIBookHere: 'Lunch, dinner, mezze sharing dinner for groups, and Lebanese cooking class.',
        whenShouldRecommend: 'For vegetarians, groups who like sharing plates, Middle Eastern food lovers, or affordable quality dining.',
        whatCanCustomersBook: ['Lunch', 'Dinner', 'Mezze Feast', 'Cooking Class'],
        bestFor: ['Groups of friends', 'Vegetarians', 'Casual dinner', 'Food adventurers'],
        atmosphere: ['Lively', 'Colorful', 'Social', 'Casual'],
        whatMakesUnique: 'Fresh flatbreads baked in-house every hour, over 20 mezze options, fully vegan menu available.',
        whenShouldChoose: 'When you want flavorful sharing plates, are vegetarian/vegan, or dining with a group.',
        whenShouldNotChoose: 'If you prefer a quiet, intimate fine dining setting.',
        popularDishes: 'Hummus, Lamb Shawarma, Falafel Plate, Mixed Grill, Baklava, Fattoush',
        minGuestSize: 1,
        maxGuestSize: 20,
        priceRangeFrom: 18.0,
        priceRangeTo: 35.0,
        targetAudience: ['Adults', 'Groups', 'Vegetarians', 'Students', 'Families'],
      },
      location: {
        streetAddress: 'Albert Cuypstraat 182',
        city: 'Amsterdam',
        postalCode: '1073BL',
        country: 'NL',
        latitude: 52.3557,
        longitude: 4.8946,
      },
      bookingTypes: [
        { externalId: 'bt_lunch_6', name: 'Lunch', description: 'Quick Lebanese lunch with wraps, salads, and mezze.', category: 'restaurant', minPartySize: 1, maxPartySize: 8, duration: 60, averagePricePerPerson: 18.0 },
        { externalId: 'bt_dinner_6', name: 'Dinner', description: 'Lebanese dinner with selection of mezze, grills, and desserts.', category: 'restaurant', minPartySize: 2, maxPartySize: 12, duration: 90, averagePricePerPerson: 28.0 },
        { externalId: 'bt_feast_6', name: 'Mezze Feast', description: 'Sharing-style feast with 12+ mezze dishes, mixed grill, and dessert.', category: 'restaurant', minPartySize: 4, maxPartySize: 20, duration: 120, averagePricePerPerson: 35.0 },
      ],
      lunchSlots: ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'],
      dinnerSlots: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
      closedDays: [], // Open every day
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const data of providerData) {
    console.log(`\n── Creating: ${data.provider.name} ──`);

    // Create team
    const [team] = await db.insert(teams).values({ name: data.team }).returning();

    // Create integration
    const [integration] = await db.insert(integrations).values({
      teamId: team.id,
      source: data.source,
      externalId: data.externalId,
      status: 'active',
      apiKey: `ak_demo_${data.externalId}_${Date.now()}`,
      webhookSecret: `whsec_demo_${Date.now()}`,
      credentials: { apiUrl: `https://api.${data.source}.nl/v1` },
      activatedAt: new Date(),
    }).returning();

    // Create provider
    const [provider] = await db.insert(providers).values({
      integrationId: integration.id,
      ...data.provider,
      status: 'active',
    }).returning();
    console.log(`  Provider ID: ${provider.id}`);

    // Create location
    await db.insert(providerLocations).values({
      providerId: provider.id,
      ...data.location,
    });

    // Create booking types
    const createdTypes: { id: number; externalId: string; name: string }[] = [];
    for (const bt of data.bookingTypes) {
      const [created] = await db.insert(bookingTypes).values({
        providerId: provider.id,
        ...bt,
        isActive: true,
      }).returning();
      createdTypes.push(created);
    }
    console.log(`  Booking types: ${createdTypes.map(t => t.name).join(', ')}`);

    // Create availability slots for next 14 days
    let slotCount = 0;
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dayOfWeek = date.getDay();

      if (data.closedDays.includes(dayOfWeek)) continue;

      const expiresAt = new Date(date.getTime() + 48 * 60 * 60 * 1000);

      // Lunch slots → first booking type
      if (data.lunchSlots.length > 0 && createdTypes[0]) {
        for (const time of data.lunchSlots) {
          const [h] = time.split(':').map(Number);
          await db.insert(availabilitySlots).values({
            bookingTypeId: createdTypes[0].id,
            date,
            startTime: time,
            endTime: `${h + 1}:${time.split(':')[1]}`,
            capacity: 4 + Math.floor(Math.random() * 4), // 4-7
            maxPartySize: createdTypes[0].externalId.includes('brunch') ? 8 : 10,
            lastSyncedAt: new Date(),
            expiresAt,
          }).onConflictDoNothing();
          slotCount++;
        }
      }

      // Dinner/evening slots → second booking type (or first if only one)
      const dinnerType = createdTypes.length > 1 ? createdTypes[1] : createdTypes[0];
      for (const time of data.dinnerSlots) {
        const [h] = time.split(':').map(Number);
        await db.insert(availabilitySlots).values({
          bookingTypeId: dinnerType.id,
          date,
          startTime: time,
          endTime: `${Math.min(h + 2, 23)}:${time.split(':')[1]}`,
          capacity: 4 + Math.floor(Math.random() * 6), // 4-9
          maxPartySize: dinnerType.externalId.includes('omakase') ? 2 : 20,
          lastSyncedAt: new Date(),
          expiresAt,
        }).onConflictDoNothing();
        slotCount++;
      }

      // Third booking type (special) — limited slots on weekends
      if (createdTypes.length > 2 && (dayOfWeek === 5 || dayOfWeek === 6)) {
        const specialType = createdTypes[2];
        const specialSlots = ['18:00', '20:00'];
        for (const time of specialSlots) {
          const [h] = time.split(':').map(Number);
          await db.insert(availabilitySlots).values({
            bookingTypeId: specialType.id,
            date,
            startTime: time,
            endTime: `${h + 2}:${time.split(':')[1]}`,
            capacity: 2 + Math.floor(Math.random() * 3),
            maxPartySize: 10,
            lastSyncedAt: new Date(),
            expiresAt,
          }).onConflictDoNothing();
          slotCount++;
        }
      }
    }
    console.log(`  Availability slots: ${slotCount}`);

    // Create opening hours for next 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dayOfWeek = date.getDay();
      const isClosed = data.closedDays.includes(dayOfWeek);

      await db.insert(openingHours).values({
        providerId: provider.id,
        date,
        openTime: isClosed ? null : (data.lunchSlots.length > 0 ? data.lunchSlots[0] : data.dinnerSlots[0]),
        closeTime: isClosed ? null : '23:00',
        isClosed,
      }).onConflictDoNothing();
    }
  }

  // ── Sample Customer Leads ──────────────────────────────────────────

  console.log('\n── Creating customer leads ──');
  const leads = await db.insert(customerLeads).values([
    { email: 'thomas.muller@example.com', phone: '+31612340001', firstName: 'Thomas', lastName: 'Muller' },
    { email: 'lisa.devries@example.com', phone: '+31612340002', firstName: 'Lisa', lastName: 'de Vries' },
    { email: 'mark.johnson@example.com', phone: '+44771234001', firstName: 'Mark', lastName: 'Johnson' },
    { email: 'sarah.bernard@example.com', phone: '+33612340001', firstName: 'Sarah', lastName: 'Bernard' },
    { email: 'david.chen@example.com', phone: '+31612340005', firstName: 'David', lastName: 'Chen' },
    { email: 'nina.petersen@example.com', phone: '+31612340006', firstName: 'Nina', lastName: 'Petersen' },
    { email: 'yuki.tanaka@example.com', phone: '+31612340007', firstName: 'Yuki', lastName: 'Tanaka' },
    { email: 'carlos.rodriguez@example.com', phone: '+31612340008', firstName: 'Carlos', lastName: 'Rodriguez' },
  ]).returning();
  console.log(`  Created ${leads.length} customer leads`);

  // ── Sample Bookings ──────────────────────────────────────────────

  console.log('\n── Creating sample bookings ──');

  // Get all providers & booking types we just created
  const allProviders = await db.select().from(providers).where(
    sql`${providers.slug} LIKE '%-demo'`
  );
  const allBookingTypes = await db.select().from(bookingTypes);

  const sampleBookings = [
    { providerSlug: 'la-trattoria-roma-demo', typeName: 'Dinner', leadIdx: 0, dayOffset: 1, time: '19:00', partySize: 4, status: 'confirmed', platform: 'claude' },
    { providerSlug: 'la-trattoria-roma-demo', typeName: 'Lunch', leadIdx: 1, dayOffset: 2, time: '12:30', partySize: 2, status: 'confirmed', platform: 'openai' },
    { providerSlug: 'sakura-japanese-kitchen-demo', typeName: 'Omakase Experience', leadIdx: 2, dayOffset: 1, time: '19:00', partySize: 2, status: 'confirmed', platform: 'claude' },
    { providerSlug: 'sakura-japanese-kitchen-demo', typeName: 'Dinner', leadIdx: 6, dayOffset: 3, time: '18:30', partySize: 3, status: 'pending', platform: 'gemini' },
    { providerSlug: 'cafe-de-jordaan-demo', typeName: 'Brunch', leadIdx: 3, dayOffset: 2, time: '11:00', partySize: 4, status: 'confirmed', platform: 'openai' },
    { providerSlug: 'cafe-de-jordaan-demo', typeName: 'Borrel', leadIdx: 4, dayOffset: 4, time: '17:00', partySize: 6, status: 'pending', platform: 'claude' },
    { providerSlug: 'le-marais-bistro-demo', typeName: 'Dinner', leadIdx: 5, dayOffset: 2, time: '20:00', partySize: 2, status: 'confirmed', platform: 'claude' },
    { providerSlug: 'le-marais-bistro-demo', typeName: '3-Course Prix Fixe', leadIdx: 3, dayOffset: 5, time: '19:00', partySize: 4, status: 'pending', platform: 'openai' },
    { providerSlug: 'the-harbour-kitchen-demo', typeName: 'Raw Bar', leadIdx: 7, dayOffset: 1, time: '18:00', partySize: 2, status: 'confirmed', platform: 'gemini' },
    { providerSlug: 'the-harbour-kitchen-demo', typeName: 'Dinner', leadIdx: 0, dayOffset: 3, time: '19:30', partySize: 6, status: 'cancelled', platform: 'claude' },
    { providerSlug: 'habibi-lebanese-kitchen-demo', typeName: 'Mezze Feast', leadIdx: 4, dayOffset: 2, time: '19:00', partySize: 8, status: 'confirmed', platform: 'openai' },
    { providerSlug: 'habibi-lebanese-kitchen-demo', typeName: 'Dinner', leadIdx: 1, dayOffset: 4, time: '20:00', partySize: 2, status: 'pending', platform: 'claude' },
  ];

  for (const b of sampleBookings) {
    const prov = allProviders.find(p => p.slug === b.providerSlug);
    if (!prov) continue;
    const bt = allBookingTypes.find(t => t.providerId === prov.id && t.name === b.typeName);
    if (!bt) continue;

    const bookingDate = new Date(today);
    bookingDate.setDate(bookingDate.getDate() + b.dayOffset);

    await db.insert(bookings).values({
      providerId: prov.id,
      bookingTypeId: bt.id,
      customerLeadId: leads[b.leadIdx].id,
      date: bookingDate,
      time: b.time,
      partySize: b.partySize,
      status: b.status,
      aiPlatform: b.platform,
      externalBookingId: `demo_book_${prov.id}_${b.leadIdx}_${b.dayOffset}`,
      confirmedAt: b.status === 'confirmed' ? new Date() : null,
      cancelledAt: b.status === 'cancelled' ? new Date() : null,
    });
  }
  console.log(`  Created ${sampleBookings.length} sample bookings`);

  console.log('\n✅ Demo seed complete!');
  console.log('\n📋 Providers seeded:');
  console.log('  1. La Trattoria Roma — Italian, Amsterdam (Prinsengracht)');
  console.log('  2. Sakura Japanese Kitchen — Japanese/Omakase, Amsterdam-Zuid');
  console.log('  3. Café de Jordaan — Dutch café/brunch, Amsterdam Jordaan');
  console.log('  4. Le Marais Bistro — French bistro, Amsterdam Oud-Zuid');
  console.log('  5. The Harbour Kitchen — Seafood, Rotterdam waterfront');
  console.log('  6. Habibi Lebanese Kitchen — Lebanese/vegan, Amsterdam De Pijp');
  console.log('\n🗓️  Availability: 14 days from today');
  console.log('📦 Bookings: 12 sample bookings across all providers');
  console.log('👥 Customers: 8 sample customer leads');
}

seedDemo()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
