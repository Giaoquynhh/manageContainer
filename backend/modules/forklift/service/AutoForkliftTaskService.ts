import { PrismaClient } from '@prisma/client';
import { audit } from '../../../shared/middlewares/audit';

const prisma = new PrismaClient();

export class AutoForkliftTaskService {
  /**
   * Tự động tạo forklift tasks cho các EXPORT requests có status GATE_IN
   * mà chưa có forklift task
   */
  static async createMissingForkliftTasks(): Promise<void> {
    try {
      console.log('🔍 Checking for missing forklift tasks...');

      // Tìm tất cả EXPORT requests có status GATE_IN
      const exportGateInRequests = await prisma.serviceRequest.findMany({
        where: {
          type: 'EXPORT',
          status: 'GATE_IN',
          container_no: { not: null }
        },
        select: {
          id: true,
          container_no: true,
          gate_checked_by: true,
          created_by: true
        }
      });

      console.log(`📋 Found ${exportGateInRequests.length} EXPORT requests with GATE_IN status`);

      for (const request of exportGateInRequests) {
        if (!request.container_no) continue;

        // Kiểm tra xem đã có forklift task chưa
        const existingTask = await prisma.forkliftTask.findFirst({
          where: { container_no: request.container_no }
        });

        if (!existingTask) {
          console.log(`🚛 Creating forklift task for container ${request.container_no}...`);
          
          try {
            await this.createForkliftTaskForExport(
              request.container_no,
              request.gate_checked_by || request.created_by
            );
            console.log(`✅ Successfully created forklift task for container ${request.container_no}`);
          } catch (error) {
            console.error(`❌ Error creating forklift task for container ${request.container_no}:`, error);
          }
        } else {
          console.log(`⏭️ Forklift task already exists for container ${request.container_no}`);
        }
      }

    } catch (error) {
      console.error('❌ Error in createMissingForkliftTasks:', error);
    }
  }

  /**
   * Tạo forklift task cho EXPORT request
   */
  static async createForkliftTaskForExport(containerNo: string, actorId: string): Promise<void> {
    // Tìm vị trí hiện tại của container trong yard
    const currentLocation = await prisma.yardPlacement.findFirst({
      where: { 
        container_no: containerNo, 
        status: { in: ['HOLD', 'OCCUPIED'] } 
      },
      include: { 
        slot: { 
          include: { 
            block: { 
              include: { 
                yard: true 
              } 
            } 
          } 
        } 
      }
    });

    // Tìm hoặc tạo slot đặc biệt cho gate (vị trí đích)
    let gateSlot = await prisma.yardSlot.findFirst({
      where: { 
        code: 'GATE_EXPORT',
        block: {
          code: 'GATE'
        }
      }
    });

    // Nếu chưa có slot gate, tạo mới
    if (!gateSlot) {
      // Tìm hoặc tạo yard và block cho gate
      let gateYard = await prisma.yard.findFirst({
        where: { name: 'Gate Yard' }
      });

      if (!gateYard) {
        gateYard = await prisma.yard.create({
          data: { name: 'Gate Yard' }
        });
      }

      let gateBlock = await prisma.yardBlock.findFirst({
        where: { 
          yard_id: gateYard.id,
          code: 'GATE'
        }
      });

      if (!gateBlock) {
        gateBlock = await prisma.yardBlock.create({
          data: {
            yard_id: gateYard.id,
            code: 'GATE'
          }
        });
      }

      gateSlot = await prisma.yardSlot.create({
        data: {
          block_id: gateBlock.id,
          code: 'GATE_EXPORT',
          status: 'RESERVED',
          kind: 'EXPORT',
          near_gate: 10, // Ưu tiên cao cho gate
          avoid_main: 0,
          is_odd: false
        }
      });
    }

    // Tạo ForkliftTask mới với đầy đủ thông tin
    const forkliftTask = await prisma.forkliftTask.create({
      data: {
        container_no: containerNo,
        from_slot_id: currentLocation?.slot_id || null, // Vị trí hiện tại của container trong yard
        to_slot_id: gateSlot.id, // Vị trí đích: Gate
        status: 'PENDING',
        assigned_driver_id: null,
        created_by: actorId,
        cost: 0
      }
    });

    // Audit log
    await audit(actorId, 'FORKLIFT.AUTO_CREATED', 'ForkliftTask', forkliftTask.id, {
      container_no: containerNo,
      trigger: 'AUTO_SERVICE_GATE_IN_EXPORT',
      from_slot_id: currentLocation?.slot_id || null,
      to_slot_id: gateSlot.id,
      task_purpose: 'Move container from yard to gate for export'
    });

    console.log(`Auto-created ForkliftTask ${forkliftTask.id} for container ${containerNo} from ${currentLocation?.slot_id || 'unknown'} to ${gateSlot.id}`);
  }

  /**
   * Chạy service định kỳ (có thể gọi từ cron job hoặc scheduler)
   */
  static async runScheduledCheck(): Promise<void> {
    console.log('🕐 Running scheduled forklift task check...');
    await this.createMissingForkliftTasks();
  }
}
