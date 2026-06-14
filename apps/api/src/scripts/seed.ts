import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";
import Product from "../models/Product";

const sellers = [
  { email: "gearshift@demo.com", password: "Demo1234!", name: "GearShift Collectibles", role: "seller" as const },
  { email: "stadiumvault@demo.com", password: "Demo1234!", name: "StadiumVault", role: "seller" as const },
  { email: "figureforge@demo.com", password: "Demo1234!", name: "FigureForge", role: "seller" as const },
];

const buyer = { email: "buyer@demo.com", password: "Demo1234!", name: "Demo Buyer", role: "buyer" as const };

interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: "buyer" | "seller";
}

const upsertDemoUser = async (data: DemoUser) => {
  let user = await User.findOne({ email: data.email });

  if (!user) {
    user = new User(data);
  } else {
    user.name = data.name;
    user.role = data.role;
    user.password = data.password;
  }

  await user.save();
  return user;
};

const products = [
  // Cars — GearShift Collectibles
  { sellerEmail: "gearshift@demo.com", title: "Hot Wheels '69 Camaro Premium", description: "Premium Hot Wheels '69 Camaro in original packaging. Spectraflame paint with detailed interior.", price: 1200, category: "Cars", subcategory: "Hot Wheels", condition: "Mint in Box", scale: "1:64", stock: 3, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Tomica Toyota Supra", description: "Japanese domestic market Tomica Toyota Supra. Opening doors, detailed engine bay.", price: 1500, category: "Cars", subcategory: "Tomica", condition: "Near Mint", scale: "1:64", stock: 2, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Kyosho Ferrari 250 GTO", description: "High-detail Kyosho Ferrari 250 GTO. Hand-assembled with photo-etched parts.", price: 6500, category: "Cars", subcategory: "Kyosho", condition: "Mint in Box", scale: "1:43", stock: 1, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Maisto Ford Mustang GT", description: "Die-cast Ford Mustang GT with opening hood, doors, and trunk. Rubber tires.", price: 3200, category: "Cars", subcategory: "Maisto", condition: "Good", scale: "1:18", stock: 4, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Matchbox Volkswagen Beetle", description: "Classic Matchbox VW Beetle. Vintage casting with patina on the base plate.", price: 800, category: "Cars", subcategory: "Matchbox", condition: "Used", scale: "1:64", stock: 5, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Bburago Lamborghini Aventador", description: "Bburago Lamborghini Aventador LP700-4. Scissor doors open, detailed V12 engine.", price: 2400, category: "Cars", subcategory: "Bburago", condition: "Near Mint", scale: "1:24", stock: 2, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Hot Wheels RLC Porsche 911", description: "Red Line Club exclusive Porsche 911. Limited edition with real riders wheels.", price: 4500, category: "Cars", subcategory: "Hot Wheels", condition: "Mint in Box", scale: "1:64", stock: 1, images: [] },
  { sellerEmail: "gearshift@demo.com", title: "Norev Mercedes 300SL", description: "Norev Mercedes-Benz 300SL Gullwing. Museum-quality detail with opening gullwing doors.", price: 12000, category: "Cars", subcategory: "Norev", condition: "Mint in Box", scale: "1:18", stock: 1, images: [] },

  // Sports — StadiumVault
  { sellerEmail: "stadiumvault@demo.com", title: "Rookie Card — Basketball Star", description: "Graded rookie card of an emerging basketball talent. PSA 8 grade, protective case included.", price: 3500, category: "Sports", subcategory: "Trading Card", condition: "Near Mint", stock: 1, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Vintage Baseball Card Set (10pc)", description: "Set of 10 vintage baseball cards from the golden era. Cards range from 1955-1965.", price: 2800, category: "Sports", subcategory: "Trading Card", condition: "Good", stock: 2, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Stadium Bobblehead — Pitcher", description: "Limited stadium giveaway bobblehead of legendary pitcher. Original box with certificate.", price: 3800, category: "Sports", subcategory: "Bobblehead", condition: "Mint in Box", stock: 3, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Limited Edition Soccer Bobblehead", description: "World Cup commemorative soccer bobblehead. Numbered edition, hand-painted details.", price: 4500, category: "Sports", subcategory: "Bobblehead", condition: "Near Mint", stock: 2, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Mini Championship Trophy Replica", description: "1:4 scale replica of championship trophy. Heavy zinc alloy with gold-tone finish.", price: 3000, category: "Sports", subcategory: "Trophy", condition: "Mint in Box", stock: 4, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Signed Jersey Display Frame", description: "Professional shadow box frame with authenticated signed jersey. UV-protective glass.", price: 5500, category: "Sports", subcategory: "Memorabilia", condition: "Good", stock: 1, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Football Helmet Miniature", description: "Riddell mini helmet with authentic team decals. Perfect desk display piece.", price: 2600, category: "Sports", subcategory: "Memorabilia", condition: "Near Mint", stock: 3, images: [] },
  { sellerEmail: "stadiumvault@demo.com", title: "Boxing Gloves Display Set", description: "Pair of signed miniature boxing gloves in acrylic display case. Certificate of authenticity.", price: 4200, category: "Sports", subcategory: "Memorabilia", condition: "Mint in Box", stock: 2, images: [] },

  // Action Figures — FigureForge
  { sellerEmail: "figureforge@demo.com", title: "Armored Hero Figure 6\"", description: "Highly articulated 6-inch armored hero figure. Multiple interchangeable hands and accessories.", price: 2400, category: "Action Figures", subcategory: "Superhero", condition: "Mint in Box", stock: 5, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Dark Knight Vigilante Figure", description: "Premium 7-inch Dark Knight figure with fabric cape and magnetic grapple accessories.", price: 3200, category: "Action Figures", subcategory: "Superhero", condition: "Near Mint", stock: 3, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Samurai Warrior Anime Figure", description: "Import anime figure with dynamic pose. Metallic paint effects on armor, scenic base included.", price: 3800, category: "Action Figures", subcategory: "Anime", condition: "Mint in Box", stock: 2, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Mecha Pilot Series Vol.3", description: "Mecha pilot figure from popular anime series. Includes miniature cockpit display stand.", price: 2000, category: "Action Figures", subcategory: "Anime", condition: "Good", stock: 4, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "WWII Infantry Soldier Set (6pc)", description: "Set of 6 WWII infantry soldiers. Historically accurate uniforms and gear, 1:18 scale.", price: 2800, category: "Action Figures", subcategory: "Military", condition: "Near Mint", stock: 3, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Special Forces Operator Figure", description: "Modern special forces operator figure with night vision, rifle, and tactical gear.", price: 2200, category: "Action Figures", subcategory: "Military", condition: "Mint in Box", stock: 6, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Space Marine Trooper", description: "Futuristic space marine trooper in power armor. LED light-up visor, magnetic weapon mounts.", price: 3000, category: "Action Figures", subcategory: "Sci-Fi", condition: "Near Mint", stock: 2, images: [] },
  { sellerEmail: "figureforge@demo.com", title: "Alien Commander Figure", description: "Alien commander figure with bio-mechanical design. Glow-in-dark accents, articulated tail.", price: 4400, category: "Action Figures", subcategory: "Sci-Fi", condition: "Mint in Box", stock: 2, images: [] },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Upsert buyer
  await upsertDemoUser(buyer);
  console.log("Buyer seeded");

  // Upsert sellers
  const sellerDocs: Record<string, any> = {};
  for (const seller of sellers) {
    const doc = await upsertDemoUser(seller);
    sellerDocs[seller.email] = doc;
  }
  console.log("Sellers seeded");

  // Upsert products
  for (const p of products) {
    const seller = sellerDocs[p.sellerEmail];
    const { sellerEmail: _sellerEmail, ...productData } = p;
    await Product.findOneAndUpdate(
      { title: productData.title, seller: seller._id },
      { ...productData, seller: seller._id },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }
  console.log(`${products.length} products seeded`);

  await mongoose.disconnect();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
