import {

  useEffect,

  useMemo,

  useState,

} from 'react';

import {

  createFoodItem,

  deleteFoodItem,

  getCategories,

  getFoodItems,

  updateFoodItem,

} from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';

const DEMO_HOTEL_ID = '6ac5c6be34fd0e1d0236f8b9';

const emptyCustomization = () => ({

  name: '',

  selectionType: 'SINGLE',

  required: false,

  minSelections: 0,

  maxSelections: 1,

  options: [],

});

const emptyOption = () => ({

  name: '',

  priceDelta: 0,

  isActive: true,

});

const emptyForm = () => ({

  name: '',

  description: '',

  categoryId: '',

  imageUrl: '',

  price: '',

  discountPrice: '',

  isVeg: true,

  isBestseller: false,

  preparationTime: 15,

  isAvailable: true,

  displayOrder: 0,

  customizations: [],

});

function FoodItemsPage() {

const { user } = useAuth();

const [foods, setFoods] = useState([]);

const [categories, setCategories] = useState([]);

const [loading, setLoading] = useState(true);

const [categoriesLoading, setCategoriesLoading] = useState(true);

const [error, setError] = useState('');

const [search, setSearch] = useState('');

const [categoryFilter, setCategoryFilter] = useState('');

const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

const [isModalOpen, setIsModalOpen] = useState(false);

const [editingFood, setEditingFood] = useState(null);

const [form, setForm] = useState(emptyForm());

const [saving, setSaving] = useState(false);

const [deletingId, setDeletingId] = useState('');

const [actionError, setActionError] = useState('');

const hotelId =

    user?.role === 'SUPER_ADMIN'

      ? DEMO_HOTEL_ID

      : user?.hotelId;

const categoryMap = useMemo(() => {

const map = new Map();

    categories.forEach((category) => {

      map.set(String(category._id), category);

    });

    return map;

  }, [categories]);

const getCategoryName = (categoryId) => {

    if (!categoryId) {

      return 'Uncategorized';

    }

    return (

      categoryMap.get(String(categoryId))?.name ||

      'Unknown Category'

    );

  };

const loadData = async () => {

    if (!hotelId) {

      setLoading(false);

      setCategoriesLoading(false);

      setError('No hotel is assigned to this account.');

      return;

    }

    try {

      setLoading(true);

      setCategoriesLoading(true);

      setError('');

const [foodResponse, categoryResponse] =

        await Promise.all([

          getFoodItems({ hotelId }),

          getCategories({ hotelId }),

        ]);

      setFoods(foodResponse.foods || []);

      setCategories(categoryResponse.categories || []);

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

          err.message ||

          'Unable to load food items and categories.'

      );

    } finally {

      setLoading(false);

      setCategoriesLoading(false);

    }

  };

  useEffect(() => {

    loadData();

  }, [hotelId]);

const visibleFoods = useMemo(() => {

const query = search.trim().toLowerCase();

    return foods.filter((food) => {

const categoryName = getCategoryName(

        food.categoryId

      ).toLowerCase();

const matchesSearch =

        !query ||

        food.name?.toLowerCase().includes(query) ||

        food.description

          ?.toLowerCase()

          .includes(query) ||

        categoryName.includes(query);

const matchesCategory =

        !categoryFilter ||

        String(food.categoryId) ===

          String(categoryFilter);

const matchesAvailability =

        availabilityFilter === 'ALL' ||

        (availabilityFilter === 'AVAILABLE' &&

          food.isAvailable) ||

        (availabilityFilter === 'UNAVAILABLE' &&

          !food.isAvailable);

      return (

        matchesSearch &&

        matchesCategory &&

        matchesAvailability

      );

    });

  }, [

    foods,

    categories,

    search,

    categoryFilter,

    availabilityFilter,

  ]);

const openCreateModal = () => {

    setEditingFood(null);

    setForm(emptyForm());

    setActionError('');

    setIsModalOpen(true);

  };

const openEditModal = (food) => {

    setEditingFood(food);

    setActionError('');

    setForm({

      name: food.name || '',

      description: food.description || '',

      categoryId: food.categoryId || '',

      imageUrl: food.imageUrl || '',

      price: food.price ?? '',

      discountPrice: food.discountPrice ?? '',

      isVeg: food.isVeg ?? true,

      isBestseller: food.isBestseller ?? false,

      preparationTime: food.preparationTime ?? 15,

      isAvailable: food.isAvailable ?? true,

      displayOrder: food.displayOrder ?? 0,

      customizations:

        food.customizations?.map((group) => ({

          name: group.name || '',

          selectionType:

            group.selectionType || 'SINGLE',

          required: group.required ?? false,

          minSelections:

            group.minSelections ?? 0,

          maxSelections:

            group.maxSelections ?? 1,

          options:

            group.options?.map((option) => ({

              name: option.name || '',

              priceDelta:

                option.priceDelta ?? 0,

              isActive:

                option.isActive ?? true,

            })) || [],

        })) || [],

    });

    setIsModalOpen(true);

  };

