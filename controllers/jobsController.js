const Job = require("../modles/jobs");
const ErrorHandler = require("../util/errorHandler");
const geoCoder = require("../util/geocoder");
const asyncErrorHandler = require("../middlewares/catchAsyncErrors");
const APIFilters = require("../util/apiFilters");

//  Get all jobs => /api/v1/jobs
const getJobs = asyncErrorHandler(async (req, res, next) => {
  const apiFilters = new APIFilters(Job, req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination();
  const job = await apiFilters.query;
  res.status(200).json({
    success: true,
    result: job.length,
    data: job,
  });
});

//  Creat a new job => /api/v1/job/new
const newJob = asyncErrorHandler(async (req, res, next) => {
  //Adding user to the body
  req.body.user = req.user.id;

  const job = await Job.create(req.body);
  res.status(200).json({
    success: true,
    message: "Job have been created",
    data: job,
  });
});

//  Search jobs with in a radius => /api/v1/jobs/:zipcoded/:distance
const getJobsInRadius = asyncErrorHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //  Getting latitude and logitude from geocoder with zipcode
  const loc = await geoCoder.geocode(zipcode);
  const latitude = loc[0].latitude;
  const logitude = loc[0].longitude;

  const radius = distance / 3963;

  const jobs = await Job.find({
    location: { $geoWithin: { $centerSphere: [[logitude, latitude], radius] } },
  });

  res.status(200).json({
    success: true,
    result: jobs.length,
    data: jobs,
  });
});

//  Update a job /api/v1/job/:id
const updateJob = asyncErrorHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("job not found.", 404));
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Job is updated",
    data: job,
  });
});

//  Delete a job => /api/v1/job/:id
const deleteJob = asyncErrorHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("job not found.", 404));
  }
  await job.remove();
  res.status(200).json({
    success: true,
    message: "Job have been deleted",
  });
});

//  Get a sigal job with id and slug => /api/v1/:id/:slug
const getjob = asyncErrorHandler(async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  });

  if (!job || job.length == 0) {
    return next(new ErrorHandler("job not found.", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

//  Get states about a topic(jobs) => /api/v1/stats/:topic
const jobStats = asyncErrorHandler(async (req, res, next) => {
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: '"' + req.params.topic + '"' } },
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPostion: { $avg: "$postion" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return next(
      new ErrorHandler(`Not states found for - ${req.params.topic}`, 200)
    );
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getJobs,
  newJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getjob,
  jobStats,
};
