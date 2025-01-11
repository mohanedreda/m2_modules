/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import { Component, useState } from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {deserializeDateTime} from "@web/core/l10n/dates";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class InvoiceRow extends Component {
    static template = "pos_retail.InvoiceRow";

    setup() {
        this.ui = useState(useService("ui"));
        this.report = useService("report");
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.InvoiceFetcher = useService("invoice_fetcher");
    }

    get invoice() {
        return this.props.invoice;
    }

    get highlighted() {
        const highlightedInvoice = this.props.highlightedInvoice;
        return !highlightedInvoice ? false : highlightedInvoice.id === this.props.invoice.id;
    }

    // Column getters //

    get name() {
        return this.invoice.name;
    }

    get date() {
        return deserializeDateTime(this.invoice.invoice_date).toFormat("yyyy-MM-dd HH:mm a");
    }

    get partner() {
        const partner = this.invoice.partner_id;
        return partner ? partner[1] : null;
    }

    get payment_reference() {
        return this.invoice.payment_reference
    }

    get amount_untaxed() {
        return this.env.utils.formatCurrency(this.invoice.amount_untaxed);
    }

    get amount_tax() {
        return this.env.utils.formatCurrency(this.invoice.amount_tax);
    }

    get amount_residual() {
        return this.env.utils.formatCurrency(this.invoice.amount_residual);
    }

    get total() {
        return this.env.utils.formatCurrency(this.invoice.amount_total);
    }

    get showAmountUnpaid() {
        return this.invoice.amount_total != this.invoice.amount_unpaid;
    }

    get amountUnpaidRepr() {
        return this.env.utils.formatCurrency(this.invoice.amount_unpaid);
    }

    get state() {
        const state_mapping = {
            draft: _t("Draft"), posted: _t("Posted"), cancel: _t("Cancelled"),
        };

        return state_mapping[this.invoice.state];
    }

    get payment_state() {
        const state_mapping = {
            not_paid: _t("Not Paid"),
            in_payment: _t("In Payment"),
            paid: _t("Paid"),
            partial: _t("Partially Paid"),
            reversed: _t("Reversed"),
            invoicing_legacy: _t("Invoicing App Legacy"),
        };

        return state_mapping[this.invoice.payment_state];
    }

    get salesman() {
        const salesman = this.invoice.user_id;
        return salesman ? salesman[1] : null;
    }
}
