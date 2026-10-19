export interface HeroSlide {
  readonly src: string
  readonly alt: string
  readonly dishName: string
  readonly category: string
}

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    src: "/rice.jpg",
    alt: "Smoky firewood jollof rice with peppered chicken",
    dishName: "Smoky Firewood Jollof",
    category: "Campus Favorite",
  },
  {
    src: "/sharwama.jpg",
    alt: "Loaded beef shawarma with special sauce",
    dishName: "Loaded Beef Shawarma",
    category: "Express Street Bites",
  },
  {
    src: "/soup.jpg",
    alt: "Bitter leaf and traditional soups",
    dishName: "Traditional Campus Soups",
    category: "Local Kitchens",
  },
  {
    src: "/bole.jpg",
    alt: "Pepper suya and roasted plantain",
    dishName: "Pepper Suya & Grills",
    category: "Night Prep Fuel",
  },
  {
    src: "/chicken.png",
    alt: "Golden fried plantain and crispy chicken",
    dishName: "Crispy Chicken & Plantain",
    category: "Hot Combos",
  },
  {
    src: "/smoothie.jpg",
    alt: "Fresh tropical smoothies and juices",
    dishName: "Tropical Fruit Smoothie",
    category: "Chilled Drinks",
  },
]
