const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetContainerStatus() {
  try {
    console.log('🔄 Đang reset trạng thái container...');
    
    // Tìm container có trạng thái REPAIRING
    const containers = await prisma.serviceRequest.findMany({
      where: {
        status: 'REPAIRING',
        type: 'IMPORT'
      }
    });
    
    console.log(`📦 Tìm thấy ${containers.length} container có trạng thái REPAIRING`);
    
    if (containers.length === 0) {
      console.log('✅ Không có container nào cần reset');
      return;
    }
    
    // Reset về GATE_IN
    for (const container of containers) {
      console.log(`🔄 Đang reset container ${container.container_no}...`);
      
      await prisma.serviceRequest.update({
        where: { id: container.id },
        data: { 
          status: 'GATE_IN',
          history: {
            maintenance_reset: {
              reset_at: new Date().toISOString(),
              reason: 'Reset để test lại từ đầu',
              previous_status: 'REPAIRING'
            }
          }
        }
      });
      
      console.log(`✅ Đã reset container ${container.container_no} về GATE_IN`);
    }
    
    // Xóa phiếu sửa chữa liên quan
    const repairTickets = await prisma.repairTicket.findMany({
      where: {
        container_no: {
          in: containers.map(c => c.container_no)
        },
        status: 'REPAIRING'
      }
    });
    
    console.log(`🗑️ Tìm thấy ${repairTickets.length} phiếu sửa chữa cần xóa`);
    
    if (repairTickets.length > 0) {
      await prisma.repairTicket.deleteMany({
        where: {
          id: {
            in: repairTickets.map(t => t.id)
          }
        }
      });
      
      console.log(`✅ Đã xóa ${repairTickets.length} phiếu sửa chữa`);
    }
    
    console.log('🎉 Hoàn thành reset trạng thái container!');
    
  } catch (error) {
    console.error('❌ Lỗi khi reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
resetContainerStatus();