const closeModal = () => {

    if (saving) {

      return;

    }

    setIsModalOpen(false);

    setEditingFood(null);

    setActionError('');

  };

const updateForm = (field, value) => {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));

  };

const addCustomizationGroup = () => {

    setForm((current) => ({

      ...current,

      customizations: [

        ...current.customizations,

        emptyCustomization(),

      ],

    }));

  };

const removeCustomizationGroup = (groupIndex) => {

    setForm((current) => ({

      ...current,

      customizations:

        current.customizations.filter(

          (_, index) => index !== groupIndex

        ),

    }));

  };

const updateCustomizationGroup = (

    groupIndex,

    field,

    value

  ) => {

    setForm((current) => ({

      ...current,

      customizations:

        current.customizations.map(

          (group, index) =>

            index === groupIndex

              ? {

                  ...group,

                  [field]: value,

                }

              : group

        ),

    }));

  };

const addOption = (groupIndex) => {

    setForm((current) => ({

      ...current,

      customizations:

        current.customizations.map(

          (group, index) =>

            index === groupIndex

              ? {

                  ...group,

                  options: [

                    ...group.options,

                    emptyOption(),

                  ],

                }

              : group

        ),

    }));

  };

const removeOption = (

    groupIndex,

    optionIndex

  ) => {

    setForm((current) => ({

      ...current,

      customizations:

        current.customizations.map(

          (group, index) =>

            index === groupIndex

              ? {

                  ...group,

                  options:

                    group.options.filter(

                      (_, index) =>

                        index !== optionIndex

                    ),

                }

              : group

        ),

    }));

  };

const updateOption = (

    groupIndex,

    optionIndex,

    field,

    value

  ) => {

    setForm((current) => ({

      ...current,

      customizations:

        current.customizations.map(

          (group, index) => {

            if (index !== groupIndex) {

              return group;

            }

            return {

              ...group,

              options: group.options.map(

                (

                  option,

                  currentOptionIndex

                ) =>

                  currentOptionIndex ===

                  optionIndex

                    ? {

                        ...option,

                        [field]: value,

                      }

                    : option

              ),

            };

          }

        ),

    }));

  };

const buildPayload = () => {

const price = Number(form.price);

const discountPrice =

      form.discountPrice === ''

        ? null

        : Number(form.discountPrice);

const customizations =

      form.customizations

        .map((group) => ({

          name: group.name.trim(),

          selectionType:

            group.selectionType,

          required:

            Boolean(group.required),

          minSelections:

            Number(group.minSelections),

          maxSelections:

            Number(group.maxSelections),

          options:

            group.options

              .filter(

                (option) =>

                  option.name.trim()

              )

              .map((option) => ({

                name:

                  option.name.trim(),

                priceDelta:

                  Number(

                    option.priceDelta

                  ),

                isActive:

                  Boolean(

                    option.isActive

                  ),

              })),

        }))

        .filter((group) => group.name);

    return {

      hotelId,

      categoryId: form.categoryId,

      name: form.name.trim(),

      description:

        form.description.trim(),

      imageUrl: form.imageUrl.trim(),

      price,

      discountPrice,

      isVeg: Boolean(form.isVeg),

      isBestseller:

        Boolean(form.isBestseller),

      preparationTime:

        Number(form.preparationTime),

      isAvailable:

        Boolean(form.isAvailable),

      displayOrder:

        Number(form.displayOrder),

      customizations,

    };

  };

const validateForm = () => {

    if (!form.name.trim()) {

      return 'Food name is required.';

    }

    if (!form.categoryId) {

      return 'Please select a category.';

    }

    if (

      form.price === '' ||

      Number(form.price) < 0

    ) {

      return 'Please enter a valid price.';

    }

    if (

      form.discountPrice !== '' &&

      Number(form.discountPrice) >

        Number(form.price)

    ) {

      return (

        'Discount price cannot exceed ' +

        'the regular price.'

      );

    }

    for (

let index = 0;

      index < form.customizations.length;

      index += 1

    ) {

const group =

        form.customizations[index];

      if (!group.name.trim()) {

        return `Customization group ${

          index + 1

        } needs a name.`;

      }

      if (

        Number(group.maxSelections) < 1

      ) {

        return `Customization group ${

          index + 1

        } needs at least one maximum selection.`;

      }

      if (

        Number(group.minSelections) >

        Number(group.maxSelections)

      ) {

        return (

          `Minimum selections cannot exceed ` +

          `maximum selections in "${group.name}".`

        );

      }

      for (

let optionIndex = 0;

        optionIndex < group.options.length;

        optionIndex += 1

      ) {

        if (

          !group.options[

            optionIndex

          ].name.trim()

        ) {

          return `Option ${

            optionIndex + 1

          } in "${group.name}" needs a name.`;

        }

      }

    }

    return '';

  };

