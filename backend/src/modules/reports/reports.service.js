const prisma = require("../../lib/prisma");
const { getPublicUrl } = require("../../lib/storage");

function mapAttachment(attachment) {
  return {
    ...attachment,
    url: getPublicUrl(attachment.path),
  };
}

async function getAllReports() {
  const reports = await prisma.reports.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return reports;
}

async function getReportsByPostId(postId) {
  const reports = await prisma.reports.findMany({
    where: {
      postId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return reports;
}

async function createReport(postId, userId) {
  const existing = await prisma.reports.findFirst({
    where: { postId, userId }
  });

  if (existing) {
    const error = new Error("Ya has reportado esta publicación");
    error.statusCode = 400;
    throw error;
  }

  const report = await prisma.reports.create({
    data: {
      postId,
      userId,
    },
  });

  return report;
}

async function deleteReports(postId) {
  const reports = await prisma.reports.deleteMany({
    where: {
      postId,
    },
  });
  return reports;
}

async function getTotalReportsByPostId(postId) {
  const count = await prisma.reports.count({
    where: {
      postId,
    },
  });
  return count;
}

async function getReportedPosts() {
  const reportCounts = await prisma.reports.groupBy({
    by: ['postId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  const postIds = reportCounts.map(rc => rc.postId);

  if (postIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds }, status: "PUBLISHED" },
    include: {
      author: {
        include: { role: true },
      },
      attachments: true,
      tags: true,
    },
  });

  const sortedPosts = reportCounts.map(rc => {
    const post = posts.find(p => p.id === rc.postId);
    if (!post) return null;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      isAnonymous: post.isAnonymous,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      attachments: post.attachments.map(mapAttachment),
      tags: post.tags,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        institutionalEmail: post.author.institutionalEmail,
        role: post.author.role?.name,
        hasCedulaPhoto: Boolean(post.author.cedulaPhotoPath),
        cedulaPhotoName: post.author.cedulaPhotoName,
      },
      reportCount: rc._count.id,
    };
  }).filter(Boolean);

  return sortedPosts;
}

module.exports = {
  getAllReports,
  getReportsByPostId,
  createReport,
  deleteReports,
  getTotalReportsByPostId,
  getReportedPosts
};
