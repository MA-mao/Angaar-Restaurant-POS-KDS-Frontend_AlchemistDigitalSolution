export const DEFAULT_SETTINGS = {
  restaurantName: "ANGAAR",
  tagline: "Ate & Left No Crumbs.",
  address: "Main Boulevard, Karachi",
  phone: "+92 300 0000000",
  currency: "Rs.",
  taxRate: 0.13, // 13%, editable from the Manager view
  deliveryFee: 150,
  kdsWarnMinutes: 10, // ticket turns amber
  kdsLateMinutes: 15, // ticket turns red
};

/* ---------- Demo users (frontend-only auth, replace with a real API) ---------- */
export const DEMO_USERS = [
  { id: "u_cashier", username: "cashier", password: "cashier123", name: "Ayesha (Cashier)", role: "cashier" },
  { id: "u_kitchen", username: "kitchen", password: "kitchen123", name: "Chef Bilal (Kitchen)", role: "kitchen" },
  { id: "u_manager", username: "manager", password: "manager123", name: "Hamza (Manager)", role: "manager" },
];

/* ---------- Menu ---------- */
const burgerSizes = [
  { id: "single", name: "Single", priceDelta: 0 },
  { id: "double", name: "Double", priceDelta: 250 },
];
const burgerAddOns = [
  { id: "cheese", name: "Extra Cheese", price: 80 },
  { id: "sauce", name: "Extra Sauce", price: 40 },
  { id: "jalapeno", name: "Jalapenos", price: 50 },
  { id: "fries", name: "Add Fries", price: 150 },
];

const pizzaSizes = [
  { id: "small", name: 'Small (7")', priceDelta: -300 },
  { id: "medium", name: 'Medium (10")', priceDelta: 0 },
  { id: "large", name: 'Large (14")', priceDelta: 450 },
];
const pizzaAddOns = [
  { id: "cheese", name: "Extra Cheese", price: 150 },
  { id: "crust", name: "Stuffed Crust", price: 200 },
  { id: "toppings", name: "Extra Toppings", price: 120 },
  { id: "dip", name: "Garlic Dip", price: 60 },
];

const drinkSizes = [
  { id: "regular", name: "Regular", priceDelta: 0 },
  { id: "large", name: "Large", priceDelta: 80 },
];
const coffeeAddOns = [
  { id: "shot", name: "Extra Shot", price: 70 },
  { id: "cream", name: "Whipped Cream", price: 50 },
];
const dessertAddOns = [
  { id: "icecream", name: "Ice Cream Scoop", price: 100 },
  { id: "choco", name: "Chocolate Sauce", price: 50 },
];
const dealAddOns = [{ id: "drink", name: "Extra Drink", price: 120 }];

function item(id, name, category, basePrice, description, emoji, variants = [], addOns = []) {
  return { id, name, category, basePrice, description, emoji, available: true, variants, addOns };
}

export const SEED_MENU = [
  // Burgers
  item("m_smash", "Angaar Smash Burger", "Burgers", 650, "Double-seared beef patty, cheddar, house angaar sauce.", "🍔", burgerSizes, burgerAddOns),
  item("m_zinger", "Tandoori Zinger", "Burgers", 590, "Crispy chicken, tandoori mayo, lettuce.", "🍔", burgerSizes, burgerAddOns),
  item("m_chapli", "Chapli Beef Burger", "Burgers", 690, "Spiced chapli patty, onion rings, mint chutney.", "🍔", burgerSizes, burgerAddOns),
  item("m_classic", "Classic Chicken Burger", "Burgers", 490, "Grilled chicken, cheese slice, pickles.", "🍔", burgerSizes, burgerAddOns),
  item("m_bbq", "BBQ Beef Stack", "Burgers", 850, "Smoky BBQ beef, caramelised onion, crispy bacon.", "🍔", burgerSizes, burgerAddOns),

  // Pizzas (base price = Medium)
  item("m_tikka", "Chicken Tikka Pizza", "Pizzas", 1100, "Tikka chunks, onions, green chilli, mozzarella.", "🍕", pizzaSizes, pizzaAddOns),
  item("m_fajita", "Fajita Pizza", "Pizzas", 1150, "Fajita chicken, capsicum, olives.", "🍕", pizzaSizes, pizzaAddOns),
  item("m_pepperoni", "Pepperoni Pizza", "Pizzas", 1250, "Beef pepperoni, double mozzarella.", "🍕", pizzaSizes, pizzaAddOns),
  item("m_margherita", "Margherita", "Pizzas", 890, "Tomato, basil, fresh mozzarella.", "🍕", pizzaSizes, pizzaAddOns),
  item("m_malai", "Malai Boti Pizza", "Pizzas", 1200, "Creamy malai boti, mozzarella, coriander.", "🍕", pizzaSizes, pizzaAddOns),

  // Drinks
  item("m_margarita", "Mint Margarita", "Drinks", 250, "Fresh mint, lemon, soda.", "🥤", drinkSizes),
  item("m_chai", "Doodh Patti Chai", "Drinks", 150, "Slow-brewed desi chai.", "☕", []),
  item("m_coldcoffee", "Cold Coffee", "Drinks", 380, "Blended coffee, milk, ice.", "🧋", drinkSizes, coffeeAddOns),
  item("m_latte", "Iced Latte", "Drinks", 420, "Espresso over milk and ice.", "🧋", drinkSizes, coffeeAddOns),
  item("m_soft", "Soft Drink", "Drinks", 120, "Cola, lemon-lime or orange.", "🥤", drinkSizes),

  // Desserts
  item("m_lava", "Molten Lava Cake", "Desserts", 450, "Warm chocolate cake, gooey centre.", "🍰", [], dessertAddOns),
  item("m_cheesecake", "Gulab Jamun Cheesecake", "Desserts", 520, "Baked cheesecake with gulab jamun.", "🍰", [], dessertAddOns),
  item("m_kunafa", "Kunafa Bowl", "Desserts", 480, "Crispy kunafa, cream, pistachio.", "🍮", [], dessertAddOns),
  item("m_brownie", "Brownie Sizzler", "Desserts", 420, "Hot brownie, ice cream, chocolate sauce.", "🍨", [], dessertAddOns),

  // Deals
  item("m_solo", "Solo Deal", "Deals", 990, "1 burger + fries + drink.", "🎁", [], dealAddOns),
  item("m_couple", "Couple Deal", "Deals", 2190, "2 burgers + large fries + 2 drinks.", "🎁", [], dealAddOns),
  item("m_family", "Family Deal", "Deals", 3990, "Large pizza + 4 burgers + fries + 1.5L drink.", "🎁", [], dealAddOns),
  item("m_student", "Student Deal", "Deals", 790, "Zinger + drink + brownie.", "🎁", [], dealAddOns),
];

/* ---------- Tables ---------- */
const capacities = [2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 8, 8];

export const SEED_TABLES = capacities.map((capacity, i) => ({
  id: `t_${i + 1}`,
  number: i + 1,
  capacity,
  status: "available",
  currentOrderId: null,
}));
