import { ArrowRight, Clock3, Flame, Leaf, Sparkles, Truck, Utensils } from "lucide-react";
import { categories } from "../data/Category";
import ProductCard from "./ProductCard";

/**
 * Returns the total quantity in cart for a given product ID,
 * including all combo keys like "5_drink_9" that belong to the same product.
 */
function getProductQty(cart, productId) {
  return Object.entries(cart).reduce((sum, [key, val]) => {
    const pid =
      typeof val === "object" && val?.productId
        ? val.productId
        : Number(key.split("_")[0]);
    const q = typeof val === "number" ? val : val?.quantity || 0;
    return pid === productId ? sum + q : sum;
  }, 0);
}

/**
 * Returns the first cart key that belongs to the given product ID.
 * Used to ensure +/- operates on the correct combo entry.
 */
function getProductCartKey(cart, productId) {
  const entry = Object.entries(cart).find(([key, val]) => {
    const pid =
      typeof val === "object" && val?.productId
        ? val.productId
        : Number(key.split("_")[0]);
    return pid === productId;
  });
  return entry ? entry[0] : String(productId);
}

function HomePage({ products = [], cart, onAdd, onRemove, goToMenu, goToCategory, onOpenDetail, ratingSummaries = {} }) {
  const featured = products.slice(0, 3);
  const cartCount = Object.values(cart).reduce(
    (sum, item) => sum + (typeof item === "number" ? item : Number(item?.quantity || 0)),
    0
  );
  const heroProduct = featured[0];

  return <div className="overflow-hidden">
    <section className="relative px-5 pb-20 pt-12 sm:px-8 md:px-10 md:pt-20">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-teal-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-3.5 py-2 text-xs font-black uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300"><Flame size={14} className="animate-float" />Hot &amp; fresh · delivered fast</div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-zinc-950 dark:text-white sm:text-6xl md:text-7xl">Good food.<br /><span className="text-teal-600 dark:text-teal-400">Good mood.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-500 dark:text-zinc-400">Burgers, shawarma and pizza made to order, packed with flavor and brought straight to your door.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={goToMenu} className="group inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-teal-500/25 transition duration-300 hover:-translate-y-1 hover:bg-teal-700">Order something good <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button><button onClick={goToMenu} className="rounded-full border border-coal-300 px-5 py-3.5 text-sm font-bold text-zinc-700 transition hover:-translate-y-1 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300">Explore menu</button></div>
          <div className="mt-12 grid max-w-xl grid-cols-2 gap-3 border-t border-coal-200 pt-7 dark:border-coal-800"><div><p className="flex items-center gap-1.5 text-sm font-black"><Clock3 size={16} className="text-teal-600 dark:text-teal-400" />25–35m</p><p className="mt-1 text-xs text-zinc-500">Average delivery</p></div><div><p className="flex items-center gap-1.5 text-sm font-black"><Truck size={16} className="text-teal-600 dark:text-teal-400" />Free</p><p className="mt-1 text-xs text-zinc-500">Over Rs. 999</p></div></div>
        </div>
        <div className="relative mx-auto w-full max-w-xl animate-fade-up [animation-delay:140ms]">
          <div className="absolute -right-2 top-8 z-10 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-coal-900/80 sm:-right-5"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500"><Leaf size={18} /></div><div><p className="text-xs font-black">Made fresh</p><p className="text-[10px] text-zinc-500">Every single order</p></div></div></div>
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-coal-900 shadow-2xl shadow-teal-950/20"><div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 via-transparent to-coal-950/80" />{heroProduct && <img src={heroProduct.image} alt="Featured Food World dish" className="h-full w-full object-cover opacity-90 mix-blend-screen transition duration-700 hover:scale-105" />}<div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Tonight&apos;s pick</p><p className="mt-1 text-2xl font-black text-white">{heroProduct?.title || heroProduct?.name || "Made with love"}</p></div><div className="rounded-2xl bg-white/15 px-3 py-2 text-right text-white backdrop-blur-md"><p className="text-[10px] uppercase tracking-wider text-white/60">Starting at</p><p className="font-black text-teal-300">Rs. {Number(heroProduct?.price || 699).toLocaleString()}</p></div></div></div>
          <div className="absolute -bottom-5 -left-3 rounded-2xl bg-coal-950 px-4 py-3 text-white shadow-xl dark:bg-white dark:text-zinc-950"><p className="flex items-center gap-2 text-xs font-black"><Sparkles size={15} className="text-teal-500" />{cartCount ? `${cartCount} items in your cart` : "Your next craving awaits"}</p></div>
        </div>
      </div>
    </section>

    <section className="px-5 pb-16 sm:px-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Pick your vibe</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              What are you craving?
            </h2>
          </div>
          <Utensils className="hidden text-zinc-300 sm:block" size={35} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category, index) => {
            return (
              <button
                key={category.id}
                onClick={() => goToCategory(category.title)}
                className="group animate-fade-up rounded-2xl border border-coal-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-500/60 hover:shadow-lg dark:border-white/10 dark:bg-coal-900"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-end">
                  <ArrowRight
                    size={19}
                    className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                  />
                </div>
                <h3 className="mt-6 text-xl font-black">{category.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {category.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>

    <section className="bg-coal-100/70 px-5 py-16 dark:bg-coal-900/40 sm:px-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400"><Flame size={15} />Most loved</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">Tonight&apos;s bestsellers</h2>
          </div>
          <button onClick={goToMenu} className="hidden items-center gap-2 text-sm font-black text-teal-600 dark:text-teal-400 transition hover:gap-3 sm:flex">See full menu <ArrowRight size={16} /></button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((product, index) => (
            <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
              <ProductCard
                product={product}
                qty={getProductQty(cart, product.id)}
                onAdd={() => onAdd(getProductCartKey(cart, product.id) === String(product.id) ? product.id : getProductCartKey(cart, product.id))}
                onRemove={() => onRemove(getProductCartKey(cart, product.id))}
                onOpenDetail={onOpenDetail}
                ratingSummary={ratingSummaries[product.id] || null}
              />
            </div>
          ))}
        </div>
        <button onClick={goToMenu} className="mx-auto mt-8 flex items-center gap-2 rounded-full border border-coal-300 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300 sm:hidden">See full menu <ArrowRight size={16} /></button>
      </div>
    </section>
  </div>;
}

export default HomePage;
