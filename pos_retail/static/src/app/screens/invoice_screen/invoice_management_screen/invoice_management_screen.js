/** @odoo-module **/

import {useBus, useService} from "@web/core/utils/hooks";
import {registry} from "@web/core/registry";
import {ControlButtonsMixin} from "@point_of_sale/app/utils/control_buttons_mixin";
import {InvoiceList} from "@pos_retail/app/screens/invoice_screen/invoice_list/invoice_list";
import {
    InvoiceManagementControlPanel
} from "@pos_retail/app/screens/invoice_screen/invoice_management_control_panel/invoice_management_control_panel";
import {Component, onMounted, useRef, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {_t} from "@web/core/l10n/translation";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";
import {TextAreaPopup} from "@point_of_sale/app/utils/input_popups/textarea_popup";

function getId(fieldVal) {
    return fieldVal && fieldVal[0];
}

export class InvoiceManagementScreen extends ControlButtonsMixin(Component) {
    static storeOnOrder = false;
    static components = {InvoiceList, InvoiceManagementControlPanel};
    static template = "pos_retail.InvoiceManagementScreen";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.root = useRef("root");
        this.report = useService("report");
        this.numberBuffer = useService("number_buffer");
        this.InvoiceFetcher = useService("invoice_fetcher");
        this.notification = useService("pos_notification");

        useBus(this.InvoiceFetcher, "update", this.render);

        onMounted(this.onMounted);
        this.state = useState({
            invoices: [],
        });
    }

    onMounted() {
        const flexContainer = this.root.el.querySelector(".flex-container");
        const cpEl = this.root.el.querySelector(".control-panel");
        const headerEl = this.root.el.querySelector(".header-row");
        const val = Math.trunc((flexContainer.offsetHeight - cpEl.offsetHeight - headerEl.offsetHeight) / headerEl.offsetHeight);
        this.InvoiceFetcher.setNPerPage(val);
        this.InvoiceFetcher.fetch();
    }

    _getInvoiceOrigin(order) {
        return false;
    }

    get selectedPartner() {
        const invoice = this.pos.invoiceManagement.selectedInvoice;
        return invoice ? invoice.get_partner() : null;
    }

    get invoices() {
        let invoices = this.InvoiceFetcher.get()
        this.state.invoices = invoices
        return this.state.invoices;
    }

    async _setNumpadMode(event) {
        const {mode} = event.detail;
        this.numpadMode = mode;
        this.numberBuffer.reset();
    }

    onNextPage() {
        this.InvoiceFetcher.nextPage();
    }

    onPrevPage() {
        this.InvoiceFetcher.prevPage();
    }

    onSearch(domain) {
        this.InvoiceFetcher.setSearchDomain(domain);
        this.InvoiceFetcher.setPage(1);
        this.InvoiceFetcher.fetch();
    }

    async _getInvoice(id) {
        const [move] = await this.orm.read("account.move", [id], ["line_ids", "name", "partner_id", "invoice_date", "journal_id", "payment_reference", "state", "payment_state", "user_id", "amount_untaxed", "amount_tax", "amount_total", "amount_residual",]);
        const move_lines = await this._getMoveLines(move.line_ids);
        move.line_ids = move_lines;
        return move;
    }

    async _getMoveLines(ids) {
        const move_lines = await this.orm.call("account.move.line", "read_converted", [ids]);
        return move_lines;
    }

    async onClickInvoice(clickedMove) {
        this.invoice = clickedMove
        let selection_list = [{
            id: 1, label: _t("Download invoice"), item: 1
        }]
        if (this.pos.config.invoice_register_payment && this.invoice.amount_residual > 0) {
            selection_list.push({
                id: 2, label: _t("Register Payment"), item: 2
            })
        }
        if (this.pos.config.invoice_reset_to_draft && this.invoice.state != "draft") {
            selection_list.push({
                id: 3, label: _t("Reset Invoice to Draft"), item: 3
            })
        }
        if (this.pos.config.invoice_credit_note && this.invoice.state != "draft") {
            selection_list.push({
                id: 4, label: _t("Credit Note"), item: 4
            })
        }
        if (this.pos.config.invoice_confirm && this.invoice.state == "draft") {
            selection_list.push({
                id: 5, label: _t("Confirm and Post Invoice"), item: 5
            })
        }
        const {confirmed, payload: selectedOption} = await this.popup.add(SelectionPopup, {
            title: _t("What do you want to do?"), list: selection_list,
        });
        if (confirmed) {
            if (selectedOption == 1) {
                this._downloadInvoice()
            }
            if (selectedOption == 2) {
                await this._registerPayment()
            }
            if (selectedOption == 3) {
                await this._resetDraft()
            }
            if (selectedOption == 4) {
                await this._makeCreditNote()
            }
            if (selectedOption == 5) {
                await this._confirmAndPost()
            }
        }
    }

    async _downloadInvoice() {
        await this.report.doAction("account.account_invoices", [this.invoice.id,]);
    }

    async _getInvoice(id) {
        const [move] = await this.orm.read("account.move", [id], ["line_ids", "name", "partner_id", "invoice_date", "payment_reference", "state", "payment_state", "user_id", "amount_untaxed", "amount_tax", "amount_total", "amount_residual",]);
        return move;
    }

    async _registerPayment() {
        const invoice = this.invoice
        let journal, method_line = null;
        const journals = []
        let method_lines = []
        this.pos.journals.forEach((j) => journals.push({
            id: j.id, item: j, label: j.name,
        }));
        this.pos.payment_method_lines.forEach((m) => method_lines.push({
            id: m.id, item: m, label: m.name,
        }));
        if (journals.length == 0) {
            return this.popup.add(ErrorPopup, {
                title: _t("Error"), body: _t("Journals not yet Incoming/Outgoing Payment"),
            })
        }
        if (journals) {
            const {confirmed, payload: selected_journal} = await this.popup.add(SelectionPopup, {
                title: _t("Select Journal"), list: journals,
            });
            if (confirmed) {
                journal = selected_journal
            }
        }
        if (method_lines && journal) {
            method_lines = method_lines.filter(ml => journal.inbound_payment_method_line_ids.indexOf(ml.id) != -1)
            if (method_lines.length == 1) {
                method_line = method_lines[0]
            } else {
                const {confirmed, payload: selected_method_line} = await this.popup.add(SelectionPopup, {
                    title: _t("Select Method"), list: method_lines,
                });
                if (confirmed) {
                    method_line = selected_method_line
                }
            }
        }
        if (!journal || !method_line) {
            return this.popup.add(ErrorPopup, {
                title: _t("Error"), body: _t("Journal and Method required choice"),
            })
        } else {
            const {confirmed, payload} = await this.popup.add(NumberPopup, {
                title: _t("Register amount, Customer have Due Amount %s", this.env.utils.formatCurrency(invoice.amount_residual)),
                startingValue: 0,
                nbrDecimal: this.pos.currency.decimal_places,
                isInputSelected: true,
                inputSuffix: this.pos.currency.symbol,
            });

            if (confirmed) {
                let amount = parseFloat(payload)
                if (amount > invoice.amount_residual) {
                    amount = invoice.amount_residual
                }
                const payment_id = await this.orm.call("account.payment", "create", [{
                    "payment_type": "inbound",
                    "payment_method_line_id": method_line.id,
                    "partner_type": "customer",
                    "partner_id": invoice.partner_id ? invoice.partner_id[0] : null,
                    "amount": amount,
                    "journal_id": journal.id,
                    "ref": "Point Of Sale paid: " + amount + _t(" , by:  ") + this.pos.user.name,
                }])
                await this.orm.call("account.payment", "action_post", [payment_id])
                await this.orm.call("account.move", "pos_post_account_move", [[this.invoice.id], payment_id])
                this.InvoiceFetcher.fetch()
            }
        }

    }

    async _resetDraft() {
        await this.orm.call("account.move", "button_draft", [[this.invoice.id]])
        this.InvoiceFetcher.fetch()
    }

    async _makeCreditNote() {
        const {confirmed, payload: reason} = await this.popup.add(TextAreaPopup, {
            startingValue: "", title: _t("Reason of Make Credit Note ?"),
        });
        if (confirmed) {
            const context = {
                "active_model": "account.move", "active_ids": [this.invoice.id]
            }
            const move_reveral_id = await this.orm.call("account.move.reversal", "create", [{
                "journal_id": this.invoice.journal_id[0], "reason": reason
            }], {
                "context": context
            })
            await this.orm.call("account.move.reversal", "refund_moves", [[move_reveral_id]])
            this.InvoiceFetcher.fetch()
        }
    }

    async _confirmAndPost() {
        const {confirmed, payload: response} = await this.popup.add(ConfirmPopup, {
            title: _t("Are you want confirm and post the Invoice: ") + this.invoice.name
        })
        if (confirmed) {
            let action_post = this.orm.call("account.move", "action_post", [this.invoice.id], {})
            this.InvoiceFetcher.fetch()
        }
    }
}

registry.category("pos_screens").add("InvoiceManagementScreen", InvoiceManagementScreen);
