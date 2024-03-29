const ResponseModel = require("../helpers/ResponseModel");
const PagedModel = require("../helpers/PagedModel");
const OrderPostsModel = require("./../models/orderPost.model");
const UserModel = require("./../models/user.model");
const Role = require("./../models/role.model");
const { default: mongoose } = require("mongoose");

//thêm mới
const insertNewOrderPosts = (req, res) => {
  let response = "";
  try {
    req.body.user = req?.user?.id;
    req.body.text = Date.now();
    const resData = new OrderPostsModel(req.body);
    resData.save((err, data) => {
      if (err) {
        response = new ResponseModel(500, err.message, err);
        res.status(500).json(response);
      } else {
        response = new ResponseModel(200, `Thêm thành công`, data);
        res.status(200).json(response);
      }
    });
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    res.status(500).json(response);
  }
};

// lấy danh sách kết quả theo điều kiện
const getListOrderPosts = async (req, res) => {
  const pageSize = parseInt(req.query?.pageSize) || 5;
  const pageIndex = parseInt(req.query?.pageIndex) || 1;
  let response = "";
  let responsePage = "";
  let result = [];
  let resultTotal = 0;
  const userId = req?.user?.id;
  const objSearch = {};

  if (req.body.title) {
    objSearch.title = { $regex: ".*" + req.body.title + ".*" };
  }
  if (req.body.createdAt && req.body.createdAt.length === 2) {
    const dateFrom = new Date(req.body.createdAt[0]);
    const startDate = new Date(
      dateFrom.getFullYear(),
      dateFrom.getMonth(),
      dateFrom.getDate(),
      0,
      0,
      0
    );
    const dateTo = new Date(req.body.createdAt[1]);
    const endDate = new Date(
      dateTo.getFullYear(),
      dateTo.getMonth(),
      dateTo.getDate(),
      23,
      59,
      59
    );
    objSearch["createdAt"] = { $gte: startDate, $lte: endDate };
  }

  if (req.body.moneyPerWord) {
    objSearch.moneyPerWord = { $gte: req.body.moneyPerWord };
  }

  if (req.body.keyword) {
    objSearch.keyword = { $regex: ".*" + req.body.keyword + ".*" };
  }
  if (req.body.status && req.body.status !== "2") {
    objSearch.status = req.body?.status;
  }
  if (req.body.ctv) {
    objSearch.ctv = new mongoose.Types.ObjectId(req.body.ctv);
  }
  if (req.body.statusOrderPost && req.body.statusOrderPost !== "2") {
    objSearch.statusOrderPost = req.body.statusOrderPost;
  }
  if (req.body.paymentStatus && req.body.paymentStatus !== "2") {
    let a = { 0: false, 1: true }?.[req.body.paymentStatus];
    objSearch.paymentStatus = a;
  }
  if (req.body.moneyPerWord) {
    objSearch.moneyPerWord = { $gte: parseInt(req.body.moneyPerWord) };
  }
  try {
    const checkUserRole = await UserModel.findById(userId).select("role");
    if (checkUserRole) {
      if (checkUserRole?.role === "Member") {
        if (userId) {
          objSearch["user"] = userId;
        }
        result = await OrderPostsModel.find({ $and: [objSearch] })
          .populate("ctv")
          .skip((pageIndex - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 });
        resultTotal = await OrderPostsModel.find({
          $and: [objSearch],
        }).countDocuments();
      } else if (checkUserRole?.role === "Admin") {
        result = await OrderPostsModel.find({ $and: [objSearch] })
          .populate("ctv")
          .skip((pageIndex - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 });
        resultTotal = await OrderPostsModel.find({
          $and: [objSearch],
        }).countDocuments();
      } else {
        objSearch.status = 1;
        objSearch.isExpired = false;

        objSearch._id = result = await OrderPostsModel.find({
          $and: [objSearch],
        })
          .populate("ctv")
          .skip((pageIndex - 1) * pageSize)
          .limit(pageSize)
          .sort({ createdAt: -1 });
        resultTotal = await OrderPostsModel.find({
          $and: [objSearch],
        }).countDocuments();
      }
      responsePage = new PagedModel(
        pageIndex,
        pageSize,
        0,
        result,
        resultTotal
      );
      res.status(200).json(responsePage);
    } else {
      response = new ResponseModel(200, "Không tìm bài viết.", []);
      res.status(200).json(response);
    }
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    res.status(500).json(response);
  }
};