const handleSubmit = async (event) => {

    event.preventDefault();

const validationError =

      validateForm();

    if (validationError) {

      setActionError(validationError);

      return;

    }

    try {

      setSaving(true);

      setActionError('');

const payload = buildPayload();

      if (editingFood) {

        await updateFoodItem(

          editingFood._id,

          payload

        );

      } else {

        await createFoodItem(payload);

      }

      await loadData();

      closeModal();

    } catch (err) {

      console.error(err);

      setActionError(

        err.response?.data?.message ||

          err.message ||

          'Unable to save food item.'

      );

    } finally {

      setSaving(false);

    }

  };

const handleDelete = async (food) => {

const confirmed = window.confirm(

      `Delete "${food.name}"? This action cannot be undone.`

    );

    if (!confirmed) {

      return;

    }

    try {

      setDeletingId(food._id);

      setError('');

      await deleteFoodItem(food._id);

      setFoods((current) =>

        current.filter(

          (item) =>

            item._id !== food._id

        )

      );

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

          err.message ||

          'Unable to delete food item.'

      );

    } finally {

      setDeletingId('');

    }

  };

const handleToggleAvailability = async (

    food

  ) => {

    try {

      setError('');

const response =

        await updateFoodItem(

          food._id,

          {

            isAvailable:

              !food.isAvailable,

          }

        );

      setFoods((current) =>

        current.map((item) =>

          item._id === food._id

            ? response.food

            : item

        )

      );

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

          err.message ||

          'Unable to update availability.'

      );

    }

  };

  return (

    <div className="min-h-full bg-[#f8f5f0]">

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a7a52]">

              Menu Management

            </p>

            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#2b211d]">

              Food Items

            </h1>

            <p className="mt-1 text-sm text-[#857a72]">

              Manage dishes, pricing,

              availability and customizations.

            </p>

          </div>

          <button

            type="button"

            onClick={openCreateModal}

            disabled={

              categoriesLoading ||

              categories.length === 0

            }

            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#682031] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

          >

            <span className="text-lg leading-none">

              +

            </span>

            Add Food Item

          </button>

        </div>

        {categories.length === 0 &&

          !categoriesLoading && (

            <div className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#fffaf5] px-4 py-4 text-sm text-[#71303d]">

              <p className="font-bold">

                Create a category first

              </p>

              <p className="mt-1 text-xs text-[#857a72]">

                You need at least one category

                before creating a food item.

              </p>

            </div>

          )}

        {error && (

          <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>{error}</span>

            <button

              type="button"

              onClick={() => setError('')}

              className="font-bold"

            >

              ×

            </button>

          </div>

        )}

        <section className="mt-6 rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#aa9b8e]">

                ⌕

              </span>

              <input

                type="text"

                value={search}

                onChange={(event) =>

                  setSearch(

                    event.target.value

                  )

                }

                placeholder="Search food items..."

                className={inputClass + ' pl-10'}

              />

            </div>

            <select

              value={categoryFilter}

              onChange={(event) =>

                setCategoryFilter(

                  event.target.value

                )

              }

              className={inputClass}

            >

              <option value="">

                All categories

              </option>

              {categories.map((category) => (

                <option

                  key={category._id}

                  value={category._id}

                >

                  {category.name}

                </option>

              ))}

            </select>

            <select

              value={availabilityFilter}

              onChange={(event) =>

                setAvailabilityFilter(

                  event.target.value

                )

              }

              className={inputClass}

            >

              <option value="ALL">

                All status

              </option>

              <option value="AVAILABLE">

                Available

              </option>

              <option value="UNAVAILABLE">

                Unavailable

              </option>

            </select>

          </div>

        </section>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard

            label="Total Items"

            value={foods.length}

          />

          <StatCard

            label="Available"

            value={

              foods.filter(

                (food) =>

                  food.isAvailable

              ).length

            }

          />

          <StatCard

            label="Bestsellers"

            value={

              foods.filter(

                (food) =>

                  food.isBestseller

              ).length

            }

          />

          <StatCard

            label="Filtered"

            value={visibleFoods.length}

          />

        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#eadfd4] bg-white shadow-sm">

          {loading ? (

            <LoadingState />

          ) : visibleFoods.length === 0 ? (

            <EmptyState

              hasFilters={Boolean(

                search ||

                  categoryFilter ||

                  availabilityFilter !==

                    'ALL'

              )}

              onClear={() => {

                setSearch('');

                setCategoryFilter('');

                setAvailabilityFilter(

                  'ALL'

                );

              }}

              onAdd={openCreateModal}

              disabled={

                categories.length === 0

              }

            />

          ) : (

            <>

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full min-w-[900px]">

                  <thead>

                    <tr className="border-b border-[#eadfd4] bg-[#fffdf9]">

                      <th className={thClass}>

                        Item

                      </th>

                      <th className={thClass}>

                        Category

                      </th>

                      <th className={thClass}>

                        Price

                      </th>

                      <th className={thClass}>

                        Prep

                      </th>

                      <th className={thClass}>

                        Status

                      </th>

                      <th

                        className={

                          thClass +

                          ' text-right'

                        }

                      >

                        Actions

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {visibleFoods.map(

                      (food) => (

                        <FoodRow

                          key={food._id}

                          food={food}

                          categoryName={getCategoryName(

                            food.categoryId

                          )}

                          onEdit={

                            openEditModal

                          }

                          onDelete={

                            handleDelete

                          }

                          onToggle={

                            handleToggleAvailability

                          }

                          deleting={

                            deletingId ===

                            food._id

                          }

                        />

                      )

                    )}

                  </tbody>

                </table>

              </div>

              <div className="divide-y divide-[#eadfd4] lg:hidden">

                {visibleFoods.map(

                  (food) => (

                    <FoodMobileCard

                      key={food._id}

                      food={food}

                      categoryName={getCategoryName(

                        food.categoryId

                      )}

                      onEdit={

                        openEditModal

                      }

                      onDelete={

                        handleDelete

                      }

                      onToggle={

                        handleToggleAvailability

                      }

                      deleting={

                        deletingId ===

                        food._id

                      }

                    />

                  )

                )}

              </div>

            </>

          )}

        </section>

      </div>

      {isModalOpen && (

        <FoodModal

          editingFood={editingFood}

          form={form}

          categories={categories}

          saving={saving}

          error={actionError}

          onClose={closeModal}

          onSubmit={handleSubmit}

          onChange={updateForm}

          onAddGroup={

            addCustomizationGroup

          }

          onRemoveGroup={

            removeCustomizationGroup

          }

          onUpdateGroup={

            updateCustomizationGroup

          }

          onAddOption={addOption}

          onRemoveOption={

            removeOption

          }

          onUpdateOption={

            updateOption

          }

        />

      )}

    </div>

  );

}

