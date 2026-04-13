/* import { get_record } from "../../snow_utils";

type SYSID = string;
enum TicketTable {
    INCIDENT = 'incident',
    SCTASK = 'sc_task',
    UNIDENTIFIED = 'unidentified'
}

const Categories = {
    NOW_CHOICE_NONE_OPTION: null,
    account___identity: {

    },
    computers___equipment: {
        computers___equipment_collect_equipment: "Collect Equipment",
        computers___equipment_deploy_equipment: "Deploy Equipment",
        computers___equipment_device_management: "Device Managment",
        computers___equipment_enable_remote_desktop_access: "Enable Remote Desktop Access",
        computers___equipment_endpoint_deployment: "Endpoint Deployment",
        computers___equipment_order_computer_accessories: "Order Computer Accessories",
        computers___equipment_order_mobile_device: "Order Mobile Device",
        computers___equipment_order_yubikey: "Order Yubikey",
        computers___equipment_printer_support: "Printer Support",
        computers___equipment_repair: "Repair",
        computers___equipment_return_it_equipment: "Return IT Equipment"
    },
    mobile_service___equipment: {
        
    },
} as const;

type TicketCategory = typeof Categories;
type TicketType = typeof Categories.computers___equipment;
// type TicketSubtype = typeof Categories.

enum TicketSubtype {
    unidentified,
    NOW_CHOICE_NONE_OPTION,
    computer_accessories,
    laptop,
    monitor___accessory,
    yubikey
} */

// interface Ticket {
//     table: TicketTable,
//     sys_id: SYSID,
//     category: TicketCategory,
//     type: TicketType,
//     subtype: TicketSubtype
// }

// async function getTicketType(): Promise<Ticket> {
//     const [table, sys_id] = parseURL();
//     const [category, type, subtype] = await getType(table, sys_id);

//     return {
//         table,
//         sys_id,
//         category,
//         type,
//         subtype
//     }
// }

// function parseURL(): [TicketTable, SYSID] {
//     let table, sys_id;
//     const href = new URL(window.location.href);
//     const m = href.pathname.match(/now\/sow\/record\/(.*)\/(.*)$/);
//     if (m[1] == 'incident') {
//         table = TicketTable.INCIDENT;
//     } else if (m[1] == 'sc_task') {
//         table = TicketTable.SCTASK;
//     } else {
//         table = TicketTable.UNIDENTIFIED;
//         sys_id = '';
//     }
//     return [table, sys_id];
// }

// async function getType(table: TicketTable, sys_id: SYSID): Promise<[TicketCategory, TicketType, TicketSubtype]> {
//     const record = await get_record(table, sys_id);
//     const category = record.x_ebay_caor_config_category;
//     const type = record.x_ebay_core_config_type;
//     const subtype = record.x_ebay_core_config_subtype;

//     return [category, type, subtype, record];
// }
