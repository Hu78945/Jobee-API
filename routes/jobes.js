const router = require("express").Router();

//  Importing jobs controller methods
const {
  getJobs,
  newJob,
  getJobsInRadius,
  updateJob,
  deleteJob,
  getjob,
  jobStats,
} = require("../controllers/jobsController");

const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

router.route("/jobs").get(getJobs);

router
  .route("/job/new")
  .post(isAuthenticatedUser, authorizeRole("employeer", "admin"), newJob);

router.route("/jobs/:zipcode/:distance").get(getJobsInRadius);
router
  .route("/job/:id")
  .put(isAuthenticatedUser, authorizeRole("employeer", "admin"), updateJob)
  .delete(isAuthenticatedUser, authorizeRole("employeer", "admin"), deleteJob);

router.route("/job/:id/:slug").get(getjob);

router.route("/stats/:topic").get(jobStats);

module.exports = router;