//Cập nhập kết quả hiện có
const updateRecord = async (req, res) => {
  console.log(`fakjhsdf`, req.body);
  const { expired } = req.body;
  const date = new Date(expired);
  const timestamp = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
  const currentDate = Date.now();
  if (timestamp > currentDate) req.body.isExpired = false;
  // req.body.user = req?.user?.id;
  const id = req?.body?._id || req?.body?.id;
  req.body.isExpired = false;
  let response = "";
  try {
    const checkRecordExist = await OrderPostsModel.findById(id);
    if (checkRecordExist) {
      const result = await OrderPostsModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response = new ResponseModel(200, "Cập nhập thành công.", result);
      res.status(200).json(response);
    } else {
      response = new ResponseModel(404, "Không tìm thấy bài viết.", null);
      res.status(404).json(response);
    }
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    res.status(500).json(response);
  }
};
//Cập nhập trạng thái
const updateStatusBanking = async (req, res) => {
  // console.log(`fakjhsdf`, req.body);
  const id = req?.body?._id || req?.body?.id;
  let response = "";
  try {
    const checkRecordExist = await OrderPostsModel.findById(id);
    console.log("checkRecordExist: ", checkRecordExist);
    if (!checkRecordExist?.paymentStatus) {
      if (checkRecordExist) {
        const result = await OrderPostsModel.findByIdAndUpdate(
          id,
          {
            $set: { paymentStatus: true, withdrawnDate: Date.now() },
          },
          {
            new: true,
          }
        );
        response = new ResponseModel(200, "Cập nhập thành công.", result);
        res.status(200).json(response);
      } else {
        response = new ResponseModel(404, "Không tìm thấy bài viết.", null);
        res.status(404).json(response);
      }
    } else {
      response = new ResponseModel(
        409,
        "Bài viết này đã được thanh toán.",
        null
      );
      res.status(200).json(response);
    }
    return;
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    res.status(500).json(response);
  }
};
const receivedPost = async (req, res) => {
  let response = {};
  const user = req?.user?.id;
  try {
    const userInfo = await UserModel.findOne({ _id: user, role: "CTV" });
    if (userInfo) {
      if (userInfo.star <= userInfo.processingPost) {
        response = new ResponseModel(
          202,
          "Hiện tại số bài viết của bạn đã đạt giới hạn. Vui lòng hoàn thành để có thể nhận thêm",
          "Hiện tại số bài viết của bạn đã đạt giới hạn. Vui lòng hoàn thành để có thể nhận thêm"
        );
        return res.status(202).json(response);
      } else {
        const post = await OrderPostsModel.findById(req.params.id);
        if (post) {
          if (post.ctv) {
            response = new ResponseModel(
              202,
              "Bài viết đã có CTV nhận. Vui lòng reload lại trang",
              "Bài viết đã có CTV nhận. Vui lòng reload lại trang"
            );
            return res.status(202).json(response);
          } else {
            OrderPostsModel.findByIdAndUpdate(
              req.params.id,
              {
                ctv: user,
                statusOrderPost: 0,
              },
              {},
              (err, result) => {
                if (err) {
                  response = new ResponseModel(
                    202,
                    "Đã có lỗi. Vui lòng thử lại sau",
                    "Đã có lỗi. Vui lòng thử lại sau"
                  );
                  return res.status(202).json(response);
                } else {
                  UserModel.findByIdAndUpdate(
                    user,
                    {
                      processingPost: parseInt(userInfo?.processingPost) + 1,
                    },
                    {},
                    (errUser, resultUpdateUser) => {
                      if (errUser) {
                        response = new ResponseModel(
                          202,
                          "Đã có lỗi. Vui lòng thử lại sau",
                          "Đã có lỗi. Vui lòng thử lại sau"
                        );
                        return res.status(202).json(response);
                      } else {
                        response = new ResponseModel(
                          200,
                          "Nhận bài viết thành công!",
                          "Nhận bài viết thành công!"
                        );
                        return res.status(200).json(response);
                      }
                    }
                  );
                }
              }
            );
          }
        } else {
          response = new ResponseModel(202, "Post not found", "Post not found");
          return res.status(202).json(response);
        }
      }
    } else {
      response = new ResponseModel(202, "User not found", "User not found");
      return res.status(202).json(response);
    }
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    return res.status(500).json(response);
  }
};

