/** @odoo-module **/

import {patch} from "@web/core/utils/patch";
import {PosBus} from "@point_of_sale/app/bus/pos_bus_service";

// ---------------------------
// todo: if backend disable product or customer, we need disable in pos screen too
// ---------------------------

patch(PosBus.prototype, {

    dispatch(message) {
        super.dispatch(...arguments);
        if (message.type === "pos_retail.big_data") {
            this.pos_bus_sync_big_data(message.payload);
        }
    },

    async pos_bus_sync_big_data(event_value) {
        let model = event_value['model']
        let id = event_value['id']
        console.log('--------------------')
        console.log('>>>  pos_bus_sync_big_data - event remove record of model: ' + model + ' with id : ' + id)
        if (model == "product.product") {
            this.pos.db.product_by_id[id]["active"] = false
            this.pos.db.product_by_id[id]["available_in_pos"] = false
        }
        if (model == "res.partner") {
            this.pos.partners = this.pos.partners.filter(p => p.id != id)
            this.pos.db.partner_by_id[id]["active"] = false
        }
        this.pos.unlink(model, {id: id})
    },
});
