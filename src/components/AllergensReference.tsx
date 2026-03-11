import { motion } from "framer-motion";
import { Milk, Egg, Fish, Shell, TreePine, Nut, Wheat, Bean } from "lucide-react";

const allergens = [
  { name: "Milk/Dairy", icon: Milk, description: "Includes cheese, butter, yogurt, whey, casein, and lactose-containing products.", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Eggs", icon: Egg, description: "Found in baked goods, mayonnaise, pasta, and many processed foods.", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { name: "Fish", icon: Fish, description: "Includes all fin fish such as salmon, tuna, cod, and fish-based sauces.", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { name: "Shellfish", icon: Shell, description: "Crustaceans like shrimp, crab, lobster, and mollusks like clams and oysters.", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Tree Nuts", icon: TreePine, description: "Almonds, cashews, walnuts, pecans, pistachios, and Brazil nuts.", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Peanuts", icon: Nut, description: "A legume found in many foods including sauces, baked goods, and snacks.", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Wheat/Gluten", icon: Wheat, description: "Present in bread, pasta, cereals, sauces, and many processed foods.", color: "bg-stone-50 text-stone-700 border-stone-200" },
  { name: "Soybeans", icon: Bean, description: "Used in tofu, soy sauce, edamame, and as an additive in many products.", color: "bg-green-50 text-green-700 border-green-200" },
];

const AllergensReference = () => {
  return (
    <section id="about" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Major Food Allergens
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The 8 major allergens account for approximately 90% of all food allergy reactions.
            Our system detects these and more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allergens.map((allergen, index) => (
            <motion.div
              key={allergen.name}
              className={`p-6 rounded-xl border ${allergen.color} transition-all hover:shadow-lg hover:-translate-y-1`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <allergen.icon className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg mb-2">{allergen.name}</h3>
              <p className="text-sm opacity-80">{allergen.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AllergensReference;
