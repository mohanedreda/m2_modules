/** @odoo-module */

import { useAutofocus, useService } from "@web/core/utils/hooks";
import { Component, useState } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";

// NOTE: These are constants so that they are only instantiated once
// and they can be used efficiently by the invoiceManagementControlPanel.
const VALID_SEARCH_TAGS = new Set(["date", "customer", "client", "name", "order"]);
const FIELD_MAP = {
    date: "invoice_date",
    customer: "partner_id.complete_name",
    client: "partner_id.complete_name",
    name: "name",
    order: "name",
};
const SEARCH_FIELDS = ["name", "partner_id.complete_name", "invoice_date"];

/**
 * @emits search
 */
export class InvoiceManagementControlPanel extends Component {
    static template = "pos_retail.InvoiceManagementControlPanel";

    setup() {
        this.pos = usePos();
        this.ui = useState(useService("ui"));
        this.InvoiceFetcher = useService("invoice_fetcher");
        useAutofocus();

        const currentPartner = this.pos.get_order().get_partner();
        if (currentPartner) {
            this.pos.invoiceManagement.searchString = currentPartner.name;
        }
        this.InvoiceFetcher.setSearchDomain(this._computeDomain());
    }
    onInputKeydown(event) {
        if (event.key === "Enter") {
            this.props.onSearch(this._computeDomain());
        }
    }
    get showPageControls() {
        return this.InvoiceFetcher.lastPage > 1;
    }
    get pageNumber() {
        const currentPage = this.InvoiceFetcher.currentPage;
        const lastPage = this.InvoiceFetcher.lastPage;
        return isNaN(lastPage) ? "" : `(${currentPage}/${lastPage})`;
    }
    get validSearchTags() {
        return VALID_SEARCH_TAGS;
    }
    get fieldMap() {
        return FIELD_MAP;
    }
    get searchFields() {
        return SEARCH_FIELDS;
    }
    /**
     * E.g. 1
     * ```
     *   searchString = 'Customer 1'
     *   result = [
     *      '|',
     *      '|',
     *      ['pos_reference', 'ilike', '%Customer 1%'],
     *      ['partner_id.complete_name', 'ilike', '%Customer 1%'],
     *      ['invoice_date', 'ilike', '%Customer 1%']
     *   ]
     * ```
     *
     * E.g. 2
     * ```
     *   searchString = 'date: 2020-05'
     *   result = [
     *      ['invoice_date', 'ilike', '%2020-05%']
     *   ]
     * ```
     *
     * E.g. 3
     * ```
     *   searchString = 'customer: Steward, date: 2020-05-01'
     *   result = [
     *      ['partner_id.complete_name', 'ilike', '%Steward%'],
     *      ['invoice_date', 'ilike', '%2020-05-01%']
     *   ]
     * ```
     */
    _computeDomain() {
        let domain = [
            ["state", "!=", "cancel"],
        ];
        const input = this.pos.invoiceManagement.searchString.trim();
        if (!input) {
            return domain;
        }

        const searchConditions = this.pos.invoiceManagement.searchString.split(/[,&]\s*/);
        if (searchConditions.length === 1) {
            const cond = searchConditions[0].split(/:\s*/);
            if (cond.length === 1) {
                domain = domain.concat(Array(this.searchFields.length - 1).fill("|"));
                domain = domain.concat(
                    this.searchFields.map((field) => [field, "ilike", `%${cond[0]}%`])
                );
                return domain;
            }
        }

        for (const cond of searchConditions) {
            const [tag, value] = cond.split(/:\s*/);
            if (!this.validSearchTags.has(tag)) {
                continue;
            }
            domain.push([this.fieldMap[tag], "ilike", `%${value}%`]);
        }
        return domain;
    }
    clearSearch() {
        this.pos.invoiceManagement.searchString = "";
        this.onInputKeydown({ key: "Enter" });
    }
}
