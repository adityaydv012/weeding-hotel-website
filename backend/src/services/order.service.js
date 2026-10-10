import { FoodItem } from '../models/FoodItem.js';
import { Hotel } from '../models/Hotel.js';
import { ApiError } from '../utils/apiError.js';
import { randomToken, sha256 } from '../utils/hash.js';

function money(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }

export async function buildOrder({ hotelId, room, items }) {
  const hotel = await Hotel.findOne({ _id: hotelId, isActive: true }).lean();
  if (!hotel) throw new ApiError(404, 'Hotel not found or inactive');

  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'At least one item is required');

  const ids = items.map(i => i.foodItemId);
  const foods = await FoodItem.find({ _id: { $in: ids }, hotelId, isAvailable: true }).lean();
  const foodMap = new Map(foods.map(f => [String(f._id), f]));

  const orderItems = [];
  let subtotal = 0;

  for (const requested of items) {
    const food = foodMap.get(String(requested.foodItemId));
    if (!food) throw new ApiError(400, `Food item unavailable: ${requested.foodItemId}`);
    const quantity = Number(requested.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new ApiError(400, `Invalid quantity for ${food.name}`);

    const selected = Array.isArray(requested.customizations) ? requested.customizations : [];
    const snapshots = [];
    let customizationDelta = 0;

    for (const group of food.customizations) {
      const chosenIds = selected.filter(x => String(x.groupId) === String(group._id)).map(x => String(x.optionId));
      const uniqueIds = [...new Set(chosenIds)];
      if (group.required && uniqueIds.length < Math.max(1, group.minSelections)) {
        throw new ApiError(400, `${group.name} is required for ${food.name}`);
      }
      if (uniqueIds.length < group.minSelections || uniqueIds.length > group.maxSelections) {
        throw new ApiError(400, `Invalid selections for ${group.name}`);
      }
      for (const optionId of uniqueIds) {
        const option = group.options.find(o => String(o._id) === optionId && o.isActive);
        if (!option) throw new ApiError(400, `Invalid customization for ${food.name}`);
        snapshots.push({ groupName: group.name, optionId: option._id, optionName: option.name, priceDelta: option.priceDelta });
        customizationDelta += option.priceDelta;
      }
    }

    const unitPrice = money((food.discountPrice ?? food.price) + customizationDelta);
    const lineTotal = money(unitPrice * quantity);
    subtotal += lineTotal;
    orderItems.push({ foodItemId: food._id, name: food.name, quantity, unitPrice, customizations: snapshots, lineTotal });
  }

  subtotal = money(subtotal);
  const taxAmount = money(subtotal * (hotel.taxPercent / 100));
  const total = money(subtotal + taxAmount);
  const trackingToken = randomToken(24);

  return {
    hotel,
    room,
    orderItems,
    subtotal,
    taxAmount,
    total,
    trackingToken,
    trackingTokenHash: sha256(trackingToken),
  };
}
