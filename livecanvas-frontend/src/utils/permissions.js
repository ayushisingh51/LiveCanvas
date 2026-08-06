function canEdit(page, userId) {
  const isOwner = page.owner.toString() === userId;
  const isCollaborator = page.collaborators.some((c) => c.toString() === userId);
  return isOwner || isCollaborator;
}

module.exports = { canEdit };