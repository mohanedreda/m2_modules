/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {
    async setup(...args) {
        this.invoiceManagement = { searchString: "", selectedInvoice: null };
        return await super.setup(...args);
    },
});