const refundPost = async (req, res) => {
  let response = null;
  try {
    const id = req.params.id;
    const user = req.user.id;
    const postOrder = await OrderPostsModel.findOne({ _id: id, ctv: user });
    if (!postOrder) {
      response = new ResponseModel(400, "Post not found", "Post not found");
      return res.status(400).json(response);
    } else {
      if (postOrder.statusOrderPost !== 0) {
        response = new ResponseModel(
          400,
          "Post can't refund",
          "Post can't refund"
        );
        return res.status(400).json(response);
      } else {
        OrderPostsModel.findByIdAndUpdate(
          id,
          {
            ctv: null,
            statusOrderPost: -1,
          },
          {},
          async (err, result) => {
            if (err) {
              response = new ResponseModel(
                400,
                "Post can't refund",
                "Post can't refund"
              );
              return res.status(400).json(response);
            } else {
              const userInfo = await UserModel.findOne({
                _id: user,
                role: "CTV",
              });
              if (!userInfo) {
                response = new ResponseModel(
                  400,
                  "User not found",
                  "User not found"
                );
                return res.status(400).json(response);
              } else {
                UserModel.findByIdAndUpdate(
                  userInfo?._id,
                  {
                    star: parseInt(userInfo?.star) - 1,
                    processingPost: parseInt(userInfo?.processingPost) - 1,
                  },
                  {},
                  (errorUser, userUpdate) => {
                    if (errorUser) {
                      response = new ResponseModel(
                        400,
                        "User not found",
                        "User not found"
                      );
                      return res.status(400).json(response);
                    } else {
                      response = new ResponseModel(
                        200,
                        "Refund Post Success",
                        "Refund Post Success"
                      );
                      return res.status(200).json(response);
                    }
                  }
                );
              }
            }
          }
        );
      }
    }
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    return res.status(500).json(response);
  }
};
// Xóa kết quả hiện có
const deleteRecord = async (req, res) => {
  const { id } = req.params;
  let response = "";

  try {
    const checkRecordExist = await OrderPostsModel.findById(id);
    if (checkRecordExist) {
      if (!checkRecordExist?.ctv) {
        const result = await OrderPostsModel.findByIdAndDelete(id);
        if (Object.keys(result).length > 0) {
          response = new ResponseModel(200, "Xóa thành công.", result);
          res.status(200).json(response);
        }
      } else {
        response = new ResponseModel(200, "Bài viết đã có người nhận.", result);
        res.status(200).json(response);
      }
    } else {
      response = new ResponseModel(200, "Không tìm thấy bài viết.", null);
      res.status(404).json(response);
    }
  } catch (error) {
    response = new ResponseModel(500, error.message, error);
    res.status(500).json(response);
  }
};

module.exports = {
  insertNewOrderPosts,
  getListOrderPosts,
  deleteRecord,
  updateRecord,
  receivedPost,
  refundPost,
  updateStatusBanking,
};
