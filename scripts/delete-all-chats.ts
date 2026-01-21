import { prisma } from '../lib/prisma'

async function deleteAllChats() {
  try {
    console.log('🗑️  Starting to delete all chat conversations...')
    
    // First, delete all chat messages
    const messagesResult = await prisma.chatMessage.deleteMany({})
    console.log(`✅ Deleted ${messagesResult.count} chat messages`)
    
    // Then, delete all chat conversations
    const conversationsResult = await prisma.chatConversation.deleteMany({})
    console.log(`✅ Deleted ${conversationsResult.count} chat conversations`)
    
    console.log('✨ All chats deleted successfully!')
  } catch (error) {
    console.error('❌ Error deleting chats:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllChats()
