const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testContainerValidation() {
  console.log('🧪 Test Container Validation Logic...\n');

  try {
    // 1. Kiểm tra container hiện có trong hệ thống
    console.log('1. Kiểm tra containers hiện có trong hệ thống:');
    
    const existingRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'IMPORT',
        container_no: { not: null }
      },
      select: {
        id: true,
        container_no: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`   Tìm thấy ${existingRequests.length} requests IMPORT:`);
    existingRequests.forEach(req => {
      console.log(`   - ${req.container_no} (${req.status}) - ${req.createdAt.toISOString()}`);
    });

    // 2. Kiểm tra containers trong YardPlacement
    console.log('\n2. Kiểm tra containers trong YardPlacement:');
    
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: {
        container_no: { not: null },
        status: 'OCCUPIED',
        removed_at: null
      },
      select: {
        id: true,
        container_no: true,
        status: true,
        placed_at: true
      },
      orderBy: { placed_at: 'desc' },
      take: 5
    });

    console.log(`   Tìm thấy ${yardPlacements.length} containers trong yard:`);
    yardPlacements.forEach(placement => {
      console.log(`   - ${placement.container_no} (${placement.status}) - ${placement.placed_at.toISOString()}`);
    });

    // 3. Test validation logic
    console.log('\n3. Test validation logic:');
    
    // Lấy container đầu tiên để test
    const testContainer = existingRequests[0]?.container_no;
    if (testContainer) {
      console.log(`   Testing với container: ${testContainer}`);
      
      // Kiểm tra request với status chưa hoàn thành
      const activeRequest = await prisma.serviceRequest.findFirst({
        where: {
          container_no: testContainer,
          type: 'IMPORT',
          status: {
            notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
          }
        }
      });

      if (activeRequest) {
        console.log(`   ❌ Container ${testContainer} đã tồn tại với status: ${activeRequest.status}`);
        console.log(`   ✅ Validation sẽ chặn tạo request mới cho container này`);
      } else {
        console.log(`   ✅ Container ${testContainer} có thể tạo request mới`);
      }

      // Kiểm tra yard placement
      const yardPlacement = await prisma.yardPlacement.findFirst({
        where: {
          container_no: testContainer,
          status: 'OCCUPIED',
          removed_at: null
        }
      });

      if (yardPlacement) {
        console.log(`   ❌ Container ${testContainer} đã được đặt vào yard`);
        console.log(`   ✅ Validation sẽ chặn tạo request mới cho container này`);
      } else {
        console.log(`   ✅ Container ${testContainer} không có trong yard`);
      }
    } else {
      console.log('   Không có container nào để test');
    }

    // 4. Test với container không tồn tại
    console.log('\n4. Test với container không tồn tại:');
    const nonExistentContainer = 'TEST123456';
    
    const testRequest = await prisma.serviceRequest.findFirst({
      where: {
        container_no: nonExistentContainer,
        type: 'IMPORT',
        status: {
          notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
        }
      }
    });

    const testPlacement = await prisma.yardPlacement.findFirst({
      where: {
        container_no: nonExistentContainer,
        status: 'OCCUPIED',
        removed_at: null
      }
    });

    if (!testRequest && !testPlacement) {
      console.log(`   ✅ Container ${nonExistentContainer} có thể tạo request mới`);
    } else {
      console.log(`   ❌ Container ${nonExistentContainer} đã tồn tại trong hệ thống`);
    }

    console.log('\n✅ Test hoàn thành!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testContainerValidation();
