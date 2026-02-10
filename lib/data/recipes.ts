export type Recipe = {
  id: string;
  title: string;
  meal: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  protein: string;
  benefits: string;
  ingredients: string[];
  steps: string[];
};

export const recipes: Recipe[] = [
  {
    id: "moong-chilla",
    title: "Moong chilla power wrap",
    meal: "Breakfast",
    protein: "26g",
    benefits: "High protein, gut-friendly fiber, steady energy.",
    ingredients: [
      "Soaked moong dal",
      "Ginger",
      "Green chili",
      "Spinach",
      "Low-fat curd",
    ],
    steps: [
      "Blend moong with ginger and chili to a batter.",
      "Fold in chopped spinach and season lightly.",
      "Cook thin chillas and serve with curd.",
    ],
  },
  {
    id: "chia-overnight-oats",
    title: "Chia overnight oats",
    meal: "Breakfast",
    protein: "20g",
    benefits: "Skin support, gut health, slow-release energy.",
    ingredients: [
      "Rolled oats",
      "Chia seeds",
      "Greek yogurt",
      "Mixed berries",
      "Cinnamon",
    ],
    steps: [
      "Mix oats, chia, yogurt, and cinnamon.",
      "Chill overnight.",
      "Top with berries before serving.",
    ],
  },
  {
    id: "paneer-besan-toast",
    title: "Paneer besan toast",
    meal: "Breakfast",
    protein: "24g",
    benefits: "Muscle support, low glycemic, sustained focus.",
    ingredients: [
      "Besan (gram flour)",
      "Paneer crumbles",
      "Onion",
      "Tomato",
      "Coriander",
    ],
    steps: [
      "Whisk besan with water and spices.",
      "Add paneer and chopped veggies.",
      "Dip bread and toast until golden.",
    ],
  },
  {
    id: "chicken-quinoa-bowl",
    title: "Chicken quinoa bowl",
    meal: "Lunch",
    protein: "38g",
    benefits: "Lean muscle gain, fat loss friendly, iron support.",
    ingredients: [
      "Chicken breast",
      "Cooked quinoa",
      "Cucumber",
      "Bell pepper",
      "Olive oil",
    ],
    steps: [
      "Grill chicken with salt, pepper, and paprika.",
      "Toss quinoa with chopped veggies and olive oil.",
      "Slice chicken and layer over the bowl.",
    ],
  },
  {
    id: "fish-curry-rice",
    title: "Light fish curry + brown rice",
    meal: "Lunch",
    protein: "34g",
    benefits: "Omega-3 for skin/hair, anti-inflammatory, gut easy.",
    ingredients: [
      "Fish fillet",
      "Tomato",
      "Onion",
      "Turmeric",
      "Brown rice",
    ],
    steps: [
      "Saute onion and tomato with turmeric.",
      "Simmer fish gently until cooked.",
      "Serve with steamed brown rice.",
    ],
  },
  {
    id: "rajma-spinach-bowl",
    title: "Rajma spinach bowl",
    meal: "Lunch",
    protein: "22g",
    benefits: "Fiber-rich, gut health, steady energy.",
    ingredients: [
      "Kidney beans",
      "Spinach",
      "Onion",
      "Garlic",
      "Jeera (cumin)",
    ],
    steps: [
      "Cook rajma until soft.",
      "Saute onion, garlic, and cumin, then add spinach.",
      "Combine with rajma and simmer 5 minutes.",
    ],
  },
  {
    id: "tandoori-chicken-plate",
    title: "Tandoori chicken plate",
    meal: "Dinner",
    protein: "40g",
    benefits: "High protein, low fat, muscle recovery.",
    ingredients: [
      "Chicken breast",
      "Greek yogurt",
      "Lemon",
      "Tandoori spices",
      "Mixed salad",
    ],
    steps: [
      "Marinate chicken with yogurt, lemon, and spices.",
      "Bake or grill until cooked through.",
      "Serve with salad and lemon.",
    ],
  },
  {
    id: "paneer-broccoli-stir",
    title: "Paneer broccoli stir",
    meal: "Dinner",
    protein: "28g",
    benefits: "Hair support, calcium boost, low oil.",
    ingredients: [
      "Paneer cubes",
      "Broccoli",
      "Bell peppers",
      "Olive oil",
      "Black pepper",
    ],
    steps: [
      "Sear paneer lightly.",
      "Stir fry broccoli and peppers with olive oil.",
      "Combine and season with pepper.",
    ],
  },
  {
    id: "mutton-veg-stew",
    title: "Lean mutton veg stew",
    meal: "Dinner",
    protein: "32g",
    benefits: "Iron support, muscle gain, warm recovery meal.",
    ingredients: [
      "Lean mutton pieces",
      "Carrot",
      "Beans",
      "Onion",
      "Black pepper",
    ],
    steps: [
      "Pressure cook mutton with onion and spices.",
      "Add vegetables and simmer until tender.",
      "Finish with black pepper and coriander.",
    ],
  },
];
