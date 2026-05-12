const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const filterSchema = new mongoose.Schema({
  filterId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  filterName: { type: String, required: true },
  filterPrice: { type: Number, required: true, min: 0 },
  isChecked: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  taskName: { type: String, required: true },
  // taskPrice: { type: Number, required: true, min: 0 },
  checked: { type: Boolean, default: false },
  // filters: [filterSchema],
});

const categorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  categoryName: { type: String, required: true },
  tasks: [taskSchema],
});

 const LocationSchema = new mongoose.Schema({
   description: { type: String, required: true, trim: true },
   city: { type: String, default: '', trim: true },
   state: { type: String, default: '', trim: true },
   stateShort: { type: String, default: '', trim: true },
   country: { type: String, default: '', trim: true },
   zipcode: { type: String, default: null, trim: true },
   zipcodes: {
     type: [String],
     default: []
   },
   type: {
     type: String,
     enum: ['city', 'state', 'zipcode', 'country', 'radius'],
     required: true
   },
   radius: { type: Number, default: null },   // numeric radius, e.g. 20
   unit: { type: String, default: null },     // e.g. "Miles"
 });



const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // select: false,
    },
    service_areas_zipcodes: {
      type: [String],
      required: false,
      default: [],
    },
    unselected_zipcodes: {
      type: [String],
      required: false,
      default: [],
    },
    locations: [LocationSchema],
    categories: [categorySchema],
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "pending"
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Hash password before save
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Compare password
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

module.exports = mongoose.model("User", userSchema);
