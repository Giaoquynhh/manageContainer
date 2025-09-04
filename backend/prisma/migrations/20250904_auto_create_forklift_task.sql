-- Migration: Auto create forklift task for EXPORT requests with GATE_IN status
-- Date: 2025-09-04

-- Function to create forklift task for EXPORT requests
CREATE OR REPLACE FUNCTION create_forklift_task_for_export()
RETURNS TRIGGER AS $$
DECLARE
    existing_task_count INTEGER;
    gate_slot_id TEXT;
    gate_yard_id TEXT;
    gate_block_id TEXT;
    current_location_slot_id TEXT;
BEGIN
    -- Chỉ xử lý khi request type = EXPORT và status = GATE_IN
    IF NEW.type = 'EXPORT' AND NEW.status = 'GATE_IN' AND NEW.container_no IS NOT NULL THEN
        
        -- Kiểm tra xem đã có forklift task chưa
        SELECT COUNT(*) INTO existing_task_count
        FROM "ForkliftTask"
        WHERE container_no = NEW.container_no;
        
        -- Nếu chưa có task, tạo mới
        IF existing_task_count = 0 THEN
            
            -- Tìm vị trí hiện tại của container trong yard
            SELECT slot_id INTO current_location_slot_id
            FROM "YardPlacement"
            WHERE container_no = NEW.container_no 
            AND status IN ('HOLD', 'OCCUPIED')
            ORDER BY created_at DESC
            LIMIT 1;
            
            -- Tìm hoặc tạo slot đặc biệt cho gate
            SELECT id INTO gate_slot_id
            FROM "YardSlot" ys
            JOIN "YardBlock" yb ON ys.block_id = yb.id
            WHERE ys.code = 'GATE_EXPORT' AND yb.code = 'GATE'
            LIMIT 1;
            
            -- Nếu chưa có slot gate, tạo mới
            IF gate_slot_id IS NULL THEN
                -- Tìm hoặc tạo yard cho gate
                SELECT id INTO gate_yard_id
                FROM "Yard"
                WHERE name = 'Gate Yard'
                LIMIT 1;
                
                IF gate_yard_id IS NULL THEN
                    INSERT INTO "Yard" (id, name, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'Gate Yard', NOW(), NOW())
                    RETURNING id INTO gate_yard_id;
                END IF;
                
                -- Tìm hoặc tạo block cho gate
                SELECT id INTO gate_block_id
                FROM "YardBlock"
                WHERE yard_id = gate_yard_id AND code = 'GATE'
                LIMIT 1;
                
                IF gate_block_id IS NULL THEN
                    INSERT INTO "YardBlock" (id, yard_id, code, created_at, updated_at)
                    VALUES (gen_random_uuid(), gate_yard_id, 'GATE', NOW(), NOW())
                    RETURNING id INTO gate_block_id;
                END IF;
                
                -- Tạo slot gate
                INSERT INTO "YardSlot" (id, block_id, code, status, kind, near_gate, avoid_main, is_odd, created_at, updated_at)
                VALUES (gen_random_uuid(), gate_block_id, 'GATE_EXPORT', 'RESERVED', 'EXPORT', 10, 0, false, NOW(), NOW())
                RETURNING id INTO gate_slot_id;
            END IF;
            
            -- Tạo ForkliftTask
            INSERT INTO "ForkliftTask" (
                id, container_no, from_slot_id, to_slot_id, status, 
                assigned_driver_id, created_by, cost, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), 
                NEW.container_no, 
                current_location_slot_id, 
                gate_slot_id, 
                'PENDING', 
                NULL, 
                COALESCE(NEW.gate_checked_by, NEW.created_by), 
                0, 
                NOW(), 
                NOW()
            );
            
            -- Ghi audit log
            INSERT INTO "AuditLog" (id, actor_id, action, entity, entity_id, meta, created_at)
            VALUES (
                gen_random_uuid(),
                COALESCE(NEW.gate_checked_by, NEW.created_by),
                'FORKLIFT.AUTO_CREATED',
                'ForkliftTask',
                (SELECT id FROM "ForkliftTask" WHERE container_no = NEW.container_no ORDER BY created_at DESC LIMIT 1),
                jsonb_build_object(
                    'container_no', NEW.container_no,
                    'trigger', 'GATE_IN_EXPORT',
                    'from_slot_id', current_location_slot_id,
                    'to_slot_id', gate_slot_id,
                    'task_purpose', 'Move container from yard to gate for export'
                ),
                NOW()
            );
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS trigger_auto_create_forklift_task ON "ServiceRequest";
CREATE TRIGGER trigger_auto_create_forklift_task
    AFTER UPDATE ON "ServiceRequest"
    FOR EACH ROW
    EXECUTE FUNCTION create_forklift_task_for_export();

-- Tạo forklift tasks cho các requests EXPORT hiện tại có status GATE_IN
INSERT INTO "ForkliftTask" (
    id, container_no, from_slot_id, to_slot_id, status, 
    assigned_driver_id, created_by, cost, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    sr.container_no,
    yp.slot_id,
    (SELECT id FROM "YardSlot" ys 
     JOIN "YardBlock" yb ON ys.block_id = yb.id 
     WHERE ys.code = 'GATE_EXPORT' AND yb.code = 'GATE' LIMIT 1),
    'PENDING',
    NULL,
    COALESCE(sr.gate_checked_by, sr.created_by),
    0,
    NOW(),
    NOW()
FROM "ServiceRequest" sr
LEFT JOIN "YardPlacement" yp ON sr.container_no = yp.container_no 
    AND yp.status IN ('HOLD', 'OCCUPIED')
WHERE sr.type = 'EXPORT' 
    AND sr.status = 'GATE_IN' 
    AND sr.container_no IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM "ForkliftTask" ft 
        WHERE ft.container_no = sr.container_no
    );
