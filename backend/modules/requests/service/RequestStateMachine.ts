import { audit } from '../../../shared/middlewares/audit';
import chatService from '../../chat/service/ChatService';
import { AutoForkliftTaskService } from '../../forklift/service/AutoForkliftTaskService';

export interface StateTransition {
  from: string;
  to: string;
  allowedRoles: string[];
  requiresReason?: boolean;
  description: string;
}

export class RequestStateMachine {
  private static readonly VALID_STATES = [
    'PENDING',
    'PICK_CONTAINER', // Trạng thái mới: đang chọn container (chỉ cho EXPORT)
    'SCHEDULED', 
    'SCHEDULED_INFO_ADDED',
    'FORWARDED',
    'SENT_TO_GATE',
    'GATE_IN',
    'CHECKING',
    'REJECTED',
    'COMPLETED',
    'PENDING_ACCEPT',
    'ACCEPT',
    'CHECKED',
    'POSITIONED', 
    'FORKLIFTING', // Trạng thái mới: đang nâng/hạ container
    'IN_YARD', // Trạng thái mới: đã ở trong bãi
    'IN_CAR', // Trạng thái mới: container đã được đặt lên xe (cho EXPORT)
    'GATE_OUT' // Trạng thái mới: xe đã rời kho (cho cả IMPORT và EXPORT)
  ];

