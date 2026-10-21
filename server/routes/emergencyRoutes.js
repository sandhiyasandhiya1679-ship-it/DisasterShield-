
const express = require("express");
const EmergencyRequest = require("../models/EmergencyRequest");
const protect = require("../middleware/authMiddleware");
const protectVolunteer = require("../middleware/volunteerAuthMiddleware");
const protectAdmin = require("../middleware/adminAuthMiddleware");
const Volunteer = require("../models/Volunteer");
const VolunteerTask = require("../models/VolunteerTask");
const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

const router = express.Router();

const ACTIVE_TASK_STATUSES = [
    "ASSIGNED",
    "ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "WORK_IN_PROGRESS"
];

const ACTIVE_REQUEST_STATUSES = [
    "ASSIGNED",
    "ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "WORK_IN_PROGRESS"
];

/*
 * Repair stale task records without deleting task history.
 *
 * A task is stale when its emergency request no longer belongs
 * to the volunteer or its request is no longer active.
 */
async function reconcileStaleTasks(volunteerId) {
    const tasks = await VolunteerTask.find({
        volunteerId,
        status: { $in: ACTIVE_TASK_STATUSES }
    });

    for (const task of tasks) {
        const request = await EmergencyRequest.findById(
            task.emergencyRequestId
        );

        if (
            request &&
            request.status === "COMPLETED" &&
            String(request.volunteerId) === String(task.volunteerId)
        ) {
            task.status = "WORK_COMPLETED";
            task.completedAt = task.completedAt || request.completedAt || new Date();
            await task.save();
            continue;
        }

        const requestStillAssigned =
            request &&
            ACTIVE_REQUEST_STATUSES.includes(request.status) &&
            String(request.volunteerId) === String(task.volunteerId);

        if (!requestStillAssigned) {
            task.status = "REJECTED";
            await task.save();
        }
    }
}

/* USER: Submit an emergency request */
router.post("/request", protect, async (req, res) => {
    try {
        const {
            submissionKey,
            emergencyType,
            description,
            location,
            numberOfPeople,
            priority,
            contactNumber,
            image,
            additionalInformation
        } = req.body;

        if (
            !submissionKey ||
            typeof submissionKey !== "string" ||
            !submissionKey.trim()
        ) {
            return res.status(400).json({
                message: "Please try submitting your request again."
            });
        }

        const cleanKey = submissionKey.trim();

        const existingRequest = await EmergencyRequest.findOne({
            submissionKey: cleanKey
        });

        if (existingRequest) {
            if (String(existingRequest.userId) !== String(req.user.userId)) {
                return res.status(409).json({
                    message:
                        "This submission has already been processed. Please refresh and try again."
                });
            }

            return res.status(200).json({
                message: "Your emergency request has already been submitted.",
                request: existingRequest,
                duplicate: true
            });
        }

        const emergencyRequest = new EmergencyRequest({
            submissionKey: cleanKey,
            userId: req.user.userId,
            emergencyType,
            description,
            location,
            numberOfPeople,
            priority,
            contactNumber,
            image,
            additionalInformation,
            status: "PENDING"
        });

        await emergencyRequest.save();

        return res.status(201).json({
            message: "Emergency help request submitted successfully.",
            request: emergencyRequest
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "This request has already been submitted. Please check My Help Requests."
            });
        }

        console.error("Emergency request submission failed:", error);

        return res.status(500).json({
            message:
                "We couldn't submit your emergency request. Please try again."
        });
    }
});

/* USER: Fetch the logged-in user's requests */
router.get("/my-requests", protect, async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({
            userId: req.user.userId
        })
            .populate(
                "volunteerId",
                "fullName mobile skills availabilityStatus"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your emergency requests fetched successfully",
            requests
        });
    } catch (error) {
        console.error("Failed to fetch user requests:", error);

        return res.status(500).json({
            message: "Failed to fetch your emergency requests"
        });
    }
});

/* ADMIN: Fetch all emergency requests */
router.get("/admin/all", protectAdmin, async (req, res) => {
    try {
        const requests = await EmergencyRequest.find()
            .populate("userId", "-password")
            .populate("volunteerId", "-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Emergency requests fetched successfully",
            requests
        });
    } catch (error) {
        console.error("Failed to fetch admin requests:", error);

        return res.status(500).json({
            message: "Failed to fetch emergency requests"
        });
    }
});

