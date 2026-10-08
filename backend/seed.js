require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("./src/config/database");
const User = require("./src/models/User");
const Restaurant = require("./src/models/Restaurant");
const Category = require("./src/models/Category");
const MenuItem = require("./src/models/MenuItem");
const Cart = require("./src/models/Cart");
const Order = require("./src/models/Order");
const Review = require("./src/models/Review");
const Product = require("./models/Product");

const restaurantSeeds = [
  { name: "Food World Downtown", city: "Karachi", address: "12 Main Boulevard, Clifton", phone: "+923001112233", email: "downtown@foodworld.test", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200" },
  { name: "Food World North", city: "Karachi", address: "45 University Road, Gulshan", phone: "+923004445566", email: "north@foodworld.test", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200" },
  { name: "Food World Lahore", city: "Lahore", address: "89 MM Alam Road", phone: "+923007778899", email: "lahore@foodworld.test", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200" },
];
const categories = ["Burgers", "Pizza", "Shawarma", "Drinks", "Desserts"];
const menuTemplates = [
  ["Classic Beef Burger", "Grilled beef, cheddar and house sauce", 749], ["Crispy Zinger Burger", "Crispy chicken with fresh lettuce", 699],
  ["Chicken Fajita Pizza", "Spiced chicken, peppers and mozzarella", 1499], ["Margherita Pizza", "Tomato, mozzarella and basil", 1199],
  ["Chicken Shawarma", "Marinated chicken and garlic sauce", 499], ["Arabic Shawarma", "Shawarma platter with fries and dip", 699],
  ["Fresh Mango Juice", "Freshly pressed mango juice", 350], ["Cola Can", "Chilled sparkling cola", 150],
  ["Chocolate Brownie", "Warm brownie with chocolate sauce", 420], ["Vanilla Sundae", "Creamy vanilla ice cream", 300],
];

async function seed() {
  await connectDatabase();
  await Promise.all([Review.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({}), MenuItem.deleteMany({}), Category.deleteMany({}), Restaurant.deleteMany({}), User.deleteMany({}), Product.deleteMany({})]);
  const users = await User.create([
    { name: "Platform Admin", email: "admin@foodworld.test", phone: "+923000000001", password: "AdminPassword123!", role: "super_admin" },
    { name: "Ayesha Restaurant", email: "ayesha@foodworld.test", phone: "+923000000002", password: "AdminPassword123!", role: "restaurant_admin" },
    { name: "Bilal Restaurant", email: "bilal@foodworld.test", phone: "+923000000003", password: "AdminPassword123!", role: "restaurant_admin" },
    { name: "Customer One", email: "customer1@foodworld.test", phone: "+923000000004", password: "Customer123!", role: "customer" },
    { name: "Customer Two", email: "customer2@foodworld.test", phone: "+923000000005", password: "Customer123!", role: "customer" },
    { name: "Customer Three", email: "customer3@foodworld.test", phone: "+923000000006", password: "Customer123!", role: "customer" },
  ]);
  const admins = users.filter((user) => user.role === "restaurant_admin");
  const restaurants = await Restaurant.create(restaurantSeeds.map((restaurant, index) => ({ ...restaurant, description: "Fresh, fast food prepared to order.", owner: admins[index % admins.length]._id, isOpen: true, isActive: true, openingTime: "09:00", closingTime: "23:00" })));
  const allProducts = [];
  for (const restaurant of restaurants) {
    const createdCategories = await Category.create(categories.map((name, index) => ({ restaurant: restaurant._id, name, description: `${name} at ${restaurant.name}`, sortOrder: index + 1, isActive: true })));
    const menuItems = await MenuItem.create(menuTemplates.map(([name, description, price], index) => ({ restaurant: restaurant._id, category: createdCategories[Math.floor(index / 2)]._id, name, description, price, discountPrice: index % 3 === 0 ? price - 50 : null, image: `https://images.unsplash.com/photo-${index % 2 ? "1550547660-d9450f859349" : "1568901346375-23c9450c58cd"}?w=800`, ingredients: ["Fresh ingredients", "House seasoning"], preparationTime: 10 + index, isAvailable: true, isActive: true })));
    allProducts.push(...menuItems.map((item) => ({ name: item.name, title: item.name, image: item.image, description: item.description, price: item.discountPrice || item.price, category: categories[Math.floor(menuItems.indexOf(item) / 2)], stock_quantity: 40, low_stock_threshold: 10, is_available: true })));
  }
  await Product.insertMany(allProducts);
  console.log(`Seeded ${users.length} users, ${restaurants.length} restaurants, ${restaurants.length * categories.length} categories and ${allProducts.length} menu items.`);
}

seed().catch((error) => { console.error("Seed failed:", error); process.exitCode = 1; }).finally(async () => mongoose.connection.close());