function StatCard({ label, value }) {

  return (

    <div className="rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm">

      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#aa9b8e]">

        {label}

      </p>

      <p className="mt-2 text-2xl font-bold text-[#2b211d]">

        {value}

      </p>

    </div>

  );

}

function FoodRow({

  food,

  categoryName,

  onEdit,

  onDelete,

  onToggle,

  deleting,

}) {

  return (

    <tr className="border-b border-[#f0e7df] last:border-0">

      <td className="px-5 py-4">

        <div className="flex items-center gap-3">

          <FoodImage

            food={food}

            size="md"

          />

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <p className="truncate text-sm font-bold text-[#332a26]">

                {food.name}

              </p>

              {food.isBestseller && (

                <span className="rounded-full bg-[#f8e8c8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8a6533]">

                  Bestseller

                </span>

              )}

            </div>

            {food.description && (

              <p className="mt-1 max-w-[320px] truncate text-xs text-[#8b7e75]">

                {food.description}

              </p>

            )}

            <div className="mt-1 flex items-center gap-2">

              <span

                className={[

                  'h-2 w-2 rounded-full',

                  food.isVeg

                    ? 'bg-green-500'

                    : 'bg-red-500',

                ].join(' ')}

              />

              <span className="text-[10px] text-[#8b7e75]">

                {food.isVeg

                  ? 'Vegetarian'

                  : 'Non-vegetarian'}

              </span>

            </div>

          </div>

        </div>

      </td>

      <td className="px-5 py-4">

        <span className="rounded-lg bg-[#f8f3ed] px-2.5 py-1.5 text-xs font-semibold text-[#665b54]">

          {categoryName}

        </span>

      </td>

      <td className="px-5 py-4">

        {food.discountPrice != null &&

        food.discountPrice <

          food.price ? (

          <>

            <p className="text-sm font-bold text-[#332a26]">

              ₹{food.discountPrice}

            </p>

            <p className="text-[11px] text-[#a69a91] line-through">

              ₹{food.price}

            </p>

          </>

        ) : (

          <p className="text-sm font-bold text-[#332a26]">

            ₹{food.price}

          </p>

        )}

      </td>

      <td className="px-5 py-4">

        <span className="text-xs font-semibold text-[#665b54]">

          {food.preparationTime || 0}{' '}

          min

        </span>

      </td>

      <td className="px-5 py-4">

        <button

          type="button"

          onClick={() => onToggle(food)}

          className={[

            'rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition',

            food.isAvailable

              ? 'bg-green-50 text-green-700 hover:bg-green-100'

              : 'bg-stone-100 text-stone-500 hover:bg-stone-200',

          ].join(' ')}

        >

          {food.isAvailable

            ? 'Available'

            : 'Unavailable'}

        </button>

      </td>

      <td className="px-5 py-4">

        <div className="flex justify-end gap-2">

          <button

            type="button"

            onClick={() => onEdit(food)}

            className="rounded-lg border border-[#e1d5ca] bg-white px-3 py-2 text-xs font-bold text-[#71303d] transition hover:bg-[#fffaf5]"

          >

            Edit

          </button>

          <button

            type="button"

            disabled={deleting}

            onClick={() => onDelete(food)}

            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"

          >

            {deleting

              ? 'Deleting...'

              : 'Delete'}

          </button>

        </div>

      </td>

    </tr>

  );

}

