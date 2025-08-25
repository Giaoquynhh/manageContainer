const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRepairStatus() {
  try {
    console.log('Bắt đầu cập nhật trạng thái phiếu sửa chữa...');
    
    // Tìm tất cả phiếu có chi phí > 0
    const repairsWithCost = await prisma.repairTicket.findMany({
      where: {
        estimated_cost: {
          gt: 0
        }
      },
      select: {
        id: true,
        code: true,
        estimated_cost: true,
        status: true
      }
    });
    
    console.log(`Tìm thấy ${repairsWithCost.length} phiếu có chi phí > 0:`);
    repairsWithCost.forEach(repair => {
      console.log(`- ${repair.code}: Chi phí ${repair.estimated_cost}, Trạng thái hiện tại: ${repair.status}`);
    });
    
    // Cập nhật trạng thái thành CHECKING
    const updateResult = await prisma.repairTicket.updateMany({
      where: {
        estimated_cost: {
          gt: 0
        },
        status: {
          not: 'CHECKING'
        }
      },
      data: {
        status: 'CHECKING'
      }
    });
    
    console.log(`Đã cập nhật ${updateResult.count} phiếu thành trạng thái CHECKING`);
    
    // Kiểm tra kết quả
    const updatedRepairs = await prisma.repairTicket.findMany({
      where: {
        estimated_cost: {
          gt: 0
        }
      },
      select: {
        id: true,
        code: true,
        estimated_cost: true,
        status: true
      }
    });
    
    console.log('\nKết quả sau khi cập nhật:');
    updatedRepairs.forEach(repair => {
      console.log(`- ${repair.code}: Chi phí ${repair.estimated_cost}, Trạng thái: ${repair.status}`);
    });
    
    console.log('\nCập nhật trạng thái thành công!');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
updateRepairStatus();
