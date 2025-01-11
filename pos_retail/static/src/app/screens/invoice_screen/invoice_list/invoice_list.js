/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { InvoiceRow } from "@pos_retail/app/screens/invoice_screen/invoice_row/invoice_row";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";

/**
 * @props {models.Order} [inithighlightedInvoice] initially highligted order
 * @props {Array<models.Order>} orders
 */
export class InvoiceList extends Component {
    static components = { InvoiceRow };
    static template = "pos_retail.InvoiceList";

    setup() {
        this.ui = useState(useService("ui"));
        this.state = useState({ highlightedInvoice: this.props.inithighlightedInvoice || null });
        this.pos = usePos()
    }
    get highlightedInvoice() {
        return this.state.highlightedInvoice;
    }
}
