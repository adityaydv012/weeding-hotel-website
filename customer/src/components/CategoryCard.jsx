function CategoryCard({ category, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-[1.15/1] w-full overflow-hidden rounded-[24px] text-left transition duration-300 ${
        active
          ? 'ring-2 ring-stone-900 ring-offset-2'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {category.imageUrl ? (
        <img
          src={category.imageUrl}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-950">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-5 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white/10">
              {category.name.charAt(0)}
            </span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          {category.name}
        </h3>
      </div>
    </button>
  );
}

export default CategoryCard;