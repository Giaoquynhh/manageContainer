const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnhancedContainerValidation() {
  console.log('🧪 Test Enhanced Container Validation Logic...\n');

  try {
    // 1. Kiểm tra containers hiện có trong tất cả nguồn
    console.log('1. Kiểm tra containers hiện có trong tất cả nguồn:');
    
    const allContainers = await prisma.$queryRaw`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status,
          sr.gate_checked_at as gate_checked_at,
          sr.type as request_type
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
          rt.container_no,
          TRUE as repair_checked,
          rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      yard_placement AS (
        SELECT DISTINCT ON (yp.container_no)
          yp.container_no,
          yp.status as placement_status,
          yp.placed_at
        FROM "YardPlacement" yp 
        WHERE yp.status = 'OCCUPIED' 
          AND yp.removed_at IS NULL
          AND yp.container_no IS NOT NULL
        ORDER BY yp.container_no, yp.placed_at DESC
      )
      SELECT 
        COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
        sr.service_status,
        sr.gate_checked_at,
        sr.request_type,
        COALESCE(rt.repair_checked, FALSE) as repair_checked,
        yp.placement_status,
        yp.placed_at,
        CASE 
          WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
          WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
          WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
        END as source
      FROM latest_sr sr
      FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
      FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
      WHERE sr.container_no IS NOT NULL 
        OR rt.container_no IS NOT NULL 
        OR yp.container_no IS NOT NULL
      ORDER BY container_no
    `;

    console.log(`   Tìm thấy ${allContainers.length} containers trong hệ thống:`);
    allContainers.forEach(container => {
      console.log(`   - ${container.container_no} (${container.source}) - Status: ${container.service_status || container.placement_status || 'CHECKED'}`);
    });

    // 2. Test validation logic với từng loại container
    console.log('\n2. Test validation logic:');
    
    for (const container of allContainers.slice(0, 3)) { // Test 3 containers đầu tiên
      console.log(`\n   Testing với container: ${container.container_no}`);
      console.log(`   Source: ${container.source}`);
      console.log(`   Status: ${container.service_status || container.placement_status || 'CHECKED'}`);
      
      // Simulate validation logic
      if (container.source === 'SERVICE_REQUEST') {
        const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
        if (!isCompleted) {
          console.log(`   ❌ Container ${container.container_no} đã tồn tại trong hệ thống với trạng thái ${container.service_status}`);
          console.log(`   ✅ Validation sẽ chặn tạo request mới cho container này`);
        } else {
          console.log(`   ✅ Container ${container.container_no} có status hoàn thành - có thể tạo request mới`);
        }
      } else if (container.source === 'REPAIR_TICKET') {
        console.log(`   ❌ Container ${container.container_no} đang trong quy trình sửa chữa`);
        console.log(`   ✅ Validation sẽ chặn tạo request mới cho container này`);
      } else if (container.source === 'YARD_PLACEMENT') {
        console.log(`   ❌ Container ${container.container_no} đã được đặt vào yard`);
        console.log(`   ✅ Validation sẽ chặn tạo request mới cho container này`);
      }
    }

    // 3. Test với container không tồn tại
    console.log('\n3. Test với container không tồn tại:');
    const nonExistentContainer = 'TEST999999';
    
    const testResult = await prisma.$queryRaw`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status,
          sr.gate_checked_at as gate_checked_at,
          sr.type as request_type
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
          rt.container_no,
          TRUE as repair_checked,
          rt."updatedAt" as updated_at
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
        ORDER BY rt.container_no, rt."updatedAt" DESC
      ),
      yard_placement AS (
        SELECT DISTINCT ON (yp.container_no)
          yp.container_no,
          yp.status as placement_status,
          yp.placed_at
        FROM "YardPlacement" yp 
        WHERE yp.status = 'OCCUPIED' 
          AND yp.removed_at IS NULL
          AND yp.container_no IS NOT NULL
        ORDER BY yp.container_no, yp.placed_at DESC
      )
      SELECT 
        COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
        sr.service_status,
        sr.gate_checked_at,
        sr.request_type,
        COALESCE(rt.repair_checked, FALSE) as repair_checked,
        yp.placement_status,
        yp.placed_at,
        CASE 
          WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
          WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
          WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
        END as source
      FROM latest_sr sr
      FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
      FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
      WHERE sr.container_no = ${nonExistentContainer} 
        OR rt.container_no = ${nonExistentContainer} 
        OR yp.container_no = ${nonExistentContainer}
    `;

    if (testResult.length === 0) {
      console.log(`   ✅ Container ${nonExistentContainer} không tồn tại trong hệ thống`);
      console.log(`   ✅ Validation sẽ cho phép tạo request mới cho container này`);
    } else {
      console.log(`   ❌ Container ${nonExistentContainer} đã tồn tại trong hệ thống`);
    }

    // 4. Test với container có status COMPLETED
    console.log('\n4. Test với container có status COMPLETED:');
    const completedContainer = 'COMPLETED123';
    
    // Tạo một container test với status COMPLETED
    try {
      await prisma.serviceRequest.create({
        data: {
          created_by: 'test-user',
          type: 'IMPORT',
          container_no: completedContainer,
          status: 'COMPLETED',
          history: [{ at: new Date().toISOString(), by: 'test-user', action: 'CREATE' }]
        }
      });

      const completedTestResult = await prisma.$queryRaw`
        WITH latest_sr AS (
          SELECT DISTINCT ON (sr.container_no)
            sr.container_no,
            sr.status as service_status,
            sr.gate_checked_at as gate_checked_at,
            sr.type as request_type
          FROM "ServiceRequest" sr
          WHERE sr.container_no IS NOT NULL
          ORDER BY sr.container_no, sr."createdAt" DESC
        ),
        rt_checked AS (
          SELECT DISTINCT ON (rt.container_no)
            rt.container_no,
            TRUE as repair_checked,
            rt."updatedAt" as updated_at
          FROM "RepairTicket" rt
          WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
          ORDER BY rt.container_no, rt."updatedAt" DESC
        ),
        yard_placement AS (
          SELECT DISTINCT ON (yp.container_no)
            yp.container_no,
            yp.status as placement_status,
            yp.placed_at
          FROM "YardPlacement" yp 
          WHERE yp.status = 'OCCUPIED' 
            AND yp.removed_at IS NULL
            AND yp.container_no IS NOT NULL
          ORDER BY yp.container_no, yp.placed_at DESC
        )
        SELECT 
          COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
          sr.service_status,
          sr.gate_checked_at,
          sr.request_type,
          COALESCE(rt.repair_checked, FALSE) as repair_checked,
          yp.placement_status,
          yp.placed_at,
          CASE 
            WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
            WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
            WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
          END as source
        FROM latest_sr sr
        FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
        FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
        WHERE sr.container_no = ${completedContainer} 
          OR rt.container_no = ${completedContainer} 
          OR yp.container_no = ${completedContainer}
      `;

      if (testResult.length > 0) {
        const container = testResult[0];
        const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
        if (isCompleted) {
          console.log(`   ✅ Container ${completedContainer} có status COMPLETED`);
          console.log(`   ✅ Validation sẽ cho phép tạo request mới cho container này`);
        } else {
          console.log(`   ❌ Container ${completedContainer} có status ${container.service_status} - sẽ bị chặn`);
        }
      }

      // Cleanup
      await prisma.serviceRequest.deleteMany({
        where: { container_no: completedContainer }
      });

    } catch (error) {
      console.log(`   ⚠️  Không thể tạo test container: ${error.message}`);
    }

    console.log('\n✅ Test hoàn thành!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testEnhancedContainerValidation();
