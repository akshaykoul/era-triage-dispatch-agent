import { LightningElement, track, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class EraFaultSelector extends LightningElement {
    @api selectedFault = '';

    @track faultTypes = [
        { label: '🔧 Mechanical', value: 'Mechanical', cssClass: 'fault-tile' },
        { label: '🛞 Flat Tyre', value: 'Flat Tyre', cssClass: 'fault-tile' },
        { label: '⛽ Fuel', value: 'Fuel', cssClass: 'fault-tile' },
        { label: '🔑 Lockout', value: 'Lockout', cssClass: 'fault-tile' },
        { label: '⚡ EV Out of Charge', value: 'EV Out of Charge', cssClass: 'fault-tile' },
        { label: '🔥 Fire', value: 'Fire', cssClass: 'fault-tile' },
        { label: '❓ Other', value: 'Other', cssClass: 'fault-tile' },
    ];

    handleSelect(event) {
        const selected = event.currentTarget.dataset.value;
        this.selectedFault = selected;
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedFault', selected));
        this.dispatchEvent(new CustomEvent('faultselected', { detail: selected, bubbles: true, composed: true }));
    }
}
