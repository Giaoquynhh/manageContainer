const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRepairStatus() {
  try {
    console.log('=== DEBUG REPAIR TICKET STATUS ===');
    
    // Lấy tất cả repair ticket
    const allRepairs = await prisma.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n--- Tất cả repair ticket (10 mới nhất) ---');
    allRepairs.forEach(repair => {
      console.log(`ID: ${repair.id}`);
      console.log(`Code: ${repair.code}`);
      console.log(`Container No: ${repair.container_no}`);
      console.log(`Status: ${repair.status}`);
      console.log(`Created At: ${repair.createdAt}`);
      console.log(`Updated At: ${repair.updatedAt}`);
      console.log(`Manager Comment: ${repair.manager_comment}`);
      console.log('---');
    });
    
    // Kiểm tra repair ticket có status REJECTED
    const rejectedRepairs = await prisma.repairTicket.findMany({
      where: { status: 'REJECTED' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n--- Repair ticket có status REJECTED ---');
    rejectedRepairs.forEach(repair => {
      console.log(`ID: ${repair.id}`);
      console.log(`Code: ${repair.code}`);
      console.log(`Container No: ${repair.container_no}`);
      console.log(`Status: ${repair.status}`);
      console.log(`Created At: ${repair.createdAt}`);
      console.log(`Updated At: ${repair.updatedAt}`);
      console.log(`Manager Comment: ${repair.manager_comment}`);
      console.log('---');
    });
    
    // Kiểm tra repair ticket có status CHECKING
    const checkingRepairs = await prisma.repairTicket.findMany({
      where: { status: 'CHECKING' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n--- Repair ticket có status CHECKING ---');
    checkingRepairs.forEach(repair => {
      console.log(`ID: ${repair.id}`);
      console.log(`Code: ${repair.code}`);
      console.log(`Container No: ${repair.container_no}`);
      console.log(`Status: ${repair.status}`);
      console.log(`Created At: ${repair.createdAt}`);
      console.log(`Updated At: ${repair.updatedAt}`);
      console.log(`Manager Comment: ${repair.manager_comment}`);
      console.log('---');
    });
    
    // Kiểm tra service request có container_no tương ứng
    if (rejectedRepairs.length > 0) {
      const containerNos = rejectedRepairs.map(r => r.container_no).filter(Boolean);
      if (containerNos.length > 0) {
        console.log('\n--- Service Request tương ứng ---');
        const requests = await prisma.serviceRequest.findMany({
          where: { container_no: { in: containerNos } }
        });
        
        requests.forEach(req => {
          console.log(`Request ID: ${req.id}`);
          console.log(`Container No: ${req.container_no}`);
          console.log(`Status: ${req.status}`);
          console.log(`Created At: ${req.createdAt}`);
          console.log(`Updated At: ${req.updatedAt}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRepairStatus();
