const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...');
    
    // Kiểm tra tất cả requests
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n=== Recent Requests ===');
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ID: ${req.id}, Container: ${req.container_no}, Created: ${req.createdAt}, Status: ${req.status}`);
    });
    
    // Kiểm tra duplicate ISO 1234
    const iso1234Requests = await prisma.serviceRequest.findMany({
      where: { container_no: 'ISO 1234' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n=== ISO 1234 Requests ===');
    iso1234Requests.forEach((req, index) => {
      console.log(`${index + 1}. ID: ${req.id}, Created: ${req.createdAt}, Status: ${req.status}`);
    });
    
    // Kiểm tra documents
    const documents = await prisma.documentFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n=== Recent Documents ===');
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc.id}, Request: ${doc.request_id}, Type: ${doc.type}, Name: ${doc.originalName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

