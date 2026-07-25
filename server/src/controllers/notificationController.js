import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import env from '../config/env.js';
import { success, error } from '../utils/response.js';

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

export async function subscribe(req, res, next) {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error(res, 'Invalid subscription data');
    }

    await PushSubscription.findOneAndUpdate(
      { merchantId: req.admin?.merchantId, endpoint },
      { endpoint, keys, userAgent: req.headers['user-agent'] || '' },
      { upsert: true, new: true },
    );

    return success(res, { message: 'Subscription saved' });
  } catch (err) {
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return error(res, 'Endpoint required');

    await PushSubscription.findOneAndDelete({ merchantId: req.admin?.merchantId, endpoint });
    return success(res, { message: 'Subscription removed' });
  } catch (err) {
    next(err);
  }
}

export async function triggerNotification(req, res, next) {
  try {
    const { title, body, url } = req.body;

    if (!title) return error(res, 'Title required');

    const subscriptions = await PushSubscription.find({ merchantId: req.admin?.merchantId });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title, body, url, timestamp: Date.now() }),
        ),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      const failedSubs = subscriptions.filter((_, i) => results[i].status === 'rejected');
      const expiredEndpoints = failedSubs
        .filter((_, i) => {
          const result = results[subscriptions.indexOf(failedSubs[i])];
          return result.status === 'rejected' && result.reason?.statusCode === 410;
        })
        .map((s) => s._id);

      if (expiredEndpoints.length > 0) {
        await PushSubscription.deleteMany({ _id: { $in: expiredEndpoints } });
      }
    }

    return success(res, { sent, failed, expiredRemoved: expiredEndpoints?.length || 0 });
  } catch (err) {
    next(err);
  }
}
