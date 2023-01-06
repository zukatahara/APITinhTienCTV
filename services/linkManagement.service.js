const { LINK_STATUS } = require("../helpers");
const LinkManagement = require("../models/linkManagement.model");

const create = async (data) => {
  try {
    const { link_post, number_words, category, status, keyword } = data;

    if (!link_post || !category || !keyword) {
      throw { message: "Vui lòng nhập thông tin" };
    }

    const linkManagement = new LinkManagement({
      ...data,
    });

    linkManagement.keyword = keyword;
    linkManagement.link_post = link_post;
    linkManagement.number_words = number_words;
    linkManagement.category = category;
    linkManagement.status = Number(status || LINK_STATUS.PENDING);

    const newLinkManagement = await linkManagement.save();

    return newLinkManagement;
  } catch (error) {
    throw error;
  }
};

const update = async ({ id, linkManagement }) => {
  try {
    const { title, link_post, number_words, category, status } = linkManagement;

    if (!title || !link_post || !number_words || !category || !status) {
      throw { message: "Vui lòng nhập thông tin" };
    }

    const newLinkManagement = await LinkManagement.findByIdAndUpdate(
      id,
      linkManagement
    );

    return newLinkManagement;
  } catch (error) {
    throw error;
  }
};

const search = async (pageSize = 10, pageIndex = 1, search = "") => {
  try {
    let searchObj = {};
    if (search) {
      searchObj.name = { $regex: ".*" + search + ".*" };
    }

    let data = await LinkManagement.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdAt: "DESC",
      });

    let count = await LinkManagement.find(searchObj).countDocuments();

    let totalPages = Math.ceil(count / pageSize);

    let pagedModel = {
      pageIndex,
      pageSize,
      totalPages,
      data,
      count,
    };

    return pagedModel;
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    const linkManagement = await LinkManagement.findById(id);

    if (!linkManagement) throw { message: "Not found Link Management" };

    return linkManagement;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  update,
  search,
  getById,
};