function FoodMobileCard({

  food,

  categoryName,

  onEdit,

  onDelete,

  onToggle,

  deleting,

}) {

  return (

    <div className="p-4">

      <div className="flex gap-3">

        <FoodImage

          food={food}

          size="lg"

        />

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="truncate text-sm font-bold text-[#332a26]">

                  {food.name}

                </h3>

                {food.isBestseller && (

                  <span className="rounded-full bg-[#f8e8c8] px-2 py-0.5 text-[9px] font-bold text-[#8a6533]">

                    Bestseller

                  </span>

                )}

              </div>

              <p className="mt-1 text-xs text-[#8b7e75]">

                {categoryName}

              </p>

            </div>

            <span

              className={[

                'h-2.5 w-2.5 shrink-0 rounded-full',

                food.isVeg

                  ? 'bg-green-500'

                  : 'bg-red-500',

              ].join(' ')}

              title={

                food.isVeg

                  ? 'Vegetarian'

                  : 'Non-vegetarian'

              }

            />

          </div>

          <div className="mt-3 flex items-end justify-between gap-3">

            <div>

              {food.discountPrice != null &&

              food.discountPrice <

                food.price ? (

                <div className="flex items-baseline gap-2">

                  <span className="text-base font-bold text-[#332a26]">

                    ₹{food.discountPrice}

                  </span>

                  <span className="text-xs text-[#a69a91] line-through">

                    ₹{food.price}

                  </span>

                </div>

              ) : (

                <span className="text-base font-bold text-[#332a26]">

                  ₹{food.price}

                </span>

              )}

              <p className="mt-1 text-[10px] text-[#a69a91]">

                {food.preparationTime || 0}{' '}

                min prep

              </p>

            </div>

            <button

              type="button"

              onClick={() => onToggle(food)}

              className={[

                'rounded-full px-3 py-1.5 text-[9px] font-bold uppercase',

                food.isAvailable

                  ? 'bg-green-50 text-green-700'

                  : 'bg-stone-100 text-stone-500',

              ].join(' ')}

            >

              {food.isAvailable

                ? 'Available'

                : 'Unavailable'}

            </button>

          </div>

        </div>

      </div>

      <div className="mt-4 flex gap-2">

        <button

          type="button"

          onClick={() => onEdit(food)}

          className="flex-1 rounded-xl border border-[#e1d5ca] bg-white px-3 py-2.5 text-xs font-bold text-[#71303d]"

        >

          Edit

        </button>

        <button

          type="button"

          disabled={deleting}

          onClick={() => onDelete(food)}

          className="flex-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 disabled:opacity-50"

        >

          {deleting

            ? 'Deleting...'

            : 'Delete'}

        </button>

      </div>

    </div>

  );

}

function FoodImage({

  food,

  size = 'md',

}) {

const dimensions =

    size === 'lg'

      ? 'h-20 w-20'

      : 'h-14 w-14';

  return (

    <div

      className={[

        dimensions,

        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f8f3ed] ring-1 ring-[#eadfd4]',

      ].join(' ')}

    >

      {food.imageUrl ? (

        <img

          src={food.imageUrl}

          alt={food.name}

          className="h-full w-full object-cover"

          onError={(event) => {

            event.currentTarget.style.display =

              'none';

          }}

        />

      ) : (

        <span className="font-serif text-xl text-[#7b2638]">

          R

        </span>

      )}

    </div>

  );

}

function EmptyState({

  hasFilters,

  onClear,

  onAdd,

  disabled,

}) {

  return (

    <div className="px-6 py-16 text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8f3ed] text-2xl text-[#7b2638]">

        ✦

      </div>

      <h3 className="mt-5 text-lg font-bold text-[#332a26]">

        No food items found

      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#857a72]">

        {hasFilters

          ? 'Try changing your search or filters.'

          : 'Your menu does not have any food items yet.'}

      </p>

      <div className="mt-5 flex justify-center gap-2">

        {hasFilters && (

          <button

            type="button"

            onClick={onClear}

            className="rounded-xl border border-[#e1d5ca] bg-white px-4 py-2.5 text-xs font-bold text-[#71303d]"

          >

            Clear Filters

          </button>

        )}

        <button

          type="button"

          onClick={onAdd}

          disabled={disabled}

          className="rounded-xl bg-[#7b2638] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"

        >

          + Add Food Item

        </button>

      </div>

    </div>

  );

}

