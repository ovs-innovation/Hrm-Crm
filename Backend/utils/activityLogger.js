import Activity from '../models/Activity.js';

export const logActivity = async ({
  entityType,
  entityId,
  entityLabel,
  type = 'note',
  title,
  body,
  metadata,
  req,
}) => {
  const user = req?.user;
  return Activity.create({
    entityType,
    entityId,
    entityLabel,
    type,
    title,
    body,
    metadata,
    createdBy: user?._id?.toString?.(),
    createdByName: user?.name,
  });
};