/*
 * ADMIN: Reset a request for testing only.
 * Never reset requests whose work has started or is completed.
 */
router.put("/:id/reset-test", protectAdmin, async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        const protectedStatuses = [
            "ACCEPTED",
            "ON_THE_WAY",
            "ARRIVED",
            "WORK_IN_PROGRESS",
            "COMPLETED"
        ];

        if (protectedStatuses.includes(request.status)) {
            return res.status(400).json({
                message:
                    "This request cannot be reset because work has started or it is already completed."
            });
        }

        await VolunteerTask.updateMany(
            {
                emergencyRequestId: request._id,
                status: { $in: ACTIVE_TASK_STATUSES }
            },
            {
                $set: { status: "REJECTED" }
            }
        );

        request.volunteerId = null;
        request.status = "PENDING";
        request.assignedAt = null;
        request.acceptedAt = null;

        await request.save();

        return res.status(200).json({
            message:
                "Request reset successfully. Its previous active task was marked as rejected.",
            request
        });
    } catch (error) {
        console.error("Failed to reset request:", error);

        return res.status(500).json({
            message: "Failed to reset request."
        });
    }
});

/* ADMIN: Assign an available volunteer */
router.put("/:id/assign", protectAdmin, async (req, res) => {
    try {
        const { volunteerId } = req.body;

        if (!volunteerId) {
            return res.status(400).json({
                message: "Volunteer ID is required"
            });
        }

        const request = await EmergencyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending requests can be assigned"
            });
        }

        const volunteer = await Volunteer.findById(volunteerId);

        if (!volunteer) {
            return res.status(404).json({
                message: "Volunteer not found"
            });
        }

        if (volunteer.availabilityStatus !== "ACTIVE") {
            return res.status(400).json({
                message: "Volunteer is not available"
            });
        }

        // First repair stale records for this volunteer.
        await reconcileStaleTasks(volunteer._id);

        // Only genuine active assignments should block a new assignment.
        const existingTask = await VolunteerTask.findOne({
            volunteerId: volunteer._id,
            status: { $in: ACTIVE_TASK_STATUSES }
        });

        if (existingTask) {
            const activeRequest = await EmergencyRequest.findById(
                existingTask.emergencyRequestId
            );

            if (
                activeRequest &&
                ACTIVE_REQUEST_STATUSES.includes(activeRequest.status) &&
                String(activeRequest.volunteerId) === String(volunteer._id)
            ) {
                return res.status(400).json({
                    message:
                        "This volunteer already has an assigned or active task."
                });
            }

            // Defensive cleanup if a stale record remains.
            existingTask.status = "REJECTED";
            await existingTask.save();
        }

        request.volunteerId = volunteer._id;
        request.status = "ASSIGNED";
        request.assignedAt = new Date();
        request.acceptedAt = null;

        await request.save();

        const task = new VolunteerTask({
            emergencyRequestId: request._id,
            volunteerId: volunteer._id,
            status: "ASSIGNED"
        });

        await task.save();

        await Notification.create({
            userId: request.userId,
            type: "VOLUNTEER_ASSIGNED",
            title: "Volunteer Assigned",
            message: `${volunteer.fullName} has been assigned to your emergency request.`
        });

        await Notification.create({
            volunteerId: volunteer._id,
            type: "VOLUNTEER_ASSIGNED",
            title: "New Emergency Task",
            message: `You have been assigned a ${request.emergencyType} emergency request.`
        });

        return res.status(200).json({
            message: "Volunteer assigned successfully",
            request,
            task
        });
    } catch (error) {
        console.error("Failed to assign volunteer:", error);

        return res.status(500).json({
            message: "Failed to assign volunteer",
            error: error.message
        });
    }
});

