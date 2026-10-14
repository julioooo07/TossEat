export const CHICKEN_WING_FLAVOR_GROUPS = [
  { label: 'Powdered', flavors: ['Salted Egg', 'Garlic Parmesan', '4 Spice'] },
  {
    label: 'Sauced',
    flavors: [
      'Picante Parmigiano', 'Tex Mex', 'Buffalo', 'Banabana', 'BBQ', 'Spicy Korean',
      'Chili Honey', 'Honey Mustard', 'Picaso Mostaza', 'Dulce Picante', 'Soubise',
      'Moutarde', 'Soy Garlic', 'Crimson Glaze', 'Spicy Queso', 'Mango Pepper', 'Teriyaki'
    ]
  }
];

export const CHICKEN_WING_FLAVORS = CHICKEN_WING_FLAVOR_GROUPS.flatMap(group => group.flavors);

export const menuItems = [
  {
    id: 401,
    name: 'Ala Carte Chicken Wings',
    price: 299,
    category: 'CHICKENWINGS',
    description: '8 pieces of chicken wings with one flavor of your choice. Add a second flavor for ₱10.',
    image: '/images/8pcs wings.jpg',
    variants: [{ label: '8 pcs — 1 flavor', price: 299 }],
    hasFlavor: true,
    flavors: CHICKEN_WING_FLAVORS,
    flavorGroups: CHICKEN_WING_FLAVOR_GROUPS,
    extraFlavorPrice: 10
  },
  {
    id: 402,
    name: 'Unlimited Wings & Rice',
    price: 409,
    category: 'UNLIMITEDWINGS',
    description: 'Unlimited chicken wings and rice — ₱409 per person. Choose a flavor for your order.',
    image: '/images/12pcs wings.jpg',
    hasFlavor: true,
    flavors: CHICKEN_WING_FLAVORS,
    flavorGroups: CHICKEN_WING_FLAVOR_GROUPS,
    isUnlimitedWings: true,
    notes: '₱409 per head. See the house rules below before ordering.'
  },
  {
    id: 904,
    name: 'Fries',
    price: 70,
    category: 'ADDONS',
    description: 'Plain fries ₱70 or spiced fries ₱80.',
    image: '/images/Fries.jpg',
    variants: [
      { label: 'Plain Fries', price: 70 },
      { label: 'Spiced Fries', price: 80 }
    ]
  },
  { id: 905, name: 'Aioli Dip', price: 30, category: 'DIPS', description: 'Aioli dipping sauce.', image: '/images/Cheesy Beef Fries.jpg' },
  { id: 906, name: 'Sriracha Mayo Dip', price: 30, category: 'DIPS', description: 'Sriracha mayonnaise dipping sauce.', image: '/images/Cheesy Beef Fries.jpg' },
  { id: 907, name: 'Cheese Sauce Dip', price: 30, category: 'DIPS', description: 'Cheese dipping sauce.', image: '/images/Cheesy Beef Fries.jpg' },
  {
    id: 908,
    name: 'Nestlé House Blend Iced Tea',
    category: 'DRINKS',
    description: 'Single serving or unlimited iced tea.',
    image: '/images/Classic.jpg',
    variants: [{ label: 'Single', price: 50 }, { label: 'Unlimited', price: 70 }]
  },
  {
    id: 909,
    name: 'Nestlé Cucumber Lemonade',
    category: 'DRINKS',
    description: 'Single serving or unlimited cucumber lemonade.',
    image: '/images/Cucumber Lemon.jpg',
    variants: [{ label: 'Single', price: 50 }, { label: 'Unlimited', price: 70 }]
  },
  { id: 910, name: 'Nestlé Juice Pitcher', price: 200, category: 'DRINKS', description: 'Juice pitcher for sharing.', image: '/images/Strawberry (2).jpg' },
  { id: 911, name: 'Soda in Can', price: 60, category: 'DRINKS', description: 'Canned soda.', image: '/images/Green Apple.jpg' },
  { id: 912, name: 'Pineapple Juice', price: 70, category: 'DRINKS', description: 'Pineapple juice.', image: '/images/Mango.jpg' },
  { id: 913, name: 'Soda 1.5 Liters', price: 150, category: 'DRINKS', description: '1.5-liter soda bottle.', image: '/images/Green Apple.jpg' },
  { id: 914, name: 'Bottled Water', price: 35, category: 'DRINKS', description: 'Bottled water.', image: '/images/Cucumber Lemon.jpg' },
  {
    id: 915,
    name: 'Bottomless Juice Upgrade',
    category: 'DRINKS',
    description: 'Add bottomless juice to an ala carte wings order.',
    image: '/images/Classic.jpg',
    variants: [{ label: 'House Blend Iced Tea', price: 40 }, { label: 'Cucumber Lemonade', price: 40 }]
  }
];