function LoadingState() {

  return (

    <div className="px-6 py-20 text-center">

      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#eadfd4] border-t-[#7b2638]" />

      <p className="mt-4 text-sm text-[#857a72]">

        Loading food items...

      </p>

    </div>

  );

}

function FoodModal({

  editingFood,

  form,

  categories,

  saving,

  error,

  onClose,

  onSubmit,

  onChange,

  onAddGroup,

  onRemoveGroup,

  onUpdateGroup,

  onAddOption,

  onRemoveOption,

  onUpdateOption,

}) {

  return (

    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">

      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-[#fffdf9] shadow-2xl sm:rounded-[28px]">

        <div className="flex shrink-0 items-center justify-between border-b border-[#eadfd4] px-5 py-4 sm:px-6">

          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9a7a52]">

              Menu Management

            </p>

            <h2 className="mt-1 font-serif text-xl font-semibold text-[#2b211d]">

              {editingFood

                ? 'Edit Food Item'

                : 'Add Food Item'}

            </h2>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8f3ed] text-lg text-[#756b64] transition hover:bg-[#f0e8df]"

          >

            ×

          </button>

        </div>

        <form

          onSubmit={onSubmit}

          className="min-h-0 flex-1 overflow-y-auto"

        >

          <div className="space-y-7 p-5 sm:p-6">

            {error && (

              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">

                {error}

              </div>

            )}

            <section>

              <SectionTitle>

                Basic Information

              </SectionTitle>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <Field

                  label="Food Name"

                  required

                >

                  <input

                    type="text"

                    value={form.name}

                    onChange={(event) =>

                      onChange(

                        'name',

                        event.target.value

                      )

                    }

                    placeholder="Paneer Butter Masala"

                    className={inputClass}

                  />

                </Field>

                <Field

                  label="Category"

                  required

                >

                  <select

                    value={form.categoryId}

                    onChange={(event) =>

                      onChange(

                        'categoryId',

                        event.target.value

                      )

                    }

                    disabled={

                      categories.length === 0

                    }

                    className={inputClass}

                  >

                    <option value="">

                      Select category

                    </option>

                    {categories.map(

                      (category) => (

                        <option

                          key={

                            category._id

                          }

                          value={

                            category._id

                          }

                        >

                          {category.name}

                        </option>

                      )

                    )}

                  </select>

                  <p className="mt-1.5 text-[10px] text-[#aa9b8e]">

                    Select a category you

                    already created.

                  </p>

                </Field>

                <Field

                  label="Description"

                  className="sm:col-span-2"

                >

                  <textarea

                    value={

                      form.description

                    }

                    onChange={(event) =>

                      onChange(

                        'description',

                        event.target.value

                      )

                    }

                    rows={3}

                    placeholder="Creamy tomato-based paneer curry..."

                    className={`${inputClass} resize-none`}

                  />

                </Field>

                <Field

                  label="Image URL"

                  className="sm:col-span-2"

                >

                  <input

                    type="url"

                    value={form.imageUrl}

                    onChange={(event) =>

                      onChange(

                        'imageUrl',

                        event.target.value

                      )

                    }

                    placeholder="https://example.com/food-image.jpg"

                    className={inputClass}

                  />

                  {form.imageUrl && (

                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#eadfd4] bg-white p-2">

                      <img

                        src={

                          form.imageUrl

                        }

                        alt="Preview"

                        className="h-16 w-16 rounded-lg object-cover"

                        onError={(

                          event

                        ) => {

                          event.currentTarget.style.display =

                            'none';

                        }}

                      />

                      <div>

                        <p className="text-xs font-semibold text-[#332a26]">

                          Image Preview

                        </p>

                        <p className="mt-1 text-[10px] text-[#aa9b8e]">

                          The image will be shown on the guest menu.

                        </p>

                      </div>

                    </div>

                  )}

                </Field>

              </div>

            </section>

            <section>

              <SectionTitle>

                Pricing & Preparation

              </SectionTitle>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <Field

                  label="Price"

                  required

                >

                  <input

                    type="number"

                    min="0"

                    step="0.01"

                    value={form.price}

                    onChange={(event) =>

                      onChange(

                        'price',

                        event.target.value

                      )

                    }

                    placeholder="280"

                    className={inputClass}

                  />

                </Field>

                <Field label="Discount Price">

                  <input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.discountPrice

                    }

                    onChange={(event) =>

                      onChange(

                        'discountPrice',

                        event.target.value

                      )

                    }

                    placeholder="249"

                    className={inputClass}

                  />

                </Field>

                <Field label="Preparation Time">

                  <div className="relative">

                    <input

                      type="number"

                      min="0"

                      value={

                        form.preparationTime

                      }

                      onChange={(event) =>

                        onChange(

                          'preparationTime',

                          event.target.value

                        )

                      }

                      className={`${inputClass} pr-14`}

                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#aa9b8e]">

                      min

                    </span>

                  </div>

                </Field>

                <Field label="Display Order">

                  <input

                    type="number"

                    value={

                      form.displayOrder

                    }

                    onChange={(event) =>

                      onChange(

                        'displayOrder',

                        event.target.value

                      )

                    }

                    className={inputClass}

                  />

                </Field>

              </div>

            </section>

            <section>
              <SectionTitle>Menu Settings</SectionTitle>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#857a72]">
                  Food Type
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onChange('isVeg', true)}
                    aria-pressed={form.isVeg}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition',
                      form.isVeg
                        ? 'border-green-600 bg-green-50 text-green-800 ring-2 ring-green-600/20'
                        : 'border-[#e5d9ce] bg-white text-[#665b54] hover:bg-green-50',
                    ].join(' ')}
                  >
                    <span className="h-3 w-3 rounded-full border-2 border-green-600 bg-green-500" />
                    Vegetarian
                    {form.isVeg && <span aria-hidden="true">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange('isVeg', false)}
                    aria-pressed={!form.isVeg}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition',
                      !form.isVeg
                        ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-600/20'
                        : 'border-[#e5d9ce] bg-white text-[#665b54] hover:bg-red-50',
                    ].join(' ')}
                  >
                    <span className="h-3 w-3 rounded-full border-2 border-red-600 bg-red-500" />
                    Non-Vegetarian
                    {!form.isVeg && <span aria-hidden="true">✓</span>}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Checkbox
                  checked={form.isBestseller}
                  onChange={(value) => onChange('isBestseller', value)}
                  label="Bestseller"
                />

                <Checkbox
                  checked={form.isAvailable}
                  onChange={(value) => onChange('isAvailable', value)}
                  label="Available"
                />
              </div>
            </section>

            <section>

              <div className="flex items-center justify-between gap-3">

                <SectionTitle>

                  Customizations

                </SectionTitle>

                <button

                  type="button"

                  onClick={onAddGroup}

                  className="rounded-lg border border-[#d9c7b7] bg-white px-3 py-2 text-xs font-bold text-[#71303d] transition hover:bg-[#fff8f2]"

                >

                  + Add Group

                </button>

              </div>

              {form.customizations.length ===

              0 ? (

                <div className="mt-4 rounded-2xl border border-dashed border-[#d9c7b7] bg-[#fffaf5] px-5 py-7 text-center">

                  <p className="text-sm font-semibold text-[#665b54]">

                    No customizations

                  </p>

                  <p className="mt-1 text-xs text-[#aa9b8e]">

                    Add options such as size,

                    toppings or spice level.

                  </p>

                </div>

              ) : (

                <div className="mt-4 space-y-4">

                  {form.customizations.map(

                    (

                      group,

                      groupIndex

                    ) => (

                      <CustomizationGroup

                        key={groupIndex}

                        group={group}

                        groupIndex={

                          groupIndex

                        }

                        onRemove={

                          onRemoveGroup

                        }

                        onUpdate={

                          onUpdateGroup

                        }

                        onAddOption={

                          onAddOption

                        }

                        onRemoveOption={

                          onRemoveOption

                        }

                        onUpdateOption={

                          onUpdateOption

                        }

                      />

                    )

                  )}

                </div>

              )}

            </section>

          </div>

          <div className="sticky bottom-0 flex shrink-0 gap-3 border-t border-[#eadfd4] bg-[#fffdf9]/95 p-4 backdrop-blur sm:px-6">

            <button

              type="button"

              onClick={onClose}

              disabled={saving}

              className="flex-1 rounded-xl border border-[#dfd2c7] bg-white px-4 py-3 text-sm font-bold text-[#665b54] transition hover:bg-[#fffaf5] disabled:opacity-50"

            >

              Cancel

            </button>

            <button

              type="submit"

              disabled={

                saving ||

                categories.length === 0

              }

              className="flex-1 rounded-xl bg-[#7b2638] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#682031] disabled:cursor-not-allowed disabled:opacity-60"

            >

              {saving

                ? 'Saving...'

                : editingFood

                ? 'Save Changes'

                : 'Create Food Item'}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

