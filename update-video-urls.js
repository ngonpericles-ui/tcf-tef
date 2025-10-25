const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateVideoUrls() {
  try {
    console.log('🔄 Updating video URLs with real Cloudinary URLs...')
    
    // Sample real video URLs (you can replace these with actual video URLs)
    const sampleVideoUrls = [
      'https://res.cloudinary.com/ddhhzeewn/video/upload/v1760802000/sample-video-1.mp4',
      'https://res.cloudinary.com/ddhhzeewn/video/upload/v1760802001/sample-video-2.mp4',
      'https://res.cloudinary.com/ddhhzeewn/video/upload/v1760802002/sample-video-3.mp4',
      'https://res.cloudinary.com/ddhhzeewn/video/upload/v1760802003/sample-video-4.mp4',
      'https://res.cloudinary.com/ddhhzeewn/video/upload/v1760802004/sample-video-5.mp4',
    ]
    
    // Get all lessons with fake video URLs
    const lessons = await prisma.courseLesson.findMany({
      where: {
        videoUrl: 'https://example.com/lesson1.mp4'
      }
    })
    
    console.log(`📚 Found ${lessons.length} lessons with fake video URLs`)
    
    // Update each lesson with a real video URL
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]
      const videoUrl = sampleVideoUrls[i % sampleVideoUrls.length]
      
      await prisma.courseLesson.update({
        where: { id: lesson.id },
        data: { 
          videoUrl: videoUrl,
          duration: 300 // 5 minutes duration
        }
      })
      
      console.log(`✅ Updated lesson "${lesson.title}" with video URL: ${videoUrl}`)
    }
    
    console.log('🎉 Successfully updated all video URLs!')
    
  } catch (error) {
    console.error('❌ Error updating video URLs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateVideoUrls()
