import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export enum LikeType {
  POST = 'POST',
  COMMENT = 'COMMENT'
}

export class LikeService {
  // Like a post or comment
  async likeContent(
    userId: string,
    contentId: string,
    contentType: LikeType
  ): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
    try {
      // Check if user already liked this content
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_contentId_contentType: {
            userId,
            contentId,
            contentType
          }
        }
      });

      if (existingLike) {
        // Unlike the content
        await prisma.like.delete({
          where: {
            userId_contentId_contentType: {
              userId,
              contentId,
              contentType
            }
          }
        });

        // Get updated like count
        const likeCount = await prisma.like.count({
          where: {
            contentId,
            contentType
          }
        });

        logger.info('Content unliked', { userId, contentId, contentType, likeCount });
        return { success: true, liked: false, likeCount };
      } else {
        // Like the content
        await prisma.like.create({
          data: {
            userId,
            contentId,
            contentType
          }
        });

        // Get updated like count
        const likeCount = await prisma.like.count({
          where: {
            contentId,
            contentType
          }
        });

        logger.info('Content liked', { userId, contentId, contentType, likeCount });
        return { success: true, liked: true, likeCount };
      }
    } catch (error) {
      logger.error('Error liking content:', error);
      throw error;
    }
  }

  // Get like status for a user and content
  async getLikeStatus(
    userId: string,
    contentId: string,
    contentType: LikeType
  ): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const [liked, likeCount] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_contentId_contentType: {
              userId,
              contentId,
              contentType
            }
          }
        }),
        prisma.like.count({
          where: {
            contentId,
            contentType
          }
        })
      ]);

      return {
        liked: !!liked,
        likeCount
      };
    } catch (error) {
      logger.error('Error getting like status:', error);
      throw error;
    }
  }

  // Get all likes for a content
  async getContentLikes(
    contentId: string,
    contentType: LikeType,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: {
          contentId,
          contentType
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.like.count({
        where: {
          contentId,
          contentType
        }
      })
    ]);

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get user's liked content
  async getUserLikes(
    userId: string,
    contentType?: LikeType,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (contentType) {
      where.contentType = contentType;
    }

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.like.count({ where })
    ]);

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get like statistics
  async getLikeStats(contentId: string, contentType: LikeType) {
    const [totalLikes, recentLikes] = await Promise.all([
      prisma.like.count({
        where: {
          contentId,
          contentType
        }
      }),
      prisma.like.count({
        where: {
          contentId,
          contentType,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return {
      totalLikes,
      recentLikes,
      engagement: recentLikes > 0 ? 'high' : totalLikes > 10 ? 'medium' : 'low'
    };
  }
}

export default new LikeService();