  private static readonly TRANSITIONS: StateTransition[] = [
    {
      from: 'PENDING',
      to: 'PICK_CONTAINER',
      allowedRoles: ['CustomerAdmin', 'CustomerUser', 'SaleAdmin', 'SystemAdmin'],
      description: 'Customer chọn container cho request EXPORT'
    },
    {
      from: 'PENDING',
      to: 'SCHEDULED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Depot tiếp nhận và đặt lịch hẹn (cho IMPORT)'
    },
    {
      from: 'PENDING',
      to: 'REJECTED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      requiresReason: true,
      description: 'Depot từ chối request'
    },
    {
      from: 'PICK_CONTAINER',
      to: 'SCHEDULED',
      allowedRoles: ['CustomerAdmin', 'CustomerUser', 'SaleAdmin', 'SystemAdmin'],
      description: 'Đã chọn container, chuyển sang đặt lịch hẹn'
    },
    {
      from: 'PICK_CONTAINER',
      to: 'REJECTED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      requiresReason: true,
      description: 'Depot từ chối request sau khi chọn container'
    },
    {
      from: 'SCHEDULED',
      to: 'SCHEDULED_INFO_ADDED',
      allowedRoles: ['CustomerAdmin', 'CustomerUser'],
      description: 'Customer bổ sung thông tin'
    },
    {
      from: 'SCHEDULED',
      to: 'FORWARDED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin', 'CustomerAdmin', 'CustomerUser'],
      description: 'Depot chuyển tiếp hoặc Customer tự động chuyển tiếp sau khi bổ sung tài liệu'
    },
    {
      from: 'SCHEDULED',
      to: 'SENT_TO_GATE',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Depot chuyển tiếp sang Gate'
    },
    {
      from: 'SCHEDULED',
      to: 'REJECTED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      requiresReason: true,
      description: 'Depot từ chối request'
    },
    {
      from: 'SCHEDULED_INFO_ADDED',
      to: 'FORWARDED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin', 'CustomerAdmin', 'CustomerUser'],
      description: 'Depot chuyển tiếp hoặc Customer tự động chuyển tiếp sau khi bổ sung tài liệu'
    },
    {
      from: 'SCHEDULED_INFO_ADDED',
      to: 'SENT_TO_GATE',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Depot chuyển tiếp sang Gate'
    },
    {
      from: 'SCHEDULED_INFO_ADDED',
      to: 'REJECTED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      requiresReason: true,
      description: 'Depot từ chối request'
    },
    {
      from: 'FORWARDED',
      to: 'COMPLETED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin', 'System'],
      description: 'Hoàn tất xử lý'
    },
    {
      from: 'FORWARDED',
      to: 'SENT_TO_GATE',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Chuyển tiếp sang Gate'
    },
    {
      from: 'SENT_TO_GATE',
      to: 'COMPLETED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin', 'System'],
      description: 'Hoàn tất xử lý tại Gate'
    },
    {
      from: 'GATE_IN',
      to: 'CHECKING',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Bắt đầu kiểm tra container'
    },
    {
      from: 'GATE_IN',
      to: 'FORKLIFTING',
      allowedRoles: ['Driver', 'SaleAdmin', 'SystemAdmin'],
      description: 'Tài xế bắt đầu nâng/hạ container (Export requests)'
    },
    {
      from: 'CHECKING',
      to: 'CHECKED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Hoàn thành kiểm tra - đạt chuẩn'
    },
    {
      from: 'CHECKING',
      to: 'REJECTED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      requiresReason: true,
      description: 'Hoàn thành kiểm tra - không đạt chuẩn'
    },
    {
      from: 'CHECKED',
      to: 'POSITIONED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Container đã được xếp chỗ trong bãi'
    },
    {
      from: 'POSITIONED',
      to: 'FORKLIFTING',
      allowedRoles: ['Driver', 'SaleAdmin', 'SystemAdmin'],
      description: 'Tài xế bắt đầu nâng/hạ container'
    },
    {
      from: 'FORKLIFTING',
      to: 'IN_YARD',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Container đã được đặt vào vị trí trong bãi (cho IMPORT)'
    },
    {
      from: 'FORKLIFTING',
      to: 'IN_CAR',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Container đã được đặt lên xe (cho EXPORT)'
    },
    {
      from: 'IN_CAR',
      to: 'GATE_OUT',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Xe đã rời kho (cho EXPORT requests)'
    },
    {
      from: 'IN_YARD',
      to: 'GATE_OUT',
      allowedRoles: ['SaleAdmin', 'SystemAdmin'],
      description: 'Xe đã rời kho (cho IMPORT requests)'
    },
    {
      from: 'PENDING_ACCEPT',
      to: 'ACCEPT',
      allowedRoles: ['CustomerAdmin', 'CustomerUser'],
      description: 'Customer chấp nhận hóa đơn sửa chữa'
    },
    {
      from: 'PENDING_ACCEPT',
      to: 'REJECTED',
      allowedRoles: ['CustomerAdmin', 'CustomerUser'],
      requiresReason: true,
      description: 'Customer từ chối hóa đơn sửa chữa'
    },
    {
      from: 'ACCEPT',
      to: 'CHECKED',
      allowedRoles: ['SaleAdmin', 'SystemAdmin', 'System'],
      description: 'Hoàn thành sửa chữa - đồng bộ từ RepairTicket'
    }
  ];

  static isValidState(state: string): boolean {
    return this.VALID_STATES.includes(state);
  }

  static getValidTransitions(fromState: string, userRole: string): StateTransition[] {
    return this.TRANSITIONS.filter(transition => 
      transition.from === fromState && 
      transition.allowedRoles.includes(userRole)
    );
  }

  static canTransition(fromState: string, toState: string, userRole: string): boolean {
    const transition = this.TRANSITIONS.find(t => 
      t.from === fromState && 
      t.to === toState && 
      t.allowedRoles.includes(userRole)
    );
    return !!transition;
  }

  static getTransition(fromState: string, toState: string, userRole: string): StateTransition | null {
    return this.TRANSITIONS.find(t => 
      t.from === fromState && 
      t.to === toState && 
      t.allowedRoles.includes(userRole)
    ) || null;
  }

  static async validateAndTransition(
    actor: any,
    currentState: string,
    newState: string,
    reason?: string
  ): Promise<{ valid: boolean; error?: string; transition?: StateTransition }> {
    // Kiểm tra state hợp lệ
    if (!this.isValidState(currentState)) {
      return { valid: false, error: `Trạng thái hiện tại không hợp lệ: ${currentState}` };
    }

    if (!this.isValidState(newState)) {
      return { valid: false, error: `Trạng thái mới không hợp lệ: ${newState}` };
    }

    // Kiểm tra transition hợp lệ
    const transition = this.getTransition(currentState, newState, actor.role);
    if (!transition) {
      return { 
        valid: false, 
        error: `Không thể chuyển từ ${currentState} sang ${newState} với role ${actor.role}` 
      };
    }

    // Kiểm tra reason nếu cần
    if (transition.requiresReason && (!reason || !reason.trim())) {
      return { 
        valid: false, 
        error: 'Vui lòng nhập lý do khi thực hiện hành động này' 
      };
    }

    return { valid: true, transition };
  }

  static async executeTransition(
    actor: any,
    requestId: string,
    currentState: string,
    newState: string,
    reason?: string,
    additionalData?: any
  ): Promise<void> {
    const validation = await this.validateAndTransition(actor, currentState, newState, reason);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const transition = validation.transition!;

    // Ghi audit log
    await audit(
      actor._id, 
      `REQUEST.${newState}`, 
      'REQUEST', 
      requestId, 
      { 
        from: currentState, 
        to: newState, 
        reason,
        ...additionalData 
      }
    );

    // Gửi system message vào chat room
    try {
      const chatRoom = await chatService.getChatRoom(actor, requestId);
      if (chatRoom) {
        let systemMessage = '';
        switch (newState) {
          case 'PENDING':
            systemMessage = '📋 Yêu cầu đã được tạo và đang chờ xử lý';
            break;
          case 'PICK_CONTAINER':
            systemMessage = '📦 Yêu cầu đang chờ chọn container';
            break;
          case 'SCHEDULED':
            systemMessage = '📅 Lịch hẹn đã được đặt';
            break;
          case 'SCHEDULED_INFO_ADDED':
            systemMessage = '📄 Thông tin bổ sung đã được cập nhật';
            break;
          case 'SENT_TO_GATE':
            systemMessage = '🚪 Yêu cầu đã được chuyển tiếp sang Gate';
            break;
          case 'REJECTED':
            systemMessage = `❌ Yêu cầu bị từ chối${reason ? `: ${reason}` : ''}`;
            break;
          case 'COMPLETED':
            systemMessage = '✅ Yêu cầu đã hoàn tất';
            break;
          case 'POSITIONED':
            systemMessage = '📍 Container đã được xếp chỗ trong bãi';
            break;
          case 'FORKLIFTING':
            systemMessage = '🚛 Tài xế đang nâng/hạ container';
            break;
          case 'IN_YARD':
            systemMessage = '🏭 Container đã được đặt vào vị trí trong bãi';
            break;
          case 'IN_CAR':
            systemMessage = '🚛 Container đã được đặt lên xe';
            break;
          case 'GATE_OUT':
            systemMessage = '🚗 Xe đã rời kho';
            break;
          default:
            systemMessage = `🔄 Trạng thái đã thay đổi thành: ${newState}`;
        }
        await chatService.sendSystemMessageUnrestricted(chatRoom.id, systemMessage);
      }
    } catch (error) {
      console.error('Không thể gửi system message:', error);
    }

    // Tự động tạo forklift task cho EXPORT requests khi chuyển sang GATE_IN
    if (newState === 'GATE_IN' && additionalData?.requestType === 'EXPORT' && additionalData?.containerNo) {
      try {
        await AutoForkliftTaskService.createForkliftTaskForExport(
          additionalData.containerNo, 
          actor._id
        );
        console.log(`✅ Auto-created forklift task for EXPORT container ${additionalData.containerNo}`);
      } catch (error) {
        console.error(`❌ Error auto-creating forklift task for container ${additionalData.containerNo}:`, error);
        // Không throw error để không ảnh hưởng đến việc chuyển trạng thái
      }
    }
  }

  static getStateDescription(state: string): string {
    const descriptions: Record<string, string> = {
      'PENDING': 'Chờ xử lý',
      'PICK_CONTAINER': 'Đang chọn container',
      'SCHEDULED': 'Đã đặt lịch hẹn',
      'SCHEDULED_INFO_ADDED': 'Đã bổ sung thông tin',
              'SENT_TO_GATE': 'Đã chuyển sang Gate',
        'REJECTED': 'Bị từ chối',
        'COMPLETED': 'Hoàn tất',
        'POSITIONED': 'Đã xếp chỗ trong bãi',
        'FORKLIFTING': 'Đang nâng/hạ container',
        'IN_YARD': 'Đã ở trong bãi',
        'IN_CAR': 'Đã lên xe',
        'GATE_OUT': 'Đã rời kho'
    };
    return descriptions[state] || state;
  }

  static getStateColor(state: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'yellow',
      'PICK_CONTAINER': 'orange',
      'SCHEDULED': 'blue',
      'SCHEDULED_INFO_ADDED': 'cyan',
              'SENT_TO_GATE': 'purple',
        'REJECTED': 'red',
        'COMPLETED': 'green',
        'POSITIONED': 'blue',
        'FORKLIFTING': 'orange',
        'IN_YARD': 'green',
        'IN_CAR': 'purple',
        'GATE_OUT': 'red'
    };
    return colors[state] || 'gray';
  }
}

export default RequestStateMachine;
