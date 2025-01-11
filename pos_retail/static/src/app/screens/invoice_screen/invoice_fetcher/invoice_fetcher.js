/** @odoo-module */

import { registry } from "@web/core/registry";
import { EventBus } from "@odoo/owl";

class InvoiceFetcher extends EventBus {
    static serviceDependencies = ["orm", "pos"];
    constructor({ orm, pos }) {
        super();
        this.currentPage = 1;
        this.ordersToShow = [];
        this.totalCount = 0;
        this.orm = orm;
        this.pos = pos;
    }

    /**
     * for nPerPage = 10
     * +--------+----------+
     * | nItems | lastPage |
     * +--------+----------+
     * |     2  |       1  |
     * |    10  |       1  |
     * |    11  |       2  |
     * |    30  |       3  |
     * |    35  |       4  |
     * +--------+----------+
     */
    get lastPage() {
        const nItems = this.totalCount;
        return Math.trunc(nItems / (this.nPerPage + 1)) + 1;
    }
    /**
     * Calling this methods populates the `ordersToShow` then trigger `update` event.
     * @related get
     *
     * NOTE: This is tightly-coupled with pagination. So if the current page contains all
     * active orders, it will not fetch anything from the server but only sets `ordersToShow`
     * to the active orders that fits the current page.
     */
    async fetch() {
        // Show orders from the backend.
        const offset = this.nPerPage + (this.currentPage - 1 - 1) * this.nPerPage;
        const limit = this.nPerPage;
        this.ordersToShow = await this._fetch(limit, offset);

        this.trigger("update");
    }
    /**
     * This returns the orders from the backend that needs to be shown.
     * If the order is already in cache, the full information about that
     * order is not fetched anymore, instead, we use info from cache.
     *
     * @param {number} limit
     * @param {number} offset
     */
    async _fetch(limit, offset) {
        const invoices = await this._getInvoiceIdsForCurrentPage(limit, offset);
        this.totalCount = invoices.length;
        return invoices;
    }

    async _getInvoiceIdsForCurrentPage(limit, offset) {
        const domain = [
            ["company_id", "=", this.pos.company.id],
            ["move_type", "in", ["out_invoice", "out_refund"]],
            ["state", "!=", "cancel"]
        ].concat(
            this.searchDomain || []
        );

        this.pos.set_synch("connecting");
        const Invoices = await this.orm.searchRead(
            "account.move",
            domain,
            [
                "name",
                "partner_id",
                "journal_id",
                "invoice_date",
                "payment_reference",
                "state",
                "payment_state",
                "user_id",
                "amount_untaxed",
                "amount_tax",
                "amount_total",
                "amount_residual",
            ],
            { offset, limit }
        );

        this.pos.set_synch("connected");
        return Invoices;
    }

    nextPage() {
        if (this.currentPage < this.lastPage) {
            this.currentPage += 1;
            this.fetch();
        }
    }
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.fetch();
        }
    }
    /**
     * @param {integer|undefined} id id of the cached order
     * @returns {Array<models.Order>}
     */
    get(id) {
        return this.ordersToShow;
    }
    setSearchDomain(searchDomain) {
        this.searchDomain = searchDomain;
    }
    setNPerPage(val) {
        this.nPerPage = val;
    }
    setPage(page) {
        this.currentPage = page;
    }
}

export const InvoiceFetcherService = {
    dependencies: InvoiceFetcher.serviceDependencies,
    start(env, deps) {
        return new InvoiceFetcher(deps);
    },
};

registry.category("services").add("invoice_fetcher", InvoiceFetcherService);
