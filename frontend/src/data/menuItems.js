// Define the flavor arrays at the top
export const CHICKEN_WING_FLAVORS = [
  'PARMESAN CHEESE',
  'HICKORY BBQ',
  'SPICY SALTED EGG',
  'SALTED EGG',
  'BUFFALO',
  'HONEY LEMON GLAZE',
  'TERIYAKI',
  'ORANGE ZEST',
  'SPICY KOREAN BBQ',
  'SOY GARLIC',
  'SWEET & SOUR',
  'HONEY SRIRACHA',
  'BBQ PEANUT',
  'MANGO HABANERO',
  'SRIRACHA',
  'GARLIC PARMESAN',
  'SWEET CHILI',
  'SPICED MAPLE'
];

export const FRIES_FLAVORS = ['Cheese', 'BBQ', 'Sour Cream'];

export const menuItems = [
    {
      id: 101,
      name: "Red Pasta Meatballs",
      price: 155,
      category: "PASTA",
      description: "Spaghetti with tasty tomato sauce, juicy meatballs, and cheese. Served with garlic bread.",
      image: "/images/PASTA 2.jpg"
    },
    {
      id: 102,
      name: "White Pasta Hungarian",
      price: 165,
      category: "PASTA",
      description: "Creamy white sauce pasta with Hungarian sausage and mushroom. Comes with garlic bread.",
      image: "/images/PASTA1.jpg"
    },
    {
      id: 103,
      name: "Spinach Salmon Pasta",
      price: 185,
      category: "PASTA",
      description: "Pasta with spinach sauce and salmon on top. Served with garlic bread.",
      image: "/images/PASTA 3.jpg"
    },

    {
      id: 201,
      name: "Combo Meal 1",
      price: 170,
      category: "COMBOMEALS",
      description: "Cheesy Bacon or TLC Burger + 12oz Lemon/Fruit Tea + French Fries.",
      image: "/images/COMBO1.jpg",
      hasFlavor: true,
      flavors: ["Cheesy Bacon Burger", "TLC Burger"],
      notes: "Upgrade to Milk Tea or Frappe for +₱30"
    },
    {
      id: 202,
      name: "Combo Meal 2",
      price: 160,
      category: "COMBOMEALS",
      description: "Beef or Bacon Hotdog Sandwich + 12oz Lemon/Fruit Tea + Fries.",
      image: "/images/COMBO2.jpg",
      hasFlavor: true,
      flavors: ["Beef Hotdog Sandwich", "Bacon Hotdog Sandwich"],
      notes: "Upgrade to Milk Tea or Frappe for +₱30"
    },
    {
      id: 203,
      name: "Combo Meal 3",
      price: 150,
      category: "COMBOMEALS",
      description: "3-pc chicken wings with rice + 12oz Lemon/Fruit Tea.",
      image: "/images/COMBO3.jpg",
      notes: "Upgrade to Milk Tea or Frappe for +₱30"
    },
    {
      id: 204,
      name: "Combo Meal 4",
      price: 200,
      category: "COMBOMEALS",
      description: "Aloha Burger + 12oz Lemon/Fruit Tea + French Fries.",
      image: "/images/COMBO4.jpg",
      notes: "Upgrade to Milk Tea or Frappe for +₱30"
    },
    {
      id: 205,
      name: "Combo Meal 5",
      price: 190,
      category: "COMBOMEALS",
      description: "Bacon Cream Cheese Burger + 12oz Lemon/Fruit Tea + French Fries.",
      image: "/images/COMBO5.jpg",
      notes: "Upgrade to Milk Tea or Frappe for +₱30"
    },

    {
      id: 301,
      name: "Nook’s Steak",
      price: 115,
      category: "RICEMEALS",
      description: "Tender beef steak with rice, egg, and vegetables.",
      image: "/images/NOOK STEAK.jpg",
      variants: [
        { label: "1 pc", price: 115 },
        { label: "2 pcs", price: 160 }
      ]
    },
    {
      id: 302,
      name: "Hungarian Meal",
      price: 110,
      category: "RICEMEALS",
      description: "Grilled Hungarian sausage with rice, egg, and vegetables.",
      image: "/images/HUNGARIAN MEAL.jpg"
    },
    {
      id: 303,
      name: "Tonkatsu Meal",
      price: 115,
      category: "RICEMEALS",
      description: "Crispy breaded pork cutlet with rice, egg, and vegetables.",
      image: "/images/TONKATSU MEAL.jpg"
    },
    {
      id: 304,
      name: "Chicken Fillet Meal",
      price: 120,
      category: "RICEMEALS",
      description: "Crunchy chicken fillet with rice, egg, and vegetables.",
      image: "/images/CHICKEN FILLET.jpg"
    },

    {
      id: 305,
      name: "Rice (per cup)",
      price: 20,
      category: "ADDONS",
      description: "Extra rice for any meal.",
      image: "/images/Rice.jpg"
    },

    {
      id: 401,
      name: "Wings (Ala Carte / With Rice)",
      price: 120,
      category: "CHICKENWINGS",
      description: "Pick your size. Choose your favorite flavor.",
      image: "/images/3pcs.jpg",
      variants: [
        { label: "3 pcs + Rice", price: 120 },
        { label: "6 pcs", price: 185 },
        { label: "8 pcs", price: 235 },
        { label: "12 pcs", price: 320 }
      ],
      hasFlavor: true,
      flavors: CHICKEN_WING_FLAVORS,
      isChickenWings: true
    },


    {
      id: 501,
      name: "Chicken Bilao Wings",
      price: 675,
      category: "CHICKENBILAO",
      description: "Perfect for sharing. Multiple flavors allowed.",
      image:"/images/bilao.jpg",
      variants: [
        { label: "24 pcs (choose 4 flavors)", price: 675, maxFlavors: 4 },
        { label: "32 pcs (choose 6 flavors)", price: 850, maxFlavors: 6 },
        { label: "40 pcs (choose 8 flavors)", price: 1050, maxFlavors: 8 }
      ],
      isBilao: true
    },


    {
      id: 601,
      name: "Garlic & Cheese",
      price: 270,
      category: "PIZZA",
      description: "Crispy crust topped with creamy cheese and garlic flavor.",
      image: "/images/CHEESE GARLIC.jpg"
    },
    {
      id: 602,
      name: "Beef & Mushroom",
      price: 275,
      category: "PIZZA",
      description: "Savory beef and tender mushrooms on a cheesy pizza base.",
      image: "/images/BEEF MUSHROOM.jpg"
    },
    {
      id: 603,
      name: "Chicken Alfredo",
      price: 275,
      category: "PIZZA",
      description: "Creamy white sauce pizza with chicken chunks and cheese.",
      image: "/images/CHICKEN ALFREDO.jpg"
    },
    {
      id: 604,
      name: "Bacon & Cheese Burger",
      price: 280,
      category: "PIZZA",
      description: "Tastes like a burger—bacon, beef, and cheese on pizza dough.",
      image: "/images/BACON CHEESE BURGER.jpg"
    },
    {
      id: 605,
      name: "Smokey Bacon",
      price: 290,
      category: "PIZZA",
      description: "Smoky, crispy bacon with melted cheese on a golden crust.",
      image: "/images/SMOKEY BACON.jpg"
    },

    {
      id: 701,
      name: "HNB #1",
      price: 195,
      category: "BENTOMEALS",
      description: "Rice, 1 flavor of wings, and flavor of fries. (Pizza slice random.)",
      image: "/images/hnb1.jpg"
    },
    {
      id: 702,
      name: "HNB #2",
      price: 220,
      category: "BENTOMEALS",
      description: "Choose TLC or Bacon Burger + 1 wing flavor + flavored fries. (Pizza slice random.)",
      image: "/images/hnb2.jpg",
      hasFlavor: true,
      flavors: ["TLC Burger", "Bacon Burger"]
    },
    {
      id: 703,
      name: "HNB #3",
      price: 265,
      category: "BENTOMEALS",
      description: "Choose 2 TLC or Bacon Burgers + flavored fries. (2 random pizza slices.)",
      image: "/images/hnb3.jpg",
      hasFlavor: true,
      flavors: ["2x TLC Burgers", "2x Bacon Burgers", "1x TLC + 1x Bacon"]
    },

    { id: 801,
      name: "Cheesy Beef Hotdog", 
      price: 85, 
      category: "SANDWICHES", 
      description: "Hotdog with beef and cheese in a soft bun.", 
      image: "/images/CHEESY BEEF HOTDOG.jpg"
    },

    { id: 802, 
      name: "Cheesy Bacon Hotdog", 
      price: 85, 
      category: "SANDWICHES", 
      description: "Hotdog with bacon and cheese.", 
      image: "/images/CHEESY BACON HOTDOG.jpg"
    },

    { id: 803, 
      name: "Chicken Fillet Sandwich", 
      price: 90, 
      category: "SANDWICHES", 
      description: "Crispy chicken fillet with lettuce and sauce.", 
      image: "/images/CHICKEN SANDWICH.jpg"
    },

    { id: 804, 
      name: "Cheesy Hungarian", 
      price: 100, 
      category: "SANDWICHES", 
      description: "Hungarian sausage with melted cheese.", 
      image: "/images/CHEESY HUNGARIAN.jpg"
    },

    { id: 901, 
      name: "Cheesy Beef Fries", 
      price: 90, 
      category: "FRIESNACHOS", 
      description: "Fries topped with beef and melted cheese.", 
      image: "/images/Cheesy Beef Fries.jpg"
    },

    { id: 902, 
      name: "Cheesy Beef Nachos", 
      price: 90, category: "FRIESNACHOS", 
      escription: "Nachos loaded with beef and cheese.", 
      image: "/images/Cheesy Beef Nachos.jpg"
    },

    { id: 903,
      name: "Nachos Fries", 
      price: 100, 
      category: "FRIESNACHOS", 
      description: "Fries with nacho toppings: beef, cheese, crunchy bits.", 
      image: "/images/Nachos Fries.jpg" 
    },

    {
      id: 904,
      name: "French Fries",
      price: 50,
      category: "FRIES",
      description: "Choose flavor: Cheese, BBQ, or Sour Cream.",
      image: "/images/Fries.jpg",
      variants: [
        { label: "Small", price: 50 },
        { label: "Medium", price: 65 },
        { label: "Large", price: 80 }
      ],
      hasFlavor: true,
      flavors: FRIES_FLAVORS,
      isFries: true
    },

    { id: 1001, 
      name: "Nook’s Burger", 
      price: 90, 
      category: "BURGERS",
      description: "Beef patty with cheese slice & sauces.", 
      image:"/images/Nook's Burger.jpg"
    },

    { id: 1002, 
      name: "Cheesy Bacon Burger", 
      price: 105, 
      category: "BURGERS", 
      description: "Beef patty with bacon and cheese.", 
      image:"/images/Cheesy Bacon Burger.jpg" 
    },

    { id: 1003, 
      name: "TLC Burger", 
      price: 105, 
      category: "BURGERS", 
      description: "Beef patty with tomato, lettuce, and cheese.", 
      image:"/images/TLC Burger.jpg"  
    },

    { id: 1004, 
      name: "Double Burger", 
      price: 145, 
      category: "BURGERS", 
      description: "Two beef patties with sauces.", 
      image: "/images/TLC Burger.jpg"
    },

    { id: 1005, 
      name: "Aloha Burger", 
      price: 150, 
      category: "BURGERS",
      description: "Beef patty with cheese and pineapple.", 
      image: "/images/Aloha Burger.jpg"
    },

    { id: 1006, 
      name: "Bacon Creamcheese Burger", 
      price: 150, 
      category: "BURGERS", 
      description: "Beef patty with bacon and cream cheese.", 
      image: "/images/Bacon Creamcheese Burger.jpg"
     },

   
    {
      id: 1100,
      name: "Wintermelon",
      category: "CLASSICMILKTEA",
      description: "Sweet caramel-like flavor with chewy pearls.",
      image: "/images/WINTERMELON.jpg",
      variants: [
        { label: "M", price: 100 },
        { label: "L", price: 120 }
      ]
    },
    {
      id: 1101,
      name: "Matcha",
      category: "CLASSICMILKTEA",
      description: "Earthy green tea with milk and chewy pearls.",
      image: "/images/MATCHA.jpg",
      variants: [
        { label: "M", price: 110 },
        { label: "L", price: 130 }
      ]
    },
    {
      id: 1102,
      name: "Chocolate",
      category: "CLASSICMILKTEA",
      description: "Creamy chocolate milk tea with pearls.",
      image: "/images/WINTERMELON.jpg",
      variants: [
        { label: "M", price: 115 },
        { label: "L", price: 135 }
      ]
    },
    {
      id: 1103,
      name: "Cookies & Cream",
      category: "CLASSICMILKTEA",
      description: "Cookie bits in creamy milk tea with pearls.",
      image: "/images/OREO.jpg",
      variants: [
        { label: "M", price: 120 },
        { label: "L", price: 140 }
      ]
    },
    {
      id: 1104,
      name: "Dark Chocolate",
      category: "CLASSICMILKTEA",
      description: "Bold chocolate flavor with pearls.",
      image: "/images/DARK CHOCOATE.jpg",
      variants: [
        { label: "M", price: 120 },
        { label: "L", price: 145 }
      ]
    },
    {
      id: 1105,
      name: "Okinawa",
      category: "CLASSICMILKTEA",
      description: "Brown sugar milk tea with pearls.",
      image: "/images/OKINAWA.jpg",
      variants: [
        { label: "M", price: 115 },
        { label: "L", price: 140 }
      ]
    },

    {
      id: 1200,
      name: "Mango Graham",
      category: "MANGOSHAKESERIES",
      description: "Mango shake with pearls and crushed grahams.",
      image: "/images/Mango Graham.jpg",
      variants: [
        { label: "M", price: 125 },
        { label: "L", price: 150 }
      ]
    },
    {
      id: 1201,
      name: "Mango Supreme",
      category: "MANGOSHAKESERIES",
      description: "Mango shake with pearls and whipped cream on top.",
      image: "/images/Mango Supreme.jpg",
      variants: [
        { label: "M", price: 135 },
        { label: "L", price: 160 }
      ]
    },
    {
      id: 1202,
      name: "Mango Extreme",
      category: "MANGOSHAKESERIES",
      description: "Mango shake with pearls and ice cream on top.",
      image: "/images/Mango Extreme.jpg",
      variants: [
        { label: "M", price: 145 },
        { label: "L", price: 175 }
      ]
    },
    {
      id: 1203,
      name: "Mango Overload",
      category: "MANGOSHAKESERIES",
      description: "Mango shake with pearls, whipped cream, and ice cream on top.",
      image: "/images/Mango Overload.jpg",
      variants: [
        { label: "M", price: 155 },
        { label: "L", price: 185 }
      ]
    },

    {
      id: 1300,
      name: "Cappuccino Frappe",
      category: "FRAPPE",
      description: "Coffee frappe with whipped cream and syrup.",
      image: "/images/Cappuccino.jpg",
      variants: [
        { label: "M", price: 130 },
        { label: "L", price: 155 }
      ]
    },
    {
      id: 1301,
      name: "Strawberry Frappe",
      category: "FRAPPE",
      description: "Strawberry frappe with whipped cream and syrup.",
      image: "/images/Strawberry.jpg",
      variants: [
        { label: "M", price: 135 },
        { label: "L", price: 160 }
      ]
    },
    {
      id: 1302,
      name: "Rocky Road Frappe",
      category: "FRAPPE",
      description: "Chocolate frappe with mini marshmallows, whipped cream, and syrup.",
      image: "/images/Rocky Road.jpg",
      variants: [
        { label: "M", price: 145 },
        { label: "L", price: 170 }
      ]
    },
    {
      id: 1303,
      name: "Cookies & Cream Frappe",
      category: "FRAPPE",
      description: "Frappe with crushed Oreo, whipped cream, and syrup.",
      image: "/images/Cookies & Cream.jpg",
      variants: [
        { label: "M", price: 145 },
        { label: "L", price: 170 }
      ]
    },

    {
      id: 1400,
      name: "Green Apple Fruit Tea",
      category: "FRUITTEAS",
      description: "Green apple tea with green tea and nata.",
      image: "/images/Green Apple.jpg",
      variants: [
        { label: "M", price: 85 },
        { label: "L", price: 105 }
      ]
    },
    {
      id: 1401,
      name: "Blueberry Fruit Tea",
      category: "FRUITTEAS",
      description: "Blueberry tea with green tea and nata.",
      image: "/images/Blueberry.jpg",
      variants: [
        { label: "M", price: 85 },
        { label: "L", price: 105 }
      ]
    },
    {
      id: 1402,
      name: "Strawberry Fruit Tea",
      category: "FRUITTEAS",
      description: "Strawberry tea with green tea and nata.",
      image: "/images/Strawberry (2).jpg",
      variants: [
        { label: "M", price: 90 },
        { label: "L", price: 110 }
      ]
    },
    {
      id: 1403,
      name: "Passion Fruit Tea",
      category: "FRUITTEAS",
      description: "Passion fruit tea with green tea and nata.",
      image: "/images/Passion Fruit.jpg",
      variants: [
        { label: "M", price: 90 },
        { label: "L", price: 110 }
      ]
    },
    {
      id: 1404,
      name: "Mango Fruit Tea",
      category: "FRUITTEAS",
      description: "Mango tea with green tea and nata.",
      image: "/images/Mango.jpg",
      variants: [
        { label: "M", price: 90 },
        { label: "L", price: 110 }
      ]
    },
    {
      id: 1405,
      name: "Lychee Fruit Tea",
      category: "FRUITTEAS",
      description: "Lychee tea with green tea and nata.",
      image: "/images/Lychee.jpg",
      variants: [
        { label: "M", price: 90 },
        { label: "L", price: 110 }
      ]
    },
    {
      id: 1406,
      name: "Kiwi Fruit Tea",
      category: "FRUITTEAS",
      description: "Kiwi tea with green tea and nata.",
      image: "/images/Kiwi.jpg",
      variants: [
        { label: "M", price: 95 },
        { label: "L", price: 115 }
      ]
    },


    {
      id: 1500,
      name: "Classic Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon drink with lemon slice.",
      image: "/images/Classic.jpg",
      variants: [
        { label: "M", price: 80 },
        { label: "L", price: 95 }
      ]
    },
    {
      id: 1501,
      name: "Honey Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon with honey and lemon slice.",
      image: "/images/Honey Lemon.jpg",
      variants: [
        { label: "M", price: 85 },
        { label: "L", price: 100 }
      ]
    },
    {
      id: 1502,
      name: "Lemon Yakult",
      category: "LEMONSERIES",
      description: "Fresh lemon with Yakult and lemon slice.",
      image: "/images/Lemon Yakult.jpg",
      variants: [
        { label: "M", price: 95 },
        { label: "L", price: 115 }
      ]
    },
    {
      id: 1503,
      name: "Cucumber Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon with cucumber and lemon slice.",
      image: "/images/Cucumber Lemon.jpg",
      variants: [
        { label: "M", price: 90 },
        { label: "L", price: 110 }
      ]
    },
    {
      id: 1504,
      name: "Strawberry Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon with strawberry and lemon slice.",
      image: "/images/Strawberry Lemon.jpg",
      variants: [
        { label: "M", price: 95 },
        { label: "L", price: 115 }
      ]
    },
    {
      id: 1505,
      name: "Lychee Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon with lychee and lemon slice.",
      image: "/images/Lychee Lemon.jpg",
      variants: [
        { label: "M", price: 95 },
        { label: "L", price: 115 }
      ]
    },
    {
      id: 1506,
      name: "Mango Lemon",
      category: "LEMONSERIES",
      description: "Fresh lemon with mango and lemon slice.",
      image: "/images/Mango Lemon.jpg",
      variants: [
        { label: "M", price: 95 },
        { label: "L", price: 115 }
      ]
    },

    {
      id: 1600,
      name: "Strawberry Banana Smoothie",
      category: "SMOOTHIES",
      description: "Creamy smoothie with strawberries and bananas, topped with whipped cream, corn flakes, and fresh fruit.",
      image: "/images/Strawberry Banana.jpg",
      variants: [
        { label: "M", price: 120 },
        { label: "L", price: 145 }
      ]
    },
    {
      id: 1601,
      name: "Mixed Berries Smoothie",
      category: "SMOOTHIES",
      description: "Fruity mix of berries, topped with whipped cream, corn flakes, and fresh fruit.",
      image: "/images/Mixed Berries.jpg",
      variants: [
        { label: "M", price: 125 },
        { label: "L", price: 150 }
      ]
    },
    {
      id: 1602,
      name: "Blueberry Peach Smoothie",
      category: "SMOOTHIES",
      description: "Sweet blueberries and juicy peaches, topped with whipped cream, corn flakes, and fresh fruit.",
      image: "/images/Blueberry Peach.jpg",
      variants: [
        { label: "M", price: 130 },
        { label: "L", price: 155 }
      ]
    },
  ];