function CustomizationGroup({

  group,

  groupIndex,

  onRemove,

  onUpdate,

  onAddOption,

  onRemoveOption,

  onUpdateOption,

}) {

  return (

    <div className="rounded-2xl border border-[#e5d9ce] bg-[#fffaf5] p-4">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9a7a52]">

            Group {groupIndex + 1}

          </p>

          <p className="mt-1 text-sm font-bold text-[#332a26]">

            Customization

          </p>

        </div>

        <button

          type="button"

          onClick={() =>

            onRemove(groupIndex)

          }

          className="text-xs font-bold text-red-600"

        >

          Remove

        </button>

      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">

        <Field label="Group Name">

          <input

            type="text"

            value={group.name}

            onChange={(event) =>

              onUpdate(

                groupIndex,

                'name',

                event.target.value

              )

            }

            placeholder="Extra Toppings"

            className={inputClass}

          />

        </Field>

        <Field label="Selection Type">

          <select

            value={

              group.selectionType

            }

            onChange={(event) =>

              onUpdate(

                groupIndex,

                'selectionType',

                event.target.value

              )

            }

            className={inputClass}

          >

            <option value="SINGLE">

              Single

            </option>

            <option value="MULTIPLE">

              Multiple

            </option>

          </select>

        </Field>

        <Field label="Minimum Selections">

          <input

            type="number"

            min="0"

            value={

              group.minSelections

            }

            onChange={(event) =>

              onUpdate(

                groupIndex,

                'minSelections',

                event.target.value

              )

            }

            className={inputClass}

          />

        </Field>

        <Field label="Maximum Selections">

          <input

            type="number"

            min="1"

            value={

              group.maxSelections

            }

            onChange={(event) =>

              onUpdate(

                groupIndex,

                'maxSelections',

                event.target.value

              )

            }

            className={inputClass}

          />

        </Field>

      </div>

      <div className="mt-3">

        <Checkbox

          checked={group.required}

          onChange={(value) =>

            onUpdate(

              groupIndex,

              'required',

              value

            )

          }

          label="Customer must select from this group"

        />

      </div>

      <div className="mt-5 border-t border-[#eadfd4] pt-4">

        <div className="flex items-center justify-between gap-3">

          <p className="text-xs font-bold text-[#665b54]">

            Options

          </p>

          <button

            type="button"

            onClick={() =>

              onAddOption(groupIndex)

            }

            className="text-xs font-bold text-[#71303d]"

          >

            + Add Option

          </button>

        </div>

        {group.options.length === 0 ? (

          <p className="mt-3 text-xs text-[#aa9b8e]">

            No options added yet.

          </p>

        ) : (

          <div className="mt-3 space-y-2">

            {group.options.map(

              (

                option,

                optionIndex

              ) => (

                <div

                  key={optionIndex}

                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto_auto]"

                >

                  <input

                    type="text"

                    value={option.name}

                    onChange={(event) =>

                      onUpdateOption(

                        groupIndex,

                        optionIndex,

                        'name',

                        event.target.value

                      )

                    }

                    placeholder="Cheese"

                    className={inputClass}

                  />

                  <input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      option.priceDelta

                    }

                    onChange={(event) =>

                      onUpdateOption(

                        groupIndex,

                        optionIndex,

                        'priceDelta',

                        event.target.value

                      )

                    }

                    placeholder="0"

                    className={inputClass}

                  />

                  <label className="flex items-center gap-2 rounded-xl border border-[#e5d9ce] bg-white px-3 text-xs font-semibold text-[#665b54]">

                    <input

                      type="checkbox"

                      checked={

                        option.isActive

                      }

                      onChange={(event) =>

                        onUpdateOption(

                          groupIndex,

                          optionIndex,

                          'isActive',

                          event.target.checked

                        )

                      }

                    />

                    Active

                  </label>

                  <button

                    type="button"

                    onClick={() =>

                      onRemoveOption(

                        groupIndex,

                        optionIndex

                      )

                    }

                    className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"

                  >

                    ×

                  </button>

                </div>

              )

            )}

          </div>

        )}

      </div>

    </div>

  );

}

function SectionTitle({ children }) {

  return (

    <h3 className="text-sm font-bold text-[#332a26]">

      {children}

    </h3>

  );

}

function Field({

  label,

  required = false,

  children,

  className = '',

}) {

  return (

    <div className={className}>

      <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#857a72]">

        {label}

        {required && (

          <span className="ml-1 text-[#7b2638]">

            *

          </span>

        )}

      </label>

      <div className="mt-2">

        {children}

      </div>

    </div>

  );

}

function Checkbox({

  checked,

  onChange,

  label,

}) {

  return (

    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e5d9ce] bg-white px-4 py-3 text-xs font-semibold text-[#665b54]">

      <input

        type="checkbox"

        checked={checked}

        onChange={(event) =>

          onChange(

            event.target.checked

          )

        }

        className="h-4 w-4 accent-[#7b2638]"

      />

      <span>{label}</span>

    </label>

  );

}

const thClass =

  'px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-[#aa9b8e]';

const inputClass =

  'w-full rounded-xl border border-[#e5d9ce] bg-white px-3.5 py-3 text-sm text-[#332a26] outline-none transition placeholder:text-[#aa9b8e] focus:border-[#7b2638] focus:ring-2 focus:ring-[#7b2638]/10';

export default FoodItemsPage;