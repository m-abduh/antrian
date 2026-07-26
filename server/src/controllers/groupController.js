import Group from '../models/Group.js';
import Merchant from '../models/Merchant.js';
import { success, error } from '../utils/response.js';

export async function getGroups(req, res, next) {
  try {
    const groups = await Group.find({ merchantId: req.admin.merchantId })
      .populate('serviceIds')
      .sort({ order: 1, name: 1 });
    return success(res, groups);
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { name, serviceIds } = req.body;

    if (!name || !name.trim()) return error(res, 'Nama grup wajib diisi');

    const group = await Group.create({
      merchantId: req.admin.merchantId,
      name: name.trim(),
      serviceIds: serviceIds || [],
    });

    return success(res, group, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const { id } = req.params;
    const { name, serviceIds, order } = req.body;

    const group = await Group.findOne({ _id: id, merchantId: req.admin.merchantId });
    if (!group) return error(res, 'Grup tidak ditemukan', 404);

    if (name !== undefined) group.name = name.trim();
    if (serviceIds !== undefined) group.serviceIds = serviceIds;
    if (order !== undefined) group.order = order;

    await group.save();
    return success(res, group);
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const { id } = req.params;

    const group = await Group.findOneAndDelete({ _id: id, merchantId: req.admin.merchantId });
    if (!group) return error(res, 'Grup tidak ditemukan', 404);

    return success(res, { message: 'Grup berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

export async function getMerchantGroups(req, res, next) {
  try {
    const { slug } = req.params;

    const merchant = await Merchant.findOne({ slug });
    if (!merchant) return error(res, 'Merchant tidak ditemukan', 404);

    const groups = await Group.find({ merchantId: merchant._id })
      .populate({
        path: 'serviceIds',
        match: { isActive: true },
      })
      .sort({ order: 1, name: 1 });

    const groupsWithActive = groups
      .map(g => ({
        ...g.toObject(),
        serviceIds: g.serviceIds.filter(s => s && s.isActive),
      }))
      .filter(g => g.serviceIds.length > 0);

    return success(res, groupsWithActive);
  } catch (err) {
    next(err);
  }
}
