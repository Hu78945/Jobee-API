const mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");
const geoCoder = require("../util/geocoder");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the title of the job."],
    trim: true,
    maxlength: [100, "Job title can not exceed 100 characters."],
  },
  slug: String,
  description: {
    type: String,
    required: [true, "Please enter job desription"],
    maxlength: [1000, "Job Description can not exceed 1000 characters."],
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please enter a valid email."],
  },
  address: {
    type: String,
    required: [true, "Please add an address."],
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    formattedAddress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  company: {
    type: String,
    required: [true, "Please add a compnay name."],
  },
  industry: {
    type: [String],
    required: [true, "Please enter inustry for this job"],
    enum: {
      values: [
        "Business",
        "Information Technology",
        "Banking",
        "Education/Traning",
        "Telecommuncation",
        "others",
      ],
      message: "Please select correct options for industry",
    },
  },
  jobType: {
    type: String,
    required: [true, "Please enter job type"],
    enum: {
      values: ["Permanent", "Temporary", "Internship"],
      message: "Please select correct options for job type",
    },
  },
  minEducation: {
    type: String,
    required: [true, "Please enter minimum education for this job."],
    enum: {
      values: ["Bachelors", "Masters", "Phd"],
      message: "Please select correct option for Education.",
    },
  },
  postion: {
    type: Number,
    default: 1,
  },
  experience: {
    type: String,
    required: [true, "Please enter the experience required for this job."],
    enum: {
      values: [
        "No Experience",
        "1 Year - 2 Years",
        "2 Year - 5 Years",
        "5 Years +",
      ],
      message: "Please select correct options for Experience",
    },
  },
  salary: {
    type: Number,
    required: [true, "Please enter expected salary for this job"],
  },
  postingDate: {
    type: Date,
    default: Date.now(),
  },
  lastDate: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 7),
  },
  applicantsApplied: {
    type: [Object],
    select: false, //It will not be displayed to the user
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

//Mongoose Pre Middleware

//  Creating job slug before saving
jobSchema.pre("save", function (next) {
  //Creating slug before saving it to DB
  this.slug = slugify(this.title, { lower: true });
  next();
});

//  Setting up Loation
jobSchema.pre("save", async function (next) {
  const location = await geoCoder.geocode(this.address);

  this.location = {
    type: "Point",
    coordinates: [location[0].longitude, location[0].latitude],
    formattedAddress: location[0].formattedAddress,
    city: location[0].city,
    state: location[0].stateCode,
    zipcode: location[0].zipcode,
    country: location[0].countryCode,
  };
  next();
});

module.exports = mongoose.model("Job", jobSchema);
