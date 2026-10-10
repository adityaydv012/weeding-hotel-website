import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },

    venue: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },

    coverImageUrl: {
      type: String,
      default: '',
    },

    startAt: {
      type: Date,
      required: true,
      index: true,
    },

    endAt: {
      type: Date,
      required: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({
  hotelId: 1,
  startAt: 1,
});

export const Event = mongoose.model(
  'Event',
  eventSchema
);