const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPendingAcceptLogic() {
  try {
    console.log('=== KIỂM TRA LOGIC PENDING_ACCEPT ===\n');
    
    // 1. Kiểm tra các phiếu sửa chữa có trạng thái PENDING_ACCEPT
    console.log('1. Các phiếu sửa chữa có trạng thái PENDING_ACCEPT:');
    const pendingAcceptRepairs = await prisma.repairTicket.findMany({
      where: { status: 'PENDING_ACCEPT' },
      select: {
        id: true,
        code: true,
        container_no: true,
        status: true,
        estimated_cost: true,
        labor_cost: true
      }
    });
    
    if (pendingAcceptRepairs.length === 0) {
      console.log('   - Không có phiếu nào có trạng thái PENDING_ACCEPT');
    } else {
      pendingAcceptRepairs.forEach(repair => {
        console.log(`   - ${repair.code}: Container ${repair.container_no}, Chi phí: ${repair.estimated_cost}`);
      });
    }
    
    // 2. Kiểm tra các request có trạng thái PENDING_ACCEPT
    console.log('\n2. Các request có trạng thái PENDING_ACCEPT:');
    const pendingAcceptRequests = await prisma.serviceRequest.findMany({
      where: { status: 'PENDING_ACCEPT' },
      select: {
        id: true,
        container_no: true,
        status: true,
        type: true,
        createdAt: true
      }
    });
    
    if (pendingAcceptRequests.length === 0) {
      console.log('   - Không có request nào có trạng thái PENDING_ACCEPT');
    } else {
      pendingAcceptRequests.forEach(request => {
        console.log(`   - Container ${request.container_no}: ${request.type}, Tạo: ${request.createdAt.toLocaleDateString('vi-VN')}`);
      });
    }
    
    // 3. Kiểm tra mối quan hệ giữa phiếu sửa chữa và request
    console.log('\n3. Mối quan hệ giữa phiếu sửa chữa và request:');
    for (const repair of pendingAcceptRepairs) {
      if (repair.container_no) {
        const relatedRequests = await prisma.serviceRequest.findMany({
          where: { 
            container_no: repair.container_no,
            status: 'PENDING_ACCEPT'
          },
          select: {
            id: true,
            container_no: true,
            status: true,
            type: true
          }
        });
        
        if (relatedRequests.length > 0) {
          console.log(`   - Phiếu ${repair.code} (Container ${repair.container_no}):`);
          relatedRequests.forEach(req => {
            console.log(`     + Request ${req.id}: ${req.type} - ${req.status}`);
          });
        } else {
          console.log(`   - Phiếu ${repair.code} (Container ${repair.container_no}): Không có request tương ứng`);
        }
      }
    }
    
    // 4. Thống kê tổng quan
    console.log('\n4. Thống kê tổng quan:');
    const totalRepairs = await prisma.repairTicket.count();
    const totalRequests = await prisma.serviceRequest.count();
    
    console.log(`   - Tổng số phiếu sửa chữa: ${totalRepairs}`);
    console.log(`   - Tổng số request: ${totalRequests}`);
    console.log(`   - Phiếu PENDING_ACCEPT: ${pendingAcceptRepairs.length}`);
    console.log(`   - Request PENDING_ACCEPT: ${pendingAcceptRequests.length}`);
    
    console.log('\n=== HOÀN THÀNH KIỂM TRA ===');
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
testPendingAcceptLogic();