/* VOLUNTEER: Fetch assigned tasks */
router.get("/volunteer/tasks", protectVolunteer, async (req, res) => {
    try {
        if (req.volunteer.role !== "VOLUNTEER") {
            return res.status(403).json({
                message: "Volunteer access only"
            });
        }

        await reconcileStaleTasks(req.volunteer.volunteerId);

        const tasks = await VolunteerTask.find({
            volunteerId: req.volunteer.volunteerId
        })
            .populate({
                path: "emergencyRequestId",
                populate: {
                    path: "userId",
                    select: "-password"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Volunteer tasks fetched successfully",
            tasks
        });
    } catch (error) {
        console.error("Failed to fetch volunteer tasks:", error);

        return res.status(500).json({
            message: "Failed to fetch volunteer tasks"
        });
    }
});

/* VOLUNTEER: Accept an assigned task */
router.put(
    "/volunteer/tasks/:taskId/accept",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task) {
                return res.status(404).json({
                    message: "Task not found or not assigned to this volunteer"
                });
            }

            if (task.status !== "ASSIGNED") {
                return res.status(400).json({
                    message: "Only assigned tasks can be accepted"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (!request) {
                task.status = "REJECTED";
                await task.save();

                return res.status(404).json({
                    message:
                        "The linked request no longer exists. This old task has been closed."
                });
            }

            if (
                request.status !== "ASSIGNED" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                task.status = "REJECTED";
                await task.save();

                return res.status(409).json({
                    message:
                        "This old task is no longer assigned to you and has been closed. Refresh your dashboard."
                });
            }

            const volunteer = await Volunteer.findById(
                req.volunteer.volunteerId
            );

            if (!volunteer) {
                return res.status(404).json({
                    message: "Volunteer not found"
                });
            }

            if (volunteer.availabilityStatus !== "ACTIVE") {
                return res.status(400).json({
                    message: "Volunteer is not currently ACTIVE"
                });
            }

            task.status = "ACCEPTED";
            task.acceptedAt = new Date();

            request.status = "ACCEPTED";
            request.acceptedAt = new Date();

            volunteer.availabilityStatus = "BUSY";

            await task.save();
            await request.save();
            await volunteer.save();

            await Notification.create({
                userId: request.userId,
                type: "TASK_UPDATE",
                title: "Volunteer Accepted Your Request",
                message: `${volunteer.fullName} has accepted your emergency request.`
            });

            return res.status(200).json({
                message: "Emergency request accepted successfully",
                task,
                request,
                volunteer: {
                    id: volunteer._id,
                    fullName: volunteer.fullName,
                    availabilityStatus: volunteer.availabilityStatus
                }
            });
        } catch (error) {
            console.error("Failed to accept emergency request:", error);

            return res.status(500).json({
                message: "Failed to accept emergency request",
                error: error.message
            });
        }
    }
);

/* VOLUNTEER: Reject an assigned task */
router.put(
    "/volunteer/tasks/:taskId/reject",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task) {
                return res.status(404).json({
                    message: "Task not found or not assigned to this volunteer"
                });
            }

            if (task.status !== "ASSIGNED") {
                return res.status(400).json({
                    message: "Only assigned tasks can be rejected"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (!request) {
                task.status = "REJECTED";
                await task.save();

                return res.status(404).json({
                    message:
                        "The linked request no longer exists. This old task has been closed."
                });
            }

            if (
                request.status !== "ASSIGNED" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                task.status = "REJECTED";
                await task.save();

                return res.status(409).json({
                    message:
                        "This old task is no longer assigned to you and has been closed. Refresh your dashboard."
                });
            }

            task.status = "REJECTED";
            request.status = "PENDING";
            request.volunteerId = null;
            request.assignedAt = null;
            request.acceptedAt = null;

            await task.save();
            await request.save();

            const admin = await Admin.findOne({ role: "ADMIN" });

            if (admin) {
                await Notification.create({
                    adminId: admin._id,
                    type: "VOLUNTEER_REJECTED",
                    title: "Volunteer Rejected Request",
                    message:
                        "The assigned volunteer rejected an emergency request. Please assign another volunteer.",
                    relatedRequestId: request._id,
                    relatedVolunteerId: task.volunteerId
                });
            }

            return res.status(200).json({
                message: "Emergency request rejected successfully",
                task,
                request
            });
        } catch (error) {
            console.error("Failed to reject emergency request:", error);

            return res.status(500).json({
                message: "Failed to reject emergency request",
                error: error.message
            });
        }
    }
);

/* VOLUNTEER: Mark task as ON THE WAY */
router.put(
    "/volunteer/tasks/:taskId/on-the-way",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task || task.status !== "ACCEPTED") {
                return res.status(400).json({
                    message: "Only accepted tasks can be marked as ON THE WAY"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (
                !request ||
                request.status !== "ACCEPTED" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                return res.status(409).json({
                    message: "This task is no longer active. Refresh your dashboard."
                });
            }

            task.status = "ON_THE_WAY";
            request.status = "ON_THE_WAY";

            await task.save();
            await request.save();

            await Notification.create({
                userId: request.userId,
                type: "TASK_UPDATE",
                title: "Volunteer Is On The Way",
                message:
                    "The assigned volunteer is now on the way to your location."
            });

            return res.status(200).json({
                message: "Volunteer is now on the way",
                task,
                request
            });
        } catch (error) {
            console.error("Failed to update task status:", error);

            return res.status(500).json({
                message: "Failed to update task status",
                error: error.message
            });
        }
    }
);

/* VOLUNTEER: Mark arrival */
router.put(
    "/volunteer/tasks/:taskId/arrived",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task || task.status !== "ON_THE_WAY") {
                return res.status(400).json({
                    message: "Only ON_THE_WAY tasks can be marked as ARRIVED"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (
                !request ||
                request.status !== "ON_THE_WAY" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                return res.status(409).json({
                    message: "This task is no longer active. Refresh your dashboard."
                });
            }

            task.status = "ARRIVED";
            request.status = "ARRIVED";

            await task.save();
            await request.save();

            await Notification.create({
                userId: request.userId,
                type: "TASK_UPDATE",
                title: "Volunteer Has Arrived",
                message: "The assigned volunteer has arrived at your location."
            });

            return res.status(200).json({
                message: "Volunteer has arrived at the location",
                task,
                request
            });
        } catch (error) {
            console.error("Failed to update arrival:", error);

            return res.status(500).json({
                message: "Failed to update task status",
                error: error.message
            });
        }
    }
);

/* VOLUNTEER: Start work */
router.put(
    "/volunteer/tasks/:taskId/work-started",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task || task.status !== "ARRIVED") {
                return res.status(400).json({
                    message: "Only ARRIVED tasks can be started"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (
                !request ||
                request.status !== "ARRIVED" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                return res.status(409).json({
                    message: "This task is no longer active. Refresh your dashboard."
                });
            }

            task.status = "WORK_IN_PROGRESS";
            request.status = "WORK_IN_PROGRESS";

            await task.save();
            await request.save();

            await Notification.create({
                userId: request.userId,
                type: "TASK_UPDATE",
                title: "Work Has Started",
                message:
                    "The volunteer has started working on your emergency request."
            });

            return res.status(200).json({
                message: "Work has started",
                task,
                request
            });
        } catch (error) {
            console.error("Failed to start work:", error);

            return res.status(500).json({
                message: "Failed to start work",
                error: error.message
            });
        }
    }
);

/* VOLUNTEER: Complete work */
router.put(
    "/volunteer/tasks/:taskId/complete",
    protectVolunteer,
    async (req, res) => {
        try {
            const task = await VolunteerTask.findOne({
                _id: req.params.taskId,
                volunteerId: req.volunteer.volunteerId
            });

            if (!task || task.status !== "WORK_IN_PROGRESS") {
                return res.status(400).json({
                    message:
                        "Only work-in-progress tasks can be completed"
                });
            }

            const request = await EmergencyRequest.findById(
                task.emergencyRequestId
            );

            if (
                !request ||
                request.status !== "WORK_IN_PROGRESS" ||
                String(request.volunteerId) !== String(task.volunteerId)
            ) {
                return res.status(409).json({
                    message: "This task is no longer active. Refresh your dashboard."
                });
            }

            const volunteer = await Volunteer.findById(
                req.volunteer.volunteerId
            );

            if (!volunteer) {
                return res.status(404).json({
                    message: "Volunteer not found"
                });
            }

            task.status = "WORK_COMPLETED";
            task.completedAt = new Date();

            request.status = "COMPLETED";
            request.completedAt = new Date();

            volunteer.availabilityStatus = "ACTIVE";

            await task.save();
            await request.save();
            await volunteer.save();

            await Notification.create({
                userId: request.userId,
                type: "TASK_UPDATE",
                title: "Emergency Request Completed",
                message:
                    "Your emergency request has been completed successfully."
            });

            return res.status(200).json({
                message: "Emergency work completed successfully",
                task,
                request,
                volunteer: {
                    id: volunteer._id,
                    fullName: volunteer.fullName,
                    availabilityStatus: volunteer.availabilityStatus
                }
            });
        } catch (error) {
            console.error("Failed to complete emergency work:", error);

            return res.status(500).json({
                message: "Failed to complete emergency work",
                error: error.message
            });
        }
    }
);

module.exports = router;